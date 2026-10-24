import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table (Admin / Owner accounts)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal owner ID
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('owner'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en').default(''),
  descriptionAr: text('description_ar').default(''),
  icon: text('icon').default('Smartphone'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Brands table
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  logoUrl: text('logo_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en').default(''),
  descriptionAr: text('description_ar').default(''),
  condition: text('condition').notNull().default('New'), // 'New', 'Used', 'Refurbished'
  categoryId: integer('category_id').references(() => categories.id),
  brandId: integer('brand_id').references(() => brands.id),
  isFeatured: boolean('is_featured').default(false),
  isNewArrival: boolean('is_new_arrival').default(false),
  status: text('status').notNull().default('published'), // 'draft', 'published', 'archived'
  specifications: jsonb('specifications').default('[]'), // Array of { keyEn, keyAr, valueEn, valueAr }
  variants: jsonb('variants').default('[]'), // Array of { nameEn, nameAr, options: string[] }
  images: jsonb('images').default('[]'), // Array of image URLs or /api/images/:id
  // Absolute private owner fields (NEVER exposed to public catalogue APIs)
  privateNotes: text('private_notes').default(''),
  purchaseCost: text('purchase_cost').default(''),
  stockQuantity: integer('stock_quantity').default(0),
  imeiSerialNumbers: jsonb('imei_serial_numbers').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Persistent image storage table
export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  data: text('data').notNull(), // Base64 data URI or buffer representation
  createdAt: timestamp('created_at').defaultNow(),
});

// WhatsApp Settings
export const whatsappSettings = pgTable('whatsapp_settings', {
  id: serial('id').primaryKey(),
  primaryNumber: text('primary_number').notNull().default('+971522523900'),
  secondaryNumber: text('secondary_number').notNull().default('+971563903672'),
  activeNumber: text('active_number').notNull().default('+971522523900'),
  isEnabled: boolean('is_enabled').default(true),
  templateEn: text('template_en').notNull().default(
    'Hello Nasir Mobile Dubai! I am inquiring about the {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.'
  ),
  templateAr: text('template_ar').notNull().default(
    'مرحباً ناصر موبايل دبي! أود الاستفسار عن {productName} ({brand}) [رمز المنتج: {sku}]. الحالة: {condition}. {variant}الرابط: {url}. يرجى تزويدي بالتفاصيل والتوفر.'
  ),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Website Content
export const siteContent = pgTable('site_content', {
  id: serial('id').primaryKey(),
  heroTitleEn: text('hero_title_en').notNull().default('Premium Technology & Smart Devices in Dubai'),
  heroTitleAr: text('hero_title_ar').notNull().default('أحدث الهواتف الذكية والتكنولوجيا في دبي'),
  heroSubtitleEn: text('hero_subtitle_en').notNull().default('Explore genuine new, used, and certified refurbished flagship devices, luxury audio, and authentic accessories at Nasir Mobile.'),
  heroSubtitleAr: text('hero_subtitle_ar').notNull().default('استكشف أحدث الهواتف الأصلية الجديدة والمستعملة والمجددة، وأجهزة الصوت الراقية والإكسسوارات المعتمدة لدى ناصر موبايل.'),
  announcementEn: text('announcement_en').default('Welcome to Nasir Mobile Dubai • Direct WhatsApp Enquiries • Guaranteed Authenticity'),
  announcementAr: text('announcement_ar').default('أهلاً بكم في ناصر موبايل دبي • استفسار فوري عبر واتساب • أجهزة أصلية معتمدة'),
  announcementActive: boolean('announcement_active').default(true),
  aboutEn: text('about_en').notNull().default(
    'Nasir Mobile is Dubai’s trusted destination for smartphones, tablets, premium accessories, and certified electronics. Located in the heart of Dubai, UAE, we deliver exceptional customer care, guaranteed authentic hardware, and personalized consultation for both new and refurbished devices.'
  ),
  aboutAr: text('about_ar').notNull().default(
    'ناصر موبايل هي وجهتك الموثوقة للهواتف الذكية والأجهزة اللوحية والإكسسوارات والإلكترونيات المعتمدة في دبي، الإمارات العربية المتحدة. نحرص على تقديم أفضل خدمة عملاء وضمان الأجهزة الأصلية الجديدة والمجددة مع استشارة مباشرة عبر واتساب.'
  ),
  contactAddressEn: text('contact_address_en').notNull().default('Deira / Dubai Silicon Oasis, Dubai, United Arab Emirates (Contact for store visit)'),
  contactAddressAr: text('contact_address_ar').notNull().default('ديرة / واحة دبي للسيليكون، دبي، الإمارات العربية المتحدة (تواصل معنا لزيارة المعرض)'),
  contactEmail: text('contact_email').notNull().default('shazzzbusiness@gmail.com'),
  openingHoursEn: text('opening_hours_en').notNull().default('Saturday - Thursday: 10:00 AM - 10:30 PM | Friday: 3:00 PM - 10:30 PM'),
  openingHoursAr: text('opening_hours_ar').notNull().default('السبت - الخميس: 10:00 صباحاً - 10:30 مساءً | الجمعة: 3:00 عصراً - 10:30 مساءً'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').default(''),
  userEmail: text('user_email').default(''),
  action: text('action').notNull(),
  details: text('details').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Visitor Counter Settings (Admin adjustments & display mode)
export const visitorSettings = pgTable('visitor_settings', {
  id: serial('id').primaryKey(),
  isEnabled: boolean('is_enabled').default(true),
  displayMode: text('display_mode').default('both'), // 'both', 'today', 'total'
  todayAdjustment: integer('today_adjustment').default(0),
  totalAdjustment: integer('total_adjustment').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Visitor Daily Aggregations (Date in Asia/Dubai YYYY-MM-DD)
export const visitorDailyStats = pgTable('visitor_daily_stats', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(),
  uniqueVisitors: integer('unique_visitors').default(0),
  pageViews: integer('page_views').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Anonymous Visitor Logs (Deduplication within same day)
export const visitorLogs = pgTable('visitor_logs', {
  id: serial('id').primaryKey(),
  visitorId: text('visitor_id').notNull(),
  date: text('date').notNull(),
  path: text('path').default('/'),
  userAgent: text('user_agent').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Security Settings table (Custom Master Setup Key)
export const securitySettings = pgTable('security_settings', {
  id: serial('id').primaryKey(),
  masterKey: text('master_key').default('NasirMobileDubai2026!'),
  updatedAt: timestamp('updated_at').defaultNow(),
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
