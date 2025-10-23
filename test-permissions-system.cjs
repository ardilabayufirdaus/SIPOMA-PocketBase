const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testPermissionsSystem() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING PERMISSIONS SYSTEM ===\n');

    // Test 1: Check user permissions collection
    console.log('1. User Permissions Collection:');
    const userPerms = await pb.collection('user_permissions').getList(1, 5);
    console.log(`   Total records: ${userPerms.totalItems}`);
    if (userPerms.items.length > 0) {
      const sample = userPerms.items[0];
      console.log(
        `   Sample: user_id=${sample.user_id}, role=${sample.role}, custom=${sample.is_custom_permissions}`
      );
      console.log(`   Permissions: ${sample.permissions_data.substring(0, 100)}...`);
    }

    // Test 2: Check default permissions
    console.log('\n2. Default Permissions Collection:');
    const defaultPerms = await pb.collection('default_permissions').getList(1, 5);
    console.log(`   Total records: ${defaultPerms.totalItems}`);
    defaultPerms.items.forEach((item) => {
      console.log(`   ${item.role}: ${item.permissions_data.substring(0, 50)}...`);
    });

    // Test 3: Check audit trail
    console.log('\n3. Audit Trail:');
    const logs = await pb.collection('user_activity_logs').getList(1, 5, {
      filter: 'action_type = "permission_change"',
      sort: '-created',
    });
    console.log(`   Permission change logs: ${logs.totalItems}`);
    if (logs.items.length > 0) {
      console.log(`   Latest: ${logs.items[0].action_details?.action} at ${logs.items[0].created}`);
    }

    // Test 4: Verify Operator role has plant operations
    console.log('\n4. Operator Role Permissions:');
    const operatorDefaults = defaultPerms.items.find((p) => p.role === 'Operator');
    if (operatorDefaults) {
      const perms = JSON.parse(operatorDefaults.permissions_data);
      console.log('   Plant operations:', JSON.stringify(perms.plant_operations, null, 2));
    }

    console.log('\n✅ Permissions system test completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPermissionsSystem();
