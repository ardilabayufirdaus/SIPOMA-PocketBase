const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFrontendDataFormat() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING FRONTEND DATA FORMAT ===\n');

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

    // Simulate the permissions data that might be sent from frontend
    const permissionsData = {
      dashboard: 'NONE',
      plant_operations: {
        'Cement Mill 1': 'WRITE',
        'Cement Mill 2': 'WRITE',
        'Cement Mill 3': 'WRITE',
        'Cement Mill 4': 'WRITE',
        'Cement Mill 5': 'WRITE',
      },
      inspection: 'NONE',
      project_management: 'NONE',
    };

    console.log('Permissions data to save:', JSON.stringify(permissionsData, null, 2));

    // Test the saveUserPermissions function logic
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Existing records for user: ${existing.totalItems}`);

    const permissionData = {
      user_id: testUser.id,
      permissions_data: JSON.stringify(permissionsData),
      is_custom_permissions: true,
      role: existing.items[0]?.role || testUser.role,
    };

    console.log('Data to send to PocketBase:', JSON.stringify(permissionData, null, 2));

    try {
      let result;
      if (existing.items.length > 0) {
        console.log('Updating existing record...');
        result = await pb
          .collection('user_permissions')
          .update(existing.items[0].id, permissionData);
        console.log('✅ Update successful');
      } else {
        console.log('Creating new record...');
        result = await pb.collection('user_permissions').create(permissionData);
        console.log('✅ Create successful');
      }

      console.log('Result:', result.id);
    } catch (saveError) {
      console.error('❌ Save failed:', saveError.message);
      if (saveError.response) {
        console.error('Response data:', JSON.stringify(saveError.response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendDataFormat();
