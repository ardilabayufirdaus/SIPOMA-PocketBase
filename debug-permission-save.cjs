const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function debugPermissionSaveIssue() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING PERMISSION SAVE ISSUE ===\n');

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
    console.log('\n--- Test 1: Current Database State ---');
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Existing records found: ${existing.totalItems}`);
    if (existing.items.length > 0) {
      console.log('Existing record details:');
      console.log('- ID:', existing.items[0].id);
      console.log('- user_id:', existing.items[0].user_id);
      console.log('- role:', existing.items[0].role);
      console.log('- is_custom_permissions:', existing.items[0].is_custom_permissions);
      console.log('- permissions_data length:', existing.items[0].permissions_data.length);
    }

    // Test 2: Try the exact same logic as saveUserPermissions
    console.log('\n--- Test 2: Replicating saveUserPermissions Logic ---');

    const permissions = {
      dashboard: 'READ',
      plant_operations: { 'Cement Mill 1': 'WRITE' },
      inspection: 'NONE',
      project_management: 'NONE',
    };

    console.log('Permissions to save:', JSON.stringify(permissions, null, 2));

    // Get existing permissions for logging (same as function)
    const existingCheck = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Existing check result: ${existingCheck.totalItems} records`);

    let oldPermissions;
    if (existingCheck.items.length > 0) {
      oldPermissions = JSON.parse(existingCheck.items[0].permissions_data);
      console.log('Found existing permissions, will UPDATE');
    } else {
      console.log('No existing permissions, will CREATE');
    }

    // Create permission data (same as function)
    const permissionData = {
      user_id: testUser.id,
      permissions_data: JSON.stringify(permissions),
      is_custom_permissions: true,
      role: existingCheck.items[0]?.role || 'Unknown',
    };

    console.log('Permission data to send:', JSON.stringify(permissionData, null, 2));

    // Try the operation
    try {
      if (existingCheck.items.length > 0) {
        console.log('Attempting UPDATE...');
        const result = await pb
          .collection('user_permissions')
          .update(existingCheck.items[0].id, permissionData);
        console.log('✅ UPDATE successful:', result.id);
      } else {
        console.log('Attempting CREATE...');
        const result = await pb.collection('user_permissions').create(permissionData);
        console.log('✅ CREATE successful:', result.id);
      }
    } catch (saveError) {
      console.log('❌ Save operation failed:', saveError.message);
      if (saveError.response) {
        console.log('Response details:', JSON.stringify(saveError.response.data, null, 2));
      }
    }

    // Test 3: Check if there are multiple records (shouldn't happen with unique index)
    console.log('\n--- Test 3: Check for Duplicate Records ---');
    const allRecords = await pb.collection('user_permissions').getFullList({
      filter: `user_id = "${testUser.id}"`,
    });

    console.log(`Total records for user ${testUser.id}: ${allRecords.length}`);
    if (allRecords.length > 1) {
      console.log('❌ ERROR: Multiple records found! This violates unique constraint.');
      allRecords.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, {
          id: record.id,
          user_id: record.user_id,
          role: record.role,
          is_custom_permissions: record.is_custom_permissions,
        });
      });
    } else if (allRecords.length === 1) {
      console.log('✅ Only one record found, unique constraint working');
    } else {
      console.log('ℹ️ No records found');
    }
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

debugPermissionSaveIssue();
