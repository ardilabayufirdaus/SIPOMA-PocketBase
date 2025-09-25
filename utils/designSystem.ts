// Design Tokens for SIPOMA Application
// Comprehensive design system for colors, typography, spacing, and components

export const colors = {
  // Primary Brand Colors (Red theme for SIPOMA)
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Primary red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Secondary Colors (Blue)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Status Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutral Gray Scale (Comprehensive)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Extended neutral for better accessibility
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
};

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
};

export const spacing = {
  // Spacing Scale (8pt grid system - rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  glow: '0 0 20px rgba(239, 68, 68, 0.3)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
};

export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
};

// Component Variants - Comprehensive Design System
export const componentVariants = {
  // Button Component
  button: {
    sizes: {
      xs: {
        height: '2rem', // 32px
        paddingX: spacing[2],
        paddingY: spacing[1],
        fontSize: typography.fontSize.xs,
        borderRadius: borderRadius.sm,
        iconSize: '0.75rem',
      },
      sm: {
        height: '2.25rem', // 36px
        paddingX: spacing[3],
        paddingY: spacing[1.5],
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.base,
        iconSize: '0.875rem',
      },
      base: {
        height: '2.5rem', // 40px
        paddingX: spacing[4],
        paddingY: spacing[2],
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.md,
        iconSize: '1rem',
      },
      lg: {
        height: '2.75rem', // 44px
        paddingX: spacing[5],
        paddingY: spacing[2.5],
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.lg,
        iconSize: '1.125rem',
      },
      xl: {
        height: '3rem', // 48px
        paddingX: spacing[6],
        paddingY: spacing[3],
        fontSize: typography.fontSize.xl,
        borderRadius: borderRadius.xl,
        iconSize: '1.25rem',
      },
    },

    variants: {
      primary: {
        background: colors.primary[500],
        backgroundHover: colors.primary[600],
        backgroundActive: colors.primary[700],
        backgroundDisabled: colors.neutral[200],
        color: colors.neutral[0],
        colorDisabled: colors.neutral[400],
        border: 'transparent',
        focusRing: colors.primary[500],
      },
      secondary: {
        background: colors.neutral[0],
        backgroundHover: colors.neutral[50],
        backgroundActive: colors.neutral[100],
        backgroundDisabled: colors.neutral[100],
        color: colors.neutral[900],
        colorDisabled: colors.neutral[400],
        border: colors.neutral[300],
        focusRing: colors.primary[500],
      },
      success: {
        background: colors.success[500],
        backgroundHover: colors.success[600],
        backgroundActive: colors.success[700],
        backgroundDisabled: colors.neutral[200],
        color: colors.neutral[0],
        colorDisabled: colors.neutral[400],
        border: 'transparent',
        focusRing: colors.success[500],
      },
      warning: {
        background: colors.warning[500],
        backgroundHover: colors.warning[600],
        backgroundActive: colors.warning[700],
        backgroundDisabled: colors.neutral[200],
        color: colors.neutral[900],
        colorDisabled: colors.neutral[400],
        border: 'transparent',
        focusRing: colors.warning[500],
      },
      error: {
        background: colors.error[500],
        backgroundHover: colors.error[600],
        backgroundActive: colors.error[700],
        backgroundDisabled: colors.neutral[200],
        color: colors.neutral[0],
        colorDisabled: colors.neutral[400],
        border: 'transparent',
        focusRing: colors.error[500],
      },
      outline: {
        background: 'transparent',
        backgroundHover: colors.neutral[50],
        backgroundActive: colors.neutral[100],
        backgroundDisabled: 'transparent',
        color: colors.neutral[700],
        colorDisabled: colors.neutral[400],
        border: colors.neutral[300],
        focusRing: colors.primary[500],
      },
      ghost: {
        background: 'transparent',
        backgroundHover: colors.neutral[100],
        backgroundActive: colors.neutral[200],
        backgroundDisabled: 'transparent',
        color: colors.neutral[700],
        colorDisabled: colors.neutral[400],
        border: 'transparent',
        focusRing: colors.primary[500],
      },
    },
  },

  // Input Component
  input: {
    sizes: {
      sm: {
        height: '2.25rem',
        paddingX: spacing[3],
        paddingY: spacing[1.5],
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.base,
      },
      base: {
        height: '2.5rem',
        paddingX: spacing[4],
        paddingY: spacing[2],
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.md,
      },
      lg: {
        height: '2.75rem',
        paddingX: spacing[4],
        paddingY: spacing[2.5],
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.lg,
      },
    },

    states: {
      default: {
        border: colors.neutral[300],
        borderHover: colors.neutral[400],
        borderFocus: colors.primary[500],
        background: colors.neutral[0],
        color: colors.neutral[900],
        placeholder: colors.neutral[500],
      },
      error: {
        border: colors.error[500],
        borderHover: colors.error[600],
        borderFocus: colors.error[500],
        background: colors.error[50],
        color: colors.neutral[900],
        placeholder: colors.error[400],
      },
      success: {
        border: colors.success[500],
        borderHover: colors.success[600],
        borderFocus: colors.success[500],
        background: colors.success[50],
        color: colors.neutral[900],
        placeholder: colors.success[400],
      },
      disabled: {
        border: colors.neutral[200],
        borderHover: colors.neutral[200],
        borderFocus: colors.neutral[200],
        background: colors.neutral[100],
        color: colors.neutral[400],
        placeholder: colors.neutral[300],
      },
    },
  },

  // Card Component
  card: {
    variants: {
      default: {
        background: colors.neutral[0],
        border: colors.neutral[200],
        shadow: shadows.sm,
      },
      elevated: {
        background: colors.neutral[0],
        border: colors.neutral[200],
        shadow: shadows.md,
      },
      outlined: {
        background: colors.neutral[0],
        border: colors.neutral[300],
        shadow: 'none',
      },
      filled: {
        background: colors.neutral[50],
        border: colors.neutral[200],
        shadow: shadows.sm,
      },
    },

    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
  },

  // Badge/Chip Component
  badge: {
    sizes: {
      sm: {
        paddingX: spacing[1.5],
        paddingY: spacing[0.5],
        fontSize: typography.fontSize.xs,
        borderRadius: borderRadius.sm,
      },
      base: {
        paddingX: spacing[2],
        paddingY: spacing[1],
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.base,
      },
      lg: {
        paddingX: spacing[2.5],
        paddingY: spacing[1.5],
        fontSize: typography.fontSize.base,
        borderRadius: borderRadius.md,
      },
    },

    variants: {
      primary: {
        background: colors.primary[100],
        color: colors.primary[800],
        border: colors.primary[200],
      },
      success: {
        background: colors.success[100],
        color: colors.success[800],
        border: colors.success[200],
      },
      warning: {
        background: colors.warning[100],
        color: colors.warning[800],
        border: colors.warning[200],
      },
      error: {
        background: colors.error[100],
        color: colors.error[800],
        border: colors.error[200],
      },
      neutral: {
        background: colors.neutral[100],
        color: colors.neutral[800],
        border: colors.neutral[200],
      },
    },
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Header Design System
export const header = {
  height: {
    mobile: '64px',
    desktop: '72px',
  },
  spacing: {
    content: '1rem',
    logoGap: '0.5rem',
    buttonGap: '0.375rem',
    dropdownOffset: '0.5rem',
  },
  gradients: {
    title: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
  animations: {
    dropdown: 'fade-in-fast 0.15s ease-out forwards',
    hover: 'scale(1.02)',
    active: 'scale(0.98)',
  },
  shadows: {
    logo: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    dropdown: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  },
};

// Export everything as a design system object
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  componentVariants,
  breakpoints,
  header,
};

export default designSystem;
