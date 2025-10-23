const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testInitializeUserPermissions() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING initializeUserPermissions ===\n');

    // Get a test user that already has permissions
    const users = await pb.collection('users').getList(1, 1, {
      filter: 'role = "Operator"',
    });

    if (users.items.length === 0) {
      console.log('No Operator users found');
      return;
    }

    const testUser = users.items[0];
    console.log(`Testing with user: ${testUser.username} (${testUser.id})`);

    // Check current state
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`User already has ${existing.totalItems} permission records`);

    // Try to initialize permissions (this is what UserFormEnhanced.tsx does)
    console.log('\n--- Calling initializeUserPermissions logic ---');

    const role = testUser.role; // 'Operator'
    console.log(`Initializing permissions for role: ${role}`);

    // Get default permissions (this might be failing due to network issues)
    try {
      console.log('Fetching default permissions...');
      // This is where the network error occurs according to the logs
      const defaultPermissions = {
        dashboard: 'NONE',
        plant_operations: {},
        inspection: 'NONE',
        project_management: 'NONE',
      };

      console.log('Default permissions:', JSON.stringify(defaultPermissions, null, 2));

      // Check if user already has permissions
      const existingCheck = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = "${testUser.id}"`,
      });

      console.log(`Existing check: ${existingCheck.totalItems} records found`);

      // Create permission data
      const permissionData = {
        user_id: testUser.id,
        permissions_data: JSON.stringify(defaultPermissions),
        is_custom_permissions: false,
        role: role,
      };

      console.log('Permission data to save:', JSON.stringify(permissionData, null, 2));

      // Try the operation
      if (existingCheck.items.length > 0) {
        console.log('Updating existing record...');
        const result = await pb
          .collection('user_permissions')
          .update(existingCheck.items[0].id, permissionData);
        console.log('✅ Update successful');
      } else {
        console.log('Creating new record...');
        const result = await pb.collection('user_permissions').create(permissionData);
        console.log('✅ Create successful');
      }
    } catch (error) {
      console.log('❌ initializeUserPermissions failed:', error.message);
      if (error.response) {
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInitializeUserPermissions();
