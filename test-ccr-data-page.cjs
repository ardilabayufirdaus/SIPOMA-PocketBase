const PocketBase = require('pocketbase/cjs');

// Gunakan kredensial yang sesuai dengan .env
const SERVER_URL = process.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090';
const EMAIL = process.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const PASSWORD = process.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

const pb = new PocketBase(SERVER_URL);

async function testCcrDataPage() {
  console.log('Starting CCR Data Entry page simulation test...');

  try {
    // Autentikasi terlebih dahulu
    console.log('\nAuthentication with admin...');
    try {
      await pb.admins.authWithPassword(EMAIL, PASSWORD);
      console.log('✅ Authentication success!');
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    // 1. Test accessing parameter_order_profiles without authentication
    console.log('\n1. Testing public access to parameter_order_profiles with filter...');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
        sort: '-created_at',
      });

      console.log(`✅ Success! Found ${records.length} profiles`);
      if (records.length > 0) {
        console.log(`First profile: ${records[0].name} (ID: ${records[0].id})`);
        console.log(`User ID: ${records[0].user_id}`);
        console.log(`Parameter order has ${records[0].parameter_order.length} items`);
      }
    } catch (error) {
      console.error('❌ Error accessing parameter_order_profiles:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }

    // 2. Test accessing user_parameter_orders collection
    console.log('\n2. Testing public access to user_parameter_orders...');
    try {
      const records = await pb.collection('user_parameter_orders').getFullList({
        sort: '-created_at',
      });

      console.log(`✅ Success! Found ${records.length} user parameter orders`);
      if (records.length > 0) {
        console.log(`First user_id: ${records[0].user_id}`);
        console.log(`Module: ${records[0].module}`);
        console.log(`Parameter type: ${records[0].parameter_type}`);
      }
    } catch (error) {
      console.error('❌ Error accessing user_parameter_orders:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }

    // 3. Test simulating exact query from CcrDataEntryPage.tsx
    console.log('\n3. Testing exact query from CcrDataEntryPage.tsx...');
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
        sort: '-created_at',
      });

      console.log(`✅ Success! Found ${records.length} profiles with exact query`);
    } catch (error) {
      console.error('❌ Error with exact query:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testCcrDataPage();
