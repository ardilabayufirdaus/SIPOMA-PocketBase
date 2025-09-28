import { Suspense } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Generic lazy chart wrapper untuk mengurangi bundle size
 * Menggunakan Suspense untuk lazy loading chart components
 */

interface LazyChartWrapperProps {
  chartType: string;
  fallbackHeight?: string;
  children: React.ReactNode;
}

export const LazyChartWrapper = ({
  chartType,
  fallbackHeight = 'h-64',
  children,
}: LazyChartWrapperProps) => (
  <Suspense
    fallback={
      <LoadingSkeleton
        className={`${fallbackHeight} w-full`}
        aria-label={`Loading ${chartType} chart`}
      />
    }
  >
    {children}
  </Suspense>
);

/**
 * Utility untuk membuat lazy-loaded chart components
 * Gunakan ini untuk wrap chart components yang besar
 */
export const withLazyChart = (Component: React.ComponentType, fallbackHeight = 'h-64') => {
  const LazyChartComponent = (props: Record<string, unknown>) => (
    <Suspense fallback={<LoadingSkeleton className={`${fallbackHeight} w-full`} />}>
      <Component {...props} />
    </Suspense>
  );

  LazyChartComponent.displayName = `LazyChart(${Component.displayName || Component.name})`;
  return LazyChartComponent;
};

export default LazyChartWrapper;
