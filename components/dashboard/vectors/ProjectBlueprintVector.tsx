import React from 'react';

interface ProjectBlueprintVectorProps {
  className?: string;
}

export const ProjectBlueprintVector: React.FC<ProjectBlueprintVectorProps> = ({
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
        <linearGradient id="blueprint-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="blueprint-accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Ambient Halo */}
      <circle cx="48" cy="48" r="42" className="fill-indigo-500/10 dark:fill-indigo-950/30" />

      {/* Blueprint Drawing Board */}
      <rect
        x="18"
        y="20"
        width="60"
        height="56"
        rx="6"
        className="fill-slate-800 dark:fill-slate-900 stroke-indigo-400 dark:stroke-indigo-500 drop-shadow-sm"
        strokeWidth="2"
      />

      {/* Blueprint Grid Lines */}
      <line
        x1="18"
        y1="34"
        x2="78"
        y2="34"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="18"
        y1="48"
        x2="78"
        y2="48"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="18"
        y1="62"
        x2="78"
        y2="62"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="33"
        y1="20"
        x2="33"
        y2="76"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="48"
        y1="20"
        x2="48"
        y2="76"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="63"
        y1="20"
        x2="63"
        y2="76"
        className="stroke-indigo-500/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      {/* Project Workflow Path & Milestone Nodes */}
      <path
        d="M 28 60 L 42 42 L 56 50 L 68 32"
        fill="none"
        stroke="url(#blueprint-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Milestone Nodes */}
      <circle
        cx="28"
        cy="60"
        r="3.5"
        className="fill-emerald-400 stroke-slate-900"
        strokeWidth="1.5"
      />
      <circle
        cx="42"
        cy="42"
        r="3.5"
        className="fill-cyan-400 stroke-slate-900"
        strokeWidth="1.5"
      />
      <circle
        cx="56"
        cy="50"
        r="3.5"
        className="fill-amber-400 stroke-slate-900"
        strokeWidth="1.5"
      />
      <circle cx="68" cy="32" r="4" className="fill-indigo-400 stroke-white" strokeWidth="1.5" />
      <circle cx="68" cy="32" r="2" className="fill-white" />

      {/* Drafting Compass / Caliper Tool Overlay */}
      <g transform="translate(44, 26) rotate(25)">
        <line
          x1="0"
          y1="0"
          x2="-8"
          y2="22"
          className="stroke-slate-300 dark:stroke-slate-400"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="8"
          y2="22"
          className="stroke-slate-300 dark:stroke-slate-400"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="0" cy="0" r="2.5" className="fill-amber-400 stroke-slate-700" strokeWidth="1" />
      </g>
    </svg>
  );
};
