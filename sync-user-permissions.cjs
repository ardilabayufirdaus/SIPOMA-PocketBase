const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function syncUserPermissionsToUsersCollection() {
  try {
    console.log('=== SYNCING USER PERMISSIONS TO USERS COLLECTION ===\n');

    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Admin authenticated\n');

    // Get all user permissions
    console.log('Fetching all user permissions...');
    const allPermissions = await pb.collection('user_permissions').getFullList({
      fields: 'id,user_id,permissions_data',
    });

    console.log(`Found ${allPermissions.length} permission records\n`);

    // Update each user's permissions field in the users collection
    let successCount = 0;
    let errorCount = 0;

    for (const permission of allPermissions) {
      try {
        const permissions = JSON.parse(permission.permissions_data);

        await pb.collection('users').update(permission.user_id, {
          permissions: permissions,
        });

        console.log(`✅ Updated user ${permission.user_id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update user ${permission.user_id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SYNC COMPLETE ===');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);

    if (errorCount === 0) {
      console.log('\n🎉 All user permissions have been synced to the users collection!');
      console.log('Users should now see their correct permissions when they log in.');
    }
  } catch (error) {
    console.error('❌ Failed to sync permissions:', error.message);
  }
}

syncUserPermissionsToUsersCollection();
