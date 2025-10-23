const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkSavedData() {
  try {
    console.log('Checking if parameter data was saved...');
    const records = await pb.collection('ccr_parameter_data').getList(1, 50);
    console.log('Total records:', records.totalItems);

    if (records.totalItems > 0) {
      console.log('Records found:');
      records.items.forEach((record, index) => {
        console.log(
          `${index + 1}. Date: ${record.date}, Parameter: ${record.parameter_id}, Hourly values:`,
          record.hourly_values
        );
      });
    } else {
      console.log('No records found');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkSavedData();
