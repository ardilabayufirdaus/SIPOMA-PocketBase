const PocketBase = require('pocketbase/cjs');

async function checkMaterialUsageInReports() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING MATERIAL USAGE DATA FOR REPORTS ===\n');

    // Test with specific date, category, and unit
    const testDate = '2025-10-30';
    const testCategory = 'Tonasa 2/3';
    const testUnit = 'Cement Mill 220';

    console.log(`Testing with: Date=${testDate}, Category=${testCategory}, Unit=${testUnit}\n`);

    // Get data as it would be in reports (filtered by date, unit, category)
    const materialUsageData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${testDate}" && plant_unit="${testUnit}" && plant_category="${testCategory}"`,
      sort: 'created',
    });

    console.log(
      `Found ${materialUsageData.length} material usage records for the specific unit and category:`
    );

    materialUsageData.forEach((record, index) => {
      console.log(
        `  ${index + 1}. Shift: ${record.shift}, Date: ${record.date}, Unit: ${record.plant_unit}, Category: ${record.plant_category}`
      );
    });

    console.log('\n=== COMPARISON: OLD VS NEW FILTERING ===\n');

    // Old way: only by date and category
    const oldWayData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${testDate}" && plant_category="${testCategory}"`,
      sort: 'created',
    });

    console.log(`Old filtering (date + category only): ${oldWayData.length} records`);
    oldWayData.forEach((record, index) => {
      console.log(
        `  ${index + 1}. Shift: ${record.shift}, Unit: ${record.plant_unit}, Category: ${record.plant_category}`
      );
    });

    // New way: by date, unit, and category
    const newWayData = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${testDate}" && plant_unit="${testUnit}" && plant_category="${testCategory}"`,
      sort: 'created',
    });

    console.log(`\nNew filtering (date + unit + category): ${newWayData.length} records`);
    newWayData.forEach((record, index) => {
      console.log(
        `  ${index + 1}. Shift: ${record.shift}, Unit: ${record.plant_unit}, Category: ${record.plant_category}`
      );
    });

    if (oldWayData.length !== newWayData.length) {
      console.log(
        `\n✅ FILTERING CHANGE DETECTED: Old=${oldWayData.length}, New=${newWayData.length}`
      );
      console.log('This should fix the double shift issue in reports!');
    } else {
      console.log(`\nℹ️  No difference in this test case, but filtering is now more precise.`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMaterialUsageInReports();
