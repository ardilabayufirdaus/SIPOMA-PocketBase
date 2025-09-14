/**
 * Test file untuk permission system
 * Memverifikasi implementasi role-based access control (RBAC)
 */

import { PermissionChecker } from '../utils/permissions';
import { User, UserRole, PermissionLevel, PermissionMatrix } from '../types';

// Mock users dengan different roles
const mockSuperAdmin: User = {
  id: '1',
  username: 'superadmin',
  full_name: 'Super Admin User',
  role: UserRole.SUPER_ADMIN,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.READ,
    plant_operations: {},
    packing_plant: PermissionLevel.READ,
    project_management: PermissionLevel.READ,
    system_settings: PermissionLevel.READ,
  }
};

const mockViewer: User = {
  id: '2',
  username: 'viewer',
  full_name: 'Viewer User',
  role: UserRole.VIEWER,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.NONE,
    plant_operations: {},
    packing_plant: PermissionLevel.NONE,
    project_management: PermissionLevel.NONE,
    system_settings: PermissionLevel.NONE,
  }
};

const mockAdmin: User = {
  id: '3',
  username: 'admin',
  full_name: 'Admin User',
  role: UserRole.ADMIN,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.WRITE,
    plant_operations: {
      'CCR': {
        'Unit 1': PermissionLevel.WRITE,
        'Unit 2': PermissionLevel.READ,
      }
    },
    packing_plant: PermissionLevel.WRITE,
    project_management: PermissionLevel.WRITE,
    system_settings: PermissionLevel.ADMIN,
  }
};

const mockOperator: User = {
  id: '4',
  username: 'operator',
  full_name: 'Operator User',
  role: UserRole.OPERATOR,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.NONE,
    plant_operations: {
      'CCR': {
        'Unit 1': PermissionLevel.WRITE,
      }
    },
    packing_plant: PermissionLevel.READ,
    project_management: PermissionLevel.NONE,
    system_settings: PermissionLevel.NONE,
  }
};

