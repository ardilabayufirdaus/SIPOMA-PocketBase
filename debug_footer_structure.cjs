const PocketBase = require('pocketbase/cjs');

async function debugFooterDataStructure() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING FOOTER DATA STRUCTURE ===\n');

    const today = '2025-10-31';
    console.log(`Checking footer data structure for date: ${today}\n`);

    // Check all footer data for today
    console.log('1. ALL FOOTER DATA FOR TODAY:');
    const allFooterData = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${today}"`,
      limit: 20,
    });

    console.log(`Found ${allFooterData.length} footer records for today`);

    if (allFooterData.length > 0) {
      // Group by plant_unit
      const groupedByUnit = allFooterData.reduce((acc, f) => {
        const unit = f.plant_unit || 'undefined';
        if (!acc[unit]) acc[unit] = [];
        acc[unit].push(f);
        return acc;
      }, {});

      console.log('\nFooter data grouped by plant_unit:');
      Object.entries(groupedByUnit).forEach(([unit, records]) => {
        console.log(`  ${unit}: ${records.length} records`);
        if (records.length > 0 && unit !== 'undefined') {
          const sample = records[0];
          console.log(`    Sample - parameter_id: ${sample.parameter_id}`);
          console.log(
            `    shift1_counter: ${sample.shift1_counter}, shift2_counter: ${sample.shift2_counter}`
          );
        }
      });

      // Check if there's any data for "Tonasa 4" or similar
      console.log('\n2. SEARCHING FOR TONASA 4 DATA:');
      const tonasa4Data = allFooterData.filter(
        (f) => f.plant_unit && f.plant_unit.toLowerCase().includes('tonasa 4')
      );
      console.log(`Found ${tonasa4Data.length} records containing "tonasa 4"`);

      // Check for "Cement Mill" data
      const cementMillData = allFooterData.filter(
        (f) => f.plant_unit && f.plant_unit.toLowerCase().includes('cement mill')
      );
      console.log(`Found ${cementMillData.length} records containing "cement mill"`);

      // Check for "420" data
      const unit420Data = allFooterData.filter((f) => f.plant_unit && f.plant_unit.includes('420'));
      console.log(`Found ${unit420Data.length} records containing "420"`);

      if (unit420Data.length > 0) {
        console.log('\nUnit 420 data:');
        unit420Data.forEach((f, index) => {
          console.log(`  Record ${index + 1}: plant_unit="${f.plant_unit}"`);
          console.log(`    parameter_id: ${f.parameter_id}`);
          console.log(
            `    shift1_counter: ${f.shift1_counter}, shift2_counter: ${f.shift2_counter}`
          );
          console.log(
            `    shift3_counter: ${f.shift3_counter}, shift3_cont_counter: ${f.shift3_cont_counter}`
          );
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugFooterDataStructure();
