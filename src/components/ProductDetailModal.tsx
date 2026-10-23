import React, { useState } from 'react';
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
  Share2,
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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  if (!product) return null;

  const title = language === 'ar' ? product.nameAr || product.nameEn : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr || product.descriptionEn : product.descriptionEn;
  const categoryName = language === 'ar' ? product.categoryNameAr : product.categoryNameEn;
  const brandName = product.brandName || '';

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImageIndex] || null;

  // Selected variant string for WhatsApp message
  const variantSummary = Object.entries(selectedVariants)
    .map(([key, val]) => `${key}: ${val}`)
    .join(', ');

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
            {/* Main Image Stage */}
            <div className="relative aspect-square w-full rounded-2xl bg-[#242129]/60 flex items-center justify-center p-6 overflow-hidden">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={title}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center text-zinc-600">
                  <Smartphone className="w-24 h-24 stroke-[1] mb-2" />
                  <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">
                    Nasir Mobile Dubai
                  </span>
                </div>
              )}

              {/* Condition Badge */}
              <div className="absolute top-4 left-4">
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

              {/* Category Pill */}
              {categoryName && (
                <div className="inline-block px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 text-xs font-medium mb-4">
                  {categoryName}
                </div>
              )}

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4 my-4 p-4 rounded-2xl bg-[#242129] border border-white/5">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    {t('select_variant')}
                  </h4>
                  {product.variants.map((v, vIdx) => {
                    const varName = language === 'ar' ? v.nameAr || v.nameEn : v.nameEn;
                    return (
                      <div key={vIdx} className="space-y-2">
                        <span className="text-xs text-zinc-400 font-semibold">{varName}:</span>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt, oIdx) => {
                            const isSelected = selectedVariants[varName] === opt;
                            return (
                              <button
                                key={oIdx}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [varName]: opt,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#922CB5] text-white border border-[#B7F34B]'
                                    : 'bg-[#151419] text-zinc-300 border border-white/5 hover:border-white/20'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="my-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {t('description')}
                  </h4>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              )}

              {/* Specifications Table */}
              <div className="my-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {t('specifications')}
                </h4>
                {product.specifications && product.specifications.length > 0 ? (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-[#151419] overflow-hidden text-xs">
                    {product.specifications.map((spec, sIdx) => {
                      const keyLabel = language === 'ar' ? spec.keyAr || spec.keyEn : spec.keyEn;
                      const valLabel = language === 'ar' ? spec.valueAr || spec.valueEn : spec.valueEn;
                      return (
                        <div key={sIdx} className="grid grid-cols-3 p-2.5">
                          <span className="font-semibold text-zinc-400 col-span-1">{keyLabel}</span>
                          <span className="text-white col-span-2 font-medium">{valLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">{t('no_specs_listed')}</p>
                )}
              </div>
            </div>

            {/* Bottom Actions & Privacy Safeguard */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {/* Frequently Asked Questions Quick Reply Selector */}
              {whatsAppSettings?.isEnabled !== false && (
                <WhatsAppQuickReplySelector
                  selectedQuestions={selectedQuestions}
                  onChangeQuestions={setSelectedQuestions}
                  customNote={customNote}
                  onChangeCustomNote={setCustomNote}
                  compact={false}
                />
              )}

              {/* WhatsApp Enquiry Button */}
              {whatsAppSettings?.isEnabled !== false && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:scale-101 active:scale-99 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{t('enquire_whatsapp')}</span>
                </a>
              )}

              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#B7F34B]" />
                  <span>{t('privacy_notice')}</span>
                </span>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'مشاركة' : 'Share')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Bar if available */}
        {relatedProducts && relatedProducts.length > 0 && (
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
    </div>
  );
};
