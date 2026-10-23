export const FALLBACK_CATEGORIES = [
  {
    id: 1,
    slug: 'smartphones',
    nameEn: 'Smartphones',
    nameAr: 'الهواتف الذكية',
    descriptionEn: 'Flagship & high-performance smartphones from Apple, Samsung, Google & more.',
    descriptionAr: 'أحدث الهواتف الذكية الرائدة من آبل وسامسونج وجوجل وغيرها.',
    icon: 'Smartphone',
    displayOrder: 1,
  },
  {
    id: 2,
    slug: 'tablets',
    nameEn: 'Tablets & iPads',
    nameAr: 'الأجهزة اللوحية',
    descriptionEn: 'Apple iPads and high-tier productivity Android tablets.',
    descriptionAr: 'أجهزة الآيباد وأقوى الأجهزة اللوحية للإنتاجية والعمل.',
    icon: 'Tablet',
    displayOrder: 2,
  },
  {
    id: 3,
    slug: 'smartwatches',
    nameEn: 'Smartwatches',
    nameAr: 'الساعات الذكية',
    descriptionEn: 'Luxury smart wearables, Apple Watch Ultra & Galaxy Watch series.',
    descriptionAr: 'ساعات آبل وسامسونج الذكية الفاخرة المجهزة بكافة ميزات الصحة.',
    icon: 'Watch',
    displayOrder: 3,
  },
  {
    id: 4,
    slug: 'accessories',
    nameEn: 'Premium Accessories',
    nameAr: 'الإكسسوارات الفاخرة',
    descriptionEn: 'Original MagSafe chargers, GaN power adapters, AirPods, and protective cases.',
    descriptionAr: 'شواحن ماج سيف وسماعات أصلية وكفرات حماية فاخرة معتمدة.',
    icon: 'Headphones',
    displayOrder: 4,
  },
];

export const FALLBACK_BRANDS = [
  {
    id: 1,
    slug: 'apple',
    name: 'Apple',
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    slug: 'samsung',
    name: 'Samsung',
    logoUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    slug: 'google',
    name: 'Google Pixel',
    logoUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    slug: 'xiaomi',
    name: 'Xiaomi',
    logoUrl: '',
  },
  {
    id: 5,
    slug: 'oneplus',
    name: 'OnePlus',
    logoUrl: '',
  },
];

export const FALLBACK_WHATSAPP = {
  primaryNumber: '+971522523900',
  secondaryNumber: '+971563903672',
  activeNumber: '+971522523900',
  isEnabled: true,
  templateEn:
    'Hello Nasir Mobile Dubai! I am inquiring about {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.',
  templateAr:
    'مرحباً ناصر موبايل دبي! أود الاستفسار عن {productName} ({brand}) [رمز المنتج: {sku}]. الحالة: {condition}. {variant}الرابط: {url}. يرجى تزويدي بالتفاصيل والتوفر.',
};

export const FALLBACK_SITE_CONTENT = {
  heroTitleEn: 'Premium Technology & Smart Devices in Dubai',
  heroTitleAr: 'أحدث الهواتف الذكية والتكنولوجيا في دبي',
  heroSubtitleEn:
    'Authorized retailer of original smartphones, luxury smartwatches, laptops, and certified accessories with full Dubai warranty.',
  heroSubtitleAr:
    'متجرك الموثوق لأحدث الهواتف الذكية والساعات الذكية وأجهزة الكمبيوتر المحمولة الأصلية مع الضمان المعتمد.',
  announcementEn:
    'Official Nasir Mobile Dubai • Visit our store in Deira Wholesale Market or order directly via WhatsApp',
  announcementAr:
    'المتجر الرسمي لناصر موبايل دبي • تفضل بزيارة متجرنا في سوق ديرة للجملة أو اطلب عبر الواتساب مباشرة',
  announcementActive: true,
  aboutEn:
    'Nasir Mobile Dubai is a certified electronic retailer operating in the heart of Dubai, UAE. We specialize in official GCC and international specifications smartphones, genuine sealed devices, and verified pre-owned items.',
  aboutAr:
    'ناصر موبايل دبي متجر معتمد في قلب تجارة الأجهزة الذكية بدبي، الإمارات العربية المتحدة. متخصصون في توفير أحدث الهواتف بالمواصفات الخليجية والدولية والأجهزة المعتمدة.',
  contactAddressEn:
    'Deira Commercial District, Wholesale Market Street, Dubai, United Arab Emirates',
  contactAddressAr:
    'منطقة ديرة التجارية، شارع سوق الجملة، دبي، الإمارات العربية المتحدة',
  contactEmail: 'shazzzbusiness@gmail.com',
  openingHoursEn: 'Sat - Thu: 10:00 AM - 11:00 PM | Fri: 4:00 PM - 11:00 PM',
  openingHoursAr: 'السبت - الخميس: 10:00 صباحاً - 11:00 مساءً | الجمعة: 4:00 عصراً - 11:00 مساءً',
};

