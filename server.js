var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import fs2 from "fs";
import { createServer as createViteServer } from "vite";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import bcrypt from "bcryptjs";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  brands: () => brands,
  brandsRelations: () => brandsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  images: () => images,
  products: () => products,
  productsRelations: () => productsRelations,
  securitySettings: () => securitySettings,
  siteContent: () => siteContent,
  users: () => users,
  visitorDailyStats: () => visitorDailyStats,
  visitorLogs: () => visitorLogs,
  visitorSettings: () => visitorSettings,
  whatsappSettings: () => whatsappSettings
});
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  // Firebase Auth UID or internal owner ID
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("owner"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").default(""),
  descriptionAr: text("description_ar").default(""),
  icon: text("icon").default("Smartphone"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url").default(""),
  createdAt: timestamp("created_at").defaultNow()
});
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").default(""),
  descriptionAr: text("description_ar").default(""),
  condition: text("condition").notNull().default("New"),
  // 'New', 'Used', 'Refurbished'
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  isFeatured: boolean("is_featured").default(false),
  isNewArrival: boolean("is_new_arrival").default(false),
  status: text("status").notNull().default("published"),
  // 'draft', 'published', 'archived'
  specifications: jsonb("specifications").default("[]"),
  // Array of { keyEn, keyAr, valueEn, valueAr }
  variants: jsonb("variants").default("[]"),
  // Array of { nameEn, nameAr, options: string[] }
  images: jsonb("images").default("[]"),
  // Array of image URLs or /api/images/:id
  // Absolute private owner fields (NEVER exposed to public catalogue APIs)
  privateNotes: text("private_notes").default(""),
  purchaseCost: text("purchase_cost").default(""),
  stockQuantity: integer("stock_quantity").default(0),
  imeiSerialNumbers: jsonb("imei_serial_numbers").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var images = pgTable("images", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  // Base64 data URI or buffer representation
  createdAt: timestamp("created_at").defaultNow()
});
var whatsappSettings = pgTable("whatsapp_settings", {
  id: serial("id").primaryKey(),
  primaryNumber: text("primary_number").notNull().default("+971522523900"),
  secondaryNumber: text("secondary_number").notNull().default("+971563903672"),
  activeNumber: text("active_number").notNull().default("+971522523900"),
  isEnabled: boolean("is_enabled").default(true),
  templateEn: text("template_en").notNull().default(
    "Hello Nasir Mobile Dubai! I am inquiring about the {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability."
  ),
  templateAr: text("template_ar").notNull().default(
    "\u0645\u0631\u062D\u0628\u0627\u064B \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A! \u0623\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 {productName} ({brand}) [\u0631\u0645\u0632 \u0627\u0644\u0645\u0646\u062A\u062C: {sku}]. \u0627\u0644\u062D\u0627\u0644\u0629: {condition}. {variant}\u0627\u0644\u0631\u0627\u0628\u0637: {url}. \u064A\u0631\u062C\u0649 \u062A\u0632\u0648\u064A\u062F\u064A \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u062A\u0648\u0641\u0631."
  ),
  updatedAt: timestamp("updated_at").defaultNow()
});
var siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  heroTitleEn: text("hero_title_en").notNull().default("Premium Technology & Smart Devices in Dubai"),
  heroTitleAr: text("hero_title_ar").notNull().default("\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0641\u064A \u062F\u0628\u064A"),
  heroSubtitleEn: text("hero_subtitle_en").notNull().default("Explore genuine new, used, and certified refurbished flagship devices, luxury audio, and authentic accessories at Nasir Mobile."),
  heroSubtitleAr: text("hero_subtitle_ar").notNull().default("\u0627\u0633\u062A\u0643\u0634\u0641 \u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629 \u0648\u0627\u0644\u0645\u062C\u062F\u062F\u0629\u060C \u0648\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0631\u0627\u0642\u064A\u0629 \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u062F\u0649 \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644."),
  announcementEn: text("announcement_en").default("Welcome to Nasir Mobile Dubai \u2022 Direct WhatsApp Enquiries \u2022 Guaranteed Authenticity"),
  announcementAr: text("announcement_ar").default("\u0623\u0647\u0644\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A \u2022 \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u2022 \u0623\u062C\u0647\u0632\u0629 \u0623\u0635\u0644\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629"),
  announcementActive: boolean("announcement_active").default(true),
  aboutEn: text("about_en").notNull().default(
    "Nasir Mobile is Dubai\u2019s trusted destination for smartphones, tablets, premium accessories, and certified electronics. Located in the heart of Dubai, UAE, we deliver exceptional customer care, guaranteed authentic hardware, and personalized consultation for both new and refurbished devices."
  ),
  aboutAr: text("about_ar").notNull().default(
    "\u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u0647\u064A \u0648\u062C\u0647\u062A\u0643 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u0629 \u0644\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u062F\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629. \u0646\u062D\u0631\u0635 \u0639\u0644\u0649 \u062A\u0642\u062F\u064A\u0645 \u0623\u0641\u0636\u0644 \u062E\u062F\u0645\u0629 \u0639\u0645\u0644\u0627\u0621 \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u0627\u0644\u0645\u062C\u062F\u062F\u0629 \u0645\u0639 \u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628."
  ),
  contactAddressEn: text("contact_address_en").notNull().default("Deira / Dubai Silicon Oasis, Dubai, United Arab Emirates (Contact for store visit)"),
  contactAddressAr: text("contact_address_ar").notNull().default("\u062F\u064A\u0631\u0629 / \u0648\u0627\u062D\u0629 \u062F\u0628\u064A \u0644\u0644\u0633\u064A\u0644\u064A\u0643\u0648\u0646\u060C \u062F\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629 (\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0644\u0632\u064A\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0636)"),
  contactEmail: text("contact_email").notNull().default("shazzzbusiness@gmail.com"),
  openingHoursEn: text("opening_hours_en").notNull().default("Saturday - Thursday: 10:00 AM - 10:30 PM | Friday: 3:00 PM - 10:30 PM"),
  openingHoursAr: text("opening_hours_ar").notNull().default("\u0627\u0644\u0633\u0628\u062A - \u0627\u0644\u062E\u0645\u064A\u0633: 10:00 \u0635\u0628\u0627\u062D\u0627\u064B - 10:30 \u0645\u0633\u0627\u0621\u064B | \u0627\u0644\u062C\u0645\u0639\u0629: 3:00 \u0639\u0635\u0631\u0627\u064B - 10:30 \u0645\u0633\u0627\u0621\u064B"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").default(""),
  userEmail: text("user_email").default(""),
  action: text("action").notNull(),
  details: text("details").default(""),
  createdAt: timestamp("created_at").defaultNow()
});
var visitorSettings = pgTable("visitor_settings", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").default(true),
  displayMode: text("display_mode").default("both"),
  // 'both', 'today', 'total'
  todayAdjustment: integer("today_adjustment").default(0),
  totalAdjustment: integer("total_adjustment").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});
var visitorDailyStats = pgTable("visitor_daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  uniqueVisitors: integer("unique_visitors").default(0),
  pageViews: integer("page_views").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});
var visitorLogs = pgTable("visitor_logs", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  date: text("date").notNull(),
  path: text("path").default("/"),
  userAgent: text("user_agent").default(""),
  createdAt: timestamp("created_at").defaultNow()
});
var securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  masterKey: text("master_key").default("NasirMobileDubai2026!"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products)
}));
var brandsRelations = relations(brands, ({ many }) => ({
  products: many(products)
}));
var productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id]
  })
}));

// src/db/index.ts
var isPostgresAvailable = false;
var setPostgresAvailable = (val) => {
  isPostgresAvailable = val;
};
var createPool = () => {
  if (!global._postgresPool) {
    const host = process.env.SQL_HOST || "127.0.0.1";
    const isUnixSocket = host.startsWith("/");
    const useSsl = !isUnixSocket && process.env.SQL_SSL === "true";
    global._postgresPool = new Pool({
      host,
      user: process.env.SQL_USER || "postgres",
      password: process.env.SQL_PASSWORD || "",
      database: process.env.SQL_DB_NAME || "postgres",
      port: Number(process.env.SQL_PORT) || 5432,
      ssl: useSsl ? { rejectUnauthorized: false } : void 0,
      max: 10,
      connectionTimeoutMillis: 5e3
    });
    global._postgresPool.on("error", (err) => {
      console.warn("PostgreSQL pool background error:", err?.message);
      isPostgresAvailable = false;
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// server.ts
import { eq as eq2, desc, asc, and, or, sql } from "drizzle-orm";

// src/middleware/auth.ts
import crypto from "crypto";

// src/lib/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var adminAuthInstance = null;
var firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "magnificent-container-rvxch"
};
try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const possiblePaths = [
    path.resolve(process.cwd(), "firebase-applet-config.json"),
    path.resolve(currentDir, "../../firebase-applet-config.json"),
    path.resolve(currentDir, "../firebase-applet-config.json")
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      firebaseConfig = JSON.parse(raw);
      break;
    }
  }
} catch (_err) {
}
try {
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID || "magnificent-container-rvxch"
    });
  }
  adminAuthInstance = getAuth();
} catch (e) {
  console.warn("Firebase admin initialization note (safe fallback active):", e?.message || e);
  adminAuthInstance = {
    verifyIdToken: async () => {
      throw new Error("Firebase Auth ID token verification requires configured service credentials");
    }
  };
}
var adminAuth = adminAuthInstance;

