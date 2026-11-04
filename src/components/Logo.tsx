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
    sm: { box: 'w-8 h-8', font: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', font: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', font: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Distinctive Circular Angular NZ-inspired SVG Logo */}
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

          {/* Outer Ring with cyber glow */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#nmPurpleGrad)"
            strokeWidth="3"
            className="opacity-40"
          />

          {/* Angular Tech Corner Accents */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#nmLimeGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="28 64"
          />

          {/* Inner Dark Shield */}
          <circle cx="50" cy="50" r="38" fill="#151419" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* MONOGRAM: Bold, High-Clarity Interlocking NM */}
          {/* N Left Stem */}
          <path d="M 25 71 L 25 29 L 34 29 L 34 71 Z" fill="url(#nmLimeGrad)" />
          {/* N Diagonal */}
          <path d="M 34 29 L 52 71 L 42 71 L 25 31 Z" fill="url(#nmLimeGrad)" />
          {/* N Joint / M Left Joint */}
          <path d="M 43 71 L 52 50 L 52 71 Z" fill="#b7f34b" />

          {/* M Left Wing Diagonal */}
          <path d="M 52 29 L 63 56 L 55 56 L 47 29 Z" fill="url(#nmPurpleGrad)" />
          {/* M Right Wing Diagonal */}
          <path d="M 63 56 L 74 29 L 82 29 L 68 62 Z" fill="url(#nmPurpleGrad)" />
          {/* M Right Stem */}
          <path d="M 73 29 L 82 29 L 82 71 L 73 71 Z" fill="url(#nmPurpleGrad)" />

          {/* Central Tech Precision Core Jewel */}
          <circle cx="50" cy="74.5" r="3" fill="#b7f34b" />
          <circle cx="50" cy="74.5" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-wider uppercase text-slate-900 dark:text-white ${currentSize.font}`}>
              NASIR
            </span>
            <span className={`font-black tracking-wider uppercase text-[#922CB5] dark:text-[#B7F34B] ${currentSize.font}`}>
              MOBILE
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
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
