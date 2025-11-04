const PocketBase = require('pocketbase/cjs');

async function inspectParameterSettings() {
  try {
    const pb = new PocketBase('https://api.sipoma.site/');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== INSPECTING PARAMETER_SETTINGS COLLECTION ===\n');

    // Get first record to see structure
    const records = await pb.collection('parameter_settings').getList(1, 1);
    console.log(`Found ${records.totalItems} total records`);

    if (records.items.length > 0) {
      const sample = records.items[0];
      console.log('\nSample record structure:');
      console.log(JSON.stringify(sample, null, 2));

      console.log('\nField names:');
      Object.keys(sample).forEach((key) => {
        console.log(`- ${key}: ${typeof sample[key]} = ${sample[key]}`);
      });
    }

    // Try to find records for Cement Mill 220
    console.log('\n=== SEARCHING FOR CEMENT MILL 220 ===');
    const cm220Records = await pb.collection('parameter_settings').getFullList({
      filter: 'unit="Cement Mill 220"',
    });

    console.log(`Found ${cm220Records.length} records for Cement Mill 220`);
    if (cm220Records.length > 0) {
      cm220Records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.parameter} (ID: ${record.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectParameterSettings();
