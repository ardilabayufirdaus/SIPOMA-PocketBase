import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { PermissionGuard, PermissionGuardProps } from '../utils/permissions';
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

// Mock admin user
const mockAdminUser: User = {
  ...mockUser,
  role: 'Super Admin',
};

// Test helper untuk render PermissionGuard
const renderPermissionGuard = (props: Partial<PermissionGuardProps>) => {
  const defaultProps: PermissionGuardProps = {
    user: mockUser,
    feature: 'dashboard',
    requiredLevel: 'READ',
    children: <div data-testid="protected-content">Protected Content</div>,
    fallback: <div data-testid="fallback-content">Access Denied</div>,
  };

  return render(<PermissionGuard {...defaultProps} {...props} />);
};

describe('PermissionGuard Component', () => {
  test('renders children when user has permission', async () => {
    renderPermissionGuard({ feature: 'dashboard' });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
  });

  test('renders fallback when user does not have permission', async () => {
    renderPermissionGuard({ feature: 'inspection' });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
  });

  test('renders children for admin user regardless of permissions', async () => {
    renderPermissionGuard({ user: mockAdminUser, feature: 'inspection' });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('handles plant operation permissions correctly', async () => {
    renderPermissionGuard({
      feature: 'plant_operations',
      category: 'category1',
      unit: 'unit1',
    });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('handles null user correctly', async () => {
    renderPermissionGuard({ user: null });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
  });

  test('handles missing permissions correctly', async () => {
    const userWithoutPermissions = {
      ...mockUser,
      permissions: {
        ...mockUser.permissions,
        dashboard: 'NONE' as const,
      },
    };

    renderPermissionGuard({ user: userWithoutPermissions });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
  });

  // Test untuk verifikasi bahwa children invalid dapat ditangani dengan benar
  test('handles invalid children object gracefully', async () => {
    // Suppress expected console errors
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Render dengan invalid children
    render(
      <PermissionGuard
        user={mockUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div>Fallback</div>}
      >
        {/* @ts-expect-error - we're deliberately using invalid children */}
        {{ someObject: 'invalid children' }}
      </PermissionGuard>
    );

    // Seharusnya menampilkan fallback untuk invalid component
    expect(screen.getByText(/Invalid component/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // Test untuk verifikasi lazy component
  test('handles lazy-loaded components correctly', async () => {
    const LazyComponent = React.lazy(() =>
      Promise.resolve({
        default: () => <div data-testid="lazy-loaded">Lazy Loaded Content</div>,
      })
    );

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <PermissionGuard user={mockUser} feature="dashboard" requiredLevel="READ">
          <LazyComponent />
        </PermissionGuard>
      </React.Suspense>
    );

    // Wait for lazy component to load
    const lazyContent = await screen.findByTestId('lazy-loaded');
    expect(lazyContent).toBeInTheDocument();
  });

  // Test untuk render component dengan element sebagai children
  test('handles element component as children correctly', async () => {
    render(
      <PermissionGuard user={mockUser} feature="dashboard" requiredLevel="READ">
        <div data-testid="element-component">Element Component</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('element-component')).toBeInTheDocument();
  });
});
