const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkPlantUnitsPermissions() {
  try {
    console.log('Checking plant_units rule settings...');
    const collections = await pb.collections.getAll();
    const plantUnitsCollection = collections.find((c) => c.name === 'plant_units');

    if (!plantUnitsCollection) {
      console.error('plant_units collection not found!');
      return;
    }

    console.log('Plant Units Collection Rules:');
    console.log('- listRule:', plantUnitsCollection.listRule || '(empty/public)');
    console.log('- viewRule:', plantUnitsCollection.viewRule || '(empty/public)');
    console.log('- createRule:', plantUnitsCollection.createRule || '(empty/public)');
    console.log('- updateRule:', plantUnitsCollection.updateRule || '(empty/public)');
    console.log('- deleteRule:', plantUnitsCollection.deleteRule || '(empty/public)');

    console.log('\nTrying to list plant_units without authentication:');
    try {
      const data = await pb.collection('plant_units').getFullList();
      console.log(`Success! Got ${data.length} records.`);
    } catch (error) {
      console.error('Error listing plant_units:', error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlantUnitsPermissions();
