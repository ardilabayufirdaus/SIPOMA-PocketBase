// Insert silo data for today
const PocketBase = require('pocketbase/cjs');

async function insertSiloData() {
  const pb = new PocketBase('http://141.11.25.69:8090');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  const silos = await pb.collection('silo_capacities').getFullList();
  const today = new Date().toISOString().split('T')[0];

  for (const silo of silos) {
    // Check if data already exists
    const existing = await pb.collection('ccr_silo_data').getList(1, 1, {
      filter: `date="${today}" && silo_id="${silo.id}"`,
    });

    if (existing.items.length === 0) {
      await pb.collection('ccr_silo_data').create({
        date: today,
        silo_id: silo.id,
        shift1_empty_space: Math.floor(Math.random() * 5000) + 1000,
        shift1_content: Math.floor(Math.random() * silo.capacity * 0.8),
        shift2_empty_space: Math.floor(Math.random() * 5000) + 1000,
        shift2_content: Math.floor(Math.random() * silo.capacity * 0.8),
        shift3_empty_space: Math.floor(Math.random() * 5000) + 1000,
        shift3_content: Math.floor(Math.random() * silo.capacity * 0.8),
      });
      console.log(`Created data for ${silo.silo_name} (${silo.plant_category})`);
    } else {
      console.log(`Data already exists for ${silo.silo_name}`);
    }
  }

  console.log('Done inserting silo data');
}

insertSiloData().catch(console.error);
