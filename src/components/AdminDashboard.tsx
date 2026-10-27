import React, { useState, useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Product,
  Category,
  Brand,
  WhatsAppSettings,
  SiteContent,
  AuditLog,
  ProductCondition,
  ProductStatus,
  AdminVisitorAnalytics,
} from '../types/index.ts';
import {
  Package,
  Layers,
  Tag,
  MessageCircle,
  FileText,
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  LogOut,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  Smartphone,
  ShieldAlert,
  Key,
  Lock,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Star,
  Minus,
  CheckSquare,
  Square,
  Maximize2,
  SlidersHorizontal,
  Download,
  Activity,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Users,
} from 'lucide-react';
import { ProductMultiImageUploader, ImageAspectRatio, ImageFitMode } from './ProductMultiImageUploader.tsx';
import { IconImageUploader } from './IconImageUploader.tsx';

interface AdminDashboardProps {
  token: string;
  adminUser: { email: string; role: string };
  onLogout: () => void;
  onViewPublicSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUser,
  onLogout,
  onViewPublicSite,
}) => {
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'brands' | 'whatsapp' | 'content' | 'audit' | 'security' | 'visitors'>('overview');

  // Visitor Analytics State
  const [visitorAnalytics, setVisitorAnalytics] = useState<AdminVisitorAnalytics | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorSaving, setVisitorSaving] = useState(false);
  const [visitorResetting, setVisitorResetting] = useState(false);
  const [editVisitorEnabled, setEditVisitorEnabled] = useState(true);
  const [editVisitorDisplayMode, setEditVisitorDisplayMode] = useState<'both' | 'today' | 'total'>('both');
  const [editVisitorTodayAdj, setEditVisitorTodayAdj] = useState(0);
  const [editVisitorTotalAdj, setEditVisitorTotalAdj] = useState(0);

  // Security & Password Change State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Master Key Reset & Management State
  const [masterKeyInfo, setMasterKeyInfo] = useState<{ isDefault: boolean; maskedKey: string; hasCustomKey: boolean } | null>(null);
  const [newMasterKeyInput, setNewMasterKeyInput] = useState('');
  const [confirmMasterKeyInput, setConfirmMasterKeyInput] = useState('');
  const [masterKeyVerifyPassword, setMasterKeyVerifyPassword] = useState('');
  const [masterKeyLoading, setMasterKeyLoading] = useState(false);
  const [masterKeySuccess, setMasterKeySuccess] = useState<string | null>(null);
  const [masterKeyError, setMasterKeyError] = useState<string | null>(null);

  // Overview Stats
  const [stats, setStats] = useState<{
    totalProducts: number;
    publishedCount: number;
    draftCount: number;
    archivedCount: number;
    totalCategories: number;
    totalBrands: number;
    recentLogs: AuditLog[];
  } | null>(null);

  // Data collections
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [whatsappSettingsData, setWhatsappSettingsData] = useState<WhatsAppSettings | null>(null);
  const [siteContentData, setSiteContentData] = useState<SiteContent | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);

  // Filters for product catalogue
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productConditionFilter, setProductConditionFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [galleryModalProduct, setGalleryModalProduct] = useState<Product | null>(null);
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);

  // Modals & Forms
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State for Product
  const [formSku, setFormSku] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formCondition, setFormCondition] = useState<ProductCondition>('New');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formBrandId, setFormBrandId] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState<ProductStatus>('published');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsNewArrival, setFormIsNewArrival] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formImageAspectRatio, setFormImageAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [formImageFitMode, setFormImageFitMode] = useState<ImageFitMode>('contain');
  const [formSpecs, setFormSpecs] = useState<{ keyEn: string; keyAr: string; valueEn: string; valueAr: string }[]>([]);
  const [formVariants, setFormVariants] = useState<{ nameEn: string; nameAr: string; options: string[] }[]>([]);
  // Private owner fields
  const [formPrivateNotes, setFormPrivateNotes] = useState('');
  const [formPurchaseCost, setFormPurchaseCost] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState(0);
  const [formImeis, setFormImeis] = useState<string[]>([]);
  const [imeiInput, setImeiInput] = useState('');

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Category Form State
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catIcon, setCatIcon] = useState('Smartphone');
  const [catIconUploading, setCatIconUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Brand Form State
  const [brandName, setBrandName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Fetch Overview Stats
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      let url = `/api/admin/products?status=${productStatusFilter}`;
      if (productSearch) url += `&search=${encodeURIComponent(productSearch)}`;
      if (productCategoryFilter) url += `&categoryId=${productCategoryFilter}`;
      if (productBrandFilter) url += `&brandId=${productBrandFilter}`;
      if (productConditionFilter !== 'all') url += `&condition=${productConditionFilter}`;
      const res = await fetch(url, { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProductsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrandsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch WhatsApp Settings
  const fetchWhatsappSettings = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-settings', { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettingsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Site Content
  const fetchSiteContent = async () => {
    try {
      const res = await fetch('/api/admin/site-content', { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSiteContentData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAuditLogsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Visitor Analytics
  const fetchVisitorAnalytics = async () => {
    try {
      setVisitorLoading(true);
      const res = await fetch('/api/admin/visitors', { headers: authHeaders });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data: AdminVisitorAnalytics = await res.json();
        setVisitorAnalytics(data);
        setEditVisitorEnabled(data.isEnabled);
        setEditVisitorDisplayMode(data.displayMode);
        setEditVisitorTodayAdj(data.todayAdjustment);
        setEditVisitorTotalAdj(data.totalAdjustment);
      }
    } catch (e) {
      console.error('Failed to load visitor analytics', e);
    } finally {
      setVisitorLoading(false);
    }
  };

  // Save Visitor Settings & Adjustments
  const handleSaveVisitorSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorSaving(true);
    try {
      const res = await fetch('/api/admin/visitors/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          isEnabled: editVisitorEnabled,
          displayMode: editVisitorDisplayMode,
          todayAdjustment: Number(editVisitorTodayAdj) || 0,
          totalAdjustment: Number(editVisitorTotalAdj) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      showNotification('Visitor counter display settings saved successfully!');
      fetchVisitorAnalytics();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save settings', true);
    } finally {
      setVisitorSaving(false);
    }
  };

  // Reset Adjustments to 0 (1-Click Restore Actual Tracking)
  const handleResetVisitorAdjustments = async () => {
    if (!window.confirm('Restore actual analytics? This will reset public display adjustments (+/-) back to 0 so the public counter directly reflects true tracked visitors.')) return;
    setVisitorResetting(true);
    try {
      const res = await fetch('/api/admin/visitors/reset-adjustments', {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to reset adjustments');
      setEditVisitorTodayAdj(0);
      setEditVisitorTotalAdj(0);
      showNotification('Adjustments reset to 0! Public counter now reflects real actual visits.');
      fetchVisitorAnalytics();
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset adjustments', true);
    } finally {
      setVisitorResetting(false);
    }
  };

  // Fetch Master Key info
  const fetchMasterKeyInfo = async () => {
    try {
      const res = await fetch('/api/admin/master-key-info', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMasterKeyInfo(data);
      }
    } catch (e) {
      console.error('Failed to load master key info', e);
    }
  };

  // Reset Master Key to Default (NasirMobileDubai2026!)
  const handleResetMasterKeyToDefault = async () => {
    const password = window.prompt('Enter your current Owner Password or Master Key to authorize resetting to the default factory key (NasirMobileDubai2026!):');
    if (!password) return;
    setMasterKeyLoading(true);
    setMasterKeyError(null);
    setMasterKeySuccess(null);
    try {
      const res = await fetch('/api/admin/reset-master-key', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ currentPassword: password, resetToDefault: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset Master Key');
      setMasterKeySuccess(data.message || 'Master Key restored to default!');
      showNotification('Master Key restored to default (NasirMobileDubai2026!)');
      fetchMasterKeyInfo();
    } catch (err: any) {
      setMasterKeyError(err.message || 'Failed to reset Master Key');
    } finally {
      setMasterKeyLoading(false);
    }
  };

  // Change Master Key to a New Custom Key
  const handleChangeMasterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterKeyError(null);
    setMasterKeySuccess(null);
    if (!masterKeyVerifyPassword) {
      setMasterKeyError('Owner Password verification is required to authorize Master Key change.');
      return;
    }
    if (newMasterKeyInput.length < 6) {
      setMasterKeyError('New Master Key must be at least 6 characters long.');
      return;
    }
    if (newMasterKeyInput !== confirmMasterKeyInput) {
      setMasterKeyError('New Master Keys do not match. Please re-enter.');
      return;
    }
    setMasterKeyLoading(true);
    try {
      const res = await fetch('/api/admin/reset-master-key', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword: masterKeyVerifyPassword,
          newMasterKey: newMasterKeyInput.trim(),
          resetToDefault: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Master Key');
      setMasterKeySuccess('Master Key updated successfully! Your team can now log in using the new Master Key.');
      setNewMasterKeyInput('');
      setConfirmMasterKeyInput('');
      setMasterKeyVerifyPassword('');
      showNotification('Master Key updated successfully!');
      fetchMasterKeyInfo();
    } catch (err: any) {
      setMasterKeyError(err.message || 'Failed to update Master Key');
    } finally {
      setMasterKeyLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchCategories();
    fetchBrands();
    fetchWhatsappSettings();
    fetchSiteContent();
    fetchVisitorAnalytics();
    fetchMasterKeyInfo();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'visitors') fetchVisitorAnalytics();
    if (activeTab === 'security') fetchMasterKeyInfo();
  }, [activeTab, productStatusFilter, productCategoryFilter, productBrandFilter, productConditionFilter]);

  // Open Add Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormSku(`NM-${Math.floor(10000 + Math.random() * 90000)}`);
    setFormNameEn('');
    setFormNameAr('');
    setFormDescEn('');
    setFormDescAr('');
    setFormCondition('New');
    setFormCategoryId(categoriesList.length > 0 ? categoriesList[0].id : '');
    setFormBrandId(brandsList.length > 0 ? brandsList[0].id : '');
    setFormStatus('published');
    setFormIsFeatured(false);
    setFormIsNewArrival(true);
    setFormImages([]);
    setFormImageAspectRatio('1:1');
    setFormImageFitMode('contain');
    setFormSpecs([
      { keyEn: 'Storage', keyAr: 'السعة', valueEn: '256GB', valueAr: '256 جيجابايت' },
      { keyEn: 'Network', keyAr: 'الشبكة', valueEn: '5G Dual SIM', valueAr: 'الجيل الخامس شريحتين' },
    ]);
    setFormVariants([]);
    setFormPrivateNotes('');
    setFormPurchaseCost('');
    setFormStockQuantity(1);
    setFormImeis([]);
    setImeiInput('');
    setProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormSku(prod.sku);
    setFormNameEn(prod.nameEn);
    setFormNameAr(prod.nameAr);
    setFormDescEn(prod.descriptionEn);
    setFormDescAr(prod.descriptionAr);
    setFormCondition(prod.condition);
    setFormCategoryId(prod.categoryId || '');
    setFormBrandId(prod.brandId || '');
    setFormStatus(prod.status);
    setFormIsFeatured(prod.isFeatured);
    setFormIsNewArrival(prod.isNewArrival);
    setFormImages(prod.images || []);
    const ratioSpec = (prod.specifications || []).find((s) => s.keyEn === '_imageAspectRatio');
    setFormImageAspectRatio((ratioSpec?.valueEn as ImageAspectRatio) || '1:1');
    const fitSpec = (prod.specifications || []).find((s) => s.keyEn === '_imageFitMode');
    setFormImageFitMode((fitSpec?.valueEn as ImageFitMode) || 'contain');
    setFormSpecs((prod.specifications || []).filter((s) => !s.keyEn.startsWith('_')));
    setFormVariants(prod.variants || []);
    setFormPrivateNotes(prod.privateNotes || '');
    setFormPurchaseCost(prod.purchaseCost || '');
    setFormStockQuantity(prod.stockQuantity || 0);
    setFormImeis(prod.imeiSerialNumbers || []);
    setImeiInput('');
    setProductModalOpen(true);
  };

  // Quick update product attributes (featured, new arrival, stock, status)
  const handleQuickUpdateProduct = async (
    id: number,
    updates: { isFeatured?: boolean; isNewArrival?: boolean; stockQuantity?: number; status?: ProductStatus }
  ) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/quick-update`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setProductsList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
        showNotification('Product updated instantly!');
        fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Adjust stock directly with increment / decrement
  const handleStockIncrement = async (p: Product, delta: number) => {
    const currentStock = p.stockQuantity ?? 0;
    const newStock = Math.max(0, currentStock + delta);
    handleQuickUpdateProduct(p.id, { stockQuantity: newStock });
  };

  // Bulk status update
  const handleBulkStatus = async (status: ProductStatus) => {
    if (selectedProductIds.length === 0) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products/bulk-status', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ids: selectedProductIds, status }),
      });
      if (res.ok) {
        showNotification(`Updated ${selectedProductIds.length} products to "${status}"`);
        setSelectedProductIds([]);
        fetchProducts();
        fetchOverview();
      }
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedProductIds.length} selected products?`)) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      if (res.ok) {
        showNotification(`Deleted ${selectedProductIds.length} products`);
        setSelectedProductIds([]);
        fetchProducts();
        fetchOverview();
      }
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllProducts = (filteredList: Product[]) => {
    if (selectedProductIds.length === filteredList.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredList.map((p) => p.id));
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate product');
      showNotification(`Product duplicated successfully as draft! SKU: ${data.sku}`);
      fetchProducts();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      showNotification(`Deleted product "${name}"`);
      fetchProducts();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: number, currentStatus: ProductStatus) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    handleQuickUpdateProduct(id, { status: nextStatus });
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formNameEn.trim()) {
      showNotification('SKU and English Name are required.', true);
      return;
    }

    setLoading(true);
    try {
      const cleanSpecs = formSpecs.filter((s) => !s.keyEn.startsWith('_'));
      cleanSpecs.push({
        keyEn: '_imageAspectRatio',
        keyAr: 'نسبة أبعاد الصورة',
        valueEn: formImageAspectRatio,
        valueAr: formImageAspectRatio,
      });
      cleanSpecs.push({
        keyEn: '_imageFitMode',
        keyAr: 'وضع الملاءمة',
        valueEn: formImageFitMode,
        valueAr: formImageFitMode,
      });

      const payload = {
        sku: formSku.trim(),
        nameEn: formNameEn.trim(),
        nameAr: formNameAr.trim() || formNameEn.trim(),
        descriptionEn: formDescEn,
        descriptionAr: formDescAr,
        condition: formCondition,
        categoryId: formCategoryId || null,
        brandId: formBrandId || null,
        status: formStatus,
        isFeatured: formIsFeatured,
        isNewArrival: formIsNewArrival,
        images: formImages,
        specifications: cleanSpecs,
        variants: formVariants,
        privateNotes: formPrivateNotes,
        purchaseCost: formPurchaseCost,
        stockQuantity: formStockQuantity,
        imeiSerialNumbers: formImeis,
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      showNotification(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setProductModalOpen(false);
      fetchProducts();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Upload via Base64 to PostgreSQL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showNotification('File exceeds 8MB limit. Please choose a smaller image.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        setLoading(true);
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            data: base64Data,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload image');

        setFormImages((prev) => [...prev, data.url]);
        showNotification('Image uploaded and persisted to PostgreSQL!');
      } catch (err: any) {
        showNotification(err.message, true);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Spec Row
  const handleAddSpecRow = () => {
    setFormSpecs((prev) => [...prev, { keyEn: '', keyAr: '', valueEn: '', valueAr: '' }]);
  };

  // Add Variant Row
  const handleAddVariantRow = () => {
    setFormVariants((prev) => [...prev, { nameEn: 'Color', nameAr: 'اللون', options: ['Black', 'Silver'] }]);
  };

  // Add IMEI
  const handleAddImei = () => {
    if (imeiInput.trim()) {
      setFormImeis((prev) => [...prev, imeiInput.trim()]);
      setImeiInput('');
    }
  };

  // Save WhatsApp Settings
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappSettingsData) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp-settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(whatsappSettingsData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setWhatsappSettingsData(data);
      showNotification('WhatsApp settings updated successfully!');
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Save Site Content
  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteContentData) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(siteContentData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update content');
      setSiteContentData(data);
      showNotification('Site content and announcements saved!');
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Brand Preset Icons
  const BRAND_PRESETS = [
    { name: 'Apple', url: '/src/assets/images/apple_brand_icon_1792330702744.jpg' },
    { name: 'Samsung', url: '/src/assets/images/samsung_brand_icon_1792330702562.jpg' },
    { name: 'Xiaomi', url: '/src/assets/images/xiaomi_brand_icon_1792330703614.jpg' },
    { name: 'Google Pixel', url: '/src/assets/images/pixel_brand_icon_1792330703295.jpg' },
    { name: 'OnePlus', url: '/src/assets/images/oneplus_brand_icon_1792330704300.jpg' },
  ];

  // Handle Brand Logo Upload
  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showNotification('File exceeds 8MB limit.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        setBrandLogoUploading(true);
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            data: base64Data,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload brand logo');

        setBrandLogoUrl(data.url);
        showNotification('Brand logo uploaded and saved to database!');
      } catch (err: any) {
        showNotification(err.message, true);
      } finally {
        setBrandLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Category Icon Upload
  const handleCategoryIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showNotification('File exceeds 8MB limit.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        setCatIconUploading(true);
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            data: base64Data,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload category icon');

        setCatIcon(data.url);
        showNotification('Category icon uploaded and saved to database!');
      } catch (err: any) {
        showNotification(err.message, true);
      } finally {
        setCatIconUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add / Update Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEn.trim()) return;
    try {
      setLoading(true);
      let res;
      if (editingCategory) {
        res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            nameEn: catNameEn.trim(),
            nameAr: catNameAr.trim() || catNameEn.trim(),
            icon: catIcon,
          }),
        });
      } else {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            nameEn: catNameEn.trim(),
            nameAr: catNameAr.trim() || catNameEn.trim(),
            icon: catIcon,
          }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save category');
      }
      showNotification(editingCategory ? `Updated category "${catNameEn}"` : `Added category "${catNameEn}"`);
      setCatNameEn('');
      setCatNameAr('');
      setCatIcon('Smartphone');
      setEditingCategory(null);
      fetchCategories();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete category');
      }
      showNotification(`Category "${name}" deleted`);
      fetchCategories();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Add / Update Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      setLoading(true);
      let res;
      if (editingBrand) {
        res = await fetch(`/api/admin/brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            name: brandName.trim(),
            logoUrl: brandLogoUrl,
          }),
        });
      } else {
        res = await fetch('/api/admin/brands', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: brandName.trim(),
            logoUrl: brandLogoUrl,
          }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save brand');
      }
      showNotification(editingBrand ? `Updated brand "${brandName}"` : `Added brand "${brandName}"`);
      setBrandName('');
      setBrandLogoUrl('');
      setEditingBrand(null);
      fetchBrands();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete brand');
      }
      showNotification(`Brand "${name}" deleted`);
      fetchBrands();
      fetchOverview();
    } catch (e: any) {
      showNotification(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Change Owner Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    if (!currPassword) {
      setPasswordChangeError('Current password or Master Setup Key is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match. Please re-enter.');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword: currPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      if (data.token) {
        localStorage.setItem('nm_admin_token', data.token);
      }

      setPasswordChangeSuccess('Password updated successfully! Your account credentials have been updated.');
      setCurrPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showNotification('Owner password updated successfully!');
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Failed to update password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151419] text-white flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#1b1920] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#922CB5]/30 border border-[#922CB5]/60 text-[#B7F34B] text-[10px] font-black uppercase tracking-wider">
            Owner Admin
          </span>
        </div>

        {/* Status Messages */}
        <div className="flex-1 max-w-md mx-4">
          {actionSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-xs animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="truncate">{actionError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs font-mono text-zinc-400">
            {adminUser.email}
          </span>

          <a
            href="/nasir-mobile-dubai-source-code.zip"
            download="nasir-mobile-dubai-source-code.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#922CB5]/20 hover:bg-[#922CB5]/30 border border-[#922CB5]/40 text-xs font-bold text-purple-200 hover:text-white transition-all cursor-pointer"
            title="Download complete project source code ZIP"
          >
            <Download className="w-3.5 h-3.5 text-[#B7F34B]" />
            <span className="hidden sm:inline">Source Code .ZIP</span>
          </a>

          <button
            onClick={onViewPublicSite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#B7F34B]" />
            <span className="hidden sm:inline">View Public Store</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-xs font-bold text-red-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar Tabs */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-[#18161d] border-b md:border-b-0 md:border-r border-white/5 p-4 space-y-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview & Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalogue Products</span>
            {stats && (
              <span className="ml-auto bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {stats.totalProducts}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'brands'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Brands</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'content'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Website Content</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('visitors')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'visitors'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 text-[#B7F34B]" />
            <span>Visitor Analytics</span>
            {visitorAnalytics && (
              <span className="ml-auto bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-mono text-[#B7F34B]">
                {visitorAnalytics.displayTodayVisitors}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#922CB5] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4 text-[#B7F34B]" />
            <span>Security & Password</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Nasir Mobile Dubai — Store Overview
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage catalogue hardware, WhatsApp communications, and Dubai operations.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Published</span>
                  <div className="text-3xl font-black text-[#B7F34B] mt-2">
                    {stats?.publishedCount || 0}
                  </div>
                  <span className="text-[10px] text-zinc-500">Live on public catalogue</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Drafts</span>
                  <div className="text-3xl font-black text-amber-400 mt-2">
                    {stats?.draftCount || 0}
                  </div>
                  <span className="text-[10px] text-zinc-500">Unpublished devices</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Categories</span>
                  <div className="text-3xl font-black text-[#922CB5] mt-2">
                    {stats?.totalCategories || 0}
                  </div>
                  <span className="text-[10px] text-zinc-500">Active product sections</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Brands</span>
                  <div className="text-3xl font-black text-white mt-2">
                    {stats?.totalBrands || 0}
                  </div>
                  <span className="text-[10px] text-zinc-500">Hardware manufacturers</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-2xl bg-[#242129] border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenAddProduct}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Settings</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('content')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Edit Homepage Banner</span>
                  </button>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="p-6 rounded-2xl bg-[#242129] border border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Recent Store Activity
                </h3>
                <div className="divide-y divide-white/5 text-xs">
                  {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                    stats.recentLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold text-[#B7F34B] mr-2">[{log.action}]</span>
                          <span className="text-zinc-200">{log.details}</span>
                        </div>
                        <span className="text-zinc-500 font-mono text-[11px] shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic py-2">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOGUE */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Manage Products
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Add, edit, duplicate, archive, and manage private inventory details.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(146,44,181,0.4)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products Overview Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Catalogue</span>
                  <span className="text-xl font-black text-white mt-1 font-mono">{productsList.length}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Configured models</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Published</span>
                  <span className="text-xl font-black text-emerald-300 mt-1 font-mono">
                    {productsList.filter((p) => p.status === 'published').length}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Visible to customers</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Drafts / Review</span>
                  <span className="text-xl font-black text-yellow-300 mt-1 font-mono">
                    {productsList.filter((p) => p.status === 'draft').length}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Unpublished</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Low / Out of Stock</span>
                  <span className="text-xl font-black text-rose-300 mt-1 font-mono">
                    {productsList.filter((p) => (p.stockQuantity ?? 0) <= 2).length}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Needs restock</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B7F34B]">Total Stock Units</span>
                  <span className="text-xl font-black text-[#B7F34B] mt-1 font-mono">
                    {productsList.reduce((acc, p) => acc + (p.stockQuantity ?? 0), 0)}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">In Dubai inventory</span>
                </div>
              </div>

              {/* Enhanced Multi-Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-[#242129] border border-white/5 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[220px]">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                      placeholder="Search by SKU, phone name, specs, or notes..."
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                    />
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {productSearch && (
                      <button
                        onClick={() => {
                          setProductSearch('');
                          setTimeout(fetchProducts, 50);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5] cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafts</option>
                    <option value="archived">Archived</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5] cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn}
                      </option>
                    ))}
                  </select>

                  {/* Brand Filter */}
                  <select
                    value={productBrandFilter}
                    onChange={(e) => setProductBrandFilter(e.target.value)}
                    className="bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5] cursor-pointer"
                  >
                    <option value="">All Brands</option>
                    {brandsList.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.name}
                      </option>
                    ))}
                  </select>

                  {/* Condition Filter */}
                  <select
                    value={productConditionFilter}
                    onChange={(e) => setProductConditionFilter(e.target.value)}
                    className="bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5] cursor-pointer"
                  >
                    <option value="all">All Conditions</option>
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Pre-Owned / Used</option>
                  </select>

                  {/* Stock Filter */}
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value as any)}
                    className="bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5] cursor-pointer"
                  >
                    <option value="all">All Inventory</option>
                    <option value="in_stock">In Stock (&gt;0)</option>
                    <option value="low_stock">Low Stock (1-2)</option>
                    <option value="out_of_stock">Out of Stock (0)</option>
                  </select>

                  <button
                    onClick={fetchProducts}
                    className="px-4 py-2 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    Apply Filters
                  </button>

                  {(productSearch ||
                    productStatusFilter !== 'all' ||
                    productCategoryFilter ||
                    productBrandFilter ||
                    productConditionFilter !== 'all' ||
                    productStockFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setProductStatusFilter('all');
                        setProductCategoryFilter('');
                        setProductBrandFilter('');
                        setProductConditionFilter('all');
                        setProductStockFilter('all');
                        setTimeout(fetchProducts, 50);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Action Bar (when products are selected) */}
              {selectedProductIds.length > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#922CB5]/30 to-[#B7F34B]/20 border border-[#B7F34B]/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#B7F34B] text-black text-xs font-black">
                      {selectedProductIds.length} Selected
                    </span>
                    <span className="text-xs text-zinc-300">Choose a bulk action for selected devices:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBulkStatus('published')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Publish Selected
                    </button>
                    <button
                      onClick={() => handleBulkStatus('draft')}
                      className="px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Draft Selected
                    </button>
                    <button
                      onClick={() => handleBulkStatus('archived')}
                      className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Archive Selected
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

              {/* Products Table with Rich Controls */}
              {(() => {
                const filteredProducts = productsList.filter((p) => {
                  if (productStockFilter === 'in_stock') return (p.stockQuantity ?? 0) > 0;
                  if (productStockFilter === 'low_stock') return (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 2;
                  if (productStockFilter === 'out_of_stock') return (p.stockQuantity ?? 0) === 0;
                  return true;
                });

                const allFilteredSelected =
                  filteredProducts.length > 0 &&
                  filteredProducts.every((p) => selectedProductIds.includes(p.id));

                return (
                  <div className="rounded-2xl bg-[#242129] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18161d] text-zinc-400 uppercase tracking-wider font-bold border-b border-white/5">
                          <tr>
                            <th className="p-3.5 w-10 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectAllProducts(filteredProducts)}
                                className="text-zinc-400 hover:text-white cursor-pointer"
                                title="Select All"
                              >
                                {allFilteredSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#B7F34B]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </th>
                            <th className="p-3.5">Device & Photos</th>
                            <th className="p-3.5">SKU</th>
                            <th className="p-3.5">Category & Brand</th>
                            <th className="p-3.5">Condition</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-center">Stock Inventory</th>
                            <th className="p-3.5">Badges</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => {
                              const primaryImg = p.images && p.images.length > 0 ? p.images[0] : null;
                              const imageCount = p.images?.length || 0;
                              const isSelected = selectedProductIds.includes(p.id);
                              const stock = p.stockQuantity ?? 0;

                              return (
                                <tr
                                  key={p.id}
                                  className={`hover:bg-white/[0.03] transition-colors ${
                                    isSelected ? 'bg-[#922CB5]/10' : ''
                                  }`}
                                >
                                  {/* Select Checkbox */}
                                  <td className="p-3.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectProduct(p.id)}
                                      className="text-zinc-400 hover:text-white cursor-pointer"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-[#B7F34B]" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>

                                  {/* Device Thumbnail & Name */}
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-3">
                                      {/* Clickable Image Box with Count Badge */}
                                      <div
                                        onClick={() => p.images && p.images.length > 0 && setGalleryModalProduct(p)}
                                        className="relative w-12 h-12 rounded-xl bg-[#151419] p-1 flex items-center justify-center shrink-0 border border-white/10 hover:border-[#B7F34B] cursor-pointer group transition-all"
                                        title={imageCount > 0 ? `Click to view all ${imageCount} photos` : 'No photos'}
                                      >
                                        {primaryImg ? (
                                          <img
                                            src={primaryImg}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <Smartphone className="w-5 h-5 text-zinc-600" />
                                        )}

                                        {imageCount > 1 && (
                                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#922CB5] text-white text-[9px] font-black font-mono shadow-md border border-[#922CB5]/40">
                                            +{imageCount}
                                          </span>
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <div
                                          onClick={() => handleOpenEditProduct(p)}
                                          className="font-bold text-white hover:text-[#B7F34B] cursor-pointer truncate max-w-xs transition-colors"
                                        >
                                          {p.nameEn}
                                        </div>
                                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">{p.nameAr}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* SKU with Copy */}
                                  <td className="p-3.5 font-mono text-zinc-300 font-bold">
                                    <div className="flex items-center gap-1.5">
                                      <span>{p.sku}</span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(p.sku);
                                          showNotification(`Copied SKU: ${p.sku}`);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white cursor-pointer"
                                        title="Copy SKU"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Category & Brand */}
                                  <td className="p-3.5">
                                    <div className="text-zinc-200 font-semibold">{p.categoryNameEn || '—'}</div>
                                    <div className="text-[10px] text-zinc-500">{p.brandName || '—'}</div>
                                  </td>

                                  {/* Condition */}
                                  <td className="p-3.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        p.condition === 'New'
                                          ? 'bg-[#B7F34B]/20 text-[#B7F34B]'
                                          : p.condition === 'Refurbished'
                                          ? 'bg-purple-900/40 text-purple-300'
                                          : 'bg-amber-900/40 text-amber-300'
                                      }`}
                                    >
                                      {p.condition}
                                    </span>
                                  </td>

                                  {/* Status Toggle */}
                                  <td className="p-3.5">
                                    <button
                                      onClick={() => handleToggleStatus(p.id, p.status)}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                                        p.status === 'published'
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900'
                                          : p.status === 'draft'
                                          ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-900'
                                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                                      }`}
                                      title="Click to toggle between published and draft"
                                    >
                                      {p.status}
                                    </button>
                                  </td>

                                  {/* Inline Stock Quantity Adjuster */}
                                  <td className="p-3.5 text-center">
                                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#151419] border border-white/10">
                                      <button
                                        type="button"
                                        onClick={() => handleStockIncrement(p, -1)}
                                        disabled={stock <= 0}
                                        className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer transition-colors"
                                        title="Decrease Stock"
                                      >
                                        <Minus className="w-2.5 h-2.5" />
                                      </button>
                                      <span
                                        className={`font-mono text-xs font-bold px-1.5 ${
                                          stock === 0
                                            ? 'text-rose-400'
                                            : stock <= 2
                                            ? 'text-yellow-400'
                                            : 'text-emerald-400'
                                        }`}
                                      >
                                        {stock}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleStockIncrement(p, 1)}
                                        className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
                                        title="Increase Stock"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                    {p.purchaseCost && (
                                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                        Cost: {p.purchaseCost}
                                      </div>
                                    )}
                                  </td>

                                  {/* Badges: Featured & New Arrival Quick Toggles */}
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickUpdateProduct(p.id, { isFeatured: !p.isFeatured })
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          p.isFeatured
                                            ? 'bg-purple-950/80 border-purple-500/50 text-[#B7F34B]'
                                            : 'bg-white/5 border-transparent text-zinc-600 hover:text-zinc-300'
                                        }`}
                                        title={p.isFeatured ? 'Featured flagship (Click to remove)' : 'Click to mark as featured'}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-[#B7F34B]' : ''}`} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickUpdateProduct(p.id, { isNewArrival: !p.isNewArrival })
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          p.isNewArrival
                                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                            : 'bg-white/5 border-transparent text-zinc-600 hover:text-zinc-300'
                                        }`}
                                        title={p.isNewArrival ? 'New Arrival (Click to remove)' : 'Click to mark as new arrival'}
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditProduct(p)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                                        title="Edit Product & Photos"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDuplicateProduct(p.id)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                                        title="Duplicate Product"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(p.id, p.nameEn)}
                                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 cursor-pointer"
                                        title="Delete Product"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-zinc-400">
                                No products found matching current filters. Click "Add Product" to add a new device!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Categories & Icons</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Organize your store departments with system vector icons or custom uploaded badge images.
                  </p>
                </div>
                {editingCategory && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatNameEn('');
                      setCatNameAr('');
                      setCatIcon('Smartphone');
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300"
                  >
                    ✕ Cancel Editing
                  </button>
                )}
              </div>

              {/* Add / Edit Category Form */}
              <form onSubmit={handleAddCategory} className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-[#922CB5]/20 border border-[#922CB5]/40 flex items-center justify-center text-[#B7F34B]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {editingCategory ? `Edit Category: ${editingCategory.nameEn}` : 'Add New Category'}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Configure titles and visual category icon</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Category Name (English) *
                    </label>
                    <input
                      type="text"
                      value={catNameEn}
                      onChange={(e) => setCatNameEn(e.target.value)}
                      placeholder="e.g. Gaming Phones"
                      required
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Category Name (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={catNameAr}
                      onChange={(e) => setCatNameAr(e.target.value)}
                      placeholder="هواتف الألعاب"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>
                </div>

                {/* Category Icon / Image Uploader with Presets and Drag-and-Drop */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Category Icon / Graphic
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#B7F34B]/15 text-[#B7F34B] border border-[#B7F34B]/30">
                      1:1 Ratio (Square • 500×500 px)
                    </span>
                  </div>
                  <IconImageUploader
                    type="category"
                    name={catNameEn}
                    currentValue={catIcon}
                    token={token}
                    onChange={setCatIcon}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all hover:scale-102"
                  >
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </button>
                </div>
              </form>

              {/* Categories Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Active Categories ({categoriesList.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoriesList.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl bg-[#242129] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#151419] border border-white/10 flex items-center justify-center text-[#B7F34B] overflow-hidden shrink-0">
                          {cat.icon && (cat.icon.startsWith('/') || cat.icon.startsWith('http') || cat.icon.startsWith('data:')) ? (
                            <img
                              src={cat.icon}
                              alt={cat.nameEn}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Smartphone className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{cat.nameEn}</div>
                          <div className="text-xs text-zinc-400">{cat.nameAr}</div>
                          <span className="text-[10px] font-mono text-zinc-500">slug: {cat.slug}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatNameEn(cat.nameEn);
                            setCatNameAr(cat.nameAr || '');
                            setCatIcon(cat.icon || 'Smartphone');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Category & Icon"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.nameEn)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDS */}
          {activeTab === 'brands' && (
            <div className="space-y-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Brand Logos & Manufacturers</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Customize brand logos with high-resolution images or 1-click preset luxury badges.
                  </p>
                </div>
                {editingBrand && (
                  <button
                    onClick={() => {
                      setEditingBrand(null);
                      setBrandName('');
                      setBrandLogoUrl('');
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300"
                  >
                    ✕ Cancel Editing
                  </button>
                )}
              </div>

              {/* Add / Edit Brand Form with Image Uploader */}
              <form onSubmit={handleAddBrand} className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#B7F34B]/20 border border-[#B7F34B]/40 flex items-center justify-center text-[#B7F34B]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add New Brand'}
                      </h3>
                      <p className="text-[11px] text-zinc-400">Upload or select a distinctive circular brand emblem</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#B7F34B]/10 border border-[#B7F34B]/30 text-[#B7F34B]">
                    <span className="text-[10px] font-black uppercase tracking-wider">Recommended Ratio: 1:1 Square (500×500 px or 400×400 px)</span>
                  </div>
                </div>

                {/* Brand Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Google Pixel, Nothing, Motorola"
                    required
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>

                {/* Brand Logo & Emblem Uploader with Presets and Drag-and-Drop */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Brand Logo & Emblem Graphic
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#B7F34B]/15 text-[#B7F34B] border border-[#B7F34B]/30">
                      1:1 Ratio (Square • 500×500 px)
                    </span>
                  </div>
                  <IconImageUploader
                    type="brand"
                    name={brandName}
                    currentValue={brandLogoUrl}
                    token={token}
                    onChange={setBrandLogoUrl}
                    onNameAutoFill={(presetName) => {
                      if (!brandName) setBrandName(presetName);
                    }}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || brandLogoUploading}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all hover:scale-102"
                  >
                    {editingBrand ? 'Update Brand' : 'Save Brand'}
                  </button>
                </div>
              </form>

              {/* Brands Grid with Logo Badges */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Configured Brands ({brandsList.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {brandsList.map((br) => (
                    <div
                      key={br.id}
                      className="p-4 rounded-2xl bg-[#242129] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#151419] flex items-center justify-center shrink-0">
                          {br.logoUrl ? (
                            <img
                              src={br.logoUrl}
                              alt={br.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-[#B7F34B] font-mono">
                              {br.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block truncate">{br.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 block truncate">slug: {br.slug}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingBrand(br);
                            setBrandName(br.name);
                            setBrandLogoUrl(br.logoUrl || '');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Brand & Logo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(br.id, br.name)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WHATSAPP SETTINGS */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  WhatsApp Business Settings
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure the store numbers and dynamic bilingual message templates.
                </p>
              </div>

              {whatsappSettingsData && (
                <form onSubmit={handleSaveWhatsApp} className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Primary Number
                      </label>
                      <input
                        type="text"
                        value={whatsappSettingsData.primaryNumber}
                        onChange={(e) =>
                          setWhatsappSettingsData({
                            ...whatsappSettingsData,
                            primaryNumber: e.target.value,
                          })
                        }
                        className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-[#922CB5]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Secondary Number
                      </label>
                      <input
                        type="text"
                        value={whatsappSettingsData.secondaryNumber}
                        onChange={(e) =>
                          setWhatsappSettingsData({
                            ...whatsappSettingsData,
                            secondaryNumber: e.target.value,
                          })
                        }
                        className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-[#922CB5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Active Primary Line for Enquiry Buttons
                    </label>
                    <select
                      value={whatsappSettingsData.activeNumber}
                      onChange={(e) =>
                        setWhatsappSettingsData({
                          ...whatsappSettingsData,
                          activeNumber: e.target.value,
                        })
                      }
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-[#922CB5]"
                    >
                      <option value={whatsappSettingsData.primaryNumber}>
                        Primary: {whatsappSettingsData.primaryNumber}
                      </option>
                      <option value={whatsappSettingsData.secondaryNumber}>
                        Secondary: {whatsappSettingsData.secondaryNumber}
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="wa-enabled"
                      checked={whatsappSettingsData.isEnabled}
                      onChange={(e) =>
                        setWhatsappSettingsData({
                          ...whatsappSettingsData,
                          isEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#B7F34B] rounded cursor-pointer"
                    />
                    <label htmlFor="wa-enabled" className="text-xs font-bold text-white cursor-pointer">
                      Enable WhatsApp enquiry buttons globally
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      English Message Template
                    </label>
                    <p className="text-[11px] text-zinc-400 mb-1">
                      Available tokens: {'{productName}'}, {'{brand}'}, {'{sku}'}, {'{condition}'}, {'{variant}'}, {'{url}'}
                    </p>
                    <textarea
                      rows={3}
                      value={whatsappSettingsData.templateEn}
                      onChange={(e) =>
                        setWhatsappSettingsData({
                          ...whatsappSettingsData,
                          templateEn: e.target.value,
                        })
                      }
                      className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Arabic Message Template
                    </label>
                    <textarea
                      rows={3}
                      value={whatsappSettingsData.templateAr}
                      onChange={(e) =>
                        setWhatsappSettingsData({
                          ...whatsappSettingsData,
                          templateAr: e.target.value,
                        })
                      }
                      dir="rtl"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Save WhatsApp Configuration
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 6: SITE CONTENT & BANNER */}
          {activeTab === 'content' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Website Content & Information
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Customize hero titles, announcement bar, business hours, and Dubai address.
                </p>
              </div>

              {siteContentData && (
                <form onSubmit={handleSaveSiteContent} className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-5">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#B7F34B] uppercase tracking-wider">
                      Announcement Bar
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Announcement (English)
                        </label>
                        <input
                          type="text"
                          value={siteContentData.announcementEn}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, announcementEn: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Announcement (Arabic)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={siteContentData.announcementAr}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, announcementAr: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-xs font-bold text-[#922CB5] uppercase tracking-wider">
                      Hero Banner
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Hero Title (English)
                        </label>
                        <input
                          type="text"
                          value={siteContentData.heroTitleEn}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, heroTitleEn: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Hero Title (Arabic)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={siteContentData.heroTitleAr}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, heroTitleAr: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Hero Subtitle (English)
                        </label>
                        <textarea
                          rows={2}
                          value={siteContentData.heroSubtitleEn}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, heroSubtitleEn: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Hero Subtitle (Arabic)
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          value={siteContentData.heroSubtitleAr}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, heroSubtitleAr: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Store Contact & Hours
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Opening Hours (EN)
                        </label>
                        <input
                          type="text"
                          value={siteContentData.openingHoursEn}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, openingHoursEn: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Opening Hours (AR)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={siteContentData.openingHoursAr}
                          onChange={(e) =>
                            setSiteContentData({ ...siteContentData, openingHoursAr: e.target.value })
                          }
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={siteContentData.contactEmail}
                        onChange={(e) =>
                          setSiteContentData({ ...siteContentData, contactEmail: e.target.value })
                        }
                        className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Save Site Content
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Store Audit Logs
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete history of product changes, status transitions, and owner logins.
                </p>
              </div>

              <div className="rounded-2xl bg-[#242129] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18161d] text-zinc-400 uppercase tracking-wider font-bold border-b border-white/5">
                      <tr>
                        <th className="p-4">Action</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {auditLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 font-bold text-[#B7F34B]">{log.action}</td>
                          <td className="p-4 text-zinc-300 font-sans">{log.details}</td>
                          <td className="p-4 text-zinc-400 text-[11px]">{log.userEmail || 'system'}</td>
                          <td className="p-4 text-zinc-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Owner Security & Credentials
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage your store owner credentials, update password, and review secret portal triggers.
                </p>
              </div>

              {/* Status Alerts */}
              {passwordChangeError && (
                <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                  <div className="flex-1 leading-relaxed">{passwordChangeError}</div>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 leading-relaxed">{passwordChangeSuccess}</div>
                </div>
              )}

              {/* Current Account & Portal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#922CB5]/20 border border-[#922CB5]/40 flex items-center justify-center text-[#B7F34B]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Active Owner Account
                      </h3>
                      <p className="text-xs text-zinc-400">Authenticated via signed session</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#151419] border border-white/5">
                      <span className="text-zinc-400">Owner Email:</span>
                      <span className="font-mono text-white font-bold">{adminUser.email}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#151419] border border-white/5">
                      <span className="text-zinc-400">Role:</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#B7F34B]/20 text-[#B7F34B] font-bold text-[11px] uppercase tracking-wide">
                        {adminUser.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#151419] border border-white/5">
                      <span className="text-zinc-400">Master Setup Key Status:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                          masterKeyInfo?.hasCustomKey
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {masterKeyInfo?.hasCustomKey ? 'Custom Master Key Active' : 'Factory Default Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#242129] border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#B7F34B]/20 border border-[#B7F34B]/40 flex items-center justify-center text-[#B7F34B]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Hidden Portal Triggers
                      </h3>
                      <p className="text-xs text-zinc-400">Away from customer eye</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs text-zinc-300">
                    <div className="p-3 rounded-xl bg-[#151419] border border-white/5 space-y-1">
                      <span className="text-white font-bold block">1. Keyboard Shortcut</span>
                      <p className="text-zinc-400 text-[11px]">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px]">A</kbd> anywhere on the store website.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#151419] border border-white/5 space-y-1">
                      <span className="text-white font-bold block">2. Secret Footer Trigger</span>
                      <p className="text-zinc-400 text-[11px]">
                        Click the <span className="text-white font-bold font-mono">©</span> copyright symbol or the discreet dot in the website footer.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#151419] border border-white/5 space-y-1">
                      <span className="text-white font-bold block">3. Direct URL Hash</span>
                      <p className="text-zinc-400 text-[11px]">
                        Navigate directly to <span className="font-mono text-[#B7F34B]">/#admin</span> or <span className="font-mono text-[#B7F34B]">/#owner</span> in your browser.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Password Update Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#242129] border border-white/5 space-y-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#B7F34B]" />
                    <span>Change Owner Password</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update your owner password securely. It will be encrypted with bcrypt (10 rounds) in the database.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Current Password OR Master Setup Key *
                    </label>
                    <input
                      type="password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      placeholder="Enter current password or NasirMobileDubai2026!"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      New Password (Minimum 8 Characters) *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                    />
                    {newPassword && (
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className="text-zinc-400">Strength:</span>
                        <span className={`font-bold ${newPassword.length >= 10 ? 'text-emerald-400' : newPassword.length >= 8 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {newPassword.length >= 10 ? 'Strong' : newPassword.length >= 8 ? 'Good' : 'Too Short'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordChangeLoading}
                      className="px-6 py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(146,44,181,0.35)] disabled:opacity-50 cursor-pointer"
                    >
                      {passwordChangeLoading ? 'Updating Password...' : 'Save New Owner Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Master Key Management & Reset Section */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#242129] border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#922CB5] to-[#B7F34B] p-[1px] flex-shrink-0">
                      <div className="w-full h-full rounded-2xl bg-[#151419] flex items-center justify-center text-[#B7F34B]">
                        <Key className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white uppercase tracking-tight">
                          Master Key Management & Reset
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          masterKeyInfo?.hasCustomKey
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {masterKeyInfo?.hasCustomKey ? 'Custom Key Active' : 'Default Factory Key Active'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        The Master Key provides direct access for the store owner and authorized team. You can change it to a custom key or reset it back to factory default at any time.
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Reset to Default Button */}
                  <button
                    type="button"
                    onClick={handleResetMasterKeyToDefault}
                    disabled={masterKeyLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${masterKeyLoading ? 'animate-spin' : ''}`} />
                    <span>Reset Master Key to Default</span>
                  </button>
                </div>

                {/* Status & Masked Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#151419] border border-white/5 space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Current Master Key Status
                    </span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        {masterKeyInfo?.hasCustomKey ? 'Custom Master Key Configured' : 'Factory Default (NasirMobileDubai2026!)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Masked preview: <span className="font-mono text-zinc-300 font-bold">{masterKeyInfo?.maskedKey || '••••••••'}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#151419] border border-white/5 space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Self-Service Recovery
                    </span>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B7F34B]" />
                      <span className="text-sm font-bold text-white">
                        Reset from Anywhere
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      If ever forgotten or compromised, authorized owners can reset it here or directly from the Admin Login screen using Owner Account credentials.
                    </p>
                  </div>
                </div>

                {/* Feedback notifications */}
                {masterKeySuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{masterKeySuccess}</span>
                  </div>
                )}
                {masterKeyError && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{masterKeyError}</span>
                  </div>
                )}

                {/* Set New Custom Master Key Form */}
                <form onSubmit={handleChangeMasterKey} className="space-y-4 max-w-lg pt-2">
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Set New Custom Master Key
                    </h4>
                    <p className="text-[11px] text-zinc-400 mb-4">
                      Create a strong custom secret key for your team. Minimum 6 characters.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      New Master Key *
                    </label>
                    <input
                      type="password"
                      value={newMasterKeyInput}
                      onChange={(e) => setNewMasterKeyInput(e.target.value)}
                      placeholder="Enter new master key (min. 6 characters)"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confirm New Master Key *
                    </label>
                    <input
                      type="password"
                      value={confirmMasterKeyInput}
                      onChange={(e) => setConfirmMasterKeyInput(e.target.value)}
                      placeholder="Re-enter new master key"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Verify Current Owner Password or Current Master Key *
                    </label>
                    <input
                      type="password"
                      value={masterKeyVerifyPassword}
                      onChange={(e) => setMasterKeyVerifyPassword(e.target.value)}
                      placeholder="Enter your owner password to authorize change"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                      required
                    />
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={masterKeyLoading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#922CB5] to-[#B7F34B] hover:opacity-95 text-[#151419] text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(183,243,75,0.2)] disabled:opacity-50 cursor-pointer"
                    >
                      {masterKeyLoading ? 'Updating Master Key...' : 'Save New Master Key'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetMasterKeyToDefault}
                      disabled={masterKeyLoading}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 8: VISITOR ANALYTICS & COUNTER CONTROL */}
          {activeTab === 'visitors' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#391548] text-[#B7F34B] text-xs font-bold uppercase tracking-widest mb-2">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Real-Time Analytics & Control</span>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Website Visitor Analytics
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live unique traffic tracking for Nasir Mobile Dubai (Asia/Dubai midnight reset). Manage public display adjustments without altering actual analytics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchVisitorAnalytics}
                  disabled={visitorLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-[#B7F34B] ${visitorLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Traffic</span>
                </button>
              </div>

              {/* 4 Metric Cards: Actual Analytics vs Displayed Public Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Today's Unique Visitors */}
                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Today's Visitors
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="my-3">
                    <div className="text-3xl font-black text-[#B7F34B] font-mono">
                      {(visitorAnalytics?.displayTodayVisitors ?? 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-zinc-400">Actual Tracked:</span>
                      <span className="font-mono font-bold text-white">
                        {(visitorAnalytics?.actualTodayVisitors ?? 0).toLocaleString()}
                      </span>
                      {visitorAnalytics?.todayAdjustment !== 0 && (
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                          (visitorAnalytics?.todayAdjustment ?? 0) > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {(visitorAnalytics?.todayAdjustment ?? 0) > 0 ? '+' : ''}
                          {visitorAnalytics?.todayAdjustment}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Unique devices today • Resets at 00:00 GST
                  </span>
                </div>

                {/* Card 2: Total Unique Visitors */}
                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Total Visitors
                    </span>
                    <Users className="w-4 h-4 text-[#922CB5]" />
                  </div>

                  <div className="my-3">
                    <div className="text-3xl font-black text-white font-mono">
                      {(visitorAnalytics?.displayTotalVisitors ?? 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-zinc-400">Actual Tracked:</span>
                      <span className="font-mono font-bold text-white">
                        {(visitorAnalytics?.actualTotalVisitors ?? 0).toLocaleString()}
                      </span>
                      {visitorAnalytics?.totalAdjustment !== 0 && (
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                          (visitorAnalytics?.totalAdjustment ?? 0) > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {(visitorAnalytics?.totalAdjustment ?? 0) > 0 ? '+' : ''}
                          {visitorAnalytics?.totalAdjustment}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Lifetime cumulative unique visitors
                  </span>
                </div>

                {/* Card 3: Today's Page Views */}
                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Today's Page Views
                    </span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="my-3">
                    <div className="text-3xl font-black text-amber-400 font-mono">
                      {(visitorAnalytics?.actualTodayPageViews ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Avg{' '}
                      <span className="font-mono font-bold text-white">
                        {visitorAnalytics?.actualTodayVisitors
                          ? (
                              (visitorAnalytics.actualTodayPageViews || 0) /
                              Math.max(1, visitorAnalytics.actualTodayVisitors)
                            ).toFixed(1)
                          : '1.0'}
                      </span>{' '}
                      views per visitor
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Catalogue hits • Automated bots filtered
                  </span>
                </div>

                {/* Card 4: Public Status */}
                <div className="p-5 rounded-2xl bg-[#242129] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Public Counter
                    </span>
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                  </div>

                  <div className="my-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${editVisitorEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <span className="text-xl font-black text-white uppercase">
                        {editVisitorEnabled ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 capitalize font-medium">
                      Mode: <span className="text-white font-bold">{editVisitorDisplayMode} stats</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    Renders above website footer
                  </span>
                </div>
              </div>

              {/* Display Adjustments & Control Panel */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#242129] border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#B7F34B]" />
                      <span>Public Counter Display Adjustments</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Fine-tune displayed numbers for public view. Underlying database analytics records remain 100% accurate and untouched.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetVisitorAdjustments}
                    disabled={visitorResetting}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-xs font-bold text-rose-200 transition-all cursor-pointer self-start sm:self-auto"
                    title="Reset all display adjustments to 0 so the public counter directly matches real tracked analytics"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${visitorResetting ? 'animate-spin' : ''}`} />
                    <span>Restore Real Analytics</span>
                  </button>
                </div>

                <form onSubmit={handleSaveVisitorSettings} className="space-y-6">
                  {/* Master Visibility & Display Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Toggle Visibility */}
                    <div className="p-4 rounded-2xl bg-[#151419] border border-white/5 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Show Visitor Counter on Website
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            Toggle public badge visibility above the footer.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editVisitorEnabled}
                          onChange={(e) => setEditVisitorEnabled(e.target.checked)}
                          className="w-5 h-5 accent-[#922CB5] rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Display Mode Selector */}
                    <div className="p-4 rounded-2xl bg-[#151419] border border-white/5 space-y-2">
                      <label className="block text-xs font-bold text-white">
                        Display Mode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditVisitorDisplayMode('both')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            editVisitorDisplayMode === 'both'
                              ? 'bg-[#922CB5] text-white shadow-md'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Both Stats
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditVisitorDisplayMode('today')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            editVisitorDisplayMode === 'today'
                              ? 'bg-[#922CB5] text-white shadow-md'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Today Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditVisitorDisplayMode('total')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            editVisitorDisplayMode === 'total'
                              ? 'bg-[#922CB5] text-white shadow-md'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Total Only
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Number Adjustments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Today's Visitors Adjustment (+ or -)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editVisitorTodayAdj}
                          onChange={(e) => setEditVisitorTodayAdj(parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Resulting display: <span className="font-mono text-[#B7F34B] font-bold">
                          {Math.max(0, (visitorAnalytics?.actualTodayVisitors ?? 0) + Number(editVisitorTodayAdj)).toLocaleString()}
                        </span>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Total Visitors Adjustment (+ or -)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editVisitorTotalAdj}
                          onChange={(e) => setEditVisitorTotalAdj(parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                          className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Resulting display: <span className="font-mono text-white font-bold">
                          {Math.max(0, (visitorAnalytics?.actualTotalVisitors ?? 0) + Number(editVisitorTotalAdj)).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Customer Live Preview (How it looks on store)
                      </span>
                      <span className="text-[10px] text-zinc-500">Live preview of changes</span>
                    </div>

                    {editVisitorEnabled ? (
                      <div className="flex justify-center py-2">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#1b1920]/90 border border-white/10 shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7F34B] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B7F34B]" />
                            </span>
                            <span className="text-[11px] font-bold text-zinc-300">Live</span>
                          </div>

                          <div className="h-4 w-px bg-white/10" />

                          {(editVisitorDisplayMode === 'both' || editVisitorDisplayMode === 'today') && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-zinc-400 font-medium">Today:</span>
                              <span className="font-black text-[#B7F34B] font-mono">
                                {Math.max(0, (visitorAnalytics?.actualTodayVisitors ?? 0) + Number(editVisitorTodayAdj)).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {editVisitorDisplayMode === 'both' && (
                            <div className="h-3 w-px bg-white/10" />
                          )}

                          {(editVisitorDisplayMode === 'both' || editVisitorDisplayMode === 'total') && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-zinc-400 font-medium">Total:</span>
                              <span className="font-black text-white font-mono">
                                {Math.max(0, (visitorAnalytics?.actualTotalVisitors ?? 0) + Number(editVisitorTotalAdj)).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-zinc-500 italic">
                        Counter is currently set to HIDDEN. It will not be shown to customers.
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={visitorSaving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(146,44,181,0.35)] disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{visitorSaving ? 'Saving Changes...' : 'Save Display Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Visual Daily Traffic Chart (Recent 14 Days) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#242129] border border-white/5 space-y-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#B7F34B]" />
                    <span>Daily Traffic Trends (Recent Activity)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real daily unique visitors and page views recorded over time.
                  </p>
                </div>

                {(() => {
                  const statsList = visitorAnalytics?.recentDailyStats || [];
                  const displayStats = [...statsList].reverse().slice(-14);
                  const maxVal = Math.max(10, ...displayStats.map((s) => Math.max(s.uniqueVisitors, s.pageViews)));

                  if (displayStats.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-zinc-500 italic">
                        No traffic history recorded yet. Stats will populate as visitors browse your catalogue.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Bar columns */}
                      <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-white/10">
                        {displayStats.map((item, idx) => {
                          const visitorHeight = Math.max(8, (item.uniqueVisitors / maxVal) * 100);
                          const viewsHeight = Math.max(8, (item.pageViews / maxVal) * 100);
                          const dateObj = new Date(item.date + 'T12:00:00Z');
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNum = item.date.split('-').slice(1).join('/');

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 rounded-lg px-2.5 py-1 text-[10px] font-mono text-zinc-200 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                <div>{item.date}</div>
                                <div className="text-[#B7F34B]">{item.uniqueVisitors} unique</div>
                                <div className="text-amber-300">{item.pageViews} views</div>
                              </div>

                              {/* Bars container */}
                              <div className="w-full flex items-end justify-center gap-1 h-full">
                                {/* Visitors bar */}
                                <div
                                  style={{ height: `${visitorHeight}%` }}
                                  className="w-1/2 bg-gradient-to-t from-[#922CB5] to-[#B7F34B] rounded-t-sm transition-all group-hover:brightness-125"
                                  title={`${item.uniqueVisitors} unique visitors`}
                                />
                                {/* Page views bar */}
                                <div
                                  style={{ height: `${viewsHeight}%` }}
                                  className="w-1/2 bg-gradient-to-t from-zinc-700 to-amber-400 rounded-t-sm transition-all group-hover:brightness-125 opacity-70"
                                  title={`${item.pageViews} page views`}
                                />
                              </div>

                              {/* X Axis Label */}
                              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white shrink-0 mt-1">
                                {dayName}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                                {dayNum}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-[#B7F34B]" />
                          <span>Unique Visitors</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-amber-400" />
                          <span>Page Views</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Historical Daily Table */}
              <div className="rounded-2xl bg-[#242129] border border-white/5 overflow-hidden">
                <div className="p-4 bg-[#18161d] border-b border-white/5 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Historical Daily Records
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Timezone: Asia/Dubai (GST)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18161d]/50 text-zinc-400 uppercase tracking-wider font-bold border-b border-white/5">
                      <tr>
                        <th className="p-3.5">Date (GST)</th>
                        <th className="p-3.5">Unique Visitors</th>
                        <th className="p-3.5">Page Views</th>
                        <th className="p-3.5">Engagement Ratio</th>
                        <th className="p-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {(visitorAnalytics?.recentDailyStats || []).map((row, idx) => {
                        const isToday = idx === 0;
                        const ratio = row.uniqueVisitors > 0 ? (row.pageViews / row.uniqueVisitors).toFixed(1) : '1.0';

                        return (
                          <tr key={row.date} className="hover:bg-white/[0.02]">
                            <td className="p-3.5 flex items-center gap-2">
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                                  Today
                                </span>
                              )}
                              <span className="text-white font-bold">{row.date}</span>
                            </td>
                            <td className="p-3.5 text-[#B7F34B] font-bold">
                              {row.uniqueVisitors.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-zinc-300">
                              {row.pageViews.toLocaleString()}
                            </td>
                            <td className="p-3.5 text-zinc-400 text-[11px]">
                              {ratio} views / visitor
                            </td>
                            <td className="p-3.5 text-right">
                              <span className="text-emerald-400 text-[11px] font-bold">Recorded</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PRODUCT ADD / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-[#1b1920] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#242129] border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Fill in public catalogue details and private store owner records.
                </p>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    SKU (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. NM-IP16P-256"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Condition *
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as ProductCondition)}
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Certified Refurbished</option>
                    <option value="Used">Used / Pre-Owned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  >
                    <option value="published">Published (Visible Publicly)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Category & Brand Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  >
                    <option value="">No Category</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.nameAr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  >
                    <option value="">No Brand</option>
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bilingual Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    English Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. iPhone 16 Pro Max 256GB"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Arabic Product Name
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="آيفون 16 برو ماكس 256 جيجابايت"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>
              </div>

              {/* Bilingual Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    English Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Features, battery condition, accessories included..."
                    className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Arabic Description
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={formDescAr}
                    onChange={(e) => setFormDescAr(e.target.value)}
                    placeholder="المواصفات، حالة البطارية، الملحقات المرفقة..."
                    className="w-full bg-[#151419] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 py-2 border-y border-white/5">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#922CB5] rounded"
                  />
                  <span>Mark as Featured Flagship</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsNewArrival}
                    onChange={(e) => setFormIsNewArrival(e.target.checked)}
                    className="w-4 h-4 accent-[#B7F34B] rounded"
                  />
                  <span>Mark as New Arrival</span>
                </label>
              </div>

              {/* Multi-Image & Aspect Ratio Management Stage */}
              <div className="p-4 rounded-3xl bg-[#1b1920] border border-white/10">
                <ProductMultiImageUploader
                  images={formImages}
                  token={token}
                  onChange={setFormImages}
                  aspectRatio={formImageAspectRatio}
                  fitMode={formImageFitMode}
                  onAspectRatioChange={setFormImageAspectRatio}
                  onFitModeChange={setFormImageFitMode}
                />
              </div>

              {/* Specifications Builder */}
              <div className="p-4 rounded-2xl bg-[#242129] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Specifications (Technical Details)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20 cursor-pointer"
                  >
                    + Add Specification
                  </button>
                </div>

                <div className="space-y-2">
                  {formSpecs.map((spec, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 items-center text-xs">
                      <input
                        type="text"
                        placeholder="Key (EN)"
                        value={spec.keyEn}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[idx].keyEn = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="bg-[#151419] border border-white/10 rounded-lg p-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="المواصفة (AR)"
                        value={spec.keyAr}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[idx].keyAr = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="bg-[#151419] border border-white/10 rounded-lg p-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Value (EN)"
                        value={spec.valueEn}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[idx].valueEn = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="bg-[#151419] border border-white/10 rounded-lg p-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="القيمة (AR)"
                        value={spec.valueAr}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[idx].valueAr = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="bg-[#151419] border border-white/10 rounded-lg p-2 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormSpecs(formSpecs.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 text-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Private Administrative Fields (STRICTLY HIDDEN FROM PUBLIC CATALOGUE) */}
              <div className="p-5 rounded-2xl bg-black/40 border border-[#922CB5]/40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Owner Private Storage (Strictly Confidential — Server Protected)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Purchase Cost (AED)
                    </label>
                    <input
                      type="text"
                      value={formPurchaseCost}
                      onChange={(e) => setFormPurchaseCost(e.target.value)}
                      placeholder="e.g. 3,850 AED"
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Stock Quantity (In Dubai Store)
                    </label>
                    <input
                      type="number"
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    IMEI & Serial Numbers
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={imeiInput}
                      onChange={(e) => setImeiInput(e.target.value)}
                      placeholder="Enter 15-digit IMEI or hardware serial"
                      className="flex-1 bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#922CB5]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImei}
                      className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Add IMEI
                    </button>
                  </div>
                  {formImeis.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formImeis.map((imei, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded bg-[#151419] border border-white/5 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5"
                        >
                          <span>{imei}</span>
                          <button
                            type="button"
                            onClick={() => setFormImeis(formImeis.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Private Supplier Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formPrivateNotes}
                    onChange={(e) => setFormPrivateNotes(e.target.value)}
                    placeholder="Supplier name, invoice ref, warranty expiry with distributor..."
                    className="w-full bg-[#151419] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#922CB5]"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  {loading ? 'Saving to Database...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Image Gallery Lightbox Modal */}
      {galleryModalProduct && (
        <div
          onClick={() => {
            setGalleryModalProduct(null);
            setGalleryActiveIndex(0);
          }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#1b1920] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col cursor-default max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">{galleryModalProduct.nameEn}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  <span className="font-mono text-[#B7F34B]">{galleryModalProduct.sku}</span>
                  <span>•</span>
                  <span>{galleryModalProduct.images?.length || 0} photos uploaded</span>
                  <span>•</span>
                  <span>Stock: {galleryModalProduct.stockQuantity ?? 0}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGalleryModalProduct(null);
                  setGalleryActiveIndex(0);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Stage */}
            <div className="py-4 flex flex-col items-center">
              {galleryModalProduct.images && galleryModalProduct.images.length > 0 ? (
                <div className="relative aspect-square max-h-[50vh] w-full rounded-2xl bg-[#151419] p-4 flex items-center justify-center overflow-hidden border border-white/5">
                  <img
                    src={galleryModalProduct.images[galleryActiveIndex] || galleryModalProduct.images[0]}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[11px] font-mono text-zinc-300">
                    Photo {galleryActiveIndex + 1} of {galleryModalProduct.images.length}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500">No images available for this device.</div>
              )}

              {/* Thumbnails */}
              {galleryModalProduct.images && galleryModalProduct.images.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full pb-2">
                  {galleryModalProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGalleryActiveIndex(idx)}
                      className={`w-14 h-14 rounded-xl border-2 p-1 overflow-hidden shrink-0 bg-[#151419] transition-all cursor-pointer ${
                        galleryActiveIndex === idx
                          ? 'border-[#B7F34B] shadow-[0_0_10px_rgba(183,243,75,0.4)]'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const p = galleryModalProduct;
                  setGalleryModalProduct(null);
                  handleOpenEditProduct(p);
                }}
                className="px-4 py-2 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Device & Photos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGalleryModalProduct(null);
                  setGalleryActiveIndex(0);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
