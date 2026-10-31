import React from 'react';
import { motion } from 'motion/react';
import { Product, WhatsAppSettings } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { buildWhatsAppUrl } from '../lib/whatsapp.ts';
import { MessageCircle, ExternalLink, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  whatsAppSettings?: WhatsAppSettings;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  whatsAppSettings,
  onOpenDetails,
}) => {
  const { language, t } = useLanguage();

  const title = language === 'ar' ? product.nameAr || product.nameEn : product.nameEn;
  const categoryName = language === 'ar' ? product.categoryNameAr : product.categoryNameEn;
  const brandName = product.brandName || '';

  const whatsappUrl = buildWhatsAppUrl({
    settings: whatsAppSettings,
    product,
    lang: language,
  });

  // Condition Badge Styling
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'New':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#B7F34B] text-[#151419] shadow-[0_0_10px_rgba(183,243,75,0.4)]">
            {t('cond_new')}
          </span>
        );
      case 'Refurbished':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#922CB5] text-white shadow-[0_0_10px_rgba(146,44,181,0.4)]">
            {t('cond_refurbished')}
          </span>
        );
      case 'Used':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/90 text-[#151419]">
            {t('cond_used')}
          </span>
        );
      default:
        return null;
    }
  };

  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const fitModeSpec = product.specifications?.find((s) => s.keyEn === '_imageFitMode')?.valueEn;
  const isCover = fitModeSpec === 'cover';
  const imageCount = product.images?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="group flex flex-col bg-[#242129] border border-white/5 hover:border-[#922CB5]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_10px_30px_rgba(146,44,181,0.18)] hover:-translate-y-1"
    >
      {/* Product Image Stage */}
      <div
        onClick={() => onOpenDetails(product)}
        className="relative aspect-square w-full bg-[#1b1920] overflow-hidden flex items-center justify-center p-5 cursor-pointer"
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={title}
            referrerPolicy="no-referrer"
            className={`w-full h-full transition-transform duration-500 group-hover:scale-108 ${
              isCover ? 'object-cover' : 'object-contain'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 group-hover:text-zinc-400 transition-colors">
            <Smartphone className="w-16 h-16 stroke-[1.2] mb-2" />
            <span className="text-xs uppercase font-medium tracking-wider">Nasir Mobile</span>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {getConditionBadge(product.condition)}
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-900/80 border border-purple-400/40 text-purple-200">
              {language === 'ar' ? 'مميز' : 'Featured'}
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 border border-emerald-400/40 text-emerald-300">
              {language === 'ar' ? 'جديد' : 'New'}
            </span>
          )}
        </div>

        {/* Multi-Photo Count Indicator */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-300 flex items-center gap-1 shadow-sm">
            <span className="text-[#B7F34B]">📷</span>
            <span>{imageCount} {language === 'ar' ? 'صور' : 'photos'}</span>
          </div>
        )}

        {/* Floating SKU Pill */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
          {product.sku}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Brand & Category line */}
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
          <span>{brandName}</span>
          {categoryName && (
            <span className="text-zinc-500 text-[11px] font-normal truncate max-w-[120px]">
              {categoryName}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onOpenDetails(product)}
          className="text-base font-bold text-white group-hover:text-[#B7F34B] transition-colors line-clamp-2 mb-2 cursor-pointer leading-snug"
        >
          {title}
        </h3>

        {/* Specification Highlights Preview */}
        {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.specifications
              .filter((s: any) => s && !s.keyEn?.startsWith('_'))
              .slice(0, 3)
              .map((spec, idx) => {
                const val = language === 'ar' ? spec.valueAr || spec.valueEn : spec.valueEn;
                return (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-[#151419] border border-white/5 text-[11px] text-zinc-300 font-medium"
                  >
                    {val}
                  </span>
                );
              })}
          </div>
        )}

        {/* Bottom Actions: Details & WhatsApp Enquiry */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
          {/* View Details Button */}
          <button
            onClick={() => onOpenDetails(product)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all text-center cursor-pointer"
          >
            {t('view_details')}
          </button>

          {/* Direct WhatsApp Enquiry Button */}
          {whatsAppSettings?.isEnabled !== false && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:scale-103 active:scale-97 cursor-pointer"
              title={t('enquire_whatsapp')}
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span className="hidden sm:inline">{t('enquire_whatsapp')}</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};
