/**
 * Typography Components untuk konsistensi font dan warna
 * Menggunakan design system untuk keterbacaan optimal
 */

import React from 'react';
import { designSystem } from '../../utils/designSystem';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export type { TypographyProps };

// Heading Components
export const H1: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-bold leading-tight';
  const color = designSystem.colors.neutral[900];

  return (
    <h1
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize['5xl'],
        fontWeight: designSystem.typography.fontWeight.extrabold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h1>
  );
};

export const H2: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-bold leading-tight';
  const color = designSystem.colors.neutral[900];

  return (
    <h2
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize['4xl'],
        fontWeight: designSystem.typography.fontWeight.bold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h2>
  );
};

export const H3: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-semibold leading-tight';
  const color = designSystem.colors.neutral[900];

  return (
    <h3
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize['3xl'],
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h3>
  );
};

export const H4: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-semibold leading-tight';
  const color = designSystem.colors.neutral[900];

  return (
    <h4
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize['2xl'],
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h4>
  );
};

export const H5: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-semibold leading-tight';
  const color = designSystem.colors.neutral[900];

  return (
    <h5
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize.xl,
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h5>
  );
};

export const H6: React.FC<TypographyProps> = ({ children, className = '' }) => {
  const baseClasses = 'font-semibold leading-tight uppercase tracking-wider';
  const color = designSystem.colors.neutral[900];

  return (
    <h6
      className={`${baseClasses} ${className}`}
      style={{
        fontSize: designSystem.typography.fontSize.sm,
        fontWeight: designSystem.typography.fontWeight.semibold,
        lineHeight: designSystem.typography.lineHeight.tight,
        color: color,
      }}
    >
      {children}
    </h6>
  );
};

// Body Text Component
interface BodyProps extends TypographyProps {
  size?: 'large' | 'base' | 'small' | 'xs';
  color?: 'primary' | 'secondary' | 'tertiary';
  theme?: 'light' | 'dark';
}

export const Body: React.FC<BodyProps> = ({
  children,
  size = 'base',
  color = 'primary',
  className = '',
  theme = 'light',
}) => {
  const sizeMap = {
    large: designSystem.typography.fontSize.lg,
    base: designSystem.typography.fontSize.base,
    small: designSystem.typography.fontSize.sm,
    xs: designSystem.typography.fontSize.xs,
  };

  const colorMap = {
    primary: designSystem.colors.neutral[900],
    secondary: designSystem.colors.neutral[600],
    tertiary: designSystem.colors.neutral[500],
  };

  return (
    <p
      className={`font-normal leading-relaxed ${className}`}
      style={{
        fontSize: sizeMap[size],
        color: colorMap[color],
      }}
    >
      {children}
    </p>
  );
};

// Link Component
interface LinkProps extends TypographyProps {
  href?: string;
  onClick?: () => void;
  state?: 'default' | 'visited';
  theme?: 'light' | 'dark';
}

export const Link: React.FC<LinkProps> = ({
  children,
  href,
  onClick,
  state = 'default',
  className = '',
  theme = 'light',
}) => {
  const colorMap = {
    default: designSystem.colors.primary[600],
    visited: designSystem.colors.primary[800],
  };

  const Component = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`underline hover:opacity-80 ${className}`}
      style={{
        color: colorMap[state],
      }}
    >
      {children}
    </Component>
  );
};

// Status Text Component
interface StatusTextProps extends TypographyProps {
  status: 'success' | 'warning' | 'error' | 'info';
  theme?: 'light' | 'dark';
}

export const StatusText: React.FC<StatusTextProps> = ({
  children,
  status,
  className = '',
  theme = 'light',
}) => {
  const colorMap = {
    success: designSystem.colors.success[800],
    warning: designSystem.colors.warning[800],
    error: designSystem.colors.error[800],
    info: designSystem.colors.info[800],
  };

  return (
    <span
      className={`font-normal ${className}`}
      style={{
        color: colorMap[status],
      }}
    >
      {children}
    </span>
  );
};

// UI Text Components
interface UITextProps extends TypographyProps {
  variant?: 'label' | 'caption' | 'overline';
  theme?: 'light' | 'dark';
}

export const UIText: React.FC<UITextProps> = ({
  children,
  variant = 'label',
  className = '',
  theme = 'light',
}) => {
  const variantConfig = {
    label: {
      fontSize: designSystem.typography.fontSize.sm,
      fontWeight: designSystem.typography.fontWeight.medium,
      color: designSystem.colors.neutral[600],
    },
    caption: {
      fontSize: designSystem.typography.fontSize.xs,
      fontWeight: designSystem.typography.fontWeight.normal,
      color: designSystem.colors.neutral[500],
    },
    overline: {
      fontSize: designSystem.typography.fontSize.xs,
      fontWeight: designSystem.typography.fontWeight.semibold,
      color: designSystem.colors.neutral[600],
    },
  };

  const config = variantConfig[variant];

  return (
    <span
      className={`${variant === 'overline' ? 'uppercase tracking-wider' : ''} ${className}`}
      style={{
        fontSize: config.fontSize,
        fontWeight: config.fontWeight,
        color: config.color,
      }}
    >
      {children}
    </span>
  );
};

// Accent Text Component
interface AccentTextProps extends TypographyProps {
  variant?: 'primary' | 'success' | 'warning' | 'error';
  theme?: 'light' | 'dark';
}

export const AccentText: React.FC<AccentTextProps> = ({
  children,
  variant = 'primary',
  className = '',
  theme = 'light',
}) => {
  const colorMap = {
    primary: designSystem.colors.primary[600],
    success: designSystem.colors.success[700],
    warning: designSystem.colors.warning[700],
    error: designSystem.colors.error[700],
  };

  return (
    <span
      className={`font-normal ${className}`}
      style={{
        color: colorMap[variant],
      }}
    >
      {children}
    </span>
  );
};

// Default export for backward compatibility
const Typography = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  Link,
  StatusText,
  UIText,
  AccentText,
};

export default Typography;
