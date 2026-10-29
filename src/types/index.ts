export type ProductCondition = 'New' | 'Used' | 'Refurbished';
export type ProductStatus = 'published' | 'draft' | 'archived';

export interface ProductSpec {
  keyEn: string;
  keyAr: string;
  valueEn: string;
  valueAr: string;
}

export interface ProductVariant {
  nameEn: string;
  nameAr: string;
  options: string[];
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  condition: ProductCondition;
  categoryId: number | null;
  brandId: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  status: ProductStatus;
  specifications: ProductSpec[];
  variants: ProductVariant[];
  images: string[];
  createdAt: string;
  updatedAt?: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  categorySlug?: string;
  brandName?: string;
  brandSlug?: string;
  // Private administrative fields (only available in owner admin panel)
  privateNotes?: string;
  purchaseCost?: string;
  stockQuantity?: number;
  imeiSerialNumbers?: string[];
}

export interface Category {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  icon?: string;
  displayOrder?: number;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface WhatsAppSettings {
  primaryNumber: string;
  secondaryNumber: string;
  activeNumber: string;
  isEnabled: boolean;
  templateEn: string;
  templateAr: string;
}

export interface SiteContent {
  heroTitleEn: string;
  heroTitleAr: string;
  heroSubtitleEn: string;
  heroSubtitleAr: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  aboutEn: string;
  aboutAr: string;
  contactAddressEn: string;
  contactAddressAr: string;
  contactEmail: string;
  openingHoursEn: string;
  openingHoursAr: string;
}

export interface AuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
}

export interface FAQQuickReply {
  id: string;
  questionEn: string;
  questionAr: string;
  icon?: string;
}

export interface PublicVisitorStats {
  isEnabled: boolean;
  displayMode: 'both' | 'today' | 'total';
  todayVisitors: number;
  totalVisitors: number;
}

export interface VisitorDailyRecord {
  date: string;
  uniqueVisitors: number;
  pageViews: number;
}

export interface AdminVisitorAnalytics {
  actualTodayVisitors: number;
  actualTotalVisitors: number;
  actualTodayPageViews: number;
  displayTodayVisitors: number;
  displayTotalVisitors: number;
  todayAdjustment: number;
  totalAdjustment: number;
  isEnabled: boolean;
  displayMode: 'both' | 'today' | 'total';
  recentDailyStats: VisitorDailyRecord[];
}

export interface ServiceItem {
  id: number;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon?: string;
  turnaroundEn?: string;
  turnaroundAr?: string;
  badgeEn?: string;
  badgeAr?: string;
  featuresEn?: string[];
  featuresAr?: string[];
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}
