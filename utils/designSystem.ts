// Design Tokens for SIPOMA Application
// Consistent design system for colors, typography, spacing, and components

export const colors = {
  // Primary Brand Colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Primary blue
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Secondary Colors
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Status Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Neutral Gray Scale
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

export const typography = {
  // Font Families
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
  },

  // Font Sizes
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  // Font Weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },

  // Line Heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },

  // Letter Spacing
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
  },
};

export const spacing = {
  // Spacing Scale (rem)
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
};

export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  base: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "0 0 #0000",
};

export const transitions = {
  duration: {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },

  timing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
};

export const zIndex = {
  auto: "auto",
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  modal: "1040",
  popover: "1050",
  tooltip: "1060",
  toast: "1070",
};

// Component Variants
export const buttonVariants = {
  // Button Sizes
  sizes: {
    xs: {
      padding: "0.25rem 0.5rem",
      fontSize: typography.fontSize.xs,
      borderRadius: borderRadius.sm,
    },
    sm: {
      padding: "0.375rem 0.75rem",
      fontSize: typography.fontSize.sm,
      borderRadius: borderRadius.base,
    },
    base: {
      padding: "0.5rem 1rem",
      fontSize: typography.fontSize.base,
      borderRadius: borderRadius.md,
    },
    lg: {
      padding: "0.75rem 1.5rem",
      fontSize: typography.fontSize.lg,
      borderRadius: borderRadius.lg,
    },
    xl: {
      padding: "1rem 2rem",
      fontSize: typography.fontSize.xl,
      borderRadius: borderRadius.xl,
    },
  },

  // Button Colors/Variants
  variants: {
    primary: {
      background: colors.primary[600],
      backgroundHover: colors.primary[700],
      color: "#ffffff",
      border: "transparent",
    },
    secondary: {
      background: colors.secondary[100],
      backgroundHover: colors.secondary[200],
      color: colors.secondary[900],
      border: colors.secondary[300],
    },
    success: {
      background: colors.success[600],
      backgroundHover: colors.success[700],
      color: "#ffffff",
      border: "transparent",
    },
    warning: {
      background: colors.warning[500],
      backgroundHover: colors.warning[600],
      color: "#ffffff",
      border: "transparent",
    },
    error: {
      background: colors.error[600],
      backgroundHover: colors.error[700],
      color: "#ffffff",
      border: "transparent",
    },
    outline: {
      background: "transparent",
      backgroundHover: colors.gray[50],
      color: colors.gray[700],
      border: colors.gray[300],
    },
    ghost: {
      background: "transparent",
      backgroundHover: colors.gray[100],
      color: colors.gray[700],
      border: "transparent",
    },
  },
};

export const inputVariants = {
  sizes: {
    sm: {
      padding: "0.375rem 0.75rem",
      fontSize: typography.fontSize.sm,
    },
    base: {
      padding: "0.5rem 0.75rem",
      fontSize: typography.fontSize.base,
    },
    lg: {
      padding: "0.75rem 1rem",
      fontSize: typography.fontSize.lg,
    },
  },

  states: {
    default: {
      border: colors.gray[300],
      borderFocus: colors.primary[500],
      background: "#ffffff",
    },
    error: {
      border: colors.error[500],
      borderFocus: colors.error[500],
      background: colors.error[50],
    },
    success: {
      border: colors.success[500],
      borderFocus: colors.success[500],
      background: colors.success[50],
    },
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
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
  buttonVariants,
  inputVariants,
  breakpoints,
};

export default designSystem;
