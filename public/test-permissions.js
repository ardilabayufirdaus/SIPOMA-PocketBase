// Permission Persistence Test Script
// Run this in browser console to test permission saving/loading

const testPermissionPersistence = async () => {
  console.log('🚀 Testing Permission Persistence');

  try {
    // Find Guest user
    const guestUsers = await pb.collection('users').getList(1, 1, {
      filter: 'role = "Guest"',
    });

    if (guestUsers.items.length === 0) {
      console.log('❌ No Guest user found');
      return;
    }

    const guestUserId = guestUsers.items[0].id;
    console.log('🔍 Found Guest user:', guestUserId);

    // Test 1: Save permissions
    console.log('🧪 Test 1: Saving permissions...');
    const testPermissions = {
      dashboard: 'READ',
      plant_operations: 'READ',
      inspection: 'NONE',
      project_management: 'NONE',
    };

    const { saveUserPermissions } = await import('./utils/userPermissionManager');
    await saveUserPermissions(guestUserId, testPermissions, 'test_system');
    console.log('✅ Permissions saved');

    // Test 2: Verify in database
    console.log('🧪 Test 2: Verifying database storage...');
    const userPerms = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${guestUserId}'`,
    });

    if (userPerms.items.length > 0) {
      const saved = JSON.parse(userPerms.items[0].permissions_data);
      console.log('✅ Permissions in user_permissions:', saved);
    } else {
      console.log('❌ No permissions in user_permissions collection');
    }

    // Test 3: Verify in users collection
    const userData = await pb.collection('users').getOne(guestUserId);
    console.log('✅ Permissions in users collection:', userData.permissions);

    // Test 4: Simulate app refresh
    console.log('🧪 Test 4: Simulating app refresh...');
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s

    const refreshedUserData = await pb.collection('users').getOne(guestUserId, {
      fields: 'id,username,name,role,is_active,created,updated,avatar,last_active,permissions',
    });

    console.log('✅ Refreshed permissions:', refreshedUserData.permissions);

    const hasDashboard = refreshedUserData.permissions?.dashboard === 'READ';
    const hasPlantOps = refreshedUserData.permissions?.plant_operations === 'READ';

    console.log('✅ Dashboard access after refresh:', hasDashboard);
    console.log('✅ Plant operations access after refresh:', hasPlantOps);

    if (hasDashboard && hasPlantOps) {
      console.log('✅ SUCCESS: Permissions persist across app refresh!');
    } else {
      console.log('❌ FAILURE: Permissions lost after refresh');
    }

    // Test 5: Reset to original state
    console.log('🧪 Test 5: Resetting to original state...');
    const resetPermissions = {
      dashboard: 'NONE',
      plant_operations: 'NONE',
      inspection: 'NONE',
      project_management: 'NONE',
    };

    await saveUserPermissions(guestUserId, resetPermissions, 'test_reset');
    console.log('✅ Permissions reset to original state');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.testPermissionPersistence = testPermissionPersistence;
  console.log('🔧 Run: testPermissionPersistence() to start testing');
}
