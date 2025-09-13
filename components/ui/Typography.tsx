/**
 * Typography Components untuk konsistensi font dan warna
 * Menggunakan design system untuk keterbacaan optimal
 */

import React from "react";
import {
  getTextColor,
  getHeadingClasses,
  getBodyClasses,
  getLinkClasses,
  getStatusClasses,
} from "../../utils/typographyUtils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  theme?: "light" | "dark";
}

// Heading Components
export const H1: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(1, "primary", theme);
  return <h1 className={`${classes} ${className}`}>{children}</h1>;
};

export const H2: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(2, "primary", theme);
  return <h2 className={`${classes} ${className}`}>{children}</h2>;
};

export const H3: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(3, "primary", theme);
  return <h3 className={`${classes} ${className}`}>{children}</h3>;
};

export const H4: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(4, "primary", theme);
  return <h4 className={`${classes} ${className}`}>{children}</h4>;
};

export const H5: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(5, "primary", theme);
  return <h5 className={`${classes} ${className}`}>{children}</h5>;
};

export const H6: React.FC<TypographyProps> = ({
  children,
  className = "",
  theme = "light",
}) => {
  const classes = getHeadingClasses(6, "primary", theme);
  return <h6 className={`${classes} ${className}`}>{children}</h6>;
};

// Body Text Components
interface BodyTextProps extends TypographyProps {
  size?: "large" | "base" | "small" | "xs";
  color?: "primary" | "secondary" | "tertiary";
}

export const Body: React.FC<BodyTextProps> = ({
  children,
  size = "base",
  color = "primary",
  className = "",
  theme = "light",
}) => {
  const classes = getBodyClasses(size, color, theme);
  return <p className={`${classes} ${className}`}>{children}</p>;
};

export const Span: React.FC<BodyTextProps> = ({
  children,
  size = "base",
  color = "primary",
  className = "",
  theme = "light",
}) => {
  const classes = getBodyClasses(size, color, theme);
  return <span className={`${classes} ${className}`}>{children}</span>;
};

// Link Component
interface LinkProps extends TypographyProps {
  href?: string;
  onClick?: () => void;
  state?: "default" | "visited";
}

export const Link: React.FC<LinkProps> = ({
  children,
  href,
  onClick,
  state = "default",
  className = "",
  theme = "light",
}) => {
  const classes = getLinkClasses(state, theme);
  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`${classes} underline ${className}`}
    >
      {children}
    </Component>
  );
};

// Status Text Component
interface StatusTextProps extends TypographyProps {
  status: "success" | "warning" | "error" | "info";
}

export const StatusText: React.FC<StatusTextProps> = ({
  children,
  status,
  className = "",
  theme = "light",
}) => {
  const classes = getStatusClasses(status, theme);
  return <span className={`${classes} ${className}`}>{children}</span>;
};

// UI Text Components
interface UITextProps extends TypographyProps {
  variant?: "label" | "caption" | "overline";
}

export const UIText: React.FC<UITextProps> = ({
  children,
  variant = "caption",
  className = "",
  theme = "light",
}) => {
  let classes = "";

  switch (variant) {
    case "label":
      classes = `text-sm font-medium ${getTextColor(
        "secondary",
        undefined,
        theme
      )}`;
      break;
    case "caption":
      classes = `text-xs ${getTextColor("tertiary", undefined, theme)}`;
      break;
    case "overline":
      classes = `text-xs uppercase tracking-wider font-semibold ${getTextColor(
        "secondary",
        undefined,
        theme
      )}`;
      break;
  }

  return <span className={`${classes} ${className}`}>{children}</span>;
};

// White Text for Dark Backgrounds
interface WhiteTextProps extends TypographyProps {
  opacity?: "pure" | "high" | "medium" | "low" | "subtle";
}

export const WhiteText: React.FC<WhiteTextProps> = ({
  children,
  opacity = "pure",
  className = "",
}) => {
  const opacityClasses = {
    pure: "text-white",
    high: "text-white",
    medium: "text-white/90",
    low: "text-white/70",
    subtle: "text-white/50",
  };

  return (
    <span className={`${opacityClasses[opacity]} ${className}`}>
      {children}
    </span>
  );
};

// Accent Text Component
interface AccentTextProps extends TypographyProps {
  variant?: "primary" | "success" | "warning" | "error";
}

export const AccentText: React.FC<AccentTextProps> = ({
  children,
  variant = "primary",
  className = "",
  theme = "light",
}) => {
  const classes = getTextColor("accent", variant, theme);
  return <span className={`${classes} ${className}`}>{children}</span>;
};

export default {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  Span,
  Link,
  StatusText,
  UIText,
  WhiteText,
  AccentText,
};
