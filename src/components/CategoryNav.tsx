import React from 'react';
import { motion } from 'motion/react';
import { Category } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Smartphone,
  RefreshCw,
  ShieldCheck,
  Zap,
  Headphones,
  Watch,
  Tablet,
  Gamepad2,
  Cpu,
  Package,
} from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
}) => {
  const { language, t } = useLanguage();

  const getIcon = (iconName?: string) => {
    if (!iconName) return <Package className="w-5 h-5" />;
    if (iconName.startsWith('/') || iconName.startsWith('http') || iconName.startsWith('data:')) {
      return (
        <img
          src={iconName}
          alt="Category Icon"
          referrerPolicy="no-referrer"
          className="w-7 h-7 object-contain rounded-lg"
        />
      );
    }

    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'Headphones':
        return <Headphones className="w-5 h-5" />;
      case 'Watch':
        return <Watch className="w-5 h-5" />;
      case 'Tablet':
        return <Tablet className="w-5 h-5" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <section id="categories" className="py-12 bg-[#151419] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {t('categories')}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {language === 'ar'
                ? 'تصفح أحدث الأجهزة والإلكترونيات حسب الفئة المحددة'
                : 'Browse cutting-edge electronics and certified devices by category'}
            </p>
          </div>

          {selectedCategorySlug && (
            <button
              onClick={() => onSelectCategory('')}
              className="text-xs font-bold text-[#B7F34B] hover:underline uppercase tracking-wider self-start sm:self-auto cursor-pointer"
            >
              {t('clear_filters')}
            </button>
          )}
        </motion.div>

        {/* Categories Grid with Staggered Scroll Reveal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategorySlug === cat.slug;
            const name = language === 'ar' ? cat.nameAr : cat.nameEn;

            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                onClick={() => onSelectCategory(isSelected ? '' : cat.slug)}
                className={`flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                  isSelected
                    ? 'bg-[#922CB5] border-[#B7F34B] shadow-[0_0_20px_rgba(146,44,181,0.5)] translate-y-[-2px]'
                    : 'bg-[#242129] border-white/5 hover:border-[#922CB5]/50 hover:bg-[#2d2934]'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                    isSelected
                      ? 'bg-white text-[#922CB5]'
                      : 'bg-[#151419] text-[#B7F34B] group-hover:text-white group-hover:bg-[#922CB5]'
                  }`}
                >
                  {getIcon(cat.icon)}
                </div>
                <span
                  className={`text-xs font-bold leading-tight line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                  }`}
                >
                  {name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
