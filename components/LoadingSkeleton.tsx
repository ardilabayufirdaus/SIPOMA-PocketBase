import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses =
    "animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%]";

  const getVariantClasses = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded-md";
      case "text":
      default:
        return "rounded";
    }
  };

  const getSize = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height)
      style.height = typeof height === "number" ? `${height}px` : height;

    if (!width && !height) {
      switch (variant) {
        case "circular":
          style.width = "40px";
          style.height = "40px";
          break;
        case "rectangular":
          style.width = "100%";
          style.height = "20px";
          break;
        case "text":
        default:
          style.width = "100%";
          style.height = "16px";
          break;
      }
    }
    return style;
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} mb-2 last:mb-0`}
            style={{
              ...getSize(),
              width: index === lines - 1 ? "75%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getSize()}
    />
  );
};

// Page Loading Component
export const PageLoading: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

// Table Skeleton Components
export const UserTableSkeleton: React.FC = () => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          {[
            "User",
            "Role",
            "Department",
            "Status",
            "Last Active",
            "Actions",
          ].map((header, i) => (
            <th
              key={i}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 8 }).map((_, i) => (
          <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: 6 }).map((_, j) => (
              <td key={j} className="px-6 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Card Skeleton Component
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}
  >
    <div className="mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2" />
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4" />
    </div>
  </div>
);

// Loading Spinner Component
export const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]} ${className}`}
    />
  );
};

export default LoadingSkeleton;
