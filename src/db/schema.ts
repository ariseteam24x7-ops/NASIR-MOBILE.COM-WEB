import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  int,
  json,
  longtext,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

// Users table (Admin / Owner accounts)
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  uid: varchar('uid', { length: 191 }).notNull().unique(), // Firebase Auth UID or internal owner ID
  email: varchar('email', { length: 191 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('owner'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories table
export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 191 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }).notNull(),
  descriptionEn: text('description_en').default(''),
  descriptionAr: text('description_ar').default(''),
  icon: varchar('icon', { length: 100 }).default('Smartphone'),
  displayOrder: int('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Brands table
export const brands = mysqlTable('brands', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 191 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = mysqlTable(
  'products',
  {
    id: int('id').autoincrement().primaryKey(),
    slug: varchar('slug', { length: 191 }).notNull().unique(),
    sku: varchar('sku', { length: 191 }).notNull().unique(),
    nameEn: varchar('name_en', { length: 255 }).notNull(),
    nameAr: varchar('name_ar', { length: 255 }).notNull(),
    descriptionEn: text('description_en').default(''),
    descriptionAr: text('description_ar').default(''),
    condition: varchar('condition', { length: 50 }).notNull().default('New'), // 'New', 'Used', 'Refurbished'
    categoryId: int('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    brandId: int('brand_id').references(() => brands.id, { onDelete: 'restrict' }),
    isFeatured: boolean('is_featured').default(false),
    isNewArrival: boolean('is_new_arrival').default(false),
    status: varchar('status', { length: 50 }).notNull().default('published'), // 'draft', 'published', 'archived'
    // Controls public customer visibility independently from status so historical items can remain hidden
    storefrontVisible: boolean('storefront_visible').notNull().default(false),
    // Optimistic concurrency control version
    version: int('version').notNull().default(1),
    specifications: json('specifications').$type<any[]>(), // Array of { keyEn, keyAr, valueEn, valueAr }
    variants: json('variants').$type<any[]>(), // Array of { nameEn, nameAr, options: string[] }
    images: json('images').$type<any[]>(), // Array of image URLs or /uploads/:fileName
    // Absolute private owner fields (NEVER exposed to public catalogue APIs)
    privateNotes: text('private_notes').default(''),
    purchaseCost: varchar('purchase_cost', { length: 100 }).default(''),
    stockQuantity: int('stock_quantity').default(0),
    imeiSerialNumbers: json('imei_serial_numbers').$type<any[]>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    categoryIdIdx: index('products_category_id_idx').on(table.categoryId),
    brandIdIdx: index('products_brand_id_idx').on(table.brandId),
    statusIdx: index('products_status_idx').on(table.status),
    storefrontVisibleIdx: index('products_storefront_visible_idx').on(table.storefrontVisible),
  })
);

// Persistent image storage table - LONGTEXT required for Base64 image payloads (up to 4GB)
export const images = mysqlTable(
  'images',
  {
    id: int('id').autoincrement().primaryKey(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    data: longtext('data').notNull(), // Base64 data URI string
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    fileNameIdx: index('images_file_name_idx').on(table.fileName),
  })
);

// WhatsApp Settings
export const whatsappSettings = mysqlTable('whatsapp_settings', {
  id: int('id').autoincrement().primaryKey(),
  primaryNumber: varchar('primary_number', { length: 50 }).notNull().default('+971522523900'),
  secondaryNumber: varchar('secondary_number', { length: 50 }).notNull().default('+971563903672'),
  activeNumber: varchar('active_number', { length: 50 }).notNull().default('+971522523900'),
  isEnabled: boolean('is_enabled').default(true),
  templateEn: text('template_en').notNull(),
  templateAr: text('template_ar').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Website Content
export const siteContent = mysqlTable('site_content', {
  id: int('id').autoincrement().primaryKey(),
  heroTitleEn: text('hero_title_en').notNull(),
  heroTitleAr: text('hero_title_ar').notNull(),
  heroSubtitleEn: text('hero_subtitle_en').notNull(),
  heroSubtitleAr: text('hero_subtitle_ar').notNull(),
  announcementEn: text('announcement_en').default(''),
  announcementAr: text('announcement_ar').default(''),
  announcementActive: boolean('announcement_active').default(true),
  aboutEn: text('about_en').notNull(),
  aboutAr: text('about_ar').notNull(),
  contactAddressEn: text('contact_address_en').notNull(),
  contactAddressAr: text('contact_address_ar').notNull(),
  contactEmail: varchar('contact_email', { length: 191 }).notNull().default('shazzzbusiness@gmail.com'),
  openingHoursEn: text('opening_hours_en').notNull(),
  openingHoursAr: text('opening_hours_ar').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Audit Logs
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 191 }).default(''),
    userEmail: varchar('user_email', { length: 191 }).default(''),
    action: varchar('action', { length: 100 }).notNull(),
    details: text('details').default(''),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

// Visitor Counter Settings (Admin adjustments & display mode)
export const visitorSettings = mysqlTable('visitor_settings', {
  id: int('id').autoincrement().primaryKey(),
  isEnabled: boolean('is_enabled').default(true),
  displayMode: varchar('display_mode', { length: 50 }).default('both'), // 'both', 'today', 'total'
  todayAdjustment: int('today_adjustment').default(0),
  totalAdjustment: int('total_adjustment').default(0),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Visitor Daily Aggregations (Date in Asia/Dubai YYYY-MM-DD)
export const visitorDailyStats = mysqlTable('visitor_daily_stats', {
  id: int('id').autoincrement().primaryKey(),
  date: varchar('date', { length: 50 }).notNull().unique(),
  uniqueVisitors: int('unique_visitors').default(0),
  pageViews: int('page_views').default(0),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Anonymous Visitor Logs (Deduplication within same day)
export const visitorLogs = mysqlTable(
  'visitor_logs',
  {
    id: int('id').autoincrement().primaryKey(),
    visitorId: varchar('visitor_id', { length: 191 }).notNull(),
    date: varchar('date', { length: 50 }).notNull(),
    path: varchar('path', { length: 255 }).default('/'),
    userAgent: text('user_agent').default(''),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    dateIdx: index('visitor_logs_date_idx').on(table.date),
  })
);

// Security Settings table (Custom Master Setup Key)
export const securitySettings = mysqlTable('security_settings', {
  id: int('id').autoincrement().primaryKey(),
  masterKey: text('master_key'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Relationships
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
}));
