import React from 'react';

interface ModernButtonProps {
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
}

export const ModernButton: React.FC<ModernButtonProps> = ({
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
}) => {
  const baseClasses = 'btn-modern';

  const variantClasses = {
    primary: 'btn-modern-primary',
    secondary: 'btn-modern-secondary',
    ghost:
      'bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700',
  };

  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? 'opacity-60 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled || loading}>
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && icon && iconPosition === 'left' && <span className="w-4 h-4">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="w-4 h-4">{icon}</span>}
    </button>
  );
};

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  hover = true,
  glass = false,
}) => {
  const baseClasses = glass ? 'glass-modern' : 'card-modern';
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  const classes = [baseClasses, hoverClasses, className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
};

interface ModernCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardHeader: React.FC<ModernCardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`card-modern-header ${className}`}>{children}</div>;
};

interface ModernCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardContent: React.FC<ModernCardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card-modern-content ${className}`}>{children}</div>;
};

interface ModernCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCardFooter: React.FC<ModernCardFooterProps> = ({ children, className = '' }) => {
  return <div className={`card-modern-footer ${className}`}>{children}</div>;
};

interface ModernInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  error,
  label,
  required = false,
  className = '',
}) => {
  const inputClasses = [
    'input-modern',
    error ? 'border-red-500 focus:border-red-500' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
        className={inputClasses}
        required={required}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};

interface ModernBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const ModernBadge: React.FC<ModernBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'badge-modern';

  const variantClasses = {
    success: 'badge-modern-success',
    warning: 'badge-modern-warning',
    error: 'badge-modern-error',
    info: 'badge-modern-info',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
  };

  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
};

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'md',
  className = '',
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="modal-overlay-modern" onClick={onClose}>
      <div
        className={`modal-content-modern ${maxWidthClasses[maxWidth]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

interface ModernLoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export const ModernLoadingSkeleton: React.FC<ModernLoadingSkeletonProps> = ({
  className = '',
  lines = 1,
  height = '1rem',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="loading-skeleton-modern" style={{ height }} />
      ))}
    </div>
  );
};

interface ModernTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const ModernTooltip: React.FC<ModernTooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div
        className={`
          absolute z-50 px-2 py-1 text-xs text-white bg-neutral-900 rounded
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none whitespace-nowrap
          ${positionClasses[position]}
        `}
      >
        {content}
      </div>
    </div>
  );
};

interface ModernSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'neutral';
  className?: string;
}

export const ModernSpinner: React.FC<ModernSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    neutral: 'border-neutral-600',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        border-2 border-t-transparent rounded-full animate-spin
        ${className}
      `}
    />
  );
};

// Export all components
export default {
  ModernButton,
  ModernCard,
  ModernCardHeader,
  ModernCardContent,
  ModernCardFooter,
  ModernInput,
  ModernBadge,
  ModernModal,
  ModernLoadingSkeleton,
  ModernTooltip,
  ModernSpinner,
};
