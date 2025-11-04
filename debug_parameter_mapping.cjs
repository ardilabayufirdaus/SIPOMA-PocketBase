const PocketBase = require('pocketbase/cjs');

async function debugParameterMapping() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING PARAMETER MAPPING ===\n');

    const today = '2025-10-31';

    // 1. Get parameter settings for Counter Feeder materials
    console.log('1. PARAMETER SETTINGS FOR COUNTER FEEDERS:');
    const counterFeederParams = await pb.collection('parameter_settings').getFullList({
      filter: 'parameter~"Counter Feeder"',
      limit: 50,
    });

    console.log(`Found ${counterFeederParams.length} counter feeder parameters`);

    // Group by category and unit
    const groupedParams = counterFeederParams.reduce((acc, p) => {
      const key = `${p.category} - ${p.unit}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    console.log('\nParameters grouped by category-unit:');
    Object.entries(groupedParams).forEach(([key, params]) => {
      console.log(`  ${key}: ${params.length} parameters`);
      params.forEach((p) => {
        console.log(`    - ${p.parameter} (ID: ${p.id})`);
      });
    });

    // 2. Check footer data for Tonasa 4 - Cement Mill 420 parameters
    console.log('\n2. FOOTER DATA FOR TONASA 4 CEMENT MILL 420 PARAMETERS:');

    // Find parameters for Tonasa 4 - Cement Mill 420
    const tonasa4_420_params = counterFeederParams.filter(
      (p) => p.category === 'Tonasa 4' && p.unit === 'Cement Mill 420'
    );

    console.log(`Found ${tonasa4_420_params.length} parameters for Tonasa 4 - Cement Mill 420`);

    if (tonasa4_420_params.length > 0) {
      for (const param of tonasa4_420_params) {
        console.log(`\nParameter: ${param.parameter} (ID: ${param.id})`);

        // Find footer data for this parameter
        const footerData = await pb.collection('ccr_footer_data').getFullList({
          filter: `date="${today}" && parameter_id="${param.id}"`,
          limit: 5,
        });

        if (footerData.length > 0) {
          console.log(`  Footer data found: ${footerData.length} records`);
          footerData.forEach((f) => {
            console.log(`    shift1_counter: ${f.shift1_counter}`);
            console.log(`    shift2_counter: ${f.shift2_counter}`);
            console.log(`    shift3_counter: ${f.shift3_counter}`);
            console.log(`    shift3_cont_counter: ${f.shift3_cont_counter}`);
          });
        } else {
          console.log(`  No footer data found for this parameter`);
        }
      }
    }

    // 3. Compare with material usage data
    console.log('\n3. MATERIAL USAGE DATA FOR TONASA 4 - CEMENT MILL 420:');
    const materialData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${today}" && plant_category="Tonasa 4" && plant_unit="Cement Mill 420"`,
      limit: 10,
    });

    console.log(`Found ${materialData.length} material usage records`);

    materialData.forEach((m, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  Shift: ${m.shift}`);
      console.log(`  Clinker: ${m.clinker}, Gypsum: ${m.gypsum}, Limestone: ${m.limestone}`);
      console.log(`  Created: ${m.created}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

debugParameterMapping();
