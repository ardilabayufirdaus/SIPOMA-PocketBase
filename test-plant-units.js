const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://api.sipoma.site/');

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
