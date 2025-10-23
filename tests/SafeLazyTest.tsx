import React from 'react';
import { render, screen } from '@testing-library/react';
import { createSafeLazy, SafeLazy } from '../components/SafeLazy';
import { PermissionGuard } from '../utils/permissions';
import type { User, PlantOperationsPermissions } from '../types';

// Mock user for testing permission guard
const mockUser = {
  id: 'test-user',
  username: 'testuser',
  email: 'test@example.com',
  role: 'Super Admin' as const,
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  permissions: {
    dashboard: 'READ' as const,
    plant_operations: {} as PlantOperationsPermissions,
    inspection: 'NONE' as const,
    project_management: 'NONE' as const,
  },
  full_name: 'Test User',
} as User;

// Create a problematic component that would cause the error
const createProblematicComponent = () => {
  const obj = {
    toString: () => {
      throw new Error('Cannot convert object to primitive value');
    },
  };

  const BrokenComponent = () => {
    // This will trigger the error when React tries to stringify props
    const brokenProp = obj;

    return <div data-broken={brokenProp}>This will break</div>;
  };

  return BrokenComponent;
};

// Test for normal lazy component
const NormalComponent = createSafeLazy(
  () => import('../components/LoadingSkeleton').then((module) => ({ default: module.default })),
  'NormalComponent',
  <div>Loading normal component...</div>,
  <div>Error loading normal component</div>
);

// Test for problematic component
const ProblematicLazy = createSafeLazy(
  () =>
    new Promise<{ default: React.ComponentType<Record<string, unknown>> }>((resolve) => {
      setTimeout(() => {
        resolve({ default: createProblematicComponent() });
      }, 100);
    }),
  'ProblematicComponent',
  <div>Loading problematic component...</div>,
  <div>Error loading problematic component</div>
);

describe('SafeLazy Component', () => {
  test('renders normal component without errors', async () => {
    render(
      <SafeLazy fallback={<div>Loading...</div>}>
        <NormalComponent variant="rectangular" height={100} width={100} />
      </SafeLazy>
    );

    // First we should see the loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for component to load
    const loadedComponent = await screen.findByRole('img', {}, { timeout: 2000 });
    expect(loadedComponent).toBeInTheDocument();
  });

  test('handles problematic components with proper error boundary', async () => {
    render(
      <SafeLazy
        fallback={<div>Loading problematic...</div>}
        errorFallback={<div>Error caught by SafeLazy</div>}
      >
        <ProblematicLazy />
      </SafeLazy>
    );

    // First we should see the loading state
    expect(screen.getByText('Loading problematic...')).toBeInTheDocument();

    // The error should be caught and the fallback shown
    const errorElement = await screen.findByText('Error caught by SafeLazy', {}, { timeout: 2000 });
    expect(errorElement).toBeInTheDocument();
  });

  test('PermissionGuard safely renders lazy components', async () => {
    render(
      <PermissionGuard
        user={mockUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div>No permission</div>}
      >
        <SafeLazy>
          <NormalComponent variant="rectangular" height={100} width={100} />
        </SafeLazy>
      </PermissionGuard>
    );

    // Since the user has permission, component should render
    const loadedComponent = await screen.findByRole('img', {}, { timeout: 2000 });
    expect(loadedComponent).toBeInTheDocument();
  });

  test('PermissionGuard handles problematic components without crashing', async () => {
    render(
      <PermissionGuard
        user={mockUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div>No permission</div>}
      >
        <SafeLazy errorFallback={<div>Error in lazy component</div>}>
          <ProblematicLazy />
        </SafeLazy>
      </PermissionGuard>
    );

    // The error should be caught and the fallback shown
    const errorElement = await screen.findByText('Error in lazy component', {}, { timeout: 2000 });
    expect(errorElement).toBeInTheDocument();
  });
});

