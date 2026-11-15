import express from 'express';
import fs from 'fs';
import { execSync } from 'child_process';
// Vite is loaded dynamically only in the development branch.
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { db, pool, isDbAvailable, setDbAvailable, ensureDbAvailable, isTransientDbError, withTransaction } from './src/db/index.ts';
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
} from './src/db/schema.ts';
import { eq, desc, asc, and, or, like, sql } from 'drizzle-orm';
import { requireAuth, AuthRequest, adminSessions, createSignedToken } from './src/middleware/auth.ts';
import { createLoginRateLimiter } from './src/lib/loginRateLimit.ts';
import { initDatabase } from './src/db/init.ts';
import {
  parseJsonArray,
  normalizeProductImages,
  filterProducts,
  sanitizePublicProductDetail,
  sanitizePublicRelated,
} from './src/lib/productSerialization.ts';


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

  // In-memory login throttling; Express does not trust forwarded IP headers.
  const loginLimiter = createLoginRateLimiter();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Prevent stale browser/CDN caching on all API responses (especially admin edits & live catalog updates)
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Ensure persistent public uploads folder exists and is mounted statically
  const PUBLIC_DIR = path.resolve(__dirname, 'public');
  const UPLOADS_DIR = path.resolve(PUBLIC_DIR, 'uploads');
  const ASSETS_IMAGES_DIR = path.resolve(PUBLIC_DIR, 'assets/images');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ASSETS_IMAGES_DIR)) {
    fs.mkdirSync(ASSETS_IMAGES_DIR, { recursive: true });
  }

  // Static routes for uploads and images
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/assets/images', express.static(ASSETS_IMAGES_DIR));
  app.use('/src/assets/images', express.static(ASSETS_IMAGES_DIR));
  app.use(express.static(PUBLIC_DIR));

  // Self-Healing Image Delivery Endpoint for /uploads/:fileName:
  // If an image is not on disk (e.g. after container refresh, branch switch, or deployment),
  // automatically look it up in MySQL images table, restore it to disk, and stream it immediately!
  app.get('/uploads/:fileName', async (req, res, next) => {
    try {
      const rawName = req.params.fileName;
      const fileName = path.basename(decodeURIComponent(rawName));
      if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).type('text/plain').send('Invalid image filename');
      }
      const diskPath = path.resolve(UPLOADS_DIR, fileName);
      if (!diskPath.startsWith(UPLOADS_DIR)) {
        return res.status(403).type('text/plain').send('Access denied');
      }

      if (fs.existsSync(diskPath)) {
        return res.sendFile(diskPath);
      }

      // Check in public/assets/images
      const altAssetPath = path.resolve(ASSETS_IMAGES_DIR, fileName);
      if (altAssetPath.startsWith(ASSETS_IMAGES_DIR) && fs.existsSync(altAssetPath)) {
        return res.sendFile(altAssetPath);
      }

      // Self-heal from MySQL images database
      if (await ensureDbAvailable()) {
        try {
          const found = await db
            .select()
            .from(images)
            .where(or(
              eq(images.fileName, fileName),
              eq(images.fileName, rawName),
              like(images.fileName, `%${fileName}%`)
            ))
            .limit(1);

          if (found.length > 0 && found[0].data) {
            const rawData = found[0].data;
            let mime = found[0].mimeType || 'image/jpeg';
            let buffer: Buffer;

            if (rawData.startsWith('data:')) {
              const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              mime = matches ? matches[1] : mime;
              buffer = Buffer.from(matches ? matches[2] : rawData, 'base64');
            } else {
              buffer = Buffer.from(rawData, 'base64');
            }

            if (buffer.length > 0) {
              // Re-write to disk so future hits are served instantaneously by express.static
              try {
                fs.writeFileSync(diskPath, buffer);
              } catch (writeErr) {
                console.warn('Could not cache restored image to disk:', writeErr);
              }

              res.setHeader('Content-Type', mime);
              res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
              return res.send(buffer);
            }
          }
        } catch (dbErr: any) {
          if (isTransientDbError(dbErr)) {
            setDbAvailable(false);
          }
          console.warn('MySQL image self-heal lookup warning:', dbErr?.message || dbErr);
        }
      }

      // Not found: Return 404 text response, NEVER HTML index.html
      return res.status(404).type('text/plain').send('Image not found');
    } catch (err: any) {
      console.warn('Uploads handler error:', err?.message || err);
      return res.status(404).type('text/plain').send('Image not found');
    }
  });

  // Dedicated SEO Crawling routes for Googlebot, Bingbot, and Social Crawlers
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').sendFile(path.join(PUBLIC_DIR, 'robots.txt'));
  });
  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml').sendFile(path.join(PUBLIC_DIR, 'sitemap.xml'));
  });
  app.get(['/sitemap_index.xml', '/sitemaps.xml'], (_req, res) => {
    res.type('application/xml').sendFile(path.join(PUBLIC_DIR, 'sitemap_index.xml'));
  });
  app.get('/favicon.ico', (_req, res) => {
    res.type('image/x-icon').sendFile(path.join(PUBLIC_DIR, 'favicon.ico'));
  });

  // Dynamic on-demand source code ZIP export (keeps repository lightweight so GitHub push never fails)
  app.get(['/nasir-mobile-dubai-source-code.zip', '/api/admin/export-zip'], (_req, res) => {
    try {
      const zipPath = path.resolve('/tmp', 'nasir-mobile-dubai-source-code.zip');
      execSync(`python3 scripts/package-zip.py "${zipPath}"`, { cwd: path.resolve('.') });
      res.download(zipPath, 'nasir-mobile-dubai-source-code.zip');
    } catch (e: any) {
      console.error('Failed to bundle source code:', e);
      res.status(500).json({ error: 'Failed to bundle source code' });
    }
  });

  // Health check endpoints for host reverse proxies and uptime monitors
  app.get(['/health', '/api/health'], (_req, res) => {
    res.status(200).json({ status: 'ok', server: 'Nasir Mobile Dubai', timestamp: new Date().toISOString() });
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

  // Route & MySQL Persistence Helpers
  class HttpRouteError extends Error {
    statusCode: number;
    payload?: Record<string, any>;
    constructor(statusCode: number, message: string, payload?: Record<string, any>) {
      super(message);
      this.statusCode = statusCode;
      this.payload = payload;
    }
  }

  const handleDbRouteError = (err: any, res: express.Response, fallbackMsg: string) => {
    if (err instanceof HttpRouteError) {
      return res.status(err.statusCode).json({ error: err.message, ...(err.payload || {}) });
    }
    if (isTransientDbError(err)) {
      setDbAvailable(false);
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
    }
    const code = String(err?.code || '').toUpperCase();
    const errno = Number(err?.errno || 0);
    if (code === 'ER_DUP_ENTRY' || errno === 1062) {
      return res.status(409).json({ error: 'A record with the same unique SKU or slug already exists.' });
    }
    if (code === 'ER_NO_REFERENCED_ROW_2' || errno === 1452) {
      return res.status(400).json({ error: 'Referenced category or brand does not exist.' });
    }
    if (code === 'ER_ROW_IS_REFERENCED_2' || errno === 1451) {
      return res.status(400).json({ error: 'Cannot delete record because products are still linked to it.' });
    }
    console.error(fallbackMsg, err?.message || err);
    return res.status(500).json({ error: err?.message || fallbackMsg });
  };

  const fetchAdminProductDto = async (executor: any, productId: number) => {
    const rows = await executor
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
        storefrontVisible: products.storefrontVisible,
        version: products.version,
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
        brandLogoUrl: brands.logoUrl,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      isFeatured: Boolean(row.isFeatured),
      isNewArrival: Boolean(row.isNewArrival),
      storefrontVisible: Boolean(row.storefrontVisible),
      version: Number(row.version) || 1,
      specifications: parseJsonArray(row.specifications),
      variants: parseJsonArray(row.variants),
      images: normalizeProductImages(row.images, { filterBrokenPlaceholders: false }),
      imeiSerialNumbers: parseJsonArray(row.imeiSerialNumbers),
      categoryNameEn: row.categoryNameEn || 'General',
      categoryNameAr: row.categoryNameAr || 'عام',
      categorySlug: row.categorySlug || 'mobile-phones',
      brandName: row.brandName || 'General',
      brandSlug: row.brandSlug || 'general',
      brandLogoUrl: row.brandLogoUrl || '',
      inStock: (row.stockQuantity ?? 1) > 0,
    };
  };

  const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
  const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]);

  const decodeAndValidateImageUpload = (
    rawData: unknown,
    declaredMime?: unknown
  ): { buffer: Buffer; mimeType: string; ext: string } => {
    if (typeof rawData !== 'string' || !rawData.trim()) {
      throw new HttpRouteError(400, 'Image payload must be a non-empty base64 string or data URI.');
    }

    let safeMime = typeof declaredMime === 'string' && declaredMime.trim() ? declaredMime.trim().toLowerCase() : 'image/jpeg';
    let base64Body = rawData.trim();

    if (base64Body.startsWith('data:')) {
      const matches = base64Body.match(/^data:([^;]+);base64,(.+)$/i);
      if (!matches || matches.length !== 3) {
        throw new HttpRouteError(400, 'Malformed base64 data URI.');
      }
      safeMime = matches[1].toLowerCase();
      base64Body = matches[2];
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(safeMime)) {
      throw new HttpRouteError(400, `Unsupported image MIME type: ${safeMime}`);
    }

    const buffer = Buffer.from(base64Body, 'base64');
    if (buffer.length === 0) {
      throw new HttpRouteError(400, 'Decoded image buffer is empty.');
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new HttpRouteError(400, 'Decoded image exceeds 20MB maximum size limit.');
    }

    // Validate binary magic bytes / SVG structure to reject corrupt or spoofed payloads
    const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const isGif =
      buffer.length >= 6 &&
      (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a');
    const svgHead = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').toLowerCase();
    const isSvg = safeMime === 'image/svg+xml' && svgHead.includes('<svg');

    if (isPng) {
      return { buffer, mimeType: 'image/png', ext: 'png' };
    }
    if (isJpeg) {
      return { buffer, mimeType: 'image/jpeg', ext: 'jpg' };
    }
    if (isWebp) {
      return { buffer, mimeType: 'image/webp', ext: 'webp' };
    }
    if (isGif) {
      return { buffer, mimeType: 'image/gif', ext: 'gif' };
    }
    if (isSvg) {
      return { buffer, mimeType: 'image/svg+xml', ext: 'svg' };
    }

    throw new HttpRouteError(400, 'Invalid or corrupted image binary signature.');
  };

  // ----------------------------------------------------
  // INITIALIZE DATABASE CONNECTION (Zero startup DDL / Zero automatic migration)
  // ----------------------------------------------------
  initDatabase().catch((err) => {
    console.warn('[WARN] Initial database connection check:', err?.message || err);
  });

  // ----------------------------------------------------
  // PUBLIC APIS (ABSOLUTE PRIVACY: NO COSTS, STOCK, IMEIS, ETC.)
  // ----------------------------------------------------

  // Public & Admin Categories (Authoritative MySQL Database)
  app.get(['/api/categories', '/api/admin/categories'], async (_req, res) => {
    if (!(await ensureDbAvailable())) {
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
    }
    try {
      const dbCategories = await db
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

      return res.json(dbCategories);
    } catch (err: any) {
      return handleDbRouteError(err, res, 'Categories query error:');
    }
  });

  // Public & Admin Brands (Authoritative MySQL Database)
  app.get(['/api/brands', '/api/admin/brands'], async (_req, res) => {
    if (!(await ensureDbAvailable())) {
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
    }
    try {
      const dbBrands = await db
        .select({
          id: brands.id,
          slug: brands.slug,
          name: brands.name,
          logoUrl: brands.logoUrl,
          createdAt: brands.createdAt,
        })
        .from(brands)
        .orderBy(asc(brands.name));

      return res.json(dbBrands);
    } catch (err: any) {
      return handleDbRouteError(err, res, 'Brands query error:');
    }
  });

  // Public & Admin Services (Services section has been removed; returns empty array safely)
  app.get(['/api/services', '/api/admin/services'], async (_req, res) => {
    res.json([]);
  });

  // Product filtering engine imported from src/lib/productSerialization.ts
  // (Handles stringified MariaDB JSON for specifications, variants, images, and imeiSerialNumbers)

  // Public Products Catalogue (Filters: category, brand, condition, featured, newArrival, search, sort)
  // ABSOLUTE PRIVACY: Only public catalogue fields returned
  app.get('/api/products', async (req, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
      }
      const dbItems = await db
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
          storefrontVisible: products.storefrontVisible,
          specifications: products.specifications,
          variants: products.variants,
          images: products.images,
          stockQuantity: products.stockQuantity,
          createdAt: products.createdAt,
          categoryNameEn: categories.nameEn,
          categoryNameAr: categories.nameAr,
          categorySlug: categories.slug,
          brandName: brands.name,
          brandSlug: brands.slug,
          brandLogoUrl: brands.logoUrl,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(and(eq(products.status, 'published'), eq(products.storefrontVisible, true)));

      return res.json(filterProducts(req.query, true, dbItems));
    } catch (err: any) {
      return handleDbRouteError(err, res, 'DB query error in /api/products:');
    }
  });

  // Public product detail & related sanitization helpers are imported from src/lib/productSerialization.ts

  // Public Single Product by Slug (STRICT PRIVACY: never exposes internal inventory/costs)
  app.get('/api/products/:slug', async (req, res) => {
    if (!(await ensureDbAvailable())) {
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
    }
    const slug = req.params.slug;
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
          stockQuantity: products.stockQuantity,
          createdAt: products.createdAt,
          categoryNameEn: categories.nameEn,
          categoryNameAr: categories.nameAr,
          categorySlug: categories.slug,
          brandName: brands.name,
          brandSlug: brands.slug,
          brandLogoUrl: brands.logoUrl,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(
          and(
            eq(products.slug, slug),
            eq(products.status, 'published'),
            eq(products.storefrontVisible, true)
          )
        )
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
              stockQuantity: products.stockQuantity,
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
                eq(products.storefrontVisible, true),
                sql`${products.id} != ${product[0].id}`
              )
            )
            .limit(4);
        }

        return res.json({
          product: sanitizePublicProductDetail(product[0]),
          related: sanitizePublicRelated(related),
        });
      }

      return res.status(404).json({ error: 'Product not found' });
    } catch (err: any) {
      return handleDbRouteError(err, res, 'DB query error in /api/products/:slug:');
    }
  });

  // Public WhatsApp Settings (Authoritative MySQL)
  app.get('/api/whatsapp-settings', async (_req, res) => {
    if (!(await ensureDbAvailable())) {
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
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
      return res.status(404).json({ error: 'WhatsApp settings not configured.' });
    } catch (err: any) {
      return handleDbRouteError(err, res, 'WhatsApp settings query error:');
    }
  });

  // Public Site Content (Authoritative MySQL)
  app.get('/api/site-content', async (_req, res) => {
    if (!(await ensureDbAvailable())) {
      return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
    }
    try {
      const content = await db.select().from(siteContent).limit(1);
      if (content.length > 0) {
        return res.json(content[0]);
      }
      return res.status(404).json({ error: 'Site content not configured.' });
    } catch (err: any) {
      return handleDbRouteError(err, res, 'Site content query error:');
    }
  });

  // In-memory persistent cache for images (prevents broken images if DB has transient connection errors)
  const fallbackImagesStore = new Map<number | string, { fileName: string; mimeType: string; data: string }>();
  let fallbackImageCounter = 50000;

  // Stored Image delivery endpoint from MySQL persistent storage or fallback cache
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
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        return res.send(buffer);
      }

      // Check if file exists in persistent public/uploads directory
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        const match = files.find((f) => f.includes(rawId));
        if (match) {
          return res.sendFile(path.join(UPLOADS_DIR, match));
        }
      }

      if (isNaN(numId)) {
        return res.status(400).send('Invalid image ID');
      }

      if (await ensureDbAvailable()) {
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
            res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
            return res.send(buffer);
          }
        } catch (dbErr) {
          if (isTransientDbError(dbErr)) setDbAvailable(false);
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


  // STAGING-ONLY owner password reset by email.
  const resetRequestAttempts = new Map<string, { count: number; started: number }>();

  app.post('/api/admin/password/forgot', async (req, res) => {
    if (process.env.USE_STAGING_DB !== 'true') {
      return res.status(404).json({ error: 'Not available.' });
    }

    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const key = `${req.socket.remoteAddress || 'unknown'}:${email}`;
    const now = Date.now();
    const attempt = resetRequestAttempts.get(key);

    if (attempt && now - attempt.started < 15 * 60 * 1000 && attempt.count >= 3) {
      return res.status(429).json({ error: 'Please wait before requesting another link.' });
    }

    if (!attempt || now - attempt.started >= 15 * 60 * 1000) {
      resetRequestAttempts.set(key, { count: 1, started: now });
    } else {
      attempt.count++;
    }

    try {
      const [rows]: any = await pool.execute(
        'SELECT id, email, role FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      const account = rows?.[0];

      // Same outward response whether or not an account exists.
      if (account && (account.role === 'owner' || account.role === 'admin')) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        await pool.execute(
          'DELETE FROM admin_password_resets WHERE user_id = ?',
          [account.id]
        );

        await pool.execute(
          'INSERT INTO admin_password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
          [account.id, tokenHash]
        );

        const publicUrl = process.env.APP_PUBLIC_URL;
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!publicUrl || !publicUrl.startsWith('https://') ||
            !smtpHost || !smtpUser || !smtpPass) {
          throw new Error('Password reset email configuration is incomplete.');
        }

        const resetUrl = new URL('/admin/reset-password', publicUrl);
        resetUrl.searchParams.set('token', token);

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 465),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || smtpUser,
          to: account.email,
          subject: 'Nasir Mobile – Admin Password Reset',
          text: `A password reset was requested for your admin account.\n\nUse this link within 15 minutes:\n${resetUrl.toString()}\n\nIf you did not request this, ignore this email.`,
          html: `<p>A password reset was requested for your admin account.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in 15 minutes and can only be used once. If you did not request this, ignore this email.</p>`,
        });
      }

      return res.json({
        success: true,
        message: 'If that admin account exists, a reset link has been sent to its email address.',
      });
    } catch (error: any) {
      console.error('Password reset email service error:', error?.message || 'Unknown error');
      return res.status(503).json({ error: 'Email service is temporarily unavailable. Please try again later.' });
    }
  });

  app.post('/api/admin/password/reset', async (req, res) => {
    if (process.env.USE_STAGING_DB !== 'true') {
      return res.status(404).json({ error: 'Not available.' });
    }

    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'This reset link is invalid or expired.' });
    }

    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (passwordBytes < 12 || passwordBytes > 72) {
      return res.status(400).json({ error: 'Choose a password between 12 and 72 bytes.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [rows]: any = await connection.execute(
          'SELECT id, user_id FROM admin_password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1 FOR UPDATE',
          [tokenHash]
        );

        const reset = rows?.[0];
        if (!reset) {
          await connection.rollback();
          return res.status(400).json({ error: 'This reset link is invalid, expired, or already used.' });
        }

        const [updateResult]: any = await connection.execute(
          "UPDATE users SET password_hash = ? WHERE id = ? AND role IN ('owner', 'admin')",
          [passwordHash, reset.user_id]
        );

        if (updateResult.affectedRows !== 1) {
          await connection.rollback();
          return res.status(400).json({ error: 'The admin account could not be updated.' });
        }

        await connection.execute(
          'UPDATE admin_password_resets SET used_at = NOW() WHERE id = ?',
          [reset.id]
        );

        await connection.execute(
          'UPDATE admin_password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
          [reset.user_id]
        );

        await connection.commit();
        return res.json({ success: true, message: 'Password updated. You can now sign in.' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error('Password reset error:', error?.message || 'Unknown error');
      return res.status(500).json({ error: 'Password reset could not be completed.' });
    }
  });

  // Secure owner/admin login: existing database accounts only.
  app.post('/api/admin/login', async (req, res) => {
    try {
      const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
      const password = typeof req.body?.password === 'string'
        ? req.body.password
        : '';

      if (!email || !email.includes('@') || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const attemptKey = loginLimiter.keyFor(req.socket.remoteAddress || 'unknown', email);
      const retryAfter = loginLimiter.retryAfter(attemptKey);
      if (retryAfter > 0) {
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ error: 'Too many failed login attempts. Try again later.' });
      }

      const accounts = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const account = accounts[0];

      if (
        !account ||
        !account.passwordHash ||
        (account.role !== 'owner' && account.role !== 'admin') ||
        !(await bcrypt.compare(password, account.passwordHash))
      ) {
        loginLimiter.recordFailure(attemptKey);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      loginLimiter.clear(attemptKey);

      const sessionToken = createSignedToken({
        uid: account.uid,
        email: account.email,
        role: account.role,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      await logAudit('OWNER_LOGIN', 'Admin logged in using database password', account.email);

      return res.json({
        success: true,
        token: sessionToken,
        user: { email: account.email, role: account.role },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Authentication service unavailable.' });
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

  // Change password: authenticated account must verify its existing bcrypt password.
  app.post('/api/admin/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentPassword = typeof req.body?.currentPassword === 'string'
        ? req.body.currentPassword
        : '';
      const newPassword = typeof req.body?.newPassword === 'string'
        ? req.body.newPassword
        : '';
      const uid = req.user?.uid;
      const userEmail = req.user?.email;
      const role = req.user?.role;

      if (!uid || !userEmail || !role) {
        return res.status(401).json({ error: 'Authenticated account not found.' });
      }

      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }

      if (newPassword.length < 12) {
        return res.status(400).json({ error: 'New password must be at least 12 characters long.' });
      }

      const accounts = await db
        .select()
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1);
      const account = accounts[0];

      if (
        !account ||
        account.email.toLowerCase() !== userEmail.toLowerCase() ||
        account.role !== role ||
        !account.passwordHash ||
        !(await bcrypt.compare(currentPassword, account.passwordHash))
      ) {
        return res.status(401).json({ error: 'Current password verification failed.' });
      }

      const hash = await bcrypt.hash(newPassword, 12);
      await db.update(users).set({ passwordHash: hash }).where(eq(users.uid, uid));

      await logAudit('PASSWORD_CHANGED', 'Authenticated account changed its password', userEmail);

      const freshToken = createSignedToken({
        uid,
        email: userEmail,
        role,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: 'Password successfully updated.',
        token: freshToken,
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      return res.status(500).json({ error: 'Unable to change password.' });
    }
  });

  // ADMIN DASHBOARD & CATALOGUE MANAGEMENT
  // ----------------------------------------------------

  // Dashboard Overview
  app.get('/api/admin/overview', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Dashboard overview unavailable.' });
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

      return res.json({
        totalProducts: allProducts.length,
        publishedCount,
        draftCount,
        archivedCount,
        totalCategories: allCategories.length,
        totalBrands: allBrands.length,
        recentLogs,
      });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Database error in /api/admin/overview:');
    }
  });

  // Admin: Get all products (includes private notes, costs, serial numbers for the owner)
  app.get('/api/admin/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
      }
      const dbItems = await db
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
          storefrontVisible: products.storefrontVisible,
          version: products.version,
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
          brandLogoUrl: brands.logoUrl,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id));

      return res.json(filterProducts(req.query, false, dbItems));
    } catch (error: any) {
      return handleDbRouteError(error, res, 'DB query error in /api/admin/products:');
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

  // Helper to resolve optional relational parent IDs strictly against MySQL
  const validateParentIds = async (executor: any, rawCategoryId: any, rawBrandId: any) => {
    let safeCategoryId: number | null | undefined = undefined;
    let safeBrandId: number | null | undefined = undefined;

    if (rawCategoryId !== undefined) {
      if (rawCategoryId === null || rawCategoryId === '') {
        safeCategoryId = null;
      } else {
        const parsedCatId = parseInt(String(rawCategoryId), 10);
        if (isNaN(parsedCatId) || parsedCatId <= 0) {
          throw new HttpRouteError(400, 'Invalid category ID supplied.');
        }
        const dbCat = await executor.select({ id: categories.id }).from(categories).where(eq(categories.id, parsedCatId)).limit(1);
        if (dbCat.length === 0) {
          throw new HttpRouteError(400, `Category ID ${parsedCatId} does not exist.`);
        }
        safeCategoryId = dbCat[0].id;
      }
    }

    if (rawBrandId !== undefined) {
      if (rawBrandId === null || rawBrandId === '') {
        safeBrandId = null;
      } else {
        const parsedBrandId = parseInt(String(rawBrandId), 10);
        if (isNaN(parsedBrandId) || parsedBrandId <= 0) {
          throw new HttpRouteError(400, 'Invalid brand ID supplied.');
        }
        const dbBrand = await executor.select({ id: brands.id }).from(brands).where(eq(brands.id, parsedBrandId)).limit(1);
        if (dbBrand.length === 0) {
          throw new HttpRouteError(400, `Brand ID ${parsedBrandId} does not exist.`);
        }
        safeBrandId = dbBrand[0].id;
      }
    }

    return { safeCategoryId, safeBrandId };
  };

  // Admin: Create Product
  app.post('/api/admin/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({
          error: 'Database service is offline. Product creation requires an active database connection.',
        });
      }

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
        storefrontVisible,
        specifications,
        variants,
        images: productImages,
        privateNotes,
        purchaseCost,
        stockQuantity,
        imeiSerialNumbers,
      } = req.body;

      if (!sku || typeof sku !== 'string' || !sku.trim()) {
        return res.status(400).json({ error: 'SKU is required and must be unique.' });
      }

      if (!nameEn || typeof nameEn !== 'string' || !nameEn.trim()) {
        return res.status(400).json({ error: 'English product name is required.' });
      }

      const cleanSku = sku.trim().toUpperCase();
      const targetStatus = ['published', 'draft', 'archived'].includes(status) ? status : 'published';
      const parsedStock = stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ''
        ? Math.max(0, parseInt(String(stockQuantity), 10) || 0)
        : 0;

      const createdProduct = await withTransaction(async (tx) => {
        const existingSku = await tx.select({ id: products.id }).from(products).where(eq(products.sku, cleanSku)).limit(1);
        if (existingSku.length > 0) {
          throw new HttpRouteError(400, `Product with SKU "${cleanSku}" already exists.`);
        }

        let baseSlug = makeSlug(nameEn);
        if (!baseSlug) baseSlug = `product-${Date.now()}`;
        let finalSlug = baseSlug;
        let counter = 1;

        while (counter <= 50) {
          const existingSlug = await tx.select({ id: products.id }).from(products).where(eq(products.slug, finalSlug)).limit(1);
          if (existingSlug.length === 0) break;
          finalSlug = `${baseSlug}-${counter++}`;
        }

        const { safeCategoryId, safeBrandId } = await validateParentIds(tx, categoryId ?? null, brandId ?? null);

        const [insertRes]: any = await tx.insert(products).values({
          slug: finalSlug,
          sku: cleanSku,
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          condition: ['New', 'Used', 'Refurbished'].includes(condition) ? condition : 'New',
          categoryId: safeCategoryId ?? null,
          brandId: safeBrandId ?? null,
          isFeatured: Boolean(isFeatured),
          isNewArrival: Boolean(isNewArrival),
          status: targetStatus,
          storefrontVisible: storefrontVisible !== undefined ? Boolean(storefrontVisible) : true,
          version: 1,
          specifications: parseJsonArray(specifications),
          variants: parseJsonArray(variants),
          images: normalizeProductImages(productImages, { filterBrokenPlaceholders: false }),
          privateNotes: privateNotes || '',
          purchaseCost: purchaseCost || '',
          stockQuantity: parsedStock,
          imeiSerialNumbers: parseJsonArray(imeiSerialNumbers),
        });

        const insertedId = Number(insertRes?.insertId);
        if (!insertedId) {
          throw new HttpRouteError(500, 'Failed to obtain inserted product ID from MySQL.');
        }

        const dto = await fetchAdminProductDto(tx, insertedId);
        if (!dto) {
          throw new HttpRouteError(500, 'Failed to read back created product from database.');
        }
        return dto;
      });

      await logAudit(
        'PRODUCT_CREATE',
        `Created product: "${createdProduct.nameEn}" [SKU: ${cleanSku}]`,
        req.user?.email
      );

      return res.status(201).json(createdProduct);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error creating product:');
    }
  });

  // Admin: Update Product (Transactional + Optimistic Concurrency Control)
  app.put('/api/admin/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

      if (!(await ensureDbAvailable())) {
        return res.status(503).json({
          error: 'Database service is offline. Modifications require an active database connection.',
        });
      }

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
        storefrontVisible,
        version: clientVersion,
        specifications,
        variants,
        images: productImages,
        privateNotes,
        purchaseCost,
        stockQuantity,
        imeiSerialNumbers,
      } = req.body;

      const updatedProd = await withTransaction(async (tx) => {
        const existing = await tx.select().from(products).where(eq(products.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Product not found.');
        }
        const cur = existing[0];

        const nextSku = sku !== undefined && String(sku).trim() ? String(sku).trim().toUpperCase() : cur.sku;
        if (nextSku !== cur.sku) {
          const skuCheck = await tx.select({ id: products.id }).from(products).where(eq(products.sku, nextSku)).limit(1);
          if (skuCheck.length > 0 && skuCheck[0].id !== id) {
            throw new HttpRouteError(400, `SKU "${nextSku}" is already assigned to another product.`);
          }
        }

        const { safeCategoryId, safeBrandId } = await validateParentIds(tx, categoryId, brandId);

        const nextStatus = status !== undefined && ['published', 'draft', 'archived'].includes(status) ? status : cur.status;
        const nextCondition = condition !== undefined && ['New', 'Used', 'Refurbished'].includes(condition) ? condition : cur.condition;
        const nextStock =
          stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ''
            ? Math.max(0, parseInt(String(stockQuantity), 10) || 0)
            : cur.stockQuantity;

        const hasClientVersion =
          clientVersion !== undefined && clientVersion !== null && !isNaN(parseInt(String(clientVersion), 10));
        const expectedVersion = hasClientVersion ? parseInt(String(clientVersion), 10) : null;

        const whereCondition = hasClientVersion
          ? and(eq(products.id, id), eq(products.version, expectedVersion!))
          : eq(products.id, id);

        const [updateRes]: any = await tx
          .update(products)
          .set({
            sku: nextSku,
            nameEn: nameEn !== undefined ? String(nameEn).trim() : cur.nameEn,
            nameAr: nameAr !== undefined ? String(nameAr).trim() : cur.nameAr,
            descriptionEn: descriptionEn !== undefined ? descriptionEn : cur.descriptionEn,
            descriptionAr: descriptionAr !== undefined ? descriptionAr : cur.descriptionAr,
            condition: nextCondition,
            categoryId: safeCategoryId !== undefined ? safeCategoryId : cur.categoryId,
            brandId: safeBrandId !== undefined ? safeBrandId : cur.brandId,
            isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : cur.isFeatured,
            isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : cur.isNewArrival,
            status: nextStatus,
            storefrontVisible: storefrontVisible !== undefined ? Boolean(storefrontVisible) : cur.storefrontVisible,
            version: sql`${products.version} + 1`,
            specifications: specifications !== undefined ? parseJsonArray(specifications) : parseJsonArray(cur.specifications),
            variants: variants !== undefined ? parseJsonArray(variants) : parseJsonArray(cur.variants),
            images:
              productImages !== undefined
                ? normalizeProductImages(productImages, { filterBrokenPlaceholders: false })
                : normalizeProductImages(cur.images, { filterBrokenPlaceholders: false }),
            privateNotes: privateNotes !== undefined ? privateNotes : cur.privateNotes,
            purchaseCost: purchaseCost !== undefined ? purchaseCost : cur.purchaseCost,
            stockQuantity: nextStock,
            imeiSerialNumbers:
              imeiSerialNumbers !== undefined ? parseJsonArray(imeiSerialNumbers) : parseJsonArray(cur.imeiSerialNumbers),
            updatedAt: new Date(),
          })
          .where(whereCondition);

        if (hasClientVersion && Number(updateRes?.affectedRows || 0) === 0) {
          const latestProduct = await fetchAdminProductDto(tx, id);
          throw new HttpRouteError(
            409,
            'This product was modified by another session. Latest saved data has been fetched.',
            { latestProduct }
          );
        }

        const dto = await fetchAdminProductDto(tx, id);
        if (!dto) {
          throw new HttpRouteError(404, 'Product not found after update.');
        }
        return dto;
      });

      await logAudit(
        'PRODUCT_UPDATE',
        `Updated product: "${updatedProd.nameEn}" [SKU: ${updatedProd.sku}, v${updatedProd.version}]`,
        req.user?.email
      );

      return res.json(updatedProd);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating product:');
    }
  });

  // Admin: Duplicate Product (Authoritative MySQL)
  app.post('/api/admin/products/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service temporarily unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

      const duplicatedProd = await withTransaction(async (tx) => {
        const original = await tx.select().from(products).where(eq(products.id, id)).limit(1);
        if (original.length === 0) {
          throw new HttpRouteError(404, 'Original product not found');
        }
        const prod = original[0];

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newSku = `${prod.sku || 'SKU'}-COPY-${randomSuffix}`;
        const finalSlug = `${prod.slug || makeSlug(prod.nameEn || 'product')}-copy-${randomSuffix}`;

        const [insertRes]: any = await tx.insert(products).values({
          slug: finalSlug,
          sku: newSku,
          nameEn: `${prod.nameEn || 'Product'} (Copy)`,
          nameAr: `${prod.nameAr || prod.nameEn || 'Product'} (نسخة)`,
          descriptionEn: prod.descriptionEn || '',
          descriptionAr: prod.descriptionAr || '',
          condition: prod.condition || 'New',
          categoryId: prod.categoryId,
          brandId: prod.brandId,
          isFeatured: false,
          isNewArrival: false,
          status: 'draft',
          storefrontVisible: false,
          version: 1,
          specifications: parseJsonArray(prod.specifications),
          variants: parseJsonArray(prod.variants),
          images: normalizeProductImages(prod.images, { filterBrokenPlaceholders: false }),
          privateNotes: prod.privateNotes || '',
          purchaseCost: prod.purchaseCost || '',
          stockQuantity: 0,
          imeiSerialNumbers: [],
        });

        const insertedId = Number(insertRes?.insertId);
        if (!insertedId) {
          throw new HttpRouteError(500, 'Failed to duplicate product.');
        }

        const dto = await fetchAdminProductDto(tx, insertedId);
        if (!dto) {
          throw new HttpRouteError(500, 'Failed to load duplicated product.');
        }
        return dto;
      });

      await logAudit(
        'PRODUCT_DUPLICATE',
        `Duplicated product ID ${id} to "${duplicatedProd.nameEn}" [SKU: ${duplicatedProd.sku}]`,
        req.user?.email
      );

      return res.status(201).json(duplicatedProd);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error duplicating product:');
    }
  });

  // Admin: Delete Product
  app.delete('/api/admin/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Product deletion unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const prodName = await withTransaction(async (tx) => {
        const prod = await tx.select().from(products).where(eq(products.id, id)).limit(1);
        if (prod.length === 0) {
          throw new HttpRouteError(404, 'Product not found');
        }
        await tx.delete(products).where(eq(products.id, id));
        return prod[0].nameEn || `Product #${id}`;
      });

      await logAudit(
        'PRODUCT_DELETE',
        `Deleted product "${prodName}" (ID: ${id})`,
        req.user?.email
      );

      return res.json({ success: true, message: 'Product deleted', id });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error deleting product:');
    }
  });

  // Admin: Update Status (publish / unpublish / archive)
  app.patch('/api/admin/products/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Status update unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const { status, storefrontVisible, version: clientVersion } = req.body;
      if (!['published', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedProd = await withTransaction(async (tx) => {
        const existing = await tx.select().from(products).where(eq(products.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Product not found');
        }

        const hasClientVersion =
          clientVersion !== undefined && clientVersion !== null && !isNaN(parseInt(String(clientVersion), 10));
        const expectedVersion = hasClientVersion ? parseInt(String(clientVersion), 10) : null;
        const whereCondition = hasClientVersion
          ? and(eq(products.id, id), eq(products.version, expectedVersion!))
          : eq(products.id, id);

        const updateFields: any = {
          status,
          version: sql`${products.version} + 1`,
          updatedAt: new Date(),
        };
        if (storefrontVisible !== undefined) {
          updateFields.storefrontVisible = Boolean(storefrontVisible);
        }

        const [updateRes]: any = await tx.update(products).set(updateFields).where(whereCondition);
        if (hasClientVersion && Number(updateRes?.affectedRows || 0) === 0) {
          const latestProduct = await fetchAdminProductDto(tx, id);
          throw new HttpRouteError(409, 'Product was modified by another session. Latest data loaded.', { latestProduct });
        }

        const dto = await fetchAdminProductDto(tx, id);
        if (!dto) {
          throw new HttpRouteError(404, 'Product not found after status update.');
        }
        return dto;
      });

      await logAudit(
        'PRODUCT_STATUS_CHANGE',
        `Changed status of "${updatedProd.nameEn || `Product #${id}`}" to ${status}`,
        req.user?.email
      );

      return res.json(updatedProd);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error changing product status:');
    }
  });

  // Admin: Quick Product Field Update (isFeatured, isNewArrival, stockQuantity, status, storefrontVisible)
  app.patch('/api/admin/products/:id/quick-update', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({
          error: 'Database service is offline. Modifications are paused to prevent catalog split-brain inconsistency with the persistent store.',
        });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const { isFeatured, isNewArrival, stockQuantity, status, storefrontVisible, version: clientVersion } = req.body;

      const updatedProd = await withTransaction(async (tx) => {
        const existing = await tx.select().from(products).where(eq(products.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Product not found');
        }

        const updateData: any = {
          updatedAt: new Date(),
          version: sql`${products.version} + 1`,
        };
        if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
        if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);
        if (storefrontVisible !== undefined) updateData.storefrontVisible = Boolean(storefrontVisible);
        if (stockQuantity !== undefined) {
          updateData.stockQuantity = Math.max(0, parseInt(String(stockQuantity), 10) || 0);
        }
        if (status !== undefined) {
          if (!['published', 'draft', 'archived'].includes(status)) {
            throw new HttpRouteError(400, 'Invalid status value.');
          }
          updateData.status = status;
        }

        const hasClientVersion =
          clientVersion !== undefined && clientVersion !== null && !isNaN(parseInt(String(clientVersion), 10));
        const expectedVersion = hasClientVersion ? parseInt(String(clientVersion), 10) : null;
        const whereCondition = hasClientVersion
          ? and(eq(products.id, id), eq(products.version, expectedVersion!))
          : eq(products.id, id);

        const [updateRes]: any = await tx.update(products).set(updateData).where(whereCondition);
        if (hasClientVersion && Number(updateRes?.affectedRows || 0) === 0) {
          const latestProduct = await fetchAdminProductDto(tx, id);
          throw new HttpRouteError(409, 'Product was modified by another session. Latest data loaded.', { latestProduct });
        }

        const dto = await fetchAdminProductDto(tx, id);
        if (!dto) {
          throw new HttpRouteError(404, 'Product not found after quick update.');
        }
        return dto;
      });

      await logAudit(
        'PRODUCT_QUICK_UPDATE',
        `Quick updated "${updatedProd.nameEn || `Product #${id}`}" (stock: ${updatedProd.stockQuantity ?? 0}, status: ${updatedProd.status}, visible: ${updatedProd.storefrontVisible})`,
        req.user?.email
      );

      return res.json(updatedProd);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error quick updating product:');
    }
  });

  // Admin: Bulk Products Status Action
  app.post('/api/admin/products/bulk-status', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Bulk status update unavailable.' });
      }

      const { ids, status, storefrontVisible } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No product IDs provided' });
      }
      if (!['published', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const numIds = ids.map((id: any) => parseInt(String(id), 10)).filter((n) => !isNaN(n));
      if (numIds.length === 0) {
        return res.status(400).json({ error: 'No valid numeric product IDs provided' });
      }

      await withTransaction(async (tx) => {
        const updateSet: any = {
          status,
          version: sql`${products.version} + 1`,
          updatedAt: new Date(),
        };
        if (storefrontVisible !== undefined) {
          updateSet.storefrontVisible = Boolean(storefrontVisible);
        }
        for (const id of numIds) {
          await tx.update(products).set(updateSet).where(eq(products.id, id));
        }
      });

      await logAudit(
        'PRODUCT_BULK_STATUS',
        `Changed status of ${numIds.length} products to ${status}`,
        req.user?.email
      );

      return res.json({ success: true, count: numIds.length, status });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating bulk status:');
    }
  });

  // Admin: Bulk Products Delete Action
  app.post('/api/admin/products/bulk-delete', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Bulk delete unavailable.' });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No product IDs provided' });
      }

      const numIds = ids.map((id: any) => parseInt(String(id), 10)).filter((n) => !isNaN(n));
      if (numIds.length === 0) {
        return res.status(400).json({ error: 'No valid numeric product IDs provided' });
      }

      await withTransaction(async (tx) => {
        for (const id of numIds) {
          await tx.delete(products).where(eq(products.id, id));
        }
      });

      await logAudit('PRODUCT_BULK_DELETE', `Deleted ${numIds.length} products`, req.user?.email);
      return res.json({ success: true, count: numIds.length });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error deleting bulk products:');
    }
  });

  // Admin: Upload Single Image (Fail-closed: requires live MySQL commit + verified disk write, rollback on error)
  app.post('/api/admin/upload-image', requireAuth, async (req: AuthRequest, res) => {
    const writtenDiskPaths: string[] = [];
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Image upload requires active database persistence.' });
      }

      const { mimeType, data } = req.body;
      const decoded = decodeAndValidateImageUpload(data, mimeType);
      const uniqueToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const diskFileName = `product_${uniqueToken}.${decoded.ext}`;
      const diskFilePath = path.join(UPLOADS_DIR, diskFileName);

      // 1. Write file to disk and verify exact byte count
      fs.writeFileSync(diskFilePath, decoded.buffer);
      writtenDiskPaths.push(diskFilePath);
      const stat = fs.statSync(diskFilePath);
      if (stat.size !== decoded.buffer.length || stat.size === 0) {
        throw new HttpRouteError(500, 'Uploaded image disk write size verification failed.');
      }

      // 2. Commit authoritatively inside MySQL transaction and read back inserted row
      const canonicalDataUri = `data:${decoded.mimeType};base64,${decoded.buffer.toString('base64')}`;
      const imageId = await withTransaction(async (tx) => {
        const [savedImageRes]: any = await tx.insert(images).values({
          fileName: diskFileName,
          mimeType: decoded.mimeType,
          data: canonicalDataUri,
        });
        const insertedId = Number(savedImageRes?.insertId);
        if (!insertedId) {
          throw new HttpRouteError(500, 'MySQL did not return an inserted image ID.');
        }
        const verified = await tx
          .select({ id: images.id, fileName: images.fileName })
          .from(images)
          .where(eq(images.id, insertedId))
          .limit(1);
        if (verified.length === 0) {
          throw new HttpRouteError(500, 'Failed to verify image record persistence in MySQL.');
        }
        return insertedId;
      });

      const imageUrl = `/uploads/${diskFileName}`;
      fallbackImagesStore.set(diskFileName, { fileName: diskFileName, mimeType: decoded.mimeType, data: canonicalDataUri });
      fallbackImagesStore.set(imageId, { fileName: diskFileName, mimeType: decoded.mimeType, data: canonicalDataUri });

      return res.status(201).json({
        id: imageId,
        url: imageUrl,
        fileName: diskFileName,
      });
    } catch (error: any) {
      for (const filePath of writtenDiskPaths) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
      return handleDbRouteError(error, res, 'Error storing image:');
    }
  });

  // Admin: Upload Multiple Images in Batch (Transactional disk + MySQL commit with full rollback)
  app.post('/api/admin/upload-images', requireAuth, async (req: AuthRequest, res) => {
    const writtenDiskPaths: string[] = [];
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Batch image upload requires active database persistence.' });
      }

      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Array of image items is required.' });
      }

      const preparedItems: Array<{
        diskFileName: string;
        diskFilePath: string;
        mimeType: string;
        buffer: Buffer;
        canonicalDataUri: string;
      }> = [];

      for (const item of items) {
        const decoded = decodeAndValidateImageUpload(item?.data, item?.mimeType);
        const uniqueToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const diskFileName = `product_${uniqueToken}.${decoded.ext}`;
        const diskFilePath = path.join(UPLOADS_DIR, diskFileName);
        preparedItems.push({
          diskFileName,
          diskFilePath,
          mimeType: decoded.mimeType,
          buffer: decoded.buffer,
          canonicalDataUri: `data:${decoded.mimeType};base64,${decoded.buffer.toString('base64')}`,
        });
      }

      for (const prep of preparedItems) {
        fs.writeFileSync(prep.diskFilePath, prep.buffer);
        writtenDiskPaths.push(prep.diskFilePath);
        const stat = fs.statSync(prep.diskFilePath);
        if (stat.size !== prep.buffer.length || stat.size === 0) {
          throw new HttpRouteError(500, `Disk size verification failed for ${prep.diskFileName}.`);
        }
      }

      const uploadedResults = await withTransaction(async (tx) => {
        const results: Array<{ id: number; url: string; fileName: string; mimeType: string; canonicalDataUri: string }> = [];
        for (const prep of preparedItems) {
          const [savedImageRes]: any = await tx.insert(images).values({
            fileName: prep.diskFileName,
            mimeType: prep.mimeType,
            data: prep.canonicalDataUri,
          });
          const insertedId = Number(savedImageRes?.insertId);
          if (!insertedId) {
            throw new HttpRouteError(500, 'MySQL did not return an inserted image ID during batch upload.');
          }
          const verified = await tx
            .select({ id: images.id })
            .from(images)
            .where(eq(images.id, insertedId))
            .limit(1);
          if (verified.length === 0) {
            throw new HttpRouteError(500, 'Batch image verification failed in MySQL.');
          }
          results.push({
            id: insertedId,
            url: `/uploads/${prep.diskFileName}`,
            fileName: prep.diskFileName,
            mimeType: prep.mimeType,
            canonicalDataUri: prep.canonicalDataUri,
          });
        }
        return results;
      });

      for (const item of uploadedResults) {
        fallbackImagesStore.set(item.fileName, { fileName: item.fileName, mimeType: item.mimeType, data: item.canonicalDataUri });
        fallbackImagesStore.set(item.id, { fileName: item.fileName, mimeType: item.mimeType, data: item.canonicalDataUri });
      }

      return res.status(201).json({
        success: true,
        count: uploadedResults.length,
        images: uploadedResults.map(({ id, url, fileName }) => ({ id, url, fileName })),
      });
    } catch (error: any) {
      for (const filePath of writtenDiskPaths) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
      return handleDbRouteError(error, res, 'Error storing batch images:');
    }
  });

  // Admin: Categories Management
  app.post('/api/admin/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Category creation unavailable.' });
      }

      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      if (!nameEn || !nameEn.trim()) {
        return res.status(400).json({ error: 'Category name (English) is required' });
      }

      const savedCat = await withTransaction(async (tx) => {
        let baseSlug = makeSlug(nameEn.trim());
        if (!baseSlug) {
          baseSlug = `cat-${Date.now().toString(36)}`;
        }
        let finalSlug = baseSlug;

        let counter = 1;
        while (counter <= 50) {
          const check = await tx
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, finalSlug))
            .limit(1);
          if (check.length === 0) break;
          finalSlug = `${baseSlug}-${counter++}`;
        }

        const [catRes]: any = await tx.insert(categories).values({
          slug: finalSlug,
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          icon: (icon || 'Smartphone').trim(),
          displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
        });

        const insertedId = Number(catRes?.insertId);
        if (!insertedId) {
          throw new HttpRouteError(500, 'Failed to obtain inserted category ID');
        }

        const fetched = await tx.select().from(categories).where(eq(categories.id, insertedId)).limit(1);
        return fetched[0];
      });

      await logAudit('CATEGORY_CREATE', `Created category "${nameEn.trim()}" (ID: ${savedCat.id})`, req.user?.email);
      return res.status(201).json(savedCat);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error creating category:');
    }
  });

  app.put('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Category update unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;

      const updatedCat = await withTransaction(async (tx) => {
        const existing = await tx.select().from(categories).where(eq(categories.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Category not found');
        }

        await tx
          .update(categories)
          .set({
            nameEn: nameEn ? nameEn.trim() : undefined,
            nameAr: nameAr ? nameAr.trim() : undefined,
            descriptionEn: descriptionEn !== undefined ? descriptionEn : undefined,
            descriptionAr: descriptionAr !== undefined ? descriptionAr : undefined,
            icon: icon || undefined,
            displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
          })
          .where(eq(categories.id, id));

        const updated = await tx.select().from(categories).where(eq(categories.id, id)).limit(1);
        return updated[0];
      });

      await logAudit('CATEGORY_UPDATE', `Updated category "${updatedCat.nameEn || id}"`, req.user?.email);
      return res.json(updatedCat);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating category:');
    }
  });

  app.delete('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Category deletion unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      await withTransaction(async (tx) => {
        const prods = await tx.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
        if (prods.length > 0) {
          throw new HttpRouteError(400, 'Cannot delete category containing existing products. Reassign or delete products first.');
        }

        const existing = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Category not found');
        }

        await tx.delete(categories).where(eq(categories.id, id));
      });

      await logAudit('CATEGORY_DELETE', `Deleted category ID ${id}`, req.user?.email);
      return res.json({ success: true, message: 'Category deleted', id });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error deleting category:');
    }
  });

  // Admin: Brands Management
  app.post('/api/admin/brands', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Brand creation unavailable.' });
      }

      const { name, logoUrl } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Brand name is required' });
      }

      const savedBrand = await withTransaction(async (tx) => {
        let baseSlug = makeSlug(name.trim());
        if (!baseSlug) {
          baseSlug = `brand-${Date.now().toString(36)}`;
        }
        let finalSlug = baseSlug;

        let counter = 1;
        while (counter <= 50) {
          const check = await tx
            .select({ id: brands.id })
            .from(brands)
            .where(eq(brands.slug, finalSlug))
            .limit(1);
          if (check.length === 0) break;
          finalSlug = `${baseSlug}-${counter++}`;
        }

        const [brRes]: any = await tx.insert(brands).values({
          slug: finalSlug,
          name: name.trim(),
          logoUrl: (logoUrl || '').trim(),
        });

        const insertedId = Number(brRes?.insertId);
        if (!insertedId) {
          throw new HttpRouteError(500, 'Failed to obtain inserted brand ID');
        }

        const fetched = await tx.select().from(brands).where(eq(brands.id, insertedId)).limit(1);
        return fetched[0];
      });

      await logAudit('BRAND_CREATE', `Created brand "${name.trim()}" (ID: ${savedBrand.id}, slug: ${savedBrand.slug})`, req.user?.email);
      return res.status(201).json(savedBrand);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error creating brand:');
    }
  });

  app.put('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Brand update unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid brand ID' });
      }

      const { name, logoUrl } = req.body;

      const updatedBrand = await withTransaction(async (tx) => {
        const existing = await tx.select().from(brands).where(eq(brands.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Brand not found');
        }

        await tx
          .update(brands)
          .set({
            name: name ? name.trim() : undefined,
            logoUrl: logoUrl !== undefined ? logoUrl.trim() : undefined,
          })
          .where(eq(brands.id, id));

        const updated = await tx.select().from(brands).where(eq(brands.id, id)).limit(1);
        return updated[0];
      });

      await logAudit('BRAND_UPDATE', `Updated brand "${updatedBrand.name || id}"`, req.user?.email);
      return res.json(updatedBrand);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating brand:');
    }
  });

  app.delete('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Brand deletion unavailable.' });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid brand ID' });
      }

      await withTransaction(async (tx) => {
        const prods = await tx.select({ id: products.id }).from(products).where(eq(products.brandId, id)).limit(1);
        if (prods.length > 0) {
          throw new HttpRouteError(400, 'Cannot delete brand with associated products.');
        }

        const existing = await tx.select({ id: brands.id }).from(brands).where(eq(brands.id, id)).limit(1);
        if (existing.length === 0) {
          throw new HttpRouteError(404, 'Brand not found');
        }

        await tx.delete(brands).where(eq(brands.id, id));
      });

      await logAudit('BRAND_DELETE', `Deleted brand ID ${id}`, req.user?.email);
      return res.json({ success: true, message: 'Brand deleted', id });
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error deleting brand:');
    }
  });

  // ----------------------------------------------------
  // Admin: Services Management (Legacy in-memory store)
  // ----------------------------------------------------
  let customServices: any[] = [];

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

      await logAudit('SERVICE_UPDATE', `Updated service "${updatedService.titleEn || id}"`, req.user?.email);
      res.json(updatedService);
    } catch (error: any) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: error.message || 'Failed to update service' });
    }
  });

  app.delete('/api/admin/services/:id', requireAuth, async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    customServices = customServices.filter((s) => s.id !== id);
    res.json({ success: true, id });
  });

  app.patch('/api/admin/services/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    res.json({ id, isActive: false });
  });

  // Admin: WhatsApp Settings
  app.get('/api/admin/whatsapp-settings', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. WhatsApp settings unavailable.' });
      }
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.status(404).json({ error: 'WhatsApp settings not configured.' });
      }
      return res.json(settings[0]);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Database error fetching admin WhatsApp settings:');
    }
  });

  app.put('/api/admin/whatsapp-settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Modifications unavailable.' });
      }

      const {
        primaryNumber,
        secondaryNumber,
        activeNumber,
        isEnabled,
        templateEn,
        templateAr,
      } = req.body;

      const updatedRow = await withTransaction(async (tx) => {
        const existing = await tx.select().from(whatsappSettings).limit(1);
        if (existing.length === 0) {
          const [insertRes]: any = await tx.insert(whatsappSettings).values({
            primaryNumber: primaryNumber || '+971522523900',
            secondaryNumber: secondaryNumber || '+971563903672',
            activeNumber: activeNumber || '+971522523900',
            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
            templateEn: templateEn || '',
            templateAr: templateAr || '',
          });
          const insertedId = Number(insertRes?.insertId) || 1;
          const rows = await tx.select().from(whatsappSettings).where(eq(whatsappSettings.id, insertedId)).limit(1);
          return rows[0];
        } else {
          await tx
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
            .where(eq(whatsappSettings.id, existing[0].id));
          const rows = await tx.select().from(whatsappSettings).where(eq(whatsappSettings.id, existing[0].id)).limit(1);
          return rows[0];
        }
      });

      await logAudit(
        'WHATSAPP_UPDATE',
        `Updated WhatsApp settings (Active: ${updatedRow.activeNumber}, Enabled: ${updatedRow.isEnabled})`,
        req.user?.email
      );

      return res.json(updatedRow);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating WhatsApp settings:');
    }
  });

  // Admin: Site Content
  app.get('/api/admin/site-content', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Site content unavailable.' });
      }
      const content = await db.select().from(siteContent).limit(1);
      if (content.length === 0) {
        return res.status(404).json({ error: 'Site content not configured.' });
      }
      return res.json(content[0]);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Database error fetching admin site content:');
    }
  });

  app.put('/api/admin/site-content', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service is offline. Modifications unavailable.' });
      }

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

      const updatedRow = await withTransaction(async (tx) => {
        const existing = await tx.select().from(siteContent).limit(1);
        if (existing.length === 0) {
          const [insertRes]: any = await tx.insert(siteContent).values({
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
          });
          const insertedId = Number(insertRes?.insertId) || 1;
          const rows = await tx.select().from(siteContent).where(eq(siteContent.id, insertedId)).limit(1);
          return rows[0];
        } else {
          await tx
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
            .where(eq(siteContent.id, existing[0].id));
          const rows = await tx.select().from(siteContent).where(eq(siteContent.id, existing[0].id)).limit(1);
          return rows[0];
        }
      });

      await logAudit('CONTENT_UPDATE', 'Updated homepage banner and site information', req.user?.email);
      return res.json(updatedRow);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error updating site content:');
    }
  });

  // Admin: Audit Logs
  app.get('/api/admin/audit-logs', requireAuth, async (_req: AuthRequest, res) => {
    try {
      if (!(await ensureDbAvailable())) {
        return res.status(503).json({ error: 'Database service temporarily unavailable. Please retry shortly.' });
      }
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      return res.json(logs);
    } catch (error: any) {
      return handleDbRouteError(error, res, 'Error fetching audit logs:');
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
    if (!(await ensureDbAvailable())) return;
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
        .select({ count: sql<number>`count(distinct ${visitorLogs.visitorId})` })
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

        // Async persist to MySQL if available
        if ((await ensureDbAvailable()) && isNewToday) {
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
                .onDuplicateKeyUpdate({
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

      if (await ensureDbAvailable()) {
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
          .onDuplicateKeyUpdate({
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

      if (await ensureDbAvailable()) {
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

  if (process.env.NODE_ENV === 'production') {
    if (hasDist) {
      app.use(express.static(distDir, {
        setHeaders(res, filePath) {
          if (/\/assets\/.*-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(filePath.replace(/\\/g, '/'))) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        }
      }));
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
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, using fallback:', viteErr);
      if (hasDist) {
        app.use(express.static(distDir, {
        setHeaders(res, filePath) {
          if (/\/assets\/.*-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(filePath.replace(/\\/g, '/'))) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        }
      }));
        app.get('*', (_req, res) => res.sendFile(indexHtml));
      }
    }
  }

  // ----------------------------------------------------
  // PORT & PASSENGER SOCKET BINDING (Hostinger / Cloud / AI Studio)
  // ----------------------------------------------------
  // Parse command line arguments for --port and --host (e.g. tsx server.ts --port 3000 --host 0.0.0.0)
  const args = process.argv.slice(2);
  let cliPort: number | null = null;
  let cliHost = '0.0.0.0';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      cliPort = parseInt(args[i + 1], 10);
    } else if (args[i] === '--host' && args[i + 1]) {
      cliHost = args[i + 1];
    }
  }

  let portToListen: any = 3000;

  if (typeof (global as any).PhusionPassenger !== 'undefined') {
    portToListen = 'passenger';
  } else if (cliPort && !isNaN(cliPort)) {
    portToListen = cliPort;
  } else if (process.env.DEFAULT_APP_PORT) {
    portToListen = Number(process.env.DEFAULT_APP_PORT) || 3000;
  } else if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    portToListen = isNaN(Number(process.env.PORT)) ? process.env.PORT : Number(process.env.PORT);
  } else {
    portToListen = 3000;
  }

  const server = typeof portToListen === 'string'
    ? app.listen(portToListen, () => {
        console.log(`Nasir Mobile server listening on socket: ${portToListen}`);
      })
    : app.listen(portToListen, cliHost, () => {
        console.log(`Nasir Mobile Full-Stack server running at http://${cliHost}:${portToListen}`);
      });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err?.message || err);
  });
}

startServer().catch((err) => {
  console.error('Non-fatal error caught on server startup:', err);
});

