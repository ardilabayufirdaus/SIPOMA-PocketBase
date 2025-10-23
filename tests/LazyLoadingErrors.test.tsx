import React from 'react';
import { render, screen } from '@testing-library/react';
import { lazy, Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

// Test untuk mendeteksi issue "Cannot convert object to primitive value"
describe('Lazy Loading Error Tests', () => {
  // Helper function untuk simulasi error yang terjadi
  const createBrokenLazyComponent = () => {
    return lazy(
      () =>
        // Mengembalikan objek dengan format yang salah
        Promise.resolve({
          // Tidak menyertakan default property yang valid
          // Ini akan menyebabkan error saat React mencoba me-render
          someData: { foo: 'bar' },
        }) as any
    );
  };

  // Helper function untuk simulasi lazy component yang benar
  const createValidLazyComponent = () => {
    return lazy(() =>
      Promise.resolve({
        // Menyediakan default export yang valid
        default: () => <div data-testid="valid-component">Valid Component</div>,
      })
    );
  };

  test('catches error when lazy component returns invalid module format', async () => {
    // Suppress console errors
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const BrokenComponent = createBrokenLazyComponent();

    // Render broken component dalam ErrorBoundary
    // Kita mengharapkan ErrorBoundary akan menangkap error
    render(
      <ErrorBoundary fallback={<div data-testid="error-fallback">Error occurred</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <BrokenComponent />
        </Suspense>
      </ErrorBoundary>
    );

    // Karena error terjadi, fallback ErrorBoundary harus ditampilkan
    // Wait for error boundary to catch the error
    await screen.findByTestId('error-fallback');

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('renders valid lazy component successfully', async () => {
    const ValidComponent = createValidLazyComponent();

    render(
      <ErrorBoundary fallback={<div data-testid="error-fallback">Error occurred</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <ValidComponent />
        </Suspense>
      </ErrorBoundary>
    );

    // Component should render successfully
    const validComponent = await screen.findByTestId('valid-component');
    expect(validComponent).toBeInTheDocument();
  });
});

