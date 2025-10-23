const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkPlantUnitsAccess() {
  try {
    console.log('Trying to list plant_units without authentication:');
    try {
      const data = await pb.collection('plant_units').getFullList();
      console.log(`Success! Got ${data.length} records.`);
      console.log('First 2 records:', data.slice(0, 2));
    } catch (error) {
      console.error('Error listing plant_units:', error);
    }

    console.log('\nTrying to filter plant_units:');
    try {
      const filtered = await pb.collection('plant_units').getFullList({
        filter: 'category = "Tonasa 4"',
      });
      console.log(`Success! Got ${filtered.length} records with filter.`);
      console.log('Filtered records:', filtered);
    } catch (error) {
      console.error('Error filtering plant_units:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlantUnitsAccess();
