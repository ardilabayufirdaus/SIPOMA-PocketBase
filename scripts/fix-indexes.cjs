const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function fixIndexes() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    console.log('\n🔧 Fixing indexes for cop_footer_parameters...');

    // First, clean up existing records that might violate unique constraint
    console.log('🧹 Cleaning up existing duplicate records...');
    const allRecords = await pb.collection('cop_footer_parameters').getFullList();
    console.log(`Found ${allRecords.length} existing records`);

    // Group by plant_category + plant_unit to find duplicates
    const grouped = {};
    allRecords.forEach((record) => {
      const key = `${record.plant_category}::${record.plant_unit}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });

    // Remove duplicates, keep only the first one for each group
    for (const [key, records] of Object.entries(grouped)) {
      if (records.length > 1) {
        console.log(`Found ${records.length} duplicates for ${key}`);
        // Keep the first record, delete the rest
        for (let i = 1; i < records.length; i++) {
          await pb.collection('cop_footer_parameters').delete(records[i].id);
          console.log(`Deleted duplicate record: ${records[i].id}`);
        }
      }
    }

    console.log('✅ Duplicate cleanup completed');

    // Now update the collection with correct unique index
    console.log('\n📝 Updating collection with correct unique index...');
    const collection = await pb.collections.getOne('cop_footer_parameters');

    // Update collection with proper indexes
    const updatedCollection = {
      ...collection,
      indexes: [
        'CREATE UNIQUE INDEX `idx_cop_footer_unique_category_unit` ON `cop_footer_parameters` (\n  `plant_category`,\n  `plant_unit`\n)',
        'CREATE INDEX `idx_cop_footer_category` ON `cop_footer_parameters` (`plant_category`)',
        'CREATE INDEX `idx_cop_footer_unit` ON `cop_footer_parameters` (`plant_unit`)',
      ],
    };

    await pb.collections.update(collection.id, updatedCollection);
    console.log('✅ Collection updated with correct unique index');

    // Test the unique constraint
    console.log('\n🧪 Testing unique constraint...');
    const testRecord = await pb.collection('cop_footer_parameters').create({
      plant_category: 'Test Category',
      plant_unit: 'Test Unit',
      parameter_ids_text: JSON.stringify(['test']),
    });
    console.log('✅ Test record created:', testRecord.id);

    try {
      const duplicateRecord = await pb.collection('cop_footer_parameters').create({
        plant_category: 'Test Category',
        plant_unit: 'Test Unit',
        parameter_ids_text: JSON.stringify(['duplicate']),
      });
      console.log('❌ ERROR: Duplicate record created - unique constraint failed!');
      await pb.collection('cop_footer_parameters').delete(duplicateRecord.id);
    } catch (error) {
      console.log('✅ Unique constraint working - duplicate rejected:', error.message);
    }

    // Clean up test record
    await pb.collection('cop_footer_parameters').delete(testRecord.id);
    console.log('✅ Test record cleaned up');

    console.log('\n🎉 Index fix completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

fixIndexes();
