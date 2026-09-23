import React from 'react';

interface CementBallMillVectorProps {
  status?: 'running' | 'down' | 'warning';
  className?: string;
}

export const CementBallMillVector: React.FC<CementBallMillVectorProps> = ({
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
        {/* Main Mill Cylinder Gradient */}
        <linearGradient id={`mill-body-grad-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="25%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Girth Gear Gradient */}
        <linearGradient id="mill-gear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Ground Foundation Slab */}
      <rect
        x="10"
        y="58"
        width="90"
        height="6"
        rx="2"
        className="fill-slate-300 dark:fill-slate-700"
      />

      {/* Left Bearing Pedestal (Inlet Trunnion Support) */}
      <polygon
        points="18,58 24,32 30,32 34,58"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />
      {/* Right Bearing Pedestal (Discharge Trunnion Support) */}
      <polygon
        points="76,58 80,32 86,32 92,58"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Left Inlet Feed Chute */}
      <path
        d="M 12 18 L 22 26 L 22 38 L 16 38 Z"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Main Ball Mill Rotating Cylinder Drum */}
      <rect
        x="28"
        y="18"
        width="54"
        height="32"
        rx="4"
        fill={`url(#mill-body-grad-${status})`}
        className="stroke-slate-500 dark:stroke-slate-600 drop-shadow-xs"
        strokeWidth="1.5"
      />

      {/* Cylinder Reinforcement Bands / Shell Rings */}
      <line
        x1="38"
        y1="18"
        x2="38"
        y2="50"
        className="stroke-slate-600/50 dark:stroke-slate-400/40"
        strokeWidth="1.5"
      />
      <line
        x1="48"
        y1="18"
        x2="48"
        y2="50"
        className="stroke-slate-600/50 dark:stroke-slate-400/40"
        strokeWidth="1.5"
      />
      <line
        x1="62"
        y1="18"
        x2="62"
        y2="50"
        className="stroke-slate-600/50 dark:stroke-slate-400/40"
        strokeWidth="1.5"
      />
      <line
        x1="72"
        y1="18"
        x2="72"
        y2="50"
        className="stroke-slate-600/50 dark:stroke-slate-400/40"
        strokeWidth="1.5"
      />

      {/* Central Big Girth Gear (Driven Ring) */}
      <rect
        x="53"
        y="15"
        width="5"
        height="38"
        rx="1"
        className={isRunning ? 'fill-cyan-500 stroke-cyan-600' : 'fill-rose-500 stroke-rose-600'}
        strokeWidth="1"
      />

      {/* Rotating Animation Markers on Cylinder if Running */}
      {isRunning ? (
        <g className="animate-pulse">
          <circle cx="43" cy="34" r="1.5" className="fill-cyan-300" />
          <circle cx="67" cy="34" r="1.5" className="fill-cyan-300" />
          {/* Subtle Motion Waves */}
          <path
            d="M 33 22 Q 55 26 77 22"
            fill="none"
            className="stroke-white/40"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        </g>
      ) : (
        /* Stoppage / Warning Cross */
        <g>
          <line
            x1="51"
            y1="30"
            x2="59"
            y2="38"
            className="stroke-rose-300"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="59"
            y1="30"
            x2="51"
            y2="38"
            className="stroke-rose-300"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Right Discharge Trommel & Hood */}
      <path
        d="M 82 28 L 96 24 L 96 46 L 82 42 Z"
        className="fill-slate-400 dark:fill-slate-600 stroke-slate-500 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Motor & Drive Gearbox at bottom */}
      <rect
        x="50"
        y="50"
        width="11"
        height="8"
        rx="1"
        className="fill-slate-600 dark:fill-slate-700 stroke-slate-700 dark:stroke-slate-500"
        strokeWidth="1"
      />

      {/* Operational Beacon LED */}
      <circle
        cx="55.5"
        cy="9"
        r="2.5"
        className={isRunning ? 'fill-emerald-500' : 'fill-rose-500 animate-ping'}
      />
      <circle
        cx="55.5"
        cy="9"
        r="2"
        className={isRunning ? 'fill-emerald-400' : 'fill-rose-500'}
        filter={isRunning ? 'drop-shadow(0 0 3px #10b981)' : 'drop-shadow(0 0 3px #f43f5e)'}
      />
    </svg>
  );
};
