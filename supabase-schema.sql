-- ====================================================================
-- NASIR MOBILE DUBAI — COMPLETE SUPABASE DATABASE SETUP & MIGRATION
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_
-- 2. Navigate to "SQL Editor" on the left menu.
-- 3. Click "New Query", paste this entire script, and click "RUN".
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customer Profiles (Linked automatically with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  condition TEXT NOT NULL DEFAULT 'New' CHECK (condition IN ('New', 'Used', 'Refurbished')),
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id BIGINT REFERENCES public.brands(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  specifications JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  stock_quantity INT DEFAULT 1,
  purchase_cost NUMERIC(10, 2),
  private_notes TEXT,
  imei_serial_numbers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WhatsApp Inquiries Log
CREATE TABLE IF NOT EXISTS public.inquiries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  quick_question TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Automated Profile Creation Trigger
-- When a new user signs up in Supabase Auth, automatically insert a record into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories Policies: Authenticated users can view categories
DROP POLICY IF EXISTS "Public / Auth users can view categories" ON public.categories;
CREATE POLICY "Public / Auth users can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- Brands Policies: Authenticated users can view brands
DROP POLICY IF EXISTS "Public / Auth users can view brands" ON public.brands;
CREATE POLICY "Public / Auth users can view brands"
  ON public.brands FOR SELECT
  USING (true);

-- Products Policies: Authenticated users can view published products
DROP POLICY IF EXISTS "Allow users to view published products" ON public.products;
CREATE POLICY "Allow users to view published products"
  ON public.products FOR SELECT
  USING (status = 'published');

-- Inquiries Policies: Users can create and view their inquiries
DROP POLICY IF EXISTS "Allow authenticated users to create inquiries" ON public.inquiries;
CREATE POLICY "Allow authenticated users to create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users view their own inquiries" ON public.inquiries;
CREATE POLICY "Users view their own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- 9. Seed Categories
INSERT INTO public.categories (slug, name_en, name_ar, icon, display_order)
VALUES
  ('smartphones', 'Smartphones', 'الهواتف الذكية', 'Smartphone', 1),
  ('tablets', 'Tablets & iPads', 'الأجهزة اللوحية', 'Tablet', 2),
  ('smartwatches', 'Smartwatches', 'الساعات الذكية', 'Watch', 3),
  ('accessories', 'Premium Accessories', 'الإكسسوارات الفاخرة', 'Headphones', 4)
ON CONFLICT (slug) DO NOTHING;

-- 10. Seed Brands
INSERT INTO public.brands (slug, name)
VALUES
  ('apple', 'Apple'),
  ('samsung', 'Samsung'),
  ('google', 'Google Pixel'),
  ('xiaomi', 'Xiaomi'),
  ('oneplus', 'OnePlus')
ON CONFLICT (slug) DO NOTHING;

-- Complete! Your Supabase database is ready for Nasir Mobile Dubai.
