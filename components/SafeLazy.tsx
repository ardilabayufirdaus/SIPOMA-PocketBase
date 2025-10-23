import React, { lazy, ComponentType, LazyExoticComponent, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Wrapper untuk membuat lazy component dengan error handling dan loading fallback
 * @param factory Factory function yang mengembalikan dynamic import
 * @param displayName Nama komponen untuk debugging
 * @param loadingFallback Komponen loading fallback (opsional)
 * @param errorFallback Komponen error fallback (opsional)
 */
export function createSafeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  displayName: string,
  loadingFallback?: React.ReactNode,
  errorFallback?: React.ReactNode
): LazyExoticComponent<T> {
  // Pastikan factory selalu mengembalikan object dengan property default yang valid
  const safeFactory = () =>
    factory()
      .then((module) => {
        // Validasi module
        if (!module || typeof module !== 'object' || !module.default) {
          throw new Error(`Invalid module structure for ${displayName}`);
        }
        return module;
      })
      .catch((error) => {
        console.error(`Error loading component ${displayName}:`, error);
        return {
          default: (() => {
            const FallbackComponent = () => (
              <div className="p-4 border border-red-300 rounded bg-red-50 text-center">
                {errorFallback || (
                  <>
                    <p className="font-medium">Failed to load {displayName}</p>
                    <p className="text-sm">Please try refreshing the page</p>
                  </>
                )}
              </div>
            );
            // Set display name for debugging
            FallbackComponent.displayName = `${displayName}ErrorFallback`;
            return FallbackComponent;
          })() as unknown as T,
        };
      });

  // Buat lazy component
  const LazyComponent = lazy(safeFactory);

  // Set display name untuk debugging (if supported)
  if (LazyComponent && typeof LazyComponent === 'object') {
    (LazyComponent as any).displayName = `SafeLazy(${displayName})`;
  }

  return LazyComponent;
}

/**
 * Wrapper component untuk render lazy component dengan error boundary dan suspense
 */
interface SafeLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const SafeLazy: React.FC<SafeLazyProps> = ({
  children,
  fallback = <div className="p-4 text-center">Loading...</div>,
  errorFallback = <div className="p-4 text-center">An error occurred</div>,
}) => (
  <ErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

