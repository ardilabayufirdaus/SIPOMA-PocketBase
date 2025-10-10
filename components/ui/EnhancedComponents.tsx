/**
 * Design System & UI/UX Enhancement Framework
 * Comprehensive design system with holistic approach
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';

// =============================================================================
// DESIGN TOKENS & CONSTANTS
// =============================================================================

export const DESIGN_TOKENS = {
  // Spacing System (8pt grid)
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '6rem', // 96px
  },

  // Typography Scale
  typography: {
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
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Color Palette (Enhanced)
  colors: {
    primary: {
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
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(239, 68, 68, 0.3)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },

  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // Animation durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Animation easing
  easing: {
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getResponsiveClasses = (base: string, responsive?: Record<string, string>): string => {
  if (!responsive) return base;

  const classes = [base];
  Object.entries(responsive).forEach(([breakpoint, className]) => {
    classes.push(`${breakpoint}:${className}`);
  });

  return classes.join(' ');
};

// =============================================================================
// ENHANCED DESIGN SYSTEM COMPONENTS
// =============================================================================

// Enhanced Button with Microinteractions
interface EnhancedButtonProps {
  children?: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'ghost'
    | 'outline'
    | 'gradient'
    | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  haptic?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  loadingText?: string;
  align?: 'left' | 'center' | 'right';
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = 'md',
  elevation = 'none',
  haptic = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  loadingText = 'Loading...',
  align = 'left',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { announceToScreenReader } = useAccessibility();

  const handleClick = useCallback(
    (e?: React.SyntheticEvent<HTMLButtonElement>) => {
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onClick?.(e);
    },
    [onClick, haptic]
  );

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Announce loading state to screen readers
  useEffect(() => {
    if (loading) {
      announceToScreenReader(loadingText, 'assertive');
    }
  }, [loading, loadingText, announceToScreenReader]);

  // Alignment styles
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const baseClasses = cn(
    'relative inline-flex items-center font-semibold transition-all duration-300 ease-out',
    'transform-gpu will-change-transform',
    alignClasses[align],
    'focus:outline-none focus:ring-4 focus:ring-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
    'active:scale-[0.98] active:transition-transform active:duration-75',
    fullWidth && 'w-full',
    isPressed && 'scale-[0.98]',
    loading && 'cursor-wait'
  );

  // Variant styles
  const variantClasses = {
    primary: cn(
      'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
      'hover:from-primary-700 hover:to-primary-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-primary-500/50 focus:shadow-primary-500/25',
      'shadow-primary-600/25',
      'dark:from-primary-700 dark:to-primary-800 dark:hover:from-primary-800 dark:hover:to-primary-900'
    ),
    secondary: cn(
      'bg-gradient-to-r from-secondary-600 to-secondary-700 text-white',
      'hover:from-secondary-700 hover:to-secondary-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-secondary-500/50 focus:shadow-secondary-500/25',
      'shadow-secondary-600/25',
      'dark:from-secondary-700 dark:to-secondary-800 dark:hover:from-secondary-800 dark:hover:to-secondary-900'
    ),
    success: cn(
      'bg-gradient-to-r from-success-600 to-success-700 text-white',
      'hover:from-success-700 hover:to-success-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-success-500/50 focus:shadow-success-500/25',
      'shadow-success-600/25',
      'dark:from-success-700 dark:to-success-800 dark:hover:from-success-800 dark:hover:to-success-900'
    ),
    warning: cn(
      'bg-gradient-to-r from-warning-500 to-warning-600 text-neutral-900',
      'hover:from-warning-600 hover:to-warning-700 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-warning-500/50 focus:shadow-warning-500/25',
      'shadow-warning-500/25',
      'dark:from-warning-600 dark:to-warning-700 dark:hover:from-warning-700 dark:hover:to-warning-800'
    ),
    error: cn(
      'bg-gradient-to-r from-error-600 to-error-700 text-white',
      'hover:from-error-700 hover:to-error-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-error-500/50 focus:shadow-error-500/25',
      'shadow-error-600/25',
      'dark:from-error-700 dark:to-error-800 dark:hover:from-error-800 dark:hover:to-error-900'
    ),
    gradient: cn(
      'bg-gradient-to-r from-primary-500 via-secondary-500 to-success-500 text-white',
      'hover:from-primary-600 hover:via-secondary-600 hover:to-success-600 hover:shadow-xl hover:-translate-y-1',
      'focus:ring-primary-500/50 focus:shadow-primary-500/25',
      'shadow-lg',
      'dark:from-primary-600 dark:via-secondary-600 dark:to-success-600'
    ),
    glass: cn(
      'bg-white/10 backdrop-blur-md border border-white/20 text-white',
      'hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-white/50 focus:shadow-white/25',
      'shadow-lg',
      'dark:bg-black/10 dark:border-white/10 dark:text-white dark:hover:bg-black/20'
    ),
    ghost: cn(
      'bg-transparent text-neutral-700 border border-neutral-300',
      'hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md hover:-translate-y-0.5',
      'focus:ring-neutral-500/50 focus:shadow-neutral-500/25',
      'dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:border-neutral-500'
    ),
    outline: cn(
      'bg-transparent border-2 border-primary-600 text-primary-700',
      'hover:bg-primary-50 hover:border-primary-700 hover:shadow-md hover:-translate-y-0.5',
      'focus:ring-primary-500/50 focus:shadow-primary-500/25',
      'dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-900/20'
    ),
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    sm: 'px-4 py-2 text-sm gap-2 min-h-[36px]',
    md: 'px-6 py-3 text-base gap-2.5 min-h-[44px]',
    lg: 'px-8 py-4 text-lg gap-3 min-h-[52px]',
    xl: 'px-10 py-5 text-xl gap-3.5 min-h-[60px]',
  };

  // Rounded styles
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  // Elevation styles
  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const finalClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    elevationClasses[elevation],
    className
  );

  return (
    <button
      ref={buttonRef}
      type={type}
      className={finalClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      aria-pressed={isPressed}
      aria-expanded={ariaExpanded}
    >
      {loading && (
        <div
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
          role="status"
          aria-label={loadingText}
        />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="font-semibold tracking-wide truncate">{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Enhanced ripple effect */}
      <div className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-white/20 scale-0 rounded-inherit transition-all duration-500 origin-center opacity-0 hover:opacity-100 hover:scale-100 active:scale-110 active:opacity-30" />
      </div>

      {/* Subtle glow effect for interactive states */}
      <div className="absolute inset-0 rounded-inherit pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-inherit" />
      </div>
    </button>
  );
};

