import React, { Suspense, lazy } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { PermissionGuard } from '../utils/permissions';
import { User } from '../types';

// Mock user untuk testing
const mockUser = {
  id: 'test-id',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'Guest' as const,
  is_active: true,
  permissions: {
    dashboard: 'READ' as const,
    plant_operations: {
      category1: {
        unit1: 'READ' as const,
      },
    },
    project_management: 'READ' as const,
    inspection: 'READ' as const,
  },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
} as User;

describe('Lazy Loading with PermissionGuard Tests', () => {
  // Helper untuk membuat lazy component yang cacat
  const createMalformedLazyComponent = () => {
    // Sengaja membuat promise yang resolve dengan object invalid
    return lazy(
      () =>
        Promise.resolve({
          // Missing default export property
          someData: { foo: 'bar' },
        }) as any
    );
  };

  // Helper untuk membuat lazy component yang valid
  const createValidLazyComponent = () => {
    return lazy(() =>
      Promise.resolve({
        default: () => <div data-testid="valid-lazy-component">Valid Lazy Component</div>,
      })
    );
  };

  test('PermissionGuard handles malformed lazy components gracefully', async () => {
    // Suppress expected console errors
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const MalformedLazyComponent = createMalformedLazyComponent();

    render(
      <ErrorBoundary fallback={<div data-testid="error-caught">Error boundary caught error</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <PermissionGuard user={mockUser} feature="dashboard" requiredLevel="READ">
            <MalformedLazyComponent />
          </PermissionGuard>
        </Suspense>
      </ErrorBoundary>
    );

    // Wait for error boundary to catch the error
    await screen.findByTestId('error-caught');
    expect(screen.getByTestId('error-caught')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('PermissionGuard works correctly with valid lazy components', async () => {
    const ValidLazyComponent = createValidLazyComponent();

    render(
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <PermissionGuard user={mockUser} feature="dashboard" requiredLevel="READ">
            <ValidLazyComponent />
          </PermissionGuard>
        </Suspense>
      </ErrorBoundary>
    );

    // First we should see the loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Then the component should render
    const validComponent = await screen.findByTestId('valid-lazy-component');
    expect(validComponent).toBeInTheDocument();
  });

  test('PermissionGuard denies access to unauthorized lazy components', async () => {
    const ValidLazyComponent = createValidLazyComponent();

    // Create a user without dashboard access
    const restrictedUser = {
      ...mockUser,
      permissions: {
        ...mockUser.permissions,
        dashboard: 'NONE' as const,
      },
    };

    render(
      <PermissionGuard
        user={restrictedUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div data-testid="access-denied">Access Denied</div>}
      >
        <ValidLazyComponent />
      </PermissionGuard>
    );

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
  });
});
