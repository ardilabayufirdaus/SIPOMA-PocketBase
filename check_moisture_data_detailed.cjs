const PocketBase = require('pocketbase/cjs');

async function checkMoistureData() {
  try {
    const pb = new PocketBase('https://api.sipoma.site/');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING MOISTURE DATA AVAILABILITY ===\n');

    // Moisture parameter IDs for Cement Mill 220
    const moistureParamIds = [
      'dkylkeiv004fz80', // H2O Gypsum
      '13l52aw1o79f1xu', // Set. Feeder Gypsum
      'b6sw07wl4zw7svp', // H2O Trass
      'rzsjhcgo0d75cz9', // Set. Feeder Trass
      '03wu2dk5p6ky2m0', // H2O Limestone
      'iv8qkbleeqg88v4', // Set. Feeder Limestone
    ];

    console.log('Checking moisture parameters for 2025-10-27:');
    console.log(`Parameter IDs: ${moistureParamIds.join(', ')}\n`);

    // Check each parameter individually
    for (const paramId of moistureParamIds) {
      const records = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date="2025-10-27" && parameter_id="${paramId}"`,
      });

      console.log(`${paramId}: ${records.length} records`);
      if (records.length > 0) {
        const record = records[0];
        console.log(
          `  hour1=${record.hour1}, hour2=${record.hour2}, hour3=${record.hour3}, hour4=${record.hour4}`
        );
      }
    }

    // Try the combined query like in the hook
    console.log('\nCombined query result:');
    const combined = await pb.collection('ccr_parameter_data').getFullList({
      filter: `date="2025-10-27" && parameter_id ?~ "${moistureParamIds.join('|')}"`,
      limit: 10,
    });

    console.log(`Combined query: ${combined.length} records`);
    combined.forEach((record) => {
      console.log(`  ${record.parameter_id}: hour1=${record.hour1}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMoistureData();
