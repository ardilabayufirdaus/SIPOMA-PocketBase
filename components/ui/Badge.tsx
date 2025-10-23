import React from 'react';
import { designSystem } from '../../utils/designSystem';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'base' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'base',
  className = '',
}) => {
  const badgeConfig = designSystem.componentVariants.badge;
  const sizeConfig = badgeConfig.sizes[size];
  const variantConfig = badgeConfig.variants[variant];

  const baseClasses = 'inline-flex items-center font-semibold rounded-full border';

  const style = {
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    paddingTop: sizeConfig.paddingY,
    paddingBottom: sizeConfig.paddingY,
    fontSize: sizeConfig.fontSize,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: variantConfig.background,
    color: variantConfig.color,
    borderColor: variantConfig.border,
  };

  return (
    <span className={`${baseClasses} ${className}`} style={style}>
      {children}
    </span>
  );
};

export default Badge;

