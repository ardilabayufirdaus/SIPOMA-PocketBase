/**
 * Konsisten Card Component
 * Menggunakan design system untuk konsistensi UI/UX
 */

import React from 'react';
import { designSystem } from '../../utils/designSystem';
import { getAriaProps, cn } from '../../utils/uiUtils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const cardConfig = designSystem.componentVariants.card;
  const paddingValue = cardConfig.padding[padding];

  const baseClasses = 'bg-white dark:bg-slate-800 rounded-lg border transition-shadow duration-200';
  const variantClasses =
    variant === 'elevated'
      ? 'shadow-md'
      : variant === 'outlined'
        ? 'border-neutral-300'
        : 'shadow-sm';
  const paddingClasses = `p-[${paddingValue}]`;
  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-md' : '';

  const finalClasses = cn(baseClasses, variantClasses, paddingClasses, hoverClasses, className);

  const ariaProps = getAriaProps(ariaLabel, ariaDescribedBy);

  const Component = onClick ? 'button' : 'div';

  return (
    <Component className={finalClasses} onClick={onClick} {...ariaProps}>
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  const spacing = designSystem.spacing;
  return (
    <div
      className={cn(
        `pb-[${spacing[4]}] border-b border-slate-200 dark:border-slate-700`,
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
  const spacing = designSystem.spacing;
  return <div className={cn(`pt-[${spacing[4]}]`, className)}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const spacing = designSystem.spacing;
  return (
    <div
      className={cn(
        `pt-[${spacing[4]}] border-t border-slate-200 dark:border-slate-700`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
