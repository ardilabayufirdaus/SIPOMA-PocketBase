import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <div className={`content-container ${className}`}>
      {(title || subtitle || actions) && (
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0 flex-1">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && (
              <div className="flex-shrink-0">
                <div className="button-group button-group-end">{actions}</div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="content-scrollable">{children}</div>
    </div>
  );
};

interface MetricsGridProps {
  children: React.ReactNode;
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  children,
  className = "",
}) => {
  return <div className={`metrics-grid ${className}`}>{children}</div>;
};

interface ContentGridProps {
  children: React.ReactNode;
  variant?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  children,
  variant = "md",
  className = "",
}) => {
  const variantClass = `content-grid-${variant}`;
  return (
    <div className={`content-grid ${variantClass} ${className}`}>
      {children}
    </div>
  );
};

interface CompactCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const CompactCard: React.FC<CompactCardProps> = ({
  children,
  className = "",
  hoverable = true,
}) => {
  return (
    <div
      className={`card-compact ${hoverable ? "hover-lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

interface FormGridProps {
  children: React.ReactNode;
  variant?: "single" | "double";
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  variant = "single",
  className = "",
}) => {
  const variantClass = variant === "double" ? "form-grid-md" : "";
  return (
    <div className={`form-grid ${variantClass} ${className}`}>{children}</div>
  );
};

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = "",
}) => {
  return <div className={`mobile-card ${className}`}>{children}</div>;
};

interface MobileCardFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const MobileCardField: React.FC<MobileCardFieldProps> = ({
  label,
  value,
  className = "",
}) => {
  return (
    <div className={`mobile-card-field ${className}`}>
      <span className="mobile-card-label">{label}</span>
      <span>{value}</span>
    </div>
  );
};

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="content-skeleton h-4 rounded"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
    </div>
  );
};
