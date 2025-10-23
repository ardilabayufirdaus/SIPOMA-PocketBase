const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function debugUserAndPermissions() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING USER AND PERMISSIONS ===\n');

    const targetUserId = '3ucxta9dvkumzvf';

    // Check if the user exists
    console.log('--- Checking if user exists ---');
    try {
      const user = await pb.collection('users').getOne(targetUserId);
      console.log('✅ User exists:', {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
      });
    } catch (error) {
      console.log('❌ User does not exist or cannot be accessed:', error.message);
      return;
    }

    // Check existing permissions
    console.log('\n--- Checking existing permissions ---');
    const existingPerms = await pb.collection('user_permissions').getFullList({
      filter: `user_id = '${targetUserId}'`,
    });
    console.log(`Found ${existingPerms.length} permission records for user ${targetUserId}`);

    // Check user_permissions collection schema
    console.log('\n--- Checking user_permissions collection schema ---');
    try {
      const collections = await pb.collections.getFullList();
      const userPermsCollection = collections.find((c) => c.name === 'user_permissions');
      if (userPermsCollection) {
        console.log('Collection schema:');
        console.log(
          '- Fields:',
          userPermsCollection.fields.map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required,
            unique: f.unique,
          }))
        );
        console.log('- Rules:', {
          createRule: userPermsCollection.createRule,
          updateRule: userPermsCollection.updateRule,
          deleteRule: userPermsCollection.deleteRule,
        });
      }
    } catch (error) {
      console.log('❌ Could not get collection schema:', error.message);
    }

    // Try to create the permission record manually
    console.log('\n--- Attempting manual permission creation ---');
    const testPermissions = {
      dashboard: 'NONE',
      plant_operations: {},
      inspection: 'NONE',
      project_management: 'NONE',
    };

    const permissionData = {
      user_id: targetUserId,
      permissions_data: JSON.stringify(testPermissions),
      is_custom_permissions: true,
      role: 'Unknown', // We'll get this from the user
    };

    console.log('Data to create:', permissionData);

    try {
      const result = await pb.collection('user_permissions').create(permissionData);
      console.log('✅ Manual creation successful:', result.id);
    } catch (error) {
      console.log('❌ Manual creation failed:', error.message);
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugUserAndPermissions();
