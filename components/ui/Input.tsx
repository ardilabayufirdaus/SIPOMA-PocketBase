import React, { forwardRef } from "react";
import { designSystem } from "../../utils/designSystem";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  size?: "sm" | "base" | "lg";
  variant?: "default" | "error" | "success";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      size = "base",
      variant = "default",
      fullWidth = false,
      leftIcon,
      rightIcon,
      loading = false,
      required = false,
      className = "",
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine the variant based on error/success states
    const currentVariant = error ? "error" : success ? "success" : variant;

    const getInputClasses = () => {
      const baseClasses = [
        "block",
        "border",
        "rounded-md",
        "shadow-sm",
        "transition-colors",
        "duration-200",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-offset-1",
        "disabled:bg-gray-50",
        "disabled:text-gray-500",
        "disabled:cursor-not-allowed",
        fullWidth ? "w-full" : "",
        leftIcon ? "pl-10" : "",
        rightIcon || loading ? "pr-10" : "",
      ].filter(Boolean);

      // Size classes
      switch (size) {
        case "sm":
          baseClasses.push("px-3", "py-1.5", "text-sm");
          break;
        case "lg":
          baseClasses.push("px-4", "py-3", "text-lg");
          break;
        case "base":
        default:
          baseClasses.push("px-3", "py-2", "text-base");
          break;
      }

      // Variant classes
      switch (currentVariant) {
        case "error":
          baseClasses.push(
            "border-red-300",
            "bg-red-50",
            "text-red-900",
            "placeholder-red-400",
            "focus:ring-red-500",
            "focus:border-red-500"
          );
          break;
        case "success":
          baseClasses.push(
            "border-green-300",
            "bg-green-50",
            "text-green-900",
            "placeholder-green-400",
            "focus:ring-green-500",
            "focus:border-green-500"
          );
          break;
        case "default":
        default:
          baseClasses.push(
            "border-gray-300",
            "bg-white",
            "text-gray-900",
            "placeholder-gray-400",
            "focus:ring-blue-500",
            "focus:border-blue-500"
          );
          break;
      }

      return baseClasses.join(" ");
    };

    const getLabelClasses = () => {
      const baseClasses = ["block", "text-sm", "font-medium", "mb-1"];

      switch (currentVariant) {
        case "error":
          baseClasses.push("text-red-700");
          break;
        case "success":
          baseClasses.push("text-green-700");
          break;
        case "default":
        default:
          baseClasses.push("text-gray-700");
          break;
      }

      return baseClasses.join(" ");
    };

    const getIconClasses = () => {
      switch (size) {
        case "sm":
          return "h-4 w-4";
        case "lg":
          return "h-6 w-6";
        case "base":
        default:
          return "h-5 w-5";
      }
    };

    const getIconColor = () => {
      switch (currentVariant) {
        case "error":
          return "text-red-400";
        case "success":
          return "text-green-400";
        case "default":
        default:
          return "text-gray-400";
      }
    };

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label htmlFor={inputId} className={getLabelClasses()}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}
            >
              <span className={`${getIconClasses()} ${getIconColor()}`}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled || loading}
            className={`${getInputClasses()} ${className}`}
            {...props}
          />

          {(rightIcon || loading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {loading ? (
                <svg
                  className={`animate-spin ${getIconClasses()} ${getIconColor()}`}
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
              ) : rightIcon ? (
                <span className={`${getIconClasses()} ${getIconColor()}`}>
                  {rightIcon}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-sm text-green-600">{success}</p>
            )}
            {helperText && !error && !success && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Specific input variants for common use cases
export const EmailInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type">
>((props, ref) => (
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
));

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type">
>((props, ref) => (
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
));

export const SearchInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type">
>((props, ref) => (
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
));

EmailInput.displayName = "EmailInput";
PasswordInput.displayName = "PasswordInput";
SearchInput.displayName = "SearchInput";

export default Input;
