const PocketBase = require('pocketbase/cjs');

async function addUniqueIndexToCcrMaterialUsage() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== ADDING UNIQUE INDEX TO CCR MATERIAL USAGE ===\n');

    const collections = await pb.collections.getFullList();
    const collection = collections.find((c) => c.name === 'ccr_material_usage');

    if (!collection) {
      console.error('❌ ccr_material_usage collection not found!');
      return;
    }

    console.log('Current indexes:', collection.indexes || []);

    // Add unique index on date, plant_category, plant_unit, shift
    const updatedCollection = await pb.collections.update(collection.id, {
      ...collection,
      indexes: [
        ...collection.indexes,
        'CREATE UNIQUE INDEX idx_unique_ccr_material_usage ON ccr_material_usage (date, plant_category, plant_unit, shift)',
      ],
    });

    console.log('\n✅ Unique index added successfully!');
    console.log('New indexes:', updatedCollection.indexes);

    // Test the unique constraint
    console.log('\n=== TESTING UNIQUE CONSTRAINT ===');

    // Try to create a duplicate record
    const existingRecords = await pb.collection('ccr_material_usage').getList(1, 1);
    if (existingRecords.items.length > 0) {
      const existing = existingRecords.items[0];
      console.log(
        `Testing duplicate creation for: ${existing.date} | ${existing.plant_category} | ${existing.plant_unit} | ${existing.shift}`
      );

      const duplicateData = {
        date: existing.date,
        plant_category: existing.plant_category,
        plant_unit: existing.plant_unit,
        shift: existing.shift,
        clinker: 999, // Different value to test
      };

      try {
        const createdRecord = await pb.collection('ccr_material_usage').create(duplicateData);
        console.log('❌ ERROR: Duplicate record created unexpectedly:', createdRecord.id);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log('✅ Unique constraint working correctly - duplicate rejected');
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
    } else {
      console.log('No existing records to test with');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addUniqueIndexToCcrMaterialUsage();
