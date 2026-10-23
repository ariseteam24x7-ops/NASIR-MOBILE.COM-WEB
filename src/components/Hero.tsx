import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { SiteContent, WhatsAppSettings } from '../types/index.ts';
import { buildWhatsAppUrl } from '../lib/whatsapp.ts';
import { MessageCircle, ShieldCheck, Zap, ArrowRight, Award } from 'lucide-react';

interface HeroProps {
  siteContent?: SiteContent;
  whatsAppSettings?: WhatsAppSettings;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  siteContent,
  whatsAppSettings,
  onExploreClick,
}) => {
  const { language, t } = useLanguage();

  const title =
    language === 'ar'
      ? siteContent?.heroTitleAr || 'أحدث الهواتف الذكية والتكنولوجيا في دبي'
      : siteContent?.heroTitleEn || 'Premium Technology & Smart Devices in Dubai';

  const subtitle =
    language === 'ar'
      ? siteContent?.heroSubtitleAr || 'استكشف أحدث الهواتف الأصلية الجديدة والمستعملة والمجددة، وأجهزة الصوت الراقية والإكسسوارات المعتمدة لدى ناصر موبايل.'
      : siteContent?.heroSubtitleEn || 'Explore genuine new, used, and certified refurbished flagship devices, luxury audio, and authentic accessories at Nasir Mobile.';

  const whatsappUrl = buildWhatsAppUrl({
    settings: whatsAppSettings,
    lang: language,
  });

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-white/5 bg-[#151419]">
      {/* Geometric Ambient Gradients with subtle floating motion */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.22, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-1/4 w-96 h-96 bg-[#922CB5] rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-10 w-80 h-80 bg-[#391548] rounded-full blur-2xl pointer-events-none"
      />
      <div className="absolute -top-20 -right-20 w-64 h-64 border-4 border-[#B7F34B]/10 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-4 w-40 h-40 border border-[#922CB5]/20 rotate-45 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Top Pill / Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#391548]/60 border border-[#922CB5]/40 text-[#B7F34B] text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#B7F34B] animate-pulse" />
            <span>{t('brand_tagline')}</span>
          </motion.div>

          {/* Main Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6"
          >
            {title}
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-zinc-300 leading-relaxed mb-8 max-w-2xl font-normal"
          >
            {subtitle}
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            <button
              onClick={onExploreClick}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(146,44,181,0.4)] hover:shadow-[0_0_35px_rgba(146,44,181,0.6)] cursor-pointer hover:scale-102 active:scale-98"
            >
              <span>{t('hero_cta_browse')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {whatsAppSettings?.isEnabled !== false && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#242129] hover:bg-[#2d2934] border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:scale-102 active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{t('hero_cta_whatsapp')}</span>
              </a>
            )}
          </motion.div>

          {/* Value Badges with stagger */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#242129] border border-white/10 flex items-center justify-center shrink-0 text-[#B7F34B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('badge_authenticity')}
                </h4>
                <p className="text-[11px] text-zinc-400">100% Genuine Brands</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#242129] border border-white/10 flex items-center justify-center shrink-0 text-[#922CB5]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('badge_tested')}
                </h4>
                <p className="text-[11px] text-zinc-400">Multi-point Inspection</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#242129] border border-white/10 flex items-center justify-center shrink-0 text-[#B7F34B]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('badge_dubai')}
                </h4>
                <p className="text-[11px] text-zinc-400">Instant WhatsApp Quotes</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
