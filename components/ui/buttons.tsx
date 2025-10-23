import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DESIGN_TOKENS } from './EnhancedComponents';
import { useAccessibility } from './hooks';

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Enhanced Button with Advanced Interactions
interface EnhancedButtonProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'gradient'
    | 'glass'
    | 'ghost'
    | 'outline';
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

  const handleClick = useCallback(() => {
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onClick?.();
  }, [onClick, haptic]);

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

  // Variant styles using CSS custom properties
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

