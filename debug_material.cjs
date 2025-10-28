const path = require('path');
const { pb } = require(path.join(__dirname, 'utils', 'pocketbase-simple'));

async function debugMaterialData() {
  try {
    console.log('=== DEBUGGING MATERIAL USAGE DATA ===\n');

    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking data for date: ${today}\n`);

    // 1. Check parameter settings for counter feeders
    console.log('1. PARAMETER SETTINGS:');
    const paramSettings = await pb.collection('ccr_parameter_settings').getFullList({
      filter: 'parameter~"Counter Feeder"',
      limit: 50,
    });
    console.log(`Found ${paramSettings.length} counter feeder parameter settings`);

    // Group by category and unit
    const grouped = paramSettings.reduce((acc, p) => {
      const key = `${p.category} - ${p.unit}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([key, params]) => {
      console.log(`  ${key}: ${params.length} parameters`);
      params.slice(0, 3).forEach((p) => console.log(`    - ${p.parameter} (ID: ${p.id})`));
    });

    // 2. Check footer data
    console.log('\n2. FOOTER DATA:');
    const footerData = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${today}"`,
      limit: 50,
    });
    console.log(`Found ${footerData.length} footer records for today`);

    if (footerData.length > 0) {
      // Group footer data by parameter_id
      const footerByParam = footerData.reduce((acc, f) => {
        if (!acc[f.parameter_id]) acc[f.parameter_id] = [];
        acc[f.parameter_id].push(f);
        return acc;
      }, {});

      console.log(`Footer data grouped by ${Object.keys(footerByParam).length} parameter IDs`);

      // Show sample footer data
      const sampleFooter = footerData[0];
      console.log('Sample footer record:');
      console.log(`  parameter_id: ${sampleFooter.parameter_id}`);
      console.log(`  shift1_counter: ${sampleFooter.shift1_counter}`);
      console.log(`  shift2_counter: ${sampleFooter.shift2_counter}`);
      console.log(`  shift3_counter: ${sampleFooter.shift3_counter}`);
      console.log(`  shift3_cont_counter: ${sampleFooter.shift3_cont_counter}`);
    }

    // 3. Check if parameter settings match footer data
    console.log('\n3. PARAMETER MATCHING:');
    const matchedParams = paramSettings.filter((p) =>
      footerData.some((f) => f.parameter_id === p.id)
    );
    console.log(`Parameters with footer data: ${matchedParams.length}/${paramSettings.length}`);

    matchedParams.forEach((p) => {
      const footerRecords = footerData.filter((f) => f.parameter_id === p.id);
      console.log(
        `  ${p.parameter} (${p.category} - ${p.unit}): ${footerRecords.length} footer records`
      );
    });

    // 4. Check material usage data
    console.log('\n4. MATERIAL USAGE DATA:');
    const materialData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${today}"`,
      limit: 20,
    });
    console.log(`Found ${materialData.length} material usage records for today`);

    if (materialData.length > 0) {
      materialData.forEach((m) => {
        console.log(`  ${m.shift}: ${m.plant_category} - ${m.plant_unit}`);
        console.log(`    clinker: ${m.clinker}, gypsum: ${m.gypsum}, limestone: ${m.limestone}`);
      });
    }

    // 5. Test specific case - Tonasa 2/3, 220, Counter Feeder Clinker
    console.log('\n5. SPECIFIC TEST (Tonasa 2/3, 220, Counter Feeder Clinker):');
    const testParam = paramSettings.find(
      (p) =>
        p.category === 'Tonasa 2/3' &&
        p.unit === '220' &&
        p.parameter === 'Counter Feeder Clinker (ton)'
    );

    if (testParam) {
      console.log(`Found parameter setting: ${testParam.parameter} (ID: ${testParam.id})`);

      const testFooter = footerData.find((f) => f.parameter_id === testParam.id);
      if (testFooter) {
        console.log('Footer data found:');
        console.log(`  shift1_counter: ${testFooter.shift1_counter}`);
        console.log(`  shift2_counter: ${testFooter.shift2_counter}`);
        console.log(`  shift3_counter: ${testFooter.shift3_counter}`);
        console.log(`  shift3_cont_counter: ${testFooter.shift3_cont_counter}`);
      } else {
        console.log('No footer data found for this parameter');
      }
    } else {
      console.log('Parameter setting not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugMaterialData();
