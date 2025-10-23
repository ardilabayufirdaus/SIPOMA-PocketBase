const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkAllPermissionsCollections() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING ALL PERMISSIONS-RELATED COLLECTIONS ===\n');

    const collections = await pb.collections.getFullList();
    const relevantCollections = ['user_permissions', 'default_permissions', 'user_activity_logs'];

    for (const collectionName of relevantCollections) {
      const collection = collections.find((c) => c.name === collectionName);
      if (collection) {
        console.log(`${collectionName}:`);
        console.log(`  List rule: ${collection.listRule || 'null'}`);
        console.log(`  View rule: ${collection.viewRule || 'null'}`);
        console.log(`  Create rule: ${collection.createRule || 'null'}`);
        console.log(`  Update rule: ${collection.updateRule || 'null'}`);
        console.log(`  Delete rule: ${collection.deleteRule || 'null'}\n`);
      }
    }

    // Test user permissions access with a regular user auth
    console.log('=== TESTING USER ACCESS ===');

    // Get a regular user to test with
    const users = await pb.collection('users').getList(1, 1, {
      filter: 'role != "Super Admin"',
    });

    if (users.items.length > 0) {
      const testUser = users.items[0];
      console.log(`Testing with user: ${testUser.username} (${testUser.role})`);

      // Try to authenticate as this user (we'd need their password, so this is just informational)
      console.log('Note: User permissions access will be tested when user logs in via frontend');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllPermissionsCollections();
