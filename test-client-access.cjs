const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testClientInteraction() {
  console.log('Testing client-side interaction (no authentication)...');

  try {
    // Test 1: Try to access parameter_order_profiles without authentication
    console.log('\nTest 1: Accessing parameter_order_profiles as client (no auth):');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
        sort: '-created',
      });
      console.log('Success! Retrieved', records.length, 'records');
    } catch (error) {
      console.error('Error accessing parameter_order_profiles:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }

    // Test 2: Try to access user_parameter_orders without authentication
    console.log('\nTest 2: Accessing user_parameter_orders as client (no auth):');
    try {
      const records = await pb.collection('user_parameter_orders').getFullList();
      console.log('Success! Retrieved', records.length, 'records');
    } catch (error) {
      console.error('Error accessing user_parameter_orders:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testClientInteraction();
