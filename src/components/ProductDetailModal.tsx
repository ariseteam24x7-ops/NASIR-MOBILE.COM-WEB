import React, { useState, useEffect, useRef } from 'react';
import { Product, WhatsAppSettings } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { buildWhatsAppUrl } from '../lib/whatsapp.ts';
import { WhatsAppQuickReplySelector } from './WhatsAppQuickReplySelector.tsx';
import {
  X,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  relatedProducts: Product[];
  whatsAppSettings?: WhatsAppSettings;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  relatedProducts,
  whatsAppSettings,
  onClose,
  onSelectProduct,
}) => {
  const { language, t } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  // Reset and initialize when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedQuestions([]);
    setCustomNote('');
    if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const defaultIdx = product.variants.findIndex((v: any) => v.isDefault);
      setSelectedVariantIndex(defaultIdx !== -1 ? defaultIdx : 0);
      const initial: Record<string, string> = {};
      product.variants.forEach((v: any, idx: number) => {
        if (Array.isArray(v.options) && v.options.length > 0) {
          const vName = language === 'ar' ? v.nameAr || v.nameEn : v.nameEn || `Option ${idx + 1}`;
          initial[vName] = v.options[0];
        }
      });
      setSelectedVariants(initial);
    } else {
      setSelectedVariantIndex(0);
      setSelectedVariants({});
    }
  }, [product?.id, language]);

  // Lightbox / Zoom State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  if (!product) return null;

  const title = language === 'ar' ? product.nameAr || product.nameEn : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr || product.descriptionEn : product.descriptionEn;
  const categoryName = language === 'ar' ? product.categoryNameAr : product.categoryNameEn;
  const brandName = product.brandName || '';

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImageIndex] || null;

  const isOptionGroup = Boolean(
    product.variants &&
    Array.isArray(product.variants) &&
    product.variants.some((v: any) => Array.isArray(v.options) && v.options.length > 0)
  );

  const currentVariant = product.variants && Array.isArray(product.variants) && product.variants.length > 0
    ? (product.variants[selectedVariantIndex] as any)
    : null;

  // Selected variant string for WhatsApp message
  const variantSummary = isOptionGroup
    ? Object.entries(selectedVariants)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ')
    : currentVariant
    ? `${language === 'ar' ? currentVariant.nameAr || currentVariant.name || currentVariant.nameEn : currentVariant.name || currentVariant.nameEn}`
    : '';

  const whatsappUrl = buildWhatsAppUrl({
    settings: whatsAppSettings,
    product,
    selectedVariant: variantSummary,
    lang: language,
    selectedQuestions,
    customNote,
  });

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/#product-${product.slug}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setZoomScale(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
        setZoomScale(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoomScale(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#1b1920] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#242129] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Visual Gallery */}
          <div className="bg-[#151419] p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
            {/* Main Image Stage (Click to Zoom) */}
            <div
              onClick={() => {
                if (activeImage) {
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                  setLightboxOpen(true);
                }
              }}
              className="relative aspect-square w-full rounded-2xl bg-[#242129]/60 flex items-center justify-center p-6 overflow-hidden group cursor-zoom-in border border-white/5 hover:border-[#B7F34B]/30 transition-colors"
            >
              {activeImage ? (
                <>
                  <img
                    src={activeImage}
                    alt={title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Subtle Zoom Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 group-hover:text-[#B7F34B] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'انقر للتكبير' : 'Click to Zoom'}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-600">
                  <Smartphone className="w-24 h-24 stroke-[1] mb-2" />
                  <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">
                    Nasir Mobile Dubai
                  </span>
                </div>
              )}

              {/* Condition Badge */}
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#B7F34B] text-[#151419] shadow-[0_0_15px_rgba(183,243,75,0.4)]">
                  {product.condition === 'New'
                    ? t('cond_new')
                    : product.condition === 'Refurbished'
                    ? t('cond_refurbished')
                    : t('cond_used')}
                </span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 bg-[#242129] p-1 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-[#B7F34B] ring-2 ring-[#B7F34B]/30'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Guarantee Note */}
            <div className="mt-6 p-3.5 rounded-xl bg-[#242129]/80 border border-white/5 flex items-center gap-3 text-xs text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-[#B7F34B] shrink-0" />
              <span>
                {language === 'ar'
                  ? 'جميع الأجهزة تخضع للفحص المعتمد من قبل خبراء ناصر موبايل في دبي.'
                  : 'Hardware thoroughly verified by Nasir Mobile Dubai certified technical team.'}
              </span>
            </div>
          </div>

          {/* Right Column: Information, Specs, Variants, WhatsApp CTA */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Brand & SKU bar */}
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <span>{brandName}</span>
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-zinc-300">
                  {t('sku_label')}: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                {title}
              </h2>

              {/* Category pill */}
              {categoryName && (
                <div className="inline-block bg-white/5 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {categoryName}
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-6 whitespace-pre-line">
                {description}
              </p>

              {/* Variants Selector */}
              {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                <div className="space-y-3 mb-6 p-4 rounded-2xl bg-[#151419] border border-white/5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {language === 'ar' ? 'خيارات الجهاز والمواصفات' : 'Available Options & Configurations'}
                  </h4>

                  {isOptionGroup ? (
                    // Option groups with options array (e.g. Storage, Color)
                    product.variants.map((v: any, vIdx: number) => {
                      const groupName = language === 'ar' ? v.nameAr || v.nameEn : v.nameEn || `Option ${vIdx + 1}`;
                      const optionsList = Array.isArray(v.options) ? v.options : [];
                      if (optionsList.length === 0) return null;

                      return (
                        <div key={vIdx} className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-300">{groupName}</label>
                          <div className="flex flex-wrap gap-2">
                            {optionsList.map((opt: string, oIdx: number) => {
                              const isSelected = selectedVariants[groupName] === opt;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [groupName]: opt,
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#B7F34B] text-[#151419] shadow-[0_0_15px_rgba(183,243,75,0.3)]'
                                      : 'bg-[#242129] text-zinc-300 hover:text-white border border-white/5'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Flat SKU variants
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.variants.map((v: any, vIdx: number) => {
                        const variantTitle = language === 'ar' ? v.nameAr || v.name || v.nameEn : v.name || v.nameEn;
                        const isSelected = selectedVariantIndex === vIdx;
                        return (
                          <button
                            key={vIdx}
                            type="button"
                            onClick={() => setSelectedVariantIndex(vIdx)}
                            className={`p-3 rounded-xl text-left rtl:text-right border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-[#B7F34B]/10 border-[#B7F34B] shadow-[0_0_15px_rgba(183,243,75,0.2)]'
                                : 'bg-[#242129] border-white/5 hover:border-white/20 text-zinc-300'
                            }`}
                          >
                            <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#B7F34B]' : 'text-white'}`}>
                              {variantTitle}
                            </span>
                            {isSelected && (
                              <CheckCircle className="w-3.5 h-3.5 text-[#B7F34B] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Technical Specifications */}
              {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 && (
                <div className="space-y-2.5 mb-6">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('specs_title')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {product.specifications
                      .filter((s: any) => s && !s.keyEn?.startsWith('_'))
                      .map((spec: any, sIdx: number) => {
                        const specKey = language === 'ar' ? spec.keyAr || spec.keyEn : spec.keyEn;
                        const specVal = language === 'ar' ? spec.valueAr || spec.valueEn : spec.valueEn;
                        return (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-xl bg-[#151419] border border-white/5 flex flex-col justify-between"
                          >
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                              {specKey}
                            </span>
                            <span className="text-xs font-semibold text-white mt-0.5">{specVal}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* WhatsApp Quick Reply Inquiries */}
              <div className="mb-6">
                <WhatsAppQuickReplySelector
                  selectedQuestions={selectedQuestions}
                  onChangeQuestions={setSelectedQuestions}
                  customNote={customNote}
                  onChangeCustomNote={setCustomNote}
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-[#151419] font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:scale-102 active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{t('inquire_whatsapp')}</span>
              </a>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#B7F34B]" />
                    <span>{language === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied to Clipboard!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{t('share_product')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products Footer */}
        {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
          <div className="p-6 bg-[#151419] border-t border-white/5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {t('related_products')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((rel) => {
                const relTitle = language === 'ar' ? rel.nameAr || rel.nameEn : rel.nameEn;
                const relImage = rel.images && rel.images.length > 0 ? rel.images[0] : null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => onSelectProduct(rel)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#242129] border border-white/5 hover:border-[#922CB5] transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#151419] p-1 shrink-0 flex items-center justify-center">
                      {relImage ? (
                        <img src={relImage} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Smartphone className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white group-hover:text-[#B7F34B] truncate">
                        {relTitle}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">{rel.sku}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FULLSCREEN IMAGE LIGHTBOX WITH ZOOM & PAN EFFECT */}
      {/* ======================================================== */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Top Bar: Title, Counter & Controls */}
          <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-20">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {title}
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  {images.length > 1
                    ? `${selectedImageIndex + 1} / ${images.length}`
                    : product.sku}
                </span>
              </div>
            </div>

            {/* Zoom Controls & Close Button */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#242129]/90 border border-white/10 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3.5}
                title="Zoom In (+)"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-[#B7F34B] px-1 min-w-[3rem] text-center">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                title="Zoom Out (-)"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoomScale === 1 && pan.x === 0 && pan.y === 0}
                title="Reset Zoom"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Close (Esc)"
                className="p-2 rounded-xl bg-white/5 text-zinc-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle Stage: Image Display with Drag & Pan */}
          <div
            className={`flex-1 relative flex items-center justify-center overflow-hidden p-4 sm:p-12 ${
              zoomScale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={(e) => {
              // Toggle 2x zoom on click if not dragging
              if (!isDragging && zoomScale === 1) {
                setZoomScale(2);
              }
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={activeImage}
                alt={title}
                draggable={false}
                className="max-h-[75vh] max-w-[85vw] object-contain select-none pointer-events-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Left Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#242129]/80 hover:bg-[#922CB5] border border-white/10 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer z-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % images.length);
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#242129]/80 hover:bg-[#922CB5] border border-white/10 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer z-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnail Strip */}
          {images.length > 1 && (
            <div className="p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-center z-20">
              <div className="flex gap-2.5 overflow-x-auto max-w-full p-2 bg-[#242129]/70 backdrop-blur-md border border-white/10 rounded-2xl">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(idx);
                      setZoomScale(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden bg-[#151419] p-1 transition-all cursor-pointer shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-[#B7F34B] scale-105 ring-2 ring-[#B7F34B]/40'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
