import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'ghost'
    | 'gradient'
    | 'neon'
    | 'glass'
    | 'rainbow';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  onClick,
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses = cn(
    'relative inline-flex items-center justify-center font-medium transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transform hover:scale-105 active:scale-95',
    'overflow-hidden',
    fullWidth && 'w-full'
  );

  // Size variants
  const sizeVariants = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    base: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  // Variant styles with gradients and modern effects
  const variantStyles = {
    primary: cn(
      'bg-gradient-fire text-white shadow-lg shadow-primary-500/25',
      'hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-400 hover:to-primary-600',
      'focus:ring-primary-500'
    ),
    secondary: cn(
      'bg-gradient-ocean text-white shadow-lg shadow-secondary-500/25',
      'hover:shadow-xl hover:shadow-secondary-500/30 hover:from-secondary-400 hover:to-secondary-600',
      'focus:ring-secondary-500'
    ),
    success: cn(
      'bg-gradient-forest text-white shadow-lg shadow-emerald-500/25',
      'hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-600',
      'focus:ring-emerald-500'
    ),
    warning: cn(
      'bg-gradient-sunset text-white shadow-lg shadow-amber-500/25',
      'hover:shadow-xl hover:shadow-amber-500/30 hover:from-amber-400 hover:to-amber-600',
      'focus:ring-amber-500'
    ),
    error: cn(
      'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25',
      'hover:shadow-xl hover:shadow-red-500/30 hover:from-red-400 hover:to-red-600',
      'focus:ring-red-500'
    ),
    gradient: cn(
      'bg-gradient-rainbow text-white shadow-lg animate-gradient-x',
      'hover:shadow-xl hover:animate-gradient-xy',
      'focus:ring-purple-500'
    ),
    neon: cn(
      'bg-transparent border-2 border-primary-500 text-primary-500',
      'shadow-neon hover:bg-primary-500 hover:text-white hover:shadow-glow-fire',
      'focus:ring-primary-500'
    ),
    glass: cn(
      'bg-white/10 backdrop-blur-md border border-white/20 text-gray-800 dark:text-white',
      'hover:bg-white/20 shadow-glass',
      'focus:ring-white/50'
    ),
    rainbow: cn(
      'bg-gradient-rainbow text-white shadow-lg animate-rainbow',
      'hover:shadow-xl hover:scale-110',
      'focus:ring-purple-500'
    ),
    outline: cn(
      'border-2 border-primary-500 text-primary-500 bg-transparent',
      'hover:bg-primary-500 hover:text-white',
      'focus:ring-primary-500'
    ),
    ghost: cn(
      'text-gray-700 dark:text-gray-300 bg-transparent',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'focus:ring-gray-500'
    ),
  };

  // Combine all classes
  const buttonClasses = cn(baseClasses, sizeVariants[size], variantStyles[variant], className);

  return (
    <button className={buttonClasses} disabled={disabled || loading} onClick={onClick} {...props}>
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left icon */}
      {!loading && leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}

      {/* Button content */}
      <span className="flex-1 text-center font-medium">{children}</span>

      {/* Right icon */}
      {!loading && rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}

      {/* Ripple effect */}
      <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg"></span>
    </button>
  );
};

export default Button;
