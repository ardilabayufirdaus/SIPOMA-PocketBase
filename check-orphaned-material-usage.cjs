const PocketBase = require('pocketbase/cjs');

async function checkOrphanedMaterialUsage() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING ORPHANED MATERIAL USAGE DATA ===\n');

    // Get all material usage data
    const allMaterialUsage = await pb.collection('ccr_material_usage').getFullList({
      sort: '-created',
      limit: 100,
    });

    console.log(`Total material usage records: ${allMaterialUsage.length}\n`);

    // Get all footer data
    const allFooterData = await pb.collection('ccr_footer_data').getFullList({
      sort: '-created',
      limit: 200,
    });

    console.log(`Total footer data records: ${allFooterData.length}\n`);

    // Group footer data by date and category
    const footerMap = new Map();
    allFooterData.forEach((footer) => {
      const key = `${footer.date}|${footer.category}`;
      if (!footerMap.has(key)) {
        footerMap.set(key, []);
      }
      footerMap.get(key).push(footer);
    });

    console.log(`Footer data grouped by date+category: ${footerMap.size} groups\n`);

    // Check each material usage record
    let orphanedCount = 0;
    const orphanedRecords = [];

    for (const material of allMaterialUsage) {
      const key = `${material.date}|${material.plant_category}`;

      if (!footerMap.has(key)) {
        orphanedCount++;
        orphanedRecords.push(material);
      } else {
        // Check if footer data has non-zero counters
        const footerRecords = footerMap.get(key);
        const hasData = footerRecords.some(
          (f) =>
            (f.shift1_counter && f.shift1_counter > 0) ||
            (f.shift2_counter && f.shift2_counter > 0) ||
            (f.shift3_counter && f.shift3_counter > 0) ||
            (f.shift3_cont_counter && f.shift3_cont_counter > 0)
        );

        if (!hasData) {
          orphanedCount++;
          orphanedRecords.push({
            ...material,
            footerExists: true,
            footerHasData: false,
          });
        }
      }
    }

    console.log(`Found ${orphanedCount} orphaned material usage records:\n`);

    orphanedRecords.slice(0, 10).forEach((record, index) => {
      console.log(
        `${index + 1}. Date: ${record.date}, Category: ${record.plant_category}, Unit: ${record.plant_unit}, Shift: ${record.shift}`
      );
      console.log(`   Clinker: ${record.clinker}, Created: ${record.created}`);
      if (record.footerExists) {
        console.log(`   Footer exists but has zero counters`);
      } else {
        console.log(`   No footer data found`);
      }
      console.log('');
    });

    if (orphanedCount > 10) {
      console.log(`... and ${orphanedCount - 10} more records`);
    }

    if (orphanedCount > 0) {
      console.log('\n🔍 ANALYSIS:');
      console.log(
        'These material usage records exist without corresponding footer data, or footer data has zero counters.'
      );
      console.log(
        'This explains why CCR Material Usage Entry shows data even when footer data appears empty.'
      );
      console.log('Possible causes:');
      console.log('1. Data was imported or manually created');
      console.log('2. Footer data was cleared after material usage was calculated');
      console.log('3. Auto-save occurred before footer data was properly recorded');
    } else {
      console.log('✅ No orphaned material usage records found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOrphanedMaterialUsage();
