import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { WhatsAppSettings, SiteContent } from '../types/index.ts';
import { buildWhatsAppUrl, formatDisplayNumber } from '../lib/whatsapp.ts';
import {
  MessageCircle,
  Search,
  Globe,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  whatsAppSettings?: WhatsAppSettings;
  siteContent?: SiteContent;
  onNavigateToAdmin: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  whatsAppSettings,
  siteContent,
  onNavigateToAdmin,
  searchQuery,
  setSearchQuery,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const logoClicksRef = React.useRef(0);
  const logoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    logoClicksRef.current += 1;
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
    }

    if (logoClicksRef.current >= 3) {
      logoClicksRef.current = 0;
      onNavigateToAdmin();
    } else {
      logoTimerRef.current = setTimeout(() => {
        logoClicksRef.current = 0;
      }, 1200);
    }
  };

  const activeNumber = whatsAppSettings?.activeNumber || '+971522523900';
  const whatsappUrl = buildWhatsAppUrl({
    settings: whatsAppSettings,
    lang: language,
  });

  const announcement =
    language === 'ar'
      ? siteContent?.announcementAr || 'أهلاً بكم في ناصر موبايل دبي • استفسار فوري عبر واتساب • أجهزة أصلية معتمدة'
      : siteContent?.announcementEn || 'Welcome to Nasir Mobile Dubai • Direct WhatsApp Enquiries • Guaranteed Authenticity';

  const showAnnouncement = siteContent?.announcementActive !== false;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#151419]/90 border-b border-white/5 transition-all">
      {/* Announcement Top Bar */}
      {showAnnouncement && (
        <div className="bg-gradient-to-r from-[#391548] via-[#922CB5]/40 to-[#151419] border-b border-[#922CB5]/30 text-xs py-1.5 px-4 text-center text-zinc-200">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#B7F34B] animate-ping" />
            <span>{announcement}</span>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand (Triple-click provides secret owner access) */}
          <div onClick={handleLogoClick} className="flex items-center cursor-pointer select-none">
            <Logo size="md" />
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-[#242129]/80 border border-white/10 rounded-full py-2.5 px-10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-[#922CB5] focus:ring-1 focus:ring-[#922CB5] transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs bg-white/10 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <a href="#catalogue" className="hover:text-[#B7F34B] transition-colors">
              {t('catalogue')}
            </a>
            <a href="#categories" className="hover:text-[#B7F34B] transition-colors">
              {t('categories')}
            </a>
            <a href="#about" className="hover:text-[#B7F34B] transition-colors">
              {t('about_us')}
            </a>
            <a href="#faq" className="hover:text-[#B7F34B] transition-colors">
              {t('faq')}
            </a>
            <a href="#contact" className="hover:text-[#B7F34B] transition-colors">
              {t('contact')}
            </a>
          </nav>

          {/* Actions: WhatsApp CTA + Language Toggle + Admin Link */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#242129] border border-white/10 text-zinc-200 hover:text-white hover:border-[#922CB5] transition-all cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#B7F34B]" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* WhatsApp Quick CTA */}
            {whatsAppSettings?.isEnabled !== false && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all hover:scale-102 active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{formatDisplayNumber(activeNumber)}</span>
              </a>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Drawer */}
        {searchOpen && (
          <div className="md:hidden py-3 border-t border-white/10">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-[#242129] border border-white/10 rounded-full py-2 px-10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-[#922CB5]"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs bg-white/10 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#151419] px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-base font-medium text-zinc-300">
            <a
              href="#catalogue"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#B7F34B]"
            >
              {t('catalogue')}
            </a>
            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#B7F34B]"
            >
              {t('categories')}
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#B7F34B]"
            >
              {t('about_us')}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#B7F34B]"
            >
              {t('faq')}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#B7F34B]"
            >
              {t('contact')}
            </a>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>{t('enquire_whatsapp')}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
