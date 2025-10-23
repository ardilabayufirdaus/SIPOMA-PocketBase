const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFrontendSaveScenario() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING FRONTEND SAVE SCENARIO ===\n');

    // Get a test user
    const users = await pb.collection('users').getList(1, 1, {
      filter: 'role = "Operator"',
    });

    if (users.items.length === 0) {
      console.log('No Operator users found');
      return;
    }

    const testUser = users.items[0];
    console.log(`Testing with user: ${testUser.username} (${testUser.id})`);

    // Simulate the exact permissions that might be sent from the frontend
    const frontendPermissions = {
      dashboard: 'NONE',
      plant_operations: {},
      inspection: 'NONE',
      project_management: 'NONE',
    };

    console.log('Frontend permissions to save:', JSON.stringify(frontendPermissions, null, 2));

    // Test the exact logic from userPermissionManager.ts saveUserPermissions
    console.log('\n--- Testing saveUserPermissions logic ---');

    // Check existing records
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Existing records: ${existing.totalItems}`);

    // Create permission data exactly as the function does
    const permissionData = {
      user_id: testUser.id,
      permissions_data: JSON.stringify(frontendPermissions),
      is_custom_permissions: true,
      role: existing.items[0]?.role || 'Unknown',
    };

    console.log('Permission data to send:', JSON.stringify(permissionData, null, 2));

    // Try the save operation
    try {
      if (existing.items.length > 0) {
        console.log('Updating existing record...');
        const result = await pb
          .collection('user_permissions')
          .update(existing.items[0].id, permissionData);
        console.log('✅ Update successful');
      } else {
        console.log('Creating new record...');
        const result = await pb.collection('user_permissions').create(permissionData);
        console.log('✅ Create successful');
      }
    } catch (error) {
      console.log('❌ Save failed:', error.message);
      if (error.response) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }

      // Check if the issue is with the data format
      console.log('\n--- Checking data validation ---');
      console.log('user_id type:', typeof permissionData.user_id, 'value:', permissionData.user_id);
      console.log(
        'permissions_data type:',
        typeof permissionData.permissions_data,
        'length:',
        permissionData.permissions_data.length
      );
      console.log(
        'is_custom_permissions type:',
        typeof permissionData.is_custom_permissions,
        'value:',
        permissionData.is_custom_permissions
      );
      console.log('role type:', typeof permissionData.role, 'value:', permissionData.role);

      // Try with minimal data
      console.log('\n--- Testing with minimal data ---');
      try {
        const minimalData = {
          user_id: testUser.id,
          permissions_data: '{"dashboard":"NONE"}',
          is_custom_permissions: true,
          role: 'Operator',
        };
        const result = await pb.collection('user_permissions').create(minimalData);
        console.log('✅ Minimal create successful');
      } catch (minimalError) {
        console.log('❌ Minimal create failed:', minimalError.message);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendSaveScenario();
