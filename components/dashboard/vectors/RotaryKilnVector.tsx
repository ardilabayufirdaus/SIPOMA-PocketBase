import React from 'react';

interface RotaryKilnVectorProps {
  status?: 'running' | 'down' | 'warning';
  className?: string;
}

export const RotaryKilnVector: React.FC<RotaryKilnVectorProps> = ({
  status = 'running',
  className = 'w-full h-14',
}) => {
  const isRunning = status === 'running';

  return (
    <svg
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible select-none`}
      aria-hidden="true"
    >
      <defs>
        {/* Thermal Glow Gradient for Kiln Flame */}
        <linearGradient id={`kiln-flame-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        {/* Kiln Cylinder Gradient */}
        <linearGradient id={`kiln-shell-grad-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Ground Foundation Line */}
      <rect
        x="6"
        y="62"
        width="108"
        height="5"
        rx="1.5"
        className="fill-slate-300 dark:fill-slate-700"
      />

      {/* ================= PREHEATER CYCLONE TOWER (LEFT) ================= */}
      {/* Preheater Structural Frame */}
      <rect
        x="8"
        y="12"
        width="22"
        height="50"
        rx="2"
        className="fill-slate-200/90 dark:fill-slate-800/90 stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1.5"
      />
      {/* Cyclone Stage Cones */}
      <polygon points="12,18 26,18 19,26" className="fill-slate-400 dark:fill-slate-600" />
      <polygon points="12,28 26,28 19,36" className="fill-slate-400 dark:fill-slate-600" />
      <polygon points="12,38 26,38 19,46" className="fill-slate-400 dark:fill-slate-600" />
      <polygon points="12,48 26,48 19,56" className="fill-slate-400 dark:fill-slate-600" />
      {/* Riser Duct connecting to Kiln Inlet */}
      <path d="M 24 54 L 34 46 L 34 52 L 28 58 Z" className="fill-slate-400 dark:fill-slate-500" />

      {/* ================= ROLLER PIER STATIONS ================= */}
      {/* Pier 1 (Inlet) */}
      <polygon points="40,62 43,46 49,46 52,62" className="fill-slate-400 dark:fill-slate-600" />
      <circle cx="46" cy="45" r="2.5" className="fill-slate-600 dark:fill-slate-400" />

      {/* Pier 2 (Middle) */}
      <polygon points="66,62 69,48 75,48 78,62" className="fill-slate-400 dark:fill-slate-600" />
      <circle cx="72" cy="47" r="2.5" className="fill-slate-600 dark:fill-slate-400" />

      {/* Pier 3 (Outlet) */}
      <polygon points="90,62 93,50 99,50 102,62" className="fill-slate-400 dark:fill-slate-600" />
      <circle cx="96" cy="49" r="2.5" className="fill-slate-600 dark:fill-slate-400" />

      {/* ================= INCLINED ROTARY KILN SHELL ================= */}
      {/* Angled Cylinder Tube (from x=30, y=34 to x=102, y=42) */}
      <g transform="rotate(3 65 38)">
        <rect
          x="28"
          y="28"
          width="74"
          height="18"
          rx="3"
          fill={`url(#kiln-shell-grad-${status})`}
          className="stroke-slate-500 dark:stroke-slate-600 drop-shadow-xs"
          strokeWidth="1.5"
        />

        {/* Riding Rings (Tyres) */}
        <rect
          x="42"
          y="26"
          width="5"
          height="22"
          rx="1"
          className="fill-slate-600 dark:fill-slate-400 stroke-slate-700"
          strokeWidth="1"
        />
        <rect
          x="68"
          y="26"
          width="5"
          height="22"
          rx="1"
          className="fill-slate-600 dark:fill-slate-400 stroke-slate-700"
          strokeWidth="1"
        />
        <rect
          x="92"
          y="26"
          width="5"
          height="22"
          rx="1"
          className="fill-slate-600 dark:fill-slate-400 stroke-slate-700"
          strokeWidth="1"
        />

        {/* Central Drive Gear */}
        <rect
          x="58"
          y="25"
          width="4"
          height="24"
          rx="1"
          className={
            isRunning ? 'fill-emerald-500 stroke-emerald-600' : 'fill-rose-500 stroke-rose-600'
          }
          strokeWidth="1"
        />

        {/* Rotating Cylinder Highlights */}
        {isRunning && (
          <line
            x1="32"
            y1="34"
            x2="98"
            y2="34"
            className="stroke-white/40"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
        )}
      </g>

      {/* ================= BURNER HOOD & CLINKER COOLER (RIGHT) ================= */}
      {/* Burner Hood Box */}
      <polygon
        points="102,32 114,32 116,56 102,56"
        className="fill-slate-600 dark:fill-slate-700 stroke-slate-700 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Flame & Thermal Clinker Glow when Running */}
      {isRunning ? (
        <g className="animate-pulse">
          {/* Flame Core */}
          <polygon
            points="104,44 112,40 114,48 108,52"
            fill="url(#kiln-flame-grad-running)"
            filter="drop-shadow(0 0 4px #f59e0b)"
          />
          {/* Clinker Discharge Drops */}
          <circle cx="108" cy="58" r="1.5" className="fill-amber-400 animate-ping" />
          <circle cx="112" cy="60" r="1.5" className="fill-rose-500" />
        </g>
      ) : (
        /* Stoppage Marker */
        <g>
          <line
            x1="105"
            y1="40"
            x2="113"
            y2="48"
            className="stroke-rose-400"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="113"
            y1="40"
            x2="105"
            y2="48"
            className="stroke-rose-400"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Preheater Top Exhaust Stack */}
      <rect
        x="16"
        y="4"
        width="6"
        height="8"
        rx="1"
        className="fill-slate-400 dark:fill-slate-600"
      />

      {/* Status LED Pilot Light */}
      <circle
        cx="19"
        cy="2"
        r="2"
        className={isRunning ? 'fill-emerald-500' : 'fill-rose-500 animate-ping'}
      />
      <circle
        cx="19"
        cy="2"
        r="1.5"
        className={isRunning ? 'fill-emerald-400' : 'fill-rose-500'}
        filter={isRunning ? 'drop-shadow(0 0 3px #10b981)' : 'drop-shadow(0 0 3px #f43f5e)'}
      />
    </svg>
  );
};
