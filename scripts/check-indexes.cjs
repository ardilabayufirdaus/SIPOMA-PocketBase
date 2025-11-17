const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function checkIndexes() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    console.log('\n📋 Checking collection and indexes...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('Collection:', collection.name);
    console.log('Schema fields:');
    collection.schema.forEach((field) => {
      console.log(`  - ${field.name}: ${field.type} (required: ${field.required})`);
    });

    console.log('\n🔍 Current indexes:');
    if (collection.indexes && collection.indexes.length > 0) {
      collection.indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index}`);
      });
    } else {
      console.log('  No indexes found!');
    }

    // Test if unique constraint works
    console.log('\n🧪 Testing unique constraint...');

    // Create first record
    const record1 = await pb.collection('cop_footer_parameters').create({
      plant_category: 'Tonasa',
      plant_unit: 'Cement Mill 220',
      parameter_ids: ['test1'],
    });
    console.log('✅ First record created:', record1.id);

    // Try to create duplicate
    try {
      const record2 = await pb.collection('cop_footer_parameters').create({
        plant_category: 'Tonasa',
        plant_unit: 'Cement Mill 220',
        parameter_ids: ['test2'],
      });
      console.log('❌ ERROR: Duplicate record created:', record2.id);
      console.log('UNIQUE INDEX IS NOT WORKING!');

      // Clean up both records
      await pb.collection('cop_footer_parameters').delete(record1.id);
      await pb.collection('cop_footer_parameters').delete(record2.id);
    } catch (error) {
      console.log('✅ Unique constraint working - duplicate rejected:', error.message);
      // Clean up first record
      await pb.collection('cop_footer_parameters').delete(record1.id);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkIndexes();
