const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testRealtimeUsersHook() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Admin authenticated\n');

    // Simulate what useRealtimeUsers does
    console.log('=== SIMULATING useRealtimeUsers HOOK ===\n');

    // Get users list (like the hook does)
    const result = await pb.collection('users').getList(1, 5, {
      sort: '-created',
      fields: 'id,username,name,role,is_active,created,updated,avatar,last_active,permissions',
    });

    console.log(`Found ${result.items.length} users\n`);

    // Process users like the hook does
    for (const user of result.items.slice(0, 3)) {
      // Test first 3 users
      console.log(`Processing user: ${user.username} (${user.id})`);

      // Fetch permissions from user_permissions collection
      try {
        const permissionRecords = await pb.collection('user_permissions').getFullList({
          filter: `user_id = '${user.id}'`,
          fields: 'permissions_data',
        });

        let userPermissions;
        if (permissionRecords.length > 0) {
          userPermissions = JSON.parse(permissionRecords[0].permissions_data);
          console.log(`✅ Found custom permissions in user_permissions collection`);
        } else {
          console.log(`⚠️ No custom permissions found, would use role defaults`);
          userPermissions = { dashboard: 'DEFAULT', plant_operations: 'DEFAULT' }; // Mock
        }

        console.log(`   Dashboard: ${userPermissions.dashboard}`);
        console.log(`   Plant Operations: ${userPermissions.plant_operations}`);
        console.log(`   Inspection: ${userPermissions.inspection}`);
        console.log('');
      } catch (error) {
        console.error(`❌ Failed to fetch permissions for ${user.username}:`, error.message);
      }
    }

    console.log('=== TEST COMPLETE ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealtimeUsersHook();
