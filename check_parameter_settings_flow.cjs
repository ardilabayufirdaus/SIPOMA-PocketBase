const PocketBase = require('pocketbase/cjs');

async function checkParameterSettings() {
  try {
    // Initialize PocketBase
    const pb = new PocketBase('http://141.11.25.69:8090');

    // Authenticate
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Connected to PocketBase');

    // Get all parameter settings
    const paramSettings = await pb.collection('parameter_settings').getFullList();
    console.log(`\n📊 Found ${paramSettings.length} parameter settings:`);

    paramSettings.forEach((setting) => {
      console.log(
        `- Parameter: "${setting.parameter_name}", Unit: "${setting.plant_unit}", ID: ${setting.parameter_id}`
      );
    });

    // Check specifically for Cement Mill 220
    const cm220Settings = paramSettings.filter((s) => s.plant_unit === 'Cement Mill 220');
    console.log(`\n🏭 Parameter settings for "Cement Mill 220": ${cm220Settings.length}`);
    cm220Settings.forEach((setting) => {
      console.log(`- Parameter: "${setting.parameter_name}", ID: ${setting.parameter_id}`);
    });

    // Filter for moisture-related parameters
    const moistureParams = paramSettings.filter(
      (s) => s.parameter_name.includes('H2O') || s.parameter_name.includes('Set. Feeder')
    );

    console.log(`\n💧 Moisture-related parameters (${moistureParams.length}):`);
    moistureParams.forEach((s) => {
      console.log(
        `Plant Unit: ${s.plant_unit}, Parameter: ${s.parameter_name}, ID: ${s.parameter_id}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkParameterSettings();
