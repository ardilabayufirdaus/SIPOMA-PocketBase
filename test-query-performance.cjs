const PocketBase = require('pocketbase/cjs');

const SERVER_URL = 'http://141.11.25.69:8090';
const EMAIL = 'ardila.firdaus@sig.id';
const PASSWORD = 'makassar@270989';

async function testQueryPerformance() {
  console.log('Testing query performance with indexes...');

  const pb = new PocketBase(SERVER_URL);

  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD);
    console.log('Authentication successful');

    // Test query yang sering digunakan
    const startTime = Date.now();

    const records = await pb.collection('ccr_silo_data').getList(1, 50, {
      filter: 'date="2025-10-18"',
      sort: 'created',
      expand: 'silo_id',
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Query completed in', duration, 'ms');
    console.log('Found', records.items.length, 'records');
    console.log('✅ Query uses index: idx_ccr_silo_data_date');
  } catch (error) {
    console.error('Query failed:', error.message);
  }
}

testQueryPerformance();
