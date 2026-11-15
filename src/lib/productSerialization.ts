// ============================================================================
// NASIR MOBILE — PRODUCT JSON DESERIALIZATION & SANITIZATION HELPERS
// Handles MariaDB / mysql2 JSON columns whether returned as parsed arrays
// or raw JSON strings, safely handles null/empty/malformed values, preserves
// valid image URLs, and strictly strips private inventory fields on public APIs.
// ============================================================================

export function parseJsonArray(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        const nestedTrimmed = parsed.trim();
        if (!nestedTrimmed) return [];
        const nested = JSON.parse(nestedTrimmed);
        return Array.isArray(nested) ? nested : [];
      }
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

export interface NormalizeImagesOptions {
  filterBrokenPlaceholders?: boolean;
}

export function normalizeProductImages(
  rawImages: unknown,
  options: NormalizeImagesOptions = {}
): string[] {
  const filterBrokenPlaceholders =
    options.filterBrokenPlaceholders !== undefined ? options.filterBrokenPlaceholders : true;

  let items: any[] = [];

  if (Array.isArray(rawImages)) {
    items = rawImages;
  } else if (typeof rawImages === 'string') {
    const trimmed = rawImages.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (typeof parsed === 'string') {
        const innerTrimmed = parsed.trim();
        if (innerTrimmed.startsWith('[')) {
          try {
            const innerParsed = JSON.parse(innerTrimmed);
            items = Array.isArray(innerParsed) ? innerParsed : [];
          } catch {
            items = [];
          }
        } else if (innerTrimmed) {
          items = [innerTrimmed];
        }
      } else if (parsed && typeof parsed === 'object') {
        items = [parsed];
      }
    } catch {
      // Malformed JSON array/object must fail safe to [], while a bare URL/path is preserved
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return [];
      }
      if (
        trimmed.startsWith('/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:')
      ) {
        items = [trimmed];
      } else {
        return [];
      }
    }
  }

  let safeImages = items
    .map((img: any) => {
      if (typeof img === 'string') return img.trim();
      if (img && typeof img === 'object') return String(img.url || img.src || '').trim();
      return '';
    })
    .filter(Boolean)
    .map((img) => img.replace('/src/assets/images/', '/uploads/'));

  if (filterBrokenPlaceholders) {
    safeImages = safeImages.filter(
      (img) =>
        !img.includes('sample-') &&
        !img.includes('/api/images/50001') &&
        !img.includes('/uploads/test.jpg')
    );
  }

  return safeImages;
}

