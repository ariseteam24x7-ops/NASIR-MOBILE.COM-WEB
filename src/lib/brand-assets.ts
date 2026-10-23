// ====================================================================
// NASIR MOBILE DUBAI — BRAND & CATEGORY ASSET PRESETS & ICON HELPERS
// ====================================================================

export interface BrandPreset {
  name: string;
  slug: string;
  url: string;
  tagline?: string;
  color?: string;
}

export interface CategoryPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  isImage?: boolean;
}

// Crisp, luxury metallic SVG emblems matching Nasir Mobile's dark titanium aesthetic
export const SVG_ICONS = {
  huawei: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%232c1b22"/><stop offset="100%" stop-color="%23121014"/></radialGradient><linearGradient id="m" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff334b"/><stop offset="100%" stop-color="%23c4001a"/></linearGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff4d61"/><stop offset="100%" stop-color="%235c101b"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="3"/><g transform="translate(50, 48) scale(0.85)"><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(45)" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(-45)" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(90)" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(-90)" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(135)" fill="url(%23m)"/><path d="M0 -30 C8 -20 12 -8 0 8 C-12 -8 -8 -20 0 -30 Z" transform="rotate(-135)" fill="url(%23m)"/><circle cx="0" cy="8" r="4" fill="%23ffffff" opacity="0.8"/></g><text x="50" y="86" fill="%23ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="8" text-anchor="middle" letter-spacing="2">HUAWEI</text></svg>`,

  sony: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23222329"/><stop offset="100%" stop-color="%230f1013"/></radialGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300f0ff"/><stop offset="100%" stop-color="%231a3038"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="2.5"/><text x="50" y="55" fill="%23ffffff" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="19" text-anchor="middle" letter-spacing="4">SONY</text><path d="M22 64 L78 64" stroke="%2300f0ff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>`,

  anker: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%231a2836"/><stop offset="100%" stop-color="%230d141c"/></radialGradient><linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300b4d8"/><stop offset="100%" stop-color="%2390e0ef"/></linearGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300b4d8"/><stop offset="100%" stop-color="%23133145"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="3"/><polygon points="53,20 37,48 49,48 45,72 63,42 51,42" fill="url(%23bolt)" filter="drop-shadow(0 0 4px %2300b4d8)"/><text x="50" y="86" fill="%23ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="8.5" text-anchor="middle" letter-spacing="2">ANKER</text></svg>`,

  jbl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23301a15"/><stop offset="100%" stop-color="%23140c0a"/></radialGradient><linearGradient id="org" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff6b35"/><stop offset="100%" stop-color="%23e85d04"/></linearGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff6b35"/><stop offset="100%" stop-color="%23471b0e"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="3"/><rect x="22" y="34" width="56" height="32" rx="8" fill="url(%23org)"/><text x="50" y="58" fill="%23ffffff" font-family="'Impact', Arial, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="1">JBL</text><circle cx="28" cy="30" r="2.5" fill="%23ff6b35"/></svg>`,

  playstation: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%231a1f38"/><stop offset="100%" stop-color="%230b0d17"/></radialGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300439c"/><stop offset="100%" stop-color="%2300b4d8"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="3"/><g transform="translate(50, 46) scale(0.9)"><polygon points="0,-18 -16,14 16,14" fill="none" stroke="%2300e5ff" stroke-width="3" transform="translate(-18, -6) scale(0.55)"/><line x1="-6" y1="-6" x2="6" y2="6" stroke="%230070d1" stroke-width="3.5" transform="translate(18, -6)"/><line x1="6" y1="-6" x2="-6" y2="6" stroke="%230070d1" stroke-width="3.5" transform="translate(18, -6)"/><circle cx="18" cy="16" r="6" fill="none" stroke="%23ff334b" stroke-width="3"/><rect x="-24" y="10" width="12" height="12" fill="none" stroke="%23b7f34b" stroke-width="3" rx="1.5"/></g><text x="50" y="85" fill="%23ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="7.5" text-anchor="middle" letter-spacing="1.5">PLAYSTATION</text></svg>`,

  nothing: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23222222"/><stop offset="100%" stop-color="%230e0e0e"/></radialGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ffffff"/><stop offset="100%" stop-color="%23333333"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="2.5"/><g fill="%23ffffff" opacity="0.9"><circle cx="34" cy="40" r="3"/><circle cx="50" cy="40" r="3"/><circle cx="66" cy="40" r="3"/><circle cx="34" cy="52" r="3"/><circle cx="50" cy="52" r="3"/><circle cx="66" cy="52" r="3"/><circle cx="50" cy="28" r="3"/><circle cx="50" cy="64" r="3"/></g><text x="50" y="84" fill="%23ffffff" font-family="monospace" font-weight="700" font-size="8" text-anchor="middle" letter-spacing="2">NOTHING</text></svg>`,

  motorola: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%231a2434"/><stop offset="100%" stop-color="%230f141d"/></radialGradient><linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2300b4d8"/><stop offset="100%" stop-color="%23084c61"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23g)" stroke="url(%23rim)" stroke-width="3"/><path d="M26 62 C34 40 40 40 50 56 C60 40 66 40 74 62 C68 50 62 48 50 64 C38 48 32 50 26 62 Z" fill="%2300b4d8"/><text x="50" y="84" fill="%23ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="7.5" text-anchor="middle" letter-spacing="1.5">MOTOROLA</text></svg>`,
};

