const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function testConnection() {
  try {
    console.log('Testing PocketBase connection...');
    console.log('URL:', pocketbaseUrl);
    console.log('Email:', adminEmail);

    // Test basic connection
    const health = await pb.health.check();
    console.log('Health check:', health);

    // Test authentication
    console.log('Authenticating...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    // List collections
    console.log('Listing collections...');
    const collections = await pb.collections.getFullList();
    console.log('Collections found:', collections.length);

    // Check if cop_footer_parameters exists
    const existingCollection = collections.find((c) => c.name === 'cop_footer_parameters');
    if (existingCollection) {
      console.log('cop_footer_parameters collection already exists');
    } else {
      console.log('cop_footer_parameters collection does not exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.status);
      console.error('Response data:', error.response);
    }
  }
}

testConnection();
