import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language } = useLanguage();

  const isAr = language === 'ar';
  const label = isDark
    ? isAr
      ? 'الوضع الفاتح'
      : 'Light Mode'
    : isAr
    ? 'الوضع الداكن'
    : 'Dark Mode';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={label}
      className={`group relative flex items-center justify-center gap-2 ${
        showLabel ? 'px-3 py-2 rounded-full' : 'w-9 h-9 p-0 rounded-xl sm:rounded-full'
      } border transition-all duration-200 cursor-pointer select-none active:scale-95 shrink-0 ${
        isDark
          ? 'bg-[#242129] border-white/10 text-amber-400 hover:text-amber-300 hover:border-amber-400/40 hover:bg-[#2c2833] shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-[#922CB5] hover:border-[#922CB5]/40 hover:bg-slate-200/80 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 group-hover:text-[#922CB5] transition-transform duration-300 -rotate-12 group-hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold leading-none">
          {label}
        </span>
      )}
    </button>
  );
};