// Test functions
function testSuperAdminPermissions() {
  console.log('🧪 Testing Super Admin Permissions...\n');

  const checker = new PermissionChecker(mockSuperAdmin);

  // Super Admin should have access to everything
  const tests = [
    { feature: 'dashboard', level: PermissionLevel.READ, expected: true },
    { feature: 'user_management', level: PermissionLevel.READ, expected: true },
    { feature: 'user_management', level: PermissionLevel.WRITE, expected: true },
    { feature: 'user_management', level: PermissionLevel.ADMIN, expected: true },
    { feature: 'plant_operations', level: PermissionLevel.READ, expected: true },
    { feature: 'packing_plant', level: PermissionLevel.READ, expected: true },
    { feature: 'project_management', level: PermissionLevel.READ, expected: true },
    { feature: 'system_settings', level: PermissionLevel.READ, expected: true },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = checker.hasPermission(test.feature as keyof PermissionMatrix, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.feature} ${test.level} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.feature} ${test.level} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Super Admin Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testViewerPermissions() {
  console.log('🧪 Testing Viewer Permissions...\n');

  const checker = new PermissionChecker(mockViewer);

  // Viewer should only have read access to dashboard
  const tests = [
    { feature: 'dashboard', level: PermissionLevel.READ, expected: true },
    { feature: 'dashboard', level: PermissionLevel.WRITE, expected: false },
    { feature: 'user_management', level: PermissionLevel.READ, expected: false },
    { feature: 'plant_operations', level: PermissionLevel.READ, expected: false },
    { feature: 'packing_plant', level: PermissionLevel.READ, expected: false },
    { feature: 'project_management', level: PermissionLevel.READ, expected: false },
    { feature: 'system_settings', level: PermissionLevel.READ, expected: false },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = checker.hasPermission(test.feature as keyof PermissionMatrix, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.feature} ${test.level} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.feature} ${test.level} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Viewer Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testAdminPermissions() {
  console.log('🧪 Testing Admin Permissions...\n');

  const checker = new PermissionChecker(mockAdmin);

  // Admin should have appropriate permissions based on their matrix
  const tests = [
    { feature: 'dashboard', level: PermissionLevel.READ, expected: true },
    { feature: 'user_management', level: PermissionLevel.WRITE, expected: true },
    { feature: 'user_management', level: PermissionLevel.ADMIN, expected: false },
    { feature: 'plant_operations', level: PermissionLevel.READ, expected: true },
    { feature: 'packing_plant', level: PermissionLevel.WRITE, expected: true },
    { feature: 'project_management', level: PermissionLevel.WRITE, expected: true },
    { feature: 'system_settings', level: PermissionLevel.ADMIN, expected: true },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = checker.hasPermission(test.feature as keyof PermissionMatrix, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.feature} ${test.level} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.feature} ${test.level} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Admin Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testOperatorPermissions() {
  console.log('🧪 Testing Operator Permissions...\n');

  const checker = new PermissionChecker(mockOperator);

  // Operator should have limited permissions
  const tests = [
    { feature: 'dashboard', level: PermissionLevel.READ, expected: true },
    { feature: 'user_management', level: PermissionLevel.READ, expected: false },
    { feature: 'plant_operations', level: PermissionLevel.READ, expected: true },
    { feature: 'packing_plant', level: PermissionLevel.READ, expected: true },
    { feature: 'project_management', level: PermissionLevel.READ, expected: false },
    { feature: 'system_settings', level: PermissionLevel.READ, expected: false },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = checker.hasPermission(test.feature as keyof PermissionMatrix, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.feature} ${test.level} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.feature} ${test.level} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Operator Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testPlantOperationSpecificPermissions() {
  console.log('🧪 Testing Plant Operation Specific Permissions...\n');

  const adminChecker = new PermissionChecker(mockAdmin);
  const operatorChecker = new PermissionChecker(mockOperator);

  // Test specific plant operation permissions
  const tests = [
    {
      checker: adminChecker,
      category: 'CCR',
      unit: 'Unit 1',
      level: PermissionLevel.WRITE,
      expected: true,
      description: 'Admin CCR Unit 1 WRITE'
    },
    {
      checker: adminChecker,
      category: 'CCR',
      unit: 'Unit 2',
      level: PermissionLevel.READ,
      expected: true,
      description: 'Admin CCR Unit 2 READ'
    },
    {
      checker: adminChecker,
      category: 'CCR',
      unit: 'Unit 2',
      level: PermissionLevel.WRITE,
      expected: false,
      description: 'Admin CCR Unit 2 WRITE (should fail)'
    },
    {
      checker: operatorChecker,
      category: 'CCR',
      unit: 'Unit 1',
      level: PermissionLevel.WRITE,
      expected: true,
      description: 'Operator CCR Unit 1 WRITE'
    },
    {
      checker: operatorChecker,
      category: 'CCR',
      unit: 'Unit 2',
      level: PermissionLevel.READ,
      expected: false,
      description: 'Operator CCR Unit 2 READ (should fail - no permission)'
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = test.checker.hasPlantOperationPermission(test.category, test.unit, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.description} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.description} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Plant Operation Specific Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testNullUserPermissions() {
  console.log('🧪 Testing Null User Permissions...\n');

  const checker = new PermissionChecker(null);

  // Null user should have no permissions
  const tests = [
    { feature: 'dashboard', level: PermissionLevel.READ, expected: false },
    { feature: 'user_management', level: PermissionLevel.READ, expected: false },
    { feature: 'plant_operations', level: PermissionLevel.READ, expected: false },
    { feature: 'packing_plant', level: PermissionLevel.READ, expected: false },
    { feature: 'project_management', level: PermissionLevel.READ, expected: false },
    { feature: 'system_settings', level: PermissionLevel.READ, expected: false },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = checker.hasPermission(test.feature as keyof PermissionMatrix, test.level);
    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.feature} ${test.level} - PASSED`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.feature} ${test.level} - FAILED (expected ${test.expected}, got ${result})`);
      failed++;
    }
  });

  console.log(`\n📊 Null User Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

// Main test runner
export function runPermissionTests() {
  console.log('🚀 Starting Permission System Tests...\n');

  const results = [
    testSuperAdminPermissions(),
    testViewerPermissions(),
    testAdminPermissions(),
    testOperatorPermissions(),
    testPlantOperationSpecificPermissions(),
    testNullUserPermissions(),
  ];

  const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
  const totalTests = totalPassed + totalFailed;

  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${totalPassed}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log(`   Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);

  if (totalFailed === 0) {
    console.log('🎉 All permission tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the permission system implementation.');
  }

  return { totalTests, totalPassed, totalFailed };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runPermissionTests();
}