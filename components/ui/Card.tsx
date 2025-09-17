/**
 * Konsisten Card Component
 * Menggunakan design system untuk konsistensi UI/UX
 */

import React from 'react';
import { getCardClasses, getAriaProps, cn } from '../../utils/uiUtils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
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
  const cardClasses = getCardClasses(variant, padding);
  const ariaProps = getAriaProps(ariaLabel, ariaDescribedBy);

  const finalClasses = cn(
    cardClasses,
    className,
    onClick && 'cursor-pointer hover:shadow-md transition-shadow'
  );

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
  return (
    <div className={cn('pb-4 border-b border-slate-200 dark:border-slate-700', className)}>
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
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('pt-4 border-t border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
};

export default Card;
