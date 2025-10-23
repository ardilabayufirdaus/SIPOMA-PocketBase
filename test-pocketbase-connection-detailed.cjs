// Test PocketBase connection with authentication
const PocketBase = require('pocketbase/cjs');

// Read environment variables manually for the script
const SERVER_URL = process.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090';
const EMAIL = process.env.VITE_GUEST_USERNAME || 'ardila.firdaus@sig.id';
const PASSWORD = process.env.VITE_GUEST_PASSWORD || 'makassar@270989';

async function testConnection() {
  console.log(`Testing connection to PocketBase at ${SERVER_URL}`);

  try {
    // Initialize PocketBase
    const pb = new PocketBase(SERVER_URL);
    console.log('PocketBase initialized');

    // Authenticate
    console.log(`Attempting to authenticate as ${EMAIL}`);
    const authData = await pb.admins.authWithPassword(EMAIL, PASSWORD);
    console.log('Authentication successful');
    console.log('Auth token:', pb.authStore.token);

    // Test fetching ccr_silo_data collection
    console.log('\nFetching CCR Silo Data collection...');
    try {
      const ccrData = await pb.collection('ccr_silo_data').getList(1, 10, {
        sort: '-created',
      });

      console.log(`CCR Silo Data entries found: ${ccrData.totalItems}`);

      if (ccrData.totalItems > 0) {
        console.log('Sample record:', JSON.stringify(ccrData.items[0], null, 2));
      } else {
        console.log('No CCR Silo Data records found.');
      }
    } catch (err) {
      console.error('Error fetching CCR Silo Data:', err.message);
    }

    // Check collection schema
    console.log('\nFetching collection schema...');
    try {
      const collections = await pb.collections.getFullList();
      const ccrCollection = collections.find((c) => c.name === 'ccr_silo_data');

      if (ccrCollection) {
        console.log('CCR Silo Data schema:', JSON.stringify(ccrCollection.schema, null, 2));
      } else {
        console.error('CCR Silo Data collection not found!');
      }
    } catch (err) {
      console.error('Error fetching collections:', err.message);
    }
  } catch (err) {
    console.error('Connection or authentication error:', err.message);
    if (err.data) {
      console.error('Additional error data:', JSON.stringify(err.data, null, 2));
    }
  }
}

testConnection().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
