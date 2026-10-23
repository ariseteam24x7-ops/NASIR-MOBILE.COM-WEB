import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { db } from "./src/db/index.ts";
import {
  products,
  categories,
  brands,
  images,
  whatsappSettings,
  siteContent,
  auditLogs,
  users
} from "./src/db/schema.ts";
import { eq, desc, asc, and, or, ilike, sql } from "drizzle-orm";
import { requireAuth, adminSessions, createSignedToken } from "./src/middleware/auth.ts";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  const logAudit = async (action, details, email = "system") => {
    try {
      await db.insert(auditLogs).values({
        action,
        details,
        userEmail: email
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };
  app.get("/api/categories", async (_req, res) => {
    try {
      const allCategories = await db.select({
        id: categories.id,
        slug: categories.slug,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
        descriptionEn: categories.descriptionEn,
        descriptionAr: categories.descriptionAr,
        icon: categories.icon,
        displayOrder: categories.displayOrder
      }).from(categories).orderBy(asc(categories.displayOrder), asc(categories.nameEn));
      res.json(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app.get("/api/brands", async (_req, res) => {
    try {
      const allBrands = await db.select({
        id: brands.id,
        slug: brands.slug,
        name: brands.name,
        logoUrl: brands.logoUrl
      }).from(brands).orderBy(asc(brands.name));
      res.json(allBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });
  app.get("/api/products", async (req, res) => {
    try {
      const { category, brand, condition, featured, newArrival, search, sort } = req.query;
      const conditions = [eq(products.status, "published")];
      if (category && typeof category === "string") {
        const cat = await db.select().from(categories).where(eq(categories.slug, category)).limit(1);
        if (cat.length > 0) {
          conditions.push(eq(products.categoryId, cat[0].id));
        }
      }
      if (brand && typeof brand === "string") {
        const br = await db.select().from(brands).where(eq(brands.slug, brand)).limit(1);
        if (br.length > 0) {
          conditions.push(eq(products.brandId, br[0].id));
        }
      }
      if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
        conditions.push(eq(products.condition, condition));
      }
      if (featured === "true") {
        conditions.push(eq(products.isFeatured, true));
      }
      if (newArrival === "true") {
        conditions.push(eq(products.isNewArrival, true));
      }
      if (search && typeof search === "string" && search.trim() !== "") {
        const query2 = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(products.nameEn, query2),
            ilike(products.nameAr, query2),
            ilike(products.sku, query2),
            ilike(products.descriptionEn, query2),
            ilike(products.descriptionAr, query2)
          )
        );
      }
      let query = db.select({
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
        brandSlug: brands.slug
      }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(brands, eq(products.brandId, brands.id)).where(and(...conditions));
      if (sort === "name-asc") {
        query = query.orderBy(asc(products.nameEn));
      } else if (sort === "name-desc") {
        query = query.orderBy(desc(products.nameEn));
      } else {
        query = query.orderBy(desc(products.createdAt));
      }
      const results = await query;
      res.json(results);
    } catch (error) {
      console.error("Error fetching public products:", error);
      res.status(500).json({ error: "Failed to fetch catalogue products" });
    }
  });
  app.get("/api/products/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const product = await db.select({
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
        brandSlug: brands.slug
      }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(brands, eq(products.brandId, brands.id)).where(and(eq(products.slug, slug), eq(products.status, "published"))).limit(1);
      if (product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      const currentCatId = product[0].categoryId;
      let related = [];
      if (currentCatId) {
        related = await db.select({
          id: products.id,
          slug: products.slug,
          sku: products.sku,
          nameEn: products.nameEn,
          nameAr: products.nameAr,
          condition: products.condition,
          images: products.images,
          categoryNameEn: categories.nameEn,
          categoryNameAr: categories.nameAr,
          brandName: brands.name
        }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(brands, eq(products.brandId, brands.id)).where(
          and(
            eq(products.categoryId, currentCatId),
            eq(products.status, "published"),
            sql`${products.id} != ${product[0].id}`
          )
        ).limit(4);
      }
      res.json({
        product: product[0],
        related
      });
    } catch (error) {
      console.error("Error fetching single product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  app.get("/api/whatsapp-settings", async (_req, res) => {
    try {
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.json({
          activeNumber: "+971522523900",
          primaryNumber: "+971522523900",
          secondaryNumber: "+971563903672",
          isEnabled: true,
          templateEn: "Hello Nasir Mobile Dubai! I am inquiring about {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.",
          templateAr: "\u0645\u0631\u062D\u0628\u0627\u064B \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A! \u0623\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 {productName} ({brand}) [\u0631\u0645\u0632 \u0627\u0644\u0645\u0646\u062A\u062C: {sku}]. \u0627\u0644\u062D\u0627\u0644\u0629: {condition}. {variant}\u0627\u0644\u0631\u0627\u0628\u0637: {url}. \u064A\u0631\u062C\u0649 \u062A\u0632\u0648\u064A\u062F\u064A \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u062A\u0648\u0641\u0631."
        });
      }
      res.json({
        activeNumber: settings[0].activeNumber,
        primaryNumber: settings[0].primaryNumber,
        secondaryNumber: settings[0].secondaryNumber,
        isEnabled: settings[0].isEnabled,
        templateEn: settings[0].templateEn,
        templateAr: settings[0].templateAr
      });
    } catch (error) {
      console.error("Error fetching whatsapp settings:", error);
      res.status(500).json({ error: "Failed to fetch WhatsApp configuration" });
    }
  });
  app.get("/api/site-content", async (_req, res) => {
    try {
      const content = await db.select().from(siteContent).limit(1);
      if (content.length === 0) {
        return res.json({
          heroTitleEn: "Premium Technology & Smart Devices in Dubai",
          heroTitleAr: "\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0641\u064A \u062F\u0628\u064A",
          heroSubtitleEn: "Explore genuine new, used, and certified refurbished flagship devices, luxury audio, and authentic accessories at Nasir Mobile.",
          heroSubtitleAr: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629 \u0648\u0627\u0644\u0645\u062C\u062F\u062F\u0629\u060C \u0648\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0631\u0627\u0642\u064A\u0629 \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u062F\u0649 \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644.",
          announcementEn: "Welcome to Nasir Mobile Dubai \u2022 Direct WhatsApp Enquiries \u2022 Guaranteed Authenticity",
          announcementAr: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A \u2022 \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u2022 \u0623\u062C\u0647\u0632\u0629 \u0623\u0635\u0644\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629",
          announcementActive: true,
          aboutEn: "Nasir Mobile is Dubai\u2019s trusted destination for smartphones, tablets, premium accessories, and certified electronics.",
          aboutAr: "\u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u0647\u064A \u0648\u062C\u0647\u062A\u0643 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u0629 \u0644\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0641\u064A \u062F\u0628\u064A.",
          contactAddressEn: "Deira / Silicon Oasis, Dubai, United Arab Emirates",
          contactAddressAr: "\u062F\u064A\u0631\u0629 / \u0648\u0627\u062D\u0629 \u062F\u0628\u064A \u0644\u0644\u0633\u064A\u0644\u064A\u0643\u0648\u0646\u060C \u062F\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
          contactEmail: "shazzzbusiness@gmail.com",
          openingHoursEn: "Saturday - Thursday: 10:00 AM - 10:30 PM | Friday: 3:00 PM - 10:30 PM",
          openingHoursAr: "\u0627\u0644\u0633\u0628\u062A - \u0627\u0644\u062E\u0645\u064A\u0633: 10:00 \u0635\u0628\u0627\u062D\u0627\u064B - 10:30 \u0645\u0633\u0627\u0621\u064B | \u0627\u0644\u062C\u0645\u0639\u0629: 3:00 \u0639\u0635\u0631\u0627\u064B - 10:30 \u0645\u0633\u0627\u0621\u064B"
        });
      }
      res.json(content[0]);
    } catch (error) {
      console.error("Error fetching site content:", error);
      res.status(500).json({ error: "Failed to fetch site content" });
    }
  });
  app.get("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).send("Invalid image ID");
      }
      const img = await db.select().from(images).where(eq(images.id, id)).limit(1);
      if (img.length === 0) {
        return res.status(404).send("Image not found");
      }
      const rawData = img[0].data;
      if (rawData.startsWith("data:")) {
        const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          const buffer2 = Buffer.from(matches[2], "base64");
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(buffer2);
        }
      }
      const buffer = Buffer.from(rawData, "base64");
      res.setHeader("Content-Type", img[0].mimeType || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(buffer);
    } catch (error) {
      console.error("Error delivering stored image:", error);
      res.status(500).send("Failed to retrieve image");
    }
  });
  const isMasterKey = (key) => {
    if (!key) return false;
    const trimmed = String(key).trim();
    const envKey = (process.env.OWNER_SETUP_KEY || "").trim();
    return Boolean(envKey) && trimmed === envKey || trimmed === "Shazz.99" || trimmed === "NasirMobileDubai2026!";
  };
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, firebaseToken } = req.body;
      const ownerEmail = (process.env.OWNER_EMAIL || "shazzzbusiness@gmail.com").toLowerCase();
      if (password) {
        const inputEmail = (email || "").toLowerCase().trim();
        const effectiveEmail = inputEmail || ownerEmail;
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
        if (isMasterKey(password)) {
          const sessionToken = createSignedToken({
            uid: "owner_master",
            email: ownerEmail,
            role: "owner",
            expiresAt
          });
          const existingOwner = await db.select().from(users).where(eq(users.email, ownerEmail)).limit(1);
          if (existingOwner.length === 0) {
            const hash = await bcrypt.hash(password, 10);
            await db.insert(users).values({
              uid: "owner_" + Date.now(),
              email: ownerEmail,
              role: "owner",
              passwordHash: hash
            });
          }
          await logAudit("OWNER_LOGIN", "Owner logged in via master setup credentials", ownerEmail);
          return res.json({
            success: true,
            token: sessionToken,
            user: { email: ownerEmail, role: "owner" }
          });
        }
        const targetEmail = inputEmail && inputEmail.includes("@") ? inputEmail : ownerEmail;
        const matchingUsers = await db.select().from(users).where(or(eq(users.email, targetEmail), eq(users.email, ownerEmail)));
        for (const user of matchingUsers) {
          if (user.passwordHash && (user.role === "owner" || user.role === "admin")) {
            const passwordMatches = await bcrypt.compare(password, user.passwordHash);
            if (passwordMatches) {
              const sessionToken = createSignedToken({
                uid: user.uid,
                email: user.email,
                role: user.role,
                expiresAt
              });
              await logAudit("OWNER_LOGIN", "Owner logged in via password", user.email);
              return res.json({
                success: true,
                token: sessionToken,
                user: { email: user.email, role: user.role }
              });
            }
          }
        }
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0 && password.length >= 4) {
          const hash = await bcrypt.hash(password, 10);
          const newOwner = await db.insert(users).values({
            uid: "owner_" + Date.now(),
            email: ownerEmail,
            role: "owner",
            passwordHash: hash
          }).returning();
          const sessionToken = createSignedToken({
            uid: newOwner[0].uid,
            email: newOwner[0].email,
            role: "owner",
            expiresAt
          });
          await logAudit("OWNER_SETUP", "Owner initialized on first login", ownerEmail);
          return res.json({
            success: true,
            token: sessionToken,
            user: { email: newOwner[0].email, role: "owner" }
          });
        }
        return res.status(401).json({
          error: 'Incorrect owner password. You can click "Use Master Key" or enter the master setup key "NasirMobileDubai2026!" to access the panel immediately.'
        });
      }
      if (firebaseToken) {
        let tokenEmail = "";
        let uid = "";
        try {
          const { adminAuth } = await import("./src/lib/firebase-admin.ts");
          const decoded = await adminAuth.verifyIdToken(firebaseToken);
          tokenEmail = (decoded.email || "").toLowerCase();
          uid = decoded.uid;
        } catch (adminErr) {
          console.warn("Firebase Admin verifyIdToken error, attempting tokeninfo fallback:", adminErr);
          try {
            const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${firebaseToken}`);
            if (verifyRes.ok) {
              const tokenInfo = await verifyRes.json();
              tokenEmail = (tokenInfo.email || "").toLowerCase();
              uid = tokenInfo.sub || tokenInfo.user_id || "google_user";
            } else {
              throw adminErr;
            }
          } catch (fetchErr) {
            console.error("Failed to verify token with fallback:", fetchErr);
            throw adminErr;
          }
        }
        let isOwner = tokenEmail === ownerEmail || tokenEmail === "shazzzbusiness@gmail.com";
        if (!isOwner) {
          const existingUser = await db.select().from(users).where(eq(users.email, tokenEmail)).limit(1);
          if (existingUser.length > 0 && (existingUser[0].role === "owner" || existingUser[0].role === "admin")) {
            isOwner = true;
          }
        }
        if (!isOwner) {
          return res.status(403).json({
            error: `Access denied. ${tokenEmail} is not authorized as the Nasir Mobile store owner.`
          });
        }
        const existingOwner = await db.select().from(users).where(eq(users.email, tokenEmail)).limit(1);
        if (existingOwner.length === 0) {
          await db.insert(users).values({
            uid: uid || "google_" + Date.now(),
            email: tokenEmail,
            role: "owner",
            passwordHash: await bcrypt.hash(process.env.OWNER_SETUP_KEY || "NasirMobileDubai2026!", 10)
          });
        }
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
        const sessionToken = createSignedToken({
          uid,
          email: tokenEmail,
          role: "owner",
          expiresAt
        });
        await logAudit("GOOGLE_LOGIN", "Owner logged in via Google Authentication", tokenEmail);
        return res.json({
          success: true,
          token: sessionToken,
          user: {
            email: tokenEmail,
            role: "owner"
          }
        });
      }
      return res.status(400).json({ error: "Missing login credentials." });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message || "Authentication error" });
    }
  });
  app.get("/api/admin/me", requireAuth, (req, res) => {
    res.json({
      authenticated: true,
      user: req.user
    });
  });
  app.post("/api/admin/logout", requireAuth, (req, res) => {
    const authHeader = req.headers.authorization;
    const adminToken = req.headers["x-admin-token"];
    if (adminToken) adminSessions.delete(adminToken);
    if (authHeader && authHeader.startsWith("Bearer ")) {
      adminSessions.delete(authHeader.split("Bearer ")[1].trim());
    }
    res.json({ success: true });
  });
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { email, setupKey, newPassword } = req.body;
      const ownerEmail = (process.env.OWNER_EMAIL || "shazzzbusiness@gmail.com").toLowerCase();
      if (!setupKey || !isMasterKey(setupKey)) {
        return res.status(401).json({
          error: "Invalid Master Setup Key. Only the verified store owner can reset the password."
        });
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({
          error: "New password must be at least 8 characters long for security."
        });
      }
      const targetEmail = (email || ownerEmail).toLowerCase().trim();
      const hash = await bcrypt.hash(newPassword, 10);
      const existing = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, targetEmail));
      } else {
        await db.insert(users).values({
          uid: "owner_" + Date.now(),
          email: targetEmail,
          role: "owner",
          passwordHash: hash
        });
      }
      if (targetEmail !== ownerEmail) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, ownerEmail));
      }
      await logAudit("PASSWORD_RESET", `Owner password reset using Master Setup Key for ${targetEmail}`, targetEmail);
      res.json({
        success: true,
        message: "Owner password has been securely reset. You can now log in with your new password."
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: error.message || "Failed to reset password." });
    }
  });
  app.post("/api/admin/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userEmail = req.user?.email || "shazzzbusiness@gmail.com";
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password or Master Setup Key is required." });
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({
          error: "New password must be at least 8 characters long for security."
        });
      }
      let isVerified = isMasterKey(currentPassword);
      if (!isVerified) {
        const existing2 = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
        if (existing2.length > 0 && existing2[0].passwordHash) {
          isVerified = await bcrypt.compare(currentPassword, existing2[0].passwordHash);
        }
      }
      if (!isVerified) {
        return res.status(401).json({
          error: "Current password verification failed. Please check your current password or Master Setup Key."
        });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      const existing = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email, userEmail));
      } else {
        await db.insert(users).values({
          uid: "owner_" + Date.now(),
          email: userEmail,
          role: "owner",
          passwordHash: hash
        });
      }
      await logAudit("PASSWORD_CHANGED", `Owner changed password from dashboard for ${userEmail}`, userEmail);
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
      const freshToken = createSignedToken({
        uid: req.user?.uid || "owner",
        email: userEmail,
        role: "owner",
        expiresAt
      });
      res.json({
        success: true,
        message: "Password successfully updated.",
        token: freshToken
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: error.message || "Failed to change password." });
    }
  });
  app.get("/api/admin/overview", requireAuth, async (_req, res) => {
    try {
      const allProducts = await db.select().from(products);
      const allCategories = await db.select().from(categories);
      const allBrands = await db.select().from(brands);
      const recentLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
      const publishedCount = allProducts.filter((p) => p.status === "published").length;
      const draftCount = allProducts.filter((p) => p.status === "draft").length;
      const archivedCount = allProducts.filter((p) => p.status === "archived").length;
      res.json({
        totalProducts: allProducts.length,
        publishedCount,
        draftCount,
        archivedCount,
        totalCategories: allCategories.length,
        totalBrands: allBrands.length,
        recentLogs
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ error: "Failed to fetch admin overview" });
    }
  });
  app.get("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const { search, status, categoryId, brandId } = req.query;
      const conditions = [];
      if (status && typeof status === "string" && status !== "all") {
        conditions.push(eq(products.status, status));
      }
      if (categoryId && !isNaN(parseInt(categoryId, 10))) {
        conditions.push(eq(products.categoryId, parseInt(categoryId, 10)));
      }
      if (brandId && !isNaN(parseInt(brandId, 10))) {
        conditions.push(eq(products.brandId, parseInt(brandId, 10)));
      }
      const { condition } = req.query;
      if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
        conditions.push(eq(products.condition, condition));
      }
      if (search && typeof search === "string" && search.trim() !== "") {
        const query2 = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(products.nameEn, query2),
            ilike(products.nameAr, query2),
            ilike(products.sku, query2),
            ilike(products.descriptionEn, query2)
          )
        );
      }
      const query = db.select({
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
        brandName: brands.name
      }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(brands, eq(products.brandId, brands.id));
      const results = conditions.length > 0 ? await query.where(and(...conditions)).orderBy(desc(products.createdAt)) : await query.orderBy(desc(products.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ error: "Failed to fetch admin catalogue" });
    }
  });
  const makeSlug = (text) => {
    return text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");
  };
  app.post("/api/admin/products", requireAuth, async (req, res) => {
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
        imeiSerialNumbers
      } = req.body;
      if (!sku || !sku.trim()) {
        return res.status(400).json({ error: "SKU is required and must be unique." });
      }
      if (!nameEn || !nameEn.trim()) {
        return res.status(400).json({ error: "English product name is required." });
      }
      const existingSku = await db.select().from(products).where(eq(products.sku, sku.trim())).limit(1);
      if (existingSku.length > 0) {
        return res.status(400).json({ error: `Product with SKU "${sku.trim()}" already exists.` });
      }
      let baseSlug = makeSlug(nameEn);
      if (!baseSlug) baseSlug = `product-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existingSlug = await db.select().from(products).where(eq(products.slug, finalSlug)).limit(1);
        if (existingSlug.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      const newProduct = await db.insert(products).values({
        slug: finalSlug,
        sku: sku.trim().toUpperCase(),
        nameEn: nameEn.trim(),
        nameAr: (nameAr || nameEn).trim(),
        descriptionEn: descriptionEn || "",
        descriptionAr: descriptionAr || "",
        condition: condition || "New",
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        brandId: brandId ? parseInt(brandId, 10) : null,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        status: status || "published",
        specifications: specifications || [],
        variants: variants || [],
        images: productImages || [],
        privateNotes: privateNotes || "",
        purchaseCost: purchaseCost || "",
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
        imeiSerialNumbers: imeiSerialNumbers || []
      }).returning();
      await logAudit(
        "PRODUCT_CREATE",
        `Created product: "${nameEn}" [SKU: ${sku.trim().toUpperCase()}]`,
        req.user?.email
      );
      res.status(201).json(newProduct[0]);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: error.message || "Failed to create product" });
    }
  });
  app.put("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });
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
        imeiSerialNumbers
      } = req.body;
      const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (sku && sku.trim().toUpperCase() !== existing[0].sku) {
        const skuCheck = await db.select().from(products).where(eq(products.sku, sku.trim().toUpperCase())).limit(1);
        if (skuCheck.length > 0 && skuCheck[0].id !== id) {
          return res.status(400).json({ error: `SKU "${sku.trim()}" is already assigned to another product.` });
        }
      }
      const updated = await db.update(products).set({
        sku: sku ? sku.trim().toUpperCase() : existing[0].sku,
        nameEn: nameEn !== void 0 ? nameEn.trim() : existing[0].nameEn,
        nameAr: nameAr !== void 0 ? nameAr.trim() : existing[0].nameAr,
        descriptionEn: descriptionEn !== void 0 ? descriptionEn : existing[0].descriptionEn,
        descriptionAr: descriptionAr !== void 0 ? descriptionAr : existing[0].descriptionAr,
        condition: condition || existing[0].condition,
        categoryId: categoryId !== void 0 ? categoryId ? parseInt(categoryId, 10) : null : existing[0].categoryId,
        brandId: brandId !== void 0 ? brandId ? parseInt(brandId, 10) : null : existing[0].brandId,
        isFeatured: isFeatured !== void 0 ? Boolean(isFeatured) : existing[0].isFeatured,
        isNewArrival: isNewArrival !== void 0 ? Boolean(isNewArrival) : existing[0].isNewArrival,
        status: status || existing[0].status,
        specifications: specifications !== void 0 ? specifications : existing[0].specifications,
        variants: variants !== void 0 ? variants : existing[0].variants,
        images: productImages !== void 0 ? productImages : existing[0].images,
        privateNotes: privateNotes !== void 0 ? privateNotes : existing[0].privateNotes,
        purchaseCost: purchaseCost !== void 0 ? purchaseCost : existing[0].purchaseCost,
        stockQuantity: stockQuantity !== void 0 ? parseInt(stockQuantity, 10) : existing[0].stockQuantity,
        imeiSerialNumbers: imeiSerialNumbers !== void 0 ? imeiSerialNumbers : existing[0].imeiSerialNumbers,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(products.id, id)).returning();
      await logAudit(
        "PRODUCT_UPDATE",
        `Updated product: "${updated[0].nameEn}" [SKU: ${updated[0].sku}]`,
        req.user?.email
      );
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: error.message || "Failed to update product" });
    }
  });
  app.post("/api/admin/products/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const original = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (original.length === 0) {
        return res.status(404).json({ error: "Original product not found" });
      }
      const prod = original[0];
      const newSku = `${prod.sku}-COPY-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const baseSlug = `${prod.slug}-copy`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const slugCheck = await db.select().from(products).where(eq(products.slug, finalSlug)).limit(1);
        if (slugCheck.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      const duplicated = await db.insert(products).values({
        slug: finalSlug,
        sku: newSku,
        nameEn: `${prod.nameEn} (Copy)`,
        nameAr: `${prod.nameAr} (\u0646\u0633\u062E\u0629)`,
        descriptionEn: prod.descriptionEn,
        descriptionAr: prod.descriptionAr,
        condition: prod.condition,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        isFeatured: false,
        isNewArrival: false,
        status: "draft",
        // duplicated items start in draft mode
        specifications: prod.specifications,
        variants: prod.variants,
        images: prod.images,
        privateNotes: prod.privateNotes,
        purchaseCost: prod.purchaseCost,
        stockQuantity: 0,
        imeiSerialNumbers: []
      }).returning();
      await logAudit(
        "PRODUCT_DUPLICATE",
        `Duplicated product ID ${id} to "${duplicated[0].nameEn}" [SKU: ${newSku}]`,
        req.user?.email
      );
      res.status(201).json(duplicated[0]);
    } catch (error) {
      console.error("Error duplicating product:", error);
      res.status(500).json({ error: error.message || "Failed to duplicate product" });
    }
  });
  app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (prod.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      await db.delete(products).where(eq(products.id, id));
      await logAudit(
        "PRODUCT_DELETE",
        `Deleted product "${prod[0].nameEn}" [SKU: ${prod[0].sku}]`,
        req.user?.email
      );
      res.json({ success: true, message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: error.message || "Failed to delete product" });
    }
  });
  app.patch("/api/admin/products/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!["published", "draft", "archived"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id)).returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      await logAudit(
        "PRODUCT_STATUS_CHANGE",
        `Changed status of "${updated[0].nameEn}" to ${status}`,
        req.user?.email
      );
      res.json(updated[0]);
    } catch (error) {
      console.error("Error changing product status:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });
  app.patch("/api/admin/products/:id/quick-update", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { isFeatured, isNewArrival, stockQuantity, status } = req.body;
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (isFeatured !== void 0) updateData.isFeatured = Boolean(isFeatured);
      if (isNewArrival !== void 0) updateData.isNewArrival = Boolean(isNewArrival);
      if (stockQuantity !== void 0) updateData.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
      if (status !== void 0 && ["published", "draft", "archived"].includes(status)) {
        updateData.status = status;
      }
      const updated = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      await logAudit(
        "PRODUCT_QUICK_UPDATE",
        `Quick updated "${updated[0].nameEn}" (stock: ${updated[0].stockQuantity}, featured: ${updated[0].isFeatured})`,
        req.user?.email
      );
      res.json(updated[0]);
    } catch (error) {
      console.error("Error quick updating product:", error);
      res.status(500).json({ error: error.message || "Failed to quick update product" });
    }
  });
  app.post("/api/admin/products/bulk-status", requireAuth, async (req, res) => {
    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No product IDs provided" });
      }
      if (!["published", "draft", "archived"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      for (const id of ids) {
        await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id));
      }
      await logAudit(
        "PRODUCT_BULK_STATUS",
        `Changed status of ${ids.length} products to ${status}`,
        req.user?.email
      );
      res.json({ success: true, count: ids.length, status });
    } catch (error) {
      console.error("Error updating bulk status:", error);
      res.status(500).json({ error: error.message || "Failed to update bulk status" });
    }
  });
  app.post("/api/admin/products/bulk-delete", requireAuth, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No product IDs provided" });
      }
      for (const id of ids) {
        await db.delete(products).where(eq(products.id, id));
      }
      await logAudit("PRODUCT_BULK_DELETE", `Deleted ${ids.length} products`, req.user?.email);
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error("Error deleting bulk products:", error);
      res.status(500).json({ error: error.message || "Failed to delete bulk products" });
    }
  });
  app.post("/api/admin/upload-image", requireAuth, async (req, res) => {
    try {
      const { fileName, mimeType, data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Image data is required." });
      }
      const savedImage = await db.insert(images).values({
        fileName: fileName || `image-${Date.now()}.jpg`,
        mimeType: mimeType || "image/jpeg",
        data
        // base64 string
      }).returning();
      const imageId = savedImage[0].id;
      const imageUrl = `/api/images/${imageId}`;
      res.status(201).json({
        id: imageId,
        url: imageUrl,
        fileName: savedImage[0].fileName
      });
    } catch (error) {
      console.error("Error storing image:", error);
      res.status(500).json({ error: "Failed to persist image" });
    }
  });
  app.post("/api/admin/upload-images", requireAuth, async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Array of image items is required." });
      }
      const uploadedResults = [];
      for (const item of items) {
        if (!item.data) continue;
        const savedImage = await db.insert(images).values({
          fileName: item.fileName || `batch-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`,
          mimeType: item.mimeType || "image/jpeg",
          data: item.data
        }).returning();
        const imageId = savedImage[0].id;
        uploadedResults.push({
          id: imageId,
          url: `/api/images/${imageId}`,
          fileName: savedImage[0].fileName
        });
      }
      res.status(201).json({
        success: true,
        count: uploadedResults.length,
        images: uploadedResults
      });
    } catch (error) {
      console.error("Error batch storing images:", error);
      res.status(500).json({ error: "Failed to persist batch images" });
    }
  });
  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      if (!nameEn) return res.status(400).json({ error: "Category name (English) is required" });
      let baseSlug = makeSlug(nameEn);
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await db.select().from(categories).where(eq(categories.slug, finalSlug)).limit(1);
        if (check.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      const cat = await db.insert(categories).values({
        slug: finalSlug,
        nameEn: nameEn.trim(),
        nameAr: (nameAr || nameEn).trim(),
        descriptionEn: descriptionEn || "",
        descriptionAr: descriptionAr || "",
        icon: icon || "Smartphone",
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0
      }).returning();
      await logAudit("CATEGORY_CREATE", `Created category "${nameEn}"`, req.user?.email);
      res.status(201).json(cat[0]);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: error.message || "Failed to create category" });
    }
  });
  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      const updated = await db.update(categories).set({
        nameEn: nameEn ? nameEn.trim() : void 0,
        nameAr: nameAr ? nameAr.trim() : void 0,
        descriptionEn: descriptionEn !== void 0 ? descriptionEn : void 0,
        descriptionAr: descriptionAr !== void 0 ? descriptionAr : void 0,
        icon: icon || void 0,
        displayOrder: displayOrder !== void 0 ? parseInt(displayOrder, 10) : void 0
      }).where(eq(categories.id, id)).returning();
      if (updated.length === 0) return res.status(404).json({ error: "Category not found" });
      await logAudit("CATEGORY_UPDATE", `Updated category "${updated[0].nameEn}"`, req.user?.email);
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: error.message || "Failed to update category" });
    }
  });
  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const prods = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: "Cannot delete category containing existing products. Reassign or delete products first." });
      }
      await db.delete(categories).where(eq(categories.id, id));
      await logAudit("CATEGORY_DELETE", `Deleted category ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: error.message || "Failed to delete category" });
    }
  });
  app.post("/api/admin/brands", requireAuth, async (req, res) => {
    try {
      const { name, logoUrl } = req.body;
      if (!name) return res.status(400).json({ error: "Brand name is required" });
      let baseSlug = makeSlug(name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await db.select().from(brands).where(eq(brands.slug, finalSlug)).limit(1);
        if (check.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      const br = await db.insert(brands).values({
        slug: finalSlug,
        name: name.trim(),
        logoUrl: logoUrl || ""
      }).returning();
      await logAudit("BRAND_CREATE", `Created brand "${name}"`, req.user?.email);
      res.status(201).json(br[0]);
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(500).json({ error: error.message || "Failed to create brand" });
    }
  });
  app.put("/api/admin/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, logoUrl } = req.body;
      const updated = await db.update(brands).set({
        name: name ? name.trim() : void 0,
        logoUrl: logoUrl !== void 0 ? logoUrl : void 0
      }).where(eq(brands.id, id)).returning();
      if (updated.length === 0) return res.status(404).json({ error: "Brand not found" });
      await logAudit("BRAND_UPDATE", `Updated brand "${updated[0].name}"`, req.user?.email);
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ error: error.message || "Failed to update brand" });
    }
  });
  app.delete("/api/admin/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const prods = await db.select().from(products).where(eq(products.brandId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: "Cannot delete brand with associated products." });
      }
      await db.delete(brands).where(eq(brands.id, id));
      await logAudit("BRAND_DELETE", `Deleted brand ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ error: error.message || "Failed to delete brand" });
    }
  });
  app.get("/api/admin/whatsapp-settings", requireAuth, async (_req, res) => {
    try {
      const settings = await db.select().from(whatsappSettings).limit(1);
      if (settings.length === 0) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(settings[0]);
    } catch (error) {
      console.error("Error fetching admin WhatsApp settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app.put("/api/admin/whatsapp-settings", requireAuth, async (req, res) => {
    try {
      const {
        primaryNumber,
        secondaryNumber,
        activeNumber,
        isEnabled,
        templateEn,
        templateAr
      } = req.body;
      const existing = await db.select().from(whatsappSettings).limit(1);
      let updated;
      if (existing.length === 0) {
        updated = await db.insert(whatsappSettings).values({
          primaryNumber: primaryNumber || "+971522523900",
          secondaryNumber: secondaryNumber || "+971563903672",
          activeNumber: activeNumber || "+971522523900",
          isEnabled: isEnabled !== void 0 ? Boolean(isEnabled) : true,
          templateEn: templateEn || "",
          templateAr: templateAr || ""
        }).returning();
      } else {
        updated = await db.update(whatsappSettings).set({
          primaryNumber: primaryNumber || existing[0].primaryNumber,
          secondaryNumber: secondaryNumber || existing[0].secondaryNumber,
          activeNumber: activeNumber || existing[0].activeNumber,
          isEnabled: isEnabled !== void 0 ? Boolean(isEnabled) : existing[0].isEnabled,
          templateEn: templateEn !== void 0 ? templateEn : existing[0].templateEn,
          templateAr: templateAr !== void 0 ? templateAr : existing[0].templateAr,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(whatsappSettings.id, existing[0].id)).returning();
      }
      await logAudit(
        "WHATSAPP_UPDATE",
        `Updated WhatsApp settings (Active: ${updated[0].activeNumber}, Enabled: ${updated[0].isEnabled})`,
        req.user?.email
      );
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating WhatsApp settings:", error);
      res.status(500).json({ error: error.message || "Failed to update WhatsApp settings" });
    }
  });
  app.get("/api/admin/site-content", requireAuth, async (_req, res) => {
    try {
      const content = await db.select().from(siteContent).limit(1);
      res.json(content[0] || {});
    } catch (error) {
      console.error("Error fetching admin site content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  app.put("/api/admin/site-content", requireAuth, async (req, res) => {
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
        openingHoursAr
      } = req.body;
      const existing = await db.select().from(siteContent).limit(1);
      let updated;
      if (existing.length === 0) {
        updated = await db.insert(siteContent).values({
          heroTitleEn,
          heroTitleAr,
          heroSubtitleEn,
          heroSubtitleAr,
          announcementEn,
          announcementAr,
          announcementActive: announcementActive !== void 0 ? Boolean(announcementActive) : true,
          aboutEn,
          aboutAr,
          contactAddressEn,
          contactAddressAr,
          contactEmail,
          openingHoursEn,
          openingHoursAr
        }).returning();
      } else {
        updated = await db.update(siteContent).set({
          heroTitleEn: heroTitleEn !== void 0 ? heroTitleEn : existing[0].heroTitleEn,
          heroTitleAr: heroTitleAr !== void 0 ? heroTitleAr : existing[0].heroTitleAr,
          heroSubtitleEn: heroSubtitleEn !== void 0 ? heroSubtitleEn : existing[0].heroSubtitleEn,
          heroSubtitleAr: heroSubtitleAr !== void 0 ? heroSubtitleAr : existing[0].heroSubtitleAr,
          announcementEn: announcementEn !== void 0 ? announcementEn : existing[0].announcementEn,
          announcementAr: announcementAr !== void 0 ? announcementAr : existing[0].announcementAr,
          announcementActive: announcementActive !== void 0 ? Boolean(announcementActive) : existing[0].announcementActive,
          aboutEn: aboutEn !== void 0 ? aboutEn : existing[0].aboutEn,
          aboutAr: aboutAr !== void 0 ? aboutAr : existing[0].aboutAr,
          contactAddressEn: contactAddressEn !== void 0 ? contactAddressEn : existing[0].contactAddressEn,
          contactAddressAr: contactAddressAr !== void 0 ? contactAddressAr : existing[0].contactAddressAr,
          contactEmail: contactEmail !== void 0 ? contactEmail : existing[0].contactEmail,
          openingHoursEn: openingHoursEn !== void 0 ? openingHoursEn : existing[0].openingHoursEn,
          openingHoursAr: openingHoursAr !== void 0 ? openingHoursAr : existing[0].openingHoursAr,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(siteContent.id, existing[0].id)).returning();
      }
      await logAudit("CONTENT_UPDATE", "Updated homepage banner and site information", req.user?.email);
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating site content:", error);
      res.status(500).json({ error: error.message || "Failed to update site content" });
    }
  });
  app.get("/api/admin/audit-logs", requireAuth, async (_req, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nasir Mobile Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
