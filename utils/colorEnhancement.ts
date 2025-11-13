// Color Enhancement Documentation
// Rekomendasi penggunaan palet warna yang lebih colorful namun tetap profesional

import { colors } from './designSystem';
import { getTextColor } from './typographyUtils';

// Contoh penggunaan warna accent yang lebih beragam
export const colorUsageExamples = {
  // Cards dengan gradient background
  cardVariants: {
    primary: `bg-gradient-to-r from-red-500 to-red-600 text-white`,
    ocean: `bg-gradient-to-r from-cyan-500 to-blue-500 text-white`,
    sunset: `bg-gradient-to-r from-orange-500 to-red-500 text-white`,
    forest: `bg-gradient-to-r from-green-500 to-teal-500 text-white`,
    royal: `bg-gradient-to-r from-purple-500 to-pink-500 text-white`,
  },

  // Button variants dengan warna yang lebih hidup
  buttonVariants: {
    primary: 'bg-red-500 hover:bg-red-600 text-white',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    accent: 'bg-purple-500 hover:bg-purple-600 text-white',
    creative: 'bg-pink-500 hover:bg-pink-600 text-white',
    vibrant: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },

  // Status indicators dengan warna yang lebih menarik
  statusIndicators: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
  },

  // Accent text colors untuk highlight
  accentText: {
    purple: getTextColor('accent', 'purple'),
    teal: getTextColor('accent', 'teal'),
    orange: getTextColor('accent', 'orange'),
    pink: getTextColor('accent', 'pink'),
    emerald: getTextColor('accent', 'emerald'),
    indigo: getTextColor('accent', 'indigo'),
    cyan: getTextColor('accent', 'cyan'),
  },

  // Professional color combinations
  combinations: {
    // Red + Purple (warm professional)
    warm: {
      primary: colors.primary[500],
      accent: colors.accent.purple[500],
      neutral: colors.neutral[100],
    },
    // Blue + Teal (cool professional)
    cool: {
      primary: colors.secondary[500],
      accent: colors.accent.teal[500],
      neutral: colors.neutral[50],
    },
    // Green + Emerald (nature professional)
    nature: {
      primary: colors.success[500],
      accent: colors.vibrant.emerald[500],
      neutral: colors.neutral[0],
    },
  },
};

// Guidelines penggunaan warna
export const colorGuidelines = {
  // Primary colors untuk brand elements
  brand: ['primary', 'secondary'],

  // Accent colors untuk highlights dan CTAs
  accents: ['purple', 'teal', 'emerald', 'indigo', 'cyan'],

  // Status colors untuk feedback
  status: ['success', 'warning', 'error', 'info'],

  // Neutral colors untuk backgrounds dan text
  neutrals: ['gray', 'neutral'],

  // Vibrant colors untuk special elements (use sparingly)
  vibrant: ['orange', 'pink', 'rose'],

  // Best practices
  bestPractices: {
    contrast: 'Maintain WCAG AA compliance (4.5:1 for normal text)',
    hierarchy: 'Use color to establish visual hierarchy',
    consistency: 'Apply colors consistently across components',
    accessibility: 'Ensure sufficient contrast for all users',
    moderation: 'Use vibrant colors sparingly to maintain professionalism',
  },
};
