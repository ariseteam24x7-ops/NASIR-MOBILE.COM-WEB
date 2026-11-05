import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7 sm:w-8 sm:h-8', font: 'text-xs sm:text-sm', sub: 'text-[7.5px] sm:text-[9px]' },
    md: { box: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10', font: 'text-sm sm:text-base md:text-xl', sub: 'text-[8px] sm:text-[9px] md:text-[10px]' },
    lg: { box: 'w-11 h-11 sm:w-14 sm:h-14', font: 'text-lg sm:text-2xl', sub: 'text-[9px] sm:text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 shrink-0 ${className}`}>
      {/* High-Precision Geometric NM Emblem */}
      <div className={`relative ${currentSize.box} shrink-0 group`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(146,44,181,0.45)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="nmPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b838e4" />
              <stop offset="50%" stopColor="#922cb5" />
              <stop offset="100%" stopColor="#691686" />
            </linearGradient>
            <linearGradient id="nmLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4ff6b" />
              <stop offset="50%" stopColor="#b7f34b" />
              <stop offset="100%" stopColor="#80be14" />
            </linearGradient>
          </defs>

          {/* Deep Dark Shield Background */}
          <rect width="100" height="100" rx="22" fill="#151419" />

          {/* Outer Cyber Tech Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#nmPurpleGrad)"
            strokeWidth="2.5"
            className="opacity-40"
          />

          {/* Precision Lime Ring Segments */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#nmLimeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="28 64"
          />

          {/* Inner Stage Shield */}
          <circle cx="50" cy="50" r="38" fill="#1b1920" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* MONOGRAM: Seamless Geometric NM Monogram (No overlapping artifacts) */}
          {/* Letter 'N' (Cyber Lime) */}
          <path
            d="M 22 28 L 29 28 L 29 44 L 39 28 L 46 28 L 46 72 L 39 72 L 39 56 L 29 72 L 22 72 Z"
            fill="url(#nmLimeGrad)"
          />

          {/* Letter 'M' (Royal Purple) */}
          <path
            d="M 54 72 L 54 28 L 61 28 L 66 52 L 71 28 L 78 28 L 78 72 L 71 72 L 71 46 L 66 62 L 61 46 L 61 72 Z"
            fill="url(#nmPurpleGrad)"
          />

          {/* Central Tech Precision Jewel */}
          <circle cx="50" cy="79" r="3" fill="#b7f34b" />
          <circle cx="50" cy="79" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col select-none whitespace-nowrap min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
            <span className={`font-black tracking-wider uppercase text-slate-900 dark:text-white ${currentSize.font}`}>
              NASIR
            </span>
            <span className={`font-black tracking-wider uppercase text-[#922CB5] dark:text-[#B7F34B] ${currentSize.font}`}>
              MOBILE
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
            <span className={`tracking-widest font-semibold uppercase text-slate-500 dark:text-zinc-400 ${currentSize.sub}`}>
              DUBAI • UAE
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#922CB5] dark:bg-[#B7F34B] animate-pulse"></span>
          </div>
        </div>
      )}
    </div>
  );
};