// Enhanced Card with Glass Effect and Microinteractions
interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  hover = false,
  interactive = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Base styles
  const baseClasses = cn(
    'relative transition-all duration-300 ease-out',
    interactive && 'cursor-pointer',
    hover && 'hover:scale-[1.02] hover:shadow-xl'
  );

  // Variant styles
  const variantClasses = {
    default: cn(
      'bg-white dark:bg-neutral-900',
      'border border-neutral-200 dark:border-neutral-800'
    ),
    glass: cn(
      'bg-white/10 dark:bg-black/10',
      'backdrop-blur-md',
      'border border-white/20 dark:border-white/10'
    ),
    elevated: cn(
      'bg-white dark:bg-neutral-900',
      'border border-neutral-200 dark:border-neutral-800',
      'shadow-lg'
    ),
    outlined: cn('bg-transparent', 'border-2 border-neutral-300 dark:border-neutral-600'),
    gradient: cn(
      'bg-gradient-to-br from-primary-500 to-secondary-600',
      'text-white',
      'border border-primary-400'
    ),
  };

  // Padding styles
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  // Rounded styles
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const finalClasses = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    roundedClasses[rounded],
    className
  );

  return (
    <div
      className={finalClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}

      {/* Subtle glow effect on hover */}
      {hover && isHovered && (
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-50 blur-xl -z-10" />
      )}
    </div>
  );
};

