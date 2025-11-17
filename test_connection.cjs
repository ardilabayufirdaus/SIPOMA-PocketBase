const PocketBase = require('pocketbase/cjs');

async function testConnection() {
  try {
    const pb = new PocketBase('https://api.sipoma.site');
    console.log('Connecting...');

    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Connected successfully');

    // Test simple query
    const count = await pb.collection('parameter_settings').getFullList({ limit: 1 });
    console.log(`Found ${count.length} records in parameter_settings`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();
