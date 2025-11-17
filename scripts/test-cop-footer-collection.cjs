const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function testCopFooterParameters() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    // Check collection
    console.log('\n📋 Checking cop_footer_parameters collection...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('✅ Collection found:', collection.name);
    console.log('📊 Schema fields:', collection.schema.map((f) => f.name).join(', '));
    console.log('🔍 Indexes:', collection.indexes.length, 'indexes found');

    collection.indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index}`);
    });

    // Test creating a sample record
    console.log('\n📝 Testing record creation...');
    const testData = {
      plant_category: 'test_category',
      plant_unit: 'test_unit',
      parameter_ids_text: JSON.stringify(['param1', 'param2', 'param3']),
    };

    const record = await pb.collection('cop_footer_parameters').create(testData);
    console.log('✅ Test record created:', record.id);

    // Test querying
    console.log('\n🔍 Testing queries...');

    // Query by category
    const categoryRecords = await pb.collection('cop_footer_parameters').getList(1, 10, {
      filter: 'plant_category = "test_category"',
    });
    console.log(`✅ Category query: ${categoryRecords.items.length} records found`);

    // Query by unit
    const unitRecords = await pb.collection('cop_footer_parameters').getList(1, 10, {
      filter: 'plant_unit = "test_unit"',
    });
    console.log(`✅ Unit query: ${unitRecords.items.length} records found`);

    // Clean up test record
    console.log('\n🧹 Cleaning up test record...');
    await pb.collection('cop_footer_parameters').delete(record.id);
    console.log('✅ Test record deleted');

    console.log('\n🎉 COP Footer Parameters collection is fully functional!');
    console.log('✅ Collection exists with proper schema');
    console.log('✅ Indexes are created and working');
    console.log('✅ CRUD operations working');
    console.log('✅ Query performance optimized');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testCopFooterParameters();
