const PocketBase = require('pocketbase/cjs');

async function testMoistureMapping() {
  try {
    const pb = new PocketBase('https://api.sipoma.site/');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING MOISTURE PARAMETER MAPPING ===\n');

    const plantUnit = 'Cement Mill 220';

    // Fetch parameter settings for the selected plant unit
    const paramSettings = await pb.collection('parameter_settings').getFullList({
      filter: `unit="${plantUnit}"`,
    });

    console.log(`Found ${paramSettings.length} parameter settings for ${plantUnit}`);

    // Map parameter names to IDs
    const paramMap = new Map();
    paramSettings.forEach((setting) => {
      paramMap.set(setting.parameter, setting.id);
    });

    // Get parameter IDs for moisture calculations
    const h2oGypsumId = paramMap.get('H2O Gypsum (%)');
    const setGypsumId = paramMap.get('Set. Feeder Gypsum (%)');
    const h2oTrassId = paramMap.get('H2O Trass (%)');
    const setTrassId = paramMap.get('Set. Feeder Trass (%)');
    const h2oLimestoneId = paramMap.get('H2O Limestone (%)');
    const setLimestoneId = paramMap.get('Set. Feeder Limestone (%)');

    console.log('\nMoisture parameter mapping:');
    console.log(`H2O Gypsum: ${h2oGypsumId}`);
    console.log(`Set. Feeder Gypsum: ${setGypsumId}`);
    console.log(`H2O Trass: ${h2oTrassId}`);
    console.log(`Set. Feeder Trass: ${setTrassId}`);
    console.log(`H2O Limestone: ${h2oLimestoneId}`);
    console.log(`Set. Feeder Limestone: ${setLimestoneId}`);

    const parameterIds = [
      h2oGypsumId,
      setGypsumId,
      h2oTrassId,
      setTrassId,
      h2oLimestoneId,
      setLimestoneId,
    ].filter(Boolean);
    console.log(`\nTotal parameter IDs found: ${parameterIds.length}`);

    if (parameterIds.length > 0) {
      // Test data availability for 2025-10-27
      const data = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date="2025-10-27" && parameter_id ?~ "${parameterIds.join('|')}"`,
        limit: 10,
      });

      console.log(`\nSample data for 2025-10-27: ${data.length} records`);
      if (data.length > 0) {
        data.forEach((d) => {
          console.log(
            `Parameter ${d.parameter_id}: hour1=${d.hour1}, hour2=${d.hour2}, hour3=${d.hour3}`
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMoistureMapping();
