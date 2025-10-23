/**
 * LazyLoadingFixed - Versi yang dioptimalkan untuk lazy loading components
 * File ini menyediakan pattern konsisten untuk lazy loading komponen
 * dengan pendekatan yang lebih modern dan kompatibel dengan Vite + production build
 */

import React, { lazy, ComponentType, LazyExoticComponent, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

/**
 * Interface untuk options yang digunakan dalam createLazyComponent
 */
export interface LazyComponentOptions {
  /** Nama komponen untuk debugging */
  displayName: string;
  /** Fallback saat loading */
  loadingFallback?: React.ReactNode;
  /** Fallback saat terjadi error */
  errorFallback?: React.ReactNode;
  /** Handler untuk error */
  onError?: (error: Error) => void;
}

/**
 * Buat lazy component dengan factory function langsung
 * Ini lebih aman untuk Vite bundling dan production
 */
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyComponentOptions
): LazyExoticComponent<T> {
  const {
    displayName,
    loadingFallback = <DefaultLoadingFallback />,
    errorFallback = <DefaultErrorFallback name={displayName} />,
    onError,
  } = options;

  // Buat factory function yang aman untuk lazy loading
  const safeFactory = () =>
    factory()
      .then((module) => {
        if (!module || !module.default) {
          const error = new Error(
            `Invalid module structure for ${displayName}: missing default export`
          );
          if (onError) onError(error);
          throw error;
        }
        return module;
      })
      .catch((error) => {
        console.error(`[LazyLoading] Failed to load component ${displayName}:`, error);
        if (onError) onError(error);

        // Return fallback component as default export
        return {
          default: (() => {
            function FallbackComponent() {
              return React.isValidElement(errorFallback) ? (
                errorFallback
              ) : (
                <DefaultErrorFallback name={displayName} error={error.message} />
              );
            }

            FallbackComponent.displayName = `${displayName}ErrorFallback`;
            return FallbackComponent as unknown as T;
          })(),
        };
      });

  // Create lazy component
  const LazyComponent = lazy(safeFactory);

  // Set display name for debugging
  if (LazyComponent && typeof LazyComponent === 'object') {
    (LazyComponent as any).displayName = `Lazy(${displayName})`;
  }

  return LazyComponent;
}

/**
 * Container component untuk lazy loaded components
 * yang menambahkan ErrorBoundary dan Suspense
 */
interface LazyContainerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyContainer({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback = <DefaultErrorFallback />,
}: LazyContainerProps): React.ReactElement {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) =>
        React.isValidElement(errorFallback) ? (
          errorFallback
        ) : (
          <DefaultErrorFallback error={error.message} />
        )
      }
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Default loading fallback
 */
export function DefaultLoadingFallback() {
  return (
    <div className="p-4 border border-gray-300 rounded-md bg-gray-50 animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-3 w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  );
}

/**
 * Default error fallback
 */
interface DefaultErrorFallbackProps {
  name?: string;
  error?: string;
}

export function DefaultErrorFallback({ name = 'component', error }: DefaultErrorFallbackProps) {
  return (
    <div className="p-4 border border-red-300 rounded bg-red-50 text-center">
      <p className="font-medium text-red-700">Failed to load {name}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm mt-2">Please try refreshing the page</p>
    </div>
  );
}

