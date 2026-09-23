import React from 'react';

interface DowntimeHazardGearVectorProps {
  count?: number;
  className?: string;
}

export const DowntimeHazardGearVector: React.FC<DowntimeHazardGearVectorProps> = ({
  count = 0,
  className = 'w-16 h-16',
}) => {
  const hasDowntime = count > 0;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hasDowntime ? '#f43f5e' : '#10b981'} />
          <stop offset="100%" stopColor={hasDowntime ? '#be123c' : '#059669'} />
        </linearGradient>

        <linearGradient id="hazard-stripe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* Ambient Halo */}
      <circle
        cx="48"
        cy="48"
        r="42"
        className={
          hasDowntime
            ? 'fill-rose-500/10 dark:fill-rose-950/30'
            : 'fill-emerald-500/10 dark:fill-emerald-950/30'
        }
      />

      {/* Main Industrial Gear (Backdrop / Mechanized) */}
      <g
        className={hasDowntime ? '' : 'animate-spin origin-center'}
        style={{ animationDuration: '24s' }}
      >
        {/* Gear Teeth Outer Ring */}
        <circle
          cx="48"
          cy="48"
          r="30"
          stroke="url(#gear-grad)"
          strokeWidth="6"
          strokeDasharray="9 6"
          className="transition-colors duration-500"
        />
        <circle
          cx="48"
          cy="48"
          r="24"
          className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2"
        />
        {/* Gear Spokes */}
        <line
          x1="28"
          y1="48"
          x2="68"
          y2="48"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.5"
        />
        <line
          x1="48"
          y1="28"
          x2="48"
          y2="68"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.5"
        />
      </g>

      {hasDowntime ? (
        /* WARNING / HAZARD STATE */
        <g className="drop-shadow-md">
          {/* Warning Triangle Shield */}
          <polygon
            points="48,26 68,64 28,64"
            className="fill-amber-400 stroke-rose-600"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Inner Triangle Accent */}
          <polygon points="48,30 64,61 32,61" className="fill-amber-300" />
          {/* Exclamation Mark */}
          <line
            x1="48"
            y1="40"
            x2="48"
            y2="51"
            className="stroke-slate-900"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="48" cy="56.5" r="2" className="fill-slate-900" />

          {/* Alarm Beacon Pulsing Dot */}
          <circle cx="48" cy="22" r="3" className="fill-rose-500 animate-ping" />
          <circle cx="48" cy="22" r="2.5" className="fill-rose-600" />
        </g>
      ) : (
        /* HEALTHY / ALL RUNNING STATE */
        <g className="drop-shadow-sm">
          {/* Green Shield Hub */}
          <circle
            cx="48"
            cy="48"
            r="14"
            className="fill-emerald-500/20 stroke-emerald-500"
            strokeWidth="2"
          />
          {/* Checkmark */}
          <path
            d="M 41 48 L 46 53 L 55 43"
            fill="none"
            className="stroke-emerald-600 dark:stroke-emerald-400"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
};