// Enhanced Input with Validation States and Microinteractions
interface EnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  error?: string;
  success?: boolean;
  warning?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  autoComplete?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  error,
  success = false,
  warning = false,
  label,
  helperText,
  required = false,
  className = '',
  size = 'md',
  variant = 'default',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  autoFocus = false,
  maxLength,
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Base styles
  const baseClasses = cn(
    'relative transition-all duration-200 ease-out',
    'focus:outline-none',
    fullWidth && 'w-full'
  );

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  // Variant styles
  const variantClasses = {
    default: cn(
      'bg-white dark:bg-neutral-900',
      'border border-neutral-300 dark:border-neutral-600',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    ),
    filled: cn(
      'bg-neutral-50 dark:bg-neutral-800',
      'border border-neutral-200 dark:border-neutral-700',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    ),
    outlined: cn(
      'bg-transparent',
      'border-2 border-neutral-300 dark:border-neutral-600',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    ),
    minimal: cn(
      'bg-transparent border-b-2 border-neutral-300 dark:border-neutral-600',
      'focus:border-primary-500',
      'rounded-none px-0'
    ),
  };

  // State styles
  const stateClasses = cn(
    error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
    success && 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
    warning && 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  // Focus styles
  const focusClasses = cn(isFocused && 'ring-2 ring-primary-500/20 border-primary-500');

  const inputClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    stateClasses,
    focusClasses,
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    className
  );

  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            error && 'text-error-600 dark:text-error-400',
            success && 'text-success-600 dark:text-success-400',
            warning && 'text-warning-600 dark:text-warning-400',
            !error && !success && !warning && 'text-neutral-700 dark:text-neutral-300'
          )}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          required={required}
          autoFocus={autoFocus}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}

        {/* Floating label effect for minimal variant */}
        {variant === 'minimal' && label && (
          <div
            className={cn(
              'absolute left-0 transition-all duration-200 pointer-events-none',
              hasValue || isFocused
                ? 'top-0 text-xs text-primary-600 dark:text-primary-400'
                : 'top-1/2 -translate-y-1/2 text-base text-neutral-500'
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </div>
        )}
      </div>

      {/* Helper text and validation messages */}
      {(helperText || error || success || warning) && (
        <div className="flex items-center gap-2 text-sm">
          {(error || success || warning) && (
            <div
              className={cn(
                'flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
                error && 'bg-error-100 text-error-600',
                success && 'bg-success-100 text-success-600',
                warning && 'bg-warning-100 text-warning-600'
              )}
            >
              {error && '✕'}
              {success && '✓'}
              {warning && '⚠'}
            </div>
          )}
          <span
            className={cn(
              error && 'text-error-600 dark:text-error-400',
              success && 'text-success-600 dark:text-success-400',
              warning && 'text-warning-600 dark:text-warning-400',
              !error && !success && !warning && 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {error || success || warning || helperText}
          </span>
        </div>
      )}

      {/* Character counter */}
      {maxLength && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

// Enhanced Badge with Animation
interface EnhancedBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  pulse?: boolean;
  className?: string;
}

export const EnhancedBadge: React.FC<EnhancedBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  rounded = 'full',
  animated = false,
  pulse = false,
  className = '',
}) => {
  // Variant styles
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary:
      'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
    error: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300',
    outline:
      'bg-transparent border border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  // Rounded styles
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const finalClasses = cn(
    'inline-flex items-center font-medium transition-all duration-200',
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    animated && 'animate-pulse',
    pulse && 'animate-bounce',
    className
  );

  return <span className={finalClasses}>{children}</span>;
};

// Enhanced Loading Spinner with Variants
interface EnhancedSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
}

export const EnhancedSpinner: React.FC<EnhancedSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  text,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'border-2 border-current border-t-transparent rounded-full animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && <span className={cn('text-sm font-medium', variantClasses[variant])}>{text}</span>}
    </div>
  );
};

// Enhanced Tooltip with Positioning
interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 rounded-md shadow-lg',
            'transition-opacity duration-200',
            positionClasses[position],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-neutral-900 transform rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
};

