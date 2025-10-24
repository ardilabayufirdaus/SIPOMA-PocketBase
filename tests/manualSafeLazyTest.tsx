/**
 * Test manual untuk memeriksa error "Cannot convert object to primitive value"
 */

// Import createSafeLazy dari components/SafeLazy
import React from 'react';
import { render } from '@testing-library/react';
import { createSafeLazy, SafeLazy } from '../components/SafeLazy';
import { PermissionGuard } from '../utils/permissions';

// Import tipe User untuk testUser
import type { User, UserRole } from '../types';

// Set user for testing
const testUser = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'Super Admin' as UserRole,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  permissions: {
    dashboard: 'READ' as const,
    plant_operations: {} as any, // Untuk simplifikasi tes
    inspection: 'READ' as const,
    project_management: 'READ' as const,
  },
} as User;

// Fungsi untuk membuat objek problematik
const createProblematicObject = () => {
  return {
    toString() {
      throw new Error('Cannot convert object to primitive value');
    },
    valueOf() {
      throw new Error('Cannot convert object to primitive value');
    },
  };
};

// Buat component bermasalah dengan lazy loading
const ProblematicComponent = createSafeLazy(
  () =>
    Promise.resolve({
      default: () => {
        const problemObject = createProblematicObject();
        return <div data-problem={problemObject}>Problematic Component</div>;
      },
    }),
  'ProblematicComponent',
  <div>Loading...</div>,
  <div className="error">Error loading component</div>
);

// Buat component normal dengan lazy loading
const NormalComponent = createSafeLazy(
  () =>
    Promise.resolve({
      default: () => <div>Normal Component</div>,
    }),
  'NormalComponent',
  <div>Loading...</div>,
  <div className="error">Error loading component</div>
);

// Tes manual
function runManualTests() {
  console.log('Running manual tests for SafeLazy and PermissionGuard...');

  // Test 1: SafeLazy dengan component normal
  try {
    console.log('Test 1: Rendering normal component with SafeLazy');
    const { container: container1 } = render(
      <SafeLazy>
        <NormalComponent />
      </SafeLazy>
    );
    console.log('Test 1 result:', container1.innerHTML);
  } catch (error) {
    console.error('Test 1 failed:', error);
  }

  // Test 2: SafeLazy dengan component problematik
  try {
    console.log('Test 2: Rendering problematic component with SafeLazy');
    const { container: container2 } = render(
      <SafeLazy errorFallback={<div>Custom error fallback</div>}>
        <ProblematicComponent />
      </SafeLazy>
    );
    console.log('Test 2 result:', container2.innerHTML);
  } catch (error) {
    console.error('Test 2 failed:', error);
  }

  // Test 3: PermissionGuard dengan SafeLazy
  try {
    console.log('Test 3: Rendering component with PermissionGuard + SafeLazy');
    const { container: container3 } = render(
      <PermissionGuard
        user={testUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div>No permission</div>}
      >
        <SafeLazy>
          <NormalComponent />
        </SafeLazy>
      </PermissionGuard>
    );
    console.log('Test 3 result:', container3.innerHTML);
  } catch (error) {
    console.error('Test 3 failed:', error);
  }

  // Test 4: PermissionGuard dengan component problematik
  try {
    console.log('Test 4: Rendering problematic component with PermissionGuard');
    const { container: container4 } = render(
      <PermissionGuard
        user={testUser}
        feature="dashboard"
        requiredLevel="READ"
        fallback={<div>No permission</div>}
      >
        <SafeLazy>
          <ProblematicComponent />
        </SafeLazy>
      </PermissionGuard>
    );
    console.log('Test 4 result:', container4.innerHTML);
  } catch (error) {
    console.error('Test 4 failed:', error);
  }
}

// Eksekusi tes manual
runManualTests();

// Export fungsi untuk memudahkan penggunaan di aplikasi lain
export { runManualTests };
