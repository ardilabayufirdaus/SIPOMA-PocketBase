/**
 * Enhanced Components Library
 * Advanced UI components with responsive utilities and design system
 */

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

// =============================================================================
// PERFORMANCE MONITORING HOOK
// =============================================================================

export const useComponentPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;

    // Log performance metrics for development
    if (process.env.NODE_ENV === 'development' && renderCount.current > 1) {
      console.log(
        `${componentName} re-rendered (${renderCount.current} times, ${renderTime.toFixed(2)}ms)`
      );
    }

    lastRenderTime.current = now;
  });

  return { renderCount: renderCount.current };
};

// =============================================================================
// MEMOIZED COMPONENT WRAPPER
// =============================================================================

interface MemoizedComponentProps {
  children: React.ReactNode;
  deps?: any[];
  componentName?: string;
}

export const MemoizedComponent: React.FC<MemoizedComponentProps> = React.memo(
  ({ children, componentName }) => {
    useComponentPerformance(componentName || 'MemoizedComponent');
    return <>{children}</>;
  }
);

MemoizedComponent.displayName = 'MemoizedComponent';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          {placeholder || (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>
      )}

      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export const DESIGN_TOKENS = {
  // Spacing (8pt grid system)
  spacing: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  // Typography scale
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
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Color palette
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      500: '#6b7280',
      600: '#4b5563',
      900: '#111827',
    },
    success: {
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706',
    },
    danger: {
      500: '#ef4444',
      600: '#dc2626',
    },
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

export const useBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= DESIGN_TOKENS.breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= DESIGN_TOKENS.breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= DESIGN_TOKENS.breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= DESIGN_TOKENS.breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

export const useResponsiveValue = <T,>(values: {
  default: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): T => {
  const breakpoint = useBreakpoint();

  return values[breakpoint] || values.default;
};

// =============================================================================
// ENHANCED COMPONENTS
// =============================================================================

interface EnhancedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
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
}) => {
  const responsiveSize = useResponsiveValue({
    default: size,
    xs: size === 'lg' ? 'md' : size,
  });

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
  ];

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 focus:ring-gray-500 shadow-sm hover:shadow-md dark:bg-gray-500 dark:hover:bg-gray-600 dark:text-gray-900 dark:border-gray-400',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-300',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md dark:bg-red-500 dark:hover:bg-red-600',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = [...baseClasses, variantClasses[variant], sizeClasses[responsiveSize], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled || loading}>
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {!loading && icon && iconPosition === 'left' && <span className="w-4 h-4 mr-2">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="w-4 h-4 ml-2">{icon}</span>}
    </button>
  );
};

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  shadow = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const classes = [
    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
    paddingClasses[padding],
    shadowClasses[shadow],
    hover ? 'hover:shadow-lg transition-shadow duration-200' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};

interface EnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  label,
  required = false,
  className = '',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
}) => {
  const responsiveSize = useResponsiveValue({
    default: size,
    xs: size === 'lg' ? 'md' : size,
  });

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const inputClasses = [
    'w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
    sizeClasses[responsiveSize],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// =============================================================================
// MICROINTERACTION HOOKS
// =============================================================================

export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};

export const useClickAnimation = () => {
  const [isClicked, setIsClicked] = useState(false);

  const clickProps = {
    onMouseDown: () => setIsClicked(true),
    onMouseUp: () => setIsClicked(false),
    onMouseLeave: () => setIsClicked(false),
  };

  return { isClicked, clickProps };
};

// =============================================================================
// GESTALT PRINCIPLES COMPONENTS
// =============================================================================

interface GestaltContainerProps {
  children: React.ReactNode;
  principle?: 'proximity' | 'similarity' | 'closure' | 'continuity' | 'figure-ground';
  className?: string;
}

export const GestaltContainer: React.FC<GestaltContainerProps> = ({
  children,
  principle = 'proximity',
  className = '',
}) => {
  const principleClasses = {
    proximity: 'space-y-4',
    similarity: 'space-y-2 [&>*]:border [&>*]:border-gray-200 [&>*]:rounded',
    closure: '[&>*]:border [&>*]:border-dashed [&>*]:border-gray-300',
    continuity: 'flex flex-col [&>*]:border-l-2 [&>*]:border-l-blue-500 [&>*]:pl-4',
    'figure-ground': 'relative bg-gray-100 p-8 [&>*]:relative [&>*]:z-10',
  };

  return <div className={`${principleClasses[principle]} ${className}`}>{children}</div>;
};

// =============================================================================
// ACCESSIBILITY ENHANCEMENTS
// =============================================================================

export const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    },
    [items, focusedIndex, onSelect]
  );

  return { focusedIndex, handleKeyDown };
};

// =============================================================================
// EXPORT ALL COMPONENTS
// =============================================================================

export default {
  DESIGN_TOKENS,
  useBreakpoint,
  useResponsiveValue,
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  useHoverAnimation,
  useClickAnimation,
  GestaltContainer,
  useKeyboardNavigation,
};

