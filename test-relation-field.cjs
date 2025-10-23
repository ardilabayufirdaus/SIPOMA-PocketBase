const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testRelationField() {
  console.log('Testing relation field handling...');

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Admin authentication successful');

    // 1. Test filter syntax with relation field
    console.log('\n1. Testing filter syntax with relation field:');

    try {
      // First try with direct ID search to understand the schema
      const authUsers = await pb.collection('_pb_users_auth_').getList(1, 10);

      if (authUsers.items.length > 0) {
        const testUserId = authUsers.items[0].id;
        console.log(`Found test user ID: ${testUserId}`);

        // Test relation field filter
        console.log('\nTesting relation field filter:');
        const filter = `user_id.id = "${testUserId}"`;
        console.log('Filter:', filter);

        const records = await pb.collection('user_parameter_orders').getList(1, 10, {
          filter: filter,
        });

        console.log(`Found ${records.items.length} records with relation field filter`);

        // Try the alternative filter syntax
        console.log('\nTesting alternative relation field filter:');
        const altFilter = `user_id = "${testUserId}"`;
        console.log('Filter:', altFilter);

        try {
          const altRecords = await pb.collection('user_parameter_orders').getList(1, 10, {
            filter: altFilter,
          });

          console.log(`Found ${altRecords.items.length} records with alternative filter`);
        } catch (altError) {
          console.error('Alternative filter failed:', altError.message);
        }

        // 2. Test creating a record with relation field
        console.log('\n2. Testing creation with relation field:');

        try {
          const newRecord = {
            user_id: testUserId,
            module: 'plant_operations',
            parameter_type: 'ccr_parameters',
            category: 'test_category',
            unit: 'test_unit',
            parameter_order: ['test1', 'test2', 'test3'],
          };

          const result = await pb.collection('user_parameter_orders').create(newRecord);
          console.log('Successfully created record with ID:', result.id);

          // Verify the record was created properly
          const createdRecord = await pb.collection('user_parameter_orders').getOne(result.id);
          console.log(
            'Created record:',
            JSON.stringify({
              id: createdRecord.id,
              user_id: createdRecord.user_id,
              module: createdRecord.module,
              parameter_type: createdRecord.parameter_type,
              parameter_order: createdRecord.parameter_order,
            })
          );
        } catch (createError) {
          console.error('Create failed:', createError.message);
          if (createError.response) {
            console.error('Response data:', createError.response.data);
          }
        }
      } else {
        console.log('No users found to test with');
      }
    } catch (error) {
      console.error('Test failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRelationField();
