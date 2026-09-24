import React from 'react';
import { SiloItem } from '../../hooks/useMainDashboardChartsData';

interface SiloVectorItemProps {
  silo: SiloItem;
  onClick?: () => void;
  t?: Record<string, string>;
  language?: 'en' | 'id';
}

export const SiloVectorItem: React.FC<SiloVectorItemProps> = ({ silo, t, language = 'id' }) => {
  const pct = Math.min(100, Math.max(0, silo.occupancyPercent));
  const freeSpace = Math.max(0, silo.capacity - silo.currentContent);

  // Status Color & Gradient Mapping
  const getStatusConfig = (percent: number) => {
    if (percent >= 90) {
      return {
        theme: 'rose',
        statusLabel:
          t?.silo_status_crit_full || (language === 'en' ? 'Critically Full' : 'Kritis Penuh'),
        gradientStart: '#f43f5e',
        gradientEnd: '#be123c',
        glowColor: 'rgba(244, 63, 94, 0.4)',
        badgeBg:
          'bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
        ledColor: '#f43f5e',
        isPulse: true,
      };
    }
    if (percent >= 75) {
      return {
        theme: 'amber',
        statusLabel: t?.silo_status_high || (language === 'en' ? 'High' : 'Tinggi'),
        gradientStart: '#fbbf24',
        gradientEnd: '#d97706',
        glowColor: 'rgba(251, 191, 36, 0.35)',
        badgeBg:
          'bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
        ledColor: '#f59e0b',
        isPulse: false,
      };
    }
    if (percent <= 10) {
      return {
        theme: 'orange',
        statusLabel:
          t?.silo_status_crit_low || (language === 'en' ? 'Critically Low' : 'Kritis Rendah'),
        gradientStart: '#fb923c',
        gradientEnd: '#c2410c',
        glowColor: 'rgba(251, 146, 60, 0.35)',
        badgeBg:
          'bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60',
        ledColor: '#ea580c',
        isPulse: true,
      };
    }
    return {
      theme: 'emerald',
      statusLabel: t?.silo_status_normal || 'Normal',
      gradientStart: '#06b6d4',
      gradientEnd: '#059669',
      glowColor: 'rgba(6, 182, 212, 0.35)',
      badgeBg:
        'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      ledColor: '#10b981',
      isPulse: false,
    };
  };

  const status = getStatusConfig(pct);

  // SVG Geometry Dimensions:
  // Cylinder height = 76px (from y=38 to y=114)
  // Hopper height = 22px (from y=114 to y=136)
  // Total fillable height = 98px
  const cylinderTop = 38;
  const cylinderHeight = 76;
  const cylinderBottom = 114;
  const hopperBottom = 136;
  const totalFillHeight = 98; // from 38 to 136

  // Calculate current powder fill height (from bottom of hopper y=136 upwards)
  const fillHeight = (pct / 100) * totalFillHeight;
  const fillY = hopperBottom - fillHeight;

  const gradientId = `silo-fill-grad-${silo.id}`;
  const clipPathId = `silo-clip-body-${silo.id}`;

  return (
    <div
      className="group relative flex flex-col items-center justify-between bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800/90 p-2 shadow-2xs hover:shadow-md hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all duration-300 w-full min-w-0 h-full select-none"
      title={`${silo.silo_name} (${silo.unit}): ${pct}% - ${silo.currentContent.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} / ${silo.capacity.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} ${t?.unit_tons || (language === 'en' ? 'Tons' : 'Ton')}`}
    >
      {/* Top Header: Silo Name & Unit */}
      <div className="w-full flex items-center justify-between mb-1 px-0.5 gap-1">
        <span className="text-[10px] xl:text-[10.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
          {silo.silo_name}
        </span>
        <span className="text-[8px] xl:text-[8.5px] px-1 py-0.2 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 truncate flex-shrink-0">
          {silo.unit}
        </span>
      </div>

      {/* Main SVG Silo Vector Illustration */}
      <div className="relative w-full h-[98px] xl:h-[108px] flex items-center justify-center my-0.5">
        <svg
          viewBox="0 0 110 162"
          className="w-auto h-full overflow-visible drop-shadow-xs"
          aria-hidden="true"
        >
          <defs>
            {/* Dynamic Fill Gradient */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={status.gradientStart} />
              <stop offset="100%" stopColor={status.gradientEnd} />
            </linearGradient>

            {/* Gloss / 3D Cylinder Reflection Overlay */}
            <linearGradient id={`silo-gloss-${silo.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>

            {/* Cutaway Silo Interior Clip Path (Cylinder + Bottom Hopper) */}
            <clipPath id={clipPathId}>
              <path
                d="M 22,38 
                   L 88,38 
                   L 88,114 
                   L 63,136 
                   L 47,136 
                   L 22,114 
                   Z"
              />
            </clipPath>
          </defs>

          {/* ================= BACKGROUND SHADOW & LEGS ================= */}
          {/* Ground Base / Shadow */}
          <ellipse
            cx="55"
            cy="158"
            rx="38"
            ry="3.5"
            className="fill-slate-300/40 dark:fill-slate-950/60"
          />

          {/* Support Structural Steel Legs */}
          {/* Left Main Pillar */}
          <rect
            x="24"
            y="112"
            width="4"
            height="44"
            rx="1.5"
            className="fill-slate-400 dark:fill-slate-600"
          />
          {/* Right Main Pillar */}
          <rect
            x="82"
            y="112"
            width="4"
            height="44"
            rx="1.5"
            className="fill-slate-400 dark:fill-slate-600"
          />
          {/* Middle Pillar */}
          <rect
            x="53"
            y="136"
            width="4"
            height="20"
            rx="1"
            className="fill-slate-300 dark:fill-slate-700"
          />
          {/* Cross Bracing Structural Trusses */}
          <line
            x1="26"
            y1="126"
            x2="55"
            y2="148"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />
          <line
            x1="84"
            y1="126"
            x2="55"
            y2="148"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />

          {/* ================= SILO INNER CHAMBER (BACKGROUND) ================= */}
          {/* Empty Interior Background (Glass/Chamber Effect) */}
          <path
            d="M 22,38 L 88,38 L 88,114 L 63,136 L 47,136 L 22,114 Z"
            className="fill-slate-100/90 dark:fill-slate-800/80"
          />

          {/* ================= DYNAMIC CEMENT POWDER FILL ================= */}
          <g clipPath={`url(#${clipPathId})`}>
            {/* Filled Powder Rect (Animated Height) */}
            <rect
              x="20"
              y={fillY}
              width="70"
              height={fillHeight + 10}
              fill={`url(#${gradientId})`}
              className="transition-all duration-700 ease-out"
            />

            {/* Powder Surface Ellipse Wave Highlight */}
            {pct > 0 && pct < 99 && (
              <ellipse
                cx="55"
                cy={fillY}
                rx="33"
                ry="3"
                fill="#ffffff"
                fillOpacity="0.3"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Inner Powder Texture / Gradient Shade */}
            <rect
              x="20"
              y="38"
              width="70"
              height="98"
              fill={`url(#silo-gloss-${silo.id})`}
              pointerEvents="none"
            />
          </g>

          {/* ================= SCALE MARKINGS / TICKS ================= */}
          {/* 100% Mark (y=38) */}
          <line
            x1="82"
            y1="38"
            x2="88"
            y2="38"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1.5"
          />
          {/* 75% Mark (y=62.5) */}
          <line
            x1="84"
            y1="62.5"
            x2="88"
            y2="62.5"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
          />
          {/* 50% Mark (y=87) */}
          <line
            x1="82"
            y1="87"
            x2="88"
            y2="87"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1.5"
          />
          {/* 25% Mark (y=111.5) */}
          <line
            x1="84"
            y1="111.5"
            x2="88"
            y2="111.5"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
          />
          {/* 0% Mark (y=136) */}
          <line
            x1="59"
            y1="136"
            x2="63"
            y2="136"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="1.5"
          />

          {/* Scale Labels (Mini Ticks) */}
          <text
            x="91"
            y="41"
            className="fill-slate-400 dark:fill-slate-500 text-[6.5px] font-semibold"
          >
            100%
          </text>
          <text
            x="91"
            y="90"
            className="fill-slate-400 dark:fill-slate-500 text-[6.5px] font-semibold"
          >
            50%
          </text>
          <text
            x="66"
            y="139"
            className="fill-slate-400 dark:fill-slate-500 text-[6.5px] font-semibold"
          >
            0%
          </text>

          {/* ================= SILO TRANSPARENT GLASS SHELL & BORDER ================= */}
          {/* Outer Shell Border */}
          <path
            d="M 22,38 L 88,38 L 88,114 L 63,136 L 47,136 L 22,114 Z"
            fill="none"
            className="stroke-slate-400/80 dark:stroke-slate-600/90"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Cylindrical Rib Ring Lines (Reinforcement Bands) */}
          <line
            x1="22"
            y1="63"
            x2="88"
            y2="63"
            className="stroke-slate-300/60 dark:stroke-slate-700/60"
            strokeWidth="1"
          />
          <line
            x1="22"
            y1="89"
            x2="88"
            y2="89"
            className="stroke-slate-300/60 dark:stroke-slate-700/60"
            strokeWidth="1"
          />

          {/* Discharge Chute / Bottom Spout */}
          <rect
            x="51"
            y="136"
            width="8"
            height="6"
            rx="1"
            className="fill-slate-500 dark:fill-slate-600 stroke-slate-600 dark:stroke-slate-700"
            strokeWidth="1"
          />

          {/* ================= SILO ROOF / DOME CAP ================= */}
          {/* Roof Conical Cap with 3D Curve */}
          <path
            d="M 20,38 
               C 20,38 32,16 55,14 
               C 78,16 90,38 90,38 
               Z"
            className="fill-slate-300 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-600"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Roof Ridge Line */}
          <path
            d="M 55,14 L 55,38"
            className="stroke-slate-400/80 dark:stroke-slate-600/80"
            strokeWidth="1"
          />
          {/* Top Intake Vent / Filter Unit Hat */}
          <rect
            x="50"
            y="8"
            width="10"
            height="7"
            rx="1.5"
            className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
            strokeWidth="1"
          />
          <rect
            x="48"
            y="6"
            width="14"
            height="2.5"
            rx="1"
            className="fill-slate-500 dark:fill-slate-500"
          />

          {/* ================= STATUS LED PILOT BEACON ================= */}
          <circle
            cx="55"
            cy="4"
            r="2.5"
            fill={status.ledColor}
            className={status.isPulse ? 'animate-ping origin-center' : ''}
          />
          <circle
            cx="55"
            cy="4"
            r="2"
            fill={status.ledColor}
            filter={`drop-shadow(0 0 3px ${status.ledColor})`}
          />
        </svg>
      </div>

      {/* Percentage Badge */}
      <div className="w-full flex items-center justify-between mt-1 gap-1">
        <span
          className={`text-[9.5px] xl:text-[10px] font-black px-1.5 py-0.5 rounded-md border tracking-tight tabular-nums ${status.badgeBg}`}
        >
          {pct}%
        </span>
        <span className="text-[8.5px] xl:text-[9px] font-bold text-slate-700 dark:text-slate-300 tabular-nums truncate">
          {silo.currentContent.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
          {t?.unit_tons_short || 'T'}
        </span>
      </div>

      {/* Subtext: Sisa / Kapasitas */}
      <div className="w-full flex justify-between items-center text-[8px] xl:text-[8.5px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 tabular-nums gap-1">
        <span className="truncate">
          {t?.silo_remaining || (language === 'en' ? 'Rem.:' : 'Sisa:')}{' '}
          {freeSpace.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
          {t?.unit_tons_short || 'T'}
        </span>
        <span className="opacity-75 truncate text-right">
          {t?.silo_max || 'Max:'}{' '}
          {silo.capacity.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
          {t?.unit_tons_short || 'T'}
        </span>
      </div>
    </div>
  );
};
