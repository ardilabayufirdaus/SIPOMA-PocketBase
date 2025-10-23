const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkUpdatedData() {
  try {
    console.log('Checking updated data structure...');
    const records = await pb.collection('ccr_parameter_data').getList(1, 10);
    console.log('Total records:', records.totalItems);

    if (records.totalItems > 0) {
      records.items.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log('  Date:', record.date);
        console.log('  Parameter ID:', record.parameter_id);
        console.log('  Hourly values structure:', typeof record.hourly_values);
        console.log('  Sample hourly values:', JSON.stringify(record.hourly_values, null, 2));
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkUpdatedData();
