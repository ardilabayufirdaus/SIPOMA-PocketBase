import React from 'react';
import { designSystem } from '../../utils/designSystem';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
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
  const buttonConfig = designSystem.componentVariants.button;
  const variantConfig = buttonConfig.variants[variant];
  const sizeConfig = buttonConfig.sizes[size];

  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'active:scale-95',
    fullWidth ? 'w-full' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const getButtonStyles = () => {
    const isDisabled = disabled || loading;
    return {
      backgroundColor: isDisabled ? variantConfig.backgroundDisabled : variantConfig.background,
      color: isDisabled ? variantConfig.colorDisabled : variantConfig.color,
      borderColor: variantConfig.border,
      borderWidth: variantConfig.border !== 'transparent' ? '1px' : '0',
      borderStyle: variantConfig.border !== 'transparent' ? 'solid' : 'none',
      height: sizeConfig.height,
      paddingLeft: sizeConfig.paddingX,
      paddingRight: sizeConfig.paddingX,
      paddingTop: sizeConfig.paddingY,
      paddingBottom: sizeConfig.paddingY,
      fontSize: sizeConfig.fontSize,
      borderRadius: sizeConfig.borderRadius,
      boxShadow: variant === 'primary' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none',
    };
  };

  const getHoverStyles = () => ({
    backgroundColor:
      disabled || loading ? variantConfig.backgroundDisabled : variantConfig.backgroundHover,
  });

  const getFocusStyles = () => ({
    boxShadow: `0 0 0 2px ${variantConfig.focusRing}20, 0 0 0 4px ${variantConfig.focusRing}10`,
  });

  return (
    <button
      className={`${baseClasses} ${className}`}
      style={getButtonStyles()}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getButtonStyles());
        }
      }}
      onFocus={(e) => {
        Object.assign(e.currentTarget.style, getFocusStyles());
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = getButtonStyles().boxShadow || 'none';
      }}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
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
      {!loading && leftIcon && (
        <span className="mr-2" style={{ fontSize: sizeConfig.iconSize }}>
          {leftIcon}
        </span>
      )}
      <span className="flex-1 text-center">{children}</span>
      {!loading && rightIcon && (
        <span className="ml-2" style={{ fontSize: sizeConfig.iconSize }}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
