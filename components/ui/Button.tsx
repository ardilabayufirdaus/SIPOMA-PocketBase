import React from "react";
import { designSystem } from "../../utils/designSystem";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "outline"
    | "ghost";
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "base",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  onClick,
  ...props
}) => {
  const variantConfig = designSystem.buttonVariants.variants[variant];
  const sizeConfig = designSystem.buttonVariants.sizes[size];

  const baseClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "font-medium",
    "transition-all",
    "duration-200",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    "focus:ring-opacity-50",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getVariantClasses = () => {
    if (disabled || loading) {
      return [
        "bg-gray-100",
        "text-gray-400",
        "border-gray-200",
        "cursor-not-allowed",
      ].join(" ");
    }

    switch (variant) {
      case "primary":
        return [
          "bg-red-600",
          "hover:bg-red-700",
          "active:bg-red-800",
          "text-white",
          "border-transparent",
          "focus:ring-red-500",
          "shadow-sm",
        ].join(" ");

      case "secondary":
        return [
          "bg-gray-100",
          "hover:bg-gray-200",
          "active:bg-gray-300",
          "text-gray-900",
          "border-gray-300",
          "focus:ring-gray-500",
        ].join(" ");

      case "success":
        return [
          "bg-green-600",
          "hover:bg-green-700",
          "active:bg-green-800",
          "text-white",
          "border-transparent",
          "focus:ring-green-500",
          "shadow-sm",
        ].join(" ");

      case "warning":
        return [
          "bg-yellow-500",
          "hover:bg-yellow-600",
          "active:bg-yellow-700",
          "text-white",
          "border-transparent",
          "focus:ring-yellow-500",
          "shadow-sm",
        ].join(" ");

      case "error":
        return [
          "bg-red-600",
          "hover:bg-red-700",
          "active:bg-red-800",
          "text-white",
          "border-transparent",
          "focus:ring-red-500",
          "shadow-sm",
        ].join(" ");

      case "outline":
        return [
          "bg-transparent",
          "hover:bg-gray-50",
          "active:bg-gray-100",
          "text-gray-700",
          "border-gray-300",
          "focus:ring-gray-500",
          "border",
        ].join(" ");

      case "ghost":
        return [
          "bg-transparent",
          "hover:bg-gray-100",
          "active:bg-gray-200",
          "text-gray-700",
          "border-transparent",
          "focus:ring-gray-500",
        ].join(" ");

      default:
        return "";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "px-2 py-1 text-xs rounded-sm";
      case "sm":
        return "px-3 py-1.5 text-sm rounded";
      case "base":
        return "px-4 py-2 text-base rounded-md";
      case "lg":
        return "px-6 py-3 text-lg rounded-lg";
      case "xl":
        return "px-8 py-4 text-xl rounded-xl";
      default:
        return "px-4 py-2 text-base rounded-md";
    }
  };

  const finalClassName = [
    baseClasses,
    getVariantClasses(),
    getSizeClasses(),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      className={finalClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className={`animate-spin -ml-1 mr-2 ${
            size === "xs"
              ? "h-3 w-3"
              : size === "sm"
              ? "h-4 w-4"
              : size === "lg"
              ? "h-5 w-5"
              : size === "xl"
              ? "h-6 w-6"
              : "h-4 w-4"
          } text-current`}
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
        <span className={`inline-flex ${children ? "mr-2" : ""}`}>
          {leftIcon}
        </span>
      )}

      {children}

      {!loading && rightIcon && (
        <span className={`inline-flex ${children ? "ml-2" : ""}`}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};

// Specific button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="primary" {...props} />;

export const SecondaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="secondary" {...props} />;

export const SuccessButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="success" {...props} />;

export const WarningButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="warning" {...props} />;

export const ErrorButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="error" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="outline" {...props} />;

export const GhostButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="ghost" {...props} />
);

export default Button;
