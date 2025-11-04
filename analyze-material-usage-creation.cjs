const PocketBase = require('pocketbase/cjs');

async function analyzeMaterialUsageCreation() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== ANALYZING MATERIAL USAGE CREATION PATTERNS ===\n');

    // Get recent material usage data
    const materialUsage = await pb.collection('ccr_material_usage').getFullList({
      sort: '-created',
      limit: 50,
    });

    console.log('Recent material usage records (last 50):\n');

    // Group by creation date
    const creationGroups = {};
    materialUsage.forEach((record) => {
      const createdDate = record.created.split('T')[0];
      if (!creationGroups[createdDate]) {
        creationGroups[createdDate] = [];
      }
      creationGroups[createdDate].push(record);
    });

    Object.keys(creationGroups)
      .sort()
      .reverse()
      .forEach((date) => {
        const records = creationGroups[date];
        console.log(`${date}: ${records.length} records`);

        // Show sample for each date
        const sample = records[0];
        console.log(
          `  Sample: ${sample.date} | ${sample.plant_category} | ${sample.plant_unit} | ${sample.shift} | Clinker: ${sample.clinker}`
        );
        console.log(`  Created: ${sample.created}`);
        console.log('');
      });

    // Check if there are records created in batches (auto-save pattern)
    console.log('=== CHECKING FOR BATCH CREATION PATTERNS ===\n');

    const sortedByTime = materialUsage.sort((a, b) => new Date(a.created) - new Date(b.created));

    let batchCount = 0;
    let currentBatch = [];
    let lastTime = null;

    sortedByTime.forEach((record) => {
      const recordTime = new Date(record.created);

      if (lastTime && recordTime - lastTime < 1000) {
        // Within 1 second
        currentBatch.push(record);
      } else {
        if (currentBatch.length > 1) {
          batchCount++;
          console.log(
            `Batch ${batchCount} (${currentBatch.length} records in ${Math.round((new Date(currentBatch[currentBatch.length - 1].created) - new Date(currentBatch[0].created)) / 1000)}s):`
          );
          console.log(
            `  Time: ${currentBatch[0].created} - ${currentBatch[currentBatch.length - 1].created}`
          );
          console.log(
            `  Sample: ${currentBatch[0].plant_category} | ${currentBatch[0].plant_unit}`
          );
        }
        currentBatch = [record];
      }

      lastTime = recordTime;
    });

    if (batchCount > 0) {
      console.log(
        `\n✅ Found ${batchCount} batch creation patterns - this indicates auto-save behavior`
      );
    } else {
      console.log('\nℹ️  No clear batch patterns found');
    }

    // Check for zero-value records
    const zeroRecords = materialUsage.filter(
      (r) =>
        (r.clinker === 0 || r.clinker === null) &&
        (r.gypsum === 0 || r.gypsum === null) &&
        (r.limestone === 0 || r.limestone === null)
    );

    console.log(`\n=== ZERO VALUE RECORDS ===`);
    console.log(
      `Found ${zeroRecords.length} records with zero/null values out of ${materialUsage.length} total`
    );

    if (zeroRecords.length > 0) {
      console.log('Sample zero records:');
      zeroRecords.slice(0, 3).forEach((record) => {
        console.log(
          `  ${record.date} | ${record.plant_category} | ${record.plant_unit} | ${record.shift} | Created: ${record.created}`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeMaterialUsageCreation();
