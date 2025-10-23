const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testAllPermissionSaveScenarios() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING ALL PERMISSION SAVE SCENARIOS ===\n');

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

    // Test 1: Check current state
    console.log('\n--- Test 1: Current State ---');
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });
    console.log(`Existing records: ${existing.totalItems}`);
    if (existing.items.length > 0) {
      console.log('Current record:', {
        id: existing.items[0].id,
        user_id: existing.items[0].user_id,
        role: existing.items[0].role,
        is_custom_permissions: existing.items[0].is_custom_permissions,
        permissions_data_length: existing.items[0].permissions_data.length,
      });
    }

    // Test 2: Try to create duplicate record (should fail)
    console.log('\n--- Test 2: Attempt Duplicate Creation ---');
    try {
      const duplicateData = {
        user_id: testUser.id,
        permissions_data: JSON.stringify({ dashboard: 'READ' }),
        is_custom_permissions: true,
        role: testUser.role,
      };
      await pb.collection('user_permissions').create(duplicateData);
      console.log('❌ ERROR: Duplicate creation succeeded (should have failed)');
    } catch (error) {
      console.log('✅ Duplicate creation correctly failed:', error.message);
    }

    // Test 3: Update existing record (should work)
    console.log('\n--- Test 3: Update Existing Record ---');
    try {
      const updateData = {
        user_id: testUser.id,
        permissions_data: JSON.stringify({
          dashboard: 'WRITE',
          plant_operations: { 'Cement Mill 1': 'WRITE' },
        }),
        is_custom_permissions: true,
        role: testUser.role,
      };

      if (existing.items.length > 0) {
        await pb.collection('user_permissions').update(existing.items[0].id, updateData);
        console.log('✅ Update successful');
      } else {
        await pb.collection('user_permissions').create(updateData);
        console.log('✅ Create successful');
      }
    } catch (error) {
      console.log('❌ Update failed:', error.message);
    }

    // Test 4: Test with malformed data
    console.log('\n--- Test 4: Malformed Data Test ---');
    try {
      const malformedData = {
        user_id: testUser.id,
        permissions_data: 'invalid json',
        is_custom_permissions: true,
        role: testUser.role,
      };

      if (existing.items.length > 0) {
        await pb.collection('user_permissions').update(existing.items[0].id, malformedData);
        console.log('❌ ERROR: Malformed data update succeeded (should have failed)');
      }
    } catch (error) {
      console.log('✅ Malformed data correctly rejected:', error.message);
    }

    // Test 5: Test with missing required fields
    console.log('\n--- Test 5: Missing Fields Test ---');
    try {
      const incompleteData = {
        user_id: testUser.id,
        // missing permissions_data
        is_custom_permissions: true,
        role: testUser.role,
      };

      if (existing.items.length > 0) {
        await pb.collection('user_permissions').update(existing.items[0].id, incompleteData);
        console.log('❌ ERROR: Incomplete data update succeeded (should have failed)');
      }
    } catch (error) {
      console.log('✅ Incomplete data correctly rejected:', error.message);
    }

    // Test 6: Test rapid successive saves (race condition test)
    console.log('\n--- Test 6: Rapid Successive Saves ---');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        (async () => {
          try {
            const rapidData = {
              user_id: testUser.id,
              permissions_data: JSON.stringify({ dashboard: `READ_${i}` }),
              is_custom_permissions: true,
              role: testUser.role,
            };

            if (existing.items.length > 0) {
              await pb.collection('user_permissions').update(existing.items[0].id, rapidData);
              return `Update ${i} successful`;
            }
          } catch (error) {
            return `Update ${i} failed: ${error.message}`;
          }
        })()
      );
    }

    const results = await Promise.all(promises);
    results.forEach((result) => console.log(result));

    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testAllPermissionSaveScenarios();
