const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFilterFix() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING FILTER FIX ===\n');

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

    // Test old filter (double quotes)
    console.log('\n--- Testing old filter (double quotes) ---');
    try {
      const oldFilter = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = "${testUser.id}"`,
      });
      console.log(`Old filter result: ${oldFilter.totalItems} records`);
    } catch (error) {
      console.log('Old filter failed:', error.message);
    }

    // Test new filter (single quotes)
    console.log('\n--- Testing new filter (single quotes) ---');
    try {
      const newFilter = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = '${testUser.id}'`,
      });
      console.log(`New filter result: ${newFilter.totalItems} records`);
    } catch (error) {
      console.log('New filter failed:', error.message);
    }

    // Test the save logic with new filter
    console.log('\n--- Testing save logic with new filter ---');
    const permissions = {
      dashboard: 'READ',
      plant_operations: { 'Cement Mill 1': 'WRITE' },
      inspection: 'NONE',
      project_management: 'NONE',
    };

    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${testUser.id}'`,
    });

    console.log(`Existing check with new filter: ${existing.totalItems} records`);

    const permissionData = {
      user_id: testUser.id,
      permissions_data: JSON.stringify(permissions),
      is_custom_permissions: true,
      role: existing.items[0]?.role || 'Unknown',
    };

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
    console.error('❌ Test failed:', error.message);
  }
}

testFilterFix();
