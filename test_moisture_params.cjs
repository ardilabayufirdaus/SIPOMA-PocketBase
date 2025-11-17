const PocketBase = require('pocketbase/cjs');

async function testParameterSettings() {
  try {
    const pb = new PocketBase('https://api.sipoma.site');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Connected to PocketBase');

    // Test parameter_settings for Cement Mill 220
    const settings = await pb.collection('parameter_settings').getFullList({
      filter: 'plant_unit="Cement Mill 220"',
    });

    console.log(`\nFound ${settings.length} parameter settings for Cement Mill 220:`);
    settings.forEach((s) => {
      console.log(`${s.parameter_name}: ${s.parameter_id}`);
    });

    // Check if moisture parameters exist
    const moistureParams = settings.filter(
      (s) => s.parameter_name.includes('H2O') || s.parameter_name.includes('Set. Feeder')
    );

    console.log(`\nMoisture parameters (${moistureParams.length}):`);
    moistureParams.forEach((s) => {
      console.log(`${s.parameter_name}: ${s.parameter_id}`);
    });

    // Test data availability for 2025-10-27
    if (moistureParams.length > 0) {
      const paramIds = moistureParams.map((s) => s.parameter_id);
      const data = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date="2025-10-27" && parameter_id ?~ "${paramIds.join('|')}"`,
        limit: 5,
      });

      console.log(`\nSample data for 2025-10-27 (${data.length} records):`);
      data.forEach((d) => {
        console.log(`${d.parameter_id}: hour1=${d.hour1}, hour2=${d.hour2}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testParameterSettings();
