import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// ============================================================================
// NASIR MOBILE — HOSTINGER MYSQL SEED & MIGRATION RUNNER (STAGE G2)
// Strict 3-Phase Insert-Only Transactional Seeding Engine
// Zero DROP, Zero TRUNCATE, Zero REPLACE, Zero FOREIGN_KEY_CHECKS=0
//
// Features:
// - Authoritative --source=<path-to-hostinger-data-store.json> ingestion
//   supporting live 91+ products, categories, brands, services & deletedProductIds
// - Guarded against mistaking the 70-product partial baseline for live data
//   (requires --source=... unless --allow-partial-baseline is explicitly passed)
// - Dynamic AUTO_INCREMENT calculation via MAX(id) + 1 (zero fixed 90006)
// - Production database guard (strictly targets u609585964_STAGING_DB only)
// - Image file transfer/verification decoupled into verify-and-sync-images.ts
// ============================================================================

export const EXPECTED_STAGING_TABLES = [
  'users',
  'categories',
  'brands',
  'products',
  'images',
  'whatsapp_settings',
  'site_content',
  'audit_logs',
  'visitor_settings',
  'visitor_daily_stats',
  'visitor_logs',
  'security_settings',
] as const;

const STAGING_HOST = '153.92.15.70';
const STAGING_SNI = 'srv1980.hstgr.io';
const STAGING_PORT = 3306;
const STAGING_USER = 'u609585964_STAGING_USER';
const STAGING_DB = 'u609585964_STAGING_DB';
const FORBIDDEN_PRODUCTION_DBS = new Set(['u609585964_NASIR_DB', 'postgres', 'postgresql']);

// Verified authentic Product 10-13 image repairs proven via backups/media-manifest.json
// and database backup images rows 9-12. Brand 16 (/api/images/50001) and legacy
// placeholder products (69, 90001-90005) have no replacement and are never invented.
export const VERIFIED_PRODUCT_IMAGE_REPAIRS: Record<number, { sku: string; imagePath: string }> = {
  10: { sku: 'ARCHER-AIR-E5', imagePath: '/uploads/001_Archer_Air_E5.png' },
  11: { sku: 'TP-ARCHER-AX73-1793174564980', imagePath: '/uploads/product_1793635239738_ifcjt9p.jpg' },
  12: { sku: 'TP-ARCHER-AX55-1793173174137', imagePath: '/uploads/product_1793635281198_a4y75pm.jpg' },
  13: { sku: 'ARCHER-AIR-E5-EXT', imagePath: '/uploads/product_1793635330270_jqs584m.jpg' },
};

export interface CategoryRow {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  icon?: string;
  displayOrder?: number;
}

