/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { BrandFilterBar } from './components/BrandFilterBar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { VisitorCounter } from './components/VisitorCounter.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import {
  Product,
  Category,
  Brand,
  WhatsAppSettings,
  SiteContent,
  ProductCondition,
} from './types/index.ts';
import { buildWhatsAppUrl } from './lib/whatsapp.ts';
import {
  MessageCircle,
  Search,
  Filter,
  Sparkles,
  Smartphone,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

// SEO & Social OpenGraph Helper Functions
function updateMeta(nameOrProp: { name?: string; property?: string }, content: string) {
  const selector = nameOrProp.name
    ? `meta[name="${nameOrProp.name}"]`
    : `meta[property="${nameOrProp.property}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (nameOrProp.name) el.setAttribute('name', nameOrProp.name);
    if (nameOrProp.property) el.setAttribute('property', nameOrProp.property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function updateJsonLd(data: object) {
  let script = document.getElementById('seo-json-ld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'seo-json-ld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function StoreApp() {
  const { language, t } = useLanguage();

  // Scroll progress indicator (must be declared at top level with all React hooks)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // App Route View: 'store' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState<'store' | 'admin-login' | 'admin'>('store');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);

  // Catalogue Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | undefined>(undefined);
  const [siteContent, setSiteContent] = useState<SiteContent | undefined>(undefined);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [selectedBrandSlug, setSelectedBrandSlug] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'featured' | 'new-arrivals'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'name-desc'>('newest');

  // Modal State for Product Details
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Check initial admin session on load
  useEffect(() => {
    const savedToken = localStorage.getItem('nm_admin_token');
    const savedUser = localStorage.getItem('nm_admin_user');
    if (savedToken && savedUser) {
      try {
        setAdminToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('nm_admin_token');
        localStorage.removeItem('nm_admin_user');
      }
    }

    // Check URL route or hash for /admin or #admin
    const isPathAdmin = window.location.pathname.startsWith('/admin');
    const isHashAdmin = window.location.hash === '#admin' || window.location.hash === '#admin-panel';
    const isHashLogin = window.location.hash === '#admin-login' || window.location.hash === '#login';

    if (isPathAdmin || isHashAdmin) {
      if (savedToken) {
        setCurrentView('admin');
      } else {
        setCurrentView('admin-login');
      }
    } else if (isHashLogin) {
      setCurrentView('admin-login');
    }
  }, []);

  // Fetch Public Metadata & Settings
  useEffect(() => {
    // Categories
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load categories', err));

    // Brands
    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load brands', err));

    // WhatsApp Settings
    fetch('/api/whatsapp-settings')
      .then((r) => r.json())
      .then((data) => setWhatsAppSettings(data))
      .catch((err) => console.error('Failed to load whatsapp settings', err));

    // Site Content
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((data) => setSiteContent(data))
      .catch((err) => console.error('Failed to load site content', err));
  }, []);

  // Fetch Catalogue Products with active filters
  const fetchProductsCatalogue = () => {
    setLoadingProducts(true);
    const params = new URLSearchParams();
    if (selectedCategorySlug) params.set('category', selectedCategorySlug);
    if (selectedBrandSlug) params.set('brand', selectedBrandSlug);
    if (selectedCondition !== 'all') params.set('condition', selectedCondition);
    if (selectedTab === 'featured') params.set('featured', 'true');
    if (selectedTab === 'new-arrivals') params.set('newArrival', 'true');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (sortBy) params.set('sort', sortBy);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error('Failed to fetch catalogue products', err);
        setLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProductsCatalogue();
  }, [
    selectedCategorySlug,
    selectedBrandSlug,
    selectedCondition,
    selectedTab,
    searchQuery,
    sortBy,
  ]);

  // Open Product Details & check related items
  const handleOpenProduct = (product: Product) => {
    setActiveProduct(product);
    window.history.replaceState(null, '', `#product-${product.slug}`);
    if (product.categoryId) {
      const rel = products.filter(
        (p) => p.categoryId === product.categoryId && p.id !== product.id
      );
      setRelatedProducts(rel.slice(0, 4));
    } else {
      setRelatedProducts([]);
    }
  };

  const handleCloseProductModal = () => {
    setActiveProduct(null);
    if (window.location.hash.startsWith('#product-')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Check URL hash for routing and product deep-linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const isPathAdmin = window.location.pathname.startsWith('/admin');

      if (hash === '#admin' || hash === '#owner' || hash === '#portal' || hash === '#admin-panel' || isPathAdmin) {
        const savedToken = localStorage.getItem('nm_admin_token');
        if (savedToken) {
          setCurrentView('admin');
        } else {
          setCurrentView('admin-login');
        }
      } else if (hash === '#admin-login' || hash === '#login') {
        setCurrentView('admin-login');
      } else if (hash.startsWith('#product-')) {
        const slug = hash.replace('#product-', '');
        fetch(`/api/products/${slug}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.product) {
              setActiveProduct(data.product);
              setRelatedProducts(data.related || []);
            }
          })
          .catch((e) => console.error(e));
      } else {
        if (activeProduct && hash === '') {
          setActiveProduct(null);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeProduct]);

  // Discrete keyboard shortcut for Owner Portal (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleNavigateToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamically inject OpenGraph, Twitter, canonical, and Schema.org SEO tags based on activeProduct
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nasirmobile.com';

    if (activeProduct) {
      const isAr = language === 'ar';
      const productName = isAr ? activeProduct.nameAr || activeProduct.nameEn : activeProduct.nameEn;
      const conditionLabel = activeProduct.condition;
      const pageTitle = `${productName} (${conditionLabel}) | Nasir Mobile Dubai`;
      const desc =
        (isAr ? activeProduct.descriptionAr : activeProduct.descriptionEn) ||
        (isAr
          ? `استكشف ${productName} (${conditionLabel}) لدى ناصر موبايل في دبي. أجهزة أصلية معتمدة مع استفسار فوري عبر واتساب.`
          : `Explore ${productName} (${conditionLabel}) at Nasir Mobile Dubai. Certified genuine tech with direct WhatsApp inquiry.`);

      const productUrl = `${origin}/#product-${activeProduct.slug}`;
      const firstImage = activeProduct.images && activeProduct.images.length > 0 ? activeProduct.images[0] : '';
      const resolvedImage = firstImage
        ? firstImage.startsWith('http')
          ? firstImage
          : `${origin}${firstImage}`
        : `${origin}/og-image.jpg`;

      // 1. Page Title
      document.title = pageTitle;

      // 2. Standard Meta Description
      updateMeta({ name: 'description' }, desc);

      // 3. OpenGraph Tags
      updateMeta({ property: 'og:title' }, pageTitle);
      updateMeta({ property: 'og:description' }, desc);
      updateMeta({ property: 'og:type' }, 'product');
      updateMeta({ property: 'og:url' }, productUrl);
      updateMeta({ property: 'og:site_name' }, 'Nasir Mobile Dubai');
      if (resolvedImage) {
        updateMeta({ property: 'og:image' }, resolvedImage);
        updateMeta({ property: 'og:image:alt' }, productName);
      }

      // 4. Twitter Card Tags
      updateMeta({ name: 'twitter:card' }, 'summary_large_image');
      updateMeta({ name: 'twitter:title' }, pageTitle);
      updateMeta({ name: 'twitter:description' }, desc);
      if (resolvedImage) {
        updateMeta({ name: 'twitter:image' }, resolvedImage);
      }

      // 5. Canonical Link
      updateCanonical(productUrl);

      // 6. Schema.org Product Structured Data (Strictly privacy compliant: no prices, costs, or serials)
      const conditionSchema =
        activeProduct.condition === 'New'
          ? 'https://schema.org/NewCondition'
          : activeProduct.condition === 'Refurbished'
          ? 'https://schema.org/RefurbishedCondition'
          : 'https://schema.org/UsedCondition';

      const jsonLdData: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productName,
        description: desc,
        sku: activeProduct.sku,
        itemCondition: conditionSchema,
        brand: {
          '@type': 'Brand',
          name: activeProduct.brandName || 'Nasir Mobile',
        },
      };

      if (resolvedImage) {
        jsonLdData.image = [resolvedImage];
      }
      if (activeProduct.categoryNameEn) {
        jsonLdData.category = activeProduct.categoryNameEn;
      }

      updateJsonLd(jsonLdData);
    } else {
      // Default Site SEO
      const defaultTitle = 'Nasir Mobile Dubai — Premium Technology & Smart Devices';
      const defaultDesc =
        siteContent?.heroSubtitleEn ||
        'Premium technology store catalogue in Dubai, UAE. Discover mobile phones, accessories, smartwatches, and electronics with direct WhatsApp enquiry.';
      const siteUrl = `${origin}/`;

      document.title = defaultTitle;
      updateMeta({ name: 'description' }, defaultDesc);
      updateMeta({ property: 'og:title' }, defaultTitle);
      updateMeta({ property: 'og:description' }, defaultDesc);
      updateMeta({ property: 'og:type' }, 'website');
      updateMeta({ property: 'og:url' }, siteUrl);
      updateMeta({ property: 'og:site_name' }, 'Nasir Mobile Dubai');
      updateMeta({ name: 'twitter:card' }, 'summary_large_image');
      updateMeta({ name: 'twitter:title' }, defaultTitle);
      updateMeta({ name: 'twitter:description' }, defaultDesc);

      updateCanonical(siteUrl);

      updateJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'Nasir Mobile Dubai',
        description: defaultDesc,
        telephone: '+971522523900',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai',
          addressCountry: 'AE',
        },
        url: siteUrl,
      });
    }
  }, [activeProduct, siteContent, language]);

  // Admin Navigation
  const handleNavigateToAdmin = () => {
    window.location.hash = '#admin';
    const savedToken = localStorage.getItem('nm_admin_token');
    const savedUser = localStorage.getItem('nm_admin_user');
    if (savedToken && savedUser) {
      try {
        setAdminToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
        setCurrentView('admin');
      } catch {
        setCurrentView('admin-login');
      }
    } else {
      setCurrentView('admin-login');
    }
  };

  // Admin Login Success
  const handleAdminLoginSuccess = (token: string, user: { email: string; role: string }) => {
    localStorage.setItem('nm_admin_token', token);
    localStorage.setItem('nm_admin_user', JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
    window.location.hash = '#admin';
    setCurrentView('admin');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    localStorage.removeItem('nm_admin_token');
    localStorage.removeItem('nm_admin_user');
    setAdminToken(null);
    setAdminUser(null);
    window.location.hash = '';
    setCurrentView('store');
  };

  // Render Admin Login View
  if (currentView === 'admin-login') {
    return (
      <AdminLogin
        onSuccess={handleAdminLoginSuccess}
        onBackToStore={() => {
          window.location.hash = '';
          setCurrentView('store');
        }}
      />
    );
  }

  // Render Admin Dashboard View
  if (currentView === 'admin') {
    if (!adminToken || !adminUser) {
      return (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onBackToStore={() => {
            window.location.hash = '';
            setCurrentView('store');
          }}
        />
      );
    }
    return (
      <AdminDashboard
        token={adminToken}
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onViewPublicSite={() => {
          window.location.hash = '';
          setCurrentView('store');
        }}
      />
    );
  }

  // General WhatsApp URL for empty state inquiry
  const generalWhatsAppUrl = buildWhatsAppUrl({
    settings: whatsAppSettings,
    lang: language,
  });

  return (
    <div className="min-h-screen bg-[#151419] text-white flex flex-col selection:bg-[#922CB5] selection:text-white">
      {/* Scroll-based Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#922CB5] via-[#B7F34B] to-[#922CB5] origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />

      {/* Header */}
      <Header
        whatsAppSettings={whatsAppSettings}
        siteContent={siteContent}
        onNavigateToAdmin={handleNavigateToAdmin}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Hero Section */}
      <Hero
        siteContent={siteContent}
        whatsAppSettings={whatsAppSettings}
        onExploreClick={() => {
          const catEl = document.getElementById('catalogue');
          if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Category Navigation Bar */}
      <CategoryNav
        categories={categories}
        selectedCategorySlug={selectedCategorySlug}
        onSelectCategory={(slug) => setSelectedCategorySlug(slug)}
      />

      {/* MAIN CATALOGUE SECTION */}
      <section id="catalogue" className="py-16 bg-[#18161d] border-b border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header with In-View Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#391548] text-[#B7F34B] text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('catalogue')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                {selectedCategorySlug
                  ? categories.find((c) => c.slug === selectedCategorySlug)?.nameEn || t('all_products')
                  : t('all_products')}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {language === 'ar'
                  ? 'كتالوج الأجهزة المعتمدة في دبي • يتم تأكيد السعر والتوفر فورياً عبر واتساب'
                  : 'Certified devices available at Nasir Mobile Dubai • Inquire directly on WhatsApp'}
              </p>
            </div>

            {/* Filter Tabs: All, Featured, New Arrivals */}
            <div className="flex items-center gap-2 bg-[#242129] p-1.5 rounded-2xl border border-white/5 self-start md:self-auto">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-[#922CB5] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('all_products')}
              </button>
              <button
                onClick={() => setSelectedTab('featured')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTab === 'featured'
                    ? 'bg-[#922CB5] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('featured_products')}
              </button>
              <button
                onClick={() => setSelectedTab('new-arrivals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTab === 'new-arrivals'
                    ? 'bg-[#922CB5] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('new_arrivals')}
              </button>
            </div>
          </motion.div>

          {/* Visual Brand Badges Filter Bar */}
          <BrandFilterBar
            brands={brands}
            selectedBrandSlug={selectedBrandSlug}
            onSelectBrand={(slug) => setSelectedBrandSlug(slug)}
          />

          {/* Sub-Filters: Condition, Brand, Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#242129] border border-white/5 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              {/* Condition Filter */}
              <div className="flex items-center gap-1.5 bg-[#151419] px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                <span className="text-zinc-400 font-semibold">{t('condition_label')}:</span>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#151419]">{t('all_conditions')}</option>
                  <option value="New" className="bg-[#151419]">{t('cond_new')}</option>
                  <option value="Refurbished" className="bg-[#151419]">{t('cond_refurbished')}</option>
                  <option value="Used" className="bg-[#151419]">{t('cond_used')}</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div className="flex items-center gap-1.5 bg-[#151419] px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                <span className="text-zinc-400 font-semibold">Brand:</span>
                <select
                  value={selectedBrandSlug}
                  onChange={(e) => setSelectedBrandSlug(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#151419]">{t('all_brands')}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug} className="bg-[#151419]">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button if any active */}
              {(selectedCategorySlug || selectedBrandSlug || selectedCondition !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategorySlug('');
                    setSelectedBrandSlug('');
                    setSelectedCondition('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>

            {/* Sort & Count */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-400 font-mono">
                {products.length} {t('products_count')}
              </span>

              <div className="flex items-center gap-1.5 bg-[#151419] px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-zinc-400 font-semibold">{t('sort_by')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-[#151419]">{t('sort_newest')}</option>
                  <option value="name-asc" className="bg-[#151419]">{t('sort_name_asc')}</option>
                  <option value="name-desc" className="bg-[#151419]">{t('sort_name_desc')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* PRODUCT CARDS GRID OR PROFESSIONAL EMPTY STATE */}
          {loadingProducts ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-[#922CB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">
                Loading Nasir Mobile Catalogue...
              </p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  whatsAppSettings={whatsAppSettings}
                  onOpenDetails={handleOpenProduct}
                />
              ))}
            </div>
          ) : (
            /* Professional Empty State */
            <div className="py-16 sm:py-24 px-6 text-center max-w-xl mx-auto rounded-3xl bg-[#242129]/60 border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-[#151419] border border-white/10 flex items-center justify-center text-[#B7F34B] mx-auto mb-5 shadow-inner">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
                {t('no_products_title')}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-8">
                {t('no_products_desc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={generalWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-102"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>{t('ask_stock_whatsapp')}</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedCategorySlug('');
                    setSelectedBrandSlug('');
                    setSelectedCondition('all');
                    setSearchQuery('');
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider"
                >
                  {t('clear_filters')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <ServicesSection whatsAppSettings={whatsAppSettings} />

      {/* About Section */}
      <AboutSection siteContent={siteContent} />

      {/* FAQ Section */}
      <FaqSection />

      {/* Contact Section */}
      <ContactSection
        whatsAppSettings={whatsAppSettings}
        siteContent={siteContent}
      />

      {/* Real-time Website Visitor Counter */}
      <VisitorCounter />

      {/* Footer */}
      <Footer
        whatsAppSettings={whatsAppSettings}
        onNavigateToAdmin={handleNavigateToAdmin}
      />

      {/* Product Detail Modal */}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          relatedProducts={relatedProducts}
          whatsAppSettings={whatsAppSettings}
          onClose={handleCloseProductModal}
          onSelectProduct={(p) => handleOpenProduct(p)}
        />
      )}

      {/* Floating Sticky WhatsApp Button */}
      {whatsAppSettings?.isEnabled !== false && (
        <a
          href={generalWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_5px_25px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          title={t('enquire_whatsapp')}
        >
          <MessageCircle className="w-6 h-6 fill-current" />
          <span className="hidden sm:inline font-black text-xs uppercase tracking-wider">
            WhatsApp
          </span>
        </a>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreApp />
    </LanguageProvider>
  );
}
