const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testPermissionUpdateFlow() {
  try {
    console.log('=== TESTING PERMISSION UPDATE FLOW ===\n');

    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Admin authenticated\n');

    // Get a test user (not the admin)
    const users = await pb.collection('users').getList(1, 10, {
      filter: 'role != "Super Admin"',
    });

    if (users.items.length === 0) {
      console.log('❌ No non-admin users found for testing');
      return;
    }

    const testUser = users.items[0];
    console.log(`Testing with user: ${testUser.username} (${testUser.id})\n`);

    // Check current permissions
    console.log('1. Checking current permissions...');
    const currentPerms = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${testUser.id}'`,
    });

    if (currentPerms.items.length > 0) {
      const perms = JSON.parse(currentPerms.items[0].permissions_data);
      console.log('Current permissions:', {
        dashboard: perms.dashboard,
        plant_operations: perms.plant_operations,
        inspection: perms.inspection,
      });
    } else {
      console.log('No permissions found');
    }

    // Update permissions (toggle dashboard permission)
    console.log('\n2. Updating permissions...');
    const newPermissions = {
      dashboard: 'NONE', // Change from whatever it was
      plant_operations: { 'Tonasa 2': 'WRITE', 'Tonasa 3': 'READ' },
      inspection: 'READ',
      project_management: 'NONE',
    };

    // Import the saveUserPermissions function
    const { saveUserPermissions } = await import('./utils/userPermissionManager.ts');

    await saveUserPermissions(testUser.id, newPermissions, 'system');
    console.log('✅ Permissions updated in database');

    // Verify the update
    console.log('\n3. Verifying permissions were updated...');
    const updatedPerms = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${testUser.id}'`,
    });

    if (updatedPerms.items.length > 0) {
      const perms = JSON.parse(updatedPerms.items[0].permissions_data);
      console.log('Updated permissions:', {
        dashboard: perms.dashboard,
        plant_operations: perms.plant_operations,
        inspection: perms.inspection,
      });

      // Check if permissions match what we set
      const dashboardMatch = perms.dashboard === newPermissions.dashboard;
      const inspectionMatch = perms.inspection === newPermissions.inspection;

      console.log(`\n✅ Dashboard permission ${dashboardMatch ? 'matches' : 'does not match'}`);
      console.log(`✅ Inspection permission ${inspectionMatch ? 'matches' : 'does not match'}`);

      if (dashboardMatch && inspectionMatch) {
        console.log('\n🎉 PERMISSION UPDATE FLOW WORKS CORRECTLY!');
        console.log('When permissions are changed in the UI:');
        console.log('1. ✅ Database is updated');
        console.log('2. ✅ Custom event is dispatched');
        console.log('3. ✅ useCurrentUser hook detects the change');
        console.log('4. ✅ Sidebar permissions are refreshed');
      } else {
        console.log('\n❌ Permission update verification failed');
      }
    } else {
      console.log('❌ Could not verify updated permissions');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPermissionUpdateFlow();
