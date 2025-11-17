const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function testTonasaRecord() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    console.log('\n🧪 Testing record creation for "Tonasa 2/3 - Cement Mill 220"...');

    // Test data that matches the error message
    const testData = {
      plant_category: 'Tonasa 2/3',
      plant_unit: 'Cement Mill 220',
      parameter_ids: ['param1', 'param2', 'param3'],
    };

    console.log('Data to create:', testData);

    try {
      const record = await pb.collection('cop_footer_parameters').create(testData);
      console.log('✅ Record created successfully for Tonasa 2/3 - Cement Mill 220!');
      console.log('Record ID:', record.id);

      // Clean up
      await pb.collection('cop_footer_parameters').delete(record.id);
      console.log('✅ Test record cleaned up');
    } catch (error) {
      console.error('❌ Failed to create record for Tonasa 2/3 - Cement Mill 220:');
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);

      if (error.response?.data) {
        console.error('Validation errors:', error.response.data);
      }
    }

    // Test if record already exists
    console.log('\n🔍 Checking if record already exists...');
    const existingRecords = await pb.collection('cop_footer_parameters').getList(1, 10, {
      filter: 'plant_category = "Tonasa 2/3" && plant_unit = "Cement Mill 220"',
    });

    console.log(
      `Found ${existingRecords.items.length} existing records for Tonasa 2/3 - Cement Mill 220`
    );

    if (existingRecords.items.length > 0) {
      console.log('Existing record:', existingRecords.items[0]);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testTonasaRecord();
