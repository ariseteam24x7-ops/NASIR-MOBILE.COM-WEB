import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ServiceItem, WhatsAppSettings } from '../types/index.ts';
import { buildWhatsAppUrl } from '../lib/whatsapp.ts';
import {
  Wrench,
  RefreshCw,
  Smartphone,
  Cpu,
  Wifi,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Headphones,
} from 'lucide-react';

interface ServicesSectionProps {
  whatsAppSettings?: WhatsAppSettings;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ whatsAppSettings }) => {
  const { language, t } = useLanguage();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data.filter((s) => s.isActive !== false));
        }
      })
      .catch((err) => console.warn('Could not fetch services:', err))
      .finally(() => setLoading(false));
  }, []);

  const getServiceIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'wrench':
        return <Wrench className="w-6 h-6 text-[#B7F34B]" />;
      case 'refreshcw':
      case 'repeat':
        return <RefreshCw className="w-6 h-6 text-[#922CB5]" />;
      case 'smartphone':
        return <Smartphone className="w-6 h-6 text-[#B7F34B]" />;
      case 'cpu':
        return <Cpu className="w-6 h-6 text-[#922CB5]" />;
      case 'wifi':
        return <Wifi className="w-6 h-6 text-[#B7F34B]" />;
      case 'shieldcheck':
      case 'shield':
        return <ShieldCheck className="w-6 h-6 text-[#922CB5]" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-[#B7F34B]" />;
      default:
        return <Wrench className="w-6 h-6 text-[#B7F34B]" />;
    }
  };

  const getWhatsAppServiceUrl = (service: ServiceItem) => {
    const serviceTitle = language === 'ar' ? service.titleAr : service.titleEn;
    const customText =
      language === 'ar'
        ? `مرحباً ناصر موبايل دبي! أود الاستفسار وحجز خدمة: ${serviceTitle}. يرجى تزويدي بالتفاصيل والموعد المتاح.`
        : `Hello Nasir Mobile Dubai! I would like to inquire and book the service: ${serviceTitle}. Please share details and available slots.`;

    const activeNum = (whatsAppSettings?.activeNumber || '+971522523900').replace(/[^0-9]/g, '');
    return `https://wa.me/${activeNum}?text=${encodeURIComponent(customText)}`;
  };

  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="py-20 sm:py-28 bg-[#151419] border-b border-white/5 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#922CB5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#B7F34B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#391548] border border-[#922CB5]/30 text-[#B7F34B] text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'خدمات ناصر موبايل المعتمدة' : 'Official Dubai Boutique Services'}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight"
          >
            {language === 'ar' ? (
              <>
                خدمات تقنية <span className="text-[#B7F34B]">فورية واحترافية</span>
              </>
            ) : (
              <>
                Premier Mobile & <span className="text-[#B7F34B]">Tech Services</span>
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-sm sm:text-base leading-relaxed"
          >
            {language === 'ar'
              ? 'صيانة سريعة بنفس اليوم، تقييم فوري واستبدال للأجهزة، نقل بيانات شامل، وتوريد مؤسسي لقطاع الأعمال في دبي.'
              : 'Same-day express repairs, instant trade-ins, certified zero-loss data migration, and B2B corporate enterprise solutions in Dubai.'}
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const title = language === 'ar' ? service.titleAr : service.titleEn;
            const desc = language === 'ar' ? service.descriptionAr : service.descriptionEn;
            const turnaround = language === 'ar' ? service.turnaroundAr : service.turnaroundEn;
            const badge = language === 'ar' ? service.badgeAr : service.badgeEn;
            const features = (language === 'ar' ? service.featuresAr : service.featuresEn) || [];

            return (
              <motion.div
                key={service.id || service.slug}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[#1e1c24] border border-white/5 hover:border-[#922CB5]/50 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(146,44,181,0.15)] hover:-translate-y-1"
              >
                {/* Top Row: Icon + Turnaround Tag */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-[#151419] border border-white/10 flex items-center justify-center p-3 group-hover:scale-105 group-hover:border-[#B7F34B]/40 transition-all shadow-inner">
                      {getServiceIcon(service.icon)}
                    </div>

                    {turnaround && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-bold">
                        <Clock className="w-3 h-3 text-[#B7F34B]" />
                        <span>{turnaround}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Badge */}
                  <div>
                    {badge && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#B7F34B] bg-[#391548]/70 px-2.5 py-0.5 rounded-md mb-2">
                        {badge}
                      </span>
                    )}
                    <h3 className="text-lg font-black text-white group-hover:text-[#B7F34B] transition-colors leading-snug">
                      {title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                    {desc}
                  </p>

                  {/* Feature Highlights */}
                  {features.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-white/5">
                      {features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B7F34B] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-6 mt-6 border-t border-white/5">
                  <a
                    href={getWhatsAppServiceUrl(service)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#242129] hover:bg-[#25D366] text-white hover:text-[#151419] font-bold text-xs uppercase tracking-wider transition-all duration-200 group/btn shadow-md hover:shadow-[0_0_20px_rgba(37,211,102,0.35)]"
                  >
                    <MessageCircle className="w-4 h-4 fill-current text-[#25D366] group-hover/btn:text-[#151419] transition-colors" />
                    <span>{language === 'ar' ? 'استفسر واحجز عبر واتساب' : 'Book on WhatsApp'}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover/btn:-translate-x-1' : ''}`} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#391548] via-[#242129] to-[#151419] border border-[#922CB5]/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left rtl:md:text-right">
            <h4 className="text-xl font-black text-white uppercase tracking-tight">
              {language === 'ar' ? 'هل تبحث عن خدمة مخصصة لجهازك؟' : 'Need a Custom Device Request or Quotation?'}
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300">
              {language === 'ar'
                ? 'فريق ناصر موبايل متاح يومياً في دبي لتقديم الدعم الفني والاستشارات المباشرة.'
                : 'Our Dubai store specialists are available daily for direct phone consultations, corporate quotes, and urgent device orders.'}
            </p>
          </div>

          <a
            href={buildWhatsAppUrl({ settings: whatsAppSettings, lang: language })}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-[#151419] font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:scale-102 active:scale-98"
          >
            <Headphones className="w-4 h-4" />
            <span>{language === 'ar' ? 'تحدث مع أخصائي الخدمة' : 'Talk with Service Specialist'}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