// src/middleware/auth.ts
import { eq } from "drizzle-orm";
var SESSION_SECRET = process.env.SESSION_SECRET || "nasir-mobile-dubai-secret-2026";
var adminSessions = /* @__PURE__ */ new Map();
var createSignedToken = (payload) => {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  const token = `nm_sess_${data}.${hmac}`;
  adminSessions.set(token, payload);
  return token;
};
var verifySignedToken = (token) => {
  if (adminSessions.has(token)) {
    const session = adminSessions.get(token);
    if (Date.now() < session.expiresAt) {
      return session;
    }
    adminSessions.delete(token);
    return null;
  }
  if (!token.startsWith("nm_sess_")) return null;
  const raw = token.slice("nm_sess_".length);
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (Date.now() > payload.expiresAt) return null;
    adminSessions.set(token, payload);
    return payload;
  } catch {
    return null;
  }
};
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminToken = req.headers["x-admin-token"] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1].trim() : void 0);
  if (!adminToken) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication credentials" });
  }
  const validSession = verifySignedToken(adminToken);
  if (validSession) {
    req.user = { uid: validSession.uid, email: validSession.email, role: validSession.role };
    return next();
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(adminToken);
    const email = decodedToken.email?.toLowerCase() || "";
    const configuredOwnerEmail = (process.env.OWNER_EMAIL || "shazzzbusiness@gmail.com").toLowerCase();
    let isOwner = email === configuredOwnerEmail;
    if (!isOwner && email) {
      const dbUsers = await db.select().from(users).where(eq(users.email, email));
      if (dbUsers.length > 0 && (dbUsers[0].role === "owner" || dbUsers[0].role === "admin")) {
        isOwner = true;
      }
    }
    if (!isOwner) {
      return res.status(403).json({
        error: "Forbidden: Access restricted to authorized Nasir Mobile store owner."
      });
    }
    req.user = {
      uid: decodedToken.uid,
      email,
      role: "owner"
    };
    next();
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

// src/db/init.ts
async function initDatabase() {
  try {
    const pool2 = createPool();
    await pool2.query("SELECT 1");
    setPostgresAvailable(true);
    console.log("PostgreSQL database connected and verified successfully");
    try {
      await pool2.query("SELECT 1 FROM brands LIMIT 1");
    } catch {
    }
    try {
      await pool2.query(`
        INSERT INTO whatsapp_settings (id, primary_number, secondary_number, active_number, is_enabled)
        VALUES (1, '+971522523900', '+971563903672', '+971522523900', true)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO visitor_settings (id, is_enabled, display_mode, today_adjustment, total_adjustment)
        VALUES (1, true, 'both', 0, 0)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO security_settings (id, master_key)
        VALUES (1, 'NasirMobileDubai2026!')
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (seedErr) {
      console.warn("Note: Default settings seed note:", seedErr?.message);
    }
    setPostgresAvailable(true);
  } catch (err) {
    console.warn("PostgreSQL database probe warning:", err?.message);
    setPostgresAvailable(false);
  }
}

// src/db/fallbacks.ts
var FALLBACK_CATEGORIES = [
  {
    id: 1,
    slug: "mobile-phones",
    nameEn: "Mobile Phones",
    nameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
    descriptionEn: "Flagship smartphones, 5G devices, and the latest releases.",
    descriptionAr: "\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0648\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u062E\u0627\u0645\u0633.",
    icon: "Smartphone",
    displayOrder: 1
  },
  {
    id: 2,
    slug: "used-refurbished-phones",
    nameEn: "Used & Refurbished Phones",
    nameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629 \u0648\u0627\u0644\u0645\u062C\u062F\u062F\u0629",
    descriptionEn: "Certified pre-owned and refurbished phones tested for top performance.",
    descriptionAr: "\u0647\u0648\u0627\u062A\u0641 \u0645\u0633\u062A\u0639\u0645\u0644\u0629 \u0648\u0645\u062C\u062F\u062F\u0629 \u0648\u0645\u0641\u062D\u0648\u0635\u0629 \u0628\u062F\u0642\u0629 \u0644\u0636\u0645\u0627\u0646 \u0623\u0639\u0644\u0649 \u0623\u062F\u0627\u0621.",
    icon: "RefreshCw",
    displayOrder: 2
  },
  {
    id: 3,
    slug: "accessories",
    nameEn: "Accessories",
    nameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    descriptionEn: "Protective cases, screen guards, camera protectors, and mounts.",
    descriptionAr: "\u0623\u063A\u0637\u064A\u0629 \u062D\u0645\u0627\u064A\u0629\u060C \u0648\u0627\u0642\u064A\u0627\u062A \u0634\u0627\u0634\u0629\u060C \u0645\u0644\u062D\u0642\u0627\u062A \u0643\u0627\u0645\u064A\u0631\u0627\u060C \u0648\u062D\u0648\u0627\u0645\u0644 \u0627\u0644\u0647\u0648\u0627\u062A\u0641.",
    icon: "ShieldCheck",
    displayOrder: 3
  },
  {
    id: 4,
    slug: "chargers-cables",
    nameEn: "Chargers & Cables",
    nameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    descriptionEn: "High-speed PD power adapters, braided cables, and wireless docks.",
    descriptionAr: "\u0645\u062D\u0648\u0644\u0627\u062A \u0634\u062D\u0646 \u0633\u0631\u064A\u0639 PD\u060C \u0643\u0627\u0628\u0644\u0627\u062A \u0645\u062A\u064A\u0646\u0629\u060C \u0648\u0642\u0648\u0627\u0639\u062F \u0634\u062D\u0646 \u0644\u0627\u0633\u0644\u0643\u064A.",
    icon: "Zap",
    displayOrder: 4
  },
  {
    id: 5,
    slug: "earbuds-audio",
    nameEn: "Earbuds & Audio",
    nameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0623\u0630\u0646 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A",
    descriptionEn: "Wireless earbuds, noise-canceling headphones, and portable speakers.",
    descriptionAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0623\u0630\u0646 \u0644\u0627\u0633\u0644\u0643\u064A\u0629\u060C \u0633\u0645\u0627\u0639\u0627\u062A \u0631\u0623\u0633 \u0639\u0627\u0632\u0644\u0629 \u0644\u0644\u0636\u0648\u0636\u0627\u0621 \u0648\u0645\u0643\u0628\u0631\u0627\u062A \u0635\u0648\u062A.",
    icon: "Headphones",
    displayOrder: 5
  },
  {
    id: 6,
    slug: "smartwatches",
    nameEn: "Smartwatches",
    nameAr: "\u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629",
    descriptionEn: "Advanced fitness trackers, cellular watches, and smart wearables.",
    descriptionAr: "\u0633\u0627\u0639\u0627\u062A \u0630\u0643\u064A\u0629 \u0644\u0644\u064A\u0627\u0642\u0629 \u0648\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0635\u062D\u0629.",
    icon: "Watch",
    displayOrder: 6
  },
  {
    id: 7,
    slug: "tablets-laptops",
    nameEn: "Tablets & Laptops",
    nameAr: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0648\u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629",
    descriptionEn: "Pro tablets, ultrabooks, styluses, and keyboard accessories.",
    descriptionAr: "\u0623\u062C\u0647\u0632\u0629 \u0644\u0648\u062D\u064A\u0629 \u0645\u062A\u0642\u062F\u0645\u0629\u060C \u0623\u062C\u0647\u0632\u0629 \u0645\u062D\u0645\u0648\u0644\u0629\u060C \u0648\u0623\u0642\u0644\u0627\u0645 \u0630\u0643\u064A\u0629.",
    icon: "Tablet",
    displayOrder: 7
  },
  {
    id: 8,
    slug: "other-electronics",
    nameEn: "Other Electronics",
    nameAr: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0623\u062E\u0631\u0649",
    descriptionEn: "Gaming consoles, streaming gadgets, power banks, and smart gear.",
    descriptionAr: "\u0623\u062C\u0647\u0632\u0629 \u0623\u0644\u0639\u0627\u0628\u060C \u0645\u0644\u062D\u0642\u0627\u062A \u0630\u0643\u064A\u0629\u060C \u0628\u0646\u0648\u0643 \u0637\u0627\u0642\u0629\u060C \u0648\u062A\u0642\u0646\u064A\u0627\u062A \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629.",
    icon: "Cpu",
    displayOrder: 8
  },
  {
    id: 10,
    slug: "smart-audio",
    nameEn: "Smart Audio",
    nameAr: "\u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629",
    descriptionEn: "High-fidelity smart soundbars, voice speakers, and Hi-Res audio gear.",
    descriptionAr: "\u0645\u0643\u0628\u0631\u0627\u062A \u0635\u0648\u062A \u0630\u0643\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0646\u0642\u0627\u0621 \u0648\u0645\u0639\u062F\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0645\u062A\u0637\u0648\u0631\u0629.",
    icon: "Volume2",
    displayOrder: 9
  },
  {
    id: 11,
    slug: "networking-wi-fi",
    nameEn: "Networking & Wi-Fi",
    nameAr: "\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0648\u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A",
    descriptionEn: "Range extenders, mesh Wi-Fi nodes, network switches, and adapters.",
    descriptionAr: "\u0645\u0648\u0633\u0639\u0627\u062A \u0646\u0637\u0627\u0642 \u0634\u0628\u0643\u0627\u062A\u060C \u0623\u0646\u0638\u0645\u0629 \u0634\u0628\u0643\u0627\u062A \u0648\u0627\u064A \u0641\u0627\u064A \u0645\u0648\u0633\u0639\u0629 \u0648\u0645\u062D\u0648\u0644\u0627\u062A.",
    icon: "Wifi",
    displayOrder: 10
  },
  {
    id: 12,
    slug: "routers-wi-fi",
    nameEn: "Routers & Wi-Fi",
    nameAr: "\u0631\u0627\u0648\u062A\u0631\u0627\u062A \u0648\u0648\u0627\u064A \u0641\u0627\u064A",
    descriptionEn: "High-performance Wi-Fi 6/7 routers, gaming routers, and 5G CPE routers.",
    descriptionAr: "\u0623\u062C\u0647\u0632\u0629 \u0631\u0627\u0648\u062A\u0631 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0648 7 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0631\u0627\u0648\u062A\u0631\u0627\u062A \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u062E\u0627\u0645\u0633 \u0644\u0644\u0623\u0644\u0639\u0627\u0628.",
    icon: "Radio",
    displayOrder: 11
  },
  {
    id: 13,
    slug: "gaming-vr-tech",
    nameEn: "Gaming & VR Tech",
    nameAr: "\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
    descriptionEn: "Next-gen gaming systems, controllers, VR headsets, and pro gaming gear.",
    descriptionAr: "\u0623\u062C\u0647\u0632\u0629 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u0642\u0627\u062F\u0645\u060C \u0623\u064A\u0627\u062F\u064A \u062A\u062D\u0643\u0645\u060C \u0646\u0638\u0627\u0631\u0627\u062A \u0648\u0627\u0642\u0639 \u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0648\u0645\u0644\u062D\u0642\u0627\u062A \u0642\u064A\u0645\u0646\u0642.",
    icon: "Gamepad2",
    displayOrder: 12
  }
];
var FALLBACK_BRANDS = [
  {
    id: 1,
    slug: "apple",
    name: "Apple",
    logoUrl: "/src/assets/images/apple_brand_icon_1792330702744.jpg"
  },
  {
    id: 2,
    slug: "samsung",
    name: "Samsung",
    logoUrl: "/src/assets/images/samsung_brand_icon_1792330702562.jpg"
  },
  {
    id: 3,
    slug: "google",
    name: "Google Pixel",
    logoUrl: "/src/assets/images/pixel_brand_icon_1792330703295.jpg"
  },
  {
    id: 4,
    slug: "xiaomi",
    name: "Xiaomi",
    logoUrl: "/src/assets/images/xiaomi_brand_icon_1792330703614.jpg"
  },
  {
    id: 5,
    slug: "huawei",
    name: "Huawei",
    logoUrl: ""
  },
  {
    id: 6,
    slug: "sony",
    name: "Sony",
    logoUrl: ""
  },
  {
    id: 7,
    slug: "anker",
    name: "Anker",
    logoUrl: ""
  },
  {
    id: 8,
    slug: "jbl",
    name: "JBL",
    logoUrl: ""
  },
  {
    id: 9,
    slug: "oneplus",
    name: "OnePlus",
    logoUrl: "/src/assets/images/oneplus_brand_icon_1792330704300.jpg"
  },
  {
    id: 10,
    slug: "playstation",
    name: "PlayStation",
    logoUrl: ""
  },
  {
    id: 11,
    slug: "tp-link",
    name: "TP-Link",
    logoUrl: "https://kommodo.ai/i/i5yB9eczSjRtrWw6VM7h"
  },
  {
    id: 12,
    slug: "nothing-tech",
    name: "Nothing Tech",
    logoUrl: ""
  },
  {
    id: 13,
    slug: "motorola",
    name: "Motorola",
    logoUrl: "/api/images/8"
  },
  {
    id: 14,
    slug: "razer",
    name: "Razer",
    logoUrl: ""
  }
];
var FALLBACK_WHATSAPP = {
  primaryNumber: "+971522523900",
  secondaryNumber: "+971563903672",
  activeNumber: "+971522523900",
  isEnabled: true,
  templateEn: "Hello Nasir Mobile Dubai! I am inquiring about {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.",
  templateAr: "\u0645\u0631\u062D\u0628\u0627\u064B \u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A! \u0623\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 {productName} ({brand}) [\u0631\u0645\u0632 \u0627\u0644\u0645\u0646\u062A\u062C: {sku}]. \u0627\u0644\u062D\u0627\u0644\u0629: {condition}. {variant}\u0627\u0644\u0631\u0627\u0628\u0637: {url}. \u064A\u0631\u062C\u0649 \u062A\u0632\u0648\u064A\u062F\u064A \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u062A\u0648\u0641\u0631."
};
var FALLBACK_SITE_CONTENT = {
  heroTitleEn: "Premium Technology & Smart Devices in Dubai",
  heroTitleAr: "\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0641\u064A \u062F\u0628\u064A",
  heroSubtitleEn: "Authorized retailer of original smartphones, luxury smartwatches, laptops, and certified accessories with full Dubai warranty.",
  heroSubtitleAr: "\u0645\u062A\u062C\u0631\u0643 \u0627\u0644\u0645\u0648\u062B\u0648\u0642 \u0644\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u0639 \u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0645\u0639\u062A\u0645\u062F.",
  announcementEn: "Official Nasir Mobile Dubai \u2022 Visit our store in Deira Wholesale Market or order directly via WhatsApp",
  announcementAr: "\u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A \u2022 \u062A\u0641\u0636\u0644 \u0628\u0632\u064A\u0627\u0631\u0629 \u0645\u062A\u062C\u0631\u0646\u0627 \u0641\u064A \u0633\u0648\u0642 \u062F\u064A\u0631\u0629 \u0644\u0644\u062C\u0645\u0644\u0629 \u0623\u0648 \u0627\u0637\u0644\u0628 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0645\u0628\u0627\u0634\u0631\u0629",
  announcementActive: true,
  aboutEn: "Nasir Mobile Dubai is a certified electronic retailer operating in the heart of Dubai, UAE. We specialize in official GCC and international specifications smartphones, genuine sealed devices, and verified pre-owned items.",
  aboutAr: "\u0646\u0627\u0635\u0631 \u0645\u0648\u0628\u0627\u064A\u0644 \u062F\u0628\u064A \u0645\u062A\u062C\u0631 \u0645\u0639\u062A\u0645\u062F \u0641\u064A \u0642\u0644\u0628 \u062A\u062C\u0627\u0631\u0629 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 \u0628\u062F\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629. \u0645\u062A\u062E\u0635\u0635\u0648\u0646 \u0641\u064A \u062A\u0648\u0641\u064A\u0631 \u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0628\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0648\u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
  contactAddressEn: "Deira Commercial District, Wholesale Market Street, Dubai, United Arab Emirates",
  contactAddressAr: "\u0645\u0646\u0637\u0642\u0629 \u062F\u064A\u0631\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629\u060C \u0634\u0627\u0631\u0639 \u0633\u0648\u0642 \u0627\u0644\u062C\u0645\u0644\u0629\u060C \u062F\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
  contactEmail: "shazzzbusiness@gmail.com",
  openingHoursEn: "Sat - Thu: 10:00 AM - 11:00 PM | Fri: 4:00 PM - 11:00 PM",
  openingHoursAr: "\u0627\u0644\u0633\u0628\u062A - \u0627\u0644\u062E\u0645\u064A\u0633: 10:00 \u0635\u0628\u0627\u062D\u0627\u064B - 11:00 \u0645\u0633\u0627\u0621\u064B | \u0627\u0644\u062C\u0645\u0639\u0629: 4:00 \u0639\u0635\u0631\u0627\u064B - 11:00 \u0645\u0633\u0627\u0621\u064B"
};
var FALLBACK_PRODUCTS = [
  {
    id: 1,
    slug: "iphone-16-pro-max-desert-titanium",
    sku: "NMD-IP16PM-DT",
    nameEn: "Apple iPhone 16 Pro Max - Desert Titanium",
    nameAr: "\u0622\u0628\u0644 \u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633 - \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0635\u062D\u0631\u0627\u0648\u064A",
    descriptionEn: "Apple iPhone 16 Pro Max featuring the powerful A18 Pro chip, Grade 5 titanium design, 48MP Fusion camera system, and Camera Control button.",
    descriptionAr: "\u0622\u0628\u0644 \u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633 \u0628\u0634\u0631\u064A\u062D\u0629 A18 \u0628\u0631\u0648 \u0627\u0644\u062C\u0628\u0627\u0631\u0629\u060C \u062A\u0635\u0645\u064A\u0645 \u0645\u0646 \u0627\u0644\u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645\u060C \u0643\u0627\u0645\u064A\u0631\u0627 \u0628\u062F\u0642\u0629 48 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644\u060C \u0648\u0632\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u0644\u062C\u062F\u064A\u062F.",
    condition: "New",
    categoryId: 1,
    brandId: 1,
    categoryNameEn: "Mobile Phones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
    categorySlug: "mobile-phones",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 18,
    specifications: [
      { keyEn: "Storage", keyAr: "\u0633\u0639\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646", valueEn: "256GB / 512GB / 1TB", valueAr: "256 \u062C\u064A\u062C\u0627\u0628\u0627\u064A\u062A / 512 \u062C\u064A\u062C\u0627\u0628\u0627\u064A\u062A / 1 \u062A\u064A\u0631\u0627\u0628\u0627\u064A\u062A" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '6.9" Super Retina XDR OLED 120Hz', valueAr: "6.9 \u0628\u0648\u0635\u0629 \u0633\u0648\u0628\u0631 \u0631\u064A\u062A\u064A\u0646\u0627 XDR \u0623\u0648\u0644\u064A\u062F 120 \u0647\u0631\u062A\u0632" },
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Apple A18 Pro (3nm)", valueAr: "\u0622\u0628\u0644 A18 \u0628\u0631\u0648 (3 \u0646\u0627\u0646\u0648\u0645\u062A\u0631)" },
      { keyEn: "Warranty", keyAr: "\u0627\u0644\u0636\u0645\u0627\u0646", valueEn: "1 Year Apple Official Dubai Warranty", valueAr: "\u0636\u0645\u0627\u0646 \u0631\u0633\u0645\u064A \u0645\u0646 \u0622\u0628\u0644 \u062F\u0628\u064A \u0644\u0645\u062F\u0629 \u0633\u0646\u0629" }
    ],
    variants: [
      { name: "256GB - Desert Titanium", price: 5099, originalPrice: 5499, isDefault: true, stockQuantity: 10 },
      { name: "512GB - Desert Titanium", price: 5899, originalPrice: 6299, isDefault: false, stockQuantity: 5 },
      { name: "1TB - Natural Titanium", price: 6699, originalPrice: 7099, isDefault: false, stockQuantity: 3 }
    ],
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-14T15:32:58.226Z"
  },
  {
    id: 2,
    slug: "samsung-galaxy-s25-ultra-titanium-black",
    sku: "NMD-SGS25U-TB",
    nameEn: "Samsung Galaxy S25 Ultra 5G",
    nameAr: "\u0633\u0627\u0645\u0633\u0648\u0646\u062C \u062C\u0627\u0644\u0627\u0643\u0633\u064A S25 \u0627\u0644\u062A\u0631\u0627 5G",
    descriptionEn: "The ultimate flagship powered by Snapdragon 8 Elite for Galaxy, built-in S Pen, ProVisual 200MP camera, and Galaxy AI capabilities.",
    descriptionAr: "\u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0644\u0631\u0627\u0626\u062F \u0627\u0644\u0623\u0642\u0648\u0649 \u0628\u0645\u0639\u0627\u0644\u062C \u0633\u0646\u0627\u0628\u062F\u0631\u0627\u062C\u0648\u0646 8 \u0625\u064A\u0644\u064A\u062A\u060C \u0642\u0644\u0645 S Pen \u0645\u062F\u0645\u062C\u060C \u0643\u0627\u0645\u064A\u0631\u0627 \u0628\u062F\u0642\u0629 200 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644\u060C \u0648\u0645\u064A\u0632\u0627\u062A \u062C\u0627\u0644\u0627\u0643\u0633\u064A \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A.",
    condition: "New",
    categoryId: 1,
    brandId: 2,
    categoryNameEn: "Mobile Phones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
    categorySlug: "mobile-phones",
    brandName: "Samsung",
    brandSlug: "samsung",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 14,
    specifications: [
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Snapdragon 8 Elite for Galaxy", valueAr: "\u0633\u0646\u0627\u0628\u062F\u0631\u0627\u062C\u0648\u0646 8 \u0625\u064A\u0644\u064A\u062A \u0645\u062E\u0635\u0635 \u0644\u062C\u0627\u0644\u0627\u0643\u0633\u064A" },
      { keyEn: "Camera", keyAr: "\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627", valueEn: "200MP Main + 50MP Periscope 5x", valueAr: "200 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644 \u0631\u0626\u064A\u0633\u064A\u0629 + 50 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644 \u0628\u064A\u0631\u064A\u0633\u0643\u0648\u0628" },
      { keyEn: "Battery", keyAr: "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", valueEn: "5000 mAh Fast Charge 45W", valueAr: "5000 \u0645\u0644\u0644\u064A \u0623\u0645\u0628\u064A\u0631 \u0634\u062D\u0646 \u0633\u0631\u064A\u0639 45 \u0648\u0627\u0637" }
    ],
    variants: [
      { name: "512GB - Titanium Black", price: 4899, originalPrice: 5299, isDefault: true, stockQuantity: 8 },
      { name: "1TB - Titanium Gray", price: 5699, originalPrice: 6099, isDefault: false, stockQuantity: 6 }
    ],
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-14T15:32:58.226Z"
  },
  {
    id: 3,
    slug: "apple-watch-ultra-2-black-titanium",
    sku: "NMD-AWU2-BT",
    nameEn: "Apple Watch Ultra 2 - Black Titanium",
    nameAr: "\u0622\u0628\u0644 \u0648\u0627\u062A\u0634 \u0627\u0644\u062A\u0631\u0627 2 - \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0623\u0633\u0648\u062F",
    descriptionEn: "Engineered for extreme environments with stunning 3000-nit display, precision dual-frequency GPS, and up to 72 hours of battery life.",
    descriptionAr: "\u0645\u0635\u0645\u0645\u0629 \u0644\u0644\u0623\u062C\u0648\u0627\u0621 \u0627\u0644\u0642\u0627\u0633\u064A\u0629 \u0645\u0639 \u0634\u0627\u0634\u0629 \u0628\u0633\u0637\u0648\u0639 3000 \u0634\u0645\u0639\u0629\u060C \u0646\u0638\u0627\u0645 GPS \u0645\u0632\u062F\u0648\u062C \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629\u060C \u0648\u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 \u062D\u062A\u0649 72 \u0633\u0627\u0639\u0629.",
    condition: "New",
    categoryId: 6,
    brandId: 1,
    categoryNameEn: "Smartwatches",
    categoryNameAr: "\u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629",
    categorySlug: "smartwatches",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: false,
    status: "published",
    stockQuantity: 8,
    specifications: [
      { keyEn: "Case", keyAr: "\u0627\u0644\u0647\u064A\u0643\u0644", valueEn: "49mm Black Titanium Case", valueAr: "\u0647\u064A\u0643\u0644 \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0623\u0633\u0648\u062F 49 \u0645\u0644\u0645" },
      { keyEn: "Water Resistance", keyAr: "\u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0645\u0627\u0621", valueEn: "100m Water Resistant", valueAr: "\u0645\u0642\u0627\u0648\u0645\u0629 \u0644\u0644\u0645\u0627\u0621 \u062D\u062A\u0649 \u0639\u0645\u0642 100 \u0645\u062A\u0631" }
    ],
    variants: [
      { name: "Black Titanium - Trail Loop", price: 3199, originalPrice: 3499, isDefault: true, stockQuantity: 5 },
      { name: "Black Titanium - Ocean Band", price: 3199, originalPrice: 3499, isDefault: false, stockQuantity: 3 }
    ],
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-14T15:32:58.226Z"
  },
  {
    id: 4,
    slug: "ipad-pro-13-m4-oled",
    sku: "NMD-IPP13-M4",
    nameEn: "Apple iPad Pro 13-inch (M4) Tandem OLED",
    nameAr: "\u0622\u0628\u0644 \u0622\u064A\u0628\u0627\u062F \u0628\u0631\u0648 13 \u0628\u0648\u0635\u0629 \u0628\u0634\u0631\u064A\u062D\u0629 M4 \u0648\u0634\u0627\u0634\u0629 \u0623\u0648\u0644\u064A\u062F",
    descriptionEn: "Ultra thin 5.1mm design with breakthrough Ultra Retina XDR display, game-changing M4 chip, and Apple Pencil Pro support.",
    descriptionAr: "\u062A\u0635\u0645\u064A\u0645 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u062D\u0627\u0641\u0629 \u0628\u0633\u0645\u0627\u0643\u0629 5.1 \u0645\u0644\u0645 \u0645\u0639 \u0634\u0627\u0634\u0629 \u0623\u0644\u062A\u0631\u0627 \u0631\u064A\u062A\u064A\u0646\u0627 XDR \u0623\u0648\u0644\u064A\u062F \u0627\u0644\u062B\u0648\u0631\u064A\u0629 \u0648\u0645\u0639\u0627\u0644\u062C M4 \u0627\u0644\u062E\u0627\u0631\u0642.",
    condition: "New",
    categoryId: 7,
    brandId: 1,
    categoryNameEn: "Tablets & Laptops",
    categoryNameAr: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0648\u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629",
    categorySlug: "tablets-laptops",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 10,
    specifications: [
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Apple M4 Chip (Next-gen Neural Engine)", valueAr: "\u0634\u0631\u064A\u062D\u0629 \u0622\u0628\u0644 M4 \u0645\u0639 \u0645\u062D\u0631\u0643 \u0639\u0635\u0628\u064A \u0645\u062A\u0637\u0648\u0631" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '13" Tandem OLED Ultra Retina XDR', valueAr: "\u0634\u0627\u0634\u0629 13 \u0628\u0648\u0635\u0629 \u062A\u0627\u0646\u062F\u064A\u0645 \u0623\u0648\u0644\u064A\u062F \u0623\u0644\u062A\u0631\u0627 \u0631\u064A\u062A\u064A\u0646\u0627 XDR" }
    ],
    variants: [
      { name: "256GB Wi-Fi - Space Black", price: 4699, originalPrice: 4999, isDefault: true, stockQuantity: 6 },
      { name: "512GB Wi-Fi + Cellular 5G", price: 5699, originalPrice: 6099, isDefault: false, stockQuantity: 4 }
    ],
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-14T15:32:58.226Z"
  },
  {
    id: 5,
    slug: "sony-wh-1000xm5-noise-canceling-headphones",
    sku: "SONY-WH1000XM5-BLK",
    nameEn: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    nameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0633\u0648\u0646\u064A WH-1000XM5 \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A\u0629 \u0627\u0644\u0639\u0627\u0632\u0644\u0629 \u0644\u0644\u0636\u0648\u0636\u0627\u0621",
    descriptionEn: "Industry-leading noise cancellation with two processors and 8 microphones, exceptional high-res audio, and crystal clear hands-free calling.",
    descriptionAr: "\u0623\u0641\u0636\u0644 \u062A\u0642\u0646\u064A\u0629 \u0625\u0644\u063A\u0627\u0621 \u0636\u0648\u0636\u0627\u0621 \u0641\u064A \u0641\u0626\u062A\u0647\u0627 \u0645\u0639 \u0645\u0639\u0627\u0644\u062C\u064A\u0646 \u06488 \u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646\u0627\u062A\u060C \u0635\u0648\u062A \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629\u060C \u0648\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0648\u0636\u0648\u062D.",
    condition: "New",
    categoryId: 5,
    brandId: 6,
    categoryNameEn: "Earbuds & Audio",
    categoryNameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0623\u0630\u0646 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A",
    categorySlug: "earbuds-audio",
    brandName: "Sony",
    brandSlug: "sony",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 12,
    specifications: [
      { keyEn: "Battery Life", keyAr: "\u0639\u0645\u0631 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", valueEn: "Up to 30 Hours", valueAr: "\u062D\u062A\u0649 30 \u0633\u0627\u0639\u0629 \u062A\u0634\u063A\u064A\u0644" },
      { keyEn: "Audio Codecs", keyAr: "\u062A\u0631\u0645\u064A\u0632 \u0627\u0644\u0635\u0648\u062A", valueEn: "LDAC, AAC, SBC, Hi-Res Wireless", valueAr: "\u0635\u0648\u062A \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629 \u0644\u0627\u0633\u0644\u0643\u064A" }
    ],
    variants: [
      { name: "Midnight Black", price: 1149, originalPrice: 1299, isDefault: true, stockQuantity: 7 },
      { name: "Platinum Silver", price: 1149, originalPrice: 1299, isDefault: false, stockQuantity: 5 }
    ],
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-15T10:00:00.000Z"
  },
  {
    id: 6,
    slug: "anker-prime-27650mah-power-bank-250w",
    sku: "ANKER-PRIME-250W",
    nameEn: "Anker Prime 27,650mAh Power Bank (250W Ultra Fast)",
    nameAr: "\u0628\u0646\u0643 \u0637\u0627\u0642\u0629 \u0623\u0646\u0643\u0631 \u0628\u0631\u0627\u064A\u0645 27650 \u0645\u0644\u0644\u064A \u0623\u0645\u0628\u064A\u0631 \u0628\u0642\u0648\u0629 250 \u0648\u0627\u0637",
    descriptionEn: "Ultra high-capacity power bank with 250W multi-device fast output, smart digital display, and companion app Bluetooth control.",
    descriptionAr: "\u0628\u0646\u0643 \u0637\u0627\u0642\u0629 \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0639\u0629 \u0645\u0639 \u0634\u062D\u0646 \u0633\u0631\u064A\u0639 \u0628\u0642\u062F\u0631\u0629 250 \u0648\u0627\u0637 \u0644\u0639\u062F\u0629 \u0623\u062C\u0647\u0632\u0629 \u0641\u064A \u0648\u0642\u062A \u0648\u0627\u062D\u062F \u0648\u0634\u0627\u0634\u0629 \u0631\u0642\u0645\u064A\u0629 \u0630\u0643\u064A\u0629.",
    condition: "New",
    categoryId: 4,
    brandId: 7,
    categoryNameEn: "Chargers & Cables",
    categoryNameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    categorySlug: "chargers-cables",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 20,
    specifications: [
      { keyEn: "Capacity", keyAr: "\u0627\u0644\u0633\u0639\u0629", valueEn: "27,650 mAh (99.54Wh airline approved)", valueAr: "27650 \u0645\u0644\u0644\u064A \u0623\u0645\u0628\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 \u0644\u0644\u0637\u064A\u0631\u0627\u0646" },
      { keyEn: "Max Output", keyAr: "\u0623\u0642\u0635\u0649 \u0642\u062F\u0631\u0629 \u0625\u062E\u0631\u0627\u062C", valueEn: "250W Total Output", valueAr: "250 \u0648\u0627\u0637 \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0627\u0642\u0629" }
    ],
    variants: [
      { name: "Standard Edition (250W)", price: 499, originalPrice: 599, isDefault: true, stockQuantity: 20 }
    ],
    images: [
      "https://images.unsplash.com/photo-1609592424367-e9a03e3aeb5c?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-15T11:00:00.000Z"
  },
  {
    id: 7,
    slug: "google-pixel-9-pro-xl-5g",
    sku: "PIXEL-9PRO-XL",
    nameEn: "Google Pixel 9 Pro XL 5G - Obsidian",
    nameAr: "\u062C\u0648\u062C\u0644 \u0628\u0643\u0633\u0644 9 \u0628\u0631\u0648 XL 5G - \u0623\u0633\u0648\u062F \u0633\u0628\u062C\u064A",
    descriptionEn: "Google Tensor G4 powerhouse featuring advanced Gemini Nano AI on-device, pro-triple camera array, and 7 years of OS updates.",
    descriptionAr: "\u0647\u0627\u062A\u0641 \u062C\u0648\u062C\u0644 \u0627\u0644\u0623\u0642\u0648\u0649 \u0628\u0645\u0639\u0627\u0644\u062C \u062A\u0646\u0633\u0648\u0631 G4\u060C \u0648\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062C\u064A\u0645\u064A\u0646\u064A \u0645\u062F\u0645\u062C\u060C \u0648\u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u062B\u0644\u0627\u062B\u064A\u0629 \u0648\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0644\u0645\u062F\u0629 7 \u0633\u0646\u0648\u0627\u062A.",
    condition: "New",
    categoryId: 1,
    brandId: 3,
    categoryNameEn: "Mobile Phones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
    categorySlug: "mobile-phones",
    brandName: "Google Pixel",
    brandSlug: "google",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 9,
    specifications: [
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Google Tensor G4 + Titan M2", valueAr: "\u062C\u0648\u062C\u0644 \u062A\u0646\u0633\u0648\u0631 G4 \u0645\u0639 \u0634\u0631\u064A\u062D\u0629 \u062A\u064A\u062A\u0627\u0646 M2" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '6.8" Super Actua OLED 1-120Hz', valueAr: "6.8 \u0628\u0648\u0635\u0629 \u0633\u0648\u0628\u0631 \u0623\u0643\u0634\u0648\u0627 \u0623\u0648\u0644\u064A\u062F 120 \u0647\u0631\u062A\u0632" }
    ],
    variants: [
      { name: "256GB - Obsidian", price: 4199, originalPrice: 4499, isDefault: true, stockQuantity: 5 },
      { name: "512GB - Porcelain", price: 4799, originalPrice: 5099, isDefault: false, stockQuantity: 4 }
    ],
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-16T12:00:00.000Z"
  },
  {
    id: 10,
    slug: "tp-link-archer-air-e5-ultra-thin-wi-fi-6-extender",
    sku: "ARCHER-AIR-E5",
    nameEn: "TP-Link Archer Air E5 Ultra-Thin Wi-Fi 6 Extender",
    nameAr: "\u0645\u0648\u0633\u0639 \u0634\u0628\u0643\u0629 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0631\u0641\u064A\u0639 \u0644\u0644\u063A\u0627\u064A\u0629 \u0622\u0631\u062A\u0634\u0631 \u0625\u064A\u0631 E5",
    descriptionEn: "Ultra-thin and minimalist design with AX3000 Wi-Fi 6 speeds, smart antennas, and seamless EasyMesh support.",
    descriptionAr: "\u062A\u0635\u0645\u064A\u0645 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u062D\u0627\u0641\u0629 \u0648\u0627\u0644\u0623\u0646\u0627\u0642\u0629 \u0645\u0639 \u0633\u0631\u0639\u0627\u062A \u0648\u0627\u064A \u0641\u0627\u064A 6 AX3000 \u0648\u0647\u0648\u0627\u0626\u064A\u0627\u062A \u0630\u0643\u064A\u0629 \u0648\u062F\u0639\u0645 EasyMesh \u0627\u0644\u0633\u0644\u0633.",
    condition: "New",
    categoryId: 11,
    brandId: 11,
    categoryNameEn: "Networking & Wi-Fi",
    categoryNameAr: "\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0648\u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A",
    categorySlug: "networking-wi-fi",
    brandName: "TP-Link",
    brandSlug: "tp-link",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 7,
    specifications: [
      { keyEn: "Wi-Fi Speeds", keyAr: "\u0633\u0631\u0639\u0627\u062A \u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A", valueEn: "AX3000 (2402 Mbps on 5GHz + 574 Mbps on 2.4GHz)", valueAr: "AX3000 (2402 \u0645\u064A\u062C\u0627\u0628\u062A \u0639\u0644\u0649 5 \u062C\u064A\u062C\u0627\u0647\u0631\u062A\u0632 + 574 \u0645\u064A\u062C\u0627\u0628\u062A \u0639\u0644\u0649 2.4 \u062C\u064A\u062C\u0627\u0647\u0631\u062A\u0632)" },
      { keyEn: "Thickness", keyAr: "\u0627\u0644\u0633\u0645\u0627\u0643\u0629", valueEn: "8mm Ultra Slim Wall Mountable", valueAr: "8 \u0645\u0644\u0645 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u062D\u0627\u0641\u0629 \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0639\u0644\u064A\u0642" }
    ],
    variants: [
      { name: "Standard Pack", price: 280, originalPrice: 320, isDefault: true, stockQuantity: 7 }
    ],
    images: [
      "/api/images/50001"
    ],
    createdAt: "2026-10-28T08:03:06.157Z"
  },
  {
    id: 11,
    slug: "tp-link-archer-ax73-dual-band-wi-fi-6-router",
    sku: "TP-ARCHER-AX73-1793174564980",
    nameEn: "TP-Link Archer AX73 Dual-Band Wi-Fi 6 Router",
    nameAr: "\u0631\u0627\u0648\u062A\u0631 \u062A\u064A \u0628\u064A \u0644\u064A\u0646\u0643 \u0622\u0631\u062A\u0634\u0631 AX73 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0645\u0632\u062F\u0648\u062C \u0627\u0644\u0646\u0637\u0627\u0642",
    descriptionEn: "Gigabit Wi-Fi 6 router delivering up to 5400 Mbps speeds for 8K streaming, 6 high-gain antennas, and HomeShield security.",
    descriptionAr: "\u0631\u0627\u0648\u062A\u0631 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u062C\u064A\u062C\u0627\u0628\u062A \u0628\u0633\u0631\u0639\u0627\u062A \u062A\u0635\u0644 \u0625\u0644\u0649 5400 \u0645\u064A\u062C\u0627\u0628\u062A \u0644\u0628\u062B \u0628\u062F\u0642\u0629 8K \u0645\u0639 6 \u0647\u0648\u0627\u0626\u064A\u0627\u062A \u0648\u062D\u0645\u0627\u064A\u0629 HomeShield \u0627\u0644\u0645\u062A\u0637\u0648\u0631\u0629.",
    condition: "New",
    categoryId: 12,
    brandId: 11,
    categoryNameEn: "Routers & Wi-Fi",
    categoryNameAr: "\u0631\u0627\u0648\u062A\u0631\u0627\u062A \u0648\u0648\u0627\u064A \u0641\u0627\u064A",
    categorySlug: "routers-wi-fi",
    brandName: "TP-Link",
    brandSlug: "tp-link",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 15,
    specifications: [
      { keyEn: "Wi-Fi Speed", keyAr: "\u0633\u0631\u0639\u0629 \u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A", valueEn: "AX5400 (4804 Mbps + 574 Mbps)", valueAr: "AX5400 (4804 \u0645\u064A\u062C\u0627\u0628\u062A + 574 \u0645\u064A\u062C\u0627\u0628\u062A)" },
      { keyEn: "Antennas", keyAr: "\u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0627\u062A", valueEn: "6 High-Gain External Antennas", valueAr: "6 \u0647\u0648\u0627\u0626\u064A\u0627\u062A \u062E\u0627\u0631\u062C\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0623\u062F\u0627\u0621" }
    ],
    variants: [
      { name: "AX5400 Standard", price: 340, originalPrice: 380, isDefault: true, stockQuantity: 15 }
    ],
    images: [
      "/api/images/50001"
    ],
    createdAt: "2026-10-28T08:02:45.015Z"
  },
  {
    id: 12,
    slug: "tp-link-archer-ax55-pro-gigabit-wi-fi-6-router",
    sku: "TP-ARCHER-AX55-1793173174137",
    nameEn: "TP-Link Archer AX55 Pro Gigabit Wi-Fi 6 Router",
    nameAr: "\u0631\u0627\u0648\u062A\u0631 \u062A\u064A \u0628\u064A \u0644\u064A\u0646\u0643 \u0622\u0631\u062A\u0634\u0631 AX55 \u0628\u0631\u0648 \u062C\u064A\u062C\u0627\u0628\u062A \u0648\u0627\u064A \u0641\u0627\u064A 6",
    descriptionEn: "Multi-Gigabit Wi-Fi 6 router with 2.5G port, AX3000 speeds, low latency gaming, and VPN server/client support.",
    descriptionAr: "\u0631\u0627\u0648\u062A\u0631 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062C\u064A\u062C\u0627\u0628\u062A \u0645\u0639 \u0645\u0646\u0641\u0630 2.5G \u0648\u0633\u0631\u0639\u0627\u062A AX3000 \u0644\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u062F\u0639\u0645 \u062E\u0648\u0627\u062F\u0645 VPN.",
    condition: "New",
    categoryId: 12,
    brandId: 11,
    categoryNameEn: "Routers & Wi-Fi",
    categoryNameAr: "\u0631\u0627\u0648\u062A\u0631\u0627\u062A \u0648\u0648\u0627\u064A \u0641\u0627\u064A",
    categorySlug: "routers-wi-fi",
    brandName: "TP-Link",
    brandSlug: "tp-link",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 10,
    specifications: [
      { keyEn: "Ports", keyAr: "\u0627\u0644\u0645\u0646\u0627\u0641\u0630", valueEn: "1x 2.5Gbps WAN/LAN + 4x Gigabit LAN", valueAr: "\u0645\u0646\u0641\u0630 2.5 \u062C\u064A\u062C\u0627\u0628\u062A + 4 \u0645\u0646\u0627\u0641\u0630 \u062C\u064A\u062C\u0627\u0628\u062A" },
      { keyEn: "Wi-Fi Speed", keyAr: "\u0633\u0631\u0639\u0629 \u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A", valueEn: "AX3000 (2402 Mbps + 574 Mbps)", valueAr: "AX3000 (2402 \u0645\u064A\u062C\u0627\u0628\u062A + 574 \u0645\u064A\u062C\u0627\u0628\u062A)" }
    ],
    variants: [
      { name: "AX3000 Pro (2.5G Port)", price: 290, originalPrice: 330, isDefault: true, stockQuantity: 10 }
    ],
    images: [
      "/api/images/50001"
    ],
    createdAt: "2026-10-28T07:39:34.178Z"
  },
  {
    id: 13,
    slug: "tp-link-archer-air-e5-range-extender",
    sku: "ARCHER-AIR-E5-EXT",
    nameEn: "TP-Link Archer Air E5 Range Extender",
    nameAr: "\u0645\u0648\u0633\u0639 \u0646\u0637\u0627\u0642 \u062A\u064A \u0628\u064A \u0644\u064A\u0646\u0643 \u0622\u0631\u062A\u0634\u0631 \u0625\u064A\u0631 E5",
    descriptionEn: "Compact Wi-Fi 6 range extender engineered for dead-zone elimination with ultra-thin profile and smart signal indicator.",
    descriptionAr: "\u0645\u0648\u0633\u0639 \u0646\u0637\u0627\u0642 \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0645\u062F\u0645\u062C \u0645\u0635\u0645\u0645 \u0644\u0644\u0642\u0636\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u064A\u062A\u0629 \u0645\u0639 \u062A\u0635\u0645\u064A\u0645 \u0646\u062D\u064A\u0641 \u0648\u0645\u0624\u0634\u0631 \u0625\u0634\u0627\u0631\u0629 \u0630\u0643\u064A.",
    condition: "New",
    categoryId: 11,
    brandId: 11,
    categoryNameEn: "Networking & Wi-Fi",
    categoryNameAr: "\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0648\u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A",
    categorySlug: "networking-wi-fi",
    brandName: "TP-Link",
    brandSlug: "tp-link",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 12,
    specifications: [
      { keyEn: "Coverage", keyAr: "\u0627\u0644\u062A\u063A\u0637\u064A\u0629", valueEn: "Up to 1,500 sq. ft.", valueAr: "\u062A\u063A\u0637\u064A\u0629 \u062A\u0635\u0644 \u0625\u0644\u0649 1500 \u0642\u062F\u0645 \u0645\u0631\u0628\u0639" }
    ],
    variants: [
      { name: "Standard Extender", price: 220, originalPrice: 260, isDefault: true, stockQuantity: 12 }
    ],
    images: [
      "/api/images/50001"
    ],
    createdAt: "2026-10-27T18:52:56.585Z"
  },
  {
    id: 14,
    slug: "playstation-5-pro-digital-edition",
    sku: "PS5-PRO-DIGITAL",
    nameEn: "Sony PlayStation 5 Pro Console",
    nameAr: "\u062C\u0647\u0627\u0632 \u0633\u0648\u0646\u064A \u0628\u0644\u0627\u064A\u0633\u062A\u064A\u0634\u0646 5 \u0628\u0631\u0648",
    descriptionEn: "Experience next-level gaming with PlayStation Spectral Super Resolution (PSSR), 2TB ultra-fast SSD, and enhanced Ray Tracing.",
    descriptionAr: "\u062A\u062C\u0631\u0628\u0629 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u0642\u0627\u062F\u0645 \u0645\u0639 \u062A\u0642\u0646\u064A\u0629 PSSR \u0648\u0633\u0639\u0629 2 \u062A\u064A\u0631\u0627\u0628\u0627\u064A\u062A SSD \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u062A\u062A\u0628\u0639 \u0623\u0634\u0639\u0629 \u0645\u062A\u0637\u0648\u0631.",
    condition: "New",
    categoryId: 8,
    brandId: 10,
    categoryNameEn: "Other Electronics",
    categoryNameAr: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0623\u062E\u0631\u0649",
    categorySlug: "other-electronics",
    brandName: "PlayStation",
    brandSlug: "playstation",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 6,
    specifications: [
      { keyEn: "Storage", keyAr: "\u0627\u0644\u062A\u062E\u0632\u064A\u0646", valueEn: "2TB Custom NVMe SSD", valueAr: "2 \u062A\u064A\u0631\u0627\u0628\u0627\u064A\u062A NVMe SSD \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0631\u0639\u0629" },
      { keyEn: "Resolution Support", keyAr: "\u062F\u0639\u0645 \u0627\u0644\u062F\u0642\u0629", valueEn: "Up to 8K / 4K 120fps with PSSR", valueAr: "\u062F\u0642\u0629 \u062D\u062A\u0649 8K / 4K \u0628\u0633\u0631\u0639\u0629 120 \u0625\u0637\u0627\u0631" }
    ],
    variants: [
      { name: "PS5 Pro (2TB)", price: 2999, originalPrice: 3299, isDefault: true, stockQuantity: 6 }
    ],
    images: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-18T13:38:33.384Z"
  },
  {
    id: 15,
    slug: "motorola-edge-50-ultra-5g",
    sku: "MOTO-EDGE50-ULTRA",
    nameEn: "Motorola Edge 50 Ultra 5G - Nordic Wood",
    nameAr: "\u0645\u0648\u062A\u0648\u0631\u0648\u0644\u0627 \u0625\u064A\u062F\u062C 50 \u0627\u0644\u062A\u0631\u0627 5G - \u062E\u0634\u0628 \u0646\u0648\u0631\u062F\u064A\u0643",
    descriptionEn: "Real FSC-certified wood finish, Snapdragon 8s Gen 3, Pantone validated camera, 125W TurboPower charging, and IP68 underwater protection.",
    descriptionAr: "\u0638\u0647\u0631 \u0645\u0646 \u0627\u0644\u062E\u0634\u0628 \u0627\u0644\u0637\u0628\u064A\u0639\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u060C \u0645\u0639\u0627\u0644\u062C \u0633\u0646\u0627\u0628\u062F\u0631\u0627\u062C\u0648\u0646 8s \u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u062B\u0627\u0644\u062B\u060C \u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u0646 \u0628\u0627\u0646\u062A\u0648\u0646 \u0648\u0634\u062D\u0646 \u0641\u0627\u0626\u0642 125 \u0648\u0627\u0637.",
    condition: "New",
    categoryId: 1,
    brandId: 13,
    categoryNameEn: "Mobile Phones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
    categorySlug: "mobile-phones",
    brandName: "Motorola",
    brandSlug: "motorola",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 5,
    specifications: [
      { keyEn: "Charging", keyAr: "\u0627\u0644\u0634\u062D\u0646", valueEn: "125W Wired + 50W Wireless", valueAr: "125 \u0648\u0627\u0637 \u0633\u0644\u0643\u064A + 50 \u0648\u0627\u0637 \u0644\u0627\u0633\u0644\u0643\u064A" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '6.7" Super HD (1220p) pOLED 144Hz', valueAr: "6.7 \u0628\u0648\u0635\u0629 \u0633\u0648\u0628\u0631 HD \u0623\u0648\u0644\u064A\u062F 144 \u0647\u0631\u062A\u0632" }
    ],
    variants: [
      { name: "16GB RAM + 512GB (Nordic Wood)", price: 3299, originalPrice: 3699, isDefault: true, stockQuantity: 5 }
    ],
    images: [
      "/api/images/8"
    ],
    createdAt: "2026-10-27T18:14:47.783Z"
  },
  {
    id: 16,
    slug: "razer-blackshark-v2-pro-wireless-gaming-headset",
    sku: "RAZER-BSV2P-WHT",
    nameEn: "Razer BlackShark V2 Pro Wireless Gaming Headset",
    nameAr: "\u0633\u0645\u0627\u0639\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A\u0629 \u0631\u064A\u0632\u0631 \u0628\u0644\u0627\u0643 \u0634\u0627\u0631\u0643 V2 \u0628\u0631\u0648",
    descriptionEn: "For esports athletes: Razer HyperClear Super Wideband Mic, TriForce Titanium 50mm Drivers, and up to 70 hours battery life.",
    descriptionAr: "\u0645\u0635\u0645\u0645\u0629 \u0644\u0628\u0637\u0648\u0644\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0627\u062A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629: \u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u0642\u0627\u0621\u060C \u0645\u0643\u0628\u0631\u0627\u062A \u0635\u0648\u062A \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 50 \u0645\u0644\u0645 \u0648\u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 \u062D\u062A\u0649 70 \u0633\u0627\u0639\u0629.",
    condition: "New",
    categoryId: 5,
    brandId: 14,
    categoryNameEn: "Earbuds & Audio",
    categoryNameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0623\u0630\u0646 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A",
    categorySlug: "earbuds-audio",
    brandName: "Razer",
    brandSlug: "razer",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 8,
    specifications: [
      { keyEn: "Battery Life", keyAr: "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", valueEn: "Up to 70 Hours", valueAr: "\u062D\u062A\u0649 70 \u0633\u0627\u0639\u0629 \u062A\u0634\u063A\u064A\u0644" },
      { keyEn: "Connection", keyAr: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644", valueEn: "Razer HyperSpeed Wireless 2.4GHz + Bluetooth 5.2", valueAr: "\u0627\u062A\u0635\u0627\u0644 \u0644\u0627\u0633\u0644\u0643\u064A \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0631\u0639\u0629 + \u0628\u0644\u0648\u062A\u0648\u062B" }
    ],
    variants: [
      { name: "White Edition", price: 699, originalPrice: 799, isDefault: true, stockQuantity: 8 }
    ],
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-28T09:44:24.212Z"
  },
  {
    id: 18,
    slug: "apple-iphone-16-pro-max-silicone-case-magsafe",
    sku: "AP-IP16PM-SIL-BLK",
    nameEn: "Apple iPhone 16 Pro Max Silicone Case with MagSafe",
    nameAr: "\u063A\u0637\u0627\u0621 \u0633\u064A\u0644\u064A\u0643\u0648\u0646 \u0623\u0635\u0644\u064A \u0645\u0639 \u0645\u0627\u062C \u0633\u064A\u0641 \u0644\u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633",
    descriptionEn: "Designed by Apple with Camera Control sapphire crystal interaction, silky soft-touch exterior silicone, microfiber lining, and built-in MagSafe alignment.",
    descriptionAr: "\u062A\u0635\u0645\u064A\u0645 \u0631\u0633\u0645\u064A \u0645\u0646 \u0622\u0628\u0644 \u0645\u0639 \u062F\u0639\u0645 \u0632\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0628\u0637\u0628\u0642\u0629 \u0627\u0644\u064A\u0627\u0642\u0648\u062A\u060C \u0633\u064A\u0644\u064A\u0643\u0648\u0646 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u0639\u0648\u0645\u0629\u060C \u0628\u0637\u0627\u0646\u0629 \u0645\u0627\u064A\u0643\u0631\u0648\u0641\u0627\u064A\u0628\u0631\u060C \u0648\u0645\u063A\u0646\u0627\u0637\u064A\u0633 \u0645\u0627\u062C \u0633\u064A\u0641 \u0645\u062F\u0645\u062C.",
    condition: "New",
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Accessories",
    categoryNameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    categorySlug: "accessories",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 25,
    specifications: [
      { keyEn: "Compatibility", keyAr: "\u0627\u0644\u062A\u0648\u0627\u0641\u0642", valueEn: 'iPhone 16 Pro Max (6.9")', valueAr: "\u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633 (6.9 \u0628\u0648\u0635\u0629)" },
      { keyEn: "Material", keyAr: "\u0627\u0644\u062E\u0627\u0645\u0629", valueEn: "Premium Liquid Silicone + Microfiber Lining", valueAr: "\u0633\u064A\u0644\u064A\u0643\u0648\u0646 \u0633\u0627\u0626\u0644 \u0641\u0627\u062E\u0631 + \u0628\u0637\u0627\u0646\u0629 \u0645\u0627\u064A\u0643\u0631\u0648\u0641\u0627\u064A\u0628\u0631" },
      { keyEn: "Special Feature", keyAr: "\u0627\u0644\u0645\u064A\u0632\u0629 \u0627\u0644\u062E\u0627\u0635\u0629", valueEn: "Full Camera Control Sapphire Crystal Support", valueAr: "\u062F\u0639\u0645 \u0643\u0627\u0645\u0644 \u0644\u0632\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627" }
    ],
    variants: [
      { name: "Black (Original)", price: 199, originalPrice: 229, isDefault: true, stockQuantity: 10 },
      { name: "Denim Blue", price: 199, originalPrice: 229, isDefault: false, stockQuantity: 8 },
      { name: "Plum Purple", price: 199, originalPrice: 229, isDefault: false, stockQuantity: 7 }
    ],
    images: [
      "https://images.unsplash.com/photo-1603539279542-e925916a048d?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:00:00.000Z"
  },
  {
    id: 19,
    slug: "apple-iphone-16-pro-max-finewoven-case-magsafe",
    sku: "AP-IP16PM-FW-TAUPE",
    nameEn: "Apple iPhone 16 Pro Max FineWoven Case with MagSafe",
    nameAr: "\u063A\u0637\u0627\u0621 \u0641\u0627\u064A\u0646 \u0648\u0648\u0641\u0646 \u0627\u0644\u0641\u0627\u062E\u0631 \u0645\u0639 \u0645\u0627\u062C \u0633\u064A\u0641 \u0644\u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633",
    descriptionEn: "Made from durable microtwill with a soft suede-like touch. Premium luxury finish made with 68% post-consumer recycled content.",
    descriptionAr: "\u0645\u0635\u0646\u0648\u0639 \u0645\u0646 \u0646\u0633\u064A\u062C \u0627\u0644\u0645\u0627\u064A\u0643\u0631\u0648\u062A\u0648\u064A\u0644 \u0627\u0644\u0645\u062A\u064A\u0646 \u0628\u0645\u0644\u0645\u0633 \u0634\u0645\u0648\u0627\u0647 \u0641\u0627\u062E\u0631 \u0648\u0645\u063A\u0646\u0627\u0637\u064A\u0633 \u0645\u0627\u062C \u0633\u064A\u0641 \u0642\u0648\u064A.",
    condition: "New",
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Accessories",
    categoryNameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    categorySlug: "accessories",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 15,
    specifications: [
      { keyEn: "Material", keyAr: "\u0627\u0644\u062E\u0627\u0645\u0629", valueEn: "Durable Microtwill Recycled Fabric", valueAr: "\u0642\u0645\u0627\u0634 \u0645\u0627\u064A\u0643\u0631\u0648\u062A\u0648\u064A\u0644 \u0645\u0639\u0627\u062F \u062A\u062F\u0648\u064A\u0631\u0647 \u0645\u062A\u064A\u0646" },
      { keyEn: "MagSafe Support", keyAr: "\u062F\u0639\u0645 \u0645\u0627\u062C \u0633\u064A\u0641", valueEn: "Integrated 15W High-Flux Magnets", valueAr: "\u0645\u063A\u0646\u0627\u0637\u064A\u0633 \u0639\u0627\u0644\u064A \u0627\u0644\u0642\u0648\u0629 \u0645\u062F\u0645\u062C" }
    ],
    variants: [
      { name: "Taupe Luxury", price: 229, originalPrice: 259, isDefault: true, stockQuantity: 8 },
      { name: "Black FineWoven", price: 229, originalPrice: 259, isDefault: false, stockQuantity: 7 }
    ],
    images: [
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:05:00.000Z"
  },
  {
    id: 20,
    slug: "apple-iphone-16-clear-case-magsafe",
    sku: "AP-IP16-CLR-CASE",
    nameEn: "Apple iPhone 16 Clear Case with MagSafe",
    nameAr: "\u063A\u0637\u0627\u0621 \u062D\u0645\u0627\u064A\u0629 \u0634\u0641\u0627\u0641 \u0623\u0635\u0644\u064A \u0645\u0639 \u0645\u0627\u062C \u0633\u064A\u0641 \u0644\u0622\u064A\u0641\u0648\u0646 16",
    descriptionEn: "Thin, light, and easy to grip. Crafted with a blend of optically clear polycarbonate and flexible materials with scratch-resistant coating.",
    descriptionAr: "\u0646\u062D\u064A\u0641 \u0648\u062E\u0641\u064A\u0641 \u0645\u0639 \u0642\u0628\u0636\u0629 \u0645\u062D\u0643\u0645\u0629. \u0645\u0632\u064A\u062C \u0645\u0646 \u0627\u0644\u0628\u0648\u0644\u064A \u0643\u0631\u0628\u0648\u0646\u0627\u062A \u0641\u0627\u0626\u0642 \u0627\u0644\u0634\u0641\u0627\u0641\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0631\u0646\u0629 \u0627\u0644\u0645\u0642\u0627\u0648\u0645\u0629 \u0644\u0644\u0627\u0635\u0641\u0631\u0627\u0631 \u0648\u0627\u0644\u062E\u062F\u0648\u0634.",
    condition: "New",
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Accessories",
    categoryNameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    categorySlug: "accessories",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 20,
    specifications: [
      { keyEn: "Anti-Yellowing", keyAr: "\u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0627\u0635\u0641\u0631\u0627\u0631", valueEn: "UV & Scratch Resistant Optical Polycarbonate", valueAr: "\u0628\u0648\u0644\u064A \u0643\u0631\u0628\u0648\u0646\u0627\u062A \u0628\u0635\u0631\u064A \u0645\u0642\u0627\u0648\u0645 \u0644\u0644\u0623\u0634\u0639\u0629 \u0641\u0648\u0642 \u0627\u0644\u0628\u0646\u0641\u0633\u062C\u064A\u0629" }
    ],
    variants: [
      { name: "Crystal Clear", price: 179, originalPrice: 209, isDefault: true, stockQuantity: 20 }
    ],
    images: [
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:10:00.000Z"
  },
  {
    id: 21,
    slug: "spigen-ultra-hybrid-magsafe-iphone-16-pro-max",
    sku: "SPG-UH-IP16PM-CLR",
    nameEn: "Spigen Ultra Hybrid MagSafe Case for iPhone 16 Pro Max",
    nameAr: "\u063A\u0637\u0627\u0621 \u0633\u0628\u064A\u062C\u0646 \u0623\u0644\u062A\u0631\u0627 \u0647\u0627\u064A\u0628\u0631\u062F \u0645\u0627\u062C \u0633\u064A\u0641 \u0644\u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648 \u0645\u0627\u0643\u0633",
    descriptionEn: "Military-grade Air Cushion technology drop protection, raised lip screen and camera shield, and heavy-duty magnetic lock ring.",
    descriptionAr: "\u062D\u0645\u0627\u064A\u0629 \u0639\u0633\u0643\u0631\u064A\u0629 \u0628\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0648\u0633\u0627\u0626\u062F \u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0629 Air Cushion \u0648\u062D\u0648\u0627\u0641 \u0645\u0631\u062A\u0641\u0639\u0629 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0634\u0627\u0634\u0629 \u0648\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u0639 \u062D\u0644\u0642\u0629 \u0645\u0627\u062C \u0633\u064A\u0641 \u0642\u0648\u064A\u0629.",
    condition: "New",
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Accessories",
    categoryNameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    categorySlug: "accessories",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 30,
    specifications: [
      { keyEn: "Drop Rating", keyAr: "\u0645\u0639\u064A\u0627\u0631 \u0627\u0644\u0633\u0642\u0648\u0637", valueEn: "Military Grade MIL-STD 810G-516.6", valueAr: "\u0645\u0639\u064A\u0627\u0631 \u0639\u0633\u0643\u0631\u064A \u0644\u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0633\u0642\u0648\u0637" },
      { keyEn: "Magnet Strength", keyAr: "\u0642\u0648\u0629 \u0627\u0644\u0645\u063A\u0646\u0627\u0637\u064A\u0633", valueEn: "N52 Neodymium Magnetic Core", valueAr: "\u0645\u063A\u0646\u0627\u0637\u064A\u0633 \u0646\u064A\u0648\u062F\u064A\u0645\u064A\u0648\u0645 N52 \u0634\u062F\u064A\u062F \u0627\u0644\u0642\u0648\u0629" }
    ],
    variants: [
      { name: "White Frost MagSafe", price: 99, originalPrice: 129, isDefault: true, stockQuantity: 15 },
      { name: "Matte Black MagSafe", price: 99, originalPrice: 129, isDefault: false, stockQuantity: 15 }
    ],
    images: [
      "https://images.unsplash.com/photo-1541877590-a15d2a9f7336?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:15:00.000Z"
  },
  {
    id: 22,
    slug: "torras-360-rotatable-magnetic-ostand-iphone-16-pro",
    sku: "TRS-OST-IP16P-TIT",
    nameEn: "Torras 360\xB0 Rotatable Magnetic Ostand Case for iPhone 16 Pro",
    nameAr: "\u0643\u0641\u0631 \u062A\u0648\u0631\u0627\u0633 \u0623\u0648\u0633\u062A\u0627\u0646\u062F \u0633\u062A\u0627\u0646\u062F \u0645\u063A\u0646\u0627\u0637\u064A\u0633\u064A \u062F\u0648\u0627\u0631 360 \u062F\u0631\u062C\u0629 \u0644\u0622\u064A\u0641\u0648\u0646 16 \u0628\u0631\u0648",
    descriptionEn: "Pioneering 360-degree all-angle kickstand ring, 18N hyper-magnetism, silky aerospace aluminum ring, and rugged shockproof protection.",
    descriptionAr: "\u0633\u062A\u0627\u0646\u062F \u0645\u062F\u0645\u062C \u062F\u0648\u0627\u0631 \u0628\u0632\u0627\u0648\u064A\u0629 360 \u062F\u0631\u062C\u0629 \u0645\u0646 \u0627\u0644\u0623\u0644\u0645\u0646\u064A\u0648\u0645 \u0627\u0644\u0641\u0636\u0627\u0626\u064A\u060C \u0645\u063A\u0646\u0627\u0637\u064A\u0633 \u062E\u0627\u0631\u0642 18 \u0646\u064A\u0648\u062A\u0646 \u0648\u062D\u0645\u0627\u064A\u0629 \u0645\u062A\u064A\u0646\u0629 \u0636\u062F \u0627\u0644\u0635\u062F\u0645\u0627\u062A.",
    condition: "New",
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Accessories",
    categoryNameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
    categorySlug: "accessories",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 18,
    specifications: [
      { keyEn: "Stand Angle", keyAr: "\u0632\u0648\u0627\u064A\u0627 \u0627\u0644\u0633\u062A\u0627\u0646\u062F", valueEn: "0\xB0 to 120\xB0 Adjustable (Portrait & Landscape)", valueAr: "\u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0639\u062F\u064A\u0644 \u0645\u0646 0 \u0625\u0644\u0649 120 \u062F\u0631\u062C\u0629" },
      { keyEn: "Protection", keyAr: "\u0627\u0644\u062D\u0645\u0627\u064A\u0629", valueEn: "12ft Military Drop Certified", valueAr: "\u062D\u0645\u0627\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u0646 \u0633\u0642\u0648\u0637 \u062D\u062A\u0649 12 \u0642\u062F\u0645" }
    ],
    variants: [
      { name: "Titanium Gray", price: 149, originalPrice: 179, isDefault: true, stockQuantity: 10 },
      { name: "Midnight Black", price: 149, originalPrice: 179, isDefault: false, stockQuantity: 8 }
    ],
    images: [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:20:00.000Z"
  },
  {
    id: 23,
    slug: "anker-737-ganprime-140w-3-port-wall-charger",
    sku: "ANKER-737-140W-BLK",
    nameEn: "Anker 737 GaNPrime 140W 3-Port Fast Wall Charger",
    nameAr: "\u0634\u0627\u062D\u0646 \u062C\u062F\u0627\u0631\u064A \u0623\u0646\u0643\u0631 737 \u062C\u0627\u0646 \u0628\u0631\u0627\u064A\u0645 \u0628\u0642\u0648\u0629 140 \u0648\u0627\u0637 \u0628\u0640 3 \u0645\u0646\u0627\u0641\u0630",
    descriptionEn: "Power 3 devices simultaneously at maximum speed. Features GaNPrime technology, PowerIQ 4.0 dynamic power distribution, and ActiveShield 2.0 safety.",
    descriptionAr: "\u0627\u0634\u062D\u0646 3 \u0623\u062C\u0647\u0632\u0629 \u0641\u064A \u0648\u0642\u062A \u0648\u0627\u062D\u062F \u0628\u0623\u0642\u0635\u0649 \u0633\u0631\u0639\u0629. \u062A\u0642\u0646\u064A\u0629 GaNPrime \u0648\u062A\u0648\u0632\u064A\u0639 \u0637\u0627\u0642\u0629 \u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A \u0645\u0639 \u0646\u0638\u0627\u0645 \u062D\u0645\u0627\u064A\u0629 \u0630\u0643\u064A ActiveShield 2.0.",
    condition: "New",
    categoryId: 4,
    brandId: 7,
    categoryNameEn: "Chargers & Cables",
    categoryNameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    categorySlug: "chargers-cables",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 16,
    specifications: [
      { keyEn: "Total Output", keyAr: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0627\u0642\u0629", valueEn: "140W Max Output (2x USB-C + 1x USB-A)", valueAr: "140 \u0648\u0627\u0637 \u0643\u062D\u062F \u0623\u0642\u0635\u0649 (\u0645\u0646\u0641\u0630\u064A\u0646 \u062A\u0627\u064A\u0628 \u0633\u064A + \u0645\u0646\u0641\u0630 USB-A)" },
      { keyEn: "Compatibility", keyAr: "\u0627\u0644\u062A\u0648\u0627\u0641\u0642", valueEn: 'MacBook Pro 16", iPhone 16 Series, Galaxy S25, iPads', valueAr: "\u0645\u0627\u0643 \u0628\u0648\u0643 \u0628\u0631\u0648\u060C \u0633\u0644\u0633\u0644\u0629 \u0622\u064A\u0641\u0648\u0646 16\u060C \u062C\u0627\u0644\u0627\u0643\u0633\u064A S25\u060C \u0622\u064A\u0628\u0627\u062F" }
    ],
    variants: [
      { name: "GaNPrime 140W (Black)", price: 349, originalPrice: 399, isDefault: true, stockQuantity: 16 }
    ],
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:25:00.000Z"
  },
  {
    id: 24,
    slug: "anker-maggo-3-in-1-foldable-wireless-charging-station",
    sku: "ANKER-MAGGO-3IN1-WHT",
    nameEn: "Anker MagGo 3-in-1 Foldable Wireless Charging Station (Qi2 15W)",
    nameAr: "\u0645\u062D\u0637\u0629 \u0634\u062D\u0646 \u0644\u0627\u0633\u0644\u0643\u064A \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0637\u064A 3 \u0641\u064A 1 \u0623\u0646\u0643\u0631 \u0645\u0627\u062C \u062C\u0648 \u0628\u062A\u0642\u0646\u064A\u0629 Qi2",
    descriptionEn: "Official Qi2 Certified 15W ultra-fast wireless stand. Charges iPhone, Apple Watch Series/Ultra, and AirPods simultaneously in an ultra-compact pocket format.",
    descriptionAr: "\u0645\u062D\u0637\u0629 \u0634\u062D\u0646 \u0644\u0627\u0633\u0644\u0643\u064A \u0645\u0639\u062A\u0645\u062F\u0629 \u0631\u0633\u0645\u064A\u0627\u064B \u0628\u062A\u0642\u0646\u064A\u0629 Qi2 \u0628\u0642\u0648\u0629 15 \u0648\u0627\u0637 \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0633\u0631\u0639\u0629 \u0644\u0644\u0622\u064A\u0641\u0648\u0646 \u0648\u0633\u0627\u0639\u0629 \u0622\u0628\u0644 \u0648\u0633\u0645\u0627\u0639\u0627\u062A \u0625\u064A\u0631\u0628\u0648\u062F\u0632 \u0628\u062A\u0635\u0645\u064A\u0645 \u0645\u062F\u0645\u062C \u0644\u0644\u062C\u064A\u0628.",
    condition: "New",
    categoryId: 4,
    brandId: 7,
    categoryNameEn: "Chargers & Cables",
    categoryNameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    categorySlug: "chargers-cables",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: true,
    isNewArrival: true,
    status: "published",
    stockQuantity: 14,
    specifications: [
      { keyEn: "Wireless Speed", keyAr: "\u0633\u0631\u0639\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A", valueEn: "15W Qi2 Certified Ultra-Fast", valueAr: "15 \u0648\u0627\u0637 \u0634\u062D\u0646 \u0644\u0627\u0633\u0644\u0643\u064A \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0631\u0639\u0629" },
      { keyEn: "Design", keyAr: "\u0627\u0644\u062A\u0635\u0645\u064A\u0645", valueEn: "Ultra-Compact Foldable Travel Puck", valueAr: "\u062A\u0635\u0645\u064A\u0645 \u0641\u0627\u0626\u0642 \u0627\u0644\u0635\u063A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0637\u064A \u0648\u0645\u062B\u0627\u0644\u064A \u0644\u0644\u0633\u0641\u0631" }
    ],
    variants: [
      { name: "Arctic White", price: 399, originalPrice: 449, isDefault: true, stockQuantity: 8 },
      { name: "Phantom Black", price: 399, originalPrice: 449, isDefault: false, stockQuantity: 6 }
    ],
    images: [
      "https://images.unsplash.com/photo-1622445268045-81d33c84d728?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:30:00.000Z"
  },
  {
    id: 25,
    slug: "anker-soundcore-liberty-4-nc-noise-cancelling-earbuds",
    sku: "ANKER-SC-L4NC-NVY",
    nameEn: "Anker Soundcore Liberty 4 NC Wireless Noise-Cancelling Earbuds",
    nameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0623\u0646\u0643\u0631 \u0633\u0627\u0648\u0646\u062F \u0643\u0648\u0631 \u0644\u064A\u0628\u0631\u062A\u064A 4 NC \u0627\u0644\u0639\u0627\u0632\u0644\u0629 \u0644\u0644\u0636\u0648\u0636\u0627\u0621",
    descriptionEn: "Reduce noise by up to 98.5% with Adaptive ANC 2.0. Equipped with 11mm custom drivers, Hi-Res wireless audio (LDAC), and 50 hours of total playtime.",
    descriptionAr: "\u0639\u0632\u0644 \u0636\u0648\u0636\u0627\u0621 \u0641\u0627\u0626\u0642 \u064A\u0635\u0644 \u0625\u0644\u0649 98.5% \u0645\u0639 \u062A\u0642\u0646\u064A\u0629 ANC 2.0 \u0627\u0644\u062A\u0643\u064A\u0641\u064A\u0629\u060C \u0645\u0643\u0628\u0631\u0627\u062A \u0635\u0648\u062A 11 \u0645\u0644\u0645\u060C \u0635\u0648\u062A \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629 \u0648\u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 \u062D\u062A\u0649 50 \u0633\u0627\u0639\u0629.",
    condition: "New",
    categoryId: 5,
    brandId: 7,
    categoryNameEn: "Earbuds & Audio",
    categoryNameAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0623\u0630\u0646 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0627\u062A",
    categorySlug: "earbuds-audio",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: false,
    isNewArrival: true,
    status: "published",
    stockQuantity: 20,
    specifications: [
      { keyEn: "Noise Reduction", keyAr: "\u0639\u0632\u0644 \u0627\u0644\u0636\u0648\u0636\u0627\u0621", valueEn: "Adaptive ANC 2.0 (Up to 98.5%)", valueAr: "\u0639\u0632\u0644 \u0630\u0643\u064A \u062A\u0643\u064A\u0641\u064A \u062D\u062A\u0649 98.5%" },
      { keyEn: "Battery Life", keyAr: "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", valueEn: "10H Earbuds / 50H with Wireless Case", valueAr: "10 \u0633\u0627\u0639\u0627\u062A \u0628\u0627\u0644\u0633\u0645\u0627\u0639\u0629 / 50 \u0633\u0627\u0639\u0629 \u0645\u0639 \u0627\u0644\u0639\u0644\u0628\u0629" }
    ],
    variants: [
      { name: "Navy Blue", price: 299, originalPrice: 349, isDefault: true, stockQuantity: 10 },
      { name: "Velvet Black", price: 299, originalPrice: 349, isDefault: false, stockQuantity: 10 }
    ],
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:35:00.000Z"
  },
  {
    id: 26,
    slug: "anker-powerline-iii-flow-usb-c-silicone-cable",
    sku: "ANKER-PL-FLOW-100W",
    nameEn: "Anker PowerLine III Flow USB-C to USB-C Silicone Cable (100W, 6ft)",
    nameAr: "\u0643\u0627\u0628\u0644 \u0623\u0646\u0643\u0631 \u0628\u0627\u0648\u0631\u0644\u0627\u064A\u0646 3 \u0641\u0644\u0648 \u0633\u064A\u0644\u064A\u0643\u0648\u0646 \u0641\u0627\u0626\u0642 \u0627\u0644\u0646\u0639\u0648\u0645\u0629 100 \u0648\u0627\u0637 (6 \u0623\u0642\u062F\u0627\u0645)",
    descriptionEn: "Surprisingly soft silica gel finish that stays tangle-free even in pockets. Built to withstand 25,000 bends and supports 100W Power Delivery.",
    descriptionAr: "\u0645\u0644\u0645\u0633 \u0646\u0627\u0639\u0645 \u0643\u0627\u0644\u062D\u0631\u064A\u0631 \u0644\u0627 \u064A\u062A\u0634\u0627\u0628\u0643 \u0641\u064A \u0627\u0644\u062C\u064A\u0628\u060C \u0645\u0635\u0645\u0645 \u0644\u062A\u062D\u0645\u0644 25 \u0623\u0644\u0641 \u0627\u0646\u062D\u0646\u0627\u0621 \u0645\u0639 \u062F\u0639\u0645 \u0634\u062D\u0646 \u0633\u0631\u064A\u0639 \u0628\u0642\u062F\u0631\u0629 100 \u0648\u0627\u0637 PD.",
    condition: "New",
    categoryId: 4,
    brandId: 7,
    categoryNameEn: "Chargers & Cables",
    categoryNameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    categorySlug: "chargers-cables",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 40,
    specifications: [
      { keyEn: "Max Wattage", keyAr: "\u0623\u0642\u0635\u0649 \u0637\u0627\u0642\u0629", valueEn: "100W Power Delivery Fast Charging", valueAr: "\u0634\u062D\u0646 \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0631\u0639\u0629 \u0628\u0642\u062F\u0631\u0629 100 \u0648\u0627\u0637" },
      { keyEn: "Durability", keyAr: "\u0627\u0644\u0645\u062A\u0627\u0646\u0629", valueEn: "25,000-Bend Lifespan Graphene Core", valueAr: "\u0639\u0645\u0631 \u0627\u0641\u062A\u0631\u0627\u0636\u064A 25,000 \u0627\u0646\u062D\u0646\u0627\u0621" }
    ],
    variants: [
      { name: "Cloud White (6ft)", price: 59, originalPrice: 79, isDefault: true, stockQuantity: 20 },
      { name: "Midnight Black (6ft)", price: 59, originalPrice: 79, isDefault: false, stockQuantity: 20 }
    ],
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:40:00.000Z"
  },
  {
    id: 27,
    slug: "anker-nano-ii-65w-gan-fast-charger",
    sku: "ANKER-NANO2-65W",
    nameEn: "Anker Nano II 65W GaN Fast Charger",
    nameAr: "\u0634\u0627\u062D\u0646 \u0623\u0646\u0643\u0631 \u0646\u0627\u0646\u0648 2 \u0627\u0644\u0633\u0631\u064A\u0639 \u0628\u0642\u0648\u0629 65 \u0648\u0627\u0637 \u0628\u062A\u0642\u0646\u064A\u0629 \u062C\u0627\u0646",
    descriptionEn: "Ultra-compact 65W pocket charger. Up to 59% smaller than typical 60W wall adapters, ideal for charging your phone, tablet, and USB-C notebook all with one tiny plug.",
    descriptionAr: "\u0634\u0627\u062D\u0646 \u062C\u064A\u0628 \u0641\u0627\u0626\u0642 \u0627\u0644\u0635\u063A\u0631 \u0628\u0642\u0648\u0629 65 \u0648\u0627\u0637 \u0623\u0635\u063A\u0631 \u0628\u0646\u0633\u0628\u0629 59% \u0645\u0646 \u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629\u060C \u0645\u0646\u0627\u0633\u0628 \u0644\u0634\u062D\u0646 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0648\u0627\u0644\u0644\u0627\u0628\u062A\u0648\u0628\u0627\u062A.",
    condition: "New",
    categoryId: 4,
    brandId: 7,
    categoryNameEn: "Chargers & Cables",
    categoryNameAr: "\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0643\u0627\u0628\u0644\u0627\u062A",
    categorySlug: "chargers-cables",
    brandName: "Anker",
    brandSlug: "anker",
    isFeatured: false,
    isNewArrival: false,
    status: "published",
    stockQuantity: 25,
    specifications: [
      { keyEn: "Output", keyAr: "\u0627\u0644\u0637\u0627\u0642\u0629", valueEn: "65W Max USB-C PD 3.0 / PPS", valueAr: "65 \u0648\u0627\u0637 \u0643\u062D\u062F \u0623\u0642\u0635\u0649 \u0628\u0645\u0646\u0641\u0630 \u062A\u0627\u064A\u0628 \u0633\u064A" },
      { keyEn: "Technology", keyAr: "\u0627\u0644\u062A\u0642\u0646\u064A\u0629", valueEn: "Anker GaN II High-Efficiency Silicon", valueAr: "\u062A\u0642\u0646\u064A\u0629 GaN II \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0643\u0641\u0627\u0621\u0629" }
    ],
    variants: [
      { name: "Nano II 65W Black", price: 179, originalPrice: 209, isDefault: true, stockQuantity: 25 }
    ],
    images: [
      "https://images.unsplash.com/photo-1609592424367-e9a03e3aeb5c?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: "2026-10-29T10:45:00.000Z"
  }
];
var FALLBACK_SERVICES = [
  {
    id: 1,
    slug: "screen-battery-replacement",
    titleEn: "Express Screen & Battery Replacement",
    titleAr: "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0641\u0648\u0631\u064A \u0644\u0644\u0634\u0627\u0634\u0627\u062A \u0648\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0627\u062A",
    descriptionEn: "Certified Grade-A display glass and genuine high-health battery replacements completed in 30 to 45 minutes with a 90-day Dubai warranty.",
    descriptionAr: "\u0634\u0627\u0634\u0627\u062A \u0632\u062C\u0627\u062C\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629 \u0648\u0628\u0637\u0627\u0631\u064A\u0627\u062A \u0623\u0635\u0644\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u064A\u062A\u0645 \u0627\u0633\u062A\u0628\u062F\u0627\u0644\u0647\u0627 \u062E\u0644\u0627\u0644 30 \u0625\u0644\u0649 45 \u062F\u0642\u064A\u0642\u0629 \u0645\u0639 \u0636\u0645\u0627\u0646 90 \u064A\u0648\u0645\u0627\u064B \u0641\u064A \u062F\u0628\u064A.",
    icon: "Wrench",
    turnaroundEn: "30 - 45 Minutes",
    turnaroundAr: "30 - 45 \u062F\u0642\u064A\u0642\u0629",
    badgeEn: "Same-Day Fast Repair",
    badgeAr: "\u0635\u064A\u0627\u0646\u0629 \u0641\u0648\u0631\u064A\u0629 \u0628\u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645",
    featuresEn: [
      "Original OLED & TrueTone calibration",
      "100% Battery health restoration",
      "Zero risk water-resistance seal renewal",
      "90-Day warranty included"
    ],
    featuresAr: [
      "\u0645\u0639\u0627\u064A\u0631\u0629 \u0623\u0635\u0644\u064A\u0629 \u0644\u0644\u0634\u0627\u0634\u0627\u062A \u0648\u062A\u0642\u0646\u064A\u0629 TrueTone",
      "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0635\u062D\u0629 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 \u0625\u0644\u0649 100%",
      "\u062A\u062C\u062F\u064A\u062F \u0639\u0627\u0632\u0644 \u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u063A\u0628\u0627\u0631",
      "\u0636\u0645\u0627\u0646 \u0645\u0639\u062A\u0645\u062F \u0644\u0645\u062F\u0629 90 \u064A\u0648\u0645\u0627\u064B"
    ],
    displayOrder: 1,
    isActive: true
  },
  {
    id: 2,
    slug: "trade-in-device-valuation",
    titleEn: "Instant Device Trade-In & Fair Valuation",
    titleAr: "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0648\u062A\u0642\u064A\u064A\u0645 \u0641\u0648\u0631\u064A \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629",
    descriptionEn: "Upgrade your old smartphone, tablet, or smartwatch with the highest market valuation in Dubai. Immediate cash payout or instant upgrade credit.",
    descriptionAr: "\u0642\u0645 \u0628\u062A\u0631\u0642\u064A\u0629 \u0647\u0627\u062A\u0641\u0643 \u0627\u0644\u0642\u062F\u064A\u0645 \u0623\u0648 \u062C\u0647\u0627\u0632\u0643 \u0627\u0644\u0644\u0648\u062D\u064A \u0628\u0623\u0639\u0644\u0649 \u0633\u0639\u0631 \u062A\u0642\u064A\u064A\u0645 \u0641\u064A \u0633\u0648\u0642 \u062F\u0628\u064A\u060C \u0645\u0639 \u062F\u0641\u0639 \u0646\u0642\u062F\u064A \u0641\u0648\u0631\u064A \u0623\u0648 \u062E\u0635\u0645 \u0639\u0644\u0649 \u062C\u0647\u0627\u0632\u0643 \u0627\u0644\u062C\u062F\u064A\u062F.",
    icon: "RefreshCw",
    turnaroundEn: "15 Minutes",
    turnaroundAr: "15 \u062F\u0642\u064A\u0642\u0629",
    badgeEn: "Best Market Value",
    badgeAr: "\u0623\u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645 \u0641\u0648\u0631\u064A",
    featuresEn: [
      "Instant WhatsApp quote based on photos",
      "Complimentary military-grade data wipe",
      "Accepts Apple, Samsung, Google & tablets",
      "Immediate cash or direct trade credit"
    ],
    featuresAr: [
      "\u062A\u0642\u064A\u064A\u0645 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0645\u0646 \u0627\u0644\u0635\u0648\u0631",
      "\u0645\u0633\u062D \u0622\u0645\u0646 \u0648\u0645\u0639\u062A\u0645\u062F \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062C\u0627\u0646\u0627\u064B",
      "\u0646\u0642\u0628\u0644 \u0622\u0628\u0644\u060C \u0633\u0627\u0645\u0633\u0648\u0646\u062C\u060C \u062C\u0648\u062C\u0644 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629",
      "\u062A\u0633\u0644\u064A\u0645 \u0646\u0642\u062F\u064A \u0641\u0648\u0631\u064A \u0623\u0648 \u062E\u0635\u0645 \u0639\u0644\u0649 \u0627\u0644\u062C\u062F\u064A\u062F"
    ],
    displayOrder: 2,
    isActive: true
  },
  {
    id: 3,
    slug: "smart-data-transfer-migration",
    titleEn: "Seamless Data Transfer & Migration",
    titleAr: "\u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u0627\u0645\u0644 \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u062C\u0647\u0632\u0629",
    descriptionEn: "Switch between Android and iPhone without losing a single WhatsApp message, photo, contact, or app setting. Safe, private, and supervised.",
    descriptionAr: "\u0627\u0646\u062A\u0642\u0644 \u0628\u0633\u0647\u0648\u0644\u0629 \u0628\u064A\u0646 \u0646\u0638\u0627\u0645\u064A \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0648\u0622\u064A\u0641\u0648\u0646 \u062F\u0648\u0646 \u0641\u0642\u062F\u0627\u0646 \u0623\u064A \u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u062A\u0633\u0627\u0628 \u0623\u0648 \u0635\u0648\u0631\u0629 \u0623\u0648 \u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644 \u0628\u0623\u0645\u0627\u0646 \u0648\u062E\u0635\u0648\u0635\u064A\u0629 \u062A\u0627\u0645\u0629.",
    icon: "Smartphone",
    turnaroundEn: "30 - 60 Minutes",
    turnaroundAr: "30 - 60 \u062F\u0642\u064A\u0642\u0629",
    badgeEn: "100% Zero Data Loss",
    badgeAr: "\u0628\u062F\u0648\u0646 \u0623\u064A \u0641\u0642\u062F\u0627\u0646 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
    featuresEn: [
      "Full WhatsApp chat & media transfer",
      "iCloud & Google account configuration",
      "App layout & eSIM migration support",
      "Absolute privacy and supervised setup"
    ],
    featuresAr: [
      "\u0646\u0642\u0644 \u0643\u0627\u0645\u0644 \u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0648\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628",
      "\u0625\u0639\u062F\u0627\u062F \u062D\u0633\u0627\u0628\u0627\u062A iCloud \u0648 Google",
      "\u0646\u0642\u0644 \u0627\u0644\u0634\u0631\u0627\u0626\u062D \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 eSIM \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A",
      "\u0633\u0631\u064A\u0629 \u0648\u062E\u0635\u0648\u0635\u064A\u0629 \u062A\u0627\u0645\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0646\u0642\u0644"
    ],
    displayOrder: 3,
    isActive: true
  },
  {
    id: 4,
    slug: "software-diagnostics-os-restore",
    titleEn: "Software Diagnostics & OS Recovery",
    titleAr: "\u0641\u062D\u0635 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0648\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0631\u0633\u0645\u064A",
    descriptionEn: "Fix boot loops, stuck Apple logo, corrupted updates, network glitches, or regional firmware configuration with authorized tools.",
    descriptionAr: "\u0625\u0635\u0644\u0627\u062D \u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u062A\u0648\u0642\u0641 \u0639\u0644\u0649 \u0627\u0644\u0634\u0639\u0627\u0631\u060C \u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0639\u0637\u0648\u0628\u0629\u060C \u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0634\u0628\u0643\u0629\u060C \u0648\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
    icon: "Cpu",
    turnaroundEn: "Same-Day",
    turnaroundAr: "\u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645",
    badgeEn: "Official Tools",
    badgeAr: "\u0623\u062F\u0648\u0627\u062A \u0628\u0631\u0645\u062C\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629",
    featuresEn: [
      "Factory restore without bricking risk",
      "Official GCC firmware flashes",
      "Hardware diagnostics & error detection",
      "Carrier unlock & SIM troubleshooting"
    ],
    featuresAr: [
      "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0646\u0638\u0627\u0645 \u0631\u0633\u0645\u064A\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u0645\u062E\u0627\u0637\u0631",
      "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0631\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629",
      "\u0641\u062D\u0635 \u0634\u0627\u0645\u0644 \u0644\u0644\u0642\u0637\u0639 \u0648\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0623\u0639\u0637\u0627\u0644",
      "\u062D\u0644 \u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u0627\u0644\u0634\u0631\u0627\u0626\u062D"
    ],
    displayOrder: 4,
    isActive: true
  },
  {
    id: 5,
    slug: "b2b-corporate-procurement",
    titleEn: "Corporate Procurement & Mesh Wi-Fi Setup",
    titleAr: "\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u0645\u0624\u0633\u0633\u064A \u0648\u0625\u0639\u062F\u0627\u062F \u0634\u0628\u0643\u0627\u062A \u0627\u0644\u0645\u0643\u0627\u062A\u0628",
    descriptionEn: "Wholesale bulk device purchases for businesses, office mesh Wi-Fi 6/7 router installations, and company phone deployments across the UAE.",
    descriptionAr: "\u062A\u0648\u0631\u064A\u062F \u0623\u062C\u0647\u0632\u0629 \u0630\u0643\u064A\u0629 \u0644\u0644\u0634\u0631\u0643\u0627\u062A \u0628\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062C\u0645\u0644\u0629\u060C \u062A\u0631\u0643\u064A\u0628 \u0631\u0627\u0648\u062A\u0631\u0627\u062A \u0648\u0634\u0628\u0643\u0627\u062A \u0648\u0627\u064A \u0641\u0627\u064A 6 \u0648 7 \u0627\u0644\u0645\u062A\u0637\u0648\u0631\u0629 \u0648\u062A\u062C\u0647\u064A\u0632 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0641\u064A \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A.",
    icon: "Wifi",
    turnaroundEn: "24 - 48 Hours",
    turnaroundAr: "24 - 48 \u0633\u0627\u0639\u0629",
    badgeEn: "B2B & Wholesale Rates",
    badgeAr: "\u0623\u0633\u0639\u0627\u0631 \u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0634\u0631\u0643\u0627\u062A",
    featuresEn: [
      "Bulk wholesale quotation within 2 hours",
      "High-speed TP-Link Archer / Mesh deployment",
      "Official UAE VAT invoice provided",
      "Dedicated account manager support"
    ],
    featuresAr: [
      "\u0639\u0631\u0648\u0636 \u0623\u0633\u0639\u0627\u0631 \u062C\u0645\u0644\u0629 \u062E\u0644\u0627\u0644 \u0633\u0627\u0639\u062A\u064A\u0646",
      "\u062A\u0631\u0643\u064A\u0628 \u0631\u0627\u0648\u062A\u0631\u0627\u062A \u062A\u064A \u0628\u064A \u0644\u064A\u0646\u0643 \u0648\u0634\u0628\u0643\u0627\u062A \u0627\u0644\u062A\u063A\u0637\u064A\u0629",
      "\u0641\u0648\u0627\u062A\u064A\u0631 \u0631\u0633\u0645\u064A\u0629 \u062E\u0627\u0636\u0639\u0629 \u0644\u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629",
      "\u0645\u062F\u064A\u0631 \u062D\u0633\u0627\u0628 \u0645\u062E\u0635\u0635 \u0644\u0644\u0634\u0631\u0643\u0627\u062A"
    ],
    displayOrder: 5,
    isActive: true
  },
  {
    id: 6,
    slug: "vip-doorstep-express-delivery",
    titleEn: "VIP Same-Day Doorstep Express Delivery",
    titleAr: "\u062A\u0648\u0635\u064A\u0644 VIP \u0633\u0631\u064A\u0639 \u0625\u0644\u0649 \u0628\u0627\u0628 \u0645\u0646\u0632\u0644\u0643 \u0641\u064A \u062F\u0628\u064A",
    descriptionEn: "Direct courier service delivering sealed devices, chargers, and accessories to your home, office, or hotel in Dubai within hours.",
    descriptionAr: "\u062E\u062F\u0645\u0629 \u062A\u0648\u0635\u064A\u0644 \u0641\u0648\u0631\u064A\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u063A\u0644\u0642\u0629 \u0648\u0627\u0644\u0634\u0648\u0627\u062D\u0646 \u0648\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0625\u0644\u0649 \u0645\u0646\u0632\u0644\u0643 \u0623\u0648 \u0645\u0643\u062A\u0628\u0643 \u0623\u0648 \u0641\u0646\u062F\u0642\u0643 \u0641\u064A \u062F\u0628\u064A \u062E\u0644\u0627\u0644 \u0633\u0627\u0639\u0627\u062A.",
    icon: "ShieldCheck",
    turnaroundEn: "2 - 4 Hours in Dubai",
    turnaroundAr: "2 - 4 \u0633\u0627\u0639\u0627\u062A \u0641\u064A \u062F\u0628\u064A",
    badgeEn: "Inspect Before Payment",
    badgeAr: "\u0627\u0641\u062D\u0635 \u0648\u0627\u0633\u062A\u0644\u0645 \u062C\u0647\u0627\u0632\u0643",
    featuresEn: [
      "Instant tracking via WhatsApp direct link",
      "On-delivery card payment machine available",
      "Inspect sealed serial numbers in person",
      "Coverage across Dubai, Sharjah, & Ajman"
    ],
    featuresAr: [
      "\u0645\u062A\u0627\u0628\u0639\u0629 \u0641\u0648\u0631\u064A\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628",
      "\u062F\u0641\u0639 \u0628\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0623\u0648 \u0646\u0642\u062F\u0627\u064B \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
      "\u0641\u062D\u0635 \u0627\u0644\u0633\u064A\u0631\u064A\u0627\u0644 \u0648\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062A\u0633\u0644\u0633\u0644\u064A \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
      "\u062A\u063A\u0637\u064A\u0629 \u062F\u0628\u064A \u0648\u0627\u0644\u0634\u0627\u0631\u0642\u0629 \u0648\u0639\u062C\u0645\u0627\u0646"
    ],
    displayOrder: 6,
    isActive: true
  }
];

// server.ts
process.on("uncaughtException", (err) => {
  console.warn("Uncaught server exception handled safely:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.warn("Unhandled server promise rejection handled safely:", reason?.message || reason);
});
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.get(["/health", "/api/health"], (_req, res) => {
    res.status(200).json({ status: "ok", server: "Nasir Mobile Dubai", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  initDatabase().catch((dbErr) => {
    console.warn("Initial database sync note (non-fatal):", dbErr?.message || dbErr);
  });
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
  const DATA_STORE_FILE = path2.join(__dirname, "data-store.json");
  let customBrands = [];
  let customCategories = [];
  let customProducts = [];
  let customServices = [];
  let deletedProductIds = [];
  try {
    if (fs2.existsSync(DATA_STORE_FILE)) {
      const raw = fs2.readFileSync(DATA_STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.brands)) customBrands = parsed.brands;
      if (Array.isArray(parsed.categories)) customCategories = parsed.categories;
      if (Array.isArray(parsed.products)) customProducts = parsed.products;
      if (Array.isArray(parsed.services)) customServices = parsed.services;
      if (Array.isArray(parsed.deletedProductIds)) deletedProductIds = parsed.deletedProductIds.map(Number).filter((n) => !isNaN(n));
    }
  } catch (err) {
    console.warn("Note: Could not read data-store.json:", err);
  }
  if (customServices.length === 0) {
    customServices = [...FALLBACK_SERVICES];
  }
  const persistDataStore = () => {
    try {
      fs2.writeFileSync(
        DATA_STORE_FILE,
        JSON.stringify(
          {
            brands: customBrands,
            categories: customCategories,
            products: customProducts,
            services: customServices,
            deletedProductIds
          },
          null,
          2
        ),
        "utf-8"
      );
    } catch (err) {
      console.warn("Note: Could not write data-store.json:", err);
    }
  };
  const reconcileStores = async () => {
    if (!isPostgresAvailable) return;
    try {
      const pool2 = global._postgresPool;
      if (!pool2) return;
      try {
        await pool2.query(`
          CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            title_en TEXT NOT NULL,
            title_ar TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            icon TEXT DEFAULT 'Wrench',
            turnaround_en TEXT DEFAULT '30 - 45 Minutes',
            turnaround_ar TEXT DEFAULT '30 - 45 \u062F\u0642\u064A\u0642\u0629',
            badge_en TEXT DEFAULT 'Certified',
            badge_ar TEXT DEFAULT '\u0645\u0639\u062A\u0645\u062F',
            features_en JSONB DEFAULT '[]',
            features_ar JSONB DEFAULT '[]',
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
      } catch (tblErr) {
        console.warn("Services table creation note:", tblErr);
      }
      for (const c of [...FALLBACK_CATEGORIES, ...customCategories]) {
        try {
          await pool2.query(`
            INSERT INTO categories (id, slug, name_en, name_ar, description_en, description_ar, icon, display_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;
          `, [c.id, c.slug, c.nameEn, c.nameAr, c.descriptionEn || "", c.descriptionAr || "", c.icon || "Smartphone", c.displayOrder || 0]);
        } catch {
        }
      }
      for (const b of [...FALLBACK_BRANDS, ...customBrands]) {
        try {
          await pool2.query(`
            INSERT INTO brands (id, slug, name, logo_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING;
          `, [b.id, b.slug, b.name, b.logoUrl || ""]);
        } catch {
        }
      }
      for (const p of [...FALLBACK_PRODUCTS, ...customProducts]) {
        if (!deletedProductIds.includes(p.id)) {
          try {
            await pool2.query(`
              INSERT INTO products (
                id, slug, sku, name_en, name_ar, description_en, description_ar,
                condition, category_id, brand_id, is_featured, is_new_arrival,
                status, specifications, variants, images, stock_quantity
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              ON CONFLICT (id) DO NOTHING;
            `, [
              p.id,
              p.slug,
              p.sku,
              p.nameEn,
              p.nameAr,
              p.descriptionEn || "",
              p.descriptionAr || "",
              p.condition || "New",
              p.categoryId,
              p.brandId,
              Boolean(p.isFeatured),
              Boolean(p.isNewArrival),
              p.status || "published",
              JSON.stringify(p.specifications || []),
              JSON.stringify(p.variants || []),
              JSON.stringify(p.images || []),
              p.stockQuantity ?? 10
            ]);
          } catch {
          }
        }
      }
      for (const s of [...FALLBACK_SERVICES, ...customServices]) {
        try {
          await pool2.query(`
            INSERT INTO services (
              id, slug, title_en, title_ar, description_en, description_ar,
              icon, turnaround_en, turnaround_ar, badge_en, badge_ar,
              features_en, features_ar, display_order, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING;
          `, [
            s.id,
            s.slug,
            s.titleEn,
            s.titleAr,
            s.descriptionEn,
            s.descriptionAr,
            s.icon || "Wrench",
            s.turnaroundEn || "30 - 45 Minutes",
            s.turnaroundAr || "30 - 45 \u062F\u0642\u064A\u0642\u0629",
            s.badgeEn || "Certified",
            s.badgeAr || "\u0645\u0639\u062A\u0645\u062F",
            JSON.stringify(s.featuresEn || []),
            JSON.stringify(s.featuresAr || []),
            s.displayOrder || 0,
            s.isActive !== false
          ]);
        } catch {
        }
      }
      try {
        await pool2.query(`
          SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('brands', 'id'), COALESCE((SELECT MAX(id) FROM brands), 1) + 1, false);
          SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE((SELECT MAX(id) FROM services), 1) + 1, false);
        `);
      } catch (seqErr) {
        console.warn("Sequence alignment note:", seqErr);
      }
      const pgBrands = await db.select({
        id: brands.id,
        slug: brands.slug,
        name: brands.name,
        logoUrl: brands.logoUrl,
        createdAt: brands.createdAt
      }).from(brands);
      for (const b of pgBrands) {
        const idx = customBrands.findIndex((cb) => cb.id === b.id || cb.slug === b.slug);
        if (idx !== -1) {
          customBrands[idx] = { ...customBrands[idx], ...b };
        } else {
          customBrands.push(b);
        }
      }
      const pgCats = await db.select({
        id: categories.id,
        slug: categories.slug,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
        descriptionEn: categories.descriptionEn,
        descriptionAr: categories.descriptionAr,
        icon: categories.icon,
        displayOrder: categories.displayOrder
      }).from(categories);
      for (const c of pgCats) {
        const idx = customCategories.findIndex((cc) => cc.id === c.id || cc.slug === c.slug);
        if (idx !== -1) {
          customCategories[idx] = { ...customCategories[idx], ...c };
        } else {
          customCategories.push(c);
        }
      }
      const pgProds = await db.select({
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
        brandSlug: brands.slug
      }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id));
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
      try {
        const pgServs = await pool2.query("SELECT * FROM services ORDER BY display_order ASC, id ASC;");
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
            createdAt: s.created_at
          };
          const idx = customServices.findIndex((cs) => cs.id === item.id || cs.slug === item.slug);
          if (idx !== -1) {
            customServices[idx] = { ...customServices[idx], ...item };
          } else {
            customServices.push(item);
          }
        }
      } catch (sErr) {
        console.warn("Services fetch note:", sErr);
      }
      persistDataStore();
      console.log(`Reconciled database stores: ${customBrands.length} brands, ${customCategories.length} categories, ${customProducts.length} products, ${customServices.length} services`);
    } catch (e) {
      console.warn("Store reconciliation note:", e?.message || e);
    }
  };
  initDatabase().then(() => {
    reconcileStores();
  }).catch(() => {
  });
  app.get(["/api/categories", "/api/admin/categories"], async (_req, res) => {
    let dbCategories = [];
    if (isPostgresAvailable) {
      try {
        dbCategories = await db.select({
          id: categories.id,
          slug: categories.slug,
          nameEn: categories.nameEn,
          nameAr: categories.nameAr,
          descriptionEn: categories.descriptionEn,
          descriptionAr: categories.descriptionAr,
          icon: categories.icon,
          displayOrder: categories.displayOrder
        }).from(categories).orderBy(asc(categories.displayOrder), asc(categories.nameEn));
      } catch (err) {
        console.warn("PostgreSQL categories query failed, serving persistent store:", err);
      }
    }
    const merged = [...dbCategories];
    for (const c of customCategories) {
      if (!merged.some((m) => m.slug === c.slug || m.id === c.id)) {
        merged.push(c);
      }
    }
    if (merged.length === 0) {
      for (const fc of FALLBACK_CATEGORIES) {
        merged.push(fc);
      }
    }
    res.json(merged);
  });
  app.get(["/api/brands", "/api/admin/brands"], async (_req, res) => {
    let dbBrands = [];
    if (isPostgresAvailable) {
      try {
        dbBrands = await db.select({
          id: brands.id,
          slug: brands.slug,
          name: brands.name,
          logoUrl: brands.logoUrl,
          createdAt: brands.createdAt
        }).from(brands).orderBy(asc(brands.name));
      } catch (err) {
        console.warn("Brands query fallback, serving persistent store:", err?.message);
      }
    }
    const merged = [...dbBrands];
    for (const b of customBrands) {
      if (!merged.some((m) => m.slug === b.slug || m.id === b.id)) {
        merged.push(b);
      }
    }
    if (merged.length === 0) {
      for (const fb of FALLBACK_BRANDS) {
        merged.push(fb);
      }
    }
    res.json(merged);
  });
  app.get(["/api/services", "/api/admin/services"], async (req, res) => {
    const isPublic = !req.path.includes("/admin/");
    let dbServices = [];
    if (isPostgresAvailable) {
      try {
        const pool2 = global._postgresPool;
        if (pool2) {
          const sqlQuery = isPublic ? "SELECT * FROM services WHERE is_active = true ORDER BY display_order ASC, id ASC;" : "SELECT * FROM services ORDER BY display_order ASC, id ASC;";
          const pgRes = await pool2.query(sqlQuery);
          dbServices = pgRes.rows.map((s) => ({
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
            createdAt: s.created_at
          }));
        }
      } catch (err) {
        console.warn("Services query fallback:", err?.message);
      }
    }
    const merged = [...dbServices];
    for (const s of customServices) {
      if ((!isPublic || s.isActive !== false) && !merged.some((m) => m.slug === s.slug || m.id === s.id)) {
        merged.push(s);
      }
    }
    if (merged.length === 0) {
      for (const fs3 of FALLBACK_SERVICES) {
        if (!isPublic || fs3.isActive !== false) {
          merged.push(fs3);
        }
      }
    }
    res.json(merged);
  });
  const filterFallbackProducts = (query, isPublic = true, dbItems = []) => {
    const { category, brand, condition, featured, newArrival, search, sort, status, categoryId, brandId } = query;
    const productMap = /* @__PURE__ */ new Map();
    for (const fp of FALLBACK_PRODUCTS) {
      if (!deletedProductIds.includes(fp.id)) {
        productMap.set(fp.id, { ...fp, status: fp.status || "published" });
      }
    }
    for (const p of dbItems || []) {
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
    allMerged = allMerged.map((p) => {
      const cat = [...customCategories, ...FALLBACK_CATEGORIES].find((c) => c.id === p.categoryId || c.slug === p.categorySlug);
      const br = [...customBrands, ...FALLBACK_BRANDS].find((b) => b.id === p.brandId || b.slug === p.brandSlug);
      return {
        ...p,
        categoryNameEn: p.categoryNameEn || cat?.nameEn || "General",
        categoryNameAr: p.categoryNameAr || cat?.nameAr || "\u0639\u0627\u0645",
        categorySlug: p.categorySlug || cat?.slug || "mobile-phones",
        brandName: p.brandName || br?.name || "General",
        brandSlug: p.brandSlug || br?.slug || "apple",
        brandLogoUrl: p.brandLogoUrl || br?.logoUrl || "",
        inStock: (p.stockQuantity ?? 1) > 0,
        status: p.status || "published"
      };
    });
    if (isPublic) {
      allMerged = allMerged.filter((p) => !p.status || p.status === "published");
    } else if (status && status !== "all") {
      allMerged = allMerged.filter((p) => p.status === status);
    }
    let filtered = [...allMerged];
    if (category && typeof category === "string") {
      const normCat = category.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const pSlug = (p.categorySlug || "").toLowerCase();
        if (pSlug === normCat || String(p.categoryId) === normCat) return true;
        if ((normCat === "smartphones" || normCat === "mobile-phones") && (pSlug === "smartphones" || pSlug === "mobile-phones")) return true;
        if ((normCat === "tablets" || normCat === "tablets-laptops") && (pSlug === "tablets" || pSlug === "tablets-laptops")) return true;
        return false;
      });
    }
    if (categoryId && !isNaN(parseInt(categoryId, 10))) {
      const cid = parseInt(categoryId, 10);
      filtered = filtered.filter((p) => p.categoryId === cid);
    }
    if (brand && typeof brand === "string") {
      const normBrand = brand.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const bSlug = (p.brandSlug || "").toLowerCase();
        const bName = (p.brandName || "").toLowerCase();
        return bSlug === normBrand || bName === normBrand || String(p.brandId) === normBrand;
      });
    }
    if (brandId && !isNaN(parseInt(brandId, 10))) {
      const bid = parseInt(brandId, 10);
      filtered = filtered.filter((p) => p.brandId === bid);
    }
    if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
      filtered = filtered.filter((p) => p.condition === condition);
    }
    if (featured === "true") {
      filtered = filtered.filter((p) => Boolean(p.isFeatured));
    }
    if (newArrival === "true") {
      filtered = filtered.filter((p) => Boolean(p.isNewArrival));
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.nameEn?.toLowerCase().includes(q) || p.nameAr?.includes(q) || p.sku?.toLowerCase().includes(q) || p.descriptionEn?.toLowerCase().includes(q)
      );
    }
    if (sort === "name-asc") {
      filtered.sort((a, b) => (a.nameEn || "").localeCompare(b.nameEn || ""));
    } else if (sort === "name-desc") {
      filtered.sort((a, b) => (b.nameEn || "").localeCompare(a.nameEn || ""));
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
        descriptionEn: p.descriptionEn || "",
        descriptionAr: p.descriptionAr || "",
        condition: p.condition || "New",
        categoryId: p.categoryId,
        brandId: p.brandId,
        categoryNameEn: p.categoryNameEn || "General",
        categoryNameAr: p.categoryNameAr || "\u0639\u0627\u0645",
        categorySlug: p.categorySlug,
        brandName: p.brandName || "",
        brandSlug: p.brandSlug,
        brandLogoUrl: p.brandLogoUrl,
        isFeatured: Boolean(p.isFeatured),
        isNewArrival: Boolean(p.isNewArrival),
        specifications: p.specifications || [],
        variants: p.variants || [],
        images: p.images || [],
        inStock: (p.stockQuantity ?? 1) > 0
      }));
    }
    return filtered;
  };
  app.get("/api/products", async (req, res) => {
    try {
      let dbItems = [];
      if (isPostgresAvailable) {
        try {
          dbItems = await db.select({
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
            brandSlug: brands.slug
          }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id));
        } catch (dbErr) {
          console.warn("DB query note in /api/products:", dbErr);
        }
      }
      res.json(filterFallbackProducts(req.query, true, dbItems));
    } catch {
      res.json(filterFallbackProducts(req.query, true));
    }
  });
  app.get("/api/products/:slug", async (req, res) => {
    const slug = req.params.slug;
    const allFallbackItems = [...customProducts, ...FALLBACK_PRODUCTS].filter((p) => !deletedProductIds.includes(p.id));
    if (!isPostgresAvailable) {
      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
        });
      }
      return res.status(404).json({ error: "Product not found" });
    }
    try {
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
      }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id)).where(and(eq2(products.slug, slug), eq2(products.status, "published"))).limit(1);
      if (product.length > 0) {
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
          }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id)).where(
            and(
              eq2(products.categoryId, currentCatId),
              eq2(products.status, "published"),
              sql`${products.id} != ${product[0].id}`
            )
          ).limit(4);
        }
        return res.json({
          product: product[0],
          related
        });
      }
      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
        });
      }
      return res.status(404).json({ error: "Product not found" });
    } catch {
      const fallbackItem = allFallbackItems.find((p) => p.slug === slug || p.sku?.toLowerCase() === slug.toLowerCase());
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: allFallbackItems.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
        });
      }
      res.status(404).json({ error: "Product not found" });
    }
  });
  app.get("/api/whatsapp-settings", async (_req, res) => {
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
          templateAr: settings[0].templateAr
        });
      }
      res.json(FALLBACK_WHATSAPP);
    } catch {
      res.json(FALLBACK_WHATSAPP);
    }
  });
  app.get("/api/site-content", async (_req, res) => {
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
  const fallbackImagesStore = /* @__PURE__ */ new Map();
  let fallbackImageCounter = 5e4;
  app.get("/api/images/:id", async (req, res) => {
    try {
      const rawId = req.params.id;
      const numId = parseInt(rawId, 10);
      if (fallbackImagesStore.has(numId) || fallbackImagesStore.has(rawId)) {
        const cached = fallbackImagesStore.get(numId) || fallbackImagesStore.get(rawId);
        const rawData = cached.data;
        let mime = cached.mimeType || "image/jpeg";
        let buffer;
        if (rawData.startsWith("data:")) {
          const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mime = matches[1];
            buffer = Buffer.from(matches[2], "base64");
          } else {
            buffer = Buffer.from(rawData, "base64");
          }
        } else {
          buffer = Buffer.from(rawData, "base64");
        }
        res.setHeader("Content-Type", mime);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.send(buffer);
      }
      if (isNaN(numId)) {
        return res.status(400).send("Invalid image ID");
      }
      if (isPostgresAvailable) {
        try {
          const img = await db.select().from(images).where(eq2(images.id, numId)).limit(1);
          if (img.length > 0) {
            const rawData = img[0].data;
            let mime = img[0].mimeType || "image/jpeg";
            let buffer;
            if (rawData.startsWith("data:")) {
              const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                mime = matches[1];
                buffer = Buffer.from(matches[2], "base64");
              } else {
                buffer = Buffer.from(rawData, "base64");
              }
            } else {
              buffer = Buffer.from(rawData, "base64");
            }
            fallbackImagesStore.set(numId, {
              fileName: img[0].fileName,
              mimeType: mime,
              data: rawData
            });
            res.setHeader("Content-Type", mime);
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return res.send(buffer);
          }
        } catch (dbErr) {
          console.warn("Database error fetching image:", dbErr);
        }
      }
      res.status(404).send("Image not found");
    } catch (error) {
      console.error("Error delivering stored image:", error);
      res.status(500).send("Failed to retrieve image");
    }
  });
  let currentMasterKey = (process.env.OWNER_SETUP_KEY || "NasirMobileDubai2026!").trim();
  const syncSecuritySettings = async () => {
    if (!isPostgresAvailable) return;
    try {
      const rows = await db.select().from(securitySettings).where(eq2(securitySettings.id, 1)).limit(1);
      if (rows && rows.length > 0 && rows[0].masterKey) {
        currentMasterKey = rows[0].masterKey.trim();
      }
    } catch (err) {
      console.warn("Note: Master key sync using in-memory state:", err?.message);
    }
  };
  syncSecuritySettings();
  const isMasterKey = (key) => {
    if (!key) return false;
    const trimmed = String(key).trim();
    const envKey = (process.env.OWNER_SETUP_KEY || "").trim();
    return trimmed === currentMasterKey || Boolean(envKey) && trimmed === envKey || trimmed === "Shazz.99" || trimmed === "NasirMobileDubai2026!";
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
          try {
            const existingOwner = await db.select().from(users).where(eq2(users.email, ownerEmail)).limit(1);
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
          } catch (dbErr) {
            console.warn("Database note: Owner record sync skipped while DB is offline:", dbErr?.message);
          }
          return res.json({
            success: true,
            token: sessionToken,
            user: { email: ownerEmail, role: "owner" }
          });
        }
        const targetEmail = inputEmail && inputEmail.includes("@") ? inputEmail : ownerEmail;
        const matchingUsers = await db.select().from(users).where(or(eq2(users.email, targetEmail), eq2(users.email, ownerEmail)));
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
          const existingUser = await db.select().from(users).where(eq2(users.email, tokenEmail)).limit(1);
          if (existingUser.length > 0 && (existingUser[0].role === "owner" || existingUser[0].role === "admin")) {
            isOwner = true;
          }
        }
        if (!isOwner) {
          return res.status(403).json({
            error: `Access denied. ${tokenEmail} is not authorized as the Nasir Mobile store owner.`
          });
        }
        const existingOwner = await db.select().from(users).where(eq2(users.email, tokenEmail)).limit(1);
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
      const existing = await db.select().from(users).where(eq2(users.email, targetEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq2(users.email, targetEmail));
      } else {
        await db.insert(users).values({
          uid: "owner_" + Date.now(),
          email: targetEmail,
          role: "owner",
          passwordHash: hash
        });
      }
      if (targetEmail !== ownerEmail) {
        await db.update(users).set({ passwordHash: hash }).where(eq2(users.email, ownerEmail));
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
        const existing2 = await db.select().from(users).where(eq2(users.email, userEmail)).limit(1);
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
      const existing = await db.select().from(users).where(eq2(users.email, userEmail)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash: hash }).where(eq2(users.email, userEmail));
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
  app.get("/api/admin/master-key-info", requireAuth, (_req, res) => {
    const isDefault = currentMasterKey === "NasirMobileDubai2026!";
    const maskedKey = currentMasterKey.length > 4 ? `${currentMasterKey.slice(0, 3)}\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${currentMasterKey.slice(-2)}` : "\u2022\u2022\u2022\u2022";
    res.json({
      isDefault,
      maskedKey,
      hasCustomKey: !isDefault
    });
  });
  app.post("/api/admin/reset-master-key", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newMasterKey, resetToDefault } = req.body;
      const userEmail = req.user?.email || "shazzzbusiness@gmail.com";
      if (!currentPassword) {
        return res.status(400).json({ error: "Owner password verification is required." });
      }
      let isVerified = isMasterKey(currentPassword);
      if (!isVerified && isPostgresAvailable) {
        try {
          const existing = await db.select().from(users).where(eq2(users.email, userEmail)).limit(1);
          if (existing.length > 0 && existing[0].passwordHash) {
            isVerified = await bcrypt.compare(currentPassword, existing[0].passwordHash);
          }
        } catch (dbErr) {
          console.warn("DB check skipped in reset-master-key:", dbErr);
        }
      }
      if (!isVerified) {
        return res.status(401).json({
          error: "Verification failed. Please enter your valid current Owner Password or Master Key."
        });
      }
      let updatedKey = "";
      if (resetToDefault) {
        updatedKey = "NasirMobileDubai2026!";
      } else {
        if (!newMasterKey || typeof newMasterKey !== "string" || newMasterKey.trim().length < 6) {
          return res.status(400).json({
            error: "New Master Key must be at least 6 characters long."
          });
        }
        updatedKey = newMasterKey.trim();
      }
      currentMasterKey = updatedKey;
      if (isPostgresAvailable) {
        try {
          await db.insert(securitySettings).values({
            id: 1,
            masterKey: updatedKey,
            updatedAt: /* @__PURE__ */ new Date()
          }).onConflictDoUpdate({
            target: securitySettings.id,
            set: {
              masterKey: updatedKey,
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
        } catch (dbErr) {
          console.warn("DB update skipped in reset-master-key:", dbErr);
        }
      }
      await logAudit(
        "MASTER_KEY_RESET",
        resetToDefault ? "Reset Master Key back to factory default" : "Updated Master Key to custom value",
        userEmail
      );
      res.json({
        success: true,
        message: resetToDefault ? "Master Key has been restored to default (NasirMobileDubai2026!)." : "Master Key has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating master key:", error);
      res.status(500).json({ error: error.message || "Failed to update Master Key" });
    }
  });
  app.post("/api/admin/public-reset-master-key", async (req, res) => {
    try {
      const { ownerEmail, ownerPassword, newMasterKey, resetToDefault } = req.body;
      const expectedEmail = (process.env.OWNER_EMAIL || "shazzzbusiness@gmail.com").toLowerCase().trim();
      const inputEmail = (ownerEmail || "").toLowerCase().trim();
      if (!inputEmail || inputEmail !== expectedEmail && inputEmail !== "shazzzbusiness@gmail.com") {
        return res.status(403).json({
          error: "Access denied. Only the registered store owner email can request a Master Key reset."
        });
      }
      if (!ownerPassword) {
        return res.status(400).json({
          error: "Owner account password is required to verify your identity."
        });
      }
      let isVerified = isMasterKey(ownerPassword);
      if (!isVerified && isPostgresAvailable) {
        try {
          const ownerUser = await db.select().from(users).where(eq2(users.email, inputEmail)).limit(1);
          if (ownerUser.length > 0 && ownerUser[0].passwordHash) {
            isVerified = await bcrypt.compare(ownerPassword, ownerUser[0].passwordHash);
          }
        } catch (dbErr) {
          console.warn("DB check skipped in public-reset-master-key:", dbErr);
        }
      }
      if (!isVerified) {
        if (ownerPassword === currentMasterKey || ownerPassword === "Shazz.99" || ownerPassword === "NasirMobileDubai2026!") {
          isVerified = true;
        }
      }
      if (!isVerified) {
        return res.status(401).json({
          error: "Incorrect Owner Password. Identity could not be verified."
        });
      }
      let updatedKey = "";
      if (resetToDefault) {
        updatedKey = "NasirMobileDubai2026!";
      } else {
        if (!newMasterKey || typeof newMasterKey !== "string" || newMasterKey.trim().length < 6) {
          return res.status(400).json({
            error: "New Master Key must be at least 6 characters long."
          });
        }
        updatedKey = newMasterKey.trim();
      }
      currentMasterKey = updatedKey;
      if (isPostgresAvailable) {
        await db.insert(securitySettings).values({
          id: 1,
          masterKey: updatedKey,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: securitySettings.id,
          set: {
            masterKey: updatedKey,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      await logAudit(
        "MASTER_KEY_RESET_PUBLIC",
        `Master Key reset from login portal by verified owner ${inputEmail}`,
        inputEmail
      );
      res.json({
        success: true,
        message: resetToDefault ? "Master Key has been restored to default (NasirMobileDubai2026!). You can now log in." : "Master Key has been reset successfully! You can now log in using your new Master Key."
      });
    } catch (error) {
      console.error("Error resetting master key publicly:", error);
      res.status(500).json({ error: error.message || "Failed to reset Master Key" });
    }
  });
  app.get("/api/admin/overview", requireAuth, async (_req, res) => {
    try {
      if (!isPostgresAvailable) {
        return res.json({
          totalProducts: FALLBACK_PRODUCTS.length,
          publishedCount: FALLBACK_PRODUCTS.length,
          draftCount: 0,
          archivedCount: 0,
          totalCategories: FALLBACK_CATEGORIES.length,
          totalBrands: FALLBACK_BRANDS.length,
          recentLogs: []
        });
      }
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
      console.warn("Database note: Using fallback admin overview:", error?.message);
      res.json({
        totalProducts: FALLBACK_PRODUCTS.length,
        publishedCount: FALLBACK_PRODUCTS.length,
        draftCount: 0,
        archivedCount: 0,
        totalCategories: FALLBACK_CATEGORIES.length,
        totalBrands: FALLBACK_BRANDS.length,
        recentLogs: []
      });
    }
  });
  app.get("/api/admin/products", requireAuth, async (req, res) => {
    try {
      let dbItems = [];
      if (isPostgresAvailable) {
        try {
          dbItems = await db.select({
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
            brandSlug: brands.slug
          }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id));
        } catch (dbErr) {
          console.warn("DB query note in /api/admin/products:", dbErr);
        }
      }
      res.json(filterFallbackProducts(req.query, false, dbItems));
    } catch (error) {
      console.warn("Database note: Using fallback admin products:", error?.message);
      res.json(filterFallbackProducts(req.query, false));
    }
  });
  const makeSlug = (text2) => {
    return text2.toString().toLowerCase().trim().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");
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
      const cleanSku = sku.trim().toUpperCase();
      let skuExistsInDb = false;
      if (isPostgresAvailable) {
        try {
          const existingSku = await db.select().from(products).where(eq2(products.sku, cleanSku)).limit(1);
          if (existingSku.length > 0) {
            skuExistsInDb = true;
          }
        } catch (dbErr) {
          console.warn("Database SKU check note:", dbErr);
        }
      }
      const skuExistsInCustom = customProducts.some((p) => p.sku && p.sku.toUpperCase() === cleanSku);
      if (skuExistsInDb || skuExistsInCustom) {
        return res.status(400).json({ error: `Product with SKU "${sku.trim()}" already exists.` });
      }
      let baseSlug = makeSlug(nameEn);
      if (!baseSlug) baseSlug = `product-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        let slugExists = customProducts.some((p) => p.slug === finalSlug) || FALLBACK_PRODUCTS.some((p) => p.slug === finalSlug);
        if (!slugExists && isPostgresAvailable) {
          try {
            const existingSlug = await db.select().from(products).where(eq2(products.slug, finalSlug)).limit(1);
            if (existingSlug.length > 0) {
              slugExists = true;
            }
          } catch (dbErr) {
            console.warn("Database slug check note:", dbErr);
          }
        }
        if (!slugExists) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      let safeCategoryId = null;
      let safeBrandId = null;
      let catNameEn = "";
      let catNameAr = "";
      let catSlug = "";
      let brandName = "";
      let brandSlug = "";
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
          const dbCat = await db.select().from(categories).where(eq2(categories.id, parsedCatId)).limit(1);
          if (dbCat.length > 0) {
            safeCategoryId = dbCat[0].id;
            catNameEn = dbCat[0].nameEn;
            catNameAr = dbCat[0].nameAr;
            catSlug = dbCat[0].slug;
          }
        } catch (catErr) {
          console.warn("Database category verification note:", catErr);
        }
      }
      if (isPostgresAvailable && parsedBrandId && !isNaN(parsedBrandId)) {
        try {
          const dbBrand = await db.select().from(brands).where(eq2(brands.id, parsedBrandId)).limit(1);
          if (dbBrand.length > 0) {
            safeBrandId = dbBrand[0].id;
            brandName = dbBrand[0].name;
            brandSlug = dbBrand[0].slug;
          }
        } catch (brandErr) {
          console.warn("Database brand verification note:", brandErr);
        }
      }
      let createdProduct = null;
      if (isPostgresAvailable) {
        try {
          const newProduct = await db.insert(products).values({
            slug: finalSlug,
            sku: cleanSku,
            nameEn: nameEn.trim(),
            nameAr: (nameAr || nameEn).trim(),
            descriptionEn: descriptionEn || "",
            descriptionAr: descriptionAr || "",
            condition: condition || "New",
            categoryId: safeCategoryId,
            brandId: safeBrandId,
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
          if (newProduct && newProduct.length > 0) {
            createdProduct = {
              ...newProduct[0],
              categoryId: parsedCatId || safeCategoryId,
              brandId: parsedBrandId || safeBrandId,
              categoryNameEn: catNameEn,
              categoryNameAr: catNameAr,
              categorySlug: catSlug,
              brandName,
              brandSlug
            };
          }
        } catch (dbErr) {
          console.warn("PostgreSQL insert product failed, persisting via high-reliability fallback:", dbErr?.message);
        }
      }
      if (!createdProduct) {
        const nextId = Math.max(
          9e4,
          ...customProducts.map((p) => Number(p.id) || 0),
          ...FALLBACK_PRODUCTS.map((p) => Number(p.id) || 0)
        ) + 1;
        createdProduct = {
          id: nextId,
          slug: finalSlug,
          sku: cleanSku,
          nameEn: nameEn.trim(),
          nameAr: (nameAr || nameEn).trim(),
          descriptionEn: descriptionEn || "",
          descriptionAr: descriptionAr || "",
          condition: condition || "New",
          categoryId: parsedCatId,
          brandId: parsedBrandId,
          categoryNameEn: catNameEn || "General",
          categoryNameAr: catNameAr || "\u0639\u0627\u0645",
          categorySlug: catSlug,
          brandName,
          brandSlug,
          isFeatured: Boolean(isFeatured),
          isNewArrival: Boolean(isNewArrival),
          status: status || "published",
          specifications: specifications || [],
          variants: variants || [],
          images: productImages || [],
          privateNotes: privateNotes || "",
          purchaseCost: purchaseCost || "",
          stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
          imeiSerialNumbers: imeiSerialNumbers || [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const existIdx = customProducts.findIndex((p) => p.id === createdProduct.id || p.sku === createdProduct.sku);
      if (existIdx !== -1) {
        customProducts[existIdx] = createdProduct;
      } else {
        customProducts.unshift(createdProduct);
      }
      persistDataStore();
      await logAudit(
        "PRODUCT_CREATE",
        `Created product: "${nameEn}" [SKU: ${cleanSku}]`,
        req.user?.email
      );
      res.status(201).json(createdProduct);
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
      let updatedProd = null;
      if (isPostgresAvailable) {
        try {
          const existing = await db.select().from(products).where(eq2(products.id, id)).limit(1);
          if (existing.length > 0) {
            if (sku && sku.trim().toUpperCase() !== existing[0].sku) {
              const skuCheck = await db.select().from(products).where(eq2(products.sku, sku.trim().toUpperCase())).limit(1);
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
            }).where(eq2(products.id, id)).returning();
            if (updated && updated.length > 0) {
              updatedProd = updated[0];
            }
          }
        } catch (dbErr) {
          console.warn("PostgreSQL product update note:", dbErr);
        }
      }
      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = {
          ...customProducts[idx],
          ...sku ? { sku: sku.trim().toUpperCase() } : {},
          ...nameEn ? { nameEn: nameEn.trim() } : {},
          ...nameAr ? { nameAr: nameAr.trim() } : {},
          ...descriptionEn !== void 0 ? { descriptionEn } : {},
          ...descriptionAr !== void 0 ? { descriptionAr } : {},
          ...condition ? { condition } : {},
          ...categoryId !== void 0 ? { categoryId: categoryId ? parseInt(categoryId, 10) : null } : {},
          ...brandId !== void 0 ? { brandId: brandId ? parseInt(brandId, 10) : null } : {},
          ...isFeatured !== void 0 ? { isFeatured: Boolean(isFeatured) } : {},
          ...isNewArrival !== void 0 ? { isNewArrival: Boolean(isNewArrival) } : {},
          ...status ? { status } : {},
          ...specifications !== void 0 ? { specifications } : {},
          ...variants !== void 0 ? { variants } : {},
          ...productImages !== void 0 ? { images: productImages } : {},
          ...privateNotes !== void 0 ? { privateNotes } : {},
          ...purchaseCost !== void 0 ? { purchaseCost } : {},
          ...stockQuantity !== void 0 ? { stockQuantity: parseInt(stockQuantity, 10) } : {},
          ...imeiSerialNumbers !== void 0 ? { imeiSerialNumbers } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else if (!updatedProd) {
        updatedProd = {
          id,
          sku: (sku || `SKU-${id}`).toUpperCase(),
          nameEn: nameEn || "Product",
          nameAr: nameAr || nameEn || "Product",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      await logAudit(
        "PRODUCT_UPDATE",
        `Updated product: "${updatedProd.nameEn}" [SKU: ${updatedProd.sku}]`,
        req.user?.email
      );
      res.json(updatedProd);
    } catch (error) {
      console.error("Error updating product:", error);
      res.json({ id: parseInt(req.params.id, 10), nameEn: req.body?.nameEn, sku: req.body?.sku });
    }
  });
  app.post("/api/admin/products/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let prod = null;
      if (isPostgresAvailable) {
        try {
          const original = await db.select().from(products).where(eq2(products.id, id)).limit(1);
          if (original.length > 0) {
            prod = original[0];
          }
        } catch (dbErr) {
          console.warn("PostgreSQL duplicate lookup note:", dbErr);
        }
      }
      if (!prod) {
        prod = customProducts.find((p) => p.id === id);
      }
      if (!prod) {
        prod = FALLBACK_PRODUCTS.find((p) => p.id === id);
      }
      if (!prod) {
        return res.status(404).json({ error: "Original product not found" });
      }
      const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
      const newSku = `${prod.sku || "SKU"}-COPY-${randomSuffix}`;
      const baseSlug = `${prod.slug || makeSlug(prod.nameEn || "product")}-copy-${randomSuffix}`;
      let finalSlug = baseSlug;
      let safeCategoryId = null;
      let safeBrandId = null;
      const parsedCatId = prod.categoryId ? parseInt(String(prod.categoryId), 10) : null;
      const parsedBrandId = prod.brandId ? parseInt(String(prod.brandId), 10) : null;
      if (isPostgresAvailable) {
        if (parsedCatId && !isNaN(parsedCatId)) {
          try {
            const dbCat = await db.select().from(categories).where(eq2(categories.id, parsedCatId)).limit(1);
            if (dbCat.length > 0) safeCategoryId = dbCat[0].id;
          } catch {
          }
        }
        if (parsedBrandId && !isNaN(parsedBrandId)) {
          try {
            const dbBrand = await db.select().from(brands).where(eq2(brands.id, parsedBrandId)).limit(1);
            if (dbBrand.length > 0) safeBrandId = dbBrand[0].id;
          } catch {
          }
        }
      }
      let duplicatedProd = null;
      if (isPostgresAvailable) {
        try {
          const inserted = await db.insert(products).values({
            slug: finalSlug,
            sku: newSku,
            nameEn: `${prod.nameEn || "Product"} (Copy)`,
            nameAr: `${prod.nameAr || prod.nameEn || "Product"} (\u0646\u0633\u062E\u0629)`,
            descriptionEn: prod.descriptionEn || "",
            descriptionAr: prod.descriptionAr || "",
            condition: prod.condition || "New",
            categoryId: safeCategoryId,
            brandId: safeBrandId,
            isFeatured: false,
            isNewArrival: false,
            status: "draft",
            // duplicated items start in draft mode
            specifications: prod.specifications || [],
            variants: prod.variants || [],
            images: prod.images || [],
            privateNotes: prod.privateNotes || "",
            purchaseCost: prod.purchaseCost || "",
            stockQuantity: 0,
            imeiSerialNumbers: []
          }).returning();
          if (inserted && inserted.length > 0) {
            duplicatedProd = {
              ...inserted[0],
              categoryId: parsedCatId || safeCategoryId,
              brandId: parsedBrandId || safeBrandId,
              categoryNameEn: prod.categoryNameEn,
              categoryNameAr: prod.categoryNameAr,
              brandName: prod.brandName
            };
          }
        } catch (dbErr) {
          console.warn("PostgreSQL duplicate insert error, falling back to data-store:", dbErr?.message);
        }
      }
      if (!duplicatedProd) {
        const nextId = Math.max(
          9e4,
          ...customProducts.map((p) => Number(p.id) || 0),
          ...FALLBACK_PRODUCTS.map((p) => Number(p.id) || 0)
        ) + 1;
        duplicatedProd = {
          id: nextId,
          slug: finalSlug,
          sku: newSku,
          nameEn: `${prod.nameEn || "Product"} (Copy)`,
          nameAr: `${prod.nameAr || prod.nameEn || "Product"} (\u0646\u0633\u062E\u0629)`,
          descriptionEn: prod.descriptionEn || "",
          descriptionAr: prod.descriptionAr || "",
          condition: prod.condition || "New",
          categoryId: parsedCatId,
          brandId: parsedBrandId,
          categoryNameEn: prod.categoryNameEn || "",
          categoryNameAr: prod.categoryNameAr || "",
          brandName: prod.brandName || "",
          isFeatured: false,
          isNewArrival: false,
          status: "draft",
          specifications: prod.specifications || [],
          variants: prod.variants || [],
          images: prod.images || [],
          privateNotes: prod.privateNotes || "",
          purchaseCost: prod.purchaseCost || "",
          stockQuantity: 0,
          imeiSerialNumbers: [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      if (!customProducts.some((p) => p.id === duplicatedProd.id)) {
        customProducts.unshift(duplicatedProd);
        persistDataStore();
      }
      await logAudit(
        "PRODUCT_DUPLICATE",
        `Duplicated product ID ${id} to "${duplicatedProd.nameEn}" [SKU: ${newSku}]`,
        req.user?.email
      );
      res.status(201).json(duplicatedProd);
    } catch (error) {
      console.error("Error duplicating product:", error);
      res.status(500).json({ error: error.message || "Failed to duplicate product" });
    }
  });
  app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let prodName = `Product ID ${id}`;
      if (isPostgresAvailable) {
        try {
          const prod = await db.select().from(products).where(eq2(products.id, id)).limit(1);
          if (prod.length > 0) {
            prodName = prod[0].nameEn;
            await db.delete(products).where(eq2(products.id, id));
          }
        } catch (dbErr) {
          console.warn("PostgreSQL product delete note:", dbErr);
        }
      }
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
        "PRODUCT_DELETE",
        `Deleted product "${prodName}"`,
        req.user?.email
      );
      res.json({ success: true, message: "Product deleted", id });
    } catch (error) {
      res.json({ success: true, message: "Product deleted" });
    }
  });
  app.patch("/api/admin/products/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!["published", "draft", "archived"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      let updatedProd = null;
      if (isPostgresAvailable) {
        try {
          const updated = await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(products.id, id)).returning();
          if (updated && updated.length > 0) {
            updatedProd = updated[0];
          }
        } catch (dbErr) {
          console.warn("PostgreSQL status update note:", dbErr);
        }
      }
      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = { ...customProducts[idx], status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else {
        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === id);
        if (fallbackProd || updatedProd) {
          const baseProd = updatedProd || fallbackProd;
          const newCustomProd = { ...baseProd, status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
          customProducts.push(newCustomProd);
          if (!updatedProd) updatedProd = newCustomProd;
          persistDataStore();
        }
      }
      if (!updatedProd) {
        return res.status(404).json({ error: "Product not found" });
      }
      await logAudit(
        "PRODUCT_STATUS_CHANGE",
        `Changed status of "${updatedProd.nameEn || `Product #${id}`}" to ${status}`,
        req.user?.email
      );
      res.json(updatedProd);
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
      if (stockQuantity !== void 0) {
        updateData.stockQuantity = Math.max(0, parseInt(String(stockQuantity), 10) || 0);
      }
      if (status !== void 0 && ["published", "draft", "archived"].includes(status)) {
        updateData.status = status;
      }
      let updatedProd = null;
      if (isPostgresAvailable) {
        try {
          const updated = await db.update(products).set(updateData).where(eq2(products.id, id)).returning();
          if (updated && updated.length > 0) {
            updatedProd = updated[0];
          }
        } catch (dbErr) {
          console.warn("PostgreSQL quick-update note:", dbErr);
        }
      }
      const idx = customProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        customProducts[idx] = {
          ...customProducts[idx],
          ...isFeatured !== void 0 ? { isFeatured: Boolean(isFeatured) } : {},
          ...isNewArrival !== void 0 ? { isNewArrival: Boolean(isNewArrival) } : {},
          ...stockQuantity !== void 0 ? { stockQuantity: Math.max(0, parseInt(String(stockQuantity), 10) || 0) } : {},
          ...status !== void 0 && ["published", "draft", "archived"].includes(status) ? { status } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (!updatedProd) updatedProd = customProducts[idx];
        persistDataStore();
      } else {
        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === id);
        if (fallbackProd || updatedProd) {
          const baseProd = updatedProd || fallbackProd;
          const newCustomProd = {
            ...baseProd,
            ...isFeatured !== void 0 ? { isFeatured: Boolean(isFeatured) } : {},
            ...isNewArrival !== void 0 ? { isNewArrival: Boolean(isNewArrival) } : {},
            ...stockQuantity !== void 0 ? { stockQuantity: Math.max(0, parseInt(String(stockQuantity), 10) || 0) } : {},
            ...status !== void 0 && ["published", "draft", "archived"].includes(status) ? { status } : {},
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          customProducts.push(newCustomProd);
          if (!updatedProd) updatedProd = newCustomProd;
          persistDataStore();
        }
      }
      if (!updatedProd) {
        return res.status(404).json({ error: "Product not found" });
      }
      await logAudit(
        "PRODUCT_QUICK_UPDATE",
        `Quick updated "${updatedProd.nameEn || `Product #${id}`}" (stock: ${updatedProd.stockQuantity ?? 0}, status: ${updatedProd.status})`,
        req.user?.email
      );
      res.json(updatedProd);
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
      const numIds = ids.map((id) => parseInt(String(id), 10)).filter((n) => !isNaN(n));
      if (isPostgresAvailable) {
        try {
          for (const id of numIds) {
            await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(products.id, id));
          }
        } catch (dbErr) {
          console.warn("PostgreSQL bulk status update note:", dbErr);
        }
      }
      for (const id of numIds) {
        const idx = customProducts.findIndex((p) => p.id === id);
        if (idx !== -1) {
          customProducts[idx] = { ...customProducts[idx], status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        }
      }
      persistDataStore();
      await logAudit(
        "PRODUCT_BULK_STATUS",
        `Changed status of ${numIds.length} products to ${status}`,
        req.user?.email
      );
      res.json({ success: true, count: numIds.length, status });
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
      const numIds = ids.map((id) => parseInt(String(id), 10)).filter((n) => !isNaN(n));
      if (isPostgresAvailable) {
        try {
          for (const id of numIds) {
            await db.delete(products).where(eq2(products.id, id));
          }
        } catch (dbErr) {
          console.warn("PostgreSQL bulk delete note:", dbErr);
        }
      }
      customProducts = customProducts.filter((p) => !numIds.includes(p.id));
      for (const id of numIds) {
        if (!deletedProductIds.includes(id)) {
          deletedProductIds.push(id);
        }
      }
      persistDataStore();
      await logAudit("PRODUCT_BULK_DELETE", `Deleted ${numIds.length} products`, req.user?.email);
      res.json({ success: true, count: numIds.length });
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
      const safeMime = mimeType || "image/jpeg";
      const safeName = fileName || `image-${Date.now()}.jpg`;
      if (isPostgresAvailable) {
        try {
          const savedImage = await db.insert(images).values({
            fileName: safeName,
            mimeType: safeMime,
            data
            // base64 string
          }).returning();
          if (savedImage && savedImage.length > 0) {
            const imageId = savedImage[0].id;
            const imageUrl2 = `/api/images/${imageId}`;
            fallbackImagesStore.set(imageId, { fileName: safeName, mimeType: safeMime, data });
            return res.status(201).json({
              id: imageId,
              url: imageUrl2,
              fileName: savedImage[0].fileName
            });
          }
        } catch (dbErr) {
          console.warn("PostgreSQL image insertion error, routing to fallback store:", dbErr);
        }
      }
      const fallbackId = ++fallbackImageCounter;
      fallbackImagesStore.set(fallbackId, { fileName: safeName, mimeType: safeMime, data });
      const imageUrl = `/api/images/${fallbackId}`;
      res.status(201).json({
        id: fallbackId,
        url: imageUrl,
        fileName: safeName
      });
    } catch (error) {
      console.error("Error storing image:", error);
      res.status(200).json({
        id: Date.now(),
        url: req.body?.data || "",
        fileName: req.body?.fileName || "image.jpg"
      });
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
        const safeName = item.fileName || `batch-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const safeMime = item.mimeType || "image/jpeg";
        let imageId = null;
        if (isPostgresAvailable) {
          try {
            const savedImage = await db.insert(images).values({
              fileName: safeName,
              mimeType: safeMime,
              data: item.data
            }).returning();
            if (savedImage && savedImage.length > 0) {
              imageId = savedImage[0].id;
            }
          } catch (dbErr) {
            console.warn("DB batch item error:", dbErr);
          }
        }
        if (!imageId) {
          imageId = ++fallbackImageCounter;
        }
        fallbackImagesStore.set(imageId, { fileName: safeName, mimeType: safeMime, data: item.data });
        uploadedResults.push({
          id: imageId,
          url: `/api/images/${imageId}`,
          fileName: safeName
        });
      }
      res.status(201).json({
        success: true,
        count: uploadedResults.length,
        images: uploadedResults
      });
    } catch (error) {
      console.error("Error storing batch images:", error);
      res.status(500).json({ error: error.message || "Failed to upload images" });
    }
  });
  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      if (!nameEn) return res.status(400).json({ error: "Category name (English) is required" });
      let baseSlug = makeSlug(nameEn.trim());
      if (!baseSlug) {
        baseSlug = `cat-${Date.now().toString(36)}`;
      }
      let finalSlug = baseSlug;
      let savedCat = null;
      if (isPostgresAvailable) {
        try {
          let counter = 1;
          while (counter <= 50) {
            const check = await db.select({ id: categories.id }).from(categories).where(eq2(categories.slug, finalSlug)).limit(1);
            if (check.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
          }
          const cat = await db.insert(categories).values({
            slug: finalSlug,
            nameEn: nameEn.trim(),
            nameAr: (nameAr || nameEn).trim(),
            descriptionEn: descriptionEn || "",
            descriptionAr: descriptionAr || "",
            icon: (icon || "Smartphone").trim(),
            displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0
          }).returning();
          if (cat && cat.length > 0) {
            savedCat = cat[0];
          }
        } catch (dbErr) {
          console.warn("PostgreSQL category insert note, saving to persistent store:", dbErr?.message || dbErr);
        }
      }
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
          descriptionEn: descriptionEn || "",
          descriptionAr: descriptionAr || "",
          icon: (icon || "Smartphone").trim(),
          displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const existCatIdx = customCategories.findIndex((c) => c.id === savedCat.id || c.slug === savedCat.slug);
      if (existCatIdx !== -1) {
        customCategories[existCatIdx] = savedCat;
      } else {
        customCategories.push(savedCat);
      }
      persistDataStore();
      await logAudit("CATEGORY_CREATE", `Created category "${nameEn}"`, req.user?.email);
      res.status(201).json(savedCat);
    } catch (error) {
      console.error("Error creating category:", error);
      const safeCat = {
        id: Date.now(),
        slug: makeSlug(req.body?.nameEn || "category") || `cat-${Date.now()}`,
        nameEn: req.body?.nameEn || "Category",
        nameAr: req.body?.nameAr || req.body?.nameEn || "Category",
        icon: req.body?.icon || "Smartphone",
        displayOrder: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      customCategories.push(safeCat);
      persistDataStore();
      res.status(201).json(safeCat);
    }
  });
  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nameEn, nameAr, descriptionEn, descriptionAr, icon, displayOrder } = req.body;
      let updatedCat = null;
      if (isPostgresAvailable) {
        try {
          const updated = await db.update(categories).set({
            nameEn: nameEn ? nameEn.trim() : void 0,
            nameAr: nameAr ? nameAr.trim() : void 0,
            descriptionEn: descriptionEn !== void 0 ? descriptionEn : void 0,
            descriptionAr: descriptionAr !== void 0 ? descriptionAr : void 0,
            icon: icon || void 0,
            displayOrder: displayOrder !== void 0 ? parseInt(displayOrder, 10) : void 0
          }).where(eq2(categories.id, id)).returning();
          if (updated && updated.length > 0) {
            updatedCat = updated[0];
          }
        } catch (dbErr) {
          console.warn("DB category update note:", dbErr);
        }
      }
      const idx = customCategories.findIndex((c) => c.id === id);
      if (!updatedCat) {
        if (idx !== -1) {
          if (nameEn) customCategories[idx].nameEn = nameEn.trim();
          if (nameAr) customCategories[idx].nameAr = nameAr.trim();
          if (icon) customCategories[idx].icon = icon;
          if (displayOrder !== void 0) customCategories[idx].displayOrder = parseInt(displayOrder, 10);
          updatedCat = customCategories[idx];
          persistDataStore();
        } else {
          updatedCat = { id, nameEn, nameAr, icon: icon || "Smartphone", displayOrder: 0 };
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
      await logAudit("CATEGORY_UPDATE", `Updated category "${nameEn || id}"`, req.user?.email);
      res.json(updatedCat);
    } catch (error) {
      res.json({ id: parseInt(req.params.id, 10), nameEn: req.body?.nameEn, icon: req.body?.icon });
    }
  });
  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const prods = await db.select().from(products).where(eq2(products.categoryId, id)).limit(1);
          if (prods.length > 0) {
            return res.status(400).json({ error: "Cannot delete category containing existing products. Reassign or delete products first." });
          }
          await db.delete(categories).where(eq2(categories.id, id));
        } catch (dbErr) {
          console.warn("DB category delete note:", dbErr);
        }
      }
      customCategories = customCategories.filter((c) => c.id !== id);
      persistDataStore();
      await logAudit("CATEGORY_DELETE", `Deleted category ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });
  app.post("/api/admin/brands", requireAuth, async (req, res) => {
    try {
      const { name, logoUrl } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Brand name is required" });
      }
      let baseSlug = makeSlug(name.trim());
      if (!baseSlug) {
        baseSlug = `brand-${Date.now().toString(36)}`;
      }
      let finalSlug = baseSlug;
      let savedBrand = null;
      if (isPostgresAvailable) {
        try {
          let counter = 1;
          while (counter <= 50) {
            const check = await db.select({ id: brands.id }).from(brands).where(eq2(brands.slug, finalSlug)).limit(1);
            if (check.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
          }
          const br = await db.insert(brands).values({
            slug: finalSlug,
            name: name.trim(),
            logoUrl: (logoUrl || "").trim()
          }).returning();
          if (br && br.length > 0) {
            savedBrand = br[0];
          }
        } catch (dbErr) {
          console.warn("PostgreSQL brand insert note, safely saving to persistent store:", dbErr?.message || dbErr);
        }
      }
      if (!savedBrand) {
        let counter = 1;
        while (customBrands.some((b) => b.slug === finalSlug) || FALLBACK_BRANDS.some((b) => b.slug === finalSlug)) {
          finalSlug = `${baseSlug}-${counter++}`;
        }
        savedBrand = {
          id: Date.now(),
          slug: finalSlug,
          name: name.trim(),
          logoUrl: (logoUrl || "").trim(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const existBrandIdx = customBrands.findIndex((b) => b.id === savedBrand.id || b.slug === savedBrand.slug);
      if (existBrandIdx !== -1) {
        customBrands[existBrandIdx] = savedBrand;
      } else {
        customBrands.push(savedBrand);
      }
      persistDataStore();
      await logAudit("BRAND_CREATE", `Created brand "${name.trim()}" (slug: ${finalSlug})`, req.user?.email);
      res.status(201).json(savedBrand);
    } catch (error) {
      console.error("Error creating brand:", error);
      const safeBrand = {
        id: Date.now(),
        slug: makeSlug(req.body?.name || "brand") || `brand-${Date.now()}`,
        name: req.body?.name || "Brand",
        logoUrl: (req.body?.logoUrl || "").trim(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      customBrands.push(safeBrand);
      persistDataStore();
      res.status(201).json(safeBrand);
    }
  });
  app.put("/api/admin/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, logoUrl } = req.body;
      let updatedBrand = null;
      if (isPostgresAvailable) {
        try {
          const updated = await db.update(brands).set({
            name: name ? name.trim() : void 0,
            logoUrl: logoUrl !== void 0 ? logoUrl : void 0
          }).where(eq2(brands.id, id)).returning();
          if (updated && updated.length > 0) {
            updatedBrand = updated[0];
          }
        } catch (dbErr) {
          console.warn("DB brand update note:", dbErr);
        }
      }
      const idx = customBrands.findIndex((b) => b.id === id);
      if (!updatedBrand) {
        if (idx !== -1) {
          if (name) customBrands[idx].name = name.trim();
          if (logoUrl !== void 0) customBrands[idx].logoUrl = logoUrl.trim();
          updatedBrand = customBrands[idx];
          persistDataStore();
        } else {
          updatedBrand = { id, name: name?.trim() || "Brand", logoUrl: (logoUrl || "").trim() };
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
      await logAudit("BRAND_UPDATE", `Updated brand "${name || id}"`, req.user?.email);
      res.json(updatedBrand);
    } catch (error) {
      res.json({ id: parseInt(req.params.id, 10), name: req.body?.name, logoUrl: req.body?.logoUrl });
    }
  });
  app.delete("/api/admin/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const prods = await db.select().from(products).where(eq2(products.brandId, id)).limit(1);
          if (prods.length > 0) {
            return res.status(400).json({ error: "Cannot delete brand with associated products." });
          }
          await db.delete(brands).where(eq2(brands.id, id));
        } catch (dbErr) {
          console.warn("DB brand delete note:", dbErr);
        }
      }
      customBrands = customBrands.filter((b) => b.id !== id);
      persistDataStore();
      await logAudit("BRAND_DELETE", `Deleted brand ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });
  app.post("/api/admin/services", requireAuth, async (req, res) => {
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
        isActive
      } = req.body;
      if (!titleEn || !titleEn.trim()) {
        return res.status(400).json({ error: "Service English title is required" });
      }
      let baseSlug = makeSlug(titleEn.trim());
      if (!baseSlug) baseSlug = `service-${Date.now().toString(36)}`;
      let finalSlug = baseSlug;
      let savedService = null;
      if (isPostgresAvailable) {
        try {
          const pool2 = global._postgresPool;
          if (pool2) {
            let counter = 1;
            while (counter <= 50) {
              const check = await pool2.query("SELECT id FROM services WHERE slug = $1 LIMIT 1;", [finalSlug]);
              if (check.rows.length === 0) break;
              finalSlug = `${baseSlug}-${counter++}`;
            }
            const insertRes = await pool2.query(`
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
              descriptionEn?.trim() || "",
              descriptionAr?.trim() || descriptionEn?.trim() || "",
              icon || "Wrench",
              turnaroundEn?.trim() || "30 - 45 Minutes",
              turnaroundAr?.trim() || "30 - 45 \u062F\u0642\u064A\u0642\u0629",
              badgeEn?.trim() || "Certified",
              badgeAr?.trim() || "\u0645\u0639\u062A\u0645\u062F",
              JSON.stringify(featuresEn || []),
              JSON.stringify(featuresAr || []),
              parseInt(displayOrder, 10) || 0,
              isActive !== false
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
                createdAt: row.created_at
              };
            }
          }
        } catch (dbErr) {
          console.warn("DB service create note:", dbErr);
        }
      }
      if (!savedService) {
        const nextId = Math.max(100, ...customServices.map((s) => Number(s.id) || 0)) + 1;
        savedService = {
          id: nextId,
          slug: finalSlug,
          titleEn: titleEn.trim(),
          titleAr: titleAr?.trim() || titleEn.trim(),
          descriptionEn: descriptionEn?.trim() || "",
          descriptionAr: descriptionAr?.trim() || descriptionEn?.trim() || "",
          icon: icon || "Wrench",
          turnaroundEn: turnaroundEn?.trim() || "30 - 45 Minutes",
          turnaroundAr: turnaroundAr?.trim() || "30 - 45 \u062F\u0642\u064A\u0642\u0629",
          badgeEn: badgeEn?.trim() || "Certified",
          badgeAr: badgeAr?.trim() || "\u0645\u0639\u062A\u0645\u062F",
          featuresEn: featuresEn || [],
          featuresAr: featuresAr || [],
          displayOrder: parseInt(displayOrder, 10) || 0,
          isActive: isActive !== false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      customServices.push(savedService);
      persistDataStore();
      await logAudit("SERVICE_CREATE", `Created service "${savedService.titleEn}"`, req.user?.email);
      res.status(201).json(savedService);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: error.message || "Failed to create service" });
    }
  });
  app.put("/api/admin/services/:id", requireAuth, async (req, res) => {
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
        isActive
      } = req.body;
      let updatedService = null;
      if (isPostgresAvailable) {
        try {
          const pool2 = global._postgresPool;
          if (pool2) {
            const updateRes = await pool2.query(`
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
              titleEn !== void 0 ? titleEn.trim() : null,
              titleAr !== void 0 ? titleAr.trim() : null,
              descriptionEn !== void 0 ? descriptionEn.trim() : null,
              descriptionAr !== void 0 ? descriptionAr.trim() : null,
              icon !== void 0 ? icon : null,
              turnaroundEn !== void 0 ? turnaroundEn.trim() : null,
              turnaroundAr !== void 0 ? turnaroundAr.trim() : null,
              badgeEn !== void 0 ? badgeEn.trim() : null,
              badgeAr !== void 0 ? badgeAr.trim() : null,
              featuresEn !== void 0 ? JSON.stringify(featuresEn) : null,
              featuresAr !== void 0 ? JSON.stringify(featuresAr) : null,
              displayOrder !== void 0 ? parseInt(displayOrder, 10) : null,
              isActive !== void 0 ? Boolean(isActive) : null,
              id
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
                createdAt: row.created_at
              };
            }
          }
        } catch (dbErr) {
          console.warn("DB service update note:", dbErr);
        }
      }
      const idx = customServices.findIndex((s) => s.id === id);
      if (idx !== -1) {
        customServices[idx] = {
          ...customServices[idx],
          ...titleEn !== void 0 ? { titleEn: titleEn.trim() } : {},
          ...titleAr !== void 0 ? { titleAr: titleAr.trim() } : {},
          ...descriptionEn !== void 0 ? { descriptionEn: descriptionEn.trim() } : {},
          ...descriptionAr !== void 0 ? { descriptionAr: descriptionAr.trim() } : {},
          ...icon !== void 0 ? { icon } : {},
          ...turnaroundEn !== void 0 ? { turnaroundEn: turnaroundEn.trim() } : {},
          ...turnaroundAr !== void 0 ? { turnaroundAr: turnaroundAr.trim() } : {},
          ...badgeEn !== void 0 ? { badgeEn: badgeEn.trim() } : {},
          ...badgeAr !== void 0 ? { badgeAr: badgeAr.trim() } : {},
          ...featuresEn !== void 0 ? { featuresEn } : {},
          ...featuresAr !== void 0 ? { featuresAr } : {},
          ...displayOrder !== void 0 ? { displayOrder: parseInt(displayOrder, 10) } : {},
          ...isActive !== void 0 ? { isActive: Boolean(isActive) } : {}
        };
        if (!updatedService) updatedService = customServices[idx];
      } else if (!updatedService) {
        updatedService = {
          id,
          slug: `service-${id}`,
          titleEn: titleEn || "Service",
          titleAr: titleAr || titleEn || "\u062E\u062F\u0645\u0629",
          descriptionEn: descriptionEn || "",
          descriptionAr: descriptionAr || "",
          icon: icon || "Wrench",
          turnaroundEn: turnaroundEn || "30 - 45 Minutes",
          turnaroundAr: turnaroundAr || "30 - 45 \u062F\u0642\u064A\u0642\u0629",
          badgeEn: badgeEn || "Certified",
          badgeAr: badgeAr || "\u0645\u0639\u062A\u0645\u062F",
          featuresEn: featuresEn || [],
          featuresAr: featuresAr || [],
          displayOrder: parseInt(displayOrder, 10) || 0,
          isActive: isActive !== false
        };
        customServices.push(updatedService);
      }
      persistDataStore();
      await logAudit("SERVICE_UPDATE", `Updated service "${updatedService.titleEn || id}"`, req.user?.email);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: error.message || "Failed to update service" });
    }
  });
  app.delete("/api/admin/services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isPostgresAvailable) {
        try {
          const pool2 = global._postgresPool;
          if (pool2) {
            await pool2.query("DELETE FROM services WHERE id = $1;", [id]);
          }
        } catch (dbErr) {
          console.warn("DB service delete note:", dbErr);
        }
      }
      customServices = customServices.filter((s) => s.id !== id);
      persistDataStore();
      await logAudit("SERVICE_DELETE", `Deleted service ID ${id}`, req.user?.email);
      res.json({ success: true, id });
    } catch (error) {
      res.json({ success: true, id: parseInt(req.params.id, 10) });
    }
  });
  app.patch("/api/admin/services/:id/toggle", requireAuth, async (req, res) => {
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
          const pool2 = global._postgresPool;
          if (pool2) {
            await pool2.query("UPDATE services SET is_active = $1 WHERE id = $2;", [newStatus, id]);
          }
        } catch (dbErr) {
          console.warn("DB service toggle note:", dbErr);
        }
      }
      persistDataStore();
      await logAudit("SERVICE_TOGGLE", `Toggled service ID ${id} active to ${newStatus}`, req.user?.email);
      res.json({ id, isActive: newStatus });
    } catch (error) {
      res.json({ id: parseInt(req.params.id, 10), isActive: true });
    }
  });
  app.get("/api/admin/whatsapp-settings", requireAuth, async (_req, res) => {
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
      console.warn("Database note: Using fallback admin WhatsApp settings:", error?.message);
      res.json({ id: 1, ...FALLBACK_WHATSAPP });
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
        }).where(eq2(whatsappSettings.id, existing[0].id)).returning();
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
      if (!isPostgresAvailable) {
        return res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
      }
      const content = await db.select().from(siteContent).limit(1);
      if (content.length === 0) {
        return res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
      }
      res.json(content[0]);
    } catch (error) {
      console.warn("Database note: Using fallback admin site content:", error?.message);
      res.json({ id: 1, ...FALLBACK_SITE_CONTENT });
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
        }).where(eq2(siteContent.id, existing[0].id)).returning();
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
  const getDubaiDate = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      return formatter.format(/* @__PURE__ */ new Date());
    } catch {
      return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
  };
  const isBotUserAgent = (userAgent) => {
    if (!userAgent) return false;
    const botRegex = /bot|googlebot|crawler|spider|robot|crawling|headlesschrome|lighthouse|baidu|bingbot|yandex|semrush/i;
    return botRegex.test(userAgent);
  };
  const visitorState = {
    currentDate: getDubaiDate(),
    todayVisitors: /* @__PURE__ */ new Set(),
    todayPageViews: 0,
    lifetimeVisitors: /* @__PURE__ */ new Set(),
    settings: {
      isEnabled: true,
      displayMode: "both",
      todayAdjustment: 0,
      totalAdjustment: 0
    },
    dailyHistory: /* @__PURE__ */ new Map()
  };
  const syncVisitorDataFromDb = async () => {
    if (!isPostgresAvailable) return;
    try {
      const settingsRows = await db.select().from(visitorSettings).where(eq2(visitorSettings.id, 1)).limit(1);
      if (settingsRows && settingsRows.length > 0) {
        visitorState.settings.isEnabled = settingsRows[0].isEnabled ?? true;
        visitorState.settings.displayMode = settingsRows[0].displayMode || "both";
        visitorState.settings.todayAdjustment = settingsRows[0].todayAdjustment ?? 0;
        visitorState.settings.totalAdjustment = settingsRows[0].totalAdjustment ?? 0;
      }
      const statsRows = await db.select().from(visitorDailyStats).orderBy(desc(visitorDailyStats.date)).limit(30);
      for (const row of statsRows) {
        visitorState.dailyHistory.set(row.date, {
          uniqueVisitors: row.uniqueVisitors ?? 0,
          pageViews: row.pageViews ?? 0
        });
      }
      const todayDubai = getDubaiDate();
      const todayLogs = await db.select({ visitorId: visitorLogs.visitorId }).from(visitorLogs).where(eq2(visitorLogs.date, todayDubai));
      for (const log of todayLogs) {
        visitorState.todayVisitors.add(log.visitorId);
        visitorState.lifetimeVisitors.add(log.visitorId);
      }
      const allVisitorCount = await db.select({ count: sql`count(distinct ${visitorLogs.visitorId})::int` }).from(visitorLogs);
      const totalDistinct = allVisitorCount[0]?.count ?? 0;
      if (totalDistinct > visitorState.lifetimeVisitors.size) {
        for (let i = visitorState.lifetimeVisitors.size; i < totalDistinct; i++) {
          visitorState.lifetimeVisitors.add(`seeded_historical_${i}`);
        }
      }
    } catch (err) {
      console.warn("Note: Visitor data sync using in-memory state:", err);
    }
  };
  syncVisitorDataFromDb();
  const checkDateRollover = () => {
    const todayDubai = getDubaiDate();
    if (visitorState.currentDate !== todayDubai) {
      visitorState.dailyHistory.set(visitorState.currentDate, {
        uniqueVisitors: visitorState.todayVisitors.size,
        pageViews: visitorState.todayPageViews
      });
      visitorState.currentDate = todayDubai;
      visitorState.todayVisitors.clear();
      visitorState.todayPageViews = 0;
    }
  };
  app.post("/api/visitors/track", async (req, res) => {
    try {
      checkDateRollover();
      const userAgent = req.headers["user-agent"] || "";
      const isBot = isBotUserAgent(userAgent);
      const { visitorId, path: pagePath } = req.body || {};
      if (!isBot && visitorId && typeof visitorId === "string" && visitorId.length > 5 && visitorId.length < 100) {
        visitorState.todayPageViews += 1;
        const isNewToday = !visitorState.todayVisitors.has(visitorId);
        visitorState.todayVisitors.add(visitorId);
        visitorState.lifetimeVisitors.add(visitorId);
        if (isPostgresAvailable && isNewToday) {
          (async () => {
            try {
              const todayDubai = getDubaiDate();
              await db.insert(visitorLogs).values({
                visitorId,
                date: todayDubai,
                path: typeof pagePath === "string" ? pagePath.slice(0, 200) : "/",
                userAgent: userAgent.slice(0, 255)
              });
              await db.insert(visitorDailyStats).values({
                date: todayDubai,
                uniqueVisitors: visitorState.todayVisitors.size,
                pageViews: visitorState.todayPageViews,
                updatedAt: /* @__PURE__ */ new Date()
              }).onConflictDoUpdate({
                target: visitorDailyStats.date,
                set: {
                  uniqueVisitors: visitorState.todayVisitors.size,
                  pageViews: visitorState.todayPageViews,
                  updatedAt: /* @__PURE__ */ new Date()
                }
              });
            } catch (persistErr) {
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
          displayMode: visitorState.settings.displayMode
        }
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to record visitor" });
    }
  });
  app.get("/api/visitors/public", (_req, res) => {
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
        displayMode: visitorState.settings.displayMode
      }
    });
  });
  app.get("/api/admin/visitors", requireAuth, async (_req, res) => {
    try {
      checkDateRollover();
      const historyList = [];
      const todayDubai = getDubaiDate();
      historyList.push({
        date: todayDubai,
        uniqueVisitors: visitorState.todayVisitors.size,
        pageViews: visitorState.todayPageViews
      });
      for (const [date, val] of visitorState.dailyHistory.entries()) {
        if (date !== todayDubai) {
          historyList.push({
            date,
            uniqueVisitors: val.uniqueVisitors,
            pageViews: val.pageViews
          });
        }
      }
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
        recentDailyStats: historyList.slice(0, 30)
      });
    } catch (error) {
      console.error("Error fetching admin visitor analytics:", error);
      res.status(500).json({ error: "Failed to fetch visitor analytics" });
    }
  });
  app.post("/api/admin/visitors/settings", requireAuth, async (req, res) => {
    try {
      const { isEnabled, displayMode, todayAdjustment, totalAdjustment } = req.body;
      if (isEnabled !== void 0) visitorState.settings.isEnabled = Boolean(isEnabled);
      if (["both", "today", "total"].includes(displayMode)) {
        visitorState.settings.displayMode = displayMode;
      }
      if (typeof todayAdjustment === "number") {
        visitorState.settings.todayAdjustment = Math.round(todayAdjustment);
      }
      if (typeof totalAdjustment === "number") {
        visitorState.settings.totalAdjustment = Math.round(totalAdjustment);
      }
      if (isPostgresAvailable) {
        await db.insert(visitorSettings).values({
          id: 1,
          isEnabled: visitorState.settings.isEnabled,
          displayMode: visitorState.settings.displayMode,
          todayAdjustment: visitorState.settings.todayAdjustment,
          totalAdjustment: visitorState.settings.totalAdjustment,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: visitorSettings.id,
          set: {
            isEnabled: visitorState.settings.isEnabled,
            displayMode: visitorState.settings.displayMode,
            todayAdjustment: visitorState.settings.todayAdjustment,
            totalAdjustment: visitorState.settings.totalAdjustment,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      await logAudit(
        "VISITOR_SETTINGS_UPDATE",
        `Adjusted visitor settings (Today adj: ${visitorState.settings.todayAdjustment}, Total adj: ${visitorState.settings.totalAdjustment}, Mode: ${visitorState.settings.displayMode}, Enabled: ${visitorState.settings.isEnabled})`,
        req.user?.email
      );
      res.json({
        success: true,
        settings: visitorState.settings
      });
    } catch (error) {
      console.error("Error updating visitor settings:", error);
      res.status(500).json({ error: error.message || "Failed to update visitor settings" });
    }
  });
  app.post("/api/admin/visitors/reset-adjustments", requireAuth, async (req, res) => {
    try {
      visitorState.settings.todayAdjustment = 0;
      visitorState.settings.totalAdjustment = 0;
      if (isPostgresAvailable) {
        await db.update(visitorSettings).set({
          todayAdjustment: 0,
          totalAdjustment: 0,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(visitorSettings.id, 1));
      }
      await logAudit(
        "VISITOR_ADJUSTMENTS_RESET",
        "Reset visitor counter display adjustments to 0 (restored actual analytics count)",
        req.user?.email
      );
      res.json({
        success: true,
        todayAdjustment: 0,
        totalAdjustment: 0
      });
    } catch (error) {
      console.error("Error resetting visitor adjustments:", error);
      res.status(500).json({ error: error.message || "Failed to reset adjustments" });
    }
  });
  const distDir = path2.resolve(__dirname, "dist");
  const indexHtml = path2.resolve(distDir, "index.html");
  const hasDist = fs2.existsSync(indexHtml);
  if (process.env.NODE_ENV === "production" || hasDist) {
    if (hasDist) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(indexHtml);
      });
    } else {
      app.get("*", (_req, res) => {
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
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite middleware could not be loaded, using fallback:", viteErr);
      if (hasDist) {
        app.use(express.static(distDir));
        app.get("*", (_req, res) => res.sendFile(indexHtml));
      }
    }
  }
  const rawPort = process.env.PORT;
  let portToListen = 3e3;
  if (typeof global.PhusionPassenger !== "undefined") {
    portToListen = "passenger";
  } else if (process.env.DEFAULT_APP_PORT) {
    portToListen = Number(process.env.DEFAULT_APP_PORT) || 3e3;
  } else if (rawPort) {
    if (isNaN(Number(rawPort))) {
      portToListen = rawPort;
    } else {
      portToListen = Number(rawPort);
    }
  }
  const server = typeof portToListen === "string" ? app.listen(portToListen, () => {
    console.log(`Nasir Mobile server listening on socket: ${portToListen}`);
  }) : app.listen(portToListen, "0.0.0.0", () => {
    console.log(`Nasir Mobile Full-Stack server running at http://0.0.0.0:${portToListen}`);
  });
  server.on("error", (err) => {
    console.error("Server listen error:", err?.message || err);
  });
}
startServer().catch((err) => {
  console.error("Non-fatal error caught on server startup:", err);
});
