const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFilter() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('Testing filter...');
    const filter = 'module="plant_operations" && parameter_type="ccr_parameters"';
    console.log('Filter:', filter);

    // Test with getList first
    console.log('\nTesting with getList:');
    const listRecords = await pb.collection('parameter_order_profiles').getList(1, 50, {
      filter: filter,
    });
    console.log('Success with getList:', listRecords.items.length, 'results');

    // Test with getFullList
    console.log('\nTesting with getFullList:');
    const fullRecords = await pb.collection('parameter_order_profiles').getFullList({
      filter: filter,
    });
    console.log('Success with getFullList:', fullRecords.length, 'results');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testFilter();
