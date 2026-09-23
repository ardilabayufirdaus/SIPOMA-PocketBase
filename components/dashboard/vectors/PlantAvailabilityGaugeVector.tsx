import React from 'react';

interface PlantAvailabilityGaugeVectorProps {
  value?: number; // 0 to 100
  className?: string;
}

export const PlantAvailabilityGaugeVector: React.FC<PlantAvailabilityGaugeVectorProps> = ({
  value = 95,
  className = 'w-16 h-16',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Gauge angle range: from -135deg (0%) to +135deg (100%) -> Total 270 degrees
  const needleAngle = -135 + (clampedValue / 100) * 270;

  // Arc stroke dash calculations for 270 deg arc with radius = 32:
  // Circumference = 2 * PI * 32 = ~201.06
  // 270 deg arc length = 201.06 * (270/360) = 150.8
  const arcLength = 150.8;
  const filledArc = (clampedValue / 100) * arcLength;

  const getStatusColor = (val: number) => {
    if (val >= 90) return { stroke: '#10b981', fill: '#059669', glow: '#34d399' };
    if (val >= 80) return { stroke: '#f59e0b', fill: '#d97706', glow: '#fbbf24' };
    return { stroke: '#f43f5e', fill: '#e11d48', glow: '#fb7185' };
  };

  const status = getStatusColor(clampedValue);

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="avail-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="needle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Outer Glow Halo */}
      <circle cx="48" cy="48" r="42" className="fill-slate-100/50 dark:fill-slate-800/30" />

      {/* Gauge Background Track (270 deg Arc) */}
      <circle
        cx="48"
        cy="48"
        r="32"
        stroke="currentColor"
        strokeWidth="6"
        strokeDasharray={`${arcLength} ${201.06 - arcLength}`}
        strokeDashoffset="-25"
        strokeLinecap="round"
        className="text-slate-200 dark:text-slate-800"
      />

      {/* Gauge Active Filled Arc */}
      <circle
        cx="48"
        cy="48"
        r="32"
        stroke="url(#avail-arc-grad)"
        strokeWidth="6"
        strokeDasharray={`${filledArc} 201.06`}
        strokeDashoffset="-25"
        strokeLinecap="round"
        className="transition-all duration-700 ease-out drop-shadow-xs"
      />

      {/* Scale Tick Marks */}
      {/* 0% Tick */}
      <circle cx="25" cy="71" r="1.5" className="fill-rose-500" />
      {/* 50% Tick */}
      <circle cx="48" cy="16" r="1.5" className="fill-amber-500" />
      {/* 100% Tick */}
      <circle cx="71" cy="71" r="1.5" className="fill-emerald-500" />

      {/* Dial Center Hub */}
      <circle
        cx="48"
        cy="48"
        r="10"
        className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
        strokeWidth="2"
      />
      <circle cx="48" cy="48" r="6" fill={status.fill} className="transition-colors duration-500" />
      <circle cx="48" cy="48" r="2.5" className="fill-white drop-shadow-xs" />

      {/* Rotatable Needle Indicator */}
      <g
        transform={`rotate(${needleAngle} 48 48)`}
        className="transition-transform duration-700 ease-out origin-center"
      >
        <path
          d="M 46 48 L 47.5 22 L 48.5 22 L 50 48 Z"
          fill="url(#needle-grad)"
          className="drop-shadow-sm"
        />
        <polygon points="48,19 46.5,23 49.5,23" className="fill-cyan-400" />
      </g>

      {/* Small Status Glow Dot */}
      <circle cx="48" cy="80" r="2" fill={status.stroke} className="animate-ping origin-center" />
      <circle cx="48" cy="80" r="1.5" fill={status.stroke} />
    </svg>
  );
};
