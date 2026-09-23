import React from 'react';

interface VerticalRollerMillVectorProps {
  status?: 'running' | 'down' | 'warning';
  className?: string;
}

export const VerticalRollerMillVector: React.FC<VerticalRollerMillVectorProps> = ({
  status = 'running',
  className = 'w-full h-14',
}) => {
  const isRunning = status === 'running';

  return (
    <svg
      viewBox="0 0 110 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible select-none`}
      aria-hidden="true"
    >
      <defs>
        {/* Main Mill Body Steel Gradient */}
        <linearGradient id={`vrm-body-grad-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="25%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Separator / Classifier Gradient */}
        <linearGradient id={`vrm-sep-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Roller Gradient */}
        <linearGradient id={`vrm-roller-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* ================= 1. FOUNDATION SLAB & SUPPORTS ================= */}
      {/* Concrete Foundation Ground Slab */}
      <rect
        x="10"
        y="60"
        width="90"
        height="6"
        rx="1.5"
        className="fill-slate-300 dark:fill-slate-700"
      />

      {/* Heavy Base Pedestal Under Mill */}
      <polygon
        points="28,60 34,50 76,50 82,60"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* ================= 2. DRIVE UNIT (MOTOR & PLANETARY GEARBOX) ================= */}
      {/* Main Bevel-Planetary Gearbox Housing */}
      <rect
        x="42"
        y="50"
        width="26"
        height="10"
        rx="1"
        className="fill-slate-600 dark:fill-slate-700 stroke-slate-700 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Drive Motor on Left */}
      <rect
        x="14"
        y="53"
        width="16"
        height="7"
        rx="1"
        className="fill-slate-500 dark:fill-slate-600 stroke-slate-600 dark:stroke-slate-500"
        strokeWidth="1"
      />
      {/* Motor Cooling Ribs */}
      <line
        x1="18"
        y1="54"
        x2="18"
        y2="59"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1"
      />
      <line
        x1="22"
        y1="54"
        x2="22"
        y2="59"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1"
      />
      <line
        x1="26"
        y1="54"
        x2="26"
        y2="59"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Motor-to-Gearbox Coupling Shaft */}
      <rect
        x="30"
        y="55.5"
        width="12"
        height="2.5"
        className="fill-slate-400 dark:fill-slate-500"
      />

      {/* ================= 3. LOWER MILL HOUSING & GRINDING TABLE ================= */}
      {/* Lower Mill Casing (Hot Gas Port / Louver Ring Zone) */}
      <rect
        x="32"
        y="42"
        width="46"
        height="9"
        rx="1"
        className="fill-slate-500 dark:fill-slate-600 stroke-slate-600 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Rotating Grinding Table Disc */}
      <rect
        x="35"
        y="39.5"
        width="40"
        height="4"
        rx="1"
        fill={isRunning ? '#38bdf8' : '#64748b'}
        className="stroke-slate-600 dark:stroke-slate-400"
        strokeWidth="1"
      />

      {/* ================= 4. HYDRAULIC TENSION SYSTEM & ACCUMULATORS ================= */}
      {/* Left Hydraulic Cylinder & Rocker Arm */}
      <rect
        x="22"
        y="33"
        width="4"
        height="16"
        rx="1"
        className="fill-slate-500 dark:fill-slate-600"
      />
      <circle cx="24" cy="31" r="2" className="fill-slate-600 dark:fill-slate-400" />
      <line
        x1="24"
        y1="31"
        x2="36"
        y2="35"
        className="stroke-slate-600 dark:stroke-slate-400"
        strokeWidth="2"
      />
      {/* Left Hydraulic Accumulator Bottle */}
      <rect
        x="19"
        y="26"
        width="3"
        height="7"
        rx="1.5"
        className={isRunning ? 'fill-cyan-500' : 'fill-slate-500'}
      />

      {/* Right Hydraulic Cylinder & Rocker Arm */}
      <rect
        x="84"
        y="33"
        width="4"
        height="16"
        rx="1"
        className="fill-slate-500 dark:fill-slate-600"
      />
      <circle cx="86" cy="31" r="2" className="fill-slate-600 dark:fill-slate-400" />
      <line
        x1="86"
        y1="31"
        x2="74"
        y2="35"
        className="stroke-slate-600 dark:stroke-slate-400"
        strokeWidth="2"
      />
      {/* Right Hydraulic Accumulator Bottle */}
      <rect
        x="88"
        y="26"
        width="3"
        height="7"
        rx="1.5"
        className={isRunning ? 'fill-cyan-500' : 'fill-slate-500'}
      />

      {/* ================= 5. MAIN MILL HOUSING & CONICAL ROLLERS ================= */}
      {/* Vertical Mill Main Middle Cylinder */}
      <rect
        x="30"
        y="22"
        width="50"
        height="19"
        rx="2"
        fill={`url(#vrm-body-grad-${status})`}
        className="stroke-slate-500 dark:stroke-slate-600"
        strokeWidth="1.5"
      />

      {/* Center Inspection / Maintenance Hatch Door */}
      <rect
        x="50"
        y="28"
        width="10"
        height="9"
        rx="1"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />
      <circle cx="52" cy="32.5" r="0.8" className="fill-slate-700 dark:fill-slate-300" />

      {/* Left Conical Grinding Roller (Tilted on table) */}
      <g transform="rotate(-15 38 34)">
        <ellipse
          cx="38"
          cy="34"
          rx="5.5"
          ry="7"
          fill={isRunning ? 'url(#vrm-roller-grad-running)' : '#475569'}
          className="stroke-slate-700 dark:stroke-slate-400"
          strokeWidth="1"
        />
        {isRunning && (
          <line
            x1="38"
            y1="28"
            x2="38"
            y2="40"
            className="stroke-white/50"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}
      </g>

      {/* Right Conical Grinding Roller (Tilted on table) */}
      <g transform="rotate(15 72 34)">
        <ellipse
          cx="72"
          cy="34"
          rx="5.5"
          ry="7"
          fill={isRunning ? 'url(#vrm-roller-grad-running)' : '#475569'}
          className="stroke-slate-700 dark:stroke-slate-400"
          strokeWidth="1"
        />
        {isRunning && (
          <line
            x1="72"
            y1="28"
            x2="72"
            y2="40"
            className="stroke-white/50"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}
      </g>

      {/* ================= 6. MATERIAL FEED INLET CHUTE ================= */}
      {/* Inclined Feed Spout on Left */}
      <path
        d="M 12 16 L 24 16 L 32 28 L 26 28 Z"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* ================= 7. DYNAMIC CLASSIFIER / SEPARATOR (TOP) ================= */}
      {/* Separator Conical Housing Base Transition */}
      <polygon
        points="30,22 34,14 76,14 80,22"
        fill={`url(#vrm-sep-grad-${status})`}
        className="stroke-slate-500 dark:stroke-slate-600"
        strokeWidth="1.5"
      />

      {/* Dynamic Classifier Rotor Housing */}
      <rect
        x="36"
        y="9"
        width="38"
        height="8"
        rx="1.5"
        className="fill-slate-700 dark:fill-slate-800 stroke-slate-600 dark:stroke-slate-500"
        strokeWidth="1.2"
      />

      {/* Classifier Louver / Rotor Cage Vanes */}
      <line
        x1="41"
        y1="10.5"
        x2="41"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="45"
        y1="10.5"
        x2="45"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="49"
        y1="10.5"
        x2="49"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="55"
        y1="10.5"
        x2="55"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="61"
        y1="10.5"
        x2="61"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="65"
        y1="10.5"
        x2="65"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />
      <line
        x1="69"
        y1="10.5"
        x2="69"
        y2="15.5"
        className={isRunning ? 'stroke-cyan-400 animate-pulse' : 'stroke-slate-500'}
        strokeWidth="1"
      />

      {/* Classifier Variable-Speed Drive Motor on Top */}
      <rect
        x="51"
        y="3"
        width="8"
        height="6"
        rx="1"
        className="fill-slate-500 dark:fill-slate-600 stroke-slate-600 dark:stroke-slate-400"
        strokeWidth="1"
      />

      {/* ================= 8. TOP PRODUCT DISCHARGE GOOSENECK DUCT ================= */}
      {/* Clean Gas & Fine Powder Discharge Duct to Filter */}
      <path
        d="M 68 9 L 68 4 Q 68 2 74 2 L 92 2 L 92 6 L 76 6 Q 72 6 72 9 Z"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* ================= 9. OPERATIONAL DYNAMICS & PILOT BEACON ================= */}
      {isRunning ? (
        <g className="animate-pulse">
          {/* Swirling Fine Dust Flow Indicators inside separator */}
          <path
            d="M 42 18 Q 55 16 68 18"
            fill="none"
            className="stroke-cyan-300/60"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          {/* Table motion waves */}
          <circle cx="55" cy="41.5" r="1.5" className="fill-cyan-300" />
        </g>
      ) : (
        /* Stoppage Cross Marker */
        <g>
          <line
            x1="51"
            y1="29"
            x2="59"
            y2="37"
            className="stroke-rose-300"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="59"
            y1="29"
            x2="51"
            y2="37"
            className="stroke-rose-300"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Status LED Pilot Light Beacon */}
      <circle
        cx="55"
        cy="1"
        r="2"
        className={isRunning ? 'fill-emerald-500' : 'fill-rose-500 animate-ping'}
      />
      <circle
        cx="55"
        cy="1"
        r="1.5"
        className={isRunning ? 'fill-emerald-400' : 'fill-rose-500'}
        filter={isRunning ? 'drop-shadow(0 0 3px #10b981)' : 'drop-shadow(0 0 3px #f43f5e)'}
      />
    </svg>
  );
};
