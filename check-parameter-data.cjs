const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkParameterData() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    const records = await pb.collection('ccr_parameter_data').getFullList();
    console.log('Total ccr_parameter_data records:', records.length);

    if (records.length > 0) {
      console.log('Latest records:');
      const latest = records.slice(-3); // Show last 3 records
      latest.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, {
          id: record.id,
          date: record.date,
          parameter_id: record.parameter_id,
          hourly_values: record.hourly_values,
          name: record.name,
          created: record.created,
        });
      });
    } else {
      console.log('No records found in ccr_parameter_data');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkParameterData();
