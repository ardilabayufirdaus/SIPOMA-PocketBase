/**
 * UI Utilities untuk konsistensi styling
 * Helper functions untuk class generation yang konsisten
 */

import { designSystem } from "./designSystem";

// Utility untuk merge classes dengan konsistensi
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

// Button utilities
export const getButtonClasses = (
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  size: "xs" | "sm" | "md" | "lg" = "md",
  disabled = false
): string => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    secondary:
      "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 focus:ring-red-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-red-500 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    xs: "h-8 px-3 text-xs",
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-6 text-base",
    lg: "h-11 px-8 text-lg",
  };

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && "opacity-50 pointer-events-none"
  );
};

// Card utilities
export const getCardClasses = (
  variant: "default" | "elevated" | "outlined" = "default",
  padding: "sm" | "md" | "lg" = "md"
): string => {
  const baseClasses = "bg-white dark:bg-slate-800 rounded-lg border shadow-sm";

  const variantClasses = {
    default: "border-slate-200 dark:border-slate-700",
    elevated: "border-slate-200 dark:border-slate-700 shadow-md",
    outlined: "border-slate-300 dark:border-slate-600",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return cn(baseClasses, variantClasses[variant], paddingClasses[padding]);
};

// Input utilities
export const getInputClasses = (
  size: "sm" | "md" | "lg" = "md",
  state: "default" | "error" | "success" = "default"
): string => {
  const baseClasses =
    "block w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent dark:bg-slate-700 dark:text-slate-100";

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  };

  const stateClasses = {
    default:
      "border-slate-300 focus:ring-red-500 focus:border-red-500 dark:border-slate-600",
    error: "border-red-300 focus:ring-red-500 focus:border-red-500",
    success: "border-green-300 focus:ring-green-500 focus:border-green-500",
  };

  return cn(baseClasses, sizeClasses[size], stateClasses[state]);
};

// Navigation utilities
export const getNavLinkClasses = (
  isActive: boolean,
  variant: "sidebar" | "header" = "sidebar"
): string => {
  const baseClasses =
    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors";

  if (variant === "sidebar") {
    return cn(
      baseClasses,
      isActive
        ? "bg-red-500/15 text-red-400 border border-red-500/20"
        : "text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none focus:ring-1 focus:ring-red-500/30"
    );
  }

  return cn(
    baseClasses,
    isActive
      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
  );
};

// Responsive utilities
export const getResponsiveClasses = (
  base: string,
  responsive?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  }
): string => {
  const classes = [base];

  if (responsive?.sm) classes.push(`sm:${responsive.sm}`);
  if (responsive?.md) classes.push(`md:${responsive.md}`);
  if (responsive?.lg) classes.push(`lg:${responsive.lg}`);
  if (responsive?.xl) classes.push(`xl:${responsive.xl}`);

  return classes.join(" ");
};

// Animation utilities
export const getAnimationClasses = (
  type: "fade" | "slide" | "scale" | "bounce" = "fade",
  duration: "fast" | "normal" | "slow" = "normal"
): string => {
  const durationClasses = {
    fast: "duration-150",
    normal: "duration-300",
    slow: "duration-500",
  };

  const typeClasses = {
    fade: "opacity-0 animate-fade-in",
    slide: "transform translate-x-full animate-slide-in",
    scale: "transform scale-95 animate-scale-in",
    bounce: "animate-bounce",
  };

  return cn(typeClasses[type], durationClasses[duration]);
};

// Accessibility utilities
export const getAriaProps = (
  label?: string,
  describedBy?: string,
  expanded?: boolean,
  current?: boolean
) => {
  const props: Record<string, any> = {};

  if (label) props["aria-label"] = label;
  if (describedBy) props["aria-describedby"] = describedBy;
  if (expanded !== undefined) props["aria-expanded"] = expanded;
  if (current !== undefined)
    props["aria-current"] = current ? "page" : undefined;

  return props;
};

// Focus utilities
export const getFocusClasses = (
  variant: "default" | "inset" | "none" = "default"
): string => {
  const variants = {
    default:
      "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    inset:
      "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset",
    none: "focus:outline-none",
  };

  return variants[variant];
};

// Color utilities
export const getColorClasses = (
  color: "primary" | "secondary" | "success" | "warning" | "error" | "info",
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string => {
  return designSystem.colors[color]?.[shade] || "";
};

// Spacing utilities
export const getSpacingClasses = (
  property: "m" | "p" | "mx" | "my" | "px" | "py",
  size: keyof typeof designSystem.spacing
): string => {
  return `${property}-${size}`;
};
