import React from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { WhatsAppSettings } from '../types/index.ts';
import { formatDisplayNumber } from '../lib/whatsapp.ts';
import { ShieldCheck, MessageCircle, Lock } from 'lucide-react';

interface FooterProps {
  whatsAppSettings?: WhatsAppSettings;
  onNavigateToAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  whatsAppSettings,
  onNavigateToAdmin,
}) => {
  const { language, t } = useLanguage();

  const primaryNum = whatsAppSettings?.primaryNumber || '+971522523900';
  const secondaryNum = whatsAppSettings?.secondaryNumber || '+971563903672';

  return (
    <footer className="bg-[#100f13] border-t border-white/10 text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm mt-3">
              {language === 'ar'
                ? 'ناصر موبايل دبي - وجهتكم الرائدة للهواتف الذكية الأصلية الجديدة والمستعملة والمجددة مع فحص الجودة المعتمد واستفسار فوري عبر واتساب.'
                : 'Nasir Mobile Dubai — Your premier technology boutique for genuine brand-new, certified pre-owned, and refurbished smartphones, luxury audio, and verified accessories.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#B7F34B] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {language === 'ar'
                  ? 'مرخص رسمياً في دبي، الإمارات العربية المتحدة'
                  : 'Official Registered Technology Store • Dubai, UAE'}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">
              {language === 'ar' ? 'التنقل السريع' : 'Catalogue'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#catalogue" className="hover:text-white transition-colors">
                  {t('all_products')}
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-white transition-colors">
                  {t('categories')}
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  {t('about_us')}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  {t('faq')}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  {t('contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Numbers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">
              {t('direct_whatsapp_support')}
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34B]" />
                <span>{formatDisplayNumber(primaryNum)}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>{formatDisplayNumber(secondaryNum)}</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans mt-2">
                {language === 'ar'
                  ? 'متاح للمحادثة والاستفسار طوال أيام الأسبوع'
                  : 'Available for instant product quotes & device orders.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            {/* Discreet secret trigger for store owner */}
            <button
              onClick={onNavigateToAdmin}
              className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-default select-none focus:outline-none"
              title="©"
              aria-label="Nasir Mobile System"
            >
              ©
            </button>
            <span>
              {new Date().getFullYear()} Nasir Mobile Dubai. {t('all_rights_reserved')}
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 flex items-center gap-2">
            <span>
              {language === 'ar'
                ? 'كتالوج استعراض رقمي معتمد • دبي، الإمارات العربية المتحدة'
                : 'Digital Electronics Catalogue • Dubai, UAE'}
            </span>
            {/* Subtle dot trigger for owner */}
            <button
              onClick={onNavigateToAdmin}
              className="w-1.5 h-1.5 rounded-full bg-transparent hover:bg-zinc-700 transition-colors cursor-default focus:outline-none"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
