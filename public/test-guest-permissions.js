// Quick Permission Test - Run in browser console
const testGuestPermissions = async () => {
  console.log('🧪 Testing Guest User Permission Loading');

  try {
    // Import pb from the app
    const { pb } = await import('./utils/pocketbase-simple.js');

    // 1. Find Guest user
    const guestUsers = await pb.collection('users').getList(1, 1, {
      filter: 'role = "Guest"',
    });

    if (guestUsers.items.length === 0) {
      console.log('❌ No Guest user found');
      return;
    }

    const guestUser = guestUsers.items[0];
    console.log('✅ Found Guest user:', guestUser.username);

    // 2. Check current permissions in users collection
    console.log('📊 Current permissions in users collection:', guestUser.permissions);

    // 3. Check permissions in user_permissions collection
    const userPerms = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${guestUser.id}'`,
    });

    if (userPerms.items.length > 0) {
      const savedPerms = JSON.parse(userPerms.items[0].permissions_data);
      console.log('📊 Permissions in user_permissions collection:', savedPerms);

      // Compare
      const usersPerms = guestUser.permissions || {};
      const match = JSON.stringify(usersPerms) === JSON.stringify(savedPerms);
      console.log('🔍 Permissions match between collections:', match);

      if (!match) {
        console.log('⚠️  Permissions mismatch detected!');
        console.log('Users collection:', usersPerms);
        console.log('User_permissions collection:', savedPerms);
      }
    } else {
      console.log('⚠️  No permissions found in user_permissions collection');
    }

    // 4. Test permission saving
    console.log('💾 Testing permission save...');
    const testPerms = {
      dashboard: 'READ',
      plant_operations: 'READ',
      inspection: 'NONE',
      project_management: 'NONE',
    };

    const { saveUserPermissions } = await import('./utils/userPermissionManager');
    await saveUserPermissions(guestUser.id, testPerms, 'test_system');
    console.log('✅ Permissions saved');

    // 5. Verify save worked
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for DB

    const updatedUser = await pb.collection('users').getOne(guestUser.id);
    console.log('🔄 Updated permissions in users collection:', updatedUser.permissions);

    const hasDashboard = updatedUser.permissions?.dashboard === 'READ';
    const hasPlantOps = updatedUser.permissions?.plant_operations === 'READ';

    console.log('✅ Dashboard access:', hasDashboard);
    console.log('✅ Plant operations access:', hasPlantOps);

    if (hasDashboard && hasPlantOps) {
      console.log('🎉 SUCCESS: Guest permissions are working correctly!');
    } else {
      console.log('❌ FAILURE: Guest permissions not working');
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.testGuestPermissions = testGuestPermissions;
  console.log('🔧 Run: testGuestPermissions() in browser console');
}
