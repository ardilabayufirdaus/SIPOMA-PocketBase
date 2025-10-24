/**
 * Microinteractions & Animations Library
 * Smooth transitions and meaningful interactions for enhanced UX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { forwardRef } from 'react';

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

export const animationUtils = {
  // Transition classes
  transitions: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
    bounce: 'transition-all duration-300 ease-bounce',
  },

  // Transform classes
  transforms: {
    scale: {
      hover: 'hover:scale-105',
      active: 'active:scale-95',
      subtle: 'hover:scale-102',
    },
    translate: {
      up: 'hover:-translate-y-1',
      down: 'hover:translate-y-1',
      left: 'hover:-translate-x-1',
      right: 'hover:translate-x-1',
    },
    rotate: {
      slight: 'hover:rotate-1',
      medium: 'hover:rotate-3',
      full: 'hover:rotate-180',
    },
  },

  // Opacity animations
  opacity: {
    fadeIn: 'animate-fade-in',
    fadeOut: 'animate-fade-out',
    pulse: 'animate-pulse',
    ping: 'animate-ping',
  },

  // Loading animations
  loading: {
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
  },
};

// =============================================================================
// MICROINTERACTION HOOKS
// =============================================================================

export const useHoverInteraction = (config?: {
  scale?: number;
  translate?: { x?: number; y?: number };
  duration?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const hoverProps = {
    onMouseEnter: useCallback(() => {
      setIsHovered(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), config?.duration || 200);
    }, [config?.duration]),
    onMouseLeave: useCallback(() => {
      setIsHovered(false);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), config?.duration || 200);
    }, [config?.duration]),
  };

  const style = {
    transform: isHovered
      ? `scale(${config?.scale || 1.05}) translate(${
          config?.translate?.x || 0
        }px, ${config?.translate?.y || 0}px)`
      : 'scale(1) translate(0px, 0px)',
    transition: `transform ${config?.duration || 200}ms ease-out`,
  };

  return { isHovered, isAnimating, hoverProps, style };
};

export const useClickInteraction = (config?: {
  scale?: number;
  duration?: number;
  onClick?: () => void;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const clickProps = {
    onMouseDown: useCallback(() => {
      setIsPressed(true);
      setIsAnimating(true);
    }, []),
    onMouseUp: useCallback(() => {
      setIsPressed(false);
      setTimeout(() => setIsAnimating(false), config?.duration || 150);
    }, [config?.duration]),
    onMouseLeave: useCallback(() => {
      setIsPressed(false);
      setTimeout(() => setIsAnimating(false), config?.duration || 150);
    }, [config?.duration]),
    onClick: useCallback(() => {
      config?.onClick?.();
    }, [config?.onClick]),
  };

  const style = {
    transform: isPressed ? `scale(${config?.scale || 0.95})` : 'scale(1)',
    transition: `transform ${config?.duration || 150}ms ease-out`,
  };

  return { isPressed, isAnimating, clickProps, style };
};

export const useFocusInteraction = (config?: {
  scale?: number;
  borderColor?: string;
  duration?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const focusProps = {
    onFocus: useCallback(() => {
      setIsFocused(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), config?.duration || 200);
    }, [config?.duration]),
    onBlur: useCallback(() => {
      setIsFocused(false);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), config?.duration || 200);
    }, [config?.duration]),
  };

  const style = {
    transform: isFocused ? `scale(${config?.scale || 1.02})` : 'scale(1)',
    borderColor: isFocused ? config?.borderColor || '#3b82f6' : undefined,
    transition: `transform ${
      config?.duration || 200
    }ms ease-out, border-color ${config?.duration || 200}ms ease-out`,
  };

  return { isFocused, isAnimating, focusProps, style };
};

export const useLoadingAnimation = (
  isLoading: boolean,
  config?: {
    type?: 'spin' | 'pulse' | 'bounce';
    size?: 'sm' | 'md' | 'lg';
  }
) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Small delay to prevent flash for fast operations
      const timer = setTimeout(() => setShowLoader(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  const loaderClasses = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const loaderClass = showLoader
    ? `${loaderClasses[config?.type || 'spin']} ${
        sizeClasses[config?.size || 'md']
      } border-2 border-current border-t-transparent rounded-full`
    : '';

  return { showLoader, loaderClass };
};

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

interface AnimatedButtonProps {
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
  animationType?: 'scale' | 'lift' | 'glow' | 'bounce';
  fullWidth?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
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
      animationType = 'scale',
      fullWidth = false,
    },
    ref
  ) => {
    const { isHovered, hoverProps } = useHoverInteraction({
      scale: animationType === 'scale' ? 1.05 : 1,
      translate: animationType === 'lift' ? { y: -2 } : undefined,
      duration: 200,
    });

    const { isPressed, clickProps } = useClickInteraction({
      scale: 0.98,
      duration: 150,
      onClick,
    });

    const { showLoader, loaderClass } = useLoadingAnimation(loading);

    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
      fullWidth ? 'w-full' : '',
    ];

    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
    };

    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Animation-specific classes
    const animationClasses = {
      scale: isHovered ? 'scale-105' : '',
      lift: isHovered ? '-translate-y-1 shadow-lg' : '',
      glow: isHovered ? 'shadow-lg shadow-blue-500/25' : '',
      bounce: isHovered ? 'animate-bounce' : '',
    };

    const classes = [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      animationClasses[animationType],
      isPressed ? 'scale-95' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        {...hoverProps}
        {...clickProps}
      >
        {/* Ripple effect background */}
        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg" />

        {showLoader && <div className={loaderClass} />}

        {!loading && icon && iconPosition === 'left' && (
          <span className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}

        <span className="relative z-10">{children}</span>

        {!loading && icon && iconPosition === 'right' && (
          <span className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  animationType?: 'lift' | 'glow' | 'tilt' | 'bounce';
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  shadow = 'md',
  animationType = 'lift',
  onClick,
}) => {
  const { isHovered, hoverProps } = useHoverInteraction({
    scale: animationType === 'bounce' ? 1.02 : 1,
    translate: animationType === 'lift' ? { y: -4 } : undefined,
    duration: 300,
  });

  const { clickProps } = useClickInteraction({
    scale: 0.98,
    duration: 150,
    onClick,
  });

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

  // Animation-specific classes
  const animationClasses = {
    lift: isHovered ? 'shadow-xl -translate-y-2' : '',
    glow: isHovered ? 'shadow-xl shadow-blue-500/25 ring-2 ring-blue-500/20' : '',
    tilt: isHovered ? 'rotate-1 shadow-lg' : '',
    bounce: isHovered ? 'animate-pulse shadow-lg' : '',
  };

  const classes = [
    'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
    paddingClasses[padding],
    shadowClasses[shadow],
    'transition-all duration-300 ease-out',
    hover ? 'cursor-pointer' : '',
    animationClasses[animationType],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...(hover ? hoverProps : {})} {...(onClick ? clickProps : {})}>
      {children}
    </div>
  );
};

