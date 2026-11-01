import React from 'react';
import { motion } from 'motion/react';
import { Brand } from '../types/index.ts';
import { Sparkles, Layers } from 'lucide-react';
import { resolveBrandLogo, BRAND_PLACEHOLDER_ICONS } from '../lib/brand-assets.ts';

export { BRAND_PLACEHOLDER_ICONS };

interface BrandFilterBarProps {
  brands: Brand[];
  selectedBrandSlug: string;
  onSelectBrand: (slug: string) => void;
}

export const BrandFilterBar: React.FC<BrandFilterBarProps> = ({
  brands,
  selectedBrandSlug,
  onSelectBrand,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#922CB5] dark:bg-[#B7F34B] animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Featured Smartphone Brands
          </span>
        </div>
        {selectedBrandSlug && (
          <button
            onClick={() => onSelectBrand('')}
            className="text-[11px] font-bold text-[#922CB5] dark:text-[#B7F34B] hover:underline uppercase tracking-wider cursor-pointer"
          >
            Show All Brands
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Brand Badges Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
        {/* All Brands Pill */}
        <button
          onClick={() => onSelectBrand('')}
          className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer snap-start ${
            !selectedBrandSlug
              ? 'bg-[#922CB5] border-[#B7F34B] text-white shadow-[0_0_15px_rgba(146,44,181,0.4)] scale-102'
              : 'bg-white dark:bg-[#242129] border-slate-200 dark:border-white/5 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-[#2b2733] shadow-sm dark:shadow-none'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-[#151419] flex items-center justify-center text-[#922CB5] dark:text-[#B7F34B] shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block leading-tight">All Brands</span>
            <span className="text-[9px] text-slate-500 dark:text-zinc-400 block">Complete Catalogue</span>
          </div>
        </button>

        {/* Dynamic Brands List */}
        {brands.map((b) => {
          const isSelected = selectedBrandSlug === b.slug;
          const iconUrl = resolveBrandLogo(b.slug, b.logoUrl) || resolveBrandLogo(b.name, b.logoUrl);

          return (
            <button
              key={b.id}
              onClick={() => onSelectBrand(isSelected ? '' : b.slug)}
              className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer snap-start group ${
                isSelected
                  ? 'bg-gradient-to-r from-[#391548] to-[#1e2a15] border-[#B7F34B] text-white shadow-[0_0_15px_rgba(183,243,75,0.35)] scale-102'
                  : 'bg-white dark:bg-[#242129] border-slate-200 dark:border-white/5 text-slate-700 dark:text-zinc-300 hover:border-[#922CB5]/50 hover:bg-slate-50 dark:hover:bg-[#2b2733] shadow-sm dark:shadow-none'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border transition-transform duration-200 group-hover:scale-105 flex items-center justify-center relative ${
                  isSelected
                    ? 'border-[#B7F34B] shadow-[0_0_8px_rgba(183,243,75,0.6)]'
                    : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151419]'
                }`}
              >
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={b.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-gradient-to-br dark:from-[#242129] dark:to-[#151419] flex items-center justify-center">
                    <span className="text-xs font-black text-[#922CB5] dark:text-[#B7F34B] font-mono">
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-left pr-1">
                <span className="text-xs font-bold block leading-tight text-slate-900 dark:text-white group-hover:text-[#922CB5] dark:group-hover:text-[#B7F34B] transition-colors">
                  {b.name}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-zinc-400 block uppercase tracking-wider">
                  Official
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
