const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixUserPermissionsCollectionAccess() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== FIXING USER PERMISSIONS COLLECTION ACCESS ===\n');

    // Get the user_permissions collection
    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.error('❌ user_permissions collection not found!');
      return;
    }

    console.log('Current collection permissions:');
    console.log('  List rule:', userPermsCollection.listRule || 'null');
    console.log('  View rule:', userPermsCollection.viewRule || 'null');
    console.log('  Create rule:', userPermsCollection.createRule || 'null');
    console.log('  Update rule:', userPermsCollection.updateRule || 'null');
    console.log('  Delete rule:', userPermsCollection.deleteRule || 'null');

    // Update permissions to allow users to access their own records
    const updatedCollection = await pb.collections.update(userPermsCollection.id, {
      name: userPermsCollection.name,
      type: userPermsCollection.type,
      schema: userPermsCollection.schema,
      indexes: userPermsCollection.indexes,
      // Allow users to list/view/create/update their own permissions
      listRule: 'user_id = @request.auth.id', // Can only list their own records
      viewRule: 'user_id = @request.auth.id', // Can only view their own records
      createRule: 'user_id = @request.auth.id', // Can only create records for themselves
      updateRule: 'user_id = @request.auth.id', // Can only update their own records
      deleteRule: null, // Don't allow deletion of permission records
    });

    console.log('\n✅ Collection permissions updated successfully!');
    console.log('New permissions:');
    console.log('  List rule:', updatedCollection.listRule);
    console.log('  View rule:', updatedCollection.viewRule);
    console.log('  Create rule:', updatedCollection.createRule);
    console.log('  Update rule:', updatedCollection.updateRule);
    console.log('  Delete rule:', updatedCollection.deleteRule);

    // Also check and fix default_permissions collection permissions
    const defaultPermsCollection = collections.find((c) => c.name === 'default_permissions');
    if (defaultPermsCollection) {
      console.log('\n=== CHECKING DEFAULT PERMISSIONS COLLECTION ===');
      console.log('Current permissions:');
      console.log('  List rule:', defaultPermsCollection.listRule || 'null');
      console.log('  View rule:', defaultPermsCollection.viewRule || 'null');

      // Update to allow authenticated users to read default permissions
      const updatedDefaultPerms = await pb.collections.update(defaultPermsCollection.id, {
        ...defaultPermsCollection,
        listRule: '@request.auth.id != ""', // Allow authenticated users to list
        viewRule: '@request.auth.id != ""', // Allow authenticated users to view
        createRule: null, // Only admins can create
        updateRule: null, // Only admins can update
        deleteRule: null, // Only admins can delete
      });

      console.log('✅ Default permissions collection updated for authenticated users');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixUserPermissionsCollectionAccess();
