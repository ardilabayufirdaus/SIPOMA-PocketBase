import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  size?: 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  haptic?: boolean;
  loadingText?: string;
  align?: 'left' | 'center' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'base', // Default to base (md)
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = 'lg',
  elevation = 'none',
  haptic = false,
  loadingText = 'Loading...',
  align = 'center',
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Map 'base' size to 'md' for backward compatibility
  const normalizedSize = size === 'base' ? 'md' : size;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
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
      'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white',
      'hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-indigo-500/50 focus:shadow-indigo-500/25',
      'shadow-indigo-600/25'
    ),
    secondary: cn(
      'bg-gradient-to-r from-slate-600 to-slate-700 text-white',
      'hover:from-slate-700 hover:to-slate-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-slate-500/50 focus:shadow-slate-500/25',
      'shadow-slate-600/25'
    ),
    success: cn(
      'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white',
      'hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-emerald-500/50 focus:shadow-emerald-500/25',
      'shadow-emerald-600/25'
    ),
    warning: cn(
      'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900',
      'hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-amber-500/50 focus:shadow-amber-500/25',
      'shadow-amber-500/25'
    ),
    error: cn(
      'bg-gradient-to-r from-rose-600 to-rose-700 text-white',
      'hover:from-rose-700 hover:to-rose-800 hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-rose-500/50 focus:shadow-rose-500/25',
      'shadow-rose-600/25'
    ),
    gradient: cn(
      'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white',
      'hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:shadow-xl hover:-translate-y-1',
      'focus:ring-indigo-500/50 focus:shadow-indigo-500/25',
      'shadow-lg'
    ),
    glass: cn(
      'bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 dark:text-white',
      'hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-white/50 focus:shadow-white/25',
      'shadow-lg'
    ),
    ghost: cn(
      'bg-transparent text-slate-700 dark:text-slate-300 border border-transparent',
      'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
      'focus:ring-slate-500/50'
    ),
    outline: cn(
      'bg-transparent border-2 border-indigo-600 text-indigo-700 dark:text-indigo-400',
      'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-700 hover:shadow-md hover:-translate-y-0.5',
      'focus:ring-indigo-500/50'
    ),
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    sm: 'px-4 py-2 text-sm gap-2 min-h-[36px]',
    md: 'px-6 py-2.5 text-sm font-medium gap-2.5 min-h-[44px]',
    lg: 'px-8 py-3 text-base gap-3 min-h-[48px]',
    xl: 'px-10 py-4 text-lg gap-3.5 min-h-[56px]',
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
    variantClasses[variant as keyof typeof variantClasses],
    sizeClasses[normalizedSize as keyof typeof sizeClasses],
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
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
          role="status"
          aria-label={loadingText}
        />
      )}

      {!loading && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      <span className="truncate">{children}</span>

      {!loading && rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
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

export default Button;
