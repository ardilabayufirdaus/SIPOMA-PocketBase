/**
 * Utility untuk membantu debug lazy component yang gagal load
 * - Digunakan sebagai wrapper untuk mendeteksi masalah struktur React.lazy
 * - Menangani error yang terjadi karena object conversion
 */

import { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * Debug fungsi untuk validasi komponen lazy
 * @param Component React Component yang akan divalidasi
 */
export function validateLazyComponent(Component) {
  try {
    // Cek apakah component adalah fungsi
    if (typeof Component !== 'function') {
      console.error('Component is not a function:', typeof Component);
      return false;
    }

    // Cek component properties untuk mendeteksi lazy component
    const hasDisplayName = !!Component.displayName;
    const hasToString = !!Component.toString;

    console.log('Component validation:', {
      type: typeof Component,
      displayName: Component.displayName || '[none]',
      isReactLazy: Component.$$typeof === Symbol.for('react.lazy'),
      hasToString,
    });

    return true;
  } catch (error) {
    console.error('Failed to validate component:', error);
    return false;
  }
}

/**
 * Component untuk debugging Lazy Component
 * Menampilkan error dengan lebih detail untuk mempermudah diagnosa
 */
export function DebugLazyComponent({ component: Component, fallback = 'Loading...' }) {
  if (!Component) {
    return <div className="error-box">No component provided</div>;
  }

  const isValid = validateLazyComponent(Component);

  if (!isValid) {
    return (
      <div className="error-box p-4 bg-red-50 border border-red-300 rounded">
        <h3 className="font-medium text-red-700">Invalid Lazy Component</h3>
        <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
          {JSON.stringify(
            {
              type: typeof Component,
              constructor: Component?.constructor?.name || 'unknown',
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={(error) => (
        <div className="error-box p-4 bg-red-50 border border-red-300 rounded">
          <h3 className="font-medium text-red-700">Error in Lazy Component</h3>
          <p className="text-sm mt-1">{error?.message || 'Unknown error'}</p>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {error?.stack || 'No stack trace available'}
          </pre>
        </div>
      )}
    >
      <Suspense fallback={<div>{fallback}</div>}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Buat Test Helper untuk mendiagnosis masalah dengan lazy component
 * @param factory Dynamic import factory function
 * @returns Helper function untuk debugging
 */
export function createLazyDebugger(factory) {
  return async () => {
    try {
      console.log('Attempting to load lazy component...');
      const module = await factory();

      console.log('Module loaded:', {
        hasDefault: !!module.default,
        defaultType: typeof module.default,
        keys: Object.keys(module),
      });

      return module;
    } catch (error) {
      console.error('Failed to load lazy component:', error);
      throw error;
    }
  };
}

