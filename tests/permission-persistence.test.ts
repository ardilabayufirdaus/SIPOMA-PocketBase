import { pb } from '../utils/pocketbase-simple';
import { PermissionMatrix } from '../types';

/**
 * Automated test for permission persistence across app refreshes
 */
export class PermissionPersistenceTest {
  private guestUserId: string | null = null;

  constructor() {
    this.findGuestUser();
  }

  private async findGuestUser() {
    try {
      const guestUsers = await pb.collection('users').getList(1, 1, {
        filter: 'role = "Guest"',
      });

      if (guestUsers.items.length > 0) {
        this.guestUserId = guestUsers.items[0].id;
        console.log('🔍 Found Guest user:', this.guestUserId);
      } else {
        console.log('❌ No Guest user found');
      }
    } catch (error) {
      console.error('❌ Error finding Guest user:', error);
    }
  }

  async testPermissionSaving() {
    if (!this.guestUserId) {
      console.log('❌ Cannot test: Guest user not found');
      return false;
    }

    console.log('🧪 Testing permission saving...');

    // Create test permissions
    const testPermissions: PermissionMatrix = {
      dashboard: 'READ',
      plant_operations: 'READ',
      inspection: 'NONE',
      project_management: 'NONE',
    };

    try {
      // Save permissions
      const { saveUserPermissions } = await import('../utils/userPermissionManager');
      await saveUserPermissions(this.guestUserId, testPermissions, 'test_system');

      console.log('✅ Permissions saved successfully');

      // Verify in user_management collection
      const userPermissions = await pb.collection('user_management').getList(1, 1, {
        filter: `user_id = '${this.guestUserId}'`,
      });

      if (userPermissions.items.length > 0) {
        const item = userPermissions.items[0];
        const savedPermissions: PermissionMatrix = {
          dashboard: item.dashboard || 'NONE',
          cm_plant_operations: item.cm_plant_operations || 'NONE',
          rkc_plant_operations: item.rkc_plant_operations || 'NONE',
          project_management: item.project_management || 'NONE',
          database: item.database || 'NONE',
        };
        console.log('✅ Permissions found in user_management collection:', savedPermissions);

        // Verify permissions match
        // Note: Project management is 'NONE' in testPermissions and item might have it
        const permissionsMatch =
          savedPermissions.dashboard === testPermissions.dashboard &&
          savedPermissions.cm_plant_operations === testPermissions.cm_plant_operations;

        console.log('✅ Permissions match (core):', permissionsMatch);

        if (!permissionsMatch) {
          console.log('❌ Permission mismatch!');
          console.log('Expected:', testPermissions);
          console.log('Actual:', savedPermissions);
          return false;
        }
      } else {
        console.log('❌ No permissions found in user_management collection');
        return false;
      }

      // Verify in users collection
      const userData = await pb.collection('users').getOne(this.guestUserId);
      if (userData.permissions) {
        const userPermissions = userData.permissions;
        console.log('✅ Permissions found in users collection:', userPermissions);

        const permissionsMatch =
          JSON.stringify(userPermissions) === JSON.stringify(testPermissions);
        console.log('✅ User permissions match:', permissionsMatch);

        if (!permissionsMatch) {
          console.log('❌ User permission mismatch!');
          return false;
        }
      } else {
        console.log('❌ No permissions found in users collection');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error testing permission saving:', error);
      return false;
    }
  }

  async testPermissionLoading() {
    if (!this.guestUserId) {
      console.log('❌ Cannot test: Guest user not found');
      return false;
    }

    console.log('🧪 Testing permission loading...');

    try {
      // Simulate app refresh by fetching user data
      const userData = await pb.collection('users').getOne(this.guestUserId, {
        fields: 'id,username,name,role,is_active,created,updated,avatar,last_active,permissions',
      });

      console.log('✅ User data loaded:', {
        id: userData.id,
        role: userData.role,
        permissions: userData.permissions,
      });

      if (!userData.permissions) {
        console.log('❌ No permissions loaded from users collection');
        return false;
      }

      // Check if permissions have dashboard and plant_operations access
      const hasDashboardAccess = userData.permissions.dashboard === 'READ';
      const hasPlantOpsAccess = userData.permissions.plant_operations === 'READ';

      console.log('✅ Dashboard access:', hasDashboardAccess);
      console.log('✅ Plant operations access:', hasPlantOpsAccess);

      if (!hasDashboardAccess || !hasPlantOpsAccess) {
        console.log('❌ Expected permissions not found');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error testing permission loading:', error);
      return false;
    }
  }

  async testPermissionReset() {
    if (!this.guestUserId) {
      console.log('❌ Cannot test: Guest user not found');
      return false;
    }

    console.log('🧪 Testing permission reset to original state...');

    try {
      // Reset to no permissions (original Guest state)
      const resetPermissions: PermissionMatrix = {
        dashboard: 'NONE',
        plant_operations: 'NONE',
        inspection: 'NONE',
        project_management: 'NONE',
      };

      const { saveUserPermissions } = await import('../utils/userPermissionManager');
      await saveUserPermissions(this.guestUserId, resetPermissions, 'test_reset');

      console.log('✅ Permissions reset to original state');
      return true;
    } catch (error) {
      console.error('❌ Error resetting permissions:', error);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Permission Persistence Test Suite');
    console.log('='.repeat(50));

    // Wait for guest user to be found
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!this.guestUserId) {
      console.log('❌ Test failed: Guest user not found');
      return false;
    }

    // Test 1: Save permissions
    const saveResult = await this.testPermissionSaving();
    if (!saveResult) {
      console.log('❌ Test failed: Permission saving failed');
      return false;
    }

    // Wait a moment for database consistency
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 2: Load permissions (simulate app refresh)
    const loadResult = await this.testPermissionLoading();
    if (!loadResult) {
      console.log('❌ Test failed: Permission loading failed');
      return false;
    }

    // Test 3: Reset permissions
    const resetResult = await this.testPermissionReset();
    if (!resetResult) {
      console.log('❌ Test failed: Permission reset failed');
      return false;
    }

    console.log('✅ All tests passed!');
    return true;
  }
}

// Export for use in browser console or test runner
export const runPermissionPersistenceTest = () => {
  const test = new PermissionPersistenceTest();
  return test.runFullTest();
};
