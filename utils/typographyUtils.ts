/**
 * Typography Utilities untuk konsistensi warna font dan keterbacaan
 * Mengikuti WCAG contrast ratio guidelines
 */

import { designSystem } from './designSystem';

// Typography color tokens untuk konsistensi
export const typographyColors = {
  // Primary text colors (high contrast)
  primary: {
    light: 'text-slate-900', // #0f172a - 21:1 contrast on white
    dark: 'text-slate-100', // #f1f5f9 - 19.2:1 contrast on dark
  },

  // Secondary text colors (medium contrast)
  secondary: {
    light: 'text-slate-600', // #475569 - 8.6:1 contrast on white
    dark: 'text-slate-400', // #94a3b8 - 8.9:1 contrast on dark
  },

  // Tertiary text colors (low contrast, use sparingly)
  tertiary: {
    light: 'text-slate-500', // #64748b - 6.1:1 contrast on white
    dark: 'text-slate-500', // #64748b - 6.8:1 contrast on dark
  },

  // Accent colors (for highlights, links, etc.)
  accent: {
    primary: {
      light: 'text-red-600', // #dc2626 - 5.2:1 contrast on white
      dark: 'text-red-400', // #f87171 - 4.6:1 contrast on dark
    },
    success: {
      light: 'text-green-700', // #15803d - 5.9:1 contrast on white
      dark: 'text-green-400', // #4ade80 - 5.1:1 contrast on dark
    },
    warning: {
      light: 'text-amber-700', // #b45309 - 4.7:1 contrast on white
      dark: 'text-amber-400', // #fbbf24 - 4.3:1 contrast on dark
    },
    error: {
      light: 'text-red-700', // #b91c1c - 5.9:1 contrast on white
      dark: 'text-red-400', // #f87171 - 4.6:1 contrast on dark
    },
  },

  // Interactive states
  interactive: {
    link: {
      default: {
        light: 'text-red-600 hover:text-red-700',
        dark: 'text-red-400 hover:text-red-300',
      },
      visited: {
        light: 'text-red-800',
        dark: 'text-red-500',
      },
    },
    button: {
      primary: 'text-white',
      secondary: {
        light: 'text-slate-900',
        dark: 'text-slate-100',
      },
      ghost: {
        light: 'text-slate-700 hover:text-slate-900',
        dark: 'text-slate-300 hover:text-slate-100',
      },
    },
  },

  // Status text
  status: {
    success: {
      light: 'text-green-800',
      dark: 'text-green-300',
    },
    warning: {
      light: 'text-amber-800',
      dark: 'text-amber-300',
    },
    error: {
      light: 'text-red-800',
      dark: 'text-red-300',
    },
    info: {
      light: 'text-blue-800',
      dark: 'text-blue-300',
    },
  },

  // White text variations for dark backgrounds
  white: {
    pure: 'text-white',
    high: 'text-white', // 21:1 contrast
    medium: 'text-white/90', // ~16:1 contrast
    low: 'text-white/70', // ~9:1 contrast
    subtle: 'text-white/50', // ~5:1 contrast
  },
};

// Typography scale utilities dengan optimasi readability
export const typographyScale = {
  // Headings - optimized line heights untuk better visual hierarchy
  h1: 'text-3xl font-bold tracking-tight leading-tight', // 1.25 line-height
  h2: 'text-2xl font-semibold tracking-tight leading-tight', // 1.25 line-height
  h3: 'text-xl font-semibold leading-snug', // 1.375 line-height
  h4: 'text-lg font-semibold leading-snug', // 1.375 line-height
  h5: 'text-base font-semibold leading-snug', // 1.375 line-height
  h6: 'text-sm font-semibold uppercase tracking-wide leading-tight', // 1.25 line-height

  // Body text - improved line heights untuk better readability
  body: {
    large: 'text-lg leading-relaxed font-normal', // 1.625 line-height
    base: 'text-base leading-relaxed font-normal', // 1.625 line-height
    small: 'text-sm leading-6 font-normal', // 1.5 line-height
    xs: 'text-xs leading-5 font-normal', // 1.25 line-height (compact untuk UI elements)
  },

  // UI text - optimized untuk interface elements
  ui: {
    label: 'text-sm font-medium leading-5', // 1.25 line-height untuk labels
    caption: 'text-xs text-slate-500 dark:text-slate-400 leading-4', // 1rem line-height
    overline: 'text-xs uppercase tracking-wider font-semibold leading-4', // 1rem line-height
  },

  // Responsive typography scales
  responsive: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg lg:text-xl font-semibold leading-snug',
    h5: 'text-sm sm:text-base lg:text-lg font-semibold leading-snug',
    h6: 'text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-wide leading-tight',
    body: {
      large: 'text-base sm:text-lg lg:text-xl leading-relaxed font-normal',
      base: 'text-sm sm:text-base lg:text-lg leading-relaxed font-normal',
      small: 'text-xs sm:text-sm lg:text-base leading-6 font-normal',
      xs: 'text-xs sm:text-sm leading-5 font-normal',
    },
    ui: {
      label: 'text-xs sm:text-sm lg:text-base font-medium leading-5',
      caption: 'text-xs sm:text-sm leading-4 text-slate-500 dark:text-slate-400',
      overline: 'text-xs sm:text-sm uppercase tracking-wider font-semibold leading-4',
    },
  },

  // Data/Mono text - untuk tables dan code
  data: {
    table: 'text-sm font-mono leading-5', // Monospace untuk data tables
    code: 'text-sm font-mono leading-6', // Monospace untuk code snippets
  },
};

