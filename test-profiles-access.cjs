// This script will check if the parameter_order_profiles collection is accessible
// and if we can filter records properly

const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testAccess() {
  try {
    // Try fetching records without authentication (as public)
    console.log('Testing public access to parameter_order_profiles...');

    // Test general access
    const records = await pb.collection('parameter_order_profiles').getFullList({
      sort: 'created',
    });
    console.log(`Found ${records.length} profiles`);

    // Test filter with module and parameter_type
    const filteredRecords = await pb.collection('parameter_order_profiles').getList(1, 50, {
      filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
    });

    console.log(`Filter query returned ${filteredRecords.items.length} profiles`);

    // Test user_id filter
    const userFilteredRecords = await pb.collection('parameter_order_profiles').getList(1, 50, {
      filter: 'user_id = "system"',
    });

    console.log(`User filter query returned ${userFilteredRecords.items.length} profiles`);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

testAccess();
