const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkPermissionsStorage() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING PERMISSIONS STORAGE ===\n');

    // 1. Check default_permissions collection
    console.log('1. Default Permissions Collection:');
    const defaultPerms = await pb.collection('default_permissions').getList(1, 10);
    console.log(`   Records: ${defaultPerms.totalItems}`);
    if (defaultPerms.items.length > 0) {
      console.log('   Sample:', JSON.stringify(defaultPerms.items[0], null, 2));
    }

    // 2. Check user permissions in users collection
    console.log('\n2. User Permissions in Users Collection:');
    const users = await pb.collection('users').getList(1, 5, {
      fields: 'id,username,role,permissions,is_custom_permissions',
    });
    console.log(`   Users found: ${users.totalItems}`);
    users.items.forEach((user) => {
      console.log(
        `   ${user.username} (${user.role}): has_permissions=${!!user.permissions}, is_custom=${user.is_custom_permissions}`
      );
    });

    // 3. Check user_activity_logs for audit trail
    console.log('\n3. Audit Trail in user_activity_logs:');
    const logs = await pb.collection('user_activity_logs').getList(1, 10, {
      filter: 'action_type = "permission_change"',
      sort: '-created',
    });
    console.log(`   Permission change logs: ${logs.totalItems}`);
    if (logs.items.length > 0) {
      console.log('   Recent log:', JSON.stringify(logs.items[0], null, 2));
    }

    // 4. Check if permissions field exists in users schema
    console.log('\n4. Users Collection Schema:');
    const collections = await pb.collections.getFullList();
    const usersCollection = collections.find((c) => c.name === 'users');
    if (usersCollection && usersCollection.schema) {
      const permissionsField = usersCollection.schema.find((f) => f.name === 'permissions');
      const customFlagField = usersCollection.schema.find(
        (f) => f.name === 'is_custom_permissions'
      );
      console.log(`   permissions field: ${permissionsField ? 'EXISTS' : 'MISSING'}`);
      console.log(`   is_custom_permissions field: ${customFlagField ? 'EXISTS' : 'MISSING'}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPermissionsStorage();