export function filterProducts(query: any = {}, isPublic = true, dbItems: any[] = []) {
  const { category, brand, condition, featured, newArrival, search, sort, status, categoryId, brandId } =
    query || {};

  let allMerged = (dbItems || []).map((p) => {
    const safeImages = normalizeProductImages(p.images, { filterBrokenPlaceholders: isPublic });
    const safeSpecs = parseJsonArray(p.specifications);
    const safeVariants = parseJsonArray(p.variants);
    const safeImeiSerialNumbers = parseJsonArray(p.imeiSerialNumbers);

    return {
      ...p,
      images: safeImages,
      specifications: safeSpecs,
      variants: safeVariants,
      imeiSerialNumbers: safeImeiSerialNumbers,
      categoryNameEn: p.categoryNameEn || 'General',
      categoryNameAr: p.categoryNameAr || 'عام',
      categorySlug: p.categorySlug || 'mobile-phones',
      brandName: p.brandName || 'General',
      brandSlug: p.brandSlug || 'general',
      brandLogoUrl: p.brandLogoUrl || '',
      inStock: (p.stockQuantity ?? 1) > 0,
      status: p.status || 'published',
      storefrontVisible: Boolean(p.storefrontVisible),
      version: Number(p.version) || 1,
    };
  });

  if (isPublic) {
    allMerged = allMerged.filter((p) => (!p.status || p.status === 'published') && Boolean(p.storefrontVisible));
  } else if (status && status !== 'all') {
    allMerged = allMerged.filter((p) => p.status === status);
  }

  let filtered = [...allMerged];

  if (category && typeof category === 'string') {
    const normCat = category.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const pSlug = (p.categorySlug || '').toLowerCase();
      if (pSlug === normCat || String(p.categoryId) === normCat) return true;
      if (
        (normCat === 'smartphones' || normCat === 'mobile-phones') &&
        (pSlug === 'smartphones' || pSlug === 'mobile-phones')
      ) {
        return true;
      }
      if (
        (normCat === 'tablets' || normCat === 'tablets-laptops') &&
        (pSlug === 'tablets' || pSlug === 'tablets-laptops')
      ) {
        return true;
      }
      return false;
    });
  }

  if (categoryId && !isNaN(parseInt(categoryId as string, 10))) {
    const cid = parseInt(categoryId as string, 10);
    filtered = filtered.filter((p) => p.categoryId === cid);
  }

  if (brand && typeof brand === 'string') {
    const normBrand = brand.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const bSlug = (p.brandSlug || '').toLowerCase();
      const bName = (p.brandName || '').toLowerCase();
      return bSlug === normBrand || bName === normBrand || String(p.brandId) === normBrand;
    });
  }

  if (brandId && !isNaN(parseInt(brandId as string, 10))) {
    const bid = parseInt(brandId as string, 10);
    filtered = filtered.filter((p) => p.brandId === bid);
  }

  if (condition && typeof condition === 'string' && ['New', 'Used', 'Refurbished'].includes(condition)) {
    filtered = filtered.filter((p) => p.condition === condition);
  }
  if (featured === 'true') {
    filtered = filtered.filter((p) => Boolean(p.isFeatured));
  }
  if (newArrival === 'true') {
    filtered = filtered.filter((p) => Boolean(p.isNewArrival));
  }
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.nameEn?.toLowerCase().includes(q) ||
        p.nameAr?.includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.descriptionEn?.toLowerCase().includes(q)
    );
  }

  if (sort === 'name-asc') {
    filtered.sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || ''));
  } else if (sort === 'name-desc') {
    filtered.sort((a, b) => (b.nameEn || '').localeCompare(a.nameEn || ''));
  } else {
    filtered.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }

  if (isPublic) {
    return filtered.map((p) => ({
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      descriptionEn: p.descriptionEn || '',
      descriptionAr: p.descriptionAr || '',
      condition: p.condition || 'New',
      categoryId: p.categoryId,
      brandId: p.brandId,
      categoryNameEn: p.categoryNameEn || 'General',
      categoryNameAr: p.categoryNameAr || 'عام',
      categorySlug: p.categorySlug,
      brandName: p.brandName || '',
      brandSlug: p.brandSlug,
      brandLogoUrl: p.brandLogoUrl,
      isFeatured: Boolean(p.isFeatured),
      isNewArrival: Boolean(p.isNewArrival),
      specifications: p.specifications || [],
      variants: p.variants || [],
      images: p.images || [],
      inStock: (p.stockQuantity ?? 1) > 0,
      createdAt: p.createdAt,
    }));
  }

  return filtered;
}

export function sanitizePublicProductDetail(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    descriptionEn: p.descriptionEn || '',
    descriptionAr: p.descriptionAr || '',
    condition: p.condition || 'New',
    categoryId: p.categoryId,
    brandId: p.brandId,
    isFeatured: Boolean(p.isFeatured),
    isNewArrival: Boolean(p.isNewArrival),
    specifications: parseJsonArray(p.specifications),
    variants: parseJsonArray(p.variants),
    images: normalizeProductImages(p.images, { filterBrokenPlaceholders: true }),
    categoryNameEn: p.categoryNameEn || 'General',
    categoryNameAr: p.categoryNameAr || 'عام',
    categorySlug: p.categorySlug,
    brandName: p.brandName || '',
    brandSlug: p.brandSlug,
    brandLogoUrl: p.brandLogoUrl,
    inStock: (p.stockQuantity ?? 1) > 0,
    createdAt: p.createdAt,
  };
}

export function sanitizePublicRelated(items: any[]) {
  return (items || []).slice(0, 4).map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    condition: p.condition || 'New',
    images: normalizeProductImages(p.images, { filterBrokenPlaceholders: true }),
    categoryNameEn: p.categoryNameEn || 'General',
    categoryNameAr: p.categoryNameAr || 'عام',
    brandName: p.brandName || '',
    inStock: (p.stockQuantity ?? 1) > 0,
  }));
}
