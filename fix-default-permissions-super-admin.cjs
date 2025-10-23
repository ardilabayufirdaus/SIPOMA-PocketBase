const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixDefaultPermissionsSuperAdminOnly() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== SETTING DEFAULT PERMISSIONS TO SUPER ADMIN ONLY ===\n');

    const collections = await pb.collections.getFullList();
    const defaultPermsCollection = collections.find((c) => c.name === 'default_permissions');

    if (!defaultPermsCollection) {
      console.error('❌ default_permissions collection not found!');
      return;
    }

    console.log('Current permissions:');
    console.log('  List rule:', defaultPermsCollection.listRule || 'null');
    console.log('  View rule:', defaultPermsCollection.viewRule || 'null');
    console.log('  Create rule:', defaultPermsCollection.createRule || 'null');
    console.log('  Update rule:', defaultPermsCollection.updateRule || 'null');
    console.log('  Delete rule:', defaultPermsCollection.deleteRule || 'null');

    // Update permissions to allow only Super Admin role to modify
    const updatedCollection = await pb.collections.update(defaultPermsCollection.id, {
      ...defaultPermsCollection,
      // Allow all authenticated users to read (list/view)
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      // Only Super Admin can create/update/delete
      createRule: '@request.auth.role = "Super Admin"',
      updateRule: '@request.auth.role = "Super Admin"',
      deleteRule: '@request.auth.role = "Super Admin"',
    });

    console.log('\n✅ Default permissions collection updated for Super Admin only!');
    console.log('New permissions:');
    console.log('  List rule:', updatedCollection.listRule);
    console.log('  View rule:', updatedCollection.viewRule);
    console.log('  Create rule:', updatedCollection.createRule);
    console.log('  Update rule:', updatedCollection.updateRule);
    console.log('  Delete rule:', updatedCollection.deleteRule);

    // Verify Super Admin user exists and has correct role
    console.log('\n=== VERIFYING SUPER ADMIN USER ===');
    const superAdmins = await pb.collection('users').getList(1, 10, {
      filter: 'role = "Super Admin"',
    });

    console.log(`Found ${superAdmins.totalItems} Super Admin users:`);
    superAdmins.items.forEach((user) => {
      console.log(`  - ${user.username} (${user.email})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixDefaultPermissionsSuperAdminOnly();
