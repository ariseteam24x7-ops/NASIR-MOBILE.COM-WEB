import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { WhatsAppSettings, SiteContent } from '../types/index.ts';
import { formatDisplayNumber, sanitizeWhatsAppNumber } from '../lib/whatsapp.ts';
import { MessageCircle, Phone, MapPin, Clock, Mail, ArrowUpRight } from 'lucide-react';

interface ContactSectionProps {
  whatsAppSettings?: WhatsAppSettings;
  siteContent?: SiteContent;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  whatsAppSettings,
  siteContent,
}) => {
  const { language, t } = useLanguage();

  const primaryNumber = whatsAppSettings?.primaryNumber || '+971522523900';
  const secondaryNumber = whatsAppSettings?.secondaryNumber || '+971563903672';

  const address =
    language === 'ar'
      ? siteContent?.contactAddressAr || 'ديرة وواحة دبي للسيليكون، دبي، الإمارات العربية المتحدة'
      : siteContent?.contactAddressEn || 'Deira & Silicon Oasis, Dubai, United Arab Emirates';

  const hours =
    language === 'ar'
      ? siteContent?.openingHoursAr || 'السبت - الخميس: 10:00 ص - 10:30 م | الجمعة: 3:00 م - 10:30 م'
      : siteContent?.openingHoursEn || 'Saturday - Thursday: 10:00 AM - 10:30 PM | Friday: 3:00 PM - 10:30 PM';

  const email = siteContent?.contactEmail || 'shazzzbusiness@gmail.com';

  const primaryUrl = `https://wa.me/${sanitizeWhatsAppNumber(primaryNumber)}?text=${encodeURIComponent(
    language === 'ar'
      ? 'مرحباً ناصر موبايل دبي! أود الاستفسار عن الأجهزة المتوفرة لديكم.'
      : 'Hello Nasir Mobile Dubai! I would like to inquire about current devices and availability.'
  )}`;

  const secondaryUrl = `https://wa.me/${sanitizeWhatsAppNumber(secondaryNumber)}?text=${encodeURIComponent(
    language === 'ar'
      ? 'مرحباً ناصر موبايل دبي! أود الاستفسار عن المبيعات أو خدمة العملاء.'
      : 'Hello Nasir Mobile Dubai! I have a sales or customer support inquiry.'
  )}`;

  return (
    <section id="contact" className="py-16 sm:py-24 bg-[#151419] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#391548] text-[#B7F34B] text-xs font-bold uppercase tracking-widest mb-4">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{t('contact')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {language === 'ar' ? 'تواصل مع فريق ناصر موبايل' : 'Get in Touch with Nasir Mobile'}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            {language === 'ar'
              ? 'فريقنا متاح عبر واتساب لتقديم الاستشارة الفورية وتأكيد طلبات الأجهزة في دبي'
              : 'Direct consultation, instant price confirmation, and warehouse availability via verified WhatsApp.'}
          </p>
        </motion.div>

        {/* WhatsApp Business Action Cards with in-view reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Primary Line */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#242129] to-[#151419] border border-[#922CB5]/40 hover:border-[#922CB5] shadow-[0_10px_30px_rgba(146,44,181,0.15)] flex flex-col justify-between transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    {t('primary_line')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono mt-0.5">
                    {formatDisplayNumber(primaryNumber)}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#B7F34B] text-[#151419] text-[10px] font-black uppercase tracking-wider">
                {language === 'ar' ? 'الخط الأساسي' : 'Primary'}
              </span>
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6">
              {language === 'ar'
                ? 'مبيعات الهواتف الجديدة، الأجهزة المجددة، طلبات الجملة، والتوصيل السريع داخل دبي.'
                : 'Flagship sales, pre-owned devices, bulk orders, and same-day delivery coordination.'}
            </p>

            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-102 active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{t('enquire_whatsapp')}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Secondary Line */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#242129] to-[#151419] border border-white/10 hover:border-white/20 shadow-xl flex flex-col justify-between transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#391548] border border-[#922CB5]/30 flex items-center justify-center text-[#922CB5]">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {t('secondary_line')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono mt-0.5">
                    {formatDisplayNumber(secondaryNumber)}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                {language === 'ar' ? 'خط الدعم' : 'Support'}
              </span>
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6">
              {language === 'ar'
                ? 'استفسارات الإكسسوارات، فحص الضمان، ومتابعة الطلبات المجدولة.'
                : 'Accessories inquiries, warranty queries, and scheduled order follow-ups.'}
            </p>

            <a
              href={secondaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#242129] hover:bg-[#2e2a35] border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
              <span>{t('enquire_whatsapp')}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Location & Details Info Grid with scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5"
        >
          <div className="p-6 rounded-2xl bg-[#242129]/60 border border-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#151419] text-[#B7F34B] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                {t('store_location')}
              </h4>
              <p className="text-sm font-semibold text-white leading-snug">{address}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#242129]/60 border border-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#151419] text-[#922CB5] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                {t('store_hours')}
              </h4>
              <p className="text-sm font-semibold text-white leading-snug">{hours}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#242129]/60 border border-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#151419] text-[#B7F34B] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                {t('email_address')}
              </h4>
              <a
                href={`mailto:${email}`}
                className="text-sm font-semibold text-white hover:text-[#B7F34B] transition-colors"
              >
                {email}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
