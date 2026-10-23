import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { SiteContent } from '../types/index.ts';
import { ShieldCheck, Headphones } from 'lucide-react';

interface AboutSectionProps {
  siteContent?: SiteContent;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ siteContent }) => {
  const { language, t } = useLanguage();

  const aboutText =
    language === 'ar'
      ? siteContent?.aboutAr ||
        'ناصر موبايل هي وجهتك الموثوقة للهواتف الذكية والأجهزة اللوحية والإكسسوارات والإلكترونيات المعتمدة في دبي، الإمارات العربية المتحدة. نحرص على تقديم أفضل خدمة عملاء وضمان الأجهزة الأصلية الجديدة والمجددة مع استشارة مباشرة عبر واتساب.'
      : siteContent?.aboutEn ||
        'Nasir Mobile is Dubai’s trusted destination for smartphones, tablets, premium accessories, and certified electronics. Located in the heart of Dubai, UAE, we deliver exceptional customer care, guaranteed authentic hardware, and personalized consultation for both new and refurbished devices.';

  return (
    <section id="about" className="py-16 sm:py-24 bg-[#151419] border-b border-white/5 relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-[#922CB5] rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#391548] text-[#B7F34B] text-xs font-bold uppercase tracking-widest">
              <span>{t('about_us')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
              {language === 'ar'
                ? 'وجهتكم المعتمدة لأحدث الأجهزة الذكية في دبي'
                : 'Your Premier Technology & Mobile Destination in Dubai'}
            </h2>

            <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-normal">
              {aboutText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-[#242129] border border-white/5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#151419] text-[#B7F34B] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {language === 'ar' ? 'أجهزة أصلية معتمدة' : '100% Genuine Hardware'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {language === 'ar'
                      ? 'ضمان كامل على جميع الهواتف الجديدة والمجددة مع فحص شامل'
                      : 'Authentic international & regional specs with multi-point quality inspection.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#242129] border border-white/5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#151419] text-[#922CB5] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {language === 'ar' ? 'استشارة فورية عبر واتساب' : 'Direct WhatsApp Consultation'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {language === 'ar'
                      ? 'تواصل مباشر مع المتخصصين للحصول على المواصفات والأسعار التنافسية'
                      : 'Immediate responses, real photos of in-stock devices, and custom orders.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Card Inspired Geometric Visual with scroll reveal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-5"
          >
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#391548] via-[#242129] to-[#151419] border border-[#922CB5]/30 shadow-2xl overflow-hidden hover:border-[#922CB5]/60 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B7F34B]/10 rounded-full blur-2xl" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#B7F34B]">
                    DUBAI TRADING LICENSE
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B7F34B] animate-ping" />
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-wider uppercase text-white">
                    NASIR MOBILE
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mt-1">
                    DUBAI • UNITED ARAB EMIRATES
                  </p>
                </div>

                <div className="space-y-2 text-xs text-zinc-300 pt-2 font-mono">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">CATEGORY:</span>
                    <span>Flagship Phones & Tech</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">QUALITY:</span>
                    <span>Brand New • Refurbished • Used</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-500">LOCATION:</span>
                    <span>Dubai, UAE</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">PRIMARY WHATSAPP:</span>
                    <span className="text-[#B7F34B]">+971 52 252 3900</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
