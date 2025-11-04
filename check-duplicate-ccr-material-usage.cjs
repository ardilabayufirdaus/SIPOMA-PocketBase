const PocketBase = require('pocketbase/cjs');

async function checkDuplicateCcrMaterialUsage() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING DUPLICATE CCR MATERIAL USAGE RECORDS ===\n');

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

    let duplicateCount = 0;
    let totalDuplicates = 0;

    console.log('Checking for duplicates...\n');

    Object.entries(grouped).forEach(([key, group]) => {
      if (group.length > 1) {
        duplicateCount++;
        totalDuplicates += group.length - 1;
        console.log(`🔴 DUPLICATE FOUND: ${key}`);
        console.log(`   ${group.length} records:`);
        group.forEach((record, index) => {
          console.log(`     ${index + 1}. ID: ${record.id}, Created: ${record.created}`);
        });
        console.log('');
      }
    });

    if (duplicateCount === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(
        `❌ Found ${duplicateCount} duplicate groups with ${totalDuplicates} total duplicate records.`
      );
      console.log('\n⚠️  UNIQUE INDEX CANNOT BE ADDED UNTIL DUPLICATES ARE RESOLVED!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDuplicateCcrMaterialUsage();
