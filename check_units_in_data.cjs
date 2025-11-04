const PocketBase = require('pocketbase/cjs');

async function checkPlantUnitsInData() {
  const pb = new PocketBase('https://api.sipoma.site/');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  console.log('Checking plant_unit values in ccr_parameter_data...');

  const data = await pb.collection('ccr_parameter_data').getFullList({
    fields: 'plant_unit',
    limit: 100,
  });

  const uniqueUnits = [...new Set(data.map((record) => record.plant_unit))];

  console.log('Unique plant_unit values found:');
  uniqueUnits.forEach((unit, index) => {
    console.log(`${index + 1}. ${unit}`);
  });
}

checkPlantUnitsInData();
