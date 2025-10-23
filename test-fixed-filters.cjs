const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testAllFixedFunctions() {
  try {
    console.log('Testing all fixed PocketBase filter functions...');

    // 1. Test the fetchProfiles function from CcrDataEntryPage.tsx
    console.log('\n1. Testing fetchProfiles with fixed filter syntax:');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
      });

      console.log(`✅ Success! Retrieved ${records.length} profiles`);
      if (records.length > 0) {
        console.log('First profile: ', records[0].name);
      }
    } catch (error) {
      console.error('❌ Error with fetchProfiles:', error.message);
    }

    // 2. Test the loadParameterOrder function from useUserParameterOrder.ts
    console.log('\n2. Testing loadParameterOrder with fixed filter syntax:');
    try {
      // Using a test user ID
      const userId = 'test-user';
      const module = 'plant_operations';
      const parameterType = 'ccr_parameters';
      const category = 'CEMENT_MILL';
      const unit = 'CM1';

      const filterParts = [
        `user_id = "${userId}"`,
        `module = "${module}"`,
        `parameter_type = "${parameterType}"`,
        `category = "${category}"`,
        `unit = "${unit}"`,
      ];

      const filter = filterParts.join(' && ');

      console.log('Filter:', filter);

      const result = await pb.collection('user_parameter_orders').getList(1, 1, {
        filter: filter,
      });

      console.log(`✅ Success! Found ${result.items.length} orders`);
      if (result.items.length > 0) {
        console.log('Parameter order:', result.items[0].parameter_order);
      } else {
        console.log('No parameter order found (this is normal for new users)');
      }
    } catch (error) {
      console.error('❌ Error with loadParameterOrder:', error.message);
    }

    // 3. Test creating a parameter_order record
    console.log('\n3. Testing creation of user_parameter_orders:');
    try {
      await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

      const testData = {
        user_id: 'test-user-' + Date.now(),
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        category: 'CEMENT_MILL',
        unit: 'CM1',
        parameter_order: ['param1', 'param2', 'param3'],
      };

      const record = await pb.collection('user_parameter_orders').create(testData);
      console.log(`✅ Success! Created user parameter order with ID: ${record.id}`);
    } catch (error) {
      console.error('❌ Error creating user parameter order:', error.message);
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testAllFixedFunctions();
