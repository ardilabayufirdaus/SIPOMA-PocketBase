const fetch = require('node-fetch');

async function testPocketBaseApi() {
  try {
    console.log('Testing PocketBase API access...');

    // 1. Test parameter_order_profiles collection
    console.log('\n1. Testing parameter_order_profiles collection with direct API...');
    const profilesResponse = await fetch(
      'http://141.11.25.69:8090/api/collections/parameter_order_profiles/records?sort=-created&filter=' +
        encodeURIComponent('module="plant_operations" && parameter_type="ccr_parameters"')
    );

    const profilesData = await profilesResponse.json();
    console.log(`Status: ${profilesResponse.status}`);

    if (profilesResponse.status === 200) {
      console.log(`Success! Found ${profilesData.items ? profilesData.items.length : 0} profiles`);
      if (profilesData.items && profilesData.items.length > 0) {
        console.log(`First profile: ${profilesData.items[0].name}`);
      }
    } else {
      console.error('Error response:', JSON.stringify(profilesData));
    }

    // 2. Test user_parameter_orders collection
    console.log('\n2. Testing user_parameter_orders collection with direct API...');
    const ordersResponse = await fetch(
      'http://141.11.25.69:8090/api/collections/user_parameter_orders/records'
    );

    const ordersData = await ordersResponse.json();
    console.log(`Status: ${ordersResponse.status}`);

    if (ordersResponse.status === 200) {
      console.log(`Success! Found ${ordersData.items ? ordersData.items.length : 0} orders`);
      if (ordersData.items && ordersData.items.length > 0) {
        console.log(`First order user_id: ${ordersData.items[0].user_id}`);
      }
    } else {
      console.error('Error response:', JSON.stringify(ordersData));
    }

    // 3. Try to get PocketBase server info
    console.log('\n3. Checking PocketBase server status...');
    const healthResponse = await fetch('http://141.11.25.69:8090/api/health');

    if (healthResponse.status === 200) {
      const healthData = await healthResponse.json();
      console.log('PocketBase server is running:', JSON.stringify(healthData));
    } else {
      console.error('PocketBase server health check failed. Status:', healthResponse.status);
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testPocketBaseApi();
