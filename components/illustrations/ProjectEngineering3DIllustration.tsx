import React from 'react';

interface ProjectEngineering3DIllustrationProps {
  variant?: 'hero' | 'showcase' | 'compact';
  className?: string;
}

/**
 * ProjectEngineering3DIllustration
 * Ilustrasi Vektor Isometrik 3D Digital Engineering & Project Construction SIPOMA.
 * Menampilkan Tower Crane digital, Scaffolding/Struktur Pabrik Isometrik,
 * Floating Milestone Cubes bergradien industri (Emerald, Cyan, Indigo, Amber),
 * serta Blueprint Grid 3D futuristik.
 */
export const ProjectEngineering3DIllustration: React.FC<ProjectEngineering3DIllustrationProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <div
      className={`relative select-none pointer-events-none transition-all duration-300 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 520 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_12px_36px_rgba(5,150,105,0.18)]"
        role="img"
        aria-label="Ilustrasi Vektor Isometrik 3D Manajemen Proyek Engineering SIPOMA"
      >
        <defs>
          {/* Gradients for Isometric Cube 1 - Emerald (Physical Accomplishment) */}
          <linearGradient id="cubeEmeraldTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="cubeEmeraldRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="cubeEmeraldLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>

          {/* Gradients for Isometric Cube 2 - Cyan (Engineering & Telemetry) */}
          <linearGradient id="cubeCyanTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="cubeCyanRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="cubeCyanLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>

          {/* Gradients for Isometric Cube 3 - Indigo (Schedule & Milestones) */}
          <linearGradient id="cubeIndigoTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="cubeIndigoRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id="cubeIndigoLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>

          {/* Gradients for Isometric Cube 4 - Amber (Quality & Delivery) */}
          <linearGradient id="cubeAmberTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="cubeAmberRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="cubeAmberLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Isometric Structural Beam Gradient */}
          <linearGradient id="structureBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
          </linearGradient>

          {/* Foundation Slab Gradients */}
          <linearGradient id="slabTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="slabSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Holographic Glowing Base Grid */}
          <linearGradient id="holoGrid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
          </linearGradient>

          {/* Soft Blur Filter for Ambient Shadows */}
          <filter id="ambientShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================================================================= */}
        {/* 1. ISOMETRIC BASE GROUND & HOLOGRAPHIC BLUEPRINT GRID */}
        {/* ========================================================================= */}
        <g id="ground-grid" opacity={isHero ? '0.75' : '0.9'}>
          {/* Base Ambient Shadow */}
          <ellipse
            cx="260"
            cy="310"
            rx="210"
            ry="65"
            fill="black"
            opacity="0.45"
            filter="url(#ambientShadow)"
          />

          {/* Isometric Base Foundation Slab (Main Platform) */}
          <path
            d="M 260 250 L 440 310 L 260 370 L 80 310 Z"
            fill="url(#slabTop)"
            stroke="url(#holoGrid)"
            strokeWidth="1.5"
          />
          {/* Slab Front Left Edge */}
          <path
            d="M 80 310 L 260 370 L 260 380 L 80 320 Z"
            fill="url(#slabSide)"
            stroke="#10b981"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
          {/* Slab Front Right Edge */}
          <path
            d="M 260 370 L 440 310 L 440 320 L 260 380 Z"
            fill="#051525"
            stroke="#0ea5e9"
            strokeOpacity="0.3"
            strokeWidth="1"
          />

          {/* Inner Isometric Grid Lines (30° Angle) */}
          <g stroke="#38bdf8" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="3 4">
            <line x1="125" y1="295" x2="305" y2="355" />
            <line x1="170" y1="280" x2="350" y2="340" />
            <line x1="215" y1="265" x2="395" y2="325" />

            <line x1="395" y1="295" x2="215" y2="355" />
            <line x1="350" y1="280" x2="170" y2="340" />
            <line x1="305" y1="265" x2="125" y2="325" />
          </g>

          {/* Concentric Telemetry Radar Ring on Slab */}
          <ellipse
            cx="260"
            cy="310"
            rx="95"
            ry="32"
            fill="none"
            stroke="#10b981"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <ellipse
            cx="260"
            cy="310"
            rx="50"
            ry="18"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
        </g>

        {/* ========================================================================= */}
        {/* 2. 3D STRUCTURAL INDUSTRIAL COLUMNS & ELEVATION TRUSSES */}
        {/* ========================================================================= */}
        <g id="structural-framework" opacity="0.95">
          {/* Structural Pillar 1 (Left Rear) */}
          <path d="M 155 240 L 170 245 L 170 170 L 155 165 Z" fill="#1e293b" opacity="0.8" />
          <path d="M 170 245 L 185 240 L 185 165 L 170 170 Z" fill="#334155" opacity="0.9" />

          {/* Structural Pillar 2 (Right Rear) */}
          <path d="M 335 240 L 350 245 L 350 170 L 335 165 Z" fill="#1e293b" opacity="0.8" />
          <path d="M 350 245 L 365 240 L 365 165 L 350 170 Z" fill="#334155" opacity="0.9" />

          {/* Cross Bracing Beams (Isometric Scaffolding Lattice) */}
          <g stroke="url(#structureBeam)" strokeWidth="1.75" strokeLinecap="round">
            <line x1="170" y1="170" x2="260" y2="200" />
            <line x1="260" y1="200" x2="350" y2="170" />
            <line x1="170" y1="210" x2="260" y2="240" strokeDasharray="4 3" />
            <line x1="260" y1="240" x2="350" y2="210" strokeDasharray="4 3" />

            {/* Vertical Support Posts */}
            <line x1="260" y1="200" x2="260" y2="305" stroke="#10b981" strokeWidth="2" />
          </g>

          {/* Level Platform Slab (Elevated 3D Mezzanine) */}
          <path
            d="M 260 175 L 325 197 L 260 219 L 195 197 Z"
            fill="url(#cubeEmeraldLeft)"
            stroke="#34d399"
            strokeWidth="1.2"
            opacity="0.65"
          />
        </g>

        {/* ========================================================================= */}
        {/* 3. 3D ISOMETRIC TOWER CRANE (ICONIC PROJECT MANAGEMENT SYMBOL) */}
        {/* ========================================================================= */}
        <g id="tower-crane" filter="url(#neonGlow)">
          {/* Main Crane Mast (Vertical Lattice Tower) */}
          {/* Tower Footing Base */}
          <path
            d="M 360 290 L 385 298 L 385 105 L 360 97 Z"
            fill="#0f172a"
            stroke="#10b981"
            strokeWidth="1"
          />
          <path
            d="M 385 298 L 410 290 L 410 97 L 385 105 Z"
            fill="#1e293b"
            stroke="#059669"
            strokeWidth="1"
          />

          {/* Tower Cross Bracings (Diagonal X lattice) */}
          <g stroke="#10b981" strokeWidth="1.2" opacity="0.85">
            <line x1="360" y1="290" x2="385" y2="260" />
            <line x1="385" y1="298" x2="360" y2="252" />
            <line x1="360" y1="252" x2="385" y2="222" />
            <line x1="385" y1="260" x2="360" y2="214" />
            <line x1="360" y1="214" x2="385" y2="184" />
            <line x1="385" y1="222" x2="360" y2="176" />
            <line x1="360" y1="176" x2="385" y2="146" />
            <line x1="385" y1="184" x2="360" y2="138" />
            <line x1="360" y1="138" x2="385" y2="108" />
            <line x1="385" y1="146" x2="360" y2="100" />
          </g>

          {/* Operator Cabin (Sleek Glass Polygon) */}
          <polygon
            points="352,90 376,98 376,112 352,104"
            fill="#0284c7"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            opacity="0.9"
          />

          {/* Slewing Unit / Crane Top Pyramid */}
          <polygon points="385,100 385,60 372,92" fill="#38bdf8" opacity="0.9" />
          <polygon points="385,100 385,60 398,92" fill="#0284c7" opacity="0.9" />

          {/* Main Horizontal Jib (Reaching to the left across project site) */}
          <g stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
            {/* Top chord */}
            <line x1="435" y1="108" x2="160" y2="40" />
            {/* Bottom chord */}
            <line x1="435" y1="116" x2="160" y2="48" />
          </g>

          {/* Crane Suspension Tie Ropes (Tension Cables) */}
          <line
            x1="385"
            y1="60"
            x2="190"
            y2="44"
            stroke="#a5b4fc"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          <line
            x1="385"
            y1="60"
            x2="430"
            y2="108"
            stroke="#a5b4fc"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />

          {/* Counterweight Block on Right Jib */}
          <polygon
            points="420,105 440,111 440,123 420,117"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="1"
          />

          {/* Trolley on Jib */}
          <rect
            x="238"
            y="58"
            width="16"
            height="8"
            rx="2"
            fill="#10b981"
            stroke="#34d399"
            strokeWidth="1"
          />

          {/* Hoist Cable hanging down to lift block */}
          <line
            x1="246"
            y1="66"
            x2="246"
            y2="120"
            stroke="#f1f5f9"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          {/* Hoist Hook */}
          <path
            d="M 246 120 L 246 126 A 4 4 0 0 1 242 130"
            stroke="#fbbf24"
            strokeWidth="1.8"
            fill="none"
          />
        </g>

        {/* ========================================================================= */}
        {/* 4. SUSPENDED & FLOATING 3D ISOMETRIC MILESTONE CUBES */}
        {/* ========================================================================= */}
        {/* Cube 1: Hanging Emerald Milestone Cube (Physical Accomplishment 100%) */}
        <g id="suspended-emerald-cube" className="transition-transform duration-700">
          {/* Top Face */}
          <polygon
            points="246,130 274,142 246,154 218,142"
            fill="url(#cubeEmeraldTop)"
            stroke="#6ee7b7"
            strokeWidth="1"
          />
          {/* Left Face */}
          <polygon
            points="218,142 246,154 246,186 218,174"
            fill="url(#cubeEmeraldLeft)"
            stroke="#059669"
            strokeWidth="1"
          />
          {/* Right Face */}
          <polygon
            points="246,154 274,142 274,174 246,186"
            fill="url(#cubeEmeraldRight)"
            stroke="#047857"
            strokeWidth="1"
          />
          {/* Telemetry Icon / Pulse Inside Top Face */}
          <circle cx="246" cy="142" r="3.5" fill="#ffffff" />
          {/* Hologram Projector Beam down to ground */}
          <line
            x1="246"
            y1="186"
            x2="246"
            y2="280"
            stroke="#34d399"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        </g>

        {/* Cube 2: Floating Cyan Milestone Cube (Engineering & Telemetry) */}
        <g id="floating-cyan-cube">
          {/* Ground Shadow */}
          <ellipse
            cx="140"
            cy="275"
            rx="24"
            ry="8"
            fill="black"
            opacity="0.3"
            filter="url(#ambientShadow)"
          />
          {/* Top Face */}
          <polygon
            points="140,200 165,211 140,222 115,211"
            fill="url(#cubeCyanTop)"
            stroke="#bae6fd"
            strokeWidth="1"
          />
          {/* Left Face */}
          <polygon
            points="115,211 140,222 140,248 115,237"
            fill="url(#cubeCyanLeft)"
            stroke="#0284c7"
            strokeWidth="1"
          />
          {/* Right Face */}
          <polygon
            points="140,222 165,211 165,237 140,248"
            fill="url(#cubeCyanRight)"
            stroke="#0369a1"
            strokeWidth="1"
          />
        </g>

        {/* Cube 3: Floating Indigo Milestone Cube (Schedule & WBS Planning) */}
        <g id="floating-indigo-cube">
          {/* Ground Shadow */}
          <ellipse
            cx="320"
            cy="310"
            rx="28"
            ry="9"
            fill="black"
            opacity="0.3"
            filter="url(#ambientShadow)"
          />
          {/* Top Face */}
          <polygon
            points="320,230 350,243 320,256 290,243"
            fill="url(#cubeIndigoTop)"
            stroke="#c7d2fe"
            strokeWidth="1"
          />
          {/* Left Face */}
          <polygon
            points="290,243 320,256 320,286 290,273"
            fill="url(#cubeIndigoLeft)"
            stroke="#4f46e5"
            strokeWidth="1"
          />
          {/* Right Face */}
          <polygon
            points="320,256 350,243 350,273 320,286"
            fill="url(#cubeIndigoRight)"
            stroke="#3730a3"
            strokeWidth="1"
          />
        </g>

        {/* Cube 4: Floating Amber Milestone Cube (Quality & Commissioning) */}
        <g id="floating-amber-cube">
          {/* Top Face */}
          <polygon
            points="200,240 222,250 200,260 178,250"
            fill="url(#cubeAmberTop)"
            stroke="#fef08a"
            strokeWidth="1"
          />
          {/* Left Face */}
          <polygon
            points="178,250 200,260 200,280 178,270"
            fill="url(#cubeAmberLeft)"
            stroke="#d97706"
            strokeWidth="1"
          />
          {/* Right Face */}
          <polygon
            points="200,260 222,250 222,270 200,280"
            fill="url(#cubeAmberRight)"
            stroke="#b45309"
            strokeWidth="1"
          />
        </g>

        {/* ========================================================================= */}
        {/* 5. DYNAMIC DATA NODES & ISOMETRIC METRIC CONNECTORS */}
        {/* ========================================================================= */}
        <g id="telemetry-nodes">
          {/* Connecting Cyan Vector Line */}
          <path
            d="M 140 211 L 246 142 L 320 243"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Node Rings */}
          <circle
            cx="140"
            cy="211"
            r="5"
            fill="#38bdf8"
            fillOpacity="0.4"
            stroke="#7dd3fc"
            strokeWidth="1.5"
          />
          <circle
            cx="320"
            cy="243"
            r="5"
            fill="#818cf8"
            fillOpacity="0.4"
            stroke="#c7d2fe"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="250"
            r="4"
            fill="#fbbf24"
            fillOpacity="0.4"
            stroke="#fef08a"
            strokeWidth="1.5"
          />

          {/* Beacon Pulses */}
          <circle cx="385" cy="60" r="3" fill="#f43f5e">
            <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="40" r="3" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Floating Data Badge 3D */}
        {!isCompact && (
          <g id="floating-badge">
            <rect
              x="60"
              y="110"
              width="104"
              height="36"
              rx="10"
              fill="#0f172a"
              fillOpacity="0.85"
              stroke="#10b981"
              strokeWidth="1.2"
              filter="url(#ambientShadow)"
            />
            <circle cx="76" cy="128" r="4" fill="#10b981">
              <animate attributeName="r" values="3.5;5;3.5" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <text
              x="88"
              y="124"
              fill="#94a3b8"
              fontSize="8"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              WBS MILESTONE
            </text>
            <text
              x="88"
              y="136"
              fill="#34d399"
              fontSize="10"
              fontWeight="900"
              fontFamily="monospace"
            >
              98.5% CAD/BIM
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default ProjectEngineering3DIllustration;
