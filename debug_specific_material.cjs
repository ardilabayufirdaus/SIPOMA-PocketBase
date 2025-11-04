const PocketBase = require('pocketbase/cjs');

async function debugSpecificMaterialUsage() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING SPECIFIC MATERIAL USAGE ===\n');

    const today = '2025-10-31';
    console.log(`Checking data for date: ${today}\n`);

    // Check footer data for specific unit/category
    console.log('1. FOOTER DATA FOR TONASA 4 - CEMENT MILL 420:');
    const footerData = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${today}" && plant_unit="Cement Mill 420"`,
      limit: 50,
    });

    console.log(`Found ${footerData.length} footer records for Cement Mill 420`);

    if (footerData.length > 0) {
      footerData.forEach((f, index) => {
        console.log(`\nFooter record ${index + 1}:`);
        console.log(`  parameter_id: ${f.parameter_id}`);
        console.log(`  shift1_counter: ${f.shift1_counter}`);
        console.log(`  shift2_counter: ${f.shift2_counter}`);
        console.log(`  shift3_counter: ${f.shift3_counter}`);
        console.log(`  shift3_cont_counter: ${f.shift3_cont_counter}`);
      });
    }

    // Check material usage data for the same unit
    console.log('\n2. MATERIAL USAGE DATA FOR TONASA 4 - CEMENT MILL 420:');
    const materialData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${today}" && plant_category="Tonasa 4" && plant_unit="Cement Mill 420"`,
      limit: 10,
    });

    console.log(`Found ${materialData.length} material usage records`);

    if (materialData.length > 0) {
      materialData.forEach((m, index) => {
        console.log(`\nMaterial usage record ${index + 1}:`);
        console.log(`  Shift: ${m.shift}`);
        console.log(`  Clinker: ${m.clinker}`);
        console.log(`  Gypsum: ${m.gypsum}`);
        console.log(`  Limestone: ${m.limestone}`);
        console.log(`  Created: ${m.created}`);
      });
    }

    // Check if there's a pattern - compare footer vs material usage
    console.log('\n3. COMPARISON ANALYSIS:');

    // Get all shifts from material usage
    const shifts = ['shift3_cont', 'shift1', 'shift2', 'shift3'];

    shifts.forEach((shift) => {
      const materialRecord = materialData.find((m) => m.shift === shift);
      if (materialRecord) {
        console.log(`\n${shift.toUpperCase()}:`);
        console.log(`  Material Usage Clinker: ${materialRecord.clinker}`);

        // Try to find corresponding footer data
        // This is complex because we need to match by parameter
        // For now, just show the pattern
        console.log(`  Footer data exists: ${footerData.length > 0}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSpecificMaterialUsage();
