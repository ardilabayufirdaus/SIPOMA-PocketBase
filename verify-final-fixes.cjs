const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function finalVerification() {
  try {
    console.log('Final verification of all fixes...');

    // 1. Test parameter_order_profiles collection
    console.log('\n1. Testing parameter_order_profiles collection:');
    try {
      // Use the fixed filter syntax
      const profiles = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
      });

      console.log(`✅ Success! Retrieved ${profiles.length} profiles`);

      // Test creating a profile
      console.log('\nCreating a test profile:');
      await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

      const testProfile = {
        name: 'Final Test Profile',
        description: 'Created by final verification script',
        user_id: 'system',
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        parameter_order: ['finaltest1', 'finaltest2', 'finaltest3'],
      };

      const newProfile = await pb.collection('parameter_order_profiles').create(testProfile);
      console.log(`✅ Successfully created profile with ID: ${newProfile.id}`);
    } catch (error) {
      console.error(`❌ Error with parameter_order_profiles: ${error.message}`);
    }

    // 2. Test user_parameter_orders collection with relation field
    console.log('\n2. Testing user_parameter_orders collection with relation field:');

    try {
      // Find a real user ID to test with
      const users = await pb.collection('_pb_users_auth_').getList(1, 1);
      if (users.items.length > 0) {
        const testUserId = users.items[0].id;

        // Test with the filter syntax we're using in our code
        const filter = `user_id = "${testUserId}" && module = "plant_operations" && parameter_type = "ccr_parameters"`;
        console.log(`Using filter: ${filter}`);

        const records = await pb.collection('user_parameter_orders').getList(1, 5, {
          filter: filter,
        });

        console.log(`✅ Success! Found ${records.items.length} records`);

        // Test creating a record
        console.log('\nCreating a test user_parameter_orders record:');

        const testOrder = {
          user_id: testUserId,
          module: 'plant_operations',
          parameter_type: 'ccr_parameters',
          category: 'FINAL_TEST',
          unit: 'TEST_UNIT',
          parameter_order: ['final1', 'final2', 'final3'],
        };

        const newOrder = await pb.collection('user_parameter_orders').create(testOrder);
        console.log(`✅ Successfully created order with ID: ${newOrder.id}`);

        // Verify we can retrieve it with our filter
        const verifyFilter = `user_id = "${testUserId}" && module = "plant_operations" && parameter_type = "ccr_parameters" && category = "FINAL_TEST"`;

        const verifyRecords = await pb.collection('user_parameter_orders').getList(1, 1, {
          filter: verifyFilter,
        });

        if (verifyRecords.items.length > 0) {
          console.log(`✅ Successfully verified retrieval with filter`);
        } else {
          console.error(`❌ Could not verify retrieval with filter`);
        }
      } else {
        console.log('No users found to test with');
      }
    } catch (error) {
      console.error(`❌ Error with user_parameter_orders: ${error.message}`);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

finalVerification();
