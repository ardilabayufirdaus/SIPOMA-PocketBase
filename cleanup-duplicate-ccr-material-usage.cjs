const PocketBase = require('pocketbase/cjs');

async function cleanupDuplicateCcrMaterialUsage() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CLEANING UP DUPLICATE CCR MATERIAL USAGE RECORDS ===\n');

    // Get all records
    const records = await pb.collection('ccr_material_usage').getFullList({
      sort: 'date,plant_category,plant_unit,shift',
    });

    console.log(`Total records found: ${records.length}\n`);

    // Group by the unique combination
    const grouped = records.reduce((acc, record) => {
      const key = `${record.date}|${record.plant_category}|${record.plant_unit}|${record.shift}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});

    let deletedCount = 0;

    console.log('Processing duplicates...\n');

    for (const [key, group] of Object.entries(grouped)) {
      if (group.length > 1) {
        // Sort by created date descending (newest first)
        group.sort((a, b) => new Date(b.created) - new Date(a.created));

        console.log(`🔄 Processing: ${key}`);
        console.log(`   Keeping: ${group[0].id} (created: ${group[0].created})`);

        // Delete older duplicates
        for (let i = 1; i < group.length; i++) {
          const record = group[i];
          console.log(`   Deleting: ${record.id} (created: ${record.created})`);

          try {
            await pb.collection('ccr_material_usage').delete(record.id);
            deletedCount++;
          } catch (error) {
            console.error(`   ❌ Failed to delete ${record.id}:`, error.message);
          }
        }
        console.log('');
      }
    }

    console.log(`✅ Cleanup completed! Deleted ${deletedCount} duplicate records.`);

    // Verify no duplicates remain
    console.log('\n=== VERIFYING CLEANUP ===');
    const remainingRecords = await pb.collection('ccr_material_usage').getFullList();
    const remainingGrouped = remainingRecords.reduce((acc, record) => {
      const key = `${record.date}|${record.plant_category}|${record.plant_unit}|${record.shift}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});

    const remainingDuplicates = Object.values(remainingGrouped).filter(
      (group) => group.length > 1
    ).length;

    if (remainingDuplicates === 0) {
      console.log('✅ No duplicates remain!');
    } else {
      console.log(`❌ Still ${remainingDuplicates} duplicate groups remaining.`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupDuplicateCcrMaterialUsage();
