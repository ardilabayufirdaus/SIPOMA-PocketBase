const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testCcrDataPage() {
  console.log('Testing CcrDataEntryPage fetchProfiles function...');

  try {
    // Simulating the exact fetchProfiles function from CcrDataEntryPage.tsx
    console.log('\nTest 1: Simulating fetchProfiles function:');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
        sort: '-created_at',
      });

      console.log('Success! Retrieved', records.length, 'records');
      if (records.length > 0) {
        console.log('First profile name:', records[0].name);
        console.log('Field values from first record:');
        console.log('- module:', records[0].module);
        console.log('- parameter_type:', records[0].parameter_type);
        console.log('- user_id:', records[0].user_id);
        console.log('- parameter_order:', JSON.stringify(records[0].parameter_order));
      }
    } catch (error) {
      console.error('Error with fetchProfiles simulation:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }

    // Test 2: Try creating a new profile
    console.log('\nTest 2: Creating a new test profile:');
    try {
      const testData = {
        name: 'Test Profile ' + new Date().toISOString(),
        description: 'Created by test script',
        user_id: 'test-user',
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        category: 'test-category',
        unit: 'test-unit',
        parameter_order: ['p1', 'p2', 'p3'],
      };

      const record = await pb.collection('parameter_order_profiles').create(testData);
      console.log('Success! Created profile with ID:', record.id);
    } catch (error) {
      console.error('Error creating test profile:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }

    // Test 3: Try with different filter format
    console.log('\nTest 3: Trying alternative filter format:');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
      });

      console.log('Success! Retrieved', records.length, 'records with alternative filter');
    } catch (error) {
      console.error('Error with alternative filter:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testCcrDataPage();
