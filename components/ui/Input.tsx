import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  warning?: boolean;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      warning,
      helperText,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      leftIcon,
      rightIcon,
      loading = false,
      required = false,
      className = '',
      disabled = false,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value));

    useEffect(() => {
      setHasValue(Boolean(value));
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    // Base styles
    const baseClasses = cn(
      'block transition-all duration-200 ease-out',
      'focus:outline-none',
      fullWidth && 'w-full',
      disabled && 'opacity-60 cursor-not-allowed'
    );

    // Size styles
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    // Variant styles
    const variantClasses = {
      default: cn(
        'bg-white dark:bg-slate-800',
        'border border-slate-300 dark:border-slate-600',
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
      ),
      filled: cn(
        'bg-slate-50 dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-700',
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
      ),
      outlined: cn(
        'bg-transparent',
        'border-2 border-slate-300 dark:border-slate-600',
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
      ),
      minimal: cn(
        'bg-transparent border-b-2 border-slate-300 dark:border-slate-600',
        'focus:border-indigo-500',
        'rounded-none px-0'
      ),
    };

    // State styles
    const stateClasses = cn(
      error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
      success && 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20',
      warning && 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20'
    );

    const inputClasses = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      stateClasses,
      'rounded-lg',
      leftIcon && 'pl-10',
      (rightIcon || loading) && 'pr-10',
      className
    );

    const getIconColor = () => {
      if (error) return 'text-rose-400';
      if (success) return 'text-emerald-400';
      if (warning) return 'text-amber-400';
      return 'text-slate-400';
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth ? 'w-full' : '')}>
        {label && variant !== 'minimal' && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <span className={cn('h-5 w-5 flex items-center justify-center', getIconColor())}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled || loading}
            className={inputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            onChange={onChange}
            {...props}
          />

          {(rightIcon || loading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {loading ? (
                <svg
                  className={cn('animate-spin h-5 w-5', getIconColor())}
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
              ) : (
                <span className={cn('h-5 w-5 flex items-center justify-center', getIconColor())}>
                  {rightIcon}
                </span>
              )}
            </div>
          )}

          {/* Floating label effect for minimal variant */}
          {variant === 'minimal' && label && (
            <div
              className={cn(
                'absolute left-0 transition-all duration-200 pointer-events-none',
                hasValue || isFocused
                  ? '-top-5 text-xs text-indigo-600'
                  : 'top-1/2 -translate-y-1/2 text-base text-slate-500'
              )}
            >
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </div>
          )}
        </div>

        {(helperText || error || success) && (
          <div className="ml-1 text-xs">
            {error && <p className="text-rose-500 font-medium">{error}</p>}
            {success && <p className="text-emerald-500 font-medium">{success}</p>}
            {helperText && !error && !success && <p className="text-slate-500">{helperText}</p>}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Specific input variants for common use cases
export const EmailInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => (
    <Input
      ref={ref}
      type="email"
      leftIcon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
      }
      {...props}
    />
  )
);

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => (
    <Input
      ref={ref}
      type="password"
      autoComplete="new-password"
      leftIcon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
      {...props}
    />
  )
);

export const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      {...props}
    />
  )
);

EmailInput.displayName = 'EmailInput';
PasswordInput.displayName = 'PasswordInput';
SearchInput.displayName = 'SearchInput';

export default Input;
