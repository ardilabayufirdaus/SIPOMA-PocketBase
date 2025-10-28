const PocketBase = require('pocketbase/cjs');

/**
 * Check and fix permissions for ccr_material_usage collection
 */
async function checkAndFixCcrMaterialUsagePermissions() {
  // Get credentials from environment variables
  const pbUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
  const pbEmail = process.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
  const pbPassword = process.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

  const pb = new PocketBase(pbUrl);

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(pbEmail, pbPassword);

    console.log('Checking ccr_material_usage collection permissions...');

    // Get the collection
    const collection = await pb.collections.getOne('ccr_material_usage');

    console.log('Current permissions:');
    console.log('listRule:', collection.listRule);
    console.log('viewRule:', collection.viewRule);
    console.log('createRule:', collection.createRule);
    console.log('updateRule:', collection.updateRule);
    console.log('deleteRule:', collection.deleteRule);

    // Check if permissions are correct
    const expectedRule =
      '@request.auth.id != "" && (@request.auth.role = "super-admin" || @request.auth.role = "admin" || @request.auth.role = "operator")';

    if (
      collection.listRule !== expectedRule ||
      collection.viewRule !== expectedRule ||
      collection.createRule !== expectedRule ||
      collection.updateRule !== expectedRule
    ) {
      console.log('Updating permissions...');

      // Update the collection with correct permissions
      await pb.collections.update(collection.id, {
        listRule: expectedRule,
        viewRule: expectedRule,
        createRule: expectedRule,
        updateRule: expectedRule,
        deleteRule:
          '@request.auth.id != "" && (@request.auth.role = "super-admin" || @request.auth.role = "admin")',
      });

      console.log('✅ Permissions updated successfully');
    } else {
      console.log('✅ Permissions are already correct');
    }

    // Test a simple query to make sure it works
    console.log('Testing collection access...');
    const testRecords = await pb.collection('ccr_material_usage').getList(1, 1);
    console.log('✅ Collection access test successful, found', testRecords.totalItems, 'records');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
checkAndFixCcrMaterialUsagePermissions()
  .then(() => {
    console.log('🎉 ccr_material_usage permissions check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
