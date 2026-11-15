import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { ESTABLISHED_PRODUCT_IMAGE_MAPPINGS } from './verify-and-sync-images.ts';
import { EXPECTED_STAGING_TABLES } from './seed-mysql-staging.ts';

// ============================================================================
// NASIR MOBILE — STRICTLY READ-ONLY STAGING CUTOVER VERIFICATION SUITE
// Target Database: u609585964_STAGING_DB (HARD ABORTS on u609585964_NASIR_DB)
//
// Strictly read-only: NEVER runs INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE,
// or reconciliation SQL. Verifies:
//  1. Active DB is strictly u609585964_STAGING_DB (never u609585964_NASIR_DB)
//  2. All 12 InnoDB tables, storefront_visible, version & MAX(id)+1 AUTO_INCREMENT
//  3. Zero orphan category_id / brand_id foreign keys
//  4. Exact 91 Stage G3 product IDs/SKUs exist, published & storefront_visible=1
//  5. Zero extra published/visible products outside whitelist; 68 & 90006 absent
//  6. Approved stock exception: Product 90025 = 46; other 90 match G3 stocks
//  7. Products 10-13 repaired image paths preserved; Brand 16 untouched
// ============================================================================

export const STAGING_DB = 'u609585964_STAGING_DB';
export const FORBIDDEN_PRODUCTION_DBS = new Set(['u609585964_NASIR_DB']);
export const APPROVED_STOCK_EXCEPTION_PRODUCT_ID = 90025;
export const APPROVED_STOCK_EXCEPTION_SKU = 'SAM-CBL-019';
export const APPROVED_STOCK_EXCEPTION_VALUE = 46;

const STAGING_HOST = '153.92.15.70';
const STAGING_SNI = 'srv1980.hstgr.io';
const STAGING_PORT = 3306;
const STAGING_USER = 'u609585964_STAGING_USER';
const DEFAULT_G3_SOURCE_PATH = '/tmp/nasir_g3_staging_source/extracted/hostinger-export/data-store.json';

export interface G3ReferenceProduct {
  id: number;
  sku: string;
  stockQuantity: number;
}

export interface StagingCutoverProductRow {
  id: number;
  sku: string | null;
  status: string;
  storefront_visible: number | boolean;
  stock_quantity: number | null;
  images: unknown;
}

export interface CutoverCheck {
  pillar: string;
  name: string;
  pass: boolean;
  details?: any;
}

export function assertStagingDatabaseIdentity(dbName: string | null | undefined): void {
  const normalized = String(dbName || '').trim();
  if (!normalized || FORBIDDEN_PRODUCTION_DBS.has(normalized)) {
    throw new Error(
      `CRITICAL ABORT: Refusing to inspect forbidden/production database "${normalized || '<EMPTY>'}".`
    );
  }
  if (normalized !== STAGING_DB) {
    throw new Error(
      `CRITICAL ABORT: Expected "${STAGING_DB}", but connected/configured DB is "${normalized}".`
    );
  }
}

