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
        `- Parameter: "${setting.parameter}", Unit: "${setting.unit}", ID: ${setting.id}`
      );
    });

    // Check specifically for Tonasa 2/3
    const tonasaSettings = paramSettings.filter((s) => s.unit === 'Tonasa 2/3');
    console.log(`\n🏭 Parameter settings for "Tonasa 2/3": ${tonasaSettings.length}`);
    tonasaSettings.forEach((setting) => {
      console.log(`- Parameter: "${setting.parameter}", ID: ${setting.id}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkParameterSettings();
