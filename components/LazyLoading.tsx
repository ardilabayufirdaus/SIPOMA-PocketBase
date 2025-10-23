/**
 * Utility untuk standard lazy loading pattern
 * File ini menyediakan pattern konsisten dan cara yang aman
 * untuk lazy loading komponen di aplikasi
 */

import React, { lazy, ComponentType, LazyExoticComponent, Suspense } from 'react';
// Use the simpler error boundary
import SimpleErrorBoundary from './SimpleErrorBoundary';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Interface untuk komponen yang menggunakan lazy loading
 */
export interface LazyComponentOptions<P = any> {
  /** Path import file komponen */
  importPath: string;
  /** Nama komponen untuk debugging */
  displayName: string;
  /** Fallback saat loading */
  loadingFallback?: React.ReactNode;
  /** Fallback saat terjadi error */
  errorFallback?: React.ReactNode;
  /** Timeout dalam ms sebelum menganggap loading terlalu lama (0 = no timeout) */
  timeoutMs?: number;
  /** Handler untuk error */
  onError?: (error: Error) => void;
  /** Handler untuk retrying loading */
  retryHandler?: () => void;
}

/**
 * Props untuk StandardLazy component
 */
export interface StandardLazyProps {
  [key: string]: any;
}

/**
 * Props untuk SafeLazy component
 */
export interface SafeLazyProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  displayName: string;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

/**
 * Utility untuk diagnostic pada lazy loading error
 *
 * @param error Error yang terjadi
 * @param componentName Nama komponen
 * @param importPath Path import
 */
function diagnoseImportError(error: any, componentName: string, importPath: string): string {
  let diagnosis = `Error loading component ${componentName} from ${importPath}`;

  if (error.message?.includes('Cannot find module')) {
    diagnosis +=
      '\nPossible causes:\n' +
      '- File path is incorrect\n' +
      '- File does not exist\n' +
      '- There might be a typo in the path';
  } else if (error.message?.includes('Invalid module structure')) {
    diagnosis +=
      '\nPossible causes:\n' +
      '- Component does not have a default export\n' +
      '- There might be a name collision with different extensions (.js/.tsx)\n' +
      '- The exported component is not valid';
  }

  return diagnosis;
}

/**
 * Buat lazy component dengan pattern standar
 *
 * @param options Opsi konfigurasi untuk lazy component
 * @returns LazyExoticComponent
 *
 * @example
 * const MyComponent = createStandardLazy({
 *   importPath: './pages/MyComponent',
 *   displayName: 'MyComponent',
 *   loadingFallback: <MyLoadingIndicator />
 * });
 */
export function createStandardLazy<T extends ComponentType<any>>(
  options: LazyComponentOptions
): {
  StandardLazy: React.FC<StandardLazyProps>;
  createSafeLazy: <T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    displayName: string,
    loadingFallback?: React.ReactNode,
    errorFallback?: React.ReactNode
  ) => LazyExoticComponent<T>;
  SafeLazy: React.FC<SafeLazyProps>;
} {
  const {
    importPath,
    displayName,
    loadingFallback = <LoadingSkeleton variant="rectangular" height={200} width="100%" />,
    errorFallback = (
      <div className="p-4 border border-red-300 rounded bg-red-50 text-center">
        <p className="font-medium text-red-700">Failed to load {displayName}</p>
        <p className="text-sm">Please refresh the page</p>
      </div>
    ),
    onError,
    timeoutMs = 0,
  } = options;

  // Buat factory function yang aman
  const safeFactory = () => {
    // Untuk production build, ubah path menggunakan alias yang terdefinisi di vite.config
    // Dan hilangkan ekstensi .tsx
    let finalPath = importPath;
    if (importPath.includes('/pages/')) {
      finalPath = importPath.replace(/^.*\/pages\//, '@pages/');
    } else if (importPath.includes('/features/')) {
      finalPath = importPath.replace(/^.*\/features\//, '@features/');
    }
    finalPath = finalPath.replace(/\.tsx$/, '');

    console.log(`Loading component ${displayName} from path: ${finalPath}`);
    return import(/* @vite-ignore */ finalPath)
      .then((module) => {
        // Validasi module
        if (!module || typeof module !== 'object') {
          const error = new Error(
            `Invalid module structure for ${displayName}: module is not an object`
          );
          if (onError) onError(error);
          throw error;
        }

        if (!module.default) {
          const error = new Error(
            `Invalid module structure for ${displayName}: missing default export`
          );
          if (onError) onError(error);
          throw error;
        }

        return module;
      })
      .catch((error) => {
        // Diagnostic logging
        const diagnosis = diagnoseImportError(error, displayName, importPath);

        // Forward to error handler
        if (onError) onError(error);

        // Create fallback component
        return {
          default: (() => {
            const FallbackComponent: React.FC = () => {
              return React.isValidElement(errorFallback) ? (
                errorFallback
              ) : (
                <div className="p-4 border border-red-300 rounded bg-red-50">
                  <p className="font-medium text-red-700">Failed to load {displayName}</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              );
            };

            // Set display name for debugging
            FallbackComponent.displayName = `${displayName}ErrorFallback`;
            return FallbackComponent;
          })() as unknown as T,
        };
      });

    // Create lazy component with timeout handler if specified
    const LazyComponent = lazy(safeFactory);

    // Set display name for debugging (if supported)
    if (LazyComponent && typeof LazyComponent === 'object') {
      (LazyComponent as any).displayName = `StandardLazy(${displayName})`;
    }

    return LazyComponent as LazyExoticComponent<T>;
  };

  // Return object with all utilities
  return {
    StandardLazy,
    createSafeLazy,
    SafeLazy,
  };
}