// Enhanced Modal with Backdrop Blur and Animations
interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'glass' | 'minimal';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const variantClasses = {
    default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
    glass: 'bg-white/90 dark:bg-black/90 backdrop-blur-md border border-white/20',
    minimal: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full rounded-xl shadow-2xl transform transition-all duration-300',
          'animate-in fade-in-0 zoom-in-95',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

export const useBreakpoint = (breakpoint: keyof typeof DESIGN_TOKENS.breakpoints) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESIGN_TOKENS.breakpoints[breakpoint]})`);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
};

export const useResponsiveValue = <T,>(values: Record<string, T>) => {
  const [value, setValue] = useState<T>(values.default || values.base);

  useEffect(() => {
    const mediaQueries = Object.entries(DESIGN_TOKENS.breakpoints).map(([key, breakpoint]) => ({
      key,
      mediaQuery: window.matchMedia(`(min-width: ${breakpoint})`),
    }));

    const updateValue = () => {
      for (const { key, mediaQuery } of mediaQueries.reverse()) {
        if (mediaQuery.matches && values[key]) {
          setValue(values[key]);
          return;
        }
      }
      setValue(values.default || values.base);
    };

    updateValue();

    const handlers = mediaQueries.map(({ mediaQuery }) => {
      const handler = () => updateValue();
      mediaQuery.addEventListener('change', handler);
      return { mediaQuery, handler };
    });

    return () => {
      handlers.forEach(({ mediaQuery, handler }) => {
        mediaQuery.removeEventListener('change', handler);
      });
    };
  }, [values]);

  return value;
};

// =============================================================================
// GESTALT PRINCIPLES IMPLEMENTATION
// =============================================================================

export const GestaltContainer: React.FC<{
  children: React.ReactNode;
  principle?: 'proximity' | 'similarity' | 'closure' | 'continuity' | 'figure-ground';
  className?: string;
}> = ({ children, principle = 'proximity', className = '' }) => {
  const principleClasses = {
    proximity: 'space-y-4', // Group related items closely
    similarity: 'divide-y divide-neutral-200 dark:divide-neutral-800', // Similar items with dividers
    closure: 'rounded-lg border border-neutral-200 dark:border-neutral-800 p-4', // Complete the shape
    continuity: 'flex flex-col space-y-2', // Guide the eye smoothly
    'figure-ground': 'bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg', // Clear foreground/background
  };

  return <div className={cn(principleClasses[principle], className)}>{children}</div>;
};

// =============================================================================
// A/B TESTING FRAMEWORK
// =============================================================================

interface ABTestVariant {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  weight: number; // 0-1, probability of being selected
}

interface ABTestProps {
  testId: string;
  variants: ABTestVariant[];
  fallback?: React.ComponentType<any>;
  onVariantSelected?: (variantId: string) => void;
  userId?: string;
}

export const ABTest: React.FC<ABTestProps> = ({
  testId,
  variants,
  fallback: Fallback,
  onVariantSelected,
  userId,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ABTestVariant | null>(null);

  useEffect(() => {
    // Simple weighted random selection
    // In production, use a more sophisticated A/B testing service
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        setSelectedVariant(variant);
        onVariantSelected?.(variant.id);

        // Store selection for consistency
        const storageKey = `ab_test_${testId}_${userId || 'anonymous'}`;
        localStorage.setItem(storageKey, variant.id);
        break;
      }
    }

    // Fallback to first variant if none selected
    if (!selectedVariant && variants.length > 0) {
      setSelectedVariant(variants[0]);
      onVariantSelected?.(variants[0].id);
    }
  }, [testId, variants, onVariantSelected, userId]);

  if (!selectedVariant) {
    return Fallback ? <Fallback /> : null;
  }

  const VariantComponent = selectedVariant.component;
  return <VariantComponent />;
};

// =============================================================================
// MICROINTERACTION HOOKS
// =============================================================================

export const useMicrointeraction = (duration: number = 300) => {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), duration);
  }, [duration]);

  return { isActive, trigger };
};

export const useHapticFeedback = () => {
  const trigger = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return { trigger };
};

// =============================================================================
// ACCESSIBILITY ENHANCEMENTS
// =============================================================================

// Enhanced accessibility utilities for WCAG 2.1 AA compliance
export const useAccessibility = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      setAnnouncements((prev) => [...prev, message]);

      // Clear announcement after screen reader processes it
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((msg) => msg !== message));
      }, 1000);
    },
    []
  );

  const generateAriaDescribedBy = useCallback((ids: string[]) => {
    return ids.filter(Boolean).join(' ');
  }, []);

  const getAriaLabel = useCallback((label?: string, required?: boolean, error?: string) => {
    if (error) return `${label || ''} Error: ${error}`;
    if (required) return `${label || ''} Required`;
    return label;
  }, []);

  return {
    announcements,
    announceToScreenReader,
    generateAriaDescribedBy,
    getAriaLabel,
  };
};

// Screen reader announcement component
interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  priority = 'polite',
  className = '',
}) => {
  return (
    <div role="status" aria-live={priority} aria-atomic="true" className={cn('sr-only', className)}>
      {message}
    </div>
  );
};

// Enhanced focus management with skip links
export const useSkipLinks = () => {
  const skipLinks = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'search', label: 'Skip to search' },
  ];

  const handleSkipLink = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { skipLinks, handleSkipLink };
};

// Skip Links Component
export const SkipLinks: React.FC = () => {
  const { skipLinks, handleSkipLink } = useSkipLinks();

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="bg-primary-600 text-white px-4 py-2 rounded-md m-2 inline-block focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={(e) => {
            e.preventDefault();
            handleSkipLink(link.id);
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Enhanced keyboard navigation with arrow key support
export const useEnhancedKeyboardNavigation = (
  items: any[],
  onSelect?: (item: any, index: number) => void,
  loop: boolean = true
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key } = e;

      switch (key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = loop ? (prev + 1) % items.length : Math.min(prev + 1, items.length - 1);
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = loop ? (prev - 1 + items.length) % items.length : Math.max(prev - 1, 0);
            return next;
          });
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            setSelectedIndex(focusedIndex);
            onSelect?.(items[focusedIndex], focusedIndex);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          setSelectedIndex(-1);
          break;
      }
    },
    [items, focusedIndex, onSelect, loop]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedIndex,
    selectedIndex,
    setFocusedIndex,
    setSelectedIndex,
    isFocused: (index: number) => focusedIndex === index,
    isSelected: (index: number) => selectedIndex === index,
  };
};

// Accessible disclosure/collapsible component
interface DisclosureProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
  className?: string;
}

export const Disclosure: React.FC<DisclosureProps> = ({
  children,
  trigger,
  isOpen,
  onToggle,
  id,
  className = '',
}) => {
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;

  return (
    <div className={className}>
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 text-left bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {trigger}
        <svg
          className={cn('w-5 h-5 transition-transform duration-200', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">{children}</div>
      </div>
    </div>
  );
};

// Accessible progress indicator
interface ProgressIndicatorProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const progressId = useId();

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className={cn(
          'w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Accessible tooltip with ARIA attributes
interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  }, [delay, timeoutId]);

  const hideTooltip = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  }, [timeoutId]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 dark:bg-neutral-700 rounded-md shadow-lg',
            'whitespace-nowrap pointer-events-none',
            positionClasses[position]
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-neutral-900 dark:bg-neutral-700 transform rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
};

// High contrast mode detection and utilities
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Color scheme detection
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};
// =============================================================================
// EXPORT ALL COMPONENTS
// =============================================================================

export default {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedBadge,
  EnhancedSpinner,
  EnhancedTooltip,
  EnhancedModal,
  GestaltContainer,
  ABTest,
  DESIGN_TOKENS,
  cn,
  getResponsiveClasses,
  useBreakpoint,
  useResponsiveValue,
  useMicrointeraction,
  useHapticFeedback,
  useAccessibility,
  useEnhancedKeyboardNavigation,
  useSkipLinks,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
  SkipLinks,
  ScreenReaderAnnouncement,
  Disclosure,
  ProgressIndicator,
  AccessibleTooltip,
};
