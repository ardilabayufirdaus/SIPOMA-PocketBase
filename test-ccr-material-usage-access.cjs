const PocketBase = require('pocketbase/cjs');

/**
 * Test ccr_material_usage collection access
 */
async function testCcrMaterialUsageAccess() {
  // Get credentials from environment variables
  const pbUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
  const pbEmail = process.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
  const pbPassword = process.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

  const pb = new PocketBase(pbUrl);

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(pbEmail, pbPassword);

    console.log('Testing ccr_material_usage collection access...');

    // Test getting list
    const records = await pb.collection('ccr_material_usage').getList(1, 5, {
      filter: 'date="2025-10-24"',
      sort: 'created',
    });

    console.log('✅ Successfully fetched records:', records.totalItems, 'found');

    // Test creating a sample record
    const testRecord = await pb.collection('ccr_material_usage').create({
      date: '2025-10-24',
      plant_category: 'test',
      plant_unit: 'test_unit',
      shift: 'shift1',
      clinker: 100,
      gypsum: 50,
      limestone: 200,
      trass: 0,
      fly_ash: 0,
      fine_trass: 0,
      ckd: 0,
      total_production: 350,
    });

    console.log('✅ Successfully created test record:', testRecord.id);

    // Clean up test record
    await pb.collection('ccr_material_usage').delete(testRecord.id);
    console.log('✅ Successfully deleted test record');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
testCcrMaterialUsageAccess()
  .then(() => {
    console.log('🎉 ccr_material_usage collection access test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
