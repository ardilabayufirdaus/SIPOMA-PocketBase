const PocketBase = require('pocketbase/cjs');

async function debugParameterSettings() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING PARAMETER SETTINGS ===\n');

    const today = '2025-10-31';
    console.log(`Checking parameter settings for date: ${today}\n`);

    // Try different collection names for parameter settings
    const possibleCollections = [
      'ccr_parameter_settings',
      'parameter_settings',
      'ccr_parameters',
      'parameters',
    ];

    for (const collectionName of possibleCollections) {
      try {
        console.log(`Trying collection: ${collectionName}`);
        const params = await pb.collection(collectionName).getFullList({
          limit: 5,
        });
        console.log(`✅ Found ${params.length} records in ${collectionName}`);
        if (params.length > 0) {
          console.log('Sample record:');
          console.log(JSON.stringify(params[0], null, 2));
        }
        break;
      } catch (error) {
        console.log(`❌ Collection ${collectionName} not found`);
      }
    }

    // Check footer data for Tonasa 4
    console.log('\n1. FOOTER DATA FOR TONASA 4:');
    const footerData = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${today}" && plant_unit="Tonasa 4"`,
      limit: 20,
    });

    console.log(`Found ${footerData.length} footer records for Tonasa 4`);

    if (footerData.length > 0) {
      // Group by parameter_id
      const groupedByParam = footerData.reduce((acc, f) => {
        if (!acc[f.parameter_id]) acc[f.parameter_id] = [];
        acc[f.parameter_id].push(f);
        return acc;
      }, {});

      console.log(`\nFooter data grouped by parameter_id:`);
      Object.keys(groupedByParam).forEach((paramId) => {
        const records = groupedByParam[paramId];
        console.log(`  ${paramId}: ${records.length} records`);
        if (records.length > 0) {
          const sample = records[0];
          console.log(
            `    Counters: shift1=${sample.shift1_counter}, shift2=${sample.shift2_counter}, shift3=${sample.shift3_counter}, shift3_cont=${sample.shift3_cont_counter}`
          );
        }
      });
    }

    // Check material usage for Tonasa 4
    console.log('\n2. MATERIAL USAGE FOR TONASA 4:');
    const materialData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${today}" && plant_category="Tonasa 4"`,
      limit: 20,
    });

    console.log(`Found ${materialData.length} material usage records for Tonasa 4`);

    if (materialData.length > 0) {
      materialData.forEach((m, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`  Unit: ${m.plant_unit}, Shift: ${m.shift}`);
        console.log(`  Clinker: ${m.clinker}, Gypsum: ${m.gypsum}, Limestone: ${m.limestone}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugParameterSettings();