export const FALLBACK_PRODUCTS = [
  {
    id: 1,
    slug: 'iphone-16-pro-max-desert-titanium',
    sku: 'NMD-IP16PM-DT',
    nameEn: 'Apple iPhone 16 Pro Max - Desert Titanium',
    nameAr: 'آبل آيفون 16 برو ماكس - تيتانيوم صحراوي',
    descriptionEn:
      'Apple iPhone 16 Pro Max featuring the powerful A18 Pro chip, Grade 5 titanium design, 48MP Fusion camera system, and Camera Control button.',
    descriptionAr:
      'آبل آيفون 16 برو ماكس بشريحة A18 برو الجبارة، تصميم من التيتانيوم، كاميرا بدقة 48 ميجابكسل، وزر التحكم بالكاميرا الجديد.',
    condition: 'New',
    categoryId: 1,
    brandId: 1,
    categoryNameEn: 'Smartphones',
    categoryNameAr: 'الهواتف الذكية',
    categorySlug: 'smartphones',
    brandName: 'Apple',
    brandSlug: 'apple',
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { keyEn: 'Storage', keyAr: 'سعة التخزين', valueEn: '256GB / 512GB / 1TB', valueAr: '256 جيجابايت / 512 جيجابايت / 1 تيرابايت' },
      { keyEn: 'Display', keyAr: 'الشاشة', valueEn: '6.9" Super Retina XDR OLED 120Hz', valueAr: '6.9 بوصة سوبر ريتينا XDR أوليد 120 هرتز' },
      { keyEn: 'Processor', keyAr: 'المعالج', valueEn: 'Apple A18 Pro (3nm)', valueAr: 'آبل A18 برو (3 نانومتر)' },
      { keyEn: 'Warranty', keyAr: 'الضمان', valueEn: '1 Year Apple Official Warranty', valueAr: 'ضمان رسمي من آبل لمدة سنة' }
    ],
    variants: [
      { nameEn: 'Storage', nameAr: 'السعة', options: ['256GB', '512GB', '1TB'] },
      { nameEn: 'Color', nameAr: 'اللون', options: ['Desert Titanium', 'Natural Titanium', 'White Titanium', 'Black Titanium'] }
    ],
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    slug: 'samsung-galaxy-s25-ultra-titanium-black',
    sku: 'NMD-SGS25U-TB',
    nameEn: 'Samsung Galaxy S25 Ultra 5G',
    nameAr: 'سامسونج جالاكسي S25 الترا 5G',
    descriptionEn:
      'The ultimate flagship powered by Snapdragon 8 Elite for Galaxy, built-in S Pen, ProVisual 200MP camera, and Galaxy AI capabilities.',
    descriptionAr:
      'الهاتف الرائد الأقوى بمعالج سنابدراجون 8 إيليت، قلم S Pen مدمج، كاميرا بدقة 200 ميجابكسل، وميزات جالاكسي للذكاء الاصطناعي.',
    condition: 'New',
    categoryId: 1,
    brandId: 2,
    categoryNameEn: 'Smartphones',
    categoryNameAr: 'الهواتف الذكية',
    categorySlug: 'smartphones',
    brandName: 'Samsung',
    brandSlug: 'samsung',
    isFeatured: true,
    isNewArrival: true,
    specifications: [
      { keyEn: 'Processor', keyAr: 'المعالج', valueEn: 'Snapdragon 8 Elite for Galaxy', valueAr: 'سنابدراجون 8 إيليت مخصص لجالاكسي' },
      { keyEn: 'Camera', keyAr: 'الكاميرا', valueEn: '200MP Main + 50MP Periscope 5x', valueAr: '200 ميجابكسل رئيسية + 50 ميجابكسل بيريسكوب' },
      { keyEn: 'Battery', keyAr: 'البطارية', valueEn: '5000 mAh Fast Charge 45W', valueAr: '5000 مللي أمبير شحن سريع 45 واط' }
    ],
    variants: [
      { nameEn: 'Storage', nameAr: 'السعة', options: ['256GB', '512GB', '1TB'] },
      { nameEn: 'Color', nameAr: 'اللون', options: ['Titanium Black', 'Titanium Silver', 'Titanium Gray'] }
    ],
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80'
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    slug: 'apple-watch-ultra-2-black-titanium',
    sku: 'NMD-AWU2-BT',
    nameEn: 'Apple Watch Ultra 2 - Black Titanium',
    nameAr: 'آبل واتش الترا 2 - تيتانيوم أسود',
    descriptionEn:
      'Engineered for extreme environments with stunning 3000-nit display, precision dual-frequency GPS, and up to 72 hours of battery life.',
    descriptionAr:
      'مصممة للأجواء القاسية مع شاشة بسطوع 3000 شمعة، نظام GPS مزدوج عالي الدقة، وبطارية تدوم حتى 72 ساعة.',
    condition: 'New',
    categoryId: 3,
    brandId: 1,
    categoryNameEn: 'Smartwatches',
    categoryNameAr: 'الساعات الذكية',
    categorySlug: 'smartwatches',
    brandName: 'Apple',
    brandSlug: 'apple',
    isFeatured: true,
    isNewArrival: false,
    specifications: [
      { keyEn: 'Case', keyAr: 'الهيكل', valueEn: '49mm Black Titanium Case', valueAr: 'هيكل تيتانيوم أسود 49 ملم' },
      { keyEn: 'Water Resistance', keyAr: 'مقاومة الماء', valueEn: '100m Water Resistant', valueAr: 'مقاومة للماء حتى عمق 100 متر' }
    ],
    variants: [
      { nameEn: 'Band', nameAr: 'السوار', options: ['Trail Loop', 'Alpine Loop', 'Ocean Band'] }
    ],
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80'
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    slug: 'ipad-pro-13-m4-oled',
    sku: 'NMD-IPP13-M4',
    nameEn: 'Apple iPad Pro 13-inch (M4) Tandem OLED',
    nameAr: 'آبل آيباد برو 13 بوصة بشريحة M4 وشاشة أوليد',
    descriptionEn:
      'Ultra thin 5.1mm design with breakthrough Ultra Retina XDR display, game-changing M4 chip, and Apple Pencil Pro support.',
    descriptionAr:
      'تصميم فائق النحافة بسماكة 5.1 ملم مع شاشة ألترا ريتينا XDR أوليد الثورية ومعالج M4 الخارق.',
    condition: 'New',
    categoryId: 2,
    brandId: 1,
    categoryNameEn: 'Tablets & iPads',
    categoryNameAr: 'الأجهزة اللوحية',
    categorySlug: 'tablets',
    brandName: 'Apple',
    brandSlug: 'apple',
    isFeatured: false,
    isNewArrival: true,
    specifications: [
      { keyEn: 'Processor', keyAr: 'المعالج', valueEn: 'Apple M4 Chip (Next-gen Neural Engine)', valueAr: 'شريحة آبل M4 مع محرك عصبي متطور' },
      { keyEn: 'Display', keyAr: 'الشاشة', valueEn: '13" Tandem OLED Ultra Retina XDR', valueAr: 'شاشة 13 بوصة تانديم أوليد ألترا ريتينا XDR' }
    ],
    variants: [
      { nameEn: 'Storage', nameAr: 'السعة', options: ['256GB', '512GB', '1TB'] },
      { nameEn: 'Connectivity', nameAr: 'الاتصال', options: ['Wi-Fi', 'Wi-Fi + Cellular 5G'] }
    ],
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80'
    ],
    createdAt: new Date().toISOString(),
  }
];
