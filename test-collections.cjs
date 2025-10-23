const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testCollections() {
  try {
    console.log('Testing ccr_parameter_data collection...');
    const records = await pb.collection('ccr_parameter_data').getList(1, 1);
    console.log('Collection exists, found', records.totalItems, 'records');

    // Test specific parameter
    console.log('Testing parameter hs34fzd79wjkips...');
    const paramRecords = await pb
      .collection('parameter_settings')
      .getFirstListItem('id="hs34fzd79wjkips"');
    console.log('Parameter found:', paramRecords.parameter);

    // Test query format
    console.log('Testing query format...');
    const testQuery = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem('date="2025-10-17 00:00:00.000Z" && parameter_id="hs34fzd79wjkips"');
    console.log('Query successful, record found');
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
    }
  }
}

testCollections();
