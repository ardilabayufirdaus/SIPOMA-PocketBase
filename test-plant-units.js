const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkPlantUnits() {
  try {
    const data = await pb.collection('plant_units').getFullList();
    console.log('Total plant units:', data.length);
    console.log('Sample units:', data.slice(0, 3));
  } catch (error) {
    console.error('Error fetching plant units:', error);
  }
}

checkPlantUnits();

