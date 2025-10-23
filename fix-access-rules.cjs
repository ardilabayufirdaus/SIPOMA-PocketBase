const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixPermissionAccessRules() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== FIXING PERMISSION ACCESS RULES ===\n');

    // Get the user_permissions collection
    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.log('❌ user_permissions collection not found');
      return;
    }

    console.log('Current access rules:');
    console.log('- listRule:', userPermsCollection.listRule);
    console.log('- viewRule:', userPermsCollection.viewRule);
    console.log('- createRule:', userPermsCollection.createRule);
    console.log('- updateRule:', userPermsCollection.updateRule);
    console.log('- deleteRule:', userPermsCollection.deleteRule);

    // Update access rules to allow admins to manage all permissions
    const updatedCollection = {
      ...userPermsCollection,
      listRule:
        '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || user_id = @request.auth.id',
      viewRule:
        '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || user_id = @request.auth.id',
      createRule:
        '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || user_id = @request.auth.id',
      updateRule:
        '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || user_id = @request.auth.id',
      deleteRule: '@request.auth.role = "Super Admin" || @request.auth.role = "Admin"',
    };

    console.log('\nUpdating access rules...');
    const result = await pb.collections.update(userPermsCollection.id, updatedCollection);

    console.log('✅ Access rules updated successfully');

    // Verify the update
    const updatedCollections = await pb.collections.getFullList();
    const updatedUserPerms = updatedCollections.find((c) => c.name === 'user_permissions');

    console.log('\nUpdated access rules:');
    console.log('- listRule:', updatedUserPerms.listRule);
    console.log('- viewRule:', updatedUserPerms.viewRule);
    console.log('- createRule:', updatedUserPerms.createRule);
    console.log('- updateRule:', updatedUserPerms.updateRule);
    console.log('- deleteRule:', updatedUserPerms.deleteRule);
  } catch (error) {
    console.error('❌ Failed to update access rules:', error.message);
  }
}

fixPermissionAccessRules();
