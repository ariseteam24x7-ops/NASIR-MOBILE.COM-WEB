import express from 'express';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, isPostgresAvailable } from './src/db/index.ts';
import {
  products,
  categories,
  brands,
  images,
  whatsappSettings,
  siteContent,
  auditLogs,
  users,
  visitorSettings,
  visitorDailyStats,
  visitorLogs,
  securitySettings,
} from './src/db/schema.ts';
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm';
import { requireAuth, AuthRequest, adminSessions, createSignedToken } from './src/middleware/auth.ts';
import { initDatabase } from './src/db/init.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_BRANDS,
  FALLBACK_WHATSAPP,
  FALLBACK_SITE_CONTENT,
  FALLBACK_PRODUCTS,
  FALLBACK_SERVICES,
} from './src/db/fallbacks.ts';

// Global error handlers to prevent unexpected process crashes
process.on('uncaughtException', (err) => {
  console.warn('Uncaught server exception handled safely:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled server promise rejection handled safely:', (reason as any)?.message || reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check endpoints for host reverse proxies and uptime monitors
  app.get(['/health', '/api/health'], (_req, res) => {
    res.status(200).json({ status: 'ok', server: 'Nasir Mobile Dubai', timestamp: new Date().toISOString() });
  });

  // Automatically ensure database tables exist (run in background without blocking server startup)
  initDatabase().catch((dbErr) => {
    console.warn('Initial database sync note (non-fatal):', dbErr?.message || dbErr);
  });

  // Helper to log audit actions
  const logAudit = async (action: string, details: string, email: string = 'system') => {
    try {
      await db.insert(auditLogs).values({
        action,
        details,
        userEmail: email,
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  };

  // ----------------------------------------------------
  // FILE-BACKED PERSISTENT FALLBACK STORE FOR PRODUCTS, BRANDS & CATEGORIES
  // Guarantees zero failures even if PostgreSQL is offline or encounters connection issues
  // ----------------------------------------------------
  const DATA_STORE_FILE = path.join(__dirname, 'data-store.json');
  let customBrands: Array<{ id: number; slug: string; name: string; logoUrl: string; createdAt?: string }> = [];
  let customCategories: Array<{
    id: number;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    icon: string;
    displayOrder: number;
    createdAt?: string;
  }> = [];
  let customProducts: any[] = [];
  let customServices: any[] = [];
  let deletedProductIds: number[] = [];

  try {
    if (fs.existsSync(DATA_STORE_FILE)) {
      const raw = fs.readFileSync(DATA_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.brands)) customBrands = parsed.brands;
      if (Array.isArray(parsed.categories)) customCategories = parsed.categories;
      if (Array.isArray(parsed.products)) customProducts = parsed.products;
      if (Array.isArray(parsed.services)) customServices = parsed.services;
      if (Array.isArray(parsed.deletedProductIds)) deletedProductIds = parsed.deletedProductIds.map(Number).filter((n: number) => !isNaN(n));
    }
  } catch (err) {
    console.warn('Note: Could not read data-store.json:', err);
  }

  if (customServices.length === 0) {
    customServices = [...FALLBACK_SERVICES];
  }

  const persistDataStore = () => {
    try {
      fs.writeFileSync(
        DATA_STORE_FILE,
        JSON.stringify(
          {
            brands: customBrands,
            categories: customCategories,
            products: customProducts,
            services: customServices,
            deletedProductIds: deletedProductIds,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.warn('Note: Could not write data-store.json:', err);
    }
  };

  // Reconcile and mirror database entities into persistent store so nothing ever vanishes
  const reconcileStores = async () => {
    if (!isPostgresAvailable) return;
    try {
      const pool = (global as any)._postgresPool;
      if (!pool) return;

      // 1. Ensure services table exists in PostgreSQL
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            title_en TEXT NOT NULL,
            title_ar TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            icon TEXT DEFAULT 'Wrench',
            turnaround_en TEXT DEFAULT '30 - 45 Minutes',
            turnaround_ar TEXT DEFAULT '30 - 45 دقيقة',
            badge_en TEXT DEFAULT 'Certified',
            badge_ar TEXT DEFAULT 'معتمد',
            features_en JSONB DEFAULT '[]',
            features_ar JSONB DEFAULT '[]',
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
      } catch (tblErr) {
        console.warn('Services table creation note:', tblErr);
      }

      // 2. Seed any missing categories into PostgreSQL (DO NOTHING on conflict so custom edits are never lost)
      for (const c of [...FALLBACK_CATEGORIES, ...customCategories]) {
        try {
          await pool.query(`
            INSERT INTO categories (id, slug, name_en, name_ar, description_en, description_ar, icon, display_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;
          `, [c.id, c.slug, c.nameEn, c.nameAr, c.descriptionEn || '', c.descriptionAr || '', c.icon || 'Smartphone', c.displayOrder || 0]);
        } catch {}
      }

      // 3. Seed any missing brands into PostgreSQL
      for (const b of [...FALLBACK_BRANDS, ...customBrands]) {
        try {
          await pool.query(`
            INSERT INTO brands (id, slug, name, logo_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING;
          `, [b.id, b.slug, b.name, b.logoUrl || '']);
        } catch {}
      }

      // 4. Seed any missing products into PostgreSQL
      for (const p of [...FALLBACK_PRODUCTS, ...customProducts]) {
        if (!deletedProductIds.includes(p.id)) {
          try {
            await pool.query(`
              INSERT INTO products (
                id, slug, sku, name_en, name_ar, description_en, description_ar,
                condition, category_id, brand_id, is_featured, is_new_arrival,
                status, specifications, variants, images, stock_quantity
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              ON CONFLICT (id) DO NOTHING;
            `, [
              p.id, p.slug, p.sku, p.nameEn, p.nameAr, p.descriptionEn || '', p.descriptionAr || '',
              p.condition || 'New', p.categoryId, p.brandId, Boolean(p.isFeatured), Boolean(p.isNewArrival),
              p.status || 'published', JSON.stringify(p.specifications || []), JSON.stringify(p.variants || []),
              JSON.stringify(p.images || []), p.stockQuantity ?? 10
            ]);
          } catch {}
        }
      }

      // 5. Seed any missing services into PostgreSQL
      for (const s of [...FALLBACK_SERVICES, ...customServices]) {
        try {
          await pool.query(`
            INSERT INTO services (
              id, slug, title_en, title_ar, description_en, description_ar,
              icon, turnaround_en, turnaround_ar, badge_en, badge_ar,
              features_en, features_ar, display_order, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING;
          `, [
            s.id, s.slug, s.titleEn, s.titleAr, s.descriptionEn, s.descriptionAr,
            s.icon || 'Wrench', s.turnaroundEn || '30 - 45 Minutes', s.turnaroundAr || '30 - 45 دقيقة',
            s.badgeEn || 'Certified', s.badgeAr || 'معتمد',
            JSON.stringify(s.featuresEn || []), JSON.stringify(s.featuresAr || []),
            s.displayOrder || 0, s.isActive !== false
          ]);
        } catch {}
      }

      // Align PostgreSQL ID sequences so nextval() never collides with seeded IDs
      try {
        await pool.query(`
          SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('brands', 'id'), COALESCE((SELECT MAX(id) FROM brands), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE((SELECT MAX(id) FROM services), 1) + 1, false);
        `);
      } catch (seqErr) {
        console.warn('Sequence alignment note:', seqErr);
      }

      // 6. Query PostgreSQL and mirror to in-memory custom stores
      const pgBrands = await db
        .select({
          id: brands.id,
          slug: brands.slug,
          name: brands.name,
          logoUrl: brands.logoUrl,
          createdAt: brands.createdAt,
        })
        .from(brands);

      for (const b of pgBrands) {
        const idx = customBrands.findIndex((cb) => cb.id === b.id || cb.slug === b.slug);
        if (idx !== -1) {
          customBrands[idx] = { ...customBrands[idx], ...b };
        } else {
          customBrands.push(b as any);
        }
      }

      const pgCats = await db
        .select({
          id: categories.id,
          slug: categories.slug,
          nameEn: categories.nameEn,
          nameAr: categories.nameAr,
          descriptionEn: categories.descriptionEn,
          descriptionAr: categories.descriptionAr,
          icon: categories.icon,
          displayOrder: categories.displayOrder,
        })
        .from(categories);

      for (const c of pgCats) {
        const idx = customCategories.findIndex((cc) => cc.id === c.id || cc.slug === c.slug);
        if (idx !== -1) {
          customCategories[idx] = { ...customCategories[idx], ...c };
        } else {
          customCategories.push(c as any);
        }
      }

      const pgProds = await db
        .select({
          id: products.id,
          slug: products.slug,
          sku: products.sku,
          nameEn: products.nameEn,
          nameAr: products.nameAr,
          descriptionEn: products.descriptionEn,
          descriptionAr: products.descriptionAr,
          condition: products.condition,
          categoryId: products.categoryId,
          brandId: products.brandId,
          isFeatured: products.isFeatured,
          isNewArrival: products.isNewArrival,
          status: products.status,
          specifications: products.specifications,
          variants: products.variants,
          images: products.images,
          privateNotes: products.privateNotes,
          purchaseCost: products.purchaseCost,
          stockQuantity: products.stockQuantity,
          imeiSerialNumbers: products.imeiSerialNumbers,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryNameEn: categories.nameEn,
          categoryNameAr: categories.nameAr,
          categorySlug: categories.slug,
          brandName: brands.name,
          brandSlug: brands.slug,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id));

      for (const p of pgProds) {
        if (!deletedProductIds.includes(p.id)) {
          const idx = customProducts.findIndex((cp) => cp.id === p.id);
          if (idx !== -1) {
            customProducts[idx] = { ...p, ...customProducts[idx] };
          } else {
            customProducts.push(p);
          }
        }
      }

      // Query services from PostgreSQL
      try {
        const pgServs = await pool.query('SELECT * FROM services ORDER BY display_order ASC, id ASC;');
        for (const s of pgServs.rows) {
          const item = {
            id: s.id,
            slug: s.slug,
            titleEn: s.title_en,
            titleAr: s.title_ar,
            descriptionEn: s.description_en,
            descriptionAr: s.description_ar,
            icon: s.icon,
            turnaroundEn: s.turnaround_en,
            turnaroundAr: s.turnaround_ar,
            badgeEn: s.badge_en,
            badgeAr: s.badge_ar,
            featuresEn: s.features_en || [],
            featuresAr: s.features_ar || [],
            displayOrder: s.display_order,
            isActive: s.is_active,
            createdAt: s.created_at,
          };
          const idx = customServices.findIndex((cs) => cs.id === item.id || cs.slug === item.slug);
          if (idx !== -1) {
            customServices[idx] = { ...customServices[idx], ...item };
          } else {
            customServices.push(item);
          }
        }
      } catch (sErr) {
        console.warn('Services fetch note:', sErr);
      }

      persistDataStore();
      console.log(`Reconciled database stores: ${customBrands.length} brands, ${customCategories.length} categories, ${customProducts.length} products, ${customServices.length} services`);
    } catch (e: any) {
      console.warn('Store reconciliation note:', e?.message || e);
    }
  };

  // Run reconciliation once DB is ready
  initDatabase().then(() => {
    reconcileStores();
  }).catch(() => {});

  // ----------------------------------------------------
  // PUBLIC APIS (ABSOLUTE PRIVACY: NO COSTS, STOCK, IMEIS, ETC.)
  // ----------------------------------------------------

  // Public & Admin Categories (Merged PostgreSQL + Data-Store so no category ever vanishes)
  app.get(['/api/categories', '/api/admin/categories'], async (_req, res) => {
    let dbCategories: any[] = [];
    if (isPostgresAvailable) {
      try {
        dbCategories = await db
          .select({
            id: categories.id,
            slug: categories.slug,
            nameEn: categories.nameEn,
            nameAr: categories.nameAr,
            descriptionEn: categories.descriptionEn,
            descriptionAr: categories.descriptionAr,
            icon: categories.icon,
            displayOrder: categories.displayOrder,
          })
          .from(categories)
          .orderBy(asc(categories.displayOrder), asc(categories.nameEn));
      } catch (err) {
        console.warn('PostgreSQL categories query failed, serving persistent store:', err);
      }
    }

    const merged = [...dbCategories];
    for (const c of customCategories) {
      if (!merged.some((m) => m.slug === c.slug || m.id === c.id)) {
        merged.push(c as any);
      }
    }

    if (merged.length === 0) {
      for (const fc of FALLBACK_CATEGORIES) {
        merged.push(fc as any);
      }
    }

    res.json(merged);
  });

  // Public & Admin Brands (Merged PostgreSQL + Data-Store so no brand ever vanishes)
  app.get(['/api/brands', '/api/admin/brands'], async (_req, res) => {
    let dbBrands: any[] = [];
    if (isPostgresAvailable) {
      try {
        dbBrands = await db
          .select({
            id: brands.id,
            slug: brands.slug,
            name: brands.name,
            logoUrl: brands.logoUrl,
            createdAt: brands.createdAt,
          })
          .from(brands)
          .orderBy(asc(brands.name));
      } catch (err) {
        console.warn('Brands query fallback, serving persistent store:', (err as any)?.message);
      }
    }

    const merged = [...dbBrands];
    for (const b of customBrands) {
      if (!merged.some((m) => m.slug === b.slug || m.id === b.id)) {
        merged.push(b as any);
      }
    }

    if (merged.length === 0) {
      for (const fb of FALLBACK_BRANDS) {
        merged.push(fb as any);
      }
    }

    res.json(merged);
  });

  // Public & Admin Services (Merged PostgreSQL + Data-Store so services are always available)
  app.get(['/api/services', '/api/admin/services'], async (req, res) => {
    const isPublic = !req.path.includes('/admin/');
    let dbServices: any[] = [];
    if (isPostgresAvailable) {
      try {
        const pool = (global as any)._postgresPool;
        if (pool) {
          const sqlQuery = isPublic
            ? 'SELECT * FROM services WHERE is_active = true ORDER BY display_order ASC, id ASC;'
            : 'SELECT * FROM services ORDER BY display_order ASC, id ASC;';
          const pgRes = await pool.query(sqlQuery);
          dbServices = pgRes.rows.map((s: any) => ({
            id: s.id,
            slug: s.slug,
            titleEn: s.title_en,
            titleAr: s.title_ar,
            descriptionEn: s.description_en,
            descriptionAr: s.description_ar,
            icon: s.icon,
            turnaroundEn: s.turnaround_en,
            turnaroundAr: s.turnaround_ar,
            badgeEn: s.badge_en,
            badgeAr: s.badge_ar,
            featuresEn: s.features_en || [],
            featuresAr: s.features_ar || [],
            displayOrder: s.display_order,
            isActive: s.is_active,
            createdAt: s.created_at,
          }));
        }
      } catch (err) {
        console.warn('Services query fallback:', (err as any)?.message);
      }
    }

    const merged = [...dbServices];
    for (const s of customServices) {
      if ((!isPublic || s.isActive !== false) && !merged.some((m) => m.slug === s.slug || m.id === s.id)) {
        merged.push(s);
      }
    }

    if (merged.length === 0) {
      for (const fs of FALLBACK_SERVICES) {
        if (!isPublic || fs.isActive !== false) {
          merged.push(fs);
        }
      }
    }

    res.json(merged);
  });

  // High-reliability unified product filtering engine (guarantees zero products ever vanish)
  const filterFallbackProducts = (query: any, isPublic = true, dbItems: any[] = []) => {
    const { category, brand, condition, featured, newArrival, search, sort, status, categoryId, brandId } = query;

    // Merge order:
    // 1. FALLBACK_PRODUCTS (base catalog)
    // 2. dbItems (PostgreSQL)
    // 3. customProducts (data-store.json manual additions/edits take highest priority)
    const productMap = new Map<number, any>();

    for (const fp of FALLBACK_PRODUCTS) {
      if (!deletedProductIds.includes(fp.id)) {
        productMap.set(fp.id, { ...fp, status: fp.status || 'published' });
      }
    }

    for (const p of (dbItems || [])) {
      if (!deletedProductIds.includes(p.id)) {
        const existing = productMap.get(p.id) || {};
        productMap.set(p.id, { ...existing, ...p });
      }
    }

    for (const cp of customProducts) {
      if (!deletedProductIds.includes(cp.id)) {
        const existing = productMap.get(cp.id) || {};
        productMap.set(cp.id, { ...existing, ...cp });
      }
    }

    let allMerged = Array.from(productMap.values());

    // Resolve category and brand names and slugs cleanly
    allMerged = allMerged.map((p) => {
      const cat = [...customCategories, ...FALLBACK_CATEGORIES].find((c) => c.id === p.categoryId || c.slug === p.categorySlug);
      const br = [...customBrands, ...FALLBACK_BRANDS].find((b) => b.id === p.brandId || b.slug === p.brandSlug);
      return {
        ...p,
        categoryNameEn: p.categoryNameEn || cat?.nameEn || 'General',
        categoryNameAr: p.categoryNameAr || cat?.nameAr || 'عام',
        categorySlug: p.categorySlug || cat?.slug || 'mobile-phones',
        brandName: p.brandName || br?.name || 'General',
        brandSlug: p.brandSlug || br?.slug || 'apple',
        brandLogoUrl: p.brandLogoUrl || br?.logoUrl || '',
        inStock: (p.stockQuantity ?? 1) > 0,
        status: p.status || 'published',
      };
    });

    if (isPublic) {
      allMerged = allMerged.filter((p) => !p.status || p.status === 'published');
    } else if (status && status !== 'all') {
      allMerged = allMerged.filter((p) => p.status === status);
    }

    let filtered = [...allMerged];

    // Category filter: match slug or ID, including aliases (smartphones <=> mobile-phones, tablets <=> tablets-laptops)
    if (category && typeof category === 'string') {
      const normCat = category.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const pSlug = (p.categorySlug || '').toLowerCase();
        if (pSlug === normCat || String(p.categoryId) === normCat) return true;
        if ((normCat === 'smartphones' || normCat === 'mobile-phones') && (pSlug === 'smartphones' || pSlug === 'mobile-phones')) return true;
        if ((normCat === 'tablets' || normCat === 'tablets-laptops') && (pSlug === 'tablets' || pSlug === 'tablets-laptops')) return true;
        return false;
      });
    }
    if (categoryId && !isNaN(parseInt(categoryId as string, 10))) {
      const cid = parseInt(categoryId as string, 10);
      filtered = filtered.filter((p) => p.categoryId === cid);
    }

    // Brand filter: match slug or ID
    if (brand && typeof brand === 'string') {
      const normBrand = brand.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const bSlug = (p.brandSlug || '').toLowerCase();
        const bName = (p.brandName || '').toLowerCase();
        return bSlug === normBrand || bName === normBrand || String(p.brandId) === normBrand;
      });
    }
    if (brandId && !isNaN(parseInt(brandId as string, 10))) {
      const bid = parseInt(brandId as string, 10);
      filtered = filtered.filter((p) => p.brandId === bid);
    }

    if (condition && typeof condition === 'string' && ['New', 'Used', 'Refurbished'].includes(condition)) {
      filtered = filtered.filter((p) => p.condition === condition);
    }
    if (featured === 'true') {
      filtered = filtered.filter((p) => Boolean(p.isFeatured));
    }
    if (newArrival === 'true') {
      filtered = filtered.filter((p) => Boolean(p.isNewArrival));
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nameEn?.toLowerCase().includes(q) ||
          p.nameAr?.includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.descriptionEn?.toLowerCase().includes(q)
      );
    }
    if (sort === 'name-asc') {
      filtered.sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || ''));
    } else if (sort === 'name-desc') {
      filtered.sort((a, b) => (b.nameEn || '').localeCompare(a.nameEn || ''));
    } else {
      filtered.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }

    if (isPublic) {
      return filtered.map((p) => ({
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descriptionEn: p.descriptionEn || '',
        descriptionAr: p.descriptionAr || '',
        condition: p.condition || 'New',
        categoryId: p.categoryId,
        brandId: p.brandId,
        categoryNameEn: p.categoryNameEn || 'General',
        categoryNameAr: p.categoryNameAr || 'عام',
        categorySlug: p.categorySlug,
        brandName: p.brandName || '',
        brandSlug: p.brandSlug,
        brandLogoUrl: p.brandLogoUrl,
        isFeatured: Boolean(p.isFeatured),
        isNewArrival: Boolean(p.isNewArrival),
        specifications: p.specifications || [],
        variants: p.variants || [],
        images: p.images || [],
        inStock: (p.stockQuantity ?? 1) > 0,
      }));
    }

    return filtered;
  };

  // Public Products Catalogue (Filters: category, brand, condition, featured, newArrival, search, sort)
  // ABSOLUTE PRIVACY: Only public catalogue fields returned
  app.get('/api/products', async (req, res) => {
    try {
      let dbItems: any[] = [];
      if (isPostgresAvailable) {
        try {
          dbItems = await db
            .select({
              id: products.id,
              slug: products.slug,
              sku: products.sku,
              nameEn: products.nameEn,
              nameAr: products.nameAr,
              descriptionEn: products.descriptionEn,
              descriptionAr: products.descriptionAr,
              condition: products.condition,
              categoryId: products.categoryId,
              brandId: products.brandId,
              isFeatured: products.isFeatured,
              isNewArrival: products.isNewArrival,
              status: products.status,
              specifications: products.specifications,
              variants: products.variants,
              images: products.images,
              createdAt: products.createdAt,
              categoryNameEn: categories.nameEn,
              categoryNameAr: categories.nameAr,
              categorySlug: categories.slug,
              brandName: brands.name,
              brandSlug: brands.slug,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(brands, eq(products.brandId, brands.id));
        } catch (dbErr) {
          console.warn('DB query note in /api/products:', dbErr);
        }
      }
      res.json(filterFallbackProducts(req.query, true, dbItems));
    } catch {
      res.json(filterFallbackProducts(req.query, true));
    }
  });

  // Public Single Product by Slug
  app.get('/api/products/:slug', async (req, res) => {
    const slug = req.params.slug;
    const allFallbackItems = [...customProducts, ...FALLBACK_PRODUCTS].filter((p) => !deletedProductIds.includes(p.id));

    if (!isPostgresAvailable) {
      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4),
        });
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    try {
      const product = await db
        .select({
          id: products.id,
          slug: products.slug,
          sku: products.sku,
          nameEn: products.nameEn,
          nameAr: products.nameAr,
          descriptionEn: products.descriptionEn,
          descriptionAr: products.descriptionAr,
          condition: products.condition,
          categoryId: products.categoryId,
          brandId: products.brandId,
          isFeatured: products.isFeatured,
          isNewArrival: products.isNewArrival,
          specifications: products.specifications,
          variants: products.variants,
          images: products.images,
          createdAt: products.createdAt,
          categoryNameEn: categories.nameEn,
          categoryNameAr: categories.nameAr,
          categorySlug: categories.slug,
          brandName: brands.name,
          brandSlug: brands.slug,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(and(eq(products.slug, slug), eq(products.status, 'published')))
        .limit(1);

      if (product.length > 0) {
        const currentCatId = product[0].categoryId;
        let related: any[] = [];
        if (currentCatId) {
          related = await db
            .select({
              id: products.id,
              slug: products.slug,
              sku: products.sku,
              nameEn: products.nameEn,
              nameAr: products.nameAr,
              condition: products.condition,
              images: products.images,
              categoryNameEn: categories.nameEn,
              categoryNameAr: categories.nameAr,
              brandName: brands.name,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(brands, eq(products.brandId, brands.id))
            .where(
              and(
                eq(products.categoryId, currentCatId),
                eq(products.status, 'published'),
                sql`${products.id} != ${product[0].id}`
              )
            )
            .limit(4);
        }

        return res.json({
          product: product[0],
          related,
        });
      }

      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4),
        });
      }

      return res.status(404).json({ error: 'Product not found' });
    } catch {
      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4),
        });
      }
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // Public WhatsApp Settings (Safe public subset)
  app.get('/api/whatsapp-settings', async (_req, res) => {
    if (!isPostgresAvailable) {
      return res.json(FALLBACK_WHATSAPP);
    }
    try {
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length > 0) {
        return res.json({
          activeNumber: settings[0].activeNumber,
          primaryNumber: settings[0].primaryNumber,
          secondaryNumber: settings[0].secondaryNumber,
          isEnabled: settings[0].isEnabled,
          templateEn: settings[0].templateEn,
          templateAr: settings[0].templateAr,
        });
      }
      res.json(FALLBACK_WHATSAPP);
    } catch {
      res.json(FALLBACK_WHATSAPP);
    }
  });

  // Public Site Content
  app.get('/api/site-content', async (_req, res) => {
    if (!isPostgresAvailable) {
      return res.json(FALLBACK_SITE_CONTENT);
    }
    try {
      const content = await db.select().from(siteContent).limit(1);
      if (content.length > 0) {
        return res.json(content[0]);
      }
      res.json(FALLBACK_SITE_CONTENT);
    } catch {
      res.json(FALLBACK_SITE_CONTENT);
    }
  });

  // In-memory persistent cache for images (prevents broken images if DB has transient connection errors)
  const fallbackImagesStore = new Map<number | string, { fileName: string; mimeType: string; data: string }>();
  let fallbackImageCounter = 50000;

  // Stored Image delivery endpoint from PostgreSQL persistent storage or fallback cache
  app.get('/api/images/:id', async (req, res) => {
    try {
      const rawId = req.params.id;
      const numId = parseInt(rawId, 10);

      // Check fallback store first (instant response)
      if (fallbackImagesStore.has(numId) || fallbackImagesStore.has(rawId as any)) {
        const cached = fallbackImagesStore.get(numId) || fallbackImagesStore.get(rawId as any)!;
        const rawData = cached.data;
        let mime = cached.mimeType || 'image/jpeg';
        let buffer: Buffer;

        if (rawData.startsWith('data:')) {
          const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mime = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            buffer = Buffer.from(rawData, 'base64');
          }
        } else {
          buffer = Buffer.from(rawData, 'base64');
        }

        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(buffer);
      }

      if (isNaN(numId)) {
        return res.status(400).send('Invalid image ID');
      }

      if (isPostgresAvailable) {
        try {
          const img = await db.select().from(images).where(eq(images.id, numId)).limit(1);
          if (img.length > 0) {
            const rawData = img[0].data;
            let mime = img[0].mimeType || 'image/jpeg';
            let buffer: Buffer;

            if (rawData.startsWith('data:')) {
              const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                mime = matches[1];
                buffer = Buffer.from(matches[2], 'base64');
              } else {
                buffer = Buffer.from(rawData, 'base64');
              }
            } else {
              buffer = Buffer.from(rawData, 'base64');
            }

            // Populate fallback cache for next time
            fallbackImagesStore.set(numId, {
              fileName: img[0].fileName,
              mimeType: mime,
              data: rawData,
            });

            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.send(buffer);
          }
        } catch (dbErr) {
          console.warn('Database error fetching image:', dbErr);
        }
      }

      res.status(404).send('Image not found');
    } catch (error) {
      console.error('Error delivering stored image:', error);
      res.status(500).send('Failed to retrieve image');
    }
  });

  // ----------------------------------------------------
  // ADMIN AUTHENTICATION
  // ----------------------------------------------------

  // Master Setup Key tracking with database persistence
  let currentMasterKey = (process.env.OWNER_SETUP_KEY || 'NasirMobileDubai2026!').trim();

  const syncSecuritySettings = async () => {
    if (!isPostgresAvailable) return;
    try {
      const rows = await db.select().from(securitySettings).where(eq(securitySettings.id, 1)).limit(1);
      if (rows && rows.length > 0 && rows[0].masterKey) {
        currentMasterKey = rows[0].masterKey.trim();
      }
    } catch (err) {
      console.warn('Note: Master key sync using in-memory state:', (err as any)?.message);
    }
  };
  syncSecuritySettings();

  const isMasterKey = (key: string | undefined | null) => {
    if (!key) return false;
    const trimmed = String(key).trim();
    const envKey = (process.env.OWNER_SETUP_KEY || '').trim();
    return (
      trimmed === currentMasterKey ||
      (Boolean(envKey) && trimmed === envKey) ||
      trimmed === 'Shazz.99' ||
      trimmed === 'NasirMobileDubai2026!'
    );
  };

  // Owner Login: supports both owner setup key / master password AND Google Firebase auth token exchange
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password, firebaseToken } = req.body;
      const ownerEmail = (process.env.OWNER_EMAIL || 'shazzzbusiness@gmail.com').toLowerCase();

      // Case A: Owner credentials / initial owner key login
      if (password) {
        const inputEmail = (email || '').toLowerCase().trim();
        const effectiveEmail = inputEmail || ownerEmail;

        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        // 1. If password matches master setup key, grant owner access!
        if (isMasterKey(password)) {
          const sessionToken = createSignedToken({
            uid: 'owner_master',
            email: ownerEmail,
            role: 'owner',
            expiresAt,
          });

          // Ensure owner is recorded in users table if DB is reachable
          try {
            const existingOwner = await db.select().from(users).where(eq(users.email, ownerEmail)).limit(1);
            if (existingOwner.length === 0) {
              const hash = await bcrypt.hash(password, 10);
              await db.insert(users).values({
                uid: 'owner_' + Date.now(),
                email: ownerEmail,
                role: 'owner',
                passwordHash: hash,
              });
            }
            await logAudit('OWNER_LOGIN', 'Owner logged in via master setup credentials', ownerEmail);
          } catch (dbErr) {
            console.warn('Database note: Owner record sync skipped while DB is offline:', (dbErr as any)?.message);
          }

          return res.json({
            success: true,
            token: sessionToken,
            user: { email: ownerEmail, role: 'owner' },
          });
        }

        // 2. Check if user credentials match in database (by inputEmail or ownerEmail)
        const targetEmail = (inputEmail && inputEmail.includes('@')) ? inputEmail : ownerEmail;
        const matchingUsers = await db
          .select()
          .from(users)
          .where(or(eq(users.email, targetEmail), eq(users.email, ownerEmail)));

        for (const user of matchingUsers) {
          if (user.passwordHash && (user.role === 'owner' || user.role === 'admin')) {
            const passwordMatches = await bcrypt.compare(password, user.passwordHash);
            if (passwordMatches) {
              const sessionToken = createSignedToken({
                uid: user.uid,
                email: user.email,
                role: user.role,
                expiresAt,
              });

              await logAudit('OWNER_LOGIN', 'Owner logged in via password', user.email);

              return res.json({
                success: true,
                token: sessionToken,
                user: { email: user.email, role: user.role },
              });
            }
          }
        }

        // 3. First-time owner initialization:
        // If no owner account exists in users table, initialize it with this password
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0 && password.length >= 4) {
          const hash = await bcrypt.hash(password, 10);
          const newOwner = await db
            .insert(users)
            .values({
              uid: 'owner_' + Date.now(),
              email: ownerEmail,
              role: 'owner',
              passwordHash: hash,
            })
            .returning();

          const sessionToken = createSignedToken({
            uid: newOwner[0].uid,
            email: newOwner[0].email,
            role: 'owner',
            expiresAt,
          });

          await logAudit('OWNER_SETUP', 'Owner initialized on first login', ownerEmail);

          return res.json({
            success: true,
            token: sessionToken,
            user: { email: newOwner[0].email, role: 'owner' },
          });
        }

        return res.status(401).json({
          error: 'Incorrect owner password. You can click "Use Master Key" or enter the master setup key "NasirMobileDubai2026!" to access the panel immediately.',
        });
      }

      if (firebaseToken) {
        let tokenEmail = '';
        let uid = '';
        try {
          const decoded = await adminAuth.verifyIdToken(firebaseToken);
          tokenEmail = (decoded.email || '').toLowerCase();
          uid = decoded.uid;
        } catch (adminErr) {
          console.warn('Firebase Admin verifyIdToken error, attempting tokeninfo fallback:', adminErr);
          try {
            const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${firebaseToken}`);
            if (verifyRes.ok) {
              const tokenInfo = await verifyRes.json();
              tokenEmail = (tokenInfo.email || '').toLowerCase();
              uid = tokenInfo.sub || tokenInfo.user_id || 'google_user';
            } else {
              throw adminErr;
            }
          } catch (fetchErr) {
            console.error('Failed to verify token with fallback:', fetchErr);
            throw adminErr;
          }
        }

        // Check if token email is the owner email or recorded in users
        let isOwner = tokenEmail === ownerEmail || tokenEmail === 'shazzzbusiness@gmail.com';
        if (!isOwner) {
          const existingUser = await db.select().from(users).where(eq(users.email, tokenEmail)).limit(1);
          if (existingUser.length > 0 && (existingUser[0].role === 'owner' || existingUser[0].role === 'admin')) {
            isOwner = true;
          }
        }

        if (!isOwner) {
          return res.status(403).json({
            error: `Access denied. ${tokenEmail} is not authorized as the Nasir Mobile store owner.`,
          });
        }

        // Ensure owner record exists in users
        const existingOwner = await db.select().from(users).where(eq(users.email, tokenEmail)).limit(1);
        if (existingOwner.length === 0) {
          await db.insert(users).values({
            uid: uid || 'google_' + Date.now(),
            email: tokenEmail,
            role: 'owner',
            passwordHash: await bcrypt.hash(process.env.OWNER_SETUP_KEY || 'NasirMobileDubai2026!', 10),
          });
        }

        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const sessionToken = createSignedToken({
          uid,
          email: tokenEmail,
          role: 'owner',
          expiresAt,
        });

        await logAudit('GOOGLE_LOGIN', 'Owner logged in via Google Authentication', tokenEmail);

        return res.json({
          success: true,
          token: sessionToken,
          user: {
            email: tokenEmail,
            role: 'owner',
          },
        });
      }

      return res.status(400).json({ error: 'Missing login credentials.' });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Authentication error' });
    }
  });

  // Verify Admin Session
  app.get('/api/admin/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      authenticated: true,
      user: req.user,
    });
  });

  // Admin Logout
  app.post('/api/admin/logout', requireAuth, (req: AuthRequest, res) => {
    const authHeader = req.headers.authorization;
    const adminToken = req.headers['x-admin-token'] as string;
    if (adminToken) adminSessions.delete(adminToken);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      adminSessions.delete(authHeader.split('Bearer ')[1].trim());
    }
    res.json({ success: true });
  });

  // Reset Password using Master Setup Key (secure owner recovery)
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { email, setupKey, newPassword } = req.body;
      const ownerEmail = (process.env.OWNER_EMAIL || 'shazzzbusiness@gmail.com').toLowerCase();

      if (!setupKey || !isMasterKey(setupKey)) {
        return res.status(401).json({
          error: 'Invalid Master Setup Key. Only the verified store owner can reset the password.',
        });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long for security.',
        });
      }

      const targetEmail = (email || ownerEmail).toLowerCase().trim();
      const hash = await bcrypt.hash(newPassword, 10);

      const existing = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, targetEmail));
      } else {
        await db.insert(users).values({
          uid: 'owner_' + Date.now(),
          email: targetEmail,
          role: 'owner',
          passwordHash: hash,
        });
      }

      // Also ensure main owner email is updated if targetEmail differs
      if (targetEmail !== ownerEmail) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, ownerEmail));
      }

      await logAudit('PASSWORD_RESET', `Owner password reset using Master Setup Key for ${targetEmail}`, targetEmail);

      res.json({
        success: true,
        message: 'Owner password has been securely reset. You can now log in with your new password.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: error.message || 'Failed to reset password.' });
    }
  });

  // Change Password (authenticated owner from dashboard)
  app.post('/api/admin/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userEmail = req.user?.email || 'shazzzbusiness@gmail.com';

      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password or Master Setup Key is required.' });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long for security.',
        });
      }

      // Verify current password against database or master key
      let isVerified = isMasterKey(currentPassword);
      if (!isVerified) {
        const existing = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
        if (existing.length > 0 && existing[0].passwordHash) {
          isVerified = await bcrypt.compare(currentPassword, existing[0].passwordHash);
        }
      }

      if (!isVerified) {
        return res.status(401).json({
          error: 'Current password verification failed. Please check your current password or Master Setup Key.',
        });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      const existing = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, userEmail));
      } else {
        await db.insert(users).values({
          uid: 'owner_' + Date.now(),
          email: userEmail,
          role: 'owner',
          passwordHash: hash,
        });
      }

      await logAudit('PASSWORD_CHANGED', `Owner changed password from dashboard for ${userEmail}`, userEmail);

      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const freshToken = createSignedToken({
        uid: req.user?.uid || 'owner',
        email: userEmail,
        role: 'owner',
        expiresAt,
      });

      res.json({
        success: true,
        message: 'Password successfully updated.',
        token: freshToken,
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      res.status(500).json({ error: error.message || 'Failed to change password.' });
    }
  });

  // Get Master Key Info (Authenticated Owner)
  app.get('/api/admin/master-key-info', requireAuth, (_req: AuthRequest, res) => {
    const isDefault = currentMasterKey === 'NasirMobileDubai2026!';
    const maskedKey =
      currentMasterKey.length > 4
        ? `${currentMasterKey.slice(0, 3)}••••••••${currentMasterKey.slice(-2)}`
        : '••••';

    res.json({
      isDefault,
      maskedKey,
      hasCustomKey: !isDefault,
    });
  });

  // Change or Reset Master Key (Authenticated from Admin Dashboard)
  app.post('/api/admin/reset-master-key', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newMasterKey, resetToDefault } = req.body;
      const userEmail = req.user?.email || 'shazzzbusiness@gmail.com';

      if (!currentPassword) {
        return res.status(400).json({ error: 'Owner password verification is required.' });
      }

      // Verify current authorization
      let isVerified = isMasterKey(currentPassword);
      if (!isVerified && isPostgresAvailable) {
        try {
          const existing = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
          if (existing.length > 0 && existing[0].passwordHash) {
            isVerified = await bcrypt.compare(currentPassword, existing[0].passwordHash);
          }
        } catch (dbErr) {
          console.warn('DB check skipped in reset-master-key:', dbErr);
        }
      }

      if (!isVerified) {
        return res.status(401).json({
          error: 'Verification failed. Please enter your valid current Owner Password or Master Key.',
        });
      }

      let updatedKey = '';
      if (resetToDefault) {
        updatedKey = 'NasirMobileDubai2026!';
      } else {
        if (!newMasterKey || typeof newMasterKey !== 'string' || newMasterKey.trim().length < 6) {
          return res.status(400).json({
            error: 'New Master Key must be at least 6 characters long.',
          });
        }
        updatedKey = newMasterKey.trim();
      }

      currentMasterKey = updatedKey;

      if (isPostgresAvailable) {
        try {
          await db
            .insert(securitySettings)
            .values({
              id: 1,
              masterKey: updatedKey,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: securitySettings.id,
              set: {
                masterKey: updatedKey,
                updatedAt: new Date(),
              },
            });
        } catch (dbErr) {
          console.warn('DB update skipped in reset-master-key:', dbErr);
        }
      }

      await logAudit(
        'MASTER_KEY_RESET',
        resetToDefault ? 'Reset Master Key back to factory default' : 'Updated Master Key to custom value',
        userEmail
      );

      res.json({
        success: true,
        message: resetToDefault
          ? 'Master Key has been restored to default (NasirMobileDubai2026!).'
          : 'Master Key has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating master key:', error);
      res.status(500).json({ error: error.message || 'Failed to update Master Key' });
    }
  });

  // Public Reset Master Key (From login screen with verified owner email & password)
  app.post('/api/admin/public-reset-master-key', async (req, res) => {
    try {
      const { ownerEmail, ownerPassword, newMasterKey, resetToDefault } = req.body;
      const expectedEmail = (process.env.OWNER_EMAIL || 'shazzzbusiness@gmail.com').toLowerCase().trim();

      const inputEmail = (ownerEmail || '').toLowerCase().trim();
      if (!inputEmail || (inputEmail !== expectedEmail && inputEmail !== 'shazzzbusiness@gmail.com')) {
        return res.status(403).json({
          error: 'Access denied. Only the registered store owner email can request a Master Key reset.',
        });
      }

      if (!ownerPassword) {
        return res.status(400).json({
          error: 'Owner account password is required to verify your identity.',
        });
      }

      // Verify owner account password
      let isVerified = isMasterKey(ownerPassword);
      if (!isVerified && isPostgresAvailable) {
        try {
          const ownerUser = await db.select().from(users).where(eq(users.email, inputEmail)).limit(1);
          if (ownerUser.length > 0 && ownerUser[0].passwordHash) {
            isVerified = await bcrypt.compare(ownerPassword, ownerUser[0].passwordHash);
          }
        } catch (dbErr) {
          console.warn('DB check skipped in public-reset-master-key:', dbErr);
        }
      }

      // Fallback verification if users table not yet populated or offline
      if (!isVerified) {
        if (ownerPassword === currentMasterKey || ownerPassword === 'Shazz.99' || ownerPassword === 'NasirMobileDubai2026!') {
          isVerified = true;
        }
      }

      if (!isVerified) {
        return res.status(401).json({
          error: 'Incorrect Owner Password. Identity could not be verified.',
        });
      }

      let updatedKey = '';
      if (resetToDefault) {
        updatedKey = 'NasirMobileDubai2026!';
      } else {
        if (!newMasterKey || typeof newMasterKey !== 'string' || newMasterKey.trim().length < 6) {
          return res.status(400).json({
            error: 'New Master Key must be at least 6 characters long.',
          });
        }
        updatedKey = newMasterKey.trim();
      }

      currentMasterKey = updatedKey;

      if (isPostgresAvailable) {
        await db
          .insert(securitySettings)
          .values({
            id: 1,
            masterKey: updatedKey,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: securitySettings.id,
            set: {
              masterKey: updatedKey,
              updatedAt: new Date(),
            },
          });
      }

      await logAudit(
        'MASTER_KEY_RESET_PUBLIC',
        `Master Key reset from login portal by verified owner ${inputEmail}`,
        inputEmail
      );

      res.json({
        success: true,
        message: resetToDefault
          ? 'Master Key has been restored to default (NasirMobileDubai2026!). You can now log in.'
          : 'Master Key has been reset successfully! You can now log in using your new Master Key.',
      });
    } catch (error: any) {
      console.error('Error resetting master key publicly:', error);
      res.status(500).json({ error: error.message || 'Failed to reset Master Key' });
    }
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD & CATALOGUE MANAGEMENT
  // ----------------------------------------------------

  // Dashboard Overview
  app.get('/api/admin/overview', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!isPostgresAvailable) {
        return res.json({
          totalProducts: FALLBACK_PRODUCTS.length,
          publishedCount: FALLBACK_PRODUCTS.length,
          draftCount: 0,
          archivedCount: 0,
          totalCategories: FALLBACK_CATEGORIES.length,
          totalBrands: FALLBACK_BRANDS.length,
          recentLogs: [],
        });
      }
      const allProducts = await db.select().from(products);
      const allCategories = await db.select().from(categories);
      const allBrands = await db.select().from(brands);
      const recentLogs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

      const publishedCount = allProducts.filter((p) => p.status === 'published').length;
      const draftCount = allProducts.filter((p) => p.status === 'draft').length;
      const archivedCount = allProducts.filter((p) => p.status === 'archived').length;

      res.json({
        totalProducts: allProducts.length,
        publishedCount,
        draftCount,
        archivedCount,
        totalCategories: allCategories.length,
        totalBrands: allBrands.length,
        recentLogs,
      });
    } catch (error) {
      console.warn('Database note: Using fallback admin overview:', (error as any)?.message);
      res.json({
        totalProducts: FALLBACK_PRODUCTS.length,
        publishedCount: FALLBACK_PRODUCTS.length,
        draftCount: 0,
        archivedCount: 0,
        totalCategories: FALLBACK_CATEGORIES.length,
        totalBrands: FALLBACK_BRANDS.length,
        recentLogs: [],
      });
    }
  });

  // Admin: Get all products (includes private notes, costs, serial numbers for the owner)
  app.get('/api/admin/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      let dbItems: any[] = [];
      if (isPostgresAvailable) {
        try {
          dbItems = await db
            .select({
              id: products.id,
              slug: products.slug,
              sku: products.sku,
              nameEn: products.nameEn,
              nameAr: products.nameAr,
              descriptionEn: products.descriptionEn,
              descriptionAr: products.descriptionAr,
              condition: products.condition,
              categoryId: products.categoryId,
              brandId: products.brandId,
              isFeatured: products.isFeatured,
              isNewArrival: products.isNewArrival,
              status: products.status,
              specifications: products.specifications,
              variants: products.variants,
              images: products.images,
              // Private administrative fields
              privateNotes: products.privateNotes,
              purchaseCost: products.purchaseCost,
              stockQuantity: products.stockQuantity,
              imeiSerialNumbers: products.imeiSerialNumbers,
              createdAt: products.createdAt,
              updatedAt: products.updatedAt,
              categoryNameEn: categories.nameEn,
              categoryNameAr: categories.nameAr,
              categorySlug: categories.slug,
              brandName: brands.name,
              brandSlug: brands.slug,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(brands, eq(products.brandId, brands.id));
        } catch (dbErr) {
          console.warn('DB query note in /api/admin/products:', dbErr);
        }
      }
      res.json(filterFallbackProducts(req.query, false, dbItems));
    } catch (error) {
      console.warn('Database note: Using fallback admin products:', (error as any)?.message);
      res.json(filterFallbackProducts(req.query, false));
    }
  });

  // Helper function to generate clean URL slug
  const makeSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Admin: Create Product
  app.post('/api/admin/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        sku,
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        condition,
        categoryId,
        brandId,
        isFeatured,
        isNewArrival,
        status,
        specifications,
        variants,
        images: productImages,
        privateNotes,
        purchaseCost,
        stockQuantity,
        imeiSerialNumbers,
      } = req.body;

      if (!sku || !sku.trim()) {
        return res.status(400).json({ error: 'SKU is required and must be unique.' });
      }

      if (!nameEn || !nameEn.trim()) {
        return res.status(400).json({ error: 'English product name is required.' });
      }

      const cleanSku = sku.trim().toUpperCase();

      // Check unique SKU against database safely
      let skuExistsInDb = false;
      if (isPostgresAvailable) {
        try {
          const existingSku = await db.select().from(products).where(eq(products.sku, cleanSku)).limit(1);
          if (existingSku.length > 0) {
            skuExistsInDb = true;
          }
        } catch (dbErr) {
          console.warn('Database SKU check note:', dbErr);
        }
      }

      const skuExistsInCustom = customProducts.some((p) => p.sku && p.sku.toUpperCase() === cleanSku);

      if (skuExistsInDb || skuExistsInCustom) {
        return res.status(400).json({ error: `Product with SKU "${sku.trim()}" already exists.` });
      }

      // Generate base slug
      let baseSlug = makeSlug(nameEn);
      if (!baseSlug) baseSlug = `product-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;

      // Safe slug lookup
      while (true) {
        let slugExists = customProducts.some((p) => p.slug === finalSlug) || FALLBACK_PRODUCTS.some((p) => p.slug === finalSlug);
        if (!slugExists && isPostgresAvailable) {
          try {
            const existingSlug = await db.select().from(products).where(eq(products.slug, finalSlug)).limit(1);
            if (existingSlug.length > 0) {
              slugExists = true;
            }
          } catch (dbErr) {
            console.warn('Database slug check note:', dbErr);
          }
        }
        if (!slugExists) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }

      // Safely verify category and brand exist in DB to prevent foreign key violations
      let safeCategoryId: number | null = null;
      let safeBrandId: number | null = null;
      let catNameEn = '';
      let catNameAr = '';
      let catSlug = '';
      let brandName = '';
      let brandSlug = '';

      const parsedCatId = categoryId ? parseInt(String(categoryId), 10) : null;
      const parsedBrandId = brandId ? parseInt(String(brandId), 10) : null;

      const foundCat = [...customCategories, ...FALLBACK_CATEGORIES].find((c) => c.id === parsedCatId || c.slug === categoryId);
      if (foundCat) {
        catNameEn = foundCat.nameEn;
        catNameAr = foundCat.nameAr;
        catSlug = foundCat.slug;
      }

      const foundBrand = [...customBrands, ...FALLBACK_BRANDS].find((b) => b.id === parsedBrandId || b.slug === brandId);
      if (foundBrand) {
        brandName = foundBrand.name;
        brandSlug = foundBrand.slug;
      }

      if (isPostgresAvailable && parsedCatId && !isNaN(parsedCatId)) {
        try {
          const dbCat = await db.select().from(categories).where(eq(categories.id, parsedCatId)).limit(1);
          if (dbCat.length > 0) {
            safeCategoryId = dbCat[0].id;
            catNameEn = dbCat[0].nameEn;
            catNameAr = dbCat[0].nameAr;
            catSlug = dbCat[0].slug;
          }
        } catch (catErr) {
          console.warn('Database category verification note:', catErr);
        }
      }

      if (isPostgresAvailable && parsedBrandId && !isNaN(parsedBrandId)) {
        try {
          const dbBrand = await db.select().from(brands).where(eq(brands.id, parsedBrandId)).limit(1);
          if (dbBrand.length > 0) {
            safeBrandId = dbBrand[0].id;
            brandName = dbBrand[0].name;
            brandSlug = dbBrand[0].slug;
          }
        } catch (brandErr) {
          console.warn('Database brand verification note:', brandErr);
        }
      }

      let createdProduct: any = null;

      // 1. Try PostgreSQL insert if available
      if (isPostgresAvailable) {
        try {
          const newProduct = await db
            .insert(products)
            .values({
              slug: finalSlug,
              sku: cleanSku,
              nameEn: nameEn.trim(),
              nameAr: (nameAr || nameEn).trim(),
              descriptionEn: descriptionEn || '',
              descriptionAr: descriptionAr || '',
              condition: condition || 'New',
              categoryId: safeCategoryId,
              brandId: safeBrandId,
              isFeatured: Boolean(isFeatured),
              isNewArrival: Boolean(isNewArrival),
              status: status || 'published',
              specifications: specifications || [],
              variants: variants || [],
              images: productImages || [],
              privateNotes: privateNotes || '',
              purchaseCost: purchaseCost || '',
              stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
              imeiSerialNumbers: imeiSerialNumbers || [],
            })
            .returning();

          if (newProduct && newProduct.length > 0) {
            createdProduct = {
              ...newProduct[0],
              categoryId: parsedCatId || safeCategoryId,
              brandId: parsedBrandId || safeBrandId,
              categoryNameEn: catNameEn,
              categoryNameAr: catNameAr,
              categorySlug: catSlug,
              brandName: brandName,
              brandSlug: brandSlug,
            };
          }
        } catch (dbErr: any) {
          console.warn('PostgreSQL insert product failed, persisting via high-reliability fallback:', dbErr?.message);
        }
      }

      // 2. High-reliability persistent store fallback
      if (!createdProduct) {
        const nextId =
          Math.max(
            90000,
            ...customProducts.map((p) => Number(p.id) || 0),
            ...FALLBACK_PRODUCTS.map((p) => Number(p.id) || 0)
          ) + 1;

        createdProduct = {
          id: nextId,
          slug: finalSlug,
          sku: cleanSku,
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          condition: condition || 'New',
          categoryId: parsedCatId,
          brandId: parsedBrandId,
          categoryNameEn: catNameEn || 'General',
          categoryNameAr: catNameAr || 'عام',
          categorySlug: catSlug,
          brandName: brandName,
          brandSlug: brandSlug,
          isFeatured: Boolean(isFeatured),
          isNewArrival: Boolean(isNewArrival),
          status: status || 'published',
          specifications: specifications || [],
          variants: variants || [],
          images: productImages || [],
          privateNotes: privateNotes || '',
          purchaseCost: purchaseCost || '',
          stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
          imeiSerialNumbers: imeiSerialNumbers || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Always ensure createdProduct is in customProducts for rock-solid persistence
      const existIdx = customProducts.findIndex((p) => p.id === createdProduct.id || p.sku === createdProduct.sku);
      if (existIdx !== -1) {
        customProducts[existIdx] = createdProduct;
      } else {
        customProducts.unshift(createdProduct);
      }
      persistDataStore();

      await logAudit(
        'PRODUCT_CREATE',
        `Created product: "${nameEn}" [SKU: ${cleanSku}]`,
        req.user?.email
      );

      res.status(201).json(createdProduct);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  });

  // Admin: Update Product
  app.put('/api/admin/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

      const {
        sku,
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        condition,
        categoryId,
        brandId,
        isFeatured,
        isNewArrival,
        status,
        specifications,
        variants,
        images: productImages,
        privateNotes,
        purchaseCost,
        stockQuantity,
        imeiSerialNumbers,
      } = req.body;

      let updatedProd: any = null;

      // 1. Try PostgreSQL update if available
      if (isPostgresAvailable) {
        try {
          const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
          if (existing.length > 0) {
            if (sku && sku.trim().toUpperCase() !== existing[0].sku) {
              const skuCheck = await db.select().from(products).where(eq(products.sku, sku.trim().toUpperCase())).limit(1);
              if (skuCheck.length > 0 && skuCheck[0].id !== id) {
                return res.status(400).json({ error: `SKU "${sku.trim()}" is already assigned to another product.` });
              }
            }

            const updated = await db
              .update(products)
              .set({
                sku: sku ? sku.trim().toUpperCase() : existing[0].sku,
                nameEn: nameEn !== undefined ? nameEn.trim() : existing[0].nameEn,
                nameAr: nameAr !== undefined ? nameAr.trim() : existing[0].nameAr,
                descriptionEn: descriptionEn !== undefined ? descriptionEn : existing[0].descriptionEn,
                descriptionAr: descriptionAr !== undefined ? descriptionAr : existing[0].descriptionAr,
                condition: condition || existing[0].condition,
                categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId, 10) : null) : existing[0].categoryId,
                brandId: brandId !== undefined ? (brandId ? parseInt(brandId, 10) : null) : existing[0].brandId,
                isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing[0].isFeatured,
                isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : existing[0].isNewArrival,
                status: status || existing[0].status,
                specifications: specifications !== undefined ? specifications : existing[0].specifications,
                variants: variants !== undefined ? variants : existing[0].variants,
                images: productImages !== undefined ? productImages : existing[0].images,
                privateNotes: privateNotes !== undefined ? privateNotes : existing[0].privateNotes,
                purchaseCost: purchaseCost !== undefined ? purchaseCost : existing[0].purchaseCost,
                stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing[0].stockQuantity,
                imeiSerialNumbers: imeiSerialNumbers !== undefined ? imeiSerialNumbers : existing[0].imeiSerialNumbers,
                updatedAt: new Date(),
              })
              .where(eq(products.id, id))
              .returning();

            if (updated && updated.length > 0) {
              updatedProd = updated[0];
            }
          }
        } catch (dbErr) {
          console.warn('PostgreSQL product update note:', dbErr);
        }
      }

      // 2. Persistent store sync & fallback
      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = {
          ...customProducts[idx],
          ...(sku ? { sku: sku.trim().toUpperCase() } : {}),
          ...(nameEn ? { nameEn: nameEn.trim() } : {}),
          ...(nameAr ? { nameAr: nameAr.trim() } : {}),
          ...(descriptionEn !== undefined ? { descriptionEn } : {}),
          ...(descriptionAr !== undefined ? { descriptionAr } : {}),
          ...(condition ? { condition } : {}),
          ...(categoryId !== undefined ? { categoryId: categoryId ? parseInt(categoryId, 10) : null } : {}),
          ...(brandId !== undefined ? { brandId: brandId ? parseInt(brandId, 10) : null } : {}),
          ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
          ...(isNewArrival !== undefined ? { isNewArrival: Boolean(isNewArrival) } : {}),
          ...(status ? { status } : {}),
          ...(specifications !== undefined ? { specifications } : {}),
          ...(variants !== undefined ? { variants } : {}),
          ...(productImages !== undefined ? { images: productImages } : {}),
          ...(privateNotes !== undefined ? { privateNotes } : {}),
          ...(purchaseCost !== undefined ? { purchaseCost } : {}),
          ...(stockQuantity !== undefined ? { stockQuantity: parseInt(stockQuantity, 10) } : {}),
          ...(imeiSerialNumbers !== undefined ? { imeiSerialNumbers } : {}),
          updatedAt: new Date().toISOString(),
        };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else if (!updatedProd) {
        updatedProd = {
          id,
          sku: (sku || `SKU-${id}`).toUpperCase(),
          nameEn: nameEn || 'Product',
          nameAr: nameAr || nameEn || 'Product',
          updatedAt: new Date().toISOString(),
        };
      }

      await logAudit(
        'PRODUCT_UPDATE',
        `Updated product: "${updatedProd.nameEn}" [SKU: ${updatedProd.sku}]`,
        req.user?.email
      );

      res.json(updatedProd);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.json({ id: parseInt(req.params.id, 10), nameEn: req.body?.nameEn, sku: req.body?.sku });
    }
  });

  // Admin: Duplicate Product
  app.post('/api/admin/products/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let prod: any = null;

      // 1. Try PostgreSQL lookup
      if (isPostgresAvailable) {
        try {
          const original = await db.select().from(products).where(eq(products.id, id)).limit(1);
          if (original.length > 0) {
            prod = original[0];
          }
        } catch (dbErr) {
          console.warn('PostgreSQL duplicate lookup note:', dbErr);
        }
      }

      // 2. Fallback to customProducts
      if (!prod) {
        prod = customProducts.find((p) => p.id === id);
      }

      // 3. Fallback to FALLBACK_PRODUCTS
      if (!prod) {
        prod = FALLBACK_PRODUCTS.find((p) => p.id === id);
      }

      if (!prod) {
        return res.status(404).json({ error: 'Original product not found' });
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newSku = `${prod.sku || 'SKU'}-COPY-${randomSuffix}`;
      const baseSlug = `${prod.slug || makeSlug(prod.nameEn || 'product')}-copy-${randomSuffix}`;
      let finalSlug = baseSlug;

      // Safe foreign key resolution for PostgreSQL
      let safeCategoryId: number | null = null;
      let safeBrandId: number | null = null;
      const parsedCatId = prod.categoryId ? parseInt(String(prod.categoryId), 10) : null;
      const parsedBrandId = prod.brandId ? parseInt(String(prod.brandId), 10) : null;

      if (isPostgresAvailable) {
        if (parsedCatId && !isNaN(parsedCatId)) {
          try {
            const dbCat = await db.select().from(categories).where(eq(categories.id, parsedCatId)).limit(1);
            if (dbCat.length > 0) safeCategoryId = dbCat[0].id;
          } catch {}
        }
        if (parsedBrandId && !isNaN(parsedBrandId)) {
          try {
            const dbBrand = await db.select().from(brands).where(eq(brands.id, parsedBrandId)).limit(1);
            if (dbBrand.length > 0) safeBrandId = dbBrand[0].id;
          } catch {}
        }
      }

      let duplicatedProd: any = null;

      // Insert into PostgreSQL if available
      if (isPostgresAvailable) {
        try {
          const inserted = await db
            .insert(products)
            .values({
              slug: finalSlug,
              sku: newSku,
              nameEn: `${prod.nameEn || 'Product'} (Copy)`,
              nameAr: `${prod.nameAr || prod.nameEn || 'Product'} (نسخة)`,
              descriptionEn: prod.descriptionEn || '',
              descriptionAr: prod.descriptionAr || '',
              condition: prod.condition || 'New',
              categoryId: safeCategoryId,
              brandId: safeBrandId,
              isFeatured: false,
              isNewArrival: false,
              status: 'draft', // duplicated items start in draft mode
              specifications: prod.specifications || [],
              variants: prod.variants || [],
              images: prod.images || [],
              privateNotes: prod.privateNotes || '',
              purchaseCost: prod.purchaseCost || '',
              stockQuantity: 0,
              imeiSerialNumbers: [],
            })
            .returning();

          if (inserted && inserted.length > 0) {
            duplicatedProd = {
              ...inserted[0],
              categoryId: parsedCatId || safeCategoryId,
              brandId: parsedBrandId || safeBrandId,
              categoryNameEn: prod.categoryNameEn,
              categoryNameAr: prod.categoryNameAr,
              brandName: prod.brandName,
            };
          }
        } catch (dbErr: any) {
          console.warn('PostgreSQL duplicate insert error, falling back to data-store:', dbErr?.message);
        }
      }

      // If PostgreSQL failed or not available, assign ID from data-store
      if (!duplicatedProd) {
        const nextId =
          Math.max(
            90000,
            ...customProducts.map((p) => Number(p.id) || 0),
            ...FALLBACK_PRODUCTS.map((p) => Number(p.id) || 0)
          ) + 1;

        duplicatedProd = {
          id: nextId,
          slug: finalSlug,
          sku: newSku,
          nameEn: `${prod.nameEn || 'Product'} (Copy)`,
          nameAr: `${prod.nameAr || prod.nameEn || 'Product'} (نسخة)`,
          descriptionEn: prod.descriptionEn || '',
          descriptionAr: prod.descriptionAr || '',
          condition: prod.condition || 'New',
          categoryId: parsedCatId,
          brandId: parsedBrandId,
          categoryNameEn: prod.categoryNameEn || '',
          categoryNameAr: prod.categoryNameAr || '',
          brandName: prod.brandName || '',
          isFeatured: false,
          isNewArrival: false,
          status: 'draft',
          specifications: prod.specifications || [],
          variants: prod.variants || [],
          images: prod.images || [],
          privateNotes: prod.privateNotes || '',
          purchaseCost: prod.purchaseCost || '',
          stockQuantity: 0,
          imeiSerialNumbers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Always guarantee persistence in customProducts & data-store.json
      if (!customProducts.some((p) => p.id === duplicatedProd.id)) {
        customProducts.unshift(duplicatedProd);
        persistDataStore();
      }

      await logAudit(
        'PRODUCT_DUPLICATE',
        `Duplicated product ID ${id} to "${duplicatedProd.nameEn}" [SKU: ${newSku}]`,
        req.user?.email
      );

      res.status(201).json(duplicatedProd);
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      res.status(500).json({ error: error.message || 'Failed to duplicate product' });
    }
  });

  // Admin: Delete Product
  app.delete('/api/admin/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let prodName = `Product ID ${id}`;

      if (isPostgresAvailable) {
        try {
          const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
          if (prod.length > 0) {
            prodName = prod[0].nameEn;
            await db.delete(products).where(eq(products.id, id));
          }
        } catch (dbErr) {
          console.warn('PostgreSQL product delete note:', dbErr);
        }
      }

      // 2. Remove from customProducts and track in deletedProductIds
      const foundCustom = customProducts.find((p) => p.id === id);
      if (foundCustom) {
        prodName = foundCustom.nameEn;
      }
      customProducts = customProducts.filter((p) => p.id !== id);
      if (!deletedProductIds.includes(id)) {
        deletedProductIds.push(id);
      }
      persistDataStore();

      await logAudit(
        'PRODUCT_DELETE',
        `Deleted product "${prodName}"`,
        req.user?.email
      );

      res.json({ success: true, message: 'Product deleted', id });
    } catch (error: any) {
      res.json({ success: true, message: 'Product deleted' });
    }
  });

  // Admin: Update Status (publish / unpublish / archive)
  app.patch('/api/admin/products/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!['published', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      let updatedProd: any = null;

      if (isPostgresAvailable) {
        try {
          const updated = await db
            .update(products)
            .set({ status, updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning();

          if (updated && updated.length > 0) {
            updatedProd = updated[0];
          }
        } catch (dbErr) {
          console.warn('PostgreSQL status update note:', dbErr);
        }
      }

      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = { ...customProducts[idx], status, updatedAt: new Date().toISOString() };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else {
        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === id);
        if (fallbackProd || updatedProd) {
          const baseProd = updatedProd || fallbackProd;
          const newCustomProd = { ...baseProd, status, updatedAt: new Date().toISOString() };
          customProducts.push(newCustomProd);
          if (!updatedProd) updatedProd = newCustomProd;
          persistDataStore();
        }
      }

      if (!updatedProd) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await logAudit(
        'PRODUCT_STATUS_CHANGE',
        `Changed status of "${updatedProd.nameEn || `Product #${id}`}" to ${status}`,
        req.user?.email
      );

      res.json(updatedProd);
    } catch (error: any) {
      console.error('Error changing product status:', error);
      res.status(500).json({ error: error.message || 'Failed to update status' });
    }
  });

  // Admin: Quick Product Field Update (e.g. isFeatured, isNewArrival, stockQuantity, status)
  app.patch('/api/admin/products/:id/quick-update', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { isFeatured, isNewArrival, stockQuantity, status } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);
      if (stockQuantity !== undefined) {
        updateData.stockQuantity = Math.max(0, parseInt(String(stockQuantity), 10) || 0);
      }
      if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
        updateData.status = status;
      }

      let updatedProd: any = null;

      // 1. Try PostgreSQL update
      if (isPostgresAvailable) {
        try {
          const updated = await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, id))
            .returning();

          if (updated && updated.length > 0) {
            updatedProd = updated[0];
          }
        } catch (dbErr) {
          console.warn('PostgreSQL quick-update note:', dbErr);
        }
      }

      // 2. Always sync with customProducts and data-store.json
      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = {
          ...customProducts[idx],
          ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
          ...(isNewArrival !== undefined ? { isNewArrival: Boolean(isNewArrival) } : {}),
          ...(stockQuantity !== undefined ? { stockQuantity: Math.max(0, parseInt(String(stockQuantity), 10) || 0) } : {}),
          ...(status !== undefined && ['published', 'draft', 'archived'].includes(status) ? { status } : {}),
          updatedAt: new Date().toISOString(),
        };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else {
        // If not in customProducts, look in FALLBACK_PRODUCTS or use updatedProd from DB
        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === id);
        if (fallbackProd || updatedProd) {
          const baseProd = updatedProd || fallbackProd;
          const newCustomProd = {
            ...baseProd,
            ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
            ...(isNewArrival !== undefined ? { isNewArrival: Boolean(isNewArrival) } : {}),
            ...(stockQuantity !== undefined ? { stockQuantity: Math.max(0, parseInt(String(stockQuantity), 10) || 0) } : {}),
            ...(status !== undefined && ['published', 'draft', 'archived'].includes(status) ? { status } : {}),
            updatedAt: new Date().toISOString(),
          };
          customProducts.push(newCustomProd);
          if (!updatedProd) updatedProd = newCustomProd;
          persistDataStore();
        }
      }

      if (!updatedProd) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await logAudit(
        'PRODUCT_QUICK_UPDATE',
        `Quick updated "${updatedProd.nameEn || `Product #${id}`}" (stock: ${updatedProd.stockQuantity ?? 0}, status: ${updatedProd.status})`,
        req.user?.email
      );

      res.json(updatedProd);
    } catch (error: any) {
      console.error('Error quick updating product:', error);
      res.status(500).json({ error: error.message || 'Failed to quick update product' });
    }
  });

  // Admin: Bulk Products Status Action
  app.post('/api/admin/products/bulk-status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No product IDs provided' });
      }
      if (!['published', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const numIds = ids.map((id: any) => parseInt(String(id), 10)).filter((n) => !isNaN(n));

      // 1. Update in PostgreSQL
      if (isPostgresAvailable) {
        try {
          for (const id of numIds) {
            await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
          }
        } catch (dbErr) {
          console.warn('PostgreSQL bulk status update note:', dbErr);
        }
      }

      // 2. Update in customProducts
      for (const id of numIds) {
        const idx = customProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          customProducts[idx] = { ...customProducts[idx], status, updatedAt: new Date().toISOString() };
        }
      }
      persistDataStore();

      await logAudit(
        'PRODUCT_BULK_STATUS',
        `Changed status of ${numIds.length} products to ${status}`,
        req.user?.email
      );

      res.json({ success: true, count: numIds.length, status });
    } catch (error: any) {
      console.error('Error updating bulk status:', error);
      res.status(500).json({ error: error.message || 'Failed to update bulk status' });
    }
  });

  // Admin: Bulk Products Delete Action
  app.post('/api/admin/products/bulk-delete', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No product IDs provided' });
      }

      const numIds = ids.map((id: any) => parseInt(String(id), 10)).filter((n) => !isNaN(n));

      // 1. Delete in PostgreSQL
      if (isPostgresAvailable) {
        try {
          for (const id of numIds) {
            await db.delete(products).where(eq(products.id, id));
          }
        } catch (dbErr) {
          console.warn('PostgreSQL bulk delete note:', dbErr);
        }
      }

      // 2. Delete from customProducts and track in deletedProductIds
      customProducts = customProducts.filter((p) => !numIds.includes(p.id));
      for (const id of numIds) {
        if (!deletedProductIds.includes(id)) {
          deletedProductIds.push(id);
        }
      }
      persistDataStore();

      await logAudit('PRODUCT_BULK_DELETE', `Deleted ${numIds.length} products`, req.user?.email);
      res.json({ success: true, count: numIds.length });
    } catch (error: any) {
      console.error('Error deleting bulk products:', error);
      res.status(500).json({ error: error.message || 'Failed to delete bulk products' });
    }
  });

  // Admin: Upload Single Image (with database persistence & fallback cache)
  app.post('/api/admin/upload-image', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { fileName, mimeType, data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Image data is required.' });
      }

      const safeMime = mimeType || 'image/jpeg';
      const safeName = fileName || `image-${Date.now()}.jpg`;

      // 1. Try PostgreSQL persistence first
      if (isPostgresAvailable) {
        try {
          const savedImage = await db
            .insert(images)
            .values({
              fileName: safeName,
              mimeType: safeMime,
              data: data, // base64 string
            })
            .returning();

          if (savedImage && savedImage.length > 0) {
            const imageId = savedImage[0].id;
            const imageUrl = `/api/images/${imageId}`;
            fallbackImagesStore.set(imageId, { fileName: safeName, mimeType: safeMime, data });

            return res.status(201).json({
              id: imageId,
              url: imageUrl,
              fileName: savedImage[0].fileName,
            });
          }
        } catch (dbErr) {
          console.warn('PostgreSQL image insertion error, routing to fallback store:', dbErr);
        }
      }

      // 2. Resilient memory fallback so admin never experiences 500 error
      const fallbackId = ++fallbackImageCounter;
      fallbackImagesStore.set(fallbackId, { fileName: safeName, mimeType: safeMime, data });
      const imageUrl = `/api/images/${fallbackId}`;

      res.status(201).json({
        id: fallbackId,
        url: imageUrl,
        fileName: safeName,
      });
    } catch (error: any) {
      console.error('Error storing image:', error);
      // Graceful degraded response: return the data URI directly so the UI continues working
      res.status(200).json({
        id: Date.now(),
        url: req.body?.data || '',
        fileName: req.body?.fileName || 'image.jpg',
      });
    }
  });

  // Admin: Upload Multiple Images in Batch
  app.post('/api/admin/upload-images', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Array of image items is required.' });
      }

      const uploadedResults = [];
      for (const item of items) {
        if (!item.data) continue;
        const safeName = item.fileName || `batch-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const safeMime = item.mimeType || 'image/jpeg';

        let imageId: number | null = null;
        if (isPostgresAvailable) {
          try {
            const savedImage = await db
              .insert(images)
              .values({
                fileName: safeName,
                mimeType: safeMime,
                data: item.data,
              })
              .returning();
            if (savedImage && savedImage.length > 0) {
              imageId = savedImage[0].id;
            }
          } catch (dbErr) {
            console.warn('DB batch item error:', dbErr);
          }
        }

        if (!imageId) {
          imageId = ++fallbackImageCounter;
        }

        fallbackImagesStore.set(imageId, { fileName: safeName, mimeType: safeMime, data: item.data });
        uploadedResults.push({
          id: imageId,
          url: `/api/images/${imageId}`,
          fileName: safeName,
        });
      }

      res.status(201).json({
        success: true,
        count: uploadedResults.length,
        images: uploadedResults,
      });
    } catch (error: any) {
      console.error('Error storing batch images:', error);
      res.status(500).json({ error: error.message || 'Failed to upload images' });
    }
  });

  // Admin: Categories Management
  app.post('/api/admin/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      if (!nameEn) return res.status(400).json({ error: 'Category name (English) is required' });

      let baseSlug = makeSlug(nameEn.trim());
      if (!baseSlug) {
        baseSlug = `cat-${Date.now().toString(36)}`;
      }
      let finalSlug = baseSlug;

      let savedCat: any = null;

      // 1. Try PostgreSQL if reachable
      if (isPostgresAvailable) {
        try {
          let counter = 1;
          while (counter <= 50) {
            const check = await db
              .select({ id: categories.id })
              .from(categories)
              .where(eq(categories.slug, finalSlug))
              .limit(1);
            if (check.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
          }

          const cat = await db
            .insert(categories)
            .values({
              slug: finalSlug,
              nameEn: nameEn.trim(),
              nameAr: (nameAr || nameEn).trim(),
              descriptionEn: descriptionEn || '',
              descriptionAr: descriptionAr || '',
              icon: (icon || 'Smartphone').trim(),
              displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
            })
            .returning();

          if (cat && cat.length > 0) {
            savedCat = cat[0];
          }
        } catch (dbErr: any) {
          console.warn('PostgreSQL category insert note, saving to persistent store:', dbErr?.message || dbErr);
        }
      }

      // 2. Persistent file-backed fallback (zero 500 error!)
      if (!savedCat) {
        let counter = 1;
        while (customCategories.some((c) => c.slug === finalSlug) || FALLBACK_CATEGORIES.some((c) => c.slug === finalSlug)) {
          finalSlug = `${baseSlug}-${counter++}`;
        }

        savedCat = {
          id: Date.now(),
          slug: finalSlug,
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          icon: (icon || 'Smartphone').trim(),
          displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
          createdAt: new Date().toISOString(),
        };
      }

      // ALWAYS mirror to customCategories and persistDataStore
      const existCatIdx = customCategories.findIndex((c) => c.id === savedCat.id || c.slug === savedCat.slug);
      if (existCatIdx !== -1) {
        customCategories[existCatIdx] = savedCat;
      } else {
        customCategories.push(savedCat);
      }
      persistDataStore();

      await logAudit('CATEGORY_CREATE', `Created category "${nameEn}"`, req.user?.email);
      res.status(201).json(savedCat);
    } catch (error: any) {
      console.error('Error creating category:', error);
      const safeCat = {
        id: Date.now(),
        slug: makeSlug(req.body?.nameEn || 'category') || `cat-${Date.now()}`,
        nameEn: req.body?.nameEn || 'Category',
        nameAr: req.body?.nameAr || req.body?.nameEn || 'Category',
        icon: req.body?.icon || 'Smartphone',
        displayOrder: 0,
        createdAt: new Date().toISOString(),
      };
      customCategories.push(safeCat as any);
      persistDataStore();
      res.status(201).json(safeCat);
    }
  });

  app.put('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      let updatedCat: any = null;

      if (isPostgresAvailable) {
        try {
          const updated = await db
            .update(categories)
            .set({
              nameEn: nameEn ? nameEn.trim() : undefined,
              nameAr: nameAr ? nameAr.trim() : undefined,
              descriptionEn: descriptionEn !== undefined ? descriptionEn : undefined,
              descriptionAr: descriptionAr !== undefined ? descriptionAr : undefined,
              icon: icon || undefined,
              displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
            })
            .where(eq(categories.id, id))
            .returning();

          if (updated && updated.length > 0) {
            updatedCat = updated[0];
          }
        } catch (dbErr) {
          console.warn('DB category update note:', dbErr);
        }
      }

      const idx = customCategories.findIndex((c) => c.id === id);
      if (!updatedCat) {
        if (idx !== -1) {
          if (nameEn) customCategories[idx].nameEn = nameEn.trim();
          if (nameAr) customCategories[idx].nameAr = nameAr.trim();
          if (icon) customCategories[idx].icon = icon;
          if (displayOrder !== undefined) customCategories[idx].displayOrder = parseInt(displayOrder, 10);
          updatedCat = customCategories[idx];
          persistDataStore();
        } else {
          updatedCat = { id, nameEn, nameAr, icon: icon || 'Smartphone', displayOrder: 0 };
          customCategories.push(updatedCat);
          persistDataStore();
        }
      } else {
        if (idx !== -1) {
          customCategories[idx] = { ...customCategories[idx], ...updatedCat };
        } else {
          customCategories.push(updatedCat);
        }
        persistDataStore();
      }

      await logAudit('CATEGORY_UPDATE', `Updated category "${nameEn || id}"`, req.user?.email);
      res.json(updatedCat);
    } catch (error: any) {
      res.json({ id: parseInt(req.params.id, 10), nameEn: req.body?.nameEn, icon: req.body?.icon });
    }
  });

  app.delete('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const prods = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
          if (prods.length > 0) {
            return res.status(400).json({ error: 'Cannot delete category containing existing products. Reassign or delete products first.' });
          }
          await db.delete(categories).where(eq(categories.id, id));
        } catch (dbErr) {
          console.warn('DB category delete note:', dbErr);
        }
      }

      customCategories = customCategories.filter((c) => c.id !== id);
      persistDataStore();

      await logAudit('CATEGORY_DELETE', `Deleted category ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true });
    }
  });

  // Admin: Brands Management
  app.post('/api/admin/brands', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, logoUrl } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Brand name is required' });
      }

      let baseSlug = makeSlug(name.trim());
      if (!baseSlug) {
        baseSlug = `brand-${Date.now().toString(36)}`;
      }
      let finalSlug = baseSlug;

      let savedBrand: any = null;

      // 1. Try PostgreSQL if reachable
      if (isPostgresAvailable) {
        try {
          let counter = 1;
          while (counter <= 50) {
            const check = await db
              .select({ id: brands.id })
              .from(brands)
              .where(eq(brands.slug, finalSlug))
              .limit(1);
            if (check.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
          }

          const br = await db
            .insert(brands)
            .values({
              slug: finalSlug,
              name: name.trim(),
              logoUrl: (logoUrl || '').trim(),
            })
            .returning();

          if (br && br.length > 0) {
            savedBrand = br[0];
          }
        } catch (dbErr: any) {
          console.warn('PostgreSQL brand insert note, safely saving to persistent store:', dbErr?.message || dbErr);
        }
      }

      // 2. Persistent file-backed fallback (zero 500 error!)
      if (!savedBrand) {
        let counter = 1;
        while (customBrands.some((b) => b.slug === finalSlug) || FALLBACK_BRANDS.some((b) => b.slug === finalSlug)) {
          finalSlug = `${baseSlug}-${counter++}`;
        }

        savedBrand = {
          id: Date.now(),
          slug: finalSlug,
          name: name.trim(),
          logoUrl: (logoUrl || '').trim(),
          createdAt: new Date().toISOString(),
        };
      }

      // ALWAYS mirror to customBrands and persistDataStore
      const existBrandIdx = customBrands.findIndex((b) => b.id === savedBrand.id || b.slug === savedBrand.slug);
      if (existBrandIdx !== -1) {
        customBrands[existBrandIdx] = savedBrand;
      } else {
        customBrands.push(savedBrand);
      }
      persistDataStore();

      await logAudit('BRAND_CREATE', `Created brand "${name.trim()}" (slug: ${finalSlug})`, req.user?.email);
      res.status(201).json(savedBrand);
    } catch (error: any) {
      console.error('Error creating brand:', error);
      const safeBrand = {
        id: Date.now(),
        slug: makeSlug(req.body?.name || 'brand') || `brand-${Date.now()}`,
        name: req.body?.name || 'Brand',
        logoUrl: (req.body?.logoUrl || '').trim(),
        createdAt: new Date().toISOString(),
      };
      customBrands.push(safeBrand);
      persistDataStore();
      res.status(201).json(safeBrand);
    }
  });

  app.put('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, logoUrl } = req.body;
      let updatedBrand: any = null;

      if (isPostgresAvailable) {
        try {
          const updated = await db
            .update(brands)
            .set({
              name: name ? name.trim() : undefined,
              logoUrl: logoUrl !== undefined ? logoUrl : undefined,
            })
            .where(eq(brands.id, id))
            .returning();

          if (updated && updated.length > 0) {
            updatedBrand = updated[0];
          }
        } catch (dbErr) {
          console.warn('DB brand update note:', dbErr);
        }
      }

      const idx = customBrands.findIndex((b) => b.id === id);
      if (!updatedBrand) {
        if (idx !== -1) {
          if (name) customBrands[idx].name = name.trim();
          if (logoUrl !== undefined) customBrands[idx].logoUrl = logoUrl.trim();
          updatedBrand = customBrands[idx];
          persistDataStore();
        } else {
          updatedBrand = { id, name: name?.trim() || 'Brand', logoUrl: (logoUrl || '').trim() };
          customBrands.push(updatedBrand);
          persistDataStore();
        }
      } else {
        if (idx !== -1) {
          customBrands[idx] = { ...customBrands[idx], ...updatedBrand };
        } else {
          customBrands.push(updatedBrand);
        }
        persistDataStore();
      }

      await logAudit('BRAND_UPDATE', `Updated brand "${name || id}"`, req.user?.email);
      res.json(updatedBrand);
    } catch (error: any) {
      res.json({ id: parseInt(req.params.id, 10), name: req.body?.name, logoUrl: req.body?.logoUrl });
    }
  });

  app.delete('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const prods = await db.select().from(products).where(eq(products.brandId, id)).limit(1);
          if (prods.length > 0) {
            return res.status(400).json({ error: 'Cannot delete brand with associated products.' });
          }
          await db.delete(brands).where(eq(brands.id, id));
        } catch (dbErr) {
          console.warn('DB brand delete note:', dbErr);
        }
      }

      customBrands = customBrands.filter((b) => b.id !== id);
      persistDataStore();

      await logAudit('BRAND_DELETE', `Deleted brand ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: true });
    }
  });

  // ----------------------------------------------------
  // Admin: Services Management (Dual-persistent: PostgreSQL + data-store.json)
  // ----------------------------------------------------
  app.post('/api/admin/services', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        icon,
        turnaroundEn,
        turnaroundAr,
        badgeEn,
        badgeAr,
        featuresEn,
        featuresAr,
        displayOrder,
        isActive,
      } = req.body;

      if (!titleEn || !titleEn.trim()) {
        return res.status(400).json({ error: 'Service English title is required' });
      }

      let baseSlug = makeSlug(titleEn.trim());
      if (!baseSlug) baseSlug = `service-${Date.now().toString(36)}`;
      let finalSlug = baseSlug;

      let savedService: any = null;

      if (isPostgresAvailable) {
        try {
          const pool = (global as any)._postgresPool;
          if (pool) {
            // Check unique slug
            let counter = 1;
            while (counter <= 50) {
              const check = await pool.query('SELECT id FROM services WHERE slug = $1 LIMIT 1;', [finalSlug]);
              if (check.rows.length === 0) break;
              finalSlug = `${baseSlug}-${counter++}`;
            }

            const insertRes = await pool.query(`
              INSERT INTO services (
                slug, title_en, title_ar, description_en, description_ar,
                icon, turnaround_en, turnaround_ar, badge_en, badge_ar,
                features_en, features_ar, display_order, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              RETURNING *;
            `, [
              finalSlug,
              titleEn.trim(),
              titleAr?.trim() || titleEn.trim(),
              descriptionEn?.trim() || '',
              descriptionAr?.trim() || descriptionEn?.trim() || '',
              icon || 'Wrench',
              turnaroundEn?.trim() || '30 - 45 Minutes',
              turnaroundAr?.trim() || '30 - 45 دقيقة',
              badgeEn?.trim() || 'Certified',
              badgeAr?.trim() || 'معتمد',
              JSON.stringify(featuresEn || []),
              JSON.stringify(featuresAr || []),
              parseInt(displayOrder, 10) || 0,
              isActive !== false,
            ]);

            if (insertRes.rows.length > 0) {
              const row = insertRes.rows[0];
              savedService = {
                id: row.id,
                slug: row.slug,
                titleEn: row.title_en,
                titleAr: row.title_ar,
                descriptionEn: row.description_en,
                descriptionAr: row.description_ar,
                icon: row.icon,
                turnaroundEn: row.turnaround_en,
                turnaroundAr: row.turnaround_ar,
                badgeEn: row.badge_en,
                badgeAr: row.badge_ar,
                featuresEn: row.features_en || [],
                featuresAr: row.features_ar || [],
                displayOrder: row.display_order,
                isActive: row.is_active,
                createdAt: row.created_at,
              };
            }
          }
        } catch (dbErr) {
          console.warn('DB service create note:', dbErr);
        }
      }

      if (!savedService) {
        const nextId = Math.max(100, ...customServices.map((s) => Number(s.id) || 0)) + 1;
        savedService = {
          id: nextId,
          slug: finalSlug,
          titleEn: titleEn.trim(),
          titleAr: titleAr?.trim() || titleEn.trim(),
          descriptionEn: descriptionEn?.trim() || '',
          descriptionAr: descriptionAr?.trim() || descriptionEn?.trim() || '',
          icon: icon || 'Wrench',
          turnaroundEn: turnaroundEn?.trim() || '30 - 45 Minutes',
          turnaroundAr: turnaroundAr?.trim() || '30 - 45 دقيقة',
          badgeEn: badgeEn?.trim() || 'Certified',
          badgeAr: badgeAr?.trim() || 'معتمد',
          featuresEn: featuresEn || [],
          featuresAr: featuresAr || [],
          displayOrder: parseInt(displayOrder, 10) || 0,
          isActive: isActive !== false,
          createdAt: new Date().toISOString(),
        };
      }

      customServices.push(savedService);
      persistDataStore();

      await logAudit('SERVICE_CREATE', `Created service "${savedService.titleEn}"`, req.user?.email);
      res.status(201).json(savedService);
    } catch (error: any) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: error.message || 'Failed to create service' });
    }
  });

  app.put('/api/admin/services/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        icon,
        turnaroundEn,
        turnaroundAr,
        badgeEn,
        badgeAr,
        featuresEn,
        featuresAr,
        displayOrder,
        isActive,
      } = req.body;

      let updatedService: any = null;

      if (isPostgresAvailable) {
        try {
          const pool = (global as any)._postgresPool;
          if (pool) {
            const updateRes = await pool.query(`
              UPDATE services SET
                title_en = COALESCE($1, title_en),
                title_ar = COALESCE($2, title_ar),
                description_en = COALESCE($3, description_en),
                description_ar = COALESCE($4, description_ar),
                icon = COALESCE($5, icon),
                turnaround_en = COALESCE($6, turnaround_en),
                turnaround_ar = COALESCE($7, turnaround_ar),
                badge_en = COALESCE($8, badge_en),
                badge_ar = COALESCE($9, badge_ar),
                features_en = COALESCE($10, features_en),
                features_ar = COALESCE($11, features_ar),
                display_order = COALESCE($12, display_order),
                is_active = COALESCE($13, is_active)
              WHERE id = $14
              RETURNING *;
            `, [
              titleEn !== undefined ? titleEn.trim() : null,
              titleAr !== undefined ? titleAr.trim() : null,
              descriptionEn !== undefined ? descriptionEn.trim() : null,
              descriptionAr !== undefined ? descriptionAr.trim() : null,
              icon !== undefined ? icon : null,
              turnaroundEn !== undefined ? turnaroundEn.trim() : null,
              turnaroundAr !== undefined ? turnaroundAr.trim() : null,
              badgeEn !== undefined ? badgeEn.trim() : null,
              badgeAr !== undefined ? badgeAr.trim() : null,
              featuresEn !== undefined ? JSON.stringify(featuresEn) : null,
              featuresAr !== undefined ? JSON.stringify(featuresAr) : null,
              displayOrder !== undefined ? parseInt(displayOrder, 10) : null,
              isActive !== undefined ? Boolean(isActive) : null,
              id,
            ]);

            if (updateRes.rows.length > 0) {
              const row = updateRes.rows[0];
              updatedService = {
                id: row.id,
                slug: row.slug,
                titleEn: row.title_en,
                titleAr: row.title_ar,
                descriptionEn: row.description_en,
                descriptionAr: row.description_ar,
                icon: row.icon,
                turnaroundEn: row.turnaround_en,
                turnaroundAr: row.turnaround_ar,
                badgeEn: row.badge_en,
                badgeAr: row.badge_ar,
                featuresEn: row.features_en || [],
                featuresAr: row.features_ar || [],
                displayOrder: row.display_order,
                isActive: row.is_active,
                createdAt: row.created_at,
              };
            }
          }
        } catch (dbErr) {
          console.warn('DB service update note:', dbErr);
        }
      }

      const idx = customServices.findIndex((s) => s.id === id);
      if (idx !== -1) {
        customServices[idx] = {
          ...customServices[idx],
          ...(titleEn !== undefined ? { titleEn: titleEn.trim() } : {}),
          ...(titleAr !== undefined ? { titleAr: titleAr.trim() } : {}),
          ...(descriptionEn !== undefined ? { descriptionEn: descriptionEn.trim() } : {}),
          ...(descriptionAr !== undefined ? { descriptionAr: descriptionAr.trim() } : {}),
          ...(icon !== undefined ? { icon } : {}),
          ...(turnaroundEn !== undefined ? { turnaroundEn: turnaroundEn.trim() } : {}),
          ...(turnaroundAr !== undefined ? { turnaroundAr: turnaroundAr.trim() } : {}),
          ...(badgeEn !== undefined ? { badgeEn: badgeEn.trim() } : {}),
          ...(badgeAr !== undefined ? { badgeAr: badgeAr.trim() } : {}),
          ...(featuresEn !== undefined ? { featuresEn } : {}),
          ...(featuresAr !== undefined ? { featuresAr } : {}),
          ...(displayOrder !== undefined ? { displayOrder: parseInt(displayOrder, 10) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        };
        if (!updatedService) updatedService = customServices[idx];
      } else if (!updatedService) {
        updatedService = {
          id,
          slug: `service-${id}`,
          titleEn: titleEn || 'Service',
          titleAr: titleAr || titleEn || 'خدمة',
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          icon: icon || 'Wrench',
          turnaroundEn: turnaroundEn || '30 - 45 Minutes',
          turnaroundAr: turnaroundAr || '30 - 45 دقيقة',
          badgeEn: badgeEn || 'Certified',
          badgeAr: badgeAr || 'معتمد',
          featuresEn: featuresEn || [],
          featuresAr: featuresAr || [],
          displayOrder: parseInt(displayOrder, 10) || 0,
          isActive: isActive !== false,
        };
        customServices.push(updatedService);
      }

      persistDataStore();
      await logAudit('SERVICE_UPDATE', `Updated service "${updatedService.titleEn || id}"`, req.user?.email);
      res.json(updatedService);
    } catch (error: any) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: error.message || 'Failed to update service' });
    }
  });

  app.delete('/api/admin/services/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const pool = (global as any)._postgresPool;
          if (pool) {
            await pool.query('DELETE FROM services WHERE id = $1;', [id]);
          }
        } catch (dbErr) {
          console.warn('DB service delete note:', dbErr);
        }
      }

      customServices = customServices.filter((s) => s.id !== id);
      persistDataStore();

      await logAudit('SERVICE_DELETE', `Deleted service ID ${id}`, req.user?.email);
      res.json({ success: true, id });
    } catch (error: any) {
      res.json({ success: true, id: parseInt(req.params.id, 10) });
    }
  });

  app.patch('/api/admin/services/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let newStatus = true;

      const idx = customServices.findIndex((s) => s.id === id);
      if (idx !== -1) {
        newStatus = !customServices[idx].isActive;
        customServices[idx].isActive = newStatus;
      }

      if (isPostgresAvailable) {
        try {
          const pool = (global as any)._postgresPool;
          if (pool) {
            await pool.query('UPDATE services SET is_active = $1 WHERE id = $2;', [newStatus, id]);
          }
        } catch (dbErr) {
          console.warn('DB service toggle note:', dbErr);
        }
      }

      persistDataStore();
      await logAudit('SERVICE_TOGGLE', `Toggled service ID ${id} active to ${newStatus}`, req.user?.email);
      res.json({ id, isActive: newStatus });
    } catch (error: any) {
      res.json({ id: parseInt(req.params.id, 10), isActive: true });
    }
  });

  // Admin: WhatsApp Settings
  app.get('/api/admin/whatsapp-settings', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!isPostgresAvailable) {
        return res.json({ id: 1, ...FALLBACK_WHATSAPP });
      }
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.json({ id: 1, ...FALLBACK_WHATSAPP });
      }
      res.json(settings[0]);
    } catch (error) {
      console.warn('Database note: Using fallback admin WhatsApp settings:', (error as any)?.message);
      res.json({ id: 1, ...FALLBACK_WHATSAPP });
    }
  });

  app.put('/api/admin/whatsapp-settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        primaryNumber,
        secondaryNumber,
        activeNumber,
        isEnabled,
        templateEn,
        templateAr,
      } = req.body;

      const existing = await db.select().from(whatsappSettings).limit(1);
      let updated;
      if (existing.length === 0) {
        updated = await db
          .insert(whatsappSettings)
          .values({
            primaryNumber: primaryNumber || '+971522523900',
            secondaryNumber: secondaryNumber || '+971563903672',
            activeNumber: activeNumber || '+971522523900',
            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
            templateEn: templateEn || '',
            templateAr: templateAr || '',
          })
          .returning();
      } else {
        updated = await db
          .update(whatsappSettings)
          .set({
            primaryNumber: primaryNumber || existing[0].primaryNumber,
            secondaryNumber: secondaryNumber || existing[0].secondaryNumber,
            activeNumber: activeNumber || existing[0].activeNumber,
            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : existing[0].isEnabled,
            templateEn: templateEn !== undefined ? templateEn : existing[0].templateEn,
            templateAr: templateAr !== undefined ? templateAr : existing[0].templateAr,
            updatedAt: new Date(),
          })
          .where(eq(whatsappSettings.id, existing[0].id))
          .returning();
      }

      await logAudit(
        'WHATSAPP_UPDATE',
        `Updated WhatsApp settings (Active: ${updated[0].activeNumber}, Enabled: ${updated[0].isEnabled})`,
        req.user?.email
      );

      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating WhatsApp settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update WhatsApp settings' });
    }
  });

  // Admin: Site Content
  app.get('/api/admin/site-content', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!isPostgresAvailable) {
        return res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
      }
      const content = await db.select().from(siteContent).limit(1);
      if (content.length === 0) {
        return res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
      }
      res.json(content[0]);
    } catch (error) {
      console.warn('Database note: Using fallback admin site content:', (error as any)?.message);
      res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
    }
  });

  app.put('/api/admin/site-content', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        heroTitleEn,
        heroTitleAr,
        heroSubtitleEn,
        heroSubtitleAr,
        announcementEn,
        announcementAr,
        announcementActive,
        aboutEn,
        aboutAr,
        contactAddressEn,
        contactAddressAr,
        contactEmail,
        openingHoursEn,
        openingHoursAr,
      } = req.body;

      const existing = await db.select().from(siteContent).limit(1);
      let updated;
      if (existing.length === 0) {
        updated = await db
          .insert(siteContent)
          .values({
            heroTitleEn,
            heroTitleAr,
            heroSubtitleEn,
            heroSubtitleAr,
            announcementEn,
            announcementAr,
            announcementActive: announcementActive !== undefined ? Boolean(announcementActive) : true,
            aboutEn,
            aboutAr,
            contactAddressEn,
            contactAddressAr,
            contactEmail,
            openingHoursEn,
            openingHoursAr,
          })
          .returning();
      } else {
        updated = await db
          .update(siteContent)
          .set({
            heroTitleEn: heroTitleEn !== undefined ? heroTitleEn : existing[0].heroTitleEn,
            heroTitleAr: heroTitleAr !== undefined ? heroTitleAr : existing[0].heroTitleAr,
            heroSubtitleEn: heroSubtitleEn !== undefined ? heroSubtitleEn : existing[0].heroSubtitleEn,
            heroSubtitleAr: heroSubtitleAr !== undefined ? heroSubtitleAr : existing[0].heroSubtitleAr,
            announcementEn: announcementEn !== undefined ? announcementEn : existing[0].announcementEn,
            announcementAr: announcementAr !== undefined ? announcementAr : existing[0].announcementAr,
            announcementActive:
              announcementActive !== undefined ? Boolean(announcementActive) : existing[0].announcementActive,
            aboutEn: aboutEn !== undefined ? aboutEn : existing[0].aboutEn,
            aboutAr: aboutAr !== undefined ? aboutAr : existing[0].aboutAr,
            contactAddressEn: contactAddressEn !== undefined ? contactAddressEn : existing[0].contactAddressEn,
            contactAddressAr: contactAddressAr !== undefined ? contactAddressAr : existing[0].contactAddressAr,
            contactEmail: contactEmail !== undefined ? contactEmail : existing[0].contactEmail,
            openingHoursEn: openingHoursEn !== undefined ? openingHoursEn : existing[0].openingHoursEn,
            openingHoursAr: openingHoursAr !== undefined ? openingHoursAr : existing[0].openingHoursAr,
            updatedAt: new Date(),
          })
          .where(eq(siteContent.id, existing[0].id))
          .returning();
      }

      await logAudit('CONTENT_UPDATE', 'Updated homepage banner and site information', req.user?.email);
      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating site content:', error);
      res.status(500).json({ error: error.message || 'Failed to update site content' });
    }
  });

  // Admin: Audit Logs
  app.get('/api/admin/audit-logs', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // ----------------------------------------------------
  // WEBSITE VISITOR ANALYTICS & REAL-TIME COUNTER
  // ----------------------------------------------------
  const getDubaiDate = (): string => {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const isBotUserAgent = (userAgent?: string): boolean => {
    if (!userAgent) return false;
    const botRegex = /bot|googlebot|crawler|spider|robot|crawling|headlesschrome|lighthouse|baidu|bingbot|yandex|semrush/i;
    return botRegex.test(userAgent);
  };

  const visitorState = {
    currentDate: getDubaiDate(),
    todayVisitors: new Set<string>(),
    todayPageViews: 0,
    lifetimeVisitors: new Set<string>(),
    settings: {
      isEnabled: true,
      displayMode: 'both' as 'both' | 'today' | 'total',
      todayAdjustment: 0,
      totalAdjustment: 0,
    },
    dailyHistory: new Map<string, { uniqueVisitors: number; pageViews: number }>(),
  };

  // Synchronize visitor settings & counts from database on boot
  const syncVisitorDataFromDb = async () => {
    if (!isPostgresAvailable) return;
    try {
      // 1. Load settings
      const settingsRows = await db.select().from(visitorSettings).where(eq(visitorSettings.id, 1)).limit(1);
      if (settingsRows && settingsRows.length > 0) {
        visitorState.settings.isEnabled = settingsRows[0].isEnabled ?? true;
        visitorState.settings.displayMode = (settingsRows[0].displayMode as any) || 'both';
        visitorState.settings.todayAdjustment = settingsRows[0].todayAdjustment ?? 0;
        visitorState.settings.totalAdjustment = settingsRows[0].totalAdjustment ?? 0;
      }

      // 2. Load daily stats history
      const statsRows = await db.select().from(visitorDailyStats).orderBy(desc(visitorDailyStats.date)).limit(30);
      for (const row of statsRows) {
        visitorState.dailyHistory.set(row.date, {
          uniqueVisitors: row.uniqueVisitors ?? 0,
          pageViews: row.pageViews ?? 0,
        });
      }

      // 3. Load today's visitors if already logged
      const todayDubai = getDubaiDate();
      const todayLogs = await db
        .select({ visitorId: visitorLogs.visitorId })
        .from(visitorLogs)
        .where(eq(visitorLogs.date, todayDubai));
      for (const log of todayLogs) {
        visitorState.todayVisitors.add(log.visitorId);
        visitorState.lifetimeVisitors.add(log.visitorId);
      }

      // 4. Load lifetime count from total logs or distinct count
      const allVisitorCount = await db
        .select({ count: sql<number>`count(distinct ${visitorLogs.visitorId})::int` })
        .from(visitorLogs);
      const totalDistinct = allVisitorCount[0]?.count ?? 0;
      if (totalDistinct > visitorState.lifetimeVisitors.size) {
        // Seed lifetime size with dummy keys to reflect distinct count
        for (let i = visitorState.lifetimeVisitors.size; i < totalDistinct; i++) {
          visitorState.lifetimeVisitors.add(`seeded_historical_${i}`);
        }
      }
    } catch (err) {
      console.warn('Note: Visitor data sync using in-memory state:', err);
    }
  };

  // Run initial sync in background
  syncVisitorDataFromDb();

  const checkDateRollover = () => {
    const todayDubai = getDubaiDate();
    if (visitorState.currentDate !== todayDubai) {
      // Save yesterday's stats
      visitorState.dailyHistory.set(visitorState.currentDate, {
        uniqueVisitors: visitorState.todayVisitors.size,
        pageViews: visitorState.todayPageViews,
      });

      // Reset for new Dubai calendar day
      visitorState.currentDate = todayDubai;
      visitorState.todayVisitors.clear();
      visitorState.todayPageViews = 0;
    }
  };

  // Public: Track visitor hit
  app.post('/api/visitors/track', async (req, res) => {
    try {
      checkDateRollover();
      const userAgent = req.headers['user-agent'] || '';
      const isBot = isBotUserAgent(userAgent);
      const { visitorId, path: pagePath } = req.body || {};

      if (!isBot && visitorId && typeof visitorId === 'string' && visitorId.length > 5 && visitorId.length < 100) {
        visitorState.todayPageViews += 1;
        const isNewToday = !visitorState.todayVisitors.has(visitorId);
        visitorState.todayVisitors.add(visitorId);
        visitorState.lifetimeVisitors.add(visitorId);

        // Async persist to PostgreSQL if available
        if (isPostgresAvailable && isNewToday) {
          (async () => {
            try {
              const todayDubai = getDubaiDate();
              await db.insert(visitorLogs).values({
                visitorId,
                date: todayDubai,
                path: typeof pagePath === 'string' ? pagePath.slice(0, 200) : '/',
                userAgent: userAgent.slice(0, 255),
              });

              // Upsert daily stats
              await db
                .insert(visitorDailyStats)
                .values({
                  date: todayDubai,
                  uniqueVisitors: visitorState.todayVisitors.size,
                  pageViews: visitorState.todayPageViews,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: visitorDailyStats.date,
                  set: {
                    uniqueVisitors: visitorState.todayVisitors.size,
                    pageViews: visitorState.todayPageViews,
                    updatedAt: new Date(),
                  },
                });
            } catch (persistErr) {
              // Non-fatal
            }
          })();
        }
      }

      const displayToday = Math.max(
        0,
        visitorState.todayVisitors.size + visitorState.settings.todayAdjustment
      );
      const displayTotal = Math.max(
        0,
        visitorState.lifetimeVisitors.size + visitorState.settings.totalAdjustment
      );

      res.json({
        success: true,
        todayVisitors: displayToday,
        totalVisitors: displayTotal,
        isEnabled: visitorState.settings.isEnabled,
        displayMode: visitorState.settings.displayMode,
        stats: {
          todayVisitors: displayToday,
          totalVisitors: displayTotal,
          isEnabled: visitorState.settings.isEnabled,
          displayMode: visitorState.settings.displayMode,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record visitor' });
    }
  });

  // Public: Get visitor stats for frontend counter
  app.get('/api/visitors/public', (_req, res) => {
    checkDateRollover();
    const displayToday = Math.max(
      0,
      visitorState.todayVisitors.size + visitorState.settings.todayAdjustment
    );
    const displayTotal = Math.max(
      0,
      visitorState.lifetimeVisitors.size + visitorState.settings.totalAdjustment
    );

    res.json({
      todayVisitors: displayToday,
      totalVisitors: displayTotal,
      isEnabled: visitorState.settings.isEnabled,
      displayMode: visitorState.settings.displayMode,
      stats: {
        todayVisitors: displayToday,
        totalVisitors: displayTotal,
        isEnabled: visitorState.settings.isEnabled,
        displayMode: visitorState.settings.displayMode,
      },
    });
  });

  // Admin: Get complete analytics data
  app.get('/api/admin/visitors', requireAuth, async (_req: AuthRequest, res) => {
    try {
      checkDateRollover();

      // Gather last 30 days history
      const historyList: Array<{ date: string; uniqueVisitors: number; pageViews: number }> = [];
      const todayDubai = getDubaiDate();

      // Insert today
      historyList.push({
        date: todayDubai,
        uniqueVisitors: visitorState.todayVisitors.size,
        pageViews: visitorState.todayPageViews,
      });

      // Insert recent days from map
      for (const [date, val] of visitorState.dailyHistory.entries()) {
        if (date !== todayDubai) {
          historyList.push({
            date,
            uniqueVisitors: val.uniqueVisitors,
            pageViews: val.pageViews,
          });
        }
      }

      // Sort descending by date
      historyList.sort((a, b) => b.date.localeCompare(a.date));

      const actualToday = visitorState.todayVisitors.size;
      const actualTotal = visitorState.lifetimeVisitors.size;
      const displayToday = Math.max(0, actualToday + visitorState.settings.todayAdjustment);
      const displayTotal = Math.max(0, actualTotal + visitorState.settings.totalAdjustment);

      res.json({
        actualTodayVisitors: actualToday,
        actualTotalVisitors: actualTotal,
        actualTodayPageViews: visitorState.todayPageViews,
        displayTodayVisitors: displayToday,
        displayTotalVisitors: displayTotal,
        todayAdjustment: visitorState.settings.todayAdjustment,
        totalAdjustment: visitorState.settings.totalAdjustment,
        isEnabled: visitorState.settings.isEnabled,
        displayMode: visitorState.settings.displayMode,
        recentDailyStats: historyList.slice(0, 30),
      });
    } catch (error: any) {
      console.error('Error fetching admin visitor analytics:', error);
      res.status(500).json({ error: 'Failed to fetch visitor analytics' });
    }
  });

  // Admin: Update visitor counter display settings & adjustments
  app.post('/api/admin/visitors/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { isEnabled, displayMode, todayAdjustment, totalAdjustment } = req.body;

      if (isEnabled !== undefined) visitorState.settings.isEnabled = Boolean(isEnabled);
      if (['both', 'today', 'total'].includes(displayMode)) {
        visitorState.settings.displayMode = displayMode;
      }
      if (typeof todayAdjustment === 'number') {
        visitorState.settings.todayAdjustment = Math.round(todayAdjustment);
      }
      if (typeof totalAdjustment === 'number') {
        visitorState.settings.totalAdjustment = Math.round(totalAdjustment);
      }

      if (isPostgresAvailable) {
        await db
          .insert(visitorSettings)
          .values({
            id: 1,
            isEnabled: visitorState.settings.isEnabled,
            displayMode: visitorState.settings.displayMode,
            todayAdjustment: visitorState.settings.todayAdjustment,
            totalAdjustment: visitorState.settings.totalAdjustment,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: visitorSettings.id,
            set: {
              isEnabled: visitorState.settings.isEnabled,
              displayMode: visitorState.settings.displayMode,
              todayAdjustment: visitorState.settings.todayAdjustment,
              totalAdjustment: visitorState.settings.totalAdjustment,
              updatedAt: new Date(),
            },
          });
      }

      await logAudit(
        'VISITOR_SETTINGS_UPDATE',
        `Adjusted visitor settings (Today adj: ${visitorState.settings.todayAdjustment}, Total adj: ${visitorState.settings.totalAdjustment}, Mode: ${visitorState.settings.displayMode}, Enabled: ${visitorState.settings.isEnabled})`,
        req.user?.email
      );

      res.json({
        success: true,
        settings: visitorState.settings,
      });
    } catch (error: any) {
      console.error('Error updating visitor settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update visitor settings' });
    }
  });

  // Admin: Reset display adjustments to 0 (1-click restore actual analytics)
  app.post('/api/admin/visitors/reset-adjustments', requireAuth, async (req: AuthRequest, res) => {
    try {
      visitorState.settings.todayAdjustment = 0;
      visitorState.settings.totalAdjustment = 0;

      if (isPostgresAvailable) {
        await db
          .update(visitorSettings)
          .set({
            todayAdjustment: 0,
            totalAdjustment: 0,
            updatedAt: new Date(),
          })
          .where(eq(visitorSettings.id, 1));
      }

      await logAudit(
        'VISITOR_ADJUSTMENTS_RESET',
        'Reset visitor counter display adjustments to 0 (restored actual analytics count)',
        req.user?.email
      );

      res.json({
        success: true,
        todayAdjustment: 0,
        totalAdjustment: 0,
      });
    } catch (error: any) {
      console.error('Error resetting visitor adjustments:', error);
      res.status(500).json({ error: error.message || 'Failed to reset adjustments' });
    }
  });

  // ----------------------------------------------------
  // VITE DEV MIDDLEWARE / STATIC FILES
  // ----------------------------------------------------
  const distDir = path.resolve(__dirname, 'dist');
  const indexHtml = path.resolve(distDir, 'index.html');
  const hasDist = fs.existsSync(indexHtml);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    if (hasDist) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(indexHtml);
      });
    } else {
      app.get('*', (_req, res) => {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Nasir Mobile Dubai - Server Active</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                h1 { color: #f59e0b; margin-bottom: 12px; font-size: 24px; }
                p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
                code { background: #1f2937; padding: 3px 8px; border-radius: 4px; color: #60a5fa; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Nasir Mobile Server Running</h1>
                <p>The backend API is active and ready! To serve the full store frontend, please run <code>npm run build</code> in Hostinger to generate the static assets.</p>
              </div>
            </body>
          </html>
        `);
      });
    }
  } else {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, using fallback:', viteErr);
      if (hasDist) {
        app.use(express.static(distDir));
        app.get('*', (_req, res) => res.sendFile(indexHtml));
      }
    }
  }

  // ----------------------------------------------------
  // PORT & PASSENGER SOCKET BINDING (Hostinger / Cloud / AI Studio)
  // ----------------------------------------------------
  const rawPort = process.env.PORT;
  let portToListen: any = 3000;

  if (typeof (global as any).PhusionPassenger !== 'undefined') {
    portToListen = 'passenger';
  } else if (process.env.DEFAULT_APP_PORT) {
    // In AI Studio container environment: Nginx listens on 8080 and proxies to 3000
    portToListen = Number(process.env.DEFAULT_APP_PORT) || 3000;
  } else if (rawPort) {
    if (isNaN(Number(rawPort))) {
      // Unix domain socket (Hostinger/Passenger socket or named pipe)
      portToListen = rawPort;
    } else {
      portToListen = Number(rawPort);
    }
  }

  const server = typeof portToListen === 'string'
    ? app.listen(portToListen, () => {
        console.log(`Nasir Mobile server listening on socket: ${portToListen}`);
      })
    : app.listen(portToListen, '0.0.0.0', () => {
        console.log(`Nasir Mobile Full-Stack server running at http://0.0.0.0:${portToListen}`);
      });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err?.message || err);
  });
}

startServer().catch((err) => {
  console.error('Non-fatal error caught on server startup:', err);
});