// Preset brand badges for 1-click application in Admin or public catalogue
export const BRAND_PRESETS: BrandPreset[] = [
  {
    name: 'Apple',
    slug: 'apple',
    url: '/src/assets/images/apple_brand_icon_1792330702744.jpg',
    tagline: 'iPhone & iPad',
    color: '#B7F34B',
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    url: '/src/assets/images/samsung_brand_icon_1792330702562.jpg',
    tagline: 'Galaxy Flagships',
    color: '#00f0ff',
  },
  {
    name: 'Google Pixel',
    slug: 'google',
    url: '/src/assets/images/pixel_brand_icon_1792330703295.jpg',
    tagline: 'Pure Android & AI',
    color: '#922CB5',
  },
  {
    name: 'Xiaomi',
    slug: 'xiaomi',
    url: '/src/assets/images/xiaomi_brand_icon_1792330703614.jpg',
    tagline: 'Ultra Power',
    color: '#ff6b35',
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    url: '/src/assets/images/oneplus_brand_icon_1792330704300.jpg',
    tagline: 'Never Settle',
    color: '#ff334b',
  },
  {
    name: 'Huawei',
    slug: 'huawei',
    url: SVG_ICONS.huawei,
    tagline: 'XMAGE & Harmony',
    color: '#ff334b',
  },
  {
    name: 'Sony',
    slug: 'sony',
    url: SVG_ICONS.sony,
    tagline: 'Xperia & Audio',
    color: '#00f0ff',
  },
  {
    name: 'Anker',
    slug: 'anker',
    url: SVG_ICONS.anker,
    tagline: 'Fast Charging & Sound',
    color: '#00b4d8',
  },
  {
    name: 'JBL',
    slug: 'jbl',
    url: SVG_ICONS.jbl,
    tagline: 'Pro Audio & Bass',
    color: '#ff6b35',
  },
  {
    name: 'PlayStation',
    slug: 'playstation',
    url: SVG_ICONS.playstation,
    tagline: 'PS5 & Gaming Gear',
    color: '#0070d1',
  },
  {
    name: 'Nothing',
    slug: 'nothing',
    url: SVG_ICONS.nothing,
    tagline: 'Glyph Phone & Ear',
    color: '#ffffff',
  },
  {
    name: 'Motorola',
    slug: 'motorola',
    url: SVG_ICONS.motorola,
    tagline: 'Razr & Edge',
    color: '#00b4d8',
  },
];

// Fallback lookup dictionary
export const BRAND_PLACEHOLDER_ICONS: Record<string, string> = {
  apple: '/src/assets/images/apple_brand_icon_1792330702744.jpg',
  samsung: '/src/assets/images/samsung_brand_icon_1792330702562.jpg',
  google: '/src/assets/images/pixel_brand_icon_1792330703295.jpg',
  pixel: '/src/assets/images/pixel_brand_icon_1792330703295.jpg',
  'google pixel': '/src/assets/images/pixel_brand_icon_1792330703295.jpg',
  xiaomi: '/src/assets/images/xiaomi_brand_icon_1792330703614.jpg',
  oneplus: '/src/assets/images/oneplus_brand_icon_1792330704300.jpg',
  huawei: SVG_ICONS.huawei,
  sony: SVG_ICONS.sony,
  anker: SVG_ICONS.anker,
  jbl: SVG_ICONS.jbl,
  playstation: SVG_ICONS.playstation,
  nothing: SVG_ICONS.nothing,
  motorola: SVG_ICONS.motorola,
};

// Category Preset Library with both System Lucide names and Rich SVG Badges
export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'mobile-phones',
    nameEn: 'Mobile Phones',
    nameAr: 'الهواتف المتحركة',
    icon: 'Smartphone',
  },
  {
    id: 'used-refurbished',
    nameEn: 'Used & Refurbished',
    nameAr: 'الهواتف المستعملة والمجددة',
    icon: 'RefreshCw',
  },
  {
    id: 'smartwatches',
    nameEn: 'Smartwatches',
    nameAr: 'الساعات الذكية',
    icon: 'Watch',
  },
  {
    id: 'tablets-laptops',
    nameEn: 'Tablets & Laptops',
    nameAr: 'الأجهزة اللوحية والمحمولة',
    icon: 'Tablet',
  },
  {
    id: 'earbuds-audio',
    nameEn: 'Earbuds & Audio',
    nameAr: 'سماعات الأذن والصوتيات',
    icon: 'Headphones',
  },
  {
    id: 'chargers-cables',
    nameEn: 'Chargers & Cables',
    nameAr: 'الشواحن والكابلات',
    icon: 'Zap',
  },
  {
    id: 'accessories',
    nameEn: 'Accessories',
    nameAr: 'الإكسسوارات وحماية الشاشة',
    icon: 'ShieldCheck',
  },
  {
    id: 'gaming-consoles',
    nameEn: 'Gaming & Consoles',
    nameAr: 'أجهزة الألعاب وإكسسواراتها',
    icon: 'Gamepad2',
  },
  {
    id: 'electronics',
    nameEn: 'Other Electronics',
    nameAr: 'إلكترونيات أخرى',
    icon: 'Cpu',
  },
];

/**
 * Resolves the best available icon URL for a brand
 */
export function resolveBrandLogo(nameOrSlug?: string, logoUrl?: string): string {
  if (logoUrl && logoUrl.trim() !== '') {
    return logoUrl.trim();
  }
  if (!nameOrSlug) return '';
  const key = nameOrSlug.toLowerCase().trim();
  return BRAND_PLACEHOLDER_ICONS[key] || '';
}
