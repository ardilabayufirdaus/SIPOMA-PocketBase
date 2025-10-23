const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testUnifiedPermissionSystem() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING UNIFIED PERMISSION SYSTEM ===\n');

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

    // Test the same logic as userPermissionManager.ts saveUserPermissions
    const testPermissions = {
      dashboard: 'READ',
      plant_operations: {
        'Cement Mill 1': 'WRITE',
        'Cement Mill 2': 'READ',
      },
      inspection: 'NONE',
      project_management: 'NONE',
    };

    console.log('Test permissions:', JSON.stringify(testPermissions, null, 2));

    // Check existing records
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Existing records: ${existing.totalItems}`);

    const permissionData = {
      user_id: testUser.id,
      permissions_data: JSON.stringify(testPermissions),
      is_custom_permissions: true,
      role: existing.items[0]?.role || testUser.role,
    };

    console.log('Permission data to save:', JSON.stringify(permissionData, null, 2));

    // Test update (should work)
    if (existing.items.length > 0) {
      console.log('Updating existing record...');
      const result = await pb
        .collection('user_permissions')
        .update(existing.items[0].id, permissionData);
      console.log('✅ Update successful:', result.id);
    } else {
      console.log('Creating new record...');
      const result = await pb.collection('user_permissions').create(permissionData);
      console.log('✅ Create successful:', result.id);
    }

    // Verify the data was saved correctly
    const verify = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    if (verify.items.length > 0) {
      const savedData = JSON.parse(verify.items[0].permissions_data);
      console.log('✅ Verification - Saved permissions match:', JSON.stringify(savedData, null, 2));

      const matches = JSON.stringify(savedData) === JSON.stringify(testPermissions);
      console.log('✅ Data integrity check:', matches ? 'PASSED' : 'FAILED');
    }

    // Test rapid saves with delays to avoid auto-cancellation
    console.log('\n--- Testing Rapid Saves with Delays ---');
    const rapidTests = [
      { dashboard: 'WRITE', plant_operations: { 'Cement Mill 1': 'READ' } },
      {
        dashboard: 'READ',
        plant_operations: { 'Cement Mill 1': 'WRITE', 'Cement Mill 2': 'WRITE' },
      },
      { dashboard: 'NONE', plant_operations: {} },
    ];

    for (let i = 0; i < rapidTests.length; i++) {
      console.log(`Rapid test ${i + 1}...`);
      const testData = {
        user_id: testUser.id,
        permissions_data: JSON.stringify(rapidTests[i]),
        is_custom_permissions: true,
        role: testUser.role,
      };

      try {
        if (existing.items.length > 0) {
          await pb.collection('user_permissions').update(existing.items[0].id, testData);
          console.log(`✅ Rapid test ${i + 1} successful`);
        }
        // Add small delay to prevent auto-cancellation
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ Rapid test ${i + 1} failed:`, error.message);
      }
    }

    console.log('\n=== UNIFIED SYSTEM TEST COMPLETED ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUnifiedPermissionSystem();