interface AnimatedInputProps {
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
  animationType?: 'focus' | 'glow' | 'lift';
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
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
  animationType = 'focus',
}) => {
  const { isFocused, focusProps } = useFocusInteraction({
    scale: animationType === 'lift' ? 1.02 : 1,
    duration: 200,
  });

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  // Animation-specific classes
  const animationClasses = {
    focus: isFocused ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-500' : '',
    glow: isFocused ? 'shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20' : '',
    lift: isFocused ? 'shadow-md -translate-y-1' : '',
  };

  const inputClasses = [
    'w-full rounded-lg border transition-all duration-200',
    'focus:outline-none',
    error ? 'border-red-300' : 'border-gray-300',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
    sizeClasses[size],
    animationClasses[animationType],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium transition-colors duration-200 ${
            isFocused ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...focusProps}
        />

        {/* Focus indicator */}
        <div
          className={`absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-200 ${
            isFocused ? 'w-full' : 'w-0'
          }`}
        />
      </div>

      {error && <p className="text-sm text-red-600 animate-fade-in">{error}</p>}
    </div>
  );
};

// =============================================================================
// ANIMATED ICONS & INDICATORS
// =============================================================================

interface AnimatedIconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animationType?: 'spin' | 'pulse' | 'bounce' | 'wiggle' | 'heartbeat';
  className?: string;
  onClick?: () => void;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  size = 'md',
  animationType,
  className = '',
  onClick,
}) => {
  const { hoverProps } = useHoverInteraction({ scale: 1.1, duration: 200 });

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const animationClasses = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    heartbeat: 'animate-heartbeat',
  };

  const classes = [
    sizeClasses[size],
    animationType ? animationClasses[animationType] : '',
    'transition-transform duration-200',
    onClick ? 'cursor-pointer hover:scale-110' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...(onClick ? hoverProps : {})} {...(onClick ? { onClick } : {})}>
      {icon}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'green' | 'red';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const colorClasses = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface SuccessIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessIndicator: React.FC<SuccessIndicatorProps> = ({
  size = 'md',
  className = '',
  autoHide = false,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!visible) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`animate-success-check ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-green-500"
      >
        <path d="M20 6L9 17L4 12" />
      </svg>
    </div>
  );
};

// =============================================================================
// ANIMATED FEEDBACK COMPONENTS
// =============================================================================

interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconClasses = {
    success: 'text-green-500',
    error: 'text-red-600',
    warning: 'text-yellow-500',
    info: 'text-blue-600',
  };

  if (!visible) return null;

  return (
    <div
      className={`animate-slide-in-right p-4 rounded-lg border ${typeClasses[type]} ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 ${iconClasses[type]}`}>
          {/* Icon based on type */}
          {type === 'success' && (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="flex-shrink-0 ml-auto text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// ANIMATED PROGRESS COMPONENTS
// =============================================================================

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
  animated?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  color = 'blue',
  size = 'md',
  showPercentage = false,
  className = '',
  animated = true,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div
      className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <div
        className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out ${
          animated ? 'animate-progress-fill' : ''
        }`}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      >
        {showPercentage && progress > 10 && (
          <div className="flex items-center justify-end h-full pr-2">
            <span className="text-xs font-medium text-white">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CUSTOM CSS ANIMATIONS (to be added to CSS)
// =============================================================================

/*
Add these CSS animations to your stylesheet:

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes success-check {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--progress-width, 0%); }
}

.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-fade-out { animation: fade-out 0.3s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-heartbeat { animation: heartbeat 1s ease-in-out infinite; }
.animate-success-check { animation: success-check 0.6s ease-out; }
.animate-progress-fill { animation: progress-fill 0.5s ease-out; }
*/

// =============================================================================
// EXPORT ALL ANIMATED COMPONENTS
// =============================================================================

export default {
  animationUtils,
  useHoverInteraction,
  useClickInteraction,
  useFocusInteraction,
  useLoadingAnimation,
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedIcon,
  LoadingSpinner,
  SuccessIndicator,
  ToastNotification,
  AnimatedProgressBar,
};
