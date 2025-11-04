const PocketBase = require('pocketbase/cjs');

async function checkPlantUnits() {
  const pb = new PocketBase('https://api.sipoma.site/');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  try {
    const records = await pb.collection('plant_units').getFullList({
      fields: 'id,unit,category,description',
    });

    console.log('Plant Units:');
    records.forEach((record, index) => {
      console.log(
        `${index + 1}. ID: ${record.id}, Unit: ${record.unit}, Category: ${record.category}, Description: ${record.description || 'N/A'}`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPlantUnits();
