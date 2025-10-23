const PocketBase = require('pocketbase/cjs');

const SERVER_URL = 'http://141.11.25.69:8090';
const EMAIL = 'ardila.firdaus@sig.id';
const PASSWORD = 'makassar@270989';

async function testFixedQuery() {
  console.log('Testing fixed query...');

  const pb = new PocketBase(SERVER_URL);

  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD);
    console.log('Authentication successful');

    const records = await pb.collection('ccr_silo_data').getList(1, 50, {
      filter: 'date="2025-10-18"',
      sort: 'created',
      expand: 'silo_id',
    });

    console.log('Query successful! Found', records.items.length, 'records');

    if (records.items.length > 0) {
      const record = records.items[0];
      console.log('Sample record:', {
        id: record.id,
        date: record.date,
        silo_id: record.silo_id,
        silo_name: record.expand?.silo_id?.silo_name,
        unit: record.expand?.silo_id?.unit,
      });
    }
  } catch (error) {
    console.error('Query failed:', error.message);
  }
}

testFixedQuery();
