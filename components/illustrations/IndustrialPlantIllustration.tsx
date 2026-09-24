import React from 'react';

interface IndustrialPlantIllustrationProps {
  className?: string;
}

export const IndustrialPlantIllustration: React.FC<IndustrialPlantIllustrationProps> = ({
  className = '',
}) => {
  return (
    <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 760 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_0_25px_rgba(5,150,105,0.25)]"
        aria-label="Ilustrasi Blueprint Digital Pabrik Semen Tonasa SIPOMA"
        role="img"
      >
        <defs>
          {/* Neon Emerald Gradient for Main Outlines */}
          <linearGradient id="neonEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
          </linearGradient>

          {/* Cyan Glow for Telemetry & Signal Lines */}
          <linearGradient id="cyanTelemetry" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
          </linearGradient>

          {/* Soft Fill for Tanks & Silos */}
          <linearGradient id="structureFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.03" />
          </linearGradient>

          {/* High-tech Ground Grid Gradient */}
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ========================================================================= */}
        {/* BACKGROUND BLUEPRINT GRID & AXIS MARKS */}
        {/* ========================================================================= */}
        <g opacity="0.25">
          {/* Horizontal Reference Lines */}
          <line x1="20" y1="230" x2="740" y2="230" stroke="url(#groundGrad)" strokeWidth="1.5" />
          <line
            x1="40"
            y1="180"
            x2="720"
            y2="180"
            stroke="#10b981"
            strokeWidth="0.75"
            strokeDasharray="4 6"
          />
          <line
            x1="60"
            y1="110"
            x2="700"
            y2="110"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="3 8"
          />

          {/* Vertical Grid Ticks */}
          <line
            x1="120"
            y1="40"
            x2="120"
            y2="235"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
          <line
            x1="260"
            y1="30"
            x2="260"
            y2="235"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
          <line
            x1="450"
            y1="60"
            x2="450"
            y2="235"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
          <line
            x1="620"
            y1="40"
            x2="620"
            y2="235"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
        </g>

        {/* HUD Data Labels */}
        <g opacity="0.6" className="text-[9px] font-mono tracking-wider fill-emerald-300">
          <text x="35" y="32">
            UNIT 04 // ROTARY KILN SYSTEM
          </text>
          <text x="590" y="32" textAnchor="end">
            DIGITAL TWIN // REAL-TIME
          </text>
          <circle cx="25" cy="29" r="3" fill="#10b981" />
        </g>

        {/* ========================================================================= */}
        {/* SECTION 1: RAW MEAL & HOMOGENIZING SILOS (LEFT) */}
        {/* ========================================================================= */}
        <g>
          {/* Silo 1 Body */}
          <rect
            x="50"
            y="90"
            width="55"
            height="135"
            rx="3"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.2"
          />
          {/* Silo 1 Roof Cone */}
          <polygon
            points="50,90 77.5,70 105,90"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.2"
          />
          {/* Silo 1 Internal Level / Rings */}
          <line
            x1="50"
            y1="120"
            x2="105"
            y2="120"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <line
            x1="50"
            y1="150"
            x2="105"
            y2="150"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <line
            x1="50"
            y1="180"
            x2="105"
            y2="180"
            stroke="#34d399"
            strokeWidth="0.75"
            opacity="0.4"
          />
          {/* Silo 1 Bottom Discharge Hopper */}
          <polygon
            points="62,225 77.5,235 93,225"
            stroke="url(#neonEmerald)"
            strokeWidth="1"
            fill="none"
          />

          {/* Raw Material Conveyor Bridge into Preheater */}
          <path
            d="M 105 105 L 210 50"
            stroke="url(#cyanTelemetry)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </g>

        {/* ========================================================================= */}
        {/* SECTION 2: SUSPENSION PREHEATER & CALCINER TOWER (CENTER-LEFT) */}
        {/* ========================================================================= */}
        <g>
          {/* Structural Frame Tower (5 Stages) */}
          {/* Tower Outline */}
          <polygon
            points="210,35 270,35 285,225 195,225"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.5"
          />

          {/* Tower Floors & Cross Bracing */}
          <line x1="207" y1="75" x2="273" y2="75" stroke="#10b981" strokeWidth="1" opacity="0.7" />
          <line
            x1="204"
            y1="115"
            x2="276"
            y2="115"
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.7"
          />
          <line
            x1="201"
            y1="155"
            x2="279"
            y2="155"
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.7"
          />
          <line
            x1="198"
            y1="195"
            x2="282"
            y2="195"
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Diagonal Bracings */}
          <line
            x1="210"
            y1="35"
            x2="273"
            y2="75"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <line
            x1="270"
            y1="35"
            x2="207"
            y2="75"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <line
            x1="207"
            y1="75"
            x2="276"
            y2="115"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <line
            x1="273"
            y1="75"
            x2="204"
            y2="115"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <line
            x1="204"
            y1="115"
            x2="279"
            y2="155"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />
          <line
            x1="276"
            y1="115"
            x2="201"
            y2="155"
            stroke="#10b981"
            strokeWidth="0.75"
            opacity="0.4"
          />

          {/* Preheater Cyclones (Icons within tower) */}
          {/* Cyclone Top */}
          <path
            d="M 230 45 L 250 45 L 246 62 L 240 70 L 234 62 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#34d399"
            strokeWidth="1"
          />
          {/* Cyclone Mid-1 */}
          <path
            d="M 220 85 L 240 85 L 236 102 L 230 110 L 224 102 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#34d399"
            strokeWidth="1"
          />
          {/* Cyclone Mid-2 */}
          <path
            d="M 242 85 L 262 85 L 258 102 L 252 110 L 246 102 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#34d399"
            strokeWidth="1"
          />
          {/* Cyclone Stage 4 */}
          <path
            d="M 222 125 L 244 125 L 240 142 L 233 150 L 226 142 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#34d399"
            strokeWidth="1"
          />
          {/* Cyclone Stage 5 (Calciner Feed) */}
          <path
            d="M 240 165 L 264 165 L 260 182 L 252 190 L 244 182 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#34d399"
            strokeWidth="1"
          />

          {/* Preheater Exhaust Duct / Chimney */}
          <path
            d="M 240 35 L 240 15 L 160 15 L 160 120"
            stroke="url(#cyanTelemetry)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.7"
          />
          {/* Emission Stack */}
          <polygon
            points="152,70 168,70 172,225 148,225"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>

        {/* ========================================================================= */}
        {/* SECTION 3: ROTARY KILN (TANUR PUTAR - CENTER TO RIGHT) */}
        {/* ========================================================================= */}
        <g>
          {/* Kiln Feed Chamber / Smoke Chamber Connection */}
          <rect
            x="275"
            y="175"
            width="22"
            height="42"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.2"
          />

          {/* Rotary Kiln Main Shell (Inclined Angle: ~3.5%) */}
          {/* Kiln Body Tube */}
          <polygon
            points="295,186 505,202 505,220 295,204"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.8"
          />

          {/* Kiln Axis Line with animated telemetry flow */}
          <line
            x1="297"
            y1="195"
            x2="503"
            y2="211"
            stroke="url(#cyanTelemetry)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-40"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </line>

          {/* Kiln Riding Rings / Tires (Roller Supports) */}
          {/* Pier 1 (Inlet) */}
          <rect
            x="335"
            y="187"
            width="10"
            height="21"
            rx="2"
            fill="#047857"
            stroke="#34d399"
            strokeWidth="1.2"
          />
          <polygon
            points="332,208 348,208 352,230 328,230"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1"
          />

          {/* Pier 2 (Main Drive Gear - Girth Gear) */}
          <rect
            x="395"
            y="192"
            width="14"
            height="21"
            rx="2"
            fill="#047857"
            stroke="#34d399"
            strokeWidth="1.2"
          />
          <line
            x1="402"
            y1="192"
            x2="402"
            y2="213"
            stroke="#6ee7b7"
            strokeWidth="1"
            strokeDasharray="1 2"
          />
          <polygon
            points="392,213 412,213 416,230 388,230"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1"
          />

          {/* Pier 3 (Outlet / Burning Zone) */}
          <rect
            x="460"
            y="197"
            width="10"
            height="21"
            rx="2"
            fill="#047857"
            stroke="#34d399"
            strokeWidth="1.2"
          />
          <polygon
            points="457,218 473,218 477,230 453,230"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1"
          />

          {/* Kiln Hood / Burner Pipe End */}
          <path
            d="M 505 190 L 530 190 L 530 226 L 505 226 Z"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.4"
          />
          {/* Flame / Sintering Zone Indicator (Subtle Amber/Emerald Glow) */}
          <circle cx="485" cy="209" r="4" fill="#fbbf24" opacity="0.8">
            <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* ========================================================================= */}
        {/* SECTION 4: CLINKER COOLER & CEMENT SILOS (RIGHT) */}
        {/* ========================================================================= */}
        <g>
          {/* Grate Cooler Building */}
          <polygon
            points="525,200 580,200 585,230 525,230"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.2"
          />
          {/* Cooler Exhaust Fans / Ducts */}
          <line x1="540" y1="200" x2="540" y2="185" stroke="#34d399" strokeWidth="1" />
          <line x1="560" y1="200" x2="560" y2="185" stroke="#34d399" strokeWidth="1" />

          {/* Clinker Pan Conveyor to Silos */}
          <path
            d="M 580 215 L 610 135"
            stroke="url(#cyanTelemetry)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Clinker / Finished Product Silo 1 */}
          <rect
            x="610"
            y="110"
            width="50"
            height="115"
            rx="3"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.3"
          />
          <polygon
            points="610,110 635,95 660,110"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.3"
          />
          <line
            x1="610"
            y1="140"
            x2="660"
            y2="140"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.5"
          />
          <line
            x1="610"
            y1="170"
            x2="660"
            y2="170"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* Clinker / Finished Product Silo 2 (Twin Silo) */}
          <rect
            x="668"
            y="110"
            width="50"
            height="115"
            rx="3"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.3"
          />
          <polygon
            points="668,110 693,95 718,110"
            fill="url(#structureFill)"
            stroke="url(#neonEmerald)"
            strokeWidth="1.3"
          />
          <line
            x1="668"
            y1="140"
            x2="718"
            y2="140"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.5"
          />
          <line
            x1="668"
            y1="170"
            x2="718"
            y2="170"
            stroke="#34d399"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* Overhead Distribution Gallery */}
          <line x1="600" y1="95" x2="728" y2="95" stroke="#34d399" strokeWidth="1.5" />
        </g>

        {/* ========================================================================= */}
        {/* SECTION 5: DIGITAL TELEMETRY HUD NODES & REAL-TIME PULSE BEACONS */}
        {/* ========================================================================= */}
        {/* Telemetry Node 1: Preheater Top (Inlet Stage) */}
        <g transform="translate(240, 45)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6">
            <animate attributeName="r" values="3;12;3" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="3.5" fill="#38bdf8" filter="url(#vectorGlow)" />
          {/* Data Tag Callout */}
          <path
            d="M 0 0 L 15 -18 L 45 -18"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <text x="48" y="-15" fill="#7dd3fc" fontSize="8" fontFamily="monospace" opacity="0.9">
            STAGE-1 T: 320°C
          </text>
        </g>

        {/* Telemetry Node 2: Burning Zone Temperature */}
        <g transform="translate(485, 209)">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.6">
            <animate attributeName="r" values="4;14;4" dur="2.2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.9;0;0.9"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="0" cy="0" r="4" fill="#10b981" filter="url(#vectorGlow)" />
          {/* Data Tag Callout */}
          <path
            d="M 0 0 L -15 28 L -55 28"
            fill="none"
            stroke="#10b981"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <text
            x="-58"
            y="25"
            textAnchor="end"
            fill="#6ee7b7"
            fontSize="8"
            fontFamily="monospace"
            opacity="0.9"
          >
            KILN BZ: 1450°C
          </text>
        </g>

        {/* Telemetry Node 3: Silo Inventory Level */}
        <g transform="translate(635, 95)">
          <circle cx="0" cy="0" r="7" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.5">
            <animate attributeName="r" values="3;10;3" dur="2.8s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.7;0;0.7"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="0" cy="0" r="3" fill="#38bdf8" />
          {/* Data Tag Callout */}
          <path
            d="M 0 0 L 15 -15 L 50 -15"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <text x="53" y="-12" fill="#7dd3fc" fontSize="8" fontFamily="monospace" opacity="0.9">
            SILO: 92% FULL
          </text>
        </g>

        {/* Coordinate & Plant Identity Watermark */}
        <g opacity="0.4" className="text-[8px] font-mono fill-emerald-400">
          <text x="35" y="250">
            LAT: -4.7891° S | LON: 119.5932° E | BUNGORO, PANGKEP
          </text>
          <text x="725" y="250" textAnchor="end">
            SEMEN TONASA DIGITAL ASSET
          </text>
        </g>
      </svg>
    </div>
  );
};

export default IndustrialPlantIllustration;