// Utility functions untuk mendapatkan class yang tepat
export const getTextColor = (
  variant: keyof typeof typographyColors,
  subVariant?: string,
  theme: 'light' | 'dark' = 'light'
): string => {
  const colorGroup = typographyColors[variant];

  if (typeof colorGroup === 'string') {
    return colorGroup;
  }

  if (subVariant && typeof colorGroup === 'object') {
    const subGroup = (colorGroup as any)[subVariant];
    if (typeof subGroup === 'string') {
      return subGroup;
    }
    if (subGroup && typeof subGroup === 'object' && subGroup[theme]) {
      return subGroup[theme];
    }
  }

  // Fallback
  return theme === 'light' ? 'text-slate-900' : 'text-slate-100';
};

export const getHeadingClasses = (
  level: 1 | 2 | 3 | 4 | 5 | 6,
  color: 'primary' | 'secondary' = 'primary',
  theme: 'light' | 'dark' = 'light'
): string => {
  const scale = `h${level}` as keyof typeof typographyScale;
  const baseClasses = (typographyScale as any)[scale];
  const colorClasses = getTextColor(color, undefined, theme);

  return `${baseClasses} ${colorClasses}`;
};

export const getBodyClasses = (
  size: 'large' | 'base' | 'small' | 'xs' = 'base',
  color: 'primary' | 'secondary' | 'tertiary' = 'primary',
  theme: 'light' | 'dark' = 'light'
): string => {
  const baseClasses = typographyScale.body[size];
  const colorClasses = getTextColor(color, undefined, theme);

  return `${baseClasses} ${colorClasses}`;
};

export const getLinkClasses = (
  state: 'default' | 'visited' = 'default',
  theme: 'light' | 'dark' = 'light'
): string => {
  return getTextColor('interactive', `link.${state}`, theme);
};

export const getStatusClasses = (
  status: 'success' | 'warning' | 'error' | 'info',
  theme: 'light' | 'dark' = 'light'
): string => {
  return getTextColor('status', status, theme);
};

export const getDataClasses = (
  type: 'table' | 'code' = 'table',
  theme: 'light' | 'dark' = 'light'
): string => {
  const baseClasses = typographyScale.data[type];
  const colorClasses = getTextColor('primary', undefined, theme);

  return `${baseClasses} ${colorClasses}`;
};

export const getUILabelClasses = (
  type: 'label' | 'caption' | 'overline' = 'label',
  theme: 'light' | 'dark' = 'light'
): string => {
  const baseClasses = typographyScale.ui[type];
  // UI elements sudah include color classes, tapi kita bisa override jika perlu
  return baseClasses;
};

// Contrast validation utilities
export const validateContrast = (foreground: string, background: string): boolean => {
  // Simple contrast validation - in production, use a proper contrast checker
  const highContrastPairs = [
    ['text-slate-900', 'bg-white'],
    ['text-slate-100', 'bg-slate-900'],
    ['text-white', 'bg-slate-900'],
    ['text-red-600', 'bg-white'],
    ['text-red-400', 'bg-slate-900'],
  ];

  const mediumContrastPairs = [
    ['text-slate-600', 'bg-white'],
    ['text-slate-400', 'bg-slate-900'],
    ['text-slate-500', 'bg-white'],
  ];

  const pair = [foreground, background];
  return (
    highContrastPairs.some((highPair) => highPair[0] === pair[0] && highPair[1] === pair[1]) ||
    mediumContrastPairs.some((mediumPair) => mediumPair[0] === pair[0] && mediumPair[1] === pair[1])
  );
};
