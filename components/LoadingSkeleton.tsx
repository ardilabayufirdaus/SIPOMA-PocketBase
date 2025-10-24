import React from 'react';
import { getColor, getBorderRadius } from '../utils/designTokens';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses =
    'animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%]';

  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getSize = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (!width && !height) {
      switch (variant) {
        case 'circular':
          style.width = '40px';
          style.height = '40px';
          break;
        case 'rectangular':
          style.width = '100%';
          style.height = '20px';
          break;
        case 'text':
        default:
          style.width = '100%';
          style.height = '16px';
          break;
      }
    }
    return style;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} mb-2 last:mb-0`}
            style={{
              ...getSize(),
              width: index === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={`${baseClasses} ${getVariantClasses()} ${className}`} style={getSize()} />;
};

// Page Loading Component
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
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
          {['User', 'Role', 'Department', 'Status', 'Last Active', 'Actions'].map((header, i) => (
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
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]} ${className}`}
    />
  );
};

// Skeleton Presets for Common Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-lg border bg-white dark:bg-gray-800 ${className}`}>
    <LoadingSkeleton variant="text" height="24px" className="mb-4" />
    <LoadingSkeleton variant="rectangular" height="120px" className="mb-4" />
    <div className="flex space-x-2">
      <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
      <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => (
  <div
    className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}
  >
    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton key={i} variant="text" height="16px" />
        ))}
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton key={colIndex} variant="text" height="14px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number; className?: string }> = ({
  fields = 3,
  className = '',
}) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <LoadingSkeleton variant="text" width="120px" height="16px" />
        <LoadingSkeleton variant="rectangular" height="40px" />
      </div>
    ))}
    <div className="flex space-x-3">
      <LoadingSkeleton variant="rectangular" width="100px" height="40px" />
      <LoadingSkeleton variant="rectangular" width="100px" height="40px" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg border ${className}`}>
    <LoadingSkeleton variant="text" height="24px" width="200px" className="mb-4" />
    <LoadingSkeleton variant="rectangular" height="300px" />
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
      >
        <LoadingSkeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" height="16px" width="60%" />
          <LoadingSkeleton variant="text" height="14px" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
