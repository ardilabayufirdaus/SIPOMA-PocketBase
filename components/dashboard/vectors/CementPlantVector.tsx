import React from 'react';

interface CementPlantVectorProps {
  className?: string;
  size?: number;
}

export const CementPlantVector: React.FC<CementPlantVectorProps> = ({
  className = 'w-16 h-16',
}) => {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        {/* Plant Gradient */}
        <linearGradient id="plant-sky-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>

        <linearGradient id="plant-building-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="plant-silo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="plant-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Ambient Backdrop Glow */}
      <circle cx="48" cy="48" r="42" fill="url(#plant-sky-grad)" />

      {/* Ground Line */}
      <line
        x1="8"
        y1="82"
        x2="88"
        y2="82"
        className="stroke-slate-300 dark:stroke-slate-700"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Chimney / Exhaust Stack */}
      <path
        d="M 22 82 L 25 24 L 31 24 L 34 82 Z"
        className="fill-slate-300 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1.5"
      />
      {/* Chimney Bands */}
      <rect x="25.5" y="32" width="5.2" height="3" className="fill-rose-500" />
      <rect x="26.3" y="44" width="6" height="3" className="fill-rose-500" />
      <rect x="27.1" y="56" width="6.8" height="3" className="fill-rose-500" />

      {/* Subtle Smoke / Steam Puffs */}
      <circle
        cx="27"
        cy="17"
        r="3"
        className="fill-slate-300/60 dark:fill-slate-500/40 animate-pulse"
      />
      <circle
        cx="31"
        cy="11"
        r="4"
        className="fill-slate-300/40 dark:fill-slate-500/30 animate-pulse"
        style={{ animationDelay: '300ms' }}
      />
      <circle
        cx="37"
        cy="6"
        r="5"
        className="fill-slate-300/20 dark:fill-slate-500/15 animate-pulse"
        style={{ animationDelay: '600ms' }}
      />

      {/* Main Factory Grinding Hall */}
      <path
        d="M 32 82 L 32 50 L 44 42 L 56 50 L 56 82 Z"
        className="fill-cyan-500/20 dark:fill-cyan-500/10 stroke-cyan-500 dark:stroke-cyan-400"
        strokeWidth="2"
      />
      {/* Main Hall Roof Cap */}
      <path
        d="M 30 51 L 44 41 L 58 51"
        fill="none"
        className="stroke-cyan-600 dark:stroke-cyan-300"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Windows Grid */}
      <rect
        x="36"
        y="56"
        width="6"
        height="6"
        rx="1"
        className="fill-cyan-400/60 dark:fill-cyan-400/40"
      />
      <rect
        x="46"
        y="56"
        width="6"
        height="6"
        rx="1"
        className="fill-cyan-400/60 dark:fill-cyan-400/40"
      />
      <rect
        x="36"
        y="66"
        width="6"
        height="6"
        rx="1"
        className="fill-cyan-400/60 dark:fill-cyan-400/40"
      />
      <rect
        x="46"
        y="66"
        width="6"
        height="6"
        rx="1"
        className="fill-cyan-400/60 dark:fill-cyan-400/40"
      />

      {/* Elevated Conveyor Gallery Tube */}
      <path
        d="M 54 58 L 70 48"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="56"
        y1="60"
        x2="68"
        y2="52"
        className="stroke-cyan-400"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      {/* Twin Cement Storage Silos */}
      {/* Silo 1 (Back Silo) */}
      <rect
        x="64"
        y="42"
        width="15"
        height="40"
        rx="2"
        className="fill-slate-300 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1.5"
      />
      <path
        d="M 64 42 C 64 42 71.5 32 79 42 Z"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1.5"
      />

      {/* Silo 2 (Front Silo) */}
      <rect
        x="72"
        y="48"
        width="16"
        height="34"
        rx="2"
        className="fill-slate-200 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1.5"
      />
      <path
        d="M 72 48 C 72 48 80 38 88 48 Z"
        className="fill-slate-300 dark:fill-slate-500 stroke-slate-400 dark:stroke-slate-400"
        strokeWidth="1.5"
      />
      {/* Silo 2 Level Scale */}
      <line x1="75" y1="58" x2="78" y2="58" className="stroke-cyan-500" strokeWidth="1.5" />
      <line x1="75" y1="65" x2="80" y2="65" className="stroke-cyan-500" strokeWidth="1.5" />
      <line x1="75" y1="72" x2="78" y2="72" className="stroke-cyan-500" strokeWidth="1.5" />

      {/* Foreground Indicator / Production Beam */}
      <circle cx="48" cy="80" r="2" className="fill-emerald-500 animate-ping" />
      <circle cx="48" cy="80" r="1.5" className="fill-emerald-500" />
    </svg>
  );
};
