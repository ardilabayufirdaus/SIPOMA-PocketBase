const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testUserPermissions(userId, username) {
  try {
    console.log(`=== TESTING PERMISSIONS FOR USER: ${username} (ID: ${userId}) ===\n`);

    // Authenticate as admin first to check database state
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Admin authenticated\n');

    // Check permissions in user_permissions collection
    console.log('1. Checking user_permissions collection...');
    const userPermissions = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
      fields: 'id,user_id,permissions_data,role,is_custom_permissions',
    });

    if (userPermissions.items.length > 0) {
      const perm = userPermissions.items[0];
      console.log('✅ Found permissions in user_permissions collection:');
      console.log(`   - Role: ${perm.role}`);
      console.log(`   - Is Custom: ${perm.is_custom_permissions}`);
      console.log(`   - Permissions: ${perm.permissions_data.substring(0, 100)}...`);
    } else {
      console.log('❌ No permissions found in user_permissions collection');
    }

    // Check permissions field in users collection
    console.log('\n2. Checking permissions field in users collection...');
    const userRecord = await pb.collection('users').getOne(userId, {
      fields: 'id,username,name,role,permissions',
    });

    console.log('✅ User record from users collection:');
    console.log(`   - Username: ${userRecord.username}`);
    console.log(`   - Role: ${userRecord.role}`);
    console.log(`   - Permissions field: ${userRecord.permissions ? 'EXISTS' : 'NULL'}`);

    if (userRecord.permissions) {
      console.log(
        `   - Permissions data: ${JSON.stringify(userRecord.permissions).substring(0, 200)}...`
      );
    }

    // Compare permissions between collections
    console.log('\n3. Comparing permissions consistency...');
    if (userPermissions.items.length > 0 && userRecord.permissions) {
      const permCollection = JSON.parse(userPermissions.items[0].permissions_data);
      const permField = userRecord.permissions;

      const collectionStr = JSON.stringify(permCollection);
      const fieldStr = JSON.stringify(permField);

      if (collectionStr === fieldStr) {
        console.log('✅ Permissions are CONSISTENT between collections');
      } else {
        console.log('❌ Permissions are INCONSISTENT between collections');
        console.log('   user_permissions:', collectionStr);
        console.log('   users.permissions:', fieldStr);
      }
    } else {
      console.log('❌ Cannot compare - missing data in one or both collections');
    }

    // Simulate login process (what happens when user actually logs in)
    console.log('\n4. Simulating login process...');

    // This simulates what loadUserPermissions does during login
    const loginPermissions = await pb.collection('user_permissions').getFullList({
      filter: `user_id = '${userId}'`,
    });

    if (loginPermissions.length > 0) {
      const permissions = JSON.parse(loginPermissions[0].permissions_data);
      console.log('✅ Login would load these permissions:');
      console.log(`   - Dashboard: ${permissions.dashboard}`);
      console.log(
        `   - Plant Operations: ${Object.keys(permissions.plant_operations || {}).length} plants`
      );
      console.log(`   - Inspection: ${permissions.inspection}`);
      console.log(`   - Project Management: ${permissions.project_management}`);
    } else {
      console.log('❌ Login would find no permissions');
    }

    console.log('\n=== TEST COMPLETE ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test with the user from the logs (asnur)
testUserPermissions('xygvglupqzem82w', 'asnur');
