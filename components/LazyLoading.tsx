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
): LazyExoticComponent<T> {
  const { importPath, displayName } = options;

  // Create factory function
  const factory = () => import(/* @vite-ignore */ importPath);

  // Create lazy component
  const LazyComponent = lazy(factory);

  // Set display name for debugging
  if (LazyComponent && typeof LazyComponent === 'object') {
    (LazyComponent as any).displayName = `StandardLazy(${displayName})`;
  }

  return LazyComponent as LazyExoticComponent<T>;
}

