import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const translations: Record<string, { en: string; ar: string }> = {
  // Navigation & General
  brand_tagline: { en: 'Dubai, UAE • Technology Store', ar: 'دبي، الإمارات • متجر التكنولوجيا' },
  home: { en: 'Home', ar: 'الرئيسية' },
  catalogue: { en: 'Catalogue', ar: 'الكتالوج' },
  categories: { en: 'Categories', ar: 'الأقسام' },
  services: { en: 'Services', ar: 'الخدمات' },
  about_us: { en: 'About Us', ar: 'عن ناصر موبايل' },
  faq: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  contact: { en: 'Contact & Location', ar: 'التواصل والموقع' },
  admin_portal: { en: 'Owner Portal', ar: 'لوحة التحكم' },
  search_placeholder: { en: 'Search phones, accessories, brands...', ar: 'ابحث عن الهواتف، الإكسسوارات، العلامات...' },
  enquire_whatsapp: { en: 'Enquire on WhatsApp', ar: 'استفسر عبر واتساب' },
  direct_whatsapp_support: { en: 'WhatsApp Support', ar: 'دعم واتساب المباشر' },
  all_rights_reserved: { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },
  
  // Hero & Highlights
  hero_cta_browse: { en: 'Explore Devices', ar: 'استكشف الأجهزة' },
  hero_cta_whatsapp: { en: 'Chat with Specialist', ar: 'محادثة المستشار' },
  badge_authenticity: { en: '100% Genuine Devices', ar: 'أجهزة أصلية 100%' },
  badge_tested: { en: 'Tested & Certified Hardware', ar: 'مفحوصة ومعتمدة بالكامل' },
  badge_dubai: { en: 'Dubai Express Availability', ar: 'متوفر فورياً في دبي' },
  
  // Catalogue & Filters
  all_products: { en: 'All Products', ar: 'جميع المنتجات' },
  featured_products: { en: 'Featured Flagships', ar: 'أجهزة مختارة' },
  new_arrivals: { en: 'New Arrivals', ar: 'وصل حديثاً' },
  filter_by_condition: { en: 'Filter by Condition', ar: 'الحالة' },
  all_conditions: { en: 'All Conditions', ar: 'جميع الحالات' },
  cond_new: { en: 'Brand New', ar: 'جديد بالكرتون' },
  cond_used: { en: 'Used / Pre-Owned', ar: 'مستعمل معتمد' },
  cond_refurbished: { en: 'Certified Refurbished', ar: 'مجدد مضمون' },
  all_brands: { en: 'All Brands', ar: 'جميع العلامات' },
  sort_by: { en: 'Sort by', ar: 'ترتيب حسب' },
  sort_newest: { en: 'Newest Arrivals', ar: 'الأحدث' },
  sort_name_asc: { en: 'Name (A to Z)', ar: 'الاسم (أ إلى ي)' },
  sort_name_desc: { en: 'Name (Z to A)', ar: 'الاسم (ي إلى أ)' },
  clear_filters: { en: 'Clear Filters', ar: 'إعادة ضبط' },
  products_count: { en: 'products found', ar: 'منتج معروض' },
  no_products_title: { en: 'No products currently listed', ar: 'لا توجد منتجات مسجلة حالياً' },
  no_products_desc: { 
    en: 'Our stock in Dubai is updated daily. Please click below to ask our store team directly on WhatsApp for availability and specific device requests.', 
    ar: 'يتم تحديث مخزوننا في دبي يومياً. يرجى الضغط أدناه للاستفسار مباشرة عبر واتساب عن التوفر وأي جهاز تبحث عنه.' 
  },
  ask_stock_whatsapp: { en: 'Ask on WhatsApp for Stock', ar: 'استفسر عبر واتساب عن التوفر' },
  view_details: { en: 'View Specifications', ar: 'عرض المواصفات' },
  sku_label: { en: 'SKU', ar: 'رمز المنتج' },

  // Product Details
  condition_label: { en: 'Condition', ar: 'الحالة' },
  specifications: { en: 'Specifications', ar: 'المواصفات الفنية' },
  description: { en: 'Overview & Details', ar: 'نبذة عن الجهاز' },
  select_variant: { en: 'Select Option', ar: 'اختر الخيار' },
  related_products: { en: 'Related Devices', ar: 'أجهزة مشابهة' },
  no_specs_listed: { en: 'Technical specifications available upon enquiry.', ar: 'المواصفات متوفرة عند الاستفسار.' },
  privacy_notice: {
    en: 'Catalogue view only. Prices & availability confirmed instantly via WhatsApp.',
    ar: 'كتالوج استعراض فقط. يتم تأكيد السعر والتوفر فورياً عبر واتساب.'
  },
  
  // Contact & Location
  call_or_whatsapp: { en: 'Call or WhatsApp', ar: 'اتصل أو راسلنا عبر واتساب' },
  primary_line: { en: 'Primary Sales Line', ar: 'خط المبيعات الرئيسي' },
  secondary_line: { en: 'Secondary Support Line', ar: 'خط الدعم الثاني' },
  store_location: { en: 'Store Location', ar: 'موقع المتجر' },
  store_hours: { en: 'Business Hours', ar: 'ساعات العمل' },
  email_address: { en: 'Email Inquiries', ar: 'البريد الإلكتروني' },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  dir: 'ltr',
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nm_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nm_language', lang);
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