export interface BrandRow {
  id: number;
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface ServiceMetadataRow {
  id: number;
  slug?: string;
  titleEn?: string;
  titleAr?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface ProductRow {
  id: number;
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  condition?: string;
  categoryId?: number | null;
  brandId?: number | null;
  isFeatured?: boolean | number;
  isNewArrival?: boolean | number;
  status?: string;
  storefrontVisible?: boolean | number;
  version?: number;
  specifications?: any[];
  variants?: any[];
  images?: any[];
  privateNotes?: string;
  purchaseCost?: string;
  stockQuantity?: number;
  imeiSerialNumbers?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRow {
  id: number;
  uid: string;
  email: string;
  role: string;
  password_hash: string;
  created_at?: string;
}

export interface WhatsAppSettingsRow {
  id: number;
  primary_number: string;
  secondary_number: string;
  active_number: string;
  is_enabled: boolean | number;
  template_en: string;
  template_ar: string;
}

export interface SiteContentRow {
  id: number;
  hero_title_en: string;
  hero_title_ar: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  announcement_en?: string;
  announcement_ar?: string;
  announcement_active: boolean | number;
  about_en: string;
  about_ar: string;
  contact_address_en: string;
  contact_address_ar: string;
  contact_email: string;
  opening_hours_en: string;
  opening_hours_ar: string;
}

export interface VisitorSettingsRow {
  id: number;
  is_enabled: boolean | number;
  display_mode: string;
  today_adjustment: number;
  total_adjustment: number;
}

export interface SecuritySettingsRow {
  id: number;
  master_key: string;
}

export interface ImageRow {
  id: number;
  file_name: string;
  mime_type: string;
  data: string;
}

export interface LoadedSeedDataset {
  sourceMode: 'authoritative-external' | 'partial-historical-baseline';
  sourceFilePath: string;
  categories: CategoryRow[];
  brands: BrandRow[];
  products: ProductRow[];
  services: ServiceMetadataRow[];
  deletedProductIds: number[];
  users: UserRow[];
  whatsappSettings: WhatsAppSettingsRow[];
  siteContent: SiteContentRow[];
  visitorSettings: VisitorSettingsRow[];
  securitySettings: SecuritySettingsRow[];
  images: ImageRow[];
  maxProductId: number;
  nextProductAutoIncrement: number;
  nextCategoryAutoIncrement: number;
  nextBrandAutoIncrement: number;
  nextUserAutoIncrement: number;
  nextImageAutoIncrement: number;
}

export function resolvePassword(): string {
  if (process.env.HOSTINGER_STAGING_MYSQL_PASSWORD) {
    return process.env.HOSTINGER_STAGING_MYSQL_PASSWORD;
  }
  try {
    const pid = fs.readFileSync('/app/.dev.pid', 'utf8').trim();
    const raw = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
    const entries = raw.split('\0');
    for (const entry of entries) {
      if (entry.startsWith('HOSTINGER_STAGING_MYSQL_PASSWORD=')) {
        return entry.slice('HOSTINGER_STAGING_MYSQL_PASSWORD='.length);
      }
    }
  } catch {}
  return '';
}

function toMysqlTimestampString(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  if (year < 1971 || year > 2037) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function normalizeImageList(rawImages: any): string[] {
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .map((img: any) => {
      if (typeof img === 'string') return img.trim();
      if (img && typeof img === 'object') return String(img.url || img.src || '').trim();
      return '';
    })
    .filter(Boolean);
}

function computeNextAutoIncrement(rows: { id: number }[]): number {
  let maxId = 0;
  for (const r of rows) {
    const id = Number(r.id);
    if (Number.isFinite(id) && id > maxId) {
      maxId = id;
    }
  }
  return maxId + 1;
}

export interface SeedLoadOptions {
  storefrontVisibleAll?: boolean;
}

export function loadAndValidateSeedDataset(
  reconciledPath: string,
  backupPath: string,
  externalSourcePath?: string,
  options: SeedLoadOptions = {}
): LoadedSeedDataset {
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  let categories: CategoryRow[] = [];
  let brands: BrandRow[] = [];
  let products: ProductRow[] = [];
  let services: ServiceMetadataRow[] = [];
  let deletedProductIds: number[] = [];

  let users: UserRow[] = backup.users || [];
  let whatsappSettings: WhatsAppSettingsRow[] = backup.whatsapp_settings || [];
  let siteContent: SiteContentRow[] = backup.site_content || [];
  let visitorSettings: VisitorSettingsRow[] = backup.visitor_settings || [];
  let securitySettings: SecuritySettingsRow[] = backup.security_settings || [];
  let images: ImageRow[] = backup.images || [];

  let sourceMode: 'authoritative-external' | 'partial-historical-baseline' = 'partial-historical-baseline';
  let sourceFilePath = reconciledPath;

  if (externalSourcePath) {
    const resolvedSource = path.resolve(externalSourcePath);
    if (!fs.existsSync(resolvedSource)) {
      throw new Error(`Authoritative --source file not found: ${resolvedSource}`);
    }
    const ext = JSON.parse(fs.readFileSync(resolvedSource, 'utf8'));
    if (!Array.isArray(ext.products) || !Array.isArray(ext.categories) || !Array.isArray(ext.brands)) {
      throw new Error(
        `Invalid authoritative source JSON (${resolvedSource}): expected arrays for "products", "categories", and "brands".`
      );
    }

    sourceMode = 'authoritative-external';
    sourceFilePath = resolvedSource;

    // Optional reconciled baseline lookup ONLY to preserve historical purchaseCost if undefined in source
    const reconciled = fs.existsSync(reconciledPath)
      ? JSON.parse(fs.readFileSync(reconciledPath, 'utf8'))
      : { products: [] };
    const reconciledBySku = new Map<string, ProductRow>();
    for (const rp of reconciled.products || []) {
      if (rp?.sku) reconciledBySku.set(String(rp.sku).trim().toUpperCase(), rp);
    }

    deletedProductIds = Array.isArray(ext.deletedProductIds)
      ? Array.from(
          new Set(
            ext.deletedProductIds
              .map((id: any) => Number(id))
              .filter((id: number) => Number.isInteger(id) && id > 0)
          )
        )
      : [];
    const deletedSet = new Set<number>(deletedProductIds);

    services = Array.isArray(ext.services) ? ext.services : [];
    for (const svc of services) {
      if (!svc || (svc.id === undefined && !svc.slug)) {
        throw new Error(`Invalid service metadata entry in authoritative source: ${JSON.stringify(svc)}`);
      }
    }

    categories = ext.categories;
    brands = ext.brands;
    products = ext.products
      .filter((p: ProductRow) => {
        const pid = Number(p.id);
        if (deletedSet.has(pid)) {
          console.warn(
            `[SOURCE RECONCILIATION] Excluding product ID ${pid} (${p.sku}) because it is present in deletedProductIds.`
          );
          return false;
        }
        return true;
      })
      .map((p: ProductRow) => {
        const pid = Number(p.id);
        const normSku = String(p.sku || '').trim().toUpperCase();
        const fallbackHist = reconciledBySku.get(normSku);
        let imagesList = normalizeImageList(p.images);
        const verifiedRepair = VERIFIED_PRODUCT_IMAGE_REPAIRS[pid];
        if (
          verifiedRepair &&
          normSku === verifiedRepair.sku &&
          (imagesList.length === 0 ||
            imagesList.every((img) => img === '/api/images/50001'))
        ) {
          imagesList = [verifiedRepair.imagePath];
        }
        const resolvedVisible = options.storefrontVisibleAll
          ? true
          : p.storefrontVisible !== undefined
            ? Boolean(p.storefrontVisible)
            : false;
        return {
          ...p,
          images: imagesList,
          specifications: Array.isArray(p.specifications) ? p.specifications : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          imeiSerialNumbers: Array.isArray(p.imeiSerialNumbers) ? p.imeiSerialNumbers : [],
          privateNotes:
            p.privateNotes !== undefined ? p.privateNotes : fallbackHist?.privateNotes || '',
          purchaseCost:
            p.purchaseCost !== undefined ? p.purchaseCost : fallbackHist?.purchaseCost || '',
          stockQuantity:
            p.stockQuantity !== undefined ? Number(p.stockQuantity) : Number(fallbackHist?.stockQuantity ?? 0),
          status: p.status || 'published',
          storefrontVisible: resolvedVisible,
          version: Number(p.version) || 1,
        };
      });

    // Optional settings/users/images sections if bundled inside export
    if (Array.isArray(ext.images) && ext.images.length > 0) images = ext.images;
    if (Array.isArray(ext.users) && ext.users.length > 0) users = ext.users;
    if (Array.isArray(ext.whatsapp_settings) && ext.whatsapp_settings.length > 0) whatsappSettings = ext.whatsapp_settings;
    if (Array.isArray(ext.whatsappSettings) && ext.whatsappSettings.length > 0) whatsappSettings = ext.whatsappSettings;
    if (Array.isArray(ext.site_content) && ext.site_content.length > 0) siteContent = ext.site_content;
    if (Array.isArray(ext.siteContent) && ext.siteContent.length > 0) siteContent = ext.siteContent;
    if (Array.isArray(ext.visitor_settings) && ext.visitor_settings.length > 0) visitorSettings = ext.visitor_settings;
    if (Array.isArray(ext.visitorSettings) && ext.visitorSettings.length > 0) visitorSettings = ext.visitorSettings;
    if (Array.isArray(ext.security_settings) && ext.security_settings.length > 0) securitySettings = ext.security_settings;
    if (Array.isArray(ext.securitySettings) && ext.securitySettings.length > 0) securitySettings = ext.securitySettings;
  } else {
    const reconciled = JSON.parse(fs.readFileSync(reconciledPath, 'utf8'));
    categories = reconciled.categories || [];
    brands = reconciled.brands || [];
    products = (reconciled.products || []).map((p: ProductRow) => ({
      ...p,
      images: normalizeImageList(p.images),
      storefrontVisible: p.storefrontVisible !== undefined ? Boolean(p.storefrontVisible) : false,
      version: Number(p.version) || 1,
    }));
  }

  // Strict Integrity Validation: zero duplicate PKs, SKUs, or slugs, and valid FKs
  const catIds = new Set<number>();
  const catSlugs = new Set<string>();
  for (const c of categories) {
    const id = Number(c.id);
    if (!Number.isInteger(id) || id <= 0 || !c.slug) {
      throw new Error(`Invalid category record: ${JSON.stringify(c)}`);
    }
    if (catIds.has(id)) throw new Error(`Duplicate category ID detected: ${id}`);
    if (catSlugs.has(c.slug)) throw new Error(`Duplicate category slug detected: ${c.slug}`);
    catIds.add(id);
    catSlugs.add(c.slug);
  }

  const brandIds = new Set<number>();
  const brandSlugs = new Set<string>();
  for (const b of brands) {
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0 || !b.slug) {
      throw new Error(`Invalid brand record: ${JSON.stringify(b)}`);
    }
    if (brandIds.has(id)) throw new Error(`Duplicate brand ID detected: ${id}`);
    if (brandSlugs.has(b.slug)) throw new Error(`Duplicate brand slug detected: ${b.slug}`);
    brandIds.add(id);
    brandSlugs.add(b.slug);
  }

  const prodIds = new Set<number>();
  const prodSkus = new Set<string>();
  const prodSlugs = new Set<string>();
  let maxProductId = 0;
  for (const p of products) {
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0 || !p.sku || !p.slug) {
      throw new Error(`Invalid product record: ${JSON.stringify(p)}`);
    }
    const normSku = String(p.sku).trim().toUpperCase();
    if (prodIds.has(id)) throw new Error(`Duplicate product ID detected: ${id}`);
    if (prodSkus.has(normSku)) throw new Error(`Duplicate product SKU detected: ${normSku}`);
    if (prodSlugs.has(p.slug)) throw new Error(`Duplicate product slug detected: ${p.slug}`);
    if (p.categoryId !== null && p.categoryId !== undefined && !catIds.has(Number(p.categoryId))) {
      throw new Error(`Orphan product ${id} (${normSku}) references missing categoryId ${p.categoryId}`);
    }
    if (p.brandId !== null && p.brandId !== undefined && !brandIds.has(Number(p.brandId))) {
      throw new Error(`Orphan product ${id} (${normSku}) references missing brandId ${p.brandId}`);
    }
    prodIds.add(id);
    prodSkus.add(normSku);
    prodSlugs.add(p.slug);
    if (id > maxProductId) maxProductId = id;
  }

  const nextProductAutoIncrement = maxProductId + 1;

  return {
    sourceMode,
    sourceFilePath,
    categories,
    brands,
    products,
    services,
    deletedProductIds,
    users,
    whatsappSettings,
    siteContent,
    visitorSettings,
    securitySettings,
    images,
    maxProductId,
    nextProductAutoIncrement,
    nextCategoryAutoIncrement: computeNextAutoIncrement(categories),
    nextBrandAutoIncrement: computeNextAutoIncrement(brands),
    nextUserAutoIncrement: computeNextAutoIncrement(users),
    nextImageAutoIncrement: computeNextAutoIncrement(images),
  };
}

/**
 * Pre-import verification: Checks that database matches strictly (never production),
 * all 12 tables exist, and every table contains exactly 0 records.
 */
export async function verifyPreImportEmptiness(
  connection: { query: (sql: string, params?: any[]) => Promise<any[]> },
  expectedDatabase: string
): Promise<{ success: boolean; tablesChecked: string[]; rowCounts: Record<string, number> }> {
  const [dbRes] = (await connection.query('SELECT DATABASE() AS current_db;')) as [any, any];
  const currentDb = Array.isArray(dbRes) ? dbRes[0]?.current_db : (dbRes as any)?.current_db;
  if (!currentDb || FORBIDDEN_PRODUCTION_DBS.has(String(currentDb))) {
    throw new Error(`CRITICAL ABORT: Refusing to operate on forbidden/production database "${currentDb}".`);
  }
  if (currentDb !== expectedDatabase) {
    throw new Error(`CRITICAL ABORT: Connected to database "${currentDb}", expected "${expectedDatabase}".`);
  }

  const [tablesRows] = (await connection.query('SHOW TABLES;')) as [any, any];
  const tablesList = Array.isArray(tablesRows) ? tablesRows : tablesRows ? [tablesRows] : [];
  const existingTables = tablesList.map((r) => Object.values(r)[0] as string);

  for (const table of EXPECTED_STAGING_TABLES) {
    if (!existingTables.includes(table)) {
      throw new Error(`PRE-IMPORT ABORT: Required table "${table}" does not exist in ${expectedDatabase}.`);
    }
  }

  const rowCounts: Record<string, number> = {};
  const nonEmptyTables: { table: string; count: number }[] = [];
  for (const table of EXPECTED_STAGING_TABLES) {
    const [cntRows] = (await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\`;`)) as [any, any];
    const countRow = Array.isArray(cntRows) ? cntRows[0] : cntRows;
    const count = Number(countRow?.total) || 0;
    rowCounts[table] = count;
    if (count !== 0) {
      nonEmptyTables.push({ table, count });
    }
  }

  if (nonEmptyTables.length > 0) {
    const summary = nonEmptyTables.map((t) => `"${t.table}" (${t.count} rows)`).join(', ');
    throw new Error(
      `PRE-IMPORT ABORT: Database "${expectedDatabase}" is not empty! Non-empty tables found: ${summary}. Automated clear/repair is strictly forbidden.`
    );
  }

  return { success: true, tablesChecked: [...EXPECTED_STAGING_TABLES], rowCounts };
}

function escapeList(values: (string | number)[], numeric = false): string {
  if (values.length === 0) return numeric ? '-1' : "'__NONE__'";
  return values.map((v) => (numeric ? String(Number(v)) : mysql.escape(String(v)))).join(',');
}

function buildDynamicAutoIncrementSql(tableName: string): string[] {
  const safeVar = `@next_${tableName}_ai`;
  const sqlVar = `@alter_${tableName}_ai_sql`;
  const stmtName = `stmt_${tableName}_ai`;
  return [
    `SET ${safeVar} = (SELECT COALESCE(MAX(id), 0) + 1 FROM \`${tableName}\`);`,
    `SET ${sqlVar} = CONCAT('ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ', ${safeVar});`,
    `PREPARE ${stmtName} FROM ${sqlVar};`,
    `EXECUTE ${stmtName};`,
    `DEALLOCATE PREPARE ${stmtName};`,
  ];
}

export function generateSeedSql(
  reconciledPath: string,
  backupPath: string,
  outPath: string,
  externalSourcePath?: string,
  options: SeedLoadOptions = {}
): {
  sourceMode: LoadedSeedDataset['sourceMode'];
  totalStatements: number;
  phase1Count: number;
  phase2Count: number;
  phase3Count: number;
  maxProductId: number;
  nextProductAutoIncrement: number;
} {
  const dataset = loadAndValidateSeedDataset(reconciledPath, backupPath, externalSourcePath, options);
  const {
    sourceMode,
    categories,
    brands,
    products,
    services,
    deletedProductIds,
    users,
    whatsappSettings,
    siteContent,
    visitorSettings,
    securitySettings,
    images,
    maxProductId,
    nextProductAutoIncrement,
  } = dataset;

  const userIdsSql = escapeList(users.map((u) => u.id), true);
  const userEmailsSql = escapeList(users.map((u) => u.email));
  const userUidsSql = escapeList(users.map((u) => u.uid));

  const catIdsSql = escapeList(categories.map((c) => c.id), true);
  const catSlugsSql = escapeList(categories.map((c) => c.slug));

  const brandIdsSql = escapeList(brands.map((b) => b.id), true);
  const brandSlugsSql = escapeList(brands.map((b) => b.slug));

  const prodIdsSql = escapeList(products.map((p) => p.id), true);
  const prodSkusSql = escapeList(products.map((p) => p.sku));
  const prodSlugsSql = escapeList(products.map((p) => p.slug));

  const imageIdsSql = escapeList(images.map((i) => i.id), true);
  const waIdsSql = escapeList(whatsappSettings.map((w) => w.id), true);
  const siteIdsSql = escapeList(siteContent.map((s) => s.id), true);
  const visIdsSql = escapeList(visitorSettings.map((v) => v.id), true);
  const secIdsSql = escapeList(securitySettings.map((s) => s.id), true);

  const sql: string[] = [];
  sql.push('-- ============================================================================');
  if (sourceMode === 'partial-historical-baseline') {
    sql.push('-- WARNING: PARTIAL HISTORICAL BASELINE SEED ONLY (70 PRODUCTS)');
    sql.push('-- THIS FILE IS NOT THE COMPLETE LIVE 91-PRODUCT CATALOGUE.');
    sql.push('-- Regenerate from live Hostinger export before staging/production cutover:');
    sql.push('--   npx tsx scripts/seed-mysql-staging.ts --source=<hostinger-data-store.json> --generate-sql');
  } else {
    sql.push(`-- NASIR MOBILE — AUTHORITATIVE LIVE MYSQL SEED (${products.length} PRODUCTS)`);
    sql.push(`-- Source: ${path.basename(dataset.sourceFilePath)} | Services validated: ${services.length} | Excluded deletedProductIds: [${deletedProductIds.join(', ')}]`);
  }
  sql.push('-- Strict Insert-Only, 3-Phase Transactional Seeding');
  sql.push('-- Zero DROP, Zero TRUNCATE, Zero REPLACE, Zero FOREIGN_KEY_CHECKS=0');
  sql.push('-- Dynamic AUTO_INCREMENT = MAX(id) + 1 (Zero hardcoded ID offsets)');
  sql.push('-- Fail-Fast Pre-Flight Collision Abort Guard Enabled');
  sql.push('-- ============================================================================\n');

  // Pre-flight diagnostic queries + hard fail-fast abort guard
  sql.push('-- ============================================================================');
  sql.push('-- PRE-FLIGHT COLLISION DETECTION REPORT & FAIL-FAST ABORT GUARD');
  sql.push('-- Checks 100% of incoming PKs, SKUs, slugs, UIDs, and emails.');
  sql.push('-- If any collision exists, the guard query throws ERROR 1242 and HALTS execution');
  sql.push('-- BEFORE any Phase 1/2/3 INSERT runs (safe in both phpMyAdmin and MySQL CLI).');
  sql.push('-- ============================================================================\n');

  sql.push('-- 1. User Account Collisions (id, email, uid)');
  sql.push(
    `SELECT 'COLLISION DETECTED: users' AS alert, id, uid, email, role, created_at FROM users WHERE id IN (${userIdsSql}) OR email IN (${userEmailsSql}) OR uid IN (${userUidsSql});\n`
  );

  sql.push('-- 2. Category Collisions (id, slug)');
  sql.push(
    `SELECT 'COLLISION DETECTED: categories' AS alert, id, slug, name_en, display_order FROM categories WHERE id IN (${catIdsSql}) OR slug IN (${catSlugsSql});\n`
  );

  sql.push('-- 3. Brand Collisions (id, slug)');
  sql.push(
    `SELECT 'COLLISION DETECTED: brands' AS alert, id, slug, name FROM brands WHERE id IN (${brandIdsSql}) OR slug IN (${brandSlugsSql});\n`
  );

  sql.push('-- 4. Product Collisions (100% of ids, SKUs, slugs)');
  sql.push(
    `SELECT 'COLLISION DETECTED: products' AS alert, id, sku, slug, name_en, stock_quantity, purchase_cost FROM products WHERE id IN (${prodIdsSql}) OR sku IN (${prodSkusSql}) OR slug IN (${prodSlugsSql});\n`
  );

  sql.push('-- 5. Image Records Collisions (id)');
  sql.push(
    `SELECT 'COLLISION DETECTED: images' AS alert, id, file_name FROM images WHERE id IN (${imageIdsSql});\n`
  );

  sql.push('-- 6. Singleton Settings Collisions');
  sql.push(`SELECT 'COLLISION DETECTED: whatsapp_settings' AS alert, id, primary_number FROM whatsapp_settings WHERE id IN (${waIdsSql});`);
  sql.push(`SELECT 'COLLISION DETECTED: site_content' AS alert, id, contact_email FROM site_content WHERE id IN (${siteIdsSql});`);
  sql.push(`SELECT 'COLLISION DETECTED: visitor_settings' AS alert, id, display_mode FROM visitor_settings WHERE id IN (${visIdsSql});`);
  sql.push(`SELECT 'COLLISION DETECTED: security_settings' AS alert, id FROM security_settings WHERE id IN (${secIdsSql});\n`);

  sql.push('-- 7. HARD FAIL-FAST ABORT GUARD (Halts SQL import immediately on any conflict via ERROR 1242)');
  sql.push('SELECT (');
  sql.push('  SELECT 1 FROM (SELECT 1 AS flag UNION ALL SELECT 2 AS flag) AS collision_abort_guard');
  sql.push('  WHERE (');
  sql.push(`    (SELECT COUNT(*) FROM users WHERE id IN (${userIdsSql}) OR email IN (${userEmailsSql}) OR uid IN (${userUidsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM categories WHERE id IN (${catIdsSql}) OR slug IN (${catSlugsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM brands WHERE id IN (${brandIdsSql}) OR slug IN (${brandSlugsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM products WHERE id IN (${prodIdsSql}) OR sku IN (${prodSkusSql}) OR slug IN (${prodSlugsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM images WHERE id IN (${imageIdsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM whatsapp_settings WHERE id IN (${waIdsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM site_content WHERE id IN (${siteIdsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM visitor_settings WHERE id IN (${visIdsSql})) +`);
  sql.push(`    (SELECT COUNT(*) FROM security_settings WHERE id IN (${secIdsSql}))`);
  sql.push('  ) > 0');
  sql.push(') AS preflight_collision_abort_guard;\n');

  // PHASE 1: Core Catalog (Parents before children: Categories -> Brands -> Products)
  sql.push('-- ============================================================================');
  sql.push(`-- PHASE 1: CORE CATALOG SEEDING (Categories: ${categories.length}, Brands: ${brands.length}, Products: ${products.length})`);
  sql.push('-- ============================================================================');
  sql.push('START TRANSACTION;\n');

  sql.push(`-- Categories (${categories.length} entries)`);
  for (const c of categories) {
    sql.push(
      `INSERT INTO categories (id, slug, name_en, name_ar, description_en, description_ar, icon, display_order) ` +
        `VALUES (${Number(c.id)}, ${mysql.escape(c.slug)}, ${mysql.escape(c.nameEn)}, ${mysql.escape(c.nameAr)}, ` +
        `${mysql.escape(c.descriptionEn || '')}, ${mysql.escape(c.descriptionAr || '')}, ${mysql.escape(c.icon || 'Smartphone')}, ${Number(c.displayOrder) || 0});`
    );
  }

  sql.push(`\n-- Brands (${brands.length} entries)`);
  for (const b of brands) {
    sql.push(
      `INSERT INTO brands (id, slug, name, logo_url) ` +
        `VALUES (${Number(b.id)}, ${mysql.escape(b.slug)}, ${mysql.escape(b.name)}, ${mysql.escape(b.logoUrl || '')});`
    );
  }

  sql.push(`\n-- Products (${products.length} entries; max id=${maxProductId})`);
  for (const p of products) {
    const storefrontVis = p.storefrontVisible ? 1 : 0;
    const versionNum = Number(p.version) || 1;
    const createdAtSql = toMysqlTimestampString(p.createdAt);
    if (createdAtSql) {
      sql.push(
        `INSERT INTO products (id, slug, sku, name_en, name_ar, description_en, description_ar, ` +
          `\`condition\`, category_id, brand_id, is_featured, is_new_arrival, status, storefront_visible, version, ` +
          `specifications, variants, images, private_notes, purchase_cost, stock_quantity, imei_serial_numbers, created_at) ` +
          `VALUES (${Number(p.id)}, ${mysql.escape(p.slug)}, ${mysql.escape(p.sku)}, ${mysql.escape(p.nameEn)}, ${mysql.escape(p.nameAr)}, ` +
          `${mysql.escape(p.descriptionEn || '')}, ${mysql.escape(p.descriptionAr || '')}, ${mysql.escape(p.condition || 'New')}, ` +
          `${p.categoryId ? Number(p.categoryId) : 'NULL'}, ${p.brandId ? Number(p.brandId) : 'NULL'}, ` +
          `${p.isFeatured ? 1 : 0}, ${p.isNewArrival ? 1 : 0}, ${mysql.escape(p.status || 'published')}, ${storefrontVis}, ${versionNum}, ` +
          `${mysql.escape(JSON.stringify(p.specifications || []))}, ${mysql.escape(JSON.stringify(p.variants || []))}, ` +
          `${mysql.escape(JSON.stringify(p.images || []))}, ${mysql.escape(p.privateNotes || '')}, ` +
          `${mysql.escape(p.purchaseCost || '')}, ${Number(p.stockQuantity) || 0}, ` +
          `${mysql.escape(JSON.stringify(p.imeiSerialNumbers || []))}, ${mysql.escape(createdAtSql)});`
      );
    } else {
      sql.push(
        `INSERT INTO products (id, slug, sku, name_en, name_ar, description_en, description_ar, ` +
          `\`condition\`, category_id, brand_id, is_featured, is_new_arrival, status, storefront_visible, version, ` +
          `specifications, variants, images, private_notes, purchase_cost, stock_quantity, imei_serial_numbers) ` +
          `VALUES (${Number(p.id)}, ${mysql.escape(p.slug)}, ${mysql.escape(p.sku)}, ${mysql.escape(p.nameEn)}, ${mysql.escape(p.nameAr)}, ` +
          `${mysql.escape(p.descriptionEn || '')}, ${mysql.escape(p.descriptionAr || '')}, ${mysql.escape(p.condition || 'New')}, ` +
          `${p.categoryId ? Number(p.categoryId) : 'NULL'}, ${p.brandId ? Number(p.brandId) : 'NULL'}, ` +
          `${p.isFeatured ? 1 : 0}, ${p.isNewArrival ? 1 : 0}, ${mysql.escape(p.status || 'published')}, ${storefrontVis}, ${versionNum}, ` +
          `${mysql.escape(JSON.stringify(p.specifications || []))}, ${mysql.escape(JSON.stringify(p.variants || []))}, ` +
          `${mysql.escape(JSON.stringify(p.images || []))}, ${mysql.escape(p.privateNotes || '')}, ` +
          `${mysql.escape(p.purchaseCost || '')}, ${Number(p.stockQuantity) || 0}, ` +
          `${mysql.escape(JSON.stringify(p.imeiSerialNumbers || []))});`
      );
    }
  }

  sql.push('COMMIT;\n');
  sql.push('-- Standalone Post-Commit DDL: Align AUTO_INCREMENT dynamically using MAX(id) + 1');
  sql.push(...buildDynamicAutoIncrementSql('categories'));
  sql.push(...buildDynamicAutoIncrementSql('brands'));
  sql.push(...buildDynamicAutoIncrementSql('products'));
  sql.push('');

  // PHASE 2: Store Settings & Owner Account
  sql.push('-- ============================================================================');
  sql.push(`-- PHASE 2: STORE SETTINGS & OWNER ACCOUNT (Users: ${users.length}, Settings: ${whatsappSettings.length + siteContent.length + visitorSettings.length + securitySettings.length})`);
  sql.push('-- ============================================================================');
  sql.push('START TRANSACTION;\n');

  for (const u of users) {
    sql.push(
      `INSERT INTO users (id, uid, email, role, password_hash) ` +
        `VALUES (${Number(u.id)}, ${mysql.escape(u.uid)}, ${mysql.escape(u.email)}, ${mysql.escape(u.role || 'owner')}, ${mysql.escape(u.password_hash)});`
    );
  }

  for (const w of whatsappSettings) {
    sql.push(
      `INSERT INTO whatsapp_settings (id, primary_number, secondary_number, active_number, is_enabled, template_en, template_ar) ` +
        `VALUES (${Number(w.id)}, ${mysql.escape(w.primary_number)}, ${mysql.escape(w.secondary_number)}, ${mysql.escape(w.active_number)}, ` +
        `${w.is_enabled ? 1 : 0}, ${mysql.escape(w.template_en)}, ${mysql.escape(w.template_ar)});`
    );
  }

  for (const s of siteContent) {
    sql.push(
      `INSERT INTO site_content (id, hero_title_en, hero_title_ar, hero_subtitle_en, hero_subtitle_ar, announcement_en, announcement_ar, announcement_active, about_en, about_ar, contact_address_en, contact_address_ar, contact_email, opening_hours_en, opening_hours_ar) ` +
        `VALUES (${Number(s.id)}, ${mysql.escape(s.hero_title_en)}, ${mysql.escape(s.hero_title_ar)}, ${mysql.escape(s.hero_subtitle_en)}, ${mysql.escape(s.hero_subtitle_ar)}, ` +
        `${mysql.escape(s.announcement_en || '')}, ${mysql.escape(s.announcement_ar || '')}, ${s.announcement_active ? 1 : 0}, ` +
        `${mysql.escape(s.about_en)}, ${mysql.escape(s.about_ar)}, ${mysql.escape(s.contact_address_en)}, ${mysql.escape(s.contact_address_ar)}, ` +
        `${mysql.escape(s.contact_email)}, ${mysql.escape(s.opening_hours_en)}, ${mysql.escape(s.opening_hours_ar)});`
    );
  }

  for (const v of visitorSettings) {
    sql.push(
      `INSERT INTO visitor_settings (id, is_enabled, display_mode, today_adjustment, total_adjustment) ` +
        `VALUES (${Number(v.id)}, ${v.is_enabled ? 1 : 0}, ${mysql.escape(v.display_mode || 'both')}, ${Number(v.today_adjustment) || 0}, ${Number(v.total_adjustment) || 0});`
    );
  }

  for (const sec of securitySettings) {
    sql.push(
      `INSERT INTO security_settings (id, master_key) ` +
        `VALUES (${Number(sec.id)}, ${mysql.escape(sec.master_key)});`
    );
  }

  sql.push('COMMIT;\n');
  sql.push(...buildDynamicAutoIncrementSql('users'));
  sql.push('');

  // PHASE 3: Media Payload
  sql.push('-- ============================================================================');
  sql.push(`-- PHASE 3: MEDIA STORAGE (${images.length} verified Base64 image records into LONGTEXT)`);
  sql.push('-- ============================================================================');
  sql.push('START TRANSACTION;\n');

  for (const img of images) {
    sql.push(
      `INSERT INTO images (id, file_name, mime_type, data) ` +
        `VALUES (${Number(img.id)}, ${mysql.escape(img.file_name)}, ${mysql.escape(img.mime_type)}, ${mysql.escape(img.data)});`
    );
  }

  sql.push('COMMIT;\n');
  sql.push(...buildDynamicAutoIncrementSql('images'));

  fs.writeFileSync(outPath, sql.join('\n'));

  const phase1Count = categories.length + brands.length + products.length;
  const phase2Count =
    users.length +
    whatsappSettings.length +
    siteContent.length +
    visitorSettings.length +
    securitySettings.length;
  const phase3Count = images.length;

  return {
    sourceMode,
    totalStatements: phase1Count + phase2Count + phase3Count,
    phase1Count,
    phase2Count,
    phase3Count,
    maxProductId,
    nextProductAutoIncrement,
  };
}

async function alignTableAutoIncrementDynamic(
  connection: mysql.Connection,
  database: string,
  tableName: string
): Promise<{ maxId: number; targetNext: number; verifiedAutoIncrement: number }> {
  const [maxRows] = await connection.query(`SELECT COALESCE(MAX(id), 0) AS max_id FROM \`${tableName}\`;`);
  const maxId = Number((maxRows as any[])[0]?.max_id) || 0;
  const targetNext = maxId + 1;
  await connection.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ${targetNext};`);

  const [autoIncRows] = await connection.query(
    `SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?;`,
    [database, tableName]
  );
  const verifiedAutoIncrement = Number((autoIncRows as any[])[0]?.AUTO_INCREMENT) || 0;
  if (verifiedAutoIncrement < targetNext) {
    throw new Error(
      `AUTO_INCREMENT verification failed on ${tableName}: Expected >= ${targetNext} (MAX(id)+1), found ${verifiedAutoIncrement}.`
    );
  }
  return { maxId, targetNext, verifiedAutoIncrement };
}

async function runLiveImport() {
  const args = process.argv.slice(2);
  const isGenerateSql = args.includes('--generate-sql');
  const isDryRun = args.includes('--dry-run');
  const allowPartialBaseline = args.includes('--allow-partial-baseline');
  const skipImagesDb = args.includes('--skip-images-db');
  const storefrontVisibleAll = args.includes('--storefront-visible-all');
  const sourceArg = args.find((a) => a.startsWith('--source='));
  const outArg = args.find((a) => a.startsWith('--out='));
  const externalSourcePath = sourceArg ? sourceArg.slice('--source='.length) : undefined;

  const reconciledPath = path.resolve(process.cwd(), 'backups/nasirmobile_reconciled_70_products.json');
  const backupPath = path.resolve(process.cwd(), 'backups/nasirmobile_database_backup_20261106.json');
  const defaultOutSqlPath = path.resolve(process.cwd(), 'scripts/nasirmobile_mysql_seed_data.sql');
  const outSqlPath = outArg ? path.resolve(process.cwd(), outArg.slice('--out='.length)) : defaultOutSqlPath;

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Required backup file is missing: ${backupPath}`);
  }
  if (!externalSourcePath && !fs.existsSync(reconciledPath)) {
    throw new Error(`Required baseline backup file is missing: ${reconciledPath}`);
  }

  // Safeguard: Refuse to mistake the 70-product historical backup for the live 91-product catalogue
  if (!externalSourcePath && !allowPartialBaseline && !isDryRun) {
    throw new Error(
      'SAFETY ABORT: --source=<path-to-hostinger-data-store.json> is required. ' +
        'The workspace backup contains ONLY a 70-product partial historical baseline and is NOT the complete live 91-product catalogue. ' +
        'Pass --source=<exported-data-store.json>, or pass --allow-partial-baseline ONLY when regenerating historical artifacts.'
    );
  }

  if (isGenerateSql) {
    console.log('Generating strict insert-only SQL seed file...');
    const stats = generateSeedSql(reconciledPath, backupPath, outSqlPath, externalSourcePath, {
      storefrontVisibleAll,
    });
    console.log(`Generated ${outSqlPath} successfully:`);
    console.log(`- Source Mode: ${stats.sourceMode}`);
    if (stats.sourceMode === 'partial-historical-baseline') {
      console.log('  [WARNING] 70-product partial historical baseline generated (NOT complete live 91-product catalogue).');
    }
    console.log(`- Phase 1 (Catalog): ${stats.phase1Count} strict INSERT statements`);
    console.log(`- Phase 2 (Settings & Owner): ${stats.phase2Count} strict INSERT statements`);
    console.log(`- Phase 3 (Media Storage): ${stats.phase3Count} strict INSERT statements`);
    console.log(`- Total Strict Inserts: ${stats.totalStatements}`);
    console.log(`- Products MAX(id): ${stats.maxProductId} -> Dynamic AUTO_INCREMENT: MAX(id) + 1 = ${stats.nextProductAutoIncrement}`);
    return;
  }

  if (isDryRun) {
    const dataset = loadAndValidateSeedDataset(reconciledPath, backupPath, externalSourcePath, {
      storefrontVisibleAll,
    });
    console.log('[DRY-RUN] Preflight dataset verification complete:');
    console.log(`- Source Mode: ${dataset.sourceMode} (${dataset.sourceFilePath})`);
    if (dataset.sourceMode === 'partial-historical-baseline') {
      console.log('  [WARNING] PARTIAL HISTORICAL BASELINE ONLY (70 PRODUCTS) — NOT THE COMPLETE LIVE 91-PRODUCT CATALOGUE.');
    }
    console.log(
      `- Phase 1 Catalog: ${dataset.categories.length} categories, ${dataset.brands.length} brands, ${dataset.products.length} products`
    );
    console.log(
      `- Source Metadata: ${dataset.services.length} services validated, ${dataset.deletedProductIds.length} deletedProductIds excluded [${dataset.deletedProductIds.join(', ')}]`
    );
    console.log(
      `- Phase 2 Settings: ${dataset.users.length} users, ${
        dataset.whatsappSettings.length +
        dataset.siteContent.length +
        dataset.visitorSettings.length +
        dataset.securitySettings.length
      } settings rows`
    );
    console.log(`- Phase 3 Media DB Records: ${dataset.images.length} Base64 image rows (filesystem images verified separately via scripts/verify-and-sync-images.ts)`);
    console.log(`- Dynamic Products AUTO_INCREMENT: MAX(id) + 1 = ${dataset.maxProductId} + 1 = ${dataset.nextProductAutoIncrement}`);
    console.log('[DRY-RUN] Integrity checks passed. No database connection attempted.');
    return;
  }

  // Live Staging Execution Mode (Strictly Staging ONLY — never production)
  const confirmStaging = args.includes('--confirm-staging');
  if (!confirmStaging) {
    throw new Error(
      'SAFETY ABORT: Live staging import requires explicit --confirm-staging flag. Target is strictly u609585964_STAGING_DB.'
    );
  }

  const password = resolvePassword();
  if (!password) {
    throw new Error('HOSTINGER_STAGING_MYSQL_PASSWORD secret is not available in environment.');
  }

  const dataset = loadAndValidateSeedDataset(reconciledPath, backupPath, externalSourcePath, {
    storefrontVisibleAll,
  });

  console.log(`Connecting to STAGING ONLY: ${STAGING_USER}@${STAGING_HOST}:${STAGING_PORT}/${STAGING_DB} (TLS enabled)...`);
  const connection = await mysql.createConnection({
    host: STAGING_HOST,
    port: STAGING_PORT,
    user: STAGING_USER,
    password,
    database: STAGING_DB,
    connectTimeout: 15000,
    ssl: { rejectUnauthorized: true, servername: STAGING_SNI } as any,
  });

  try {
    console.log('\n--- PRE-IMPORT VERIFICATION: Staging Identity & Table Emptiness Audit ---');
    await verifyPreImportEmptiness(connection, STAGING_DB);
    console.log('✓ Pre-import audit passed: All 12 tables exist in staging and contain exactly 0 records.');

    // --- PHASE 1: Catalog ---
    console.log('\n--- EXECUTING PHASE 1: Core Catalog Seeding (Transactional) ---');
    await connection.beginTransaction();
    try {
      for (const c of dataset.categories) {
        await connection.execute(
          `INSERT INTO categories (id, slug, name_en, name_ar, description_en, description_ar, icon, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.slug, c.nameEn, c.nameAr, c.descriptionEn || '', c.descriptionAr || '', c.icon || 'Smartphone', Number(c.displayOrder) || 0]
        );
      }
      for (const b of dataset.brands) {
        await connection.execute(
          `INSERT INTO brands (id, slug, name, logo_url) VALUES (?, ?, ?, ?)`,
          [b.id, b.slug, b.name, b.logoUrl || '']
        );
      }
      for (const p of dataset.products) {
        const createdAtSql = toMysqlTimestampString(p.createdAt);
        if (createdAtSql) {
          await connection.execute(
            `INSERT INTO products (id, slug, sku, name_en, name_ar, description_en, description_ar,
              \`condition\`, category_id, brand_id, is_featured, is_new_arrival, status, storefront_visible, version,
              specifications, variants, images, private_notes, purchase_cost, stock_quantity, imei_serial_numbers, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.slug,
              p.sku,
              p.nameEn,
              p.nameAr,
              p.descriptionEn || '',
              p.descriptionAr || '',
              p.condition || 'New',
              p.categoryId ? Number(p.categoryId) : null,
              p.brandId ? Number(p.brandId) : null,
              p.isFeatured ? 1 : 0,
              p.isNewArrival ? 1 : 0,
              p.status || 'published',
              p.storefrontVisible ? 1 : 0,
              Number(p.version) || 1,
              JSON.stringify(p.specifications || []),
              JSON.stringify(p.variants || []),
              JSON.stringify(p.images || []),
              p.privateNotes || '',
              p.purchaseCost || '',
              Number(p.stockQuantity) || 0,
              JSON.stringify(p.imeiSerialNumbers || []),
              createdAtSql,
            ]
          );
        } else {
          await connection.execute(
            `INSERT INTO products (id, slug, sku, name_en, name_ar, description_en, description_ar,
              \`condition\`, category_id, brand_id, is_featured, is_new_arrival, status, storefront_visible, version,
              specifications, variants, images, private_notes, purchase_cost, stock_quantity, imei_serial_numbers)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.slug,
              p.sku,
              p.nameEn,
              p.nameAr,
              p.descriptionEn || '',
              p.descriptionAr || '',
              p.condition || 'New',
              p.categoryId ? Number(p.categoryId) : null,
              p.brandId ? Number(p.brandId) : null,
              p.isFeatured ? 1 : 0,
              p.isNewArrival ? 1 : 0,
              p.status || 'published',
              p.storefrontVisible ? 1 : 0,
              Number(p.version) || 1,
              JSON.stringify(p.specifications || []),
              JSON.stringify(p.variants || []),
              JSON.stringify(p.images || []),
              p.privateNotes || '',
              p.purchaseCost || '',
              Number(p.stockQuantity) || 0,
              JSON.stringify(p.imeiSerialNumbers || []),
            ]
          );
        }
      }
      await connection.commit();
      console.log(`✓ Phase 1 committed: ${dataset.categories.length} categories, ${dataset.brands.length} brands, ${dataset.products.length} products.`);
    } catch (phase1Err: any) {
      await connection.rollback();
      console.error('✗ Phase 1 failed! Rolled back cleanly.');
      throw phase1Err;
    }

    // --- Post-Phase 1 Dynamic Standalone DDL Alignment ---
    console.log('\n--- EXECUTING STANDALONE DDL: Dynamic MAX(id) + 1 AUTO_INCREMENT Alignment ---');
    const catAi = await alignTableAutoIncrementDynamic(connection, STAGING_DB, 'categories');
    const brandAi = await alignTableAutoIncrementDynamic(connection, STAGING_DB, 'brands');
    const prodAi = await alignTableAutoIncrementDynamic(connection, STAGING_DB, 'products');
    console.log(
      `✓ Dynamic AUTO_INCREMENT aligned: products=${prodAi.verifiedAutoIncrement} (MAX=${prodAi.maxId}), categories=${catAi.verifiedAutoIncrement}, brands=${brandAi.verifiedAutoIncrement}`
    );

    // --- PHASE 2: Settings, Owner Account & Migration Metadata Audit ---
    console.log('\n--- EXECUTING PHASE 2: Store Settings & Owner Account (Transactional) ---');
    await connection.beginTransaction();
    try {
      for (const u of dataset.users) {
        await connection.execute(
          `INSERT INTO users (id, uid, email, role, password_hash) VALUES (?, ?, ?, ?, ?)`,
          [u.id, u.uid, u.email, u.role || 'owner', u.password_hash]
        );
      }
      for (const w of dataset.whatsappSettings) {
        await connection.execute(
          `INSERT INTO whatsapp_settings (id, primary_number, secondary_number, active_number, is_enabled, template_en, template_ar)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [w.id, w.primary_number, w.secondary_number, w.active_number, w.is_enabled ? 1 : 0, w.template_en, w.template_ar]
        );
      }
      for (const s of dataset.siteContent) {
        await connection.execute(
          `INSERT INTO site_content (id, hero_title_en, hero_title_ar, hero_subtitle_en, hero_subtitle_ar, announcement_en, announcement_ar, announcement_active, about_en, about_ar, contact_address_en, contact_address_ar, contact_email, opening_hours_en, opening_hours_ar)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id, s.hero_title_en, s.hero_title_ar, s.hero_subtitle_en, s.hero_subtitle_ar,
            s.announcement_en || '', s.announcement_ar || '', s.announcement_active ? 1 : 0,
            s.about_en, s.about_ar, s.contact_address_en, s.contact_address_ar,
            s.contact_email, s.opening_hours_en, s.opening_hours_ar,
          ]
        );
      }
      for (const v of dataset.visitorSettings) {
        await connection.execute(
          `INSERT INTO visitor_settings (id, is_enabled, display_mode, today_adjustment, total_adjustment) VALUES (?, ?, ?, ?, ?)`,
          [v.id, v.is_enabled ? 1 : 0, v.display_mode || 'both', Number(v.today_adjustment) || 0, Number(v.total_adjustment) || 0]
        );
      }
      for (const sec of dataset.securitySettings) {
        await connection.execute(
          `INSERT INTO security_settings (id, master_key) VALUES (?, ?)`,
          [sec.id, sec.master_key]
        );
      }
      await connection.execute(
        `INSERT INTO audit_logs (user_id, user_email, action, details) VALUES (?, ?, ?, ?)`,
        [
          'migration-runner',
          'system@nasirmobile.com',
          'STAGING_SEED_IMPORT',
          JSON.stringify({
            sourceMode: dataset.sourceMode,
            productsImported: dataset.products.length,
            categoriesImported: dataset.categories.length,
            brandsImported: dataset.brands.length,
            servicesValidated: dataset.services.length,
            excludedDeletedProductIds: dataset.deletedProductIds,
            productsMaxId: prodAi.maxId,
            productsAutoIncrement: prodAi.verifiedAutoIncrement,
          }),
        ]
      );
      await connection.commit();
      await alignTableAutoIncrementDynamic(connection, STAGING_DB, 'users');
      console.log('✓ Phase 2 committed.');
    } catch (phase2Err: any) {
      await connection.rollback();
      console.error('✗ Phase 2 failed! Rolled back cleanly.');
      throw phase2Err;
    }

    // --- PHASE 3: Database Media Payload (optional if separated) ---
    if (skipImagesDb) {
      console.log('\n--- PHASE 3 SKIPPED (--skip-images-db): Verify filesystem images independently via scripts/verify-and-sync-images.ts ---');
    } else {
      console.log('\n--- EXECUTING PHASE 3: Database Media Records (Transactional) ---');
      await connection.beginTransaction();
      try {
        for (const img of dataset.images) {
          await connection.execute(
            `INSERT INTO images (id, file_name, mime_type, data) VALUES (?, ?, ?, ?)`,
            [img.id, img.file_name, img.mime_type, img.data]
          );
        }
        await connection.commit();
        await alignTableAutoIncrementDynamic(connection, STAGING_DB, 'images');
        console.log(`✓ Phase 3 committed: ${dataset.images.length} images stored in LONGTEXT.`);
      } catch (phase3Err: any) {
        await connection.rollback();
        console.error('✗ Phase 3 failed! Rolled back cleanly.');
        throw phase3Err;
      }
    }

    console.log('\n=== ALL STAGING IMPORT PHASES COMPLETED SUCCESSFULLY ===');
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed-mysql-staging.ts')) {
  runLiveImport().catch((err) => {
    console.error('Staging seed execution halted:', err.message);
    process.exit(1);
  });
}
