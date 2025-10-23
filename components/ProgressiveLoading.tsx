import React, { useState, useEffect } from 'react';

interface ProgressiveLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minLoadTime?: number;
  className?: string;
}

/**
 * Progressive loading wrapper untuk mencegah layout shift
 * dan memberikan user experience yang lebih smooth
 */
export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  fallback,
  delay = 200,
  minLoadTime = 500,
  className = '',
}) => {
  const [showContent, setShowContent] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay untuk mencegah flash
    const delayTimer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    // Minimum load time untuk UX consistency
    const minTimer = setTimeout(() => {
      if (isReady) {
        setShowContent(true);
      }
    }, minLoadTime);

    // Cleanup function
    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  }, [delay, minLoadTime, isReady]);

  useEffect(() => {
    if (isReady && Date.now() > minLoadTime) {
      setShowContent(true);
    }
  }, [isReady, minLoadTime]);

  if (!showContent) {
    return (
      <div className={`progressive-loading ${className}`}>{fallback || <ContentSkeleton />}</div>
    );
  }

  return <>{children}</>;
};

/**
 * Skeleton components untuk berbagai jenis content
 */
export const ContentSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse space-y-4 ${className}`}>
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="animate-pulse">
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-600 rounded"></div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div
    className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg ${height} flex items-center justify-center`}
  >
    <div className="text-center space-y-2">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto"></div>
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 ${className}`}
  >
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
    </div>

    {/* Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Table */}
    <TableSkeleton />
  </div>
);

/**
 * Hook untuk mendeteksi slow connections
 */
interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

export const useSlowConnection = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Detect slow connection
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      const isSlow =
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        (connection.downlink && connection.downlink < 1.5);
      setIsSlowConnection(isSlow);

      const handleChange = () => {
        const isSlowNow =
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          (connection.downlink && connection.downlink < 1.5);
        setIsSlowConnection(isSlowNow);
      };

      if (connection.addEventListener) {
        connection.addEventListener('change', handleChange);

        return () => {
          if (connection.removeEventListener) {
            connection.removeEventListener('change', handleChange);
          }
        };
      }
    }
  }, []);

  return isSlowConnection;
};

export default ProgressiveLoading;

