const PocketBase = require('pocketbase/cjs');

async function checkParameterSettings() {
  try {
    const pb = new PocketBase('http://141.11.25.69:8090');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Connected to PocketBase');

    const settings = await pb.collection('parameter_settings').getFullList();
    console.log(`Found ${settings.length} parameter settings`);

    // Filter for Cement Mill 220 moisture parameters
    const cm220Moisture = settings.filter(
      (s) =>
        s.plant_unit === 'Cement Mill 220' &&
        (s.parameter_name.includes('H2O') || s.parameter_name.includes('Set. Feeder'))
    );

    console.log(`\nCement Mill 220 moisture parameters (${cm220Moisture.length}):`);
    cm220Moisture.forEach((s) => {
      console.log(`${s.parameter_name}: ${s.parameter_id}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkParameterSettings();