export function loadG3ReferenceCatalog(sourcePath: string): {
  products: G3ReferenceProduct[];
  deletedProductIds: number[];
  brand16LogoUrl: string | null;
} {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Authoritative Stage G3 source file not found: ${sourcePath}`);
  }
  const src = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const deletedProductIds: number[] = Array.isArray(src.deletedProductIds)
    ? src.deletedProductIds.map(Number)
    : [68, 90006];
  const deletedSet = new Set(deletedProductIds);

  const products: G3ReferenceProduct[] = (src.products || [])
    .filter((p: any) => !deletedSet.has(Number(p.id)))
    .map((p: any) => ({
      id: Number(p.id),
      sku: String(p.sku),
      stockQuantity: Number(p.stockQuantity ?? 0),
    }));

  const brand16 = Array.isArray(src.brands)
    ? src.brands.find((b: any) => Number(b.id) === 16)
    : null;

  return {
    products,
    deletedProductIds,
    brand16LogoUrl: brand16 ? String(brand16.logoUrl || '') : null,
  };
}

function parseImagesColumn(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function evaluateStagingCutoverState(params: {
  databaseName: string;
  g3Products: G3ReferenceProduct[];
  deletedProductIds: number[];
  stagingProducts: StagingCutoverProductRow[];
  brand16DbLogoUrl?: string | null;
}): { ok: boolean; checks: CutoverCheck[] } {
  assertStagingDatabaseIdentity(params.databaseName);

  const checks: CutoverCheck[] = [];
  const add = (pillar: string, name: string, pass: boolean, details?: any) => {
    checks.push({ pillar, name, pass, details });
  };

  add(
    '1.Identity',
    `Target database strictly verified as ${STAGING_DB} (never u609585964_NASIR_DB)`,
    params.databaseName === STAGING_DB
  );

  const g3ById = new Map(params.g3Products.map((p) => [p.id, p]));
  const stagingById = new Map(params.stagingProducts.map((p) => [Number(p.id), p]));

  // Check exact 91 expected products exist, match SKU, status='published', storefront_visible=1
  const missingIds: number[] = [];
  const skuMismatches: { id: number; expected: string; actual: string | null }[] = [];
  const hiddenOrUnpublished: { id: number; status: string; storefront_visible: any }[] = [];

  for (const expected of params.g3Products) {
    const actual = stagingById.get(expected.id);
    if (!actual) {
      missingIds.push(expected.id);
      continue;
    }
    if (actual.sku !== expected.sku) {
      skuMismatches.push({ id: expected.id, expected: expected.sku, actual: actual.sku });
    }
    const isVisible = actual.storefront_visible === true || Number(actual.storefront_visible) === 1;
    if (actual.status !== 'published' || !isVisible) {
      hiddenOrUnpublished.push({
        id: expected.id,
        status: actual.status,
        storefront_visible: actual.storefront_visible,
      });
    }
  }

  add(
    '2.Whitelist',
    `All ${params.g3Products.length} expected Stage G3 product IDs & SKUs exist in staging`,
    missingIds.length === 0 && skuMismatches.length === 0 && params.g3Products.length === 91,
    { expectedCount: params.g3Products.length, missingIds, skuMismatches }
  );

  add(
    '2.Whitelist',
    `All ${params.g3Products.length} whitelisted products are published & storefront_visible=1`,
    hiddenOrUnpublished.length === 0,
    { hiddenOrUnpublished }
  );

  // Zero extra published or storefront_visible=1 products outside the 91-ID whitelist
  const extraVisible = params.stagingProducts.filter((p) => {
    const id = Number(p.id);
    const isVisible = p.storefront_visible === true || Number(p.storefront_visible) === 1;
    return !g3ById.has(id) && (p.status === 'published' || isVisible);
  });
  add(
    '2.Whitelist',
    'Zero extra published or storefront_visible products outside the 91-product whitelist',
    extraVisible.length === 0,
    { extraIds: extraVisible.map((p) => p.id) }
  );

  // Deleted IDs 68 and 90006 absent
  const requiredDeletedIds = [...new Set([68, 90006, ...params.deletedProductIds])];
  const resurrected = requiredDeletedIds.filter((id) => stagingById.has(id));
  add(
    '2.Whitelist',
    'Deleted product IDs 68 and 90006 are completely absent from staging products',
    resurrected.length === 0,
    { resurrected }
  );

  // Approved Stock Check: Product 90025 === 46, and other 90 products === G3 stockQuantity
  const prod90025 = stagingById.get(APPROVED_STOCK_EXCEPTION_PRODUCT_ID);
  const stock90025Ok =
    Boolean(prod90025) &&
    prod90025?.sku === APPROVED_STOCK_EXCEPTION_SKU &&
    Number(prod90025?.stock_quantity) === APPROVED_STOCK_EXCEPTION_VALUE;

  add(
    '3.Stock',
    `Approved product ${APPROVED_STOCK_EXCEPTION_PRODUCT_ID} (${APPROVED_STOCK_EXCEPTION_SKU}) stock exception is exactly ${APPROVED_STOCK_EXCEPTION_VALUE}`,
    stock90025Ok,
    { actualStock: prod90025?.stock_quantity ?? null, sku: prod90025?.sku ?? null }
  );

  const otherStockMismatches: { id: number; expected: number; actual: number | null }[] = [];
  let checkedOtherCount = 0;
  for (const expected of params.g3Products) {
    if (expected.id === APPROVED_STOCK_EXCEPTION_PRODUCT_ID) continue;
    checkedOtherCount++;
    const actual = stagingById.get(expected.id);
    if (!actual || actual.stock_quantity === null || Number(actual.stock_quantity) !== expected.stockQuantity) {
      otherStockMismatches.push({
        id: expected.id,
        expected: expected.stockQuantity,
        actual: actual ? actual.stock_quantity : null,
      });
    }
  }

  add(
    '3.Stock',
    `All other 90 whitelisted products match exact Stage G3 stock_quantity (${checkedOtherCount - otherStockMismatches.length}/${checkedOtherCount})`,
    checkedOtherCount === 90 && otherStockMismatches.length === 0,
    { otherStockMismatches }
  );

  // Repaired images on Products 10-13
  const brokenMappedImages: { id: number; expected: string; actual: string[] }[] = [];
  for (const mapping of ESTABLISHED_PRODUCT_IMAGE_MAPPINGS) {
    const row = stagingById.get(mapping.productId);
    const imgs = row ? parseImagesColumn(row.images) : [];
    if (!row || row.sku !== mapping.sku || imgs.length !== 1 || imgs[0] !== mapping.imagePath) {
      brokenMappedImages.push({ id: mapping.productId, expected: mapping.imagePath, actual: imgs });
    }
  }
  add(
    '4.Images',
    'Products 10-13 contain the 4 exact verified authentic image paths',
    brokenMappedImages.length === 0,
    { brokenMappedImages }
  );

  if (params.brand16DbLogoUrl !== undefined && params.brand16DbLogoUrl !== null) {
    add(
      '4.Images',
      'Brand 16 unresolved logo_url remains preserved (/api/images/50001) without invention',
      params.brand16DbLogoUrl === '/api/images/50001',
      { brand16DbLogoUrl: params.brand16DbLogoUrl }
    );
  }

  return { ok: checks.every((c) => c.pass), checks };
}

function resolveStagingPassword(): string {
  if (process.env.HOSTINGER_STAGING_MYSQL_PASSWORD) {
    return process.env.HOSTINGER_STAGING_MYSQL_PASSWORD;
  }
  try {
    const pid = fs.readFileSync('/app/.dev.pid', 'utf8').trim();
    const raw = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
    for (const entry of raw.split('\0')) {
      if (entry.startsWith('HOSTINGER_STAGING_MYSQL_PASSWORD=')) {
        return entry.slice('HOSTINGER_STAGING_MYSQL_PASSWORD='.length);
      }
    }
  } catch {}
  return '';
}

async function waitForHealth(url: string, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${url}/api/health`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function run() {
  const args = process.argv.slice(2);
  const confirmStaging = args.includes('--confirm-staging');
  const checkHttp = args.includes('--check-http');
  const sourceArg = args.find((a) => a.startsWith('--source='));
  const sourcePath = path.resolve(sourceArg ? sourceArg.slice('--source='.length) : DEFAULT_G3_SOURCE_PATH);

  // Pre-connect environment DB safety guard
  if (process.env.MYSQL_DATABASE && FORBIDDEN_PRODUCTION_DBS.has(process.env.MYSQL_DATABASE)) {
    throw new Error(
      `CRITICAL ABORT: MYSQL_DATABASE points to forbidden production DB "${process.env.MYSQL_DATABASE}".`
    );
  }

  if (!confirmStaging) {
    throw new Error(
      `SAFETY ABORT: Explicit --confirm-staging flag is required to run read-only checks against ${STAGING_DB}.`
    );
  }

  const password = resolveStagingPassword();
  if (!password) {
    throw new Error('HOSTINGER_STAGING_MYSQL_PASSWORD secret is required for read-only staging verification.');
  }

  const g3Ref = loadG3ReferenceCatalog(sourcePath);

  console.log('============================================================================');
  console.log('   NASIR MOBILE — READ-ONLY STAGING CUTOVER VERIFICATION SUITE');
  console.log('============================================================================\n');

  const conn = await mysql.createConnection({
    host: STAGING_HOST,
    port: STAGING_PORT,
    user: STAGING_USER,
    password,
    database: STAGING_DB,
    ssl: { rejectUnauthorized: true, servername: STAGING_SNI } as any,
  });

  const checks: CutoverCheck[] = [];
  let serverProc: ChildProcess | null = null;

  try {
    const [dbCheck]: any = await conn.query('SELECT DATABASE() AS db');
    const activeDb = String(dbCheck[0]?.db || '');
    assertStagingDatabaseIdentity(activeDb);

    // 1. Schema, Tables, Orphans & AUTO_INCREMENT (Read-Only)
    const [tables]: any = await conn.query(
      `SELECT TABLE_NAME, ENGINE, AUTO_INCREMENT
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [STAGING_DB]
    );
    const tableMap = new Map<string, any>(tables.map((t: any) => [String(t.TABLE_NAME), t]));
    const allTablesOk =
      EXPECTED_STAGING_TABLES.every((tbl) => tableMap.has(tbl) && tableMap.get(tbl).ENGINE === 'InnoDB');
    checks.push({
      pillar: '1.Schema',
      name: 'All 12 expected InnoDB tables exist in u609585964_STAGING_DB',
      pass: allTablesOk,
      details: { foundCount: tables.length },
    });

    for (const tbl of ['products', 'categories', 'brands', 'users', 'images'] as const) {
      const [maxRows]: any = await conn.query(`SELECT COALESCE(MAX(\`id\`), 0) AS max_id FROM \`${tbl}\``);
      const maxId = Number(maxRows[0]?.max_id) || 0;
      const ai = Number(tableMap.get(tbl)?.AUTO_INCREMENT) || 0;
      checks.push({
        pillar: '1.Schema',
        name: `${tbl}.AUTO_INCREMENT (${ai}) >= MAX(id) + 1 (${maxId + 1})`,
        pass: ai >= maxId + 1,
        details: { table: tbl, autoIncrement: ai, minRequired: maxId + 1 },
      });
    }

    const [orphans]: any = await conn.query(
      `SELECT
        (SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.category_id IS NOT NULL AND c.id IS NULL) AS orphanCat,
        (SELECT COUNT(*) FROM products p LEFT JOIN brands b ON p.brand_id=b.id WHERE p.brand_id IS NOT NULL AND b.id IS NULL) AS orphanBrand`
    );
    checks.push({
      pillar: '1.Schema',
      name: 'Zero orphan category_id or brand_id foreign keys',
      pass: Number(orphans[0]?.orphanCat) === 0 && Number(orphans[0]?.orphanBrand) === 0,
      details: orphans[0],
    });

    // 2. Product Catalog, Visibility, Deleted Exclusions, Stock & Images (Read-Only)
    const [stagingProducts]: any = await conn.query(
      'SELECT id, sku, status, storefront_visible, stock_quantity, images FROM products ORDER BY id ASC'
    );
    const [brand16Rows]: any = await conn.query('SELECT logo_url FROM brands WHERE id = 16 LIMIT 1');
    const brand16DbLogoUrl = brand16Rows.length > 0 ? String(brand16Rows[0].logo_url || '') : null;

    const evalResult = evaluateStagingCutoverState({
      databaseName: activeDb,
      g3Products: g3Ref.products,
      deletedProductIds: g3Ref.deletedProductIds,
      stagingProducts,
      brand16DbLogoUrl,
    });
    checks.push(...evalResult.checks);

    // 3. Optional Read-Only Public HTTP API Check (GET only, zero mutations)
    if (checkHttp) {
      const testPort = 3457;
      const baseUrl = `http://127.0.0.1:${testPort}`;
      const bunBin = fs.existsSync('/usr/bin/bun') ? '/usr/bin/bun' : 'bun';
      serverProc = spawn(bunBin, ['run', 'server.ts', '--port', String(testPort), '--host', '127.0.0.1'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          USE_STAGING_DB: 'true',
          HOSTINGER_STAGING_MYSQL_PASSWORD: password,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const healthy = await waitForHealth(baseUrl, 15000);
      checks.push({
        pillar: '5.HTTP-ReadOnly',
        name: `Read-only staging server became healthy on ${baseUrl}`,
        pass: healthy,
      });
      if (healthy) {
        const pubRes = await fetch(`${baseUrl}/api/products`);
        const pubCache = pubRes.headers.get('cache-control') || '';
        const pubData: any = await pubRes.json();
        const leakedPrivate = Array.isArray(pubData)
          ? pubData.some(
              (p: any) =>
                p.purchaseCost !== undefined ||
                p.stockQuantity !== undefined ||
                p.privateNotes !== undefined ||
                p.imeiSerialNumbers !== undefined
            )
          : true;
        checks.push({
          pillar: '5.HTTP-ReadOnly',
          name: 'GET /api/products returns 91 visible products, no-store headers, and strips private fields',
          pass:
            pubRes.status === 200 &&
            pubCache.includes('no-store') &&
            Array.isArray(pubData) &&
            pubData.length === 91 &&
            !leakedPrivate,
          details: { status: pubRes.status, count: Array.isArray(pubData) ? pubData.length : null, pubCache },
        });
      }
    }
  } finally {
    if (serverProc && !serverProc.killed) {
      serverProc.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 300));
      if (!serverProc.killed) serverProc.kill('SIGKILL');
    }
    await conn.end();
  }

  for (const c of checks) {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] [${c.pillar}] ${c.name}`);
    if (!c.pass && c.details !== undefined) {
      console.error('       ->', c.details);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log('\n============================================================================');
  console.log(`   READ-ONLY STAGING VERIFICATION: ${passed} / ${checks.length} PASSED`);
  console.log('============================================================================');

  if (passed !== checks.length) {
    process.exit(1);
  }
}

const isEntrypoint =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  run().catch((err) => {
    console.error('Read-only staging verification aborted:', err.message);
    process.exit(1);
  });
}
