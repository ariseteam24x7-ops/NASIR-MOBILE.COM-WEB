import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './src/db/index.ts';
import {
  products,
  categories,
  brands,
  images,
  whatsappSettings,
  siteContent,
  auditLogs,
  users,
} from './src/db/schema.ts';
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm';
import { requireAuth, AuthRequest, adminSessions, createSignedToken } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
  // PUBLIC APIS (ABSOLUTE PRIVACY: NO COSTS, STOCK, IMEIS, ETC.)
  // ----------------------------------------------------

  // Public Categories
  app.get('/api/categories', async (_req, res) => {
    try {
      const allCategories = await db
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
      res.json(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Public Brands
  app.get('/api/brands', async (_req, res) => {
    try {
      const allBrands = await db
        .select({
          id: brands.id,
          slug: brands.slug,
          name: brands.name,
          logoUrl: brands.logoUrl,
        })
        .from(brands)
        .orderBy(asc(brands.name));
      res.json(allBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands' });
    }
  });

  // Public Products Catalogue (Filters: category, brand, condition, featured, newArrival, search, sort)
  // ABSOLUTE PRIVACY: Only public catalogue fields returned
  app.get('/api/products', async (req, res) => {
    try {
      const { category, brand, condition, featured, newArrival, search, sort } = req.query;

      const conditions = [eq(products.status, 'published')];

      if (category && typeof category === 'string') {
        const cat = await db.select().from(categories).where(eq(categories.slug, category)).limit(1);
        if (cat.length > 0) {
          conditions.push(eq(products.categoryId, cat[0].id));
        }
      }

      if (brand && typeof brand === 'string') {
        const br = await db.select().from(brands).where(eq(brands.slug, brand)).limit(1);
        if (br.length > 0) {
          conditions.push(eq(products.brandId, br[0].id));
        }
      }

      if (condition && typeof condition === 'string' && ['New', 'Used', 'Refurbished'].includes(condition)) {
        conditions.push(eq(products.condition, condition));
      }

      if (featured === 'true') {
        conditions.push(eq(products.isFeatured, true));
      }

      if (newArrival === 'true') {
        conditions.push(eq(products.isNewArrival, true));
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(products.nameEn, query),
            ilike(products.nameAr, query),
            ilike(products.sku, query),
            ilike(products.descriptionEn, query),
            ilike(products.descriptionAr, query)
          )!
        );
      }

      let query = db
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
        .where(and(...conditions));

      // Sorting
      if (sort === 'name-asc') {
        query = query.orderBy(asc(products.nameEn)) as any;
      } else if (sort === 'name-desc') {
        query = query.orderBy(desc(products.nameEn)) as any;
      } else {
        query = query.orderBy(desc(products.createdAt)) as any;
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Error fetching public products:', error);
      res.status(500).json({ error: 'Failed to fetch catalogue products' });
    }
  });

  // Public Single Product by Slug
  app.get('/api/products/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
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

      if (product.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Fetch related products in the same category
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

      res.json({
        product: product[0],
        related,
      });
    } catch (error) {
      console.error('Error fetching single product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Public WhatsApp Settings (Safe public subset)
  app.get('/api/whatsapp-settings', async (_req, res) => {
    try {
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.json({
          activeNumber: '+971522523900',
          primaryNumber: '+971522523900',
          secondaryNumber: '+971563903672',
          isEnabled: true,
          templateEn:
            'Hello Nasir Mobile Dubai! I am inquiring about {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.',
          templateAr:
            'مرحباً ناصر موبايل دبي! أود الاستفسار عن {productName} ({brand}) [رمز المنتج: {sku}]. الحالة: {condition}. {variant}الرابط: {url}. يرجى تزويدي بالتفاصيل والتوفر.',
        });
      }
      res.json({
        activeNumber: settings[0].activeNumber,
        primaryNumber: settings[0].primaryNumber,
        secondaryNumber: settings[0].secondaryNumber,
        isEnabled: settings[0].isEnabled,
        templateEn: settings[0].templateEn,
        templateAr: settings[0].templateAr,
      });
    } catch (error) {
      console.error('Error fetching whatsapp settings:', error);
      res.status(500).json({ error: 'Failed to fetch WhatsApp configuration' });
    }
  });

  // Public Site Content
  app.get('/api/site-content', async (_req, res) => {
    try {
      const content = await db.select().from(siteContent).limit(1);
      if (content.length === 0) {
        return res.json({
          heroTitleEn: 'Premium Technology & Smart Devices in Dubai',
          heroTitleAr: 'أحدث الهواتف الذكية والتكنولوجيا في دبي',
          heroSubtitleEn: 'Explore genuine new, used, and certified refurbished flagship devices, luxury audio, and authentic accessories at Nasir Mobile.',
          heroSubtitleAr: 'استكشف أحدث الهواتف الأصلية الجديدة والمستعملة والمجددة، وأجهزة الصوت الراقية والإكسسوارات المعتمدة لدى ناصر موبايل.',
          announcementEn: 'Welcome to Nasir Mobile Dubai • Direct WhatsApp Enquiries • Guaranteed Authenticity',
          announcementAr: 'أهلاً بكم في ناصر موبايل دبي • استفسار فوري عبر واتساب • أجهزة أصلية معتمدة',
          announcementActive: true,
          aboutEn: 'Nasir Mobile is Dubai’s trusted destination for smartphones, tablets, premium accessories, and certified electronics.',
          aboutAr: 'ناصر موبايل هي وجهتك الموثوقة للهواتف الذكية والأجهزة اللوحية والإكسسوارات في دبي.',
          contactAddressEn: 'Deira / Silicon Oasis, Dubai, United Arab Emirates',
          contactAddressAr: 'ديرة / واحة دبي للسيليكون، دبي، الإمارات العربية المتحدة',
          contactEmail: 'shazzzbusiness@gmail.com',
          openingHoursEn: 'Saturday - Thursday: 10:00 AM - 10:30 PM | Friday: 3:00 PM - 10:30 PM',
          openingHoursAr: 'السبت - الخميس: 10:00 صباحاً - 10:30 مساءً | الجمعة: 3:00 عصراً - 10:30 مساءً',
        });
      }
      res.json(content[0]);
    } catch (error) {
      console.error('Error fetching site content:', error);
      res.status(500).json({ error: 'Failed to fetch site content' });
    }
  });

  // Stored Image delivery endpoint from PostgreSQL persistent storage
  app.get('/api/images/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).send('Invalid image ID');
      }
      const img = await db.select().from(images).where(eq(images.id, id)).limit(1);
      if (img.length === 0) {
        return res.status(404).send('Image not found');
      }

      // If data is base64 data URI format: data:image/png;base64,xxxx
      const rawData = img[0].data;
      if (rawData.startsWith('data:')) {
        const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(buffer);
        }
      }

      // Default fallback
      const buffer = Buffer.from(rawData, 'base64');
      res.setHeader('Content-Type', img[0].mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error) {
      console.error('Error delivering stored image:', error);
      res.status(500).send('Failed to retrieve image');
    }
  });

  // ----------------------------------------------------
  // ADMIN AUTHENTICATION
  // ----------------------------------------------------

  const isMasterKey = (key: string | undefined | null) => {
    if (!key) return false;
    const trimmed = String(key).trim();
    const envKey = (process.env.OWNER_SETUP_KEY || '').trim();
    return (
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

          // Ensure owner is recorded in users table
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

      // Case B: Firebase Auth ID Token login
      if (firebaseToken) {
        let tokenEmail = '';
        let uid = '';
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin.ts');
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

  // ----------------------------------------------------
  // ADMIN DASHBOARD & CATALOGUE MANAGEMENT
  // ----------------------------------------------------

  // Dashboard Overview
  app.get('/api/admin/overview', requireAuth, async (_req: AuthRequest, res) => {
    try {
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
      console.error('Error fetching admin overview:', error);
      res.status(500).json({ error: 'Failed to fetch admin overview' });
    }
  });

  // Admin: Get all products (includes private notes, costs, serial numbers for the owner)
  app.get('/api/admin/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { search, status, categoryId, brandId } = req.query;
      const conditions: any[] = [];

      if (status && typeof status === 'string' && status !== 'all') {
        conditions.push(eq(products.status, status));
      }

      if (categoryId && !isNaN(parseInt(categoryId as string, 10))) {
        conditions.push(eq(products.categoryId, parseInt(categoryId as string, 10)));
      }

      if (brandId && !isNaN(parseInt(brandId as string, 10))) {
        conditions.push(eq(products.brandId, parseInt(brandId as string, 10)));
      }

      const { condition } = req.query;
      if (condition && typeof condition === 'string' && ['New', 'Used', 'Refurbished'].includes(condition)) {
        conditions.push(eq(products.condition, condition));
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(products.nameEn, query),
            ilike(products.nameAr, query),
            ilike(products.sku, query),
            ilike(products.descriptionEn, query)
          )!
        );
      }

      const query = db
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
          brandName: brands.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id));

      const results =
        conditions.length > 0
          ? await query.where(and(...conditions)).orderBy(desc(products.createdAt))
          : await query.orderBy(desc(products.createdAt));

      res.json(results);
    } catch (error) {
      console.error('Error fetching admin products:', error);
      res.status(500).json({ error: 'Failed to fetch admin catalogue' });
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

      // Check unique SKU
      const existingSku = await db.select().from(products).where(eq(products.sku, sku.trim())).limit(1);
      if (existingSku.length > 0) {
        return res.status(400).json({ error: `Product with SKU "${sku.trim()}" already exists.` });
      }

      // Generate base slug
      let baseSlug = makeSlug(nameEn);
      if (!baseSlug) baseSlug = `product-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;

      while (true) {
        const existingSlug = await db.select().from(products).where(eq(products.slug, finalSlug)).limit(1);
        if (existingSlug.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const newProduct = await db
        .insert(products)
        .values({
          slug: finalSlug,
          sku: sku.trim().toUpperCase(),
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || '',
          descriptionAr: descriptionAr || '',
          condition: condition || 'New',
          categoryId: categoryId ? parseInt(categoryId, 10) : null,
          brandId: brandId ? parseInt(brandId, 10) : null,
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

      await logAudit(
        'PRODUCT_CREATE',
        `Created product: "${nameEn}" [SKU: ${sku.trim().toUpperCase()}]`,
        req.user?.email
      );

      res.status(201).json(newProduct[0]);
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

      // Verify existing product
      const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check unique SKU if changed
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

      await logAudit(
        'PRODUCT_UPDATE',
        `Updated product: "${updated[0].nameEn}" [SKU: ${updated[0].sku}]`,
        req.user?.email
      );

      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  });

  // Admin: Duplicate Product
  app.post('/api/admin/products/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const original = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (original.length === 0) {
        return res.status(404).json({ error: 'Original product not found' });
      }

      const prod = original[0];
      const newSku = `${prod.sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}`;
      const baseSlug = `${prod.slug}-copy`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const slugCheck = await db.select().from(products).where(eq(products.slug, finalSlug)).limit(1);
        if (slugCheck.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const duplicated = await db
        .insert(products)
        .values({
          slug: finalSlug,
          sku: newSku,
          nameEn: `${prod.nameEn} (Copy)`,
          nameAr: `${prod.nameAr} (نسخة)`,
          descriptionEn: prod.descriptionEn,
          descriptionAr: prod.descriptionAr,
          condition: prod.condition,
          categoryId: prod.categoryId,
          brandId: prod.brandId,
          isFeatured: false,
          isNewArrival: false,
          status: 'draft', // duplicated items start in draft mode
          specifications: prod.specifications,
          variants: prod.variants,
          images: prod.images,
          privateNotes: prod.privateNotes,
          purchaseCost: prod.purchaseCost,
          stockQuantity: 0,
          imeiSerialNumbers: [],
        })
        .returning();

      await logAudit(
        'PRODUCT_DUPLICATE',
        `Duplicated product ID ${id} to "${duplicated[0].nameEn}" [SKU: ${newSku}]`,
        req.user?.email
      );

      res.status(201).json(duplicated[0]);
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      res.status(500).json({ error: error.message || 'Failed to duplicate product' });
    }
  });

  // Admin: Delete Product
  app.delete('/api/admin/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (prod.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await db.delete(products).where(eq(products.id, id));

      await logAudit(
        'PRODUCT_DELETE',
        `Deleted product "${prod[0].nameEn}" [SKU: ${prod[0].sku}]`,
        req.user?.email
      );

      res.json({ success: true, message: 'Product deleted' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
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

      const updated = await db
        .update(products)
        .set({ status, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await logAudit(
        'PRODUCT_STATUS_CHANGE',
        `Changed status of "${updated[0].nameEn}" to ${status}`,
        req.user?.email
      );

      res.json(updated[0]);
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
      if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
      if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
        updateData.status = status;
      }

      const updated = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await logAudit(
        'PRODUCT_QUICK_UPDATE',
        `Quick updated "${updated[0].nameEn}" (stock: ${updated[0].stockQuantity}, featured: ${updated[0].isFeatured})`,
        req.user?.email
      );

      res.json(updated[0]);
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

      for (const id of ids) {
        await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
      }

      await logAudit(
        'PRODUCT_BULK_STATUS',
        `Changed status of ${ids.length} products to ${status}`,
        req.user?.email
      );

      res.json({ success: true, count: ids.length, status });
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

      for (const id of ids) {
        await db.delete(products).where(eq(products.id, id));
      }

      await logAudit('PRODUCT_BULK_DELETE', `Deleted ${ids.length} products`, req.user?.email);
      res.json({ success: true, count: ids.length });
    } catch (error: any) {
      console.error('Error deleting bulk products:', error);
      res.status(500).json({ error: error.message || 'Failed to delete bulk products' });
    }
  });

  // Admin: Upload Single Image
  app.post('/api/admin/upload-image', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { fileName, mimeType, data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Image data is required.' });
      }

      const savedImage = await db
        .insert(images)
        .values({
          fileName: fileName || `image-${Date.now()}.jpg`,
          mimeType: mimeType || 'image/jpeg',
          data: data, // base64 string
        })
        .returning();

      const imageId = savedImage[0].id;
      const imageUrl = `/api/images/${imageId}`;

      res.status(201).json({
        id: imageId,
        url: imageUrl,
        fileName: savedImage[0].fileName,
      });
    } catch (error: any) {
      console.error('Error storing image:', error);
      res.status(500).json({ error: 'Failed to persist image' });
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
        const savedImage = await db
          .insert(images)
          .values({
            fileName: item.fileName || `batch-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`,
            mimeType: item.mimeType || 'image/jpeg',
            data: item.data,
          })
          .returning();

        const imageId = savedImage[0].id;
        uploadedResults.push({
          id: imageId,
          url: `/api/images/${imageId}`,
          fileName: savedImage[0].fileName,
        });
      }

      res.status(201).json({
        success: true,
        count: uploadedResults.length,
        images: uploadedResults,
      });
    } catch (error: any) {
      console.error('Error batch storing images:', error);
      res.status(500).json({ error: 'Failed to persist batch images' });
    }
  });

  // Admin: Categories Management
  app.post('/api/admin/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      if (!nameEn) return res.status(400).json({ error: 'Category name (English) is required' });

      let baseSlug = makeSlug(nameEn);
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await db.select().from(categories).where(eq(categories.slug, finalSlug)).limit(1);
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
          icon: icon || 'Smartphone',
          displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
        })
        .returning();

      await logAudit('CATEGORY_CREATE', `Created category "${nameEn}"`, req.user?.email);
      res.status(201).json(cat[0]);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: error.message || 'Failed to create category' });
    }
  });

  app.put('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;

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

      if (updated.length === 0) return res.status(404).json({ error: 'Category not found' });
      await logAudit('CATEGORY_UPDATE', `Updated category "${updated[0].nameEn}"`, req.user?.email);
      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: error.message || 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      // Check if products exist in category
      const prods = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: 'Cannot delete category containing existing products. Reassign or delete products first.' });
      }

      await db.delete(categories).where(eq(categories.id, id));
      await logAudit('CATEGORY_DELETE', `Deleted category ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: error.message || 'Failed to delete category' });
    }
  });

  // Admin: Brands Management
  app.post('/api/admin/brands', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, logoUrl } = req.body;
      if (!name) return res.status(400).json({ error: 'Brand name is required' });

      let baseSlug = makeSlug(name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await db.select().from(brands).where(eq(brands.slug, finalSlug)).limit(1);
        if (check.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const br = await db
        .insert(brands)
        .values({
          slug: finalSlug,
          name: name.trim(),
          logoUrl: logoUrl || '',
        })
        .returning();

      await logAudit('BRAND_CREATE', `Created brand "${name}"`, req.user?.email);
      res.status(201).json(br[0]);
    } catch (error: any) {
      console.error('Error creating brand:', error);
      res.status(500).json({ error: error.message || 'Failed to create brand' });
    }
  });

  app.put('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, logoUrl } = req.body;

      const updated = await db
        .update(brands)
        .set({
          name: name ? name.trim() : undefined,
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        })
        .where(eq(brands.id, id))
        .returning();

      if (updated.length === 0) return res.status(404).json({ error: 'Brand not found' });
      await logAudit('BRAND_UPDATE', `Updated brand "${updated[0].name}"`, req.user?.email);
      res.json(updated[0]);
    } catch (error: any) {
      console.error('Error updating brand:', error);
      res.status(500).json({ error: error.message || 'Failed to update brand' });
    }
  });

  app.delete('/api/admin/brands/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const prods = await db.select().from(products).where(eq(products.brandId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: 'Cannot delete brand with associated products.' });
      }

      await db.delete(brands).where(eq(brands.id, id));
      await logAudit('BRAND_DELETE', `Deleted brand ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      res.status(500).json({ error: error.message || 'Failed to delete brand' });
    }
  });

  // Admin: WhatsApp Settings
  app.get('/api/admin/whatsapp-settings', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      res.json(settings[0]);
    } catch (error) {
      console.error('Error fetching admin WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
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
      const content = await db.select().from(siteContent).limit(1);
      res.json(content[0] || {});
    } catch (error) {
      console.error('Error fetching admin site content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
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
  // VITE DEV MIDDLEWARE / STATIC FILES
  // ----------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) === 8080 ? 3000 : (Number(process.env.PORT) || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nasir Mobile Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
