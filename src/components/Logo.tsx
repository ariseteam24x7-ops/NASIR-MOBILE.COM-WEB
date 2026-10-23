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
            <linearGradient id="nmCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#922CB5" />
              <stop offset="60%" stopColor="#391548" />
              <stop offset="100%" stopColor="#151419" />
            </linearGradient>
            <linearGradient id="nmLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B7F34B" />
              <stop offset="100%" stopColor="#8AC620" />
            </linearGradient>
            <linearGradient id="nmSlashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#B7F34B" />
            </linearGradient>
          </defs>

          {/* Outer Ring with angular cuts */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="url(#nmCircleGrad)"
            strokeWidth="3.5"
            className="opacity-90"
          />

          {/* Angular Tech Corner Accents */}
          <path
            d="M 50 4 A 46 46 0 0 1 96 50"
            stroke="#B7F34B"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 12"
          />
          <path
            d="M 50 96 A 46 46 0 0 1 4 50"
            stroke="#922CB5"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Inner Dark Hex/Circle Shield */}
          <circle cx="50" cy="50" r="38" fill="#151419" />

          {/* Geometric Angular 'N' & 'Z' Interlocking Monogram */}
          {/* N Left Pillar */}
          <path
            d="M 28 70 L 28 30 L 36 30 L 36 70 Z"
            fill="url(#nmCircleGrad)"
          />
          {/* N Diagonal / Z Diagonal */}
          <path
            d="M 33 30 L 67 70 L 59 70 L 25 30 Z"
            fill="url(#nmSlashGrad)"
          />
          {/* Z Top Horizontal bar */}
          <path
            d="M 40 30 L 72 30 L 72 38 L 48 38 Z"
            fill="#B7F34B"
          />
          {/* Z Bottom Horizontal bar */}
          <path
            d="M 28 62 L 52 62 L 52 70 L 28 70 Z"
            fill="#B7F34B"
          />
          {/* Z Right Pillar */}
          <path
            d="M 64 30 L 72 30 L 72 70 L 64 70 Z"
            fill="url(#nmCircleGrad)"
          />

          {/* Central Precision Tech Dot */}
          <circle cx="50" cy="50" r="4.5" fill="#B7F34B" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-wider uppercase text-white ${currentSize.font}`}>
              NASIR
            </span>
            <span className={`font-black tracking-wider uppercase text-[#B7F34B] ${currentSize.font}`}>
              MOBILE
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`tracking-widest font-semibold uppercase text-zinc-400 ${currentSize.sub}`}>
              DUBAI • UAE
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#B7F34B] animate-pulse"></span>
          </div>
        </div>
      )}
    </div>
  );
};
