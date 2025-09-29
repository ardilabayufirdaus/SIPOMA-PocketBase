/**
 * Enhanced Card Component
 * Modern design system dengan colorful gradients dan interactive effects
 */

import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'elevated'
    | 'outlined'
    | 'filled'
    | 'gradient'
    | 'glass'
    | 'neon'
    | 'floating'
    | 'interactive';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  gradientDirection?: 'fire' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'rainbow';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ariaLabel,
  ariaDescribedBy,
  gradientDirection = 'fire',
}) => {
  // Base classes
  const baseClasses = cn(
    'relative rounded-xl transition-all duration-300 transform',
    'border border-gray-200/50 dark:border-gray-700/50',
    onClick && 'cursor-pointer hover:scale-105 active:scale-95'
  );

  // Padding variants
  const paddingVariants = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Variant styles
  const variantStyles = {
    default: cn('bg-white dark:bg-gray-800 shadow-sm', 'hover:shadow-md'),
    elevated: cn('bg-white dark:bg-gray-800 shadow-lift', 'hover:shadow-lift-lg'),
    outlined: cn(
      'bg-transparent border-2 border-primary-200 dark:border-primary-700',
      'hover:border-primary-300 dark:hover:border-primary-600'
    ),
    filled: cn(
      'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
      'shadow-inner'
    ),
    gradient: cn(`bg-gradient-${gradientDirection} text-white shadow-lg`, 'hover:shadow-xl'),
    glass: cn(
      'bg-white/20 dark:bg-gray-800/20 backdrop-blur-md',
      'border border-white/30 dark:border-gray-700/30',
      'shadow-glass hover:bg-white/30 dark:hover:bg-gray-800/30'
    ),
    neon: cn(
      'bg-gray-900 border-2 border-primary-500',
      'shadow-glow-fire hover:shadow-neon',
      'text-white'
    ),
    floating: cn('bg-white dark:bg-gray-800 shadow-lift-lg', 'hover:shadow-lift animate-float'),
    interactive: cn(
      'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
      'border-2 border-transparent bg-clip-padding',
      'hover:from-primary-50 hover:to-secondary-50',
      'dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20',
      'shadow-md hover:shadow-lift'
    ),
  };

  // Combine all classes
  const cardClasses = cn(baseClasses, paddingVariants[padding], variantStyles[variant], className);

  // ARIA props
  const ariaProps = {
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component className={cardClasses} onClick={onClick} {...ariaProps}>
      {/* Gradient overlay for enhanced visual appeal */}
      {variant === 'interactive' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  gradient = false,
}) => {
  return (
    <div
      className={cn(
        'pb-4 border-b border-gray-200/50 dark:border-gray-700/50',
        gradient &&
          'bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 -m-6 mb-4 p-6 rounded-t-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={cn('pt-4', className)}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  gradient = false,
}) => {
  return (
    <div
      className={cn(
        'pt-4 border-t border-gray-200/50 dark:border-gray-700/50',
        gradient &&
          'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 -m-6 mt-4 p-6 rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
