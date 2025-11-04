const PocketBase = require('pocketbase/cjs');

async function checkAllParameters() {
  const pb = new PocketBase('https://api.sipoma.site/');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  console.log('Checking all parameter IDs in ccr_parameter_data...');

  const data = await pb.collection('ccr_parameter_data').getFullList({
    fields: 'parameter_id,date',
    limit: 20,
  });

  console.log(`Found ${data.length} records`);

  if (data.length > 0) {
    console.log('Sample records:');
    data.forEach((record, i) => {
      console.log(`${i + 1}. Parameter: ${record.parameter_id}, Date: ${record.date}`);
    });
  }
}

checkAllParameters();
