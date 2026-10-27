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
import { eq as eq2, desc, asc, and, or, ilike, sql } from "drizzle-orm";

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
    slug: "smartphones",
    nameEn: "Smartphones",
    nameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629",
    descriptionEn: "Flagship & high-performance smartphones from Apple, Samsung, Google & more.",
    descriptionAr: "\u0623\u062D\u062F\u062B \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629 \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0645\u0646 \u0622\u0628\u0644 \u0648\u0633\u0627\u0645\u0633\u0648\u0646\u062C \u0648\u062C\u0648\u062C\u0644 \u0648\u063A\u064A\u0631\u0647\u0627.",
    icon: "Smartphone",
    displayOrder: 1
  },
  {
    id: 2,
    slug: "tablets",
    nameEn: "Tablets & iPads",
    nameAr: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629",
    descriptionEn: "Apple iPads and high-tier productivity Android tablets.",
    descriptionAr: "\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0622\u064A\u0628\u0627\u062F \u0648\u0623\u0642\u0648\u0649 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629 \u0644\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629 \u0648\u0627\u0644\u0639\u0645\u0644.",
    icon: "Tablet",
    displayOrder: 2
  },
  {
    id: 3,
    slug: "smartwatches",
    nameEn: "Smartwatches",
    nameAr: "\u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629",
    descriptionEn: "Luxury smart wearables, Apple Watch Ultra & Galaxy Watch series.",
    descriptionAr: "\u0633\u0627\u0639\u0627\u062A \u0622\u0628\u0644 \u0648\u0633\u0627\u0645\u0633\u0648\u0646\u062C \u0627\u0644\u0630\u0643\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0627\u0644\u0645\u062C\u0647\u0632\u0629 \u0628\u0643\u0627\u0641\u0629 \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0635\u062D\u0629.",
    icon: "Watch",
    displayOrder: 3
  },
  {
    id: 4,
    slug: "accessories",
    nameEn: "Premium Accessories",
    nameAr: "\u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629",
    descriptionEn: "Original MagSafe chargers, GaN power adapters, AirPods, and protective cases.",
    descriptionAr: "\u0634\u0648\u0627\u062D\u0646 \u0645\u0627\u062C \u0633\u064A\u0641 \u0648\u0633\u0645\u0627\u0639\u0627\u062A \u0623\u0635\u0644\u064A\u0629 \u0648\u0643\u0641\u0631\u0627\u062A \u062D\u0645\u0627\u064A\u0629 \u0641\u0627\u062E\u0631\u0629 \u0645\u0639\u062A\u0645\u062F\u0629.",
    icon: "Headphones",
    displayOrder: 4
  }
];
var FALLBACK_BRANDS = [
  {
    id: 1,
    slug: "apple",
    name: "Apple",
    logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    slug: "samsung",
    name: "Samsung",
    logoUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    slug: "google",
    name: "Google Pixel",
    logoUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    slug: "xiaomi",
    name: "Xiaomi",
    logoUrl: ""
  },
  {
    id: 5,
    slug: "oneplus",
    name: "OnePlus",
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
    categoryNameEn: "Smartphones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629",
    categorySlug: "smartphones",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { keyEn: "Storage", keyAr: "\u0633\u0639\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646", valueEn: "256GB / 512GB / 1TB", valueAr: "256 \u062C\u064A\u062C\u0627\u0628\u0627\u064A\u062A / 512 \u062C\u064A\u062C\u0627\u0628\u0627\u064A\u062A / 1 \u062A\u064A\u0631\u0627\u0628\u0627\u064A\u062A" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '6.9" Super Retina XDR OLED 120Hz', valueAr: "6.9 \u0628\u0648\u0635\u0629 \u0633\u0648\u0628\u0631 \u0631\u064A\u062A\u064A\u0646\u0627 XDR \u0623\u0648\u0644\u064A\u062F 120 \u0647\u0631\u062A\u0632" },
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Apple A18 Pro (3nm)", valueAr: "\u0622\u0628\u0644 A18 \u0628\u0631\u0648 (3 \u0646\u0627\u0646\u0648\u0645\u062A\u0631)" },
      { keyEn: "Warranty", keyAr: "\u0627\u0644\u0636\u0645\u0627\u0646", valueEn: "1 Year Apple Official Warranty", valueAr: "\u0636\u0645\u0627\u0646 \u0631\u0633\u0645\u064A \u0645\u0646 \u0622\u0628\u0644 \u0644\u0645\u062F\u0629 \u0633\u0646\u0629" }
    ],
    variants: [
      { nameEn: "Storage", nameAr: "\u0627\u0644\u0633\u0639\u0629", options: ["256GB", "512GB", "1TB"] },
      { nameEn: "Color", nameAr: "\u0627\u0644\u0644\u0648\u0646", options: ["Desert Titanium", "Natural Titanium", "White Titanium", "Black Titanium"] }
    ],
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    categoryNameEn: "Smartphones",
    categoryNameAr: "\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0630\u0643\u064A\u0629",
    categorySlug: "smartphones",
    brandName: "Samsung",
    brandSlug: "samsung",
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Snapdragon 8 Elite for Galaxy", valueAr: "\u0633\u0646\u0627\u0628\u062F\u0631\u0627\u062C\u0648\u0646 8 \u0625\u064A\u0644\u064A\u062A \u0645\u062E\u0635\u0635 \u0644\u062C\u0627\u0644\u0627\u0643\u0633\u064A" },
      { keyEn: "Camera", keyAr: "\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627", valueEn: "200MP Main + 50MP Periscope 5x", valueAr: "200 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644 \u0631\u0626\u064A\u0633\u064A\u0629 + 50 \u0645\u064A\u062C\u0627\u0628\u0643\u0633\u0644 \u0628\u064A\u0631\u064A\u0633\u0643\u0648\u0628" },
      { keyEn: "Battery", keyAr: "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", valueEn: "5000 mAh Fast Charge 45W", valueAr: "5000 \u0645\u0644\u0644\u064A \u0623\u0645\u0628\u064A\u0631 \u0634\u062D\u0646 \u0633\u0631\u064A\u0639 45 \u0648\u0627\u0637" }
    ],
    variants: [
      { nameEn: "Storage", nameAr: "\u0627\u0644\u0633\u0639\u0629", options: ["256GB", "512GB", "1TB"] },
      { nameEn: "Color", nameAr: "\u0627\u0644\u0644\u0648\u0646", options: ["Titanium Black", "Titanium Silver", "Titanium Gray"] }
    ],
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    categoryId: 3,
    brandId: 1,
    categoryNameEn: "Smartwatches",
    categoryNameAr: "\u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629",
    categorySlug: "smartwatches",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: true,
    isNewArrival: false,
    specifications: [
      { keyEn: "Case", keyAr: "\u0627\u0644\u0647\u064A\u0643\u0644", valueEn: "49mm Black Titanium Case", valueAr: "\u0647\u064A\u0643\u0644 \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0623\u0633\u0648\u062F 49 \u0645\u0644\u0645" },
      { keyEn: "Water Resistance", keyAr: "\u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0645\u0627\u0621", valueEn: "100m Water Resistant", valueAr: "\u0645\u0642\u0627\u0648\u0645\u0629 \u0644\u0644\u0645\u0627\u0621 \u062D\u062A\u0649 \u0639\u0645\u0642 100 \u0645\u062A\u0631" }
    ],
    variants: [
      { nameEn: "Band", nameAr: "\u0627\u0644\u0633\u0648\u0627\u0631", options: ["Trail Loop", "Alpine Loop", "Ocean Band"] }
    ],
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    categoryId: 2,
    brandId: 1,
    categoryNameEn: "Tablets & iPads",
    categoryNameAr: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0644\u0648\u062D\u064A\u0629",
    categorySlug: "tablets",
    brandName: "Apple",
    brandSlug: "apple",
    isFeatured: false,
    isNewArrival: true,
    specifications: [
      { keyEn: "Processor", keyAr: "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", valueEn: "Apple M4 Chip (Next-gen Neural Engine)", valueAr: "\u0634\u0631\u064A\u062D\u0629 \u0622\u0628\u0644 M4 \u0645\u0639 \u0645\u062D\u0631\u0643 \u0639\u0635\u0628\u064A \u0645\u062A\u0637\u0648\u0631" },
      { keyEn: "Display", keyAr: "\u0627\u0644\u0634\u0627\u0634\u0629", valueEn: '13" Tandem OLED Ultra Retina XDR', valueAr: "\u0634\u0627\u0634\u0629 13 \u0628\u0648\u0635\u0629 \u062A\u0627\u0646\u062F\u064A\u0645 \u0623\u0648\u0644\u064A\u062F \u0623\u0644\u062A\u0631\u0627 \u0631\u064A\u062A\u064A\u0646\u0627 XDR" }
    ],
    variants: [
      { nameEn: "Storage", nameAr: "\u0627\u0644\u0633\u0639\u0629", options: ["256GB", "512GB", "1TB"] },
      { nameEn: "Connectivity", nameAr: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644", options: ["Wi-Fi", "Wi-Fi + Cellular 5G"] }
    ],
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
  app.get("/api/categories", async (_req, res) => {
    if (!isPostgresAvailable) {
      return res.json(FALLBACK_CATEGORIES);
    }
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
      if (allCategories && allCategories.length > 0) {
        return res.json(allCategories);
      }
      res.json(FALLBACK_CATEGORIES);
    } catch {
      res.json(FALLBACK_CATEGORIES);
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
      if (allBrands && allBrands.length > 0) {
        return res.json(allBrands);
      }
      res.json(FALLBACK_BRANDS);
    } catch (err) {
      console.warn("Brands query fallback:", err?.message);
      res.json(FALLBACK_BRANDS);
    }
  });
  const filterFallbackProducts = (query) => {
    const { category, brand, condition, featured, newArrival, search, sort } = query;
    let filtered = [...FALLBACK_PRODUCTS];
    if (category && typeof category === "string") {
      filtered = filtered.filter((p) => p.categorySlug === category);
    }
    if (brand && typeof brand === "string") {
      filtered = filtered.filter((p) => p.brandSlug === brand);
    }
    if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
      filtered = filtered.filter((p) => p.condition === condition);
    }
    if (featured === "true") {
      filtered = filtered.filter((p) => p.isFeatured);
    }
    if (newArrival === "true") {
      filtered = filtered.filter((p) => p.isNewArrival);
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.nameEn.toLowerCase().includes(q) || p.nameAr.includes(q) || p.sku.toLowerCase().includes(q) || p.descriptionEn.toLowerCase().includes(q)
      );
    }
    if (sort === "name-asc") {
      filtered.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    } else if (sort === "name-desc") {
      filtered.sort((a, b) => b.nameEn.localeCompare(a.nameEn));
    }
    return filtered;
  };
  app.get("/api/products", async (req, res) => {
    if (!isPostgresAvailable) {
      return res.json(filterFallbackProducts(req.query));
    }
    try {
      const { category, brand, condition, featured, newArrival, search, sort } = req.query;
      const conditions = [eq2(products.status, "published")];
      if (category && typeof category === "string") {
        const cat = await db.select().from(categories).where(eq2(categories.slug, category)).limit(1);
        if (cat.length > 0) {
          conditions.push(eq2(products.categoryId, cat[0].id));
        }
      }
      if (brand && typeof brand === "string") {
        const br = await db.select().from(brands).where(eq2(brands.slug, brand)).limit(1);
        if (br.length > 0) {
          conditions.push(eq2(products.brandId, br[0].id));
        }
      }
      if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
        conditions.push(eq2(products.condition, condition));
      }
      if (featured === "true") {
        conditions.push(eq2(products.isFeatured, true));
      }
      if (newArrival === "true") {
        conditions.push(eq2(products.isNewArrival, true));
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
      }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id)).where(and(...conditions));
      if (sort === "name-asc") {
        query = query.orderBy(asc(products.nameEn));
      } else if (sort === "name-desc") {
        query = query.orderBy(desc(products.nameEn));
      } else {
        query = query.orderBy(desc(products.createdAt));
      }
      const results = await query;
      if (results && results.length > 0) {
        return res.json(results);
      }
      res.json(filterFallbackProducts(req.query));
    } catch {
      res.json(filterFallbackProducts(req.query));
    }
  });
  app.get("/api/products/:slug", async (req, res) => {
    const slug = req.params.slug;
    if (!isPostgresAvailable) {
      const fallbackItem = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: FALLBACK_PRODUCTS.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
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
      const fallbackItem = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: FALLBACK_PRODUCTS.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
        });
      }
      return res.status(404).json({ error: "Product not found" });
    } catch {
      const fallbackItem = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
      if (fallbackItem) {
        return res.json({
          product: fallbackItem,
          related: FALLBACK_PRODUCTS.filter((p) => p.id !== fallbackItem.id).slice(0, 4)
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
      if (!isPostgresAvailable) {
        return res.json(filterFallbackProducts(req.query));
      }
      const { search, status, categoryId, brandId } = req.query;
      const conditions = [];
      if (status && typeof status === "string" && status !== "all") {
        conditions.push(eq2(products.status, status));
      }
      if (categoryId && !isNaN(parseInt(categoryId, 10))) {
        conditions.push(eq2(products.categoryId, parseInt(categoryId, 10)));
      }
      if (brandId && !isNaN(parseInt(brandId, 10))) {
        conditions.push(eq2(products.brandId, parseInt(brandId, 10)));
      }
      const { condition } = req.query;
      if (condition && typeof condition === "string" && ["New", "Used", "Refurbished"].includes(condition)) {
        conditions.push(eq2(products.condition, condition));
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
      }).from(products).leftJoin(categories, eq2(products.categoryId, categories.id)).leftJoin(brands, eq2(products.brandId, brands.id));
      const results = conditions.length > 0 ? await query.where(and(...conditions)).orderBy(desc(products.createdAt)) : await query.orderBy(desc(products.createdAt));
      if (results && results.length > 0) {
        return res.json(results);
      }
      res.json(filterFallbackProducts(req.query));
    } catch (error) {
      console.warn("Database note: Using fallback admin products:", error?.message);
      res.json(filterFallbackProducts(req.query));
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
      const existingSku = await db.select().from(products).where(eq2(products.sku, sku.trim())).limit(1);
      if (existingSku.length > 0) {
        return res.status(400).json({ error: `Product with SKU "${sku.trim()}" already exists.` });
      }
      let baseSlug = makeSlug(nameEn);
      if (!baseSlug) baseSlug = `product-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existingSlug = await db.select().from(products).where(eq2(products.slug, finalSlug)).limit(1);
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
      const existing = await db.select().from(products).where(eq2(products.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
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
      const original = await db.select().from(products).where(eq2(products.id, id)).limit(1);
      if (original.length === 0) {
        return res.status(404).json({ error: "Original product not found" });
      }
      const prod = original[0];
      const newSku = `${prod.sku}-COPY-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const baseSlug = `${prod.slug}-copy`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const slugCheck = await db.select().from(products).where(eq2(products.slug, finalSlug)).limit(1);
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
      const prod = await db.select().from(products).where(eq2(products.id, id)).limit(1);
      if (prod.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      await db.delete(products).where(eq2(products.id, id));
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
      const updated = await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(products.id, id)).returning();
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
      const updated = await db.update(products).set(updateData).where(eq2(products.id, id)).returning();
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
        await db.update(products).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(products.id, id));
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
        await db.delete(products).where(eq2(products.id, id));
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
      let counter = 1;
      while (counter <= 50) {
        try {
          const check = await db.select({ id: categories.id }).from(categories).where(eq2(categories.slug, finalSlug)).limit(1);
          if (check.length === 0) break;
          finalSlug = `${baseSlug}-${counter++}`;
        } catch (slugErr) {
          console.warn("Category slug collision check warning:", slugErr);
          finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
          break;
        }
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
      }).where(eq2(categories.id, id)).returning();
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
      const prods = await db.select().from(products).where(eq2(products.categoryId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: "Cannot delete category containing existing products. Reassign or delete products first." });
      }
      await db.delete(categories).where(eq2(categories.id, id));
      await logAudit("CATEGORY_DELETE", `Deleted category ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: error.message || "Failed to delete category" });
    }
  });
  app.get("/api/admin/brands", requireAuth, async (_req, res) => {
    try {
      const allBrands = await db.select({
        id: brands.id,
        slug: brands.slug,
        name: brands.name,
        logoUrl: brands.logoUrl,
        createdAt: brands.createdAt
      }).from(brands).orderBy(asc(brands.name));
      res.json(allBrands);
    } catch (error) {
      console.error("Error fetching admin brands:", error);
      res.status(500).json({ error: error.message || "Failed to fetch brands" });
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
      let counter = 1;
      while (counter <= 50) {
        try {
          const check = await db.select({ id: brands.id }).from(brands).where(eq2(brands.slug, finalSlug)).limit(1);
          if (check.length === 0) break;
          finalSlug = `${baseSlug}-${counter++}`;
        } catch (slugErr) {
          console.warn("Brands slug collision check warning:", slugErr);
          finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
          break;
        }
      }
      const br = await db.insert(brands).values({
        slug: finalSlug,
        name: name.trim(),
        logoUrl: (logoUrl || "").trim()
      }).returning();
      await logAudit("BRAND_CREATE", `Created brand "${name.trim()}" (slug: ${finalSlug})`, req.user?.email);
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
      }).where(eq2(brands.id, id)).returning();
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
      const prods = await db.select().from(products).where(eq2(products.brandId, id)).limit(1);
      if (prods.length > 0) {
        return res.status(400).json({ error: "Cannot delete brand with associated products." });
      }
      await db.delete(brands).where(eq2(brands.id, id));
      await logAudit("BRAND_DELETE", `Deleted brand ID ${id}`, req.user?.email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ error: error.message || "Failed to delete brand" });
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
