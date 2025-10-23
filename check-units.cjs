// Check plant units
const PocketBase = require('pocketbase/cjs');

async function checkUnits() {
  const pb = new PocketBase('http://141.11.25.69:8090');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
  const units = await pb.collection('plant_units').getFullList();
  console.log('All Plant Units:');
  units.forEach((u) => console.log(`  ${u.unit}: ${u.category}`));
}

checkUnits().catch(console.error);
