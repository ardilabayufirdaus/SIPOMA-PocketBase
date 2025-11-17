const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function debugRecordCreation() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    // Check collection schema
    console.log('\n📋 Checking collection schema...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('Schema fields:');
    collection.schema.forEach((field) => {
      console.log(`  - ${field.name}: ${field.type} (required: ${field.required})`);
    });

    // Test data that matches the component
    console.log('\n📝 Testing record creation with component data...');
    const testData = {
      plant_category: 'test_category',
      plant_unit: 'test_unit',
      parameter_ids_text: JSON.stringify(['param1', 'param2']),
    };

    console.log('Data to send:', testData);

    try {
      const record = await pb.collection('cop_footer_parameters').create(testData);
      console.log('✅ Record created successfully:', record.id);

      // Clean up
      await pb.collection('cop_footer_parameters').delete(record.id);
      console.log('✅ Test record cleaned up');
    } catch (createError) {
      console.error('❌ Failed to create record:');
      console.error('Error message:', createError.message);
      console.error('Error response:', createError.response);

      if (createError.response?.data) {
        console.error('Validation errors:', createError.response.data);
      }
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

debugRecordCreation();
