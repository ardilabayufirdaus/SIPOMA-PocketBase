// Check silo categories
const PocketBase = require('pocketbase/cjs');

async function checkSilos() {
  const pb = new PocketBase('http://141.11.25.69:8090');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
  const silos = await pb.collection('silo_capacities').getFullList();
  console.log('Silo Capacities:');
  silos.forEach((s) => console.log(`  ${s.silo_name}: ${s.plant_category}`));
}

checkSilos().catch(console.error);
