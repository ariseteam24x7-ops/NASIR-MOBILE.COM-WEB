import { db, createPool, setPostgresAvailable } from './index.ts';

export async function initDatabase() {
  try {
    const pool = createPool();

    // Fast probe to verify PostgreSQL is reachable before attempting schema queries
    await pool.query('SELECT 1');
    setPostgresAvailable(true);
    console.log('PostgreSQL database connected and verified successfully');

    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'owner',
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description_en TEXT DEFAULT '',
        description_ar TEXT DEFAULT '',
        icon TEXT DEFAULT 'Smartphone',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Brands table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        logo_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        sku TEXT NOT NULL UNIQUE,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description_en TEXT DEFAULT '',
        description_ar TEXT DEFAULT '',
        condition TEXT NOT NULL DEFAULT 'New',
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        is_new_arrival BOOLEAN DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'published',
        specifications JSONB DEFAULT '[]'::jsonb,
        variants JSONB DEFAULT '[]'::jsonb,
        images JSONB DEFAULT '[]'::jsonb,
        private_notes TEXT DEFAULT '',
        purchase_cost TEXT DEFAULT '',
        stock_quantity INTEGER DEFAULT 0,
        imei_serial_numbers JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Images storage table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. WhatsApp Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        id SERIAL PRIMARY KEY,
        primary_number TEXT NOT NULL DEFAULT '+971522523900',
        secondary_number TEXT NOT NULL DEFAULT '+971563903672',
        active_number TEXT NOT NULL DEFAULT '+971522523900',
        is_enabled BOOLEAN DEFAULT TRUE,
        template_en TEXT NOT NULL DEFAULT 'Hello Nasir Mobile Dubai! I am inquiring about the {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.',
        template_ar TEXT NOT NULL DEFAULT 'مرحباً ناصر موبايل دبي! أود الاستفسار عن {productName} ({brand}) [رمز المنتج: {sku}]. الحالة: {condition}. {variant}الرابط: {url}. يرجى تزويدي بالتفاصيل والتوفر.',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Site Content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id SERIAL PRIMARY KEY,
        hero_title_en TEXT NOT NULL DEFAULT 'Premium Technology & Smart Devices in Dubai',
        hero_title_ar TEXT NOT NULL DEFAULT 'أحدث الهواتف الذكية والتكنولوجيا في دبي',
        hero_subtitle_en TEXT DEFAULT 'Authorized retailer of original smartphones, luxury smartwatches, laptops, and certified accessories.',
        hero_subtitle_ar TEXT DEFAULT 'متجرك الموثوق لأحدث الهواتف الذكية والساعات الذكية وأجهزة الكمبيوتر المحمولة الأصلية مع الضمان المعتمد.',
        announcement_en TEXT DEFAULT 'Official Nasir Mobile Dubai • Visit our store in Deira Wholesale Market or order directly via WhatsApp',
        announcement_ar TEXT DEFAULT 'المتجر الرسمي لناصر موبايل دبي • تفضل بزيارة متجرنا في سوق ديرة للجملة أو اطلب عبر الواتساب مباشرة',
        announcement_active BOOLEAN DEFAULT TRUE,
        about_en TEXT DEFAULT 'Nasir Mobile Dubai is a certified electronic retailer operating in the heart of Dubai, UAE.',
        aboutAr TEXT DEFAULT 'ناصر موبايل دبي متجر معتمد في قلب تجارة الأجهزة الذكية بدبي، الإمارات العربية المتحدة.',
        contact_address_en TEXT DEFAULT 'Deira Commercial District, Wholesale Market Street, Dubai, United Arab Emirates',
        contact_address_ar TEXT DEFAULT 'منطقة ديرة التجارية، شارع سوق الجملة، دبي، الإمارات العربية المتحدة',
        contact_email TEXT DEFAULT 'contact@nasirmobile.com',
        opening_hours_en TEXT DEFAULT 'Sat - Thu: 10:00 AM - 11:00 PM | Fri: 4:00 PM - 11:00 PM',
        opening_hours_ar TEXT DEFAULT 'السبت - الخميس: 10:00 صباحاً - 11:00 مساءً | الجمعة: 4:00 عصراً - 11:00 مساءً',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Audit Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        user_email TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Visitor Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_settings (
        id SERIAL PRIMARY KEY,
        is_enabled BOOLEAN DEFAULT TRUE,
        display_mode TEXT DEFAULT 'both',
        today_adjustment INTEGER DEFAULT 0,
        total_adjustment INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Visitor Daily Stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_daily_stats (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        unique_visitors INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Visitor Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_logs (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        date TEXT NOT NULL,
        path TEXT DEFAULT '/',
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_visitor_logs_date_id ON visitor_logs(date, visitor_id);
    `);

    // 12. Security Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_settings (
        id SERIAL PRIMARY KEY,
        master_key TEXT DEFAULT 'NasirMobileDubai2026!',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default settings row if missing
    await pool.query(`
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

    setPostgresAvailable(true);
  } catch (_err) {
    setPostgresAvailable(false);
  }
}
