const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function testCreateRecordScenarios() {
  try {
    console.log('🔗 Connecting to PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authentication successful!');

    // Test 1: Create with valid data
    console.log('\n📝 Test 1: Creating record with valid data...');
    try {
      const testData1 = {
        plant_category: 'Tonasa',
        plant_unit: 'Cement Mill 220',
        parameter_ids_text: JSON.stringify(['param1', 'param2']),
      };
      console.log('Data:', testData1);

      const record1 = await pb.collection('cop_footer_parameters').create(testData1);
      console.log('✅ Record created successfully:', record1.id);

      // Clean up
      await pb.collection('cop_footer_parameters').delete(record1.id);
      console.log('✅ Test record cleaned up');
    } catch (error) {
      console.error('❌ Test 1 failed:', error.message);
      if (error.response?.data) {
        console.error('Validation errors:', error.response.data);
      }
    }

    // Test 2: Try to create duplicate (should fail due to unique index)
    console.log('\n📝 Test 2: Creating duplicate records (should fail)...');
    try {
      const testData2a = {
        plant_category: 'Tonasa',
        plant_unit: 'Cement Mill 220',
        parameter_ids_text: JSON.stringify(['param1']),
      };

      const record2a = await pb.collection('cop_footer_parameters').create(testData2a);
      console.log('✅ First record created:', record2a.id);

      const testData2b = {
        plant_category: 'Tonasa',
        plant_unit: 'Cement Mill 220',
        parameter_ids_text: JSON.stringify(['param2']),
      };

      const record2b = await pb.collection('cop_footer_parameters').create(testData2b);
      console.log('❌ Second record created (should have failed):', record2b.id);

      // Clean up
      await pb.collection('cop_footer_parameters').delete(record2a.id);
      if (record2b.id) {
        await pb.collection('cop_footer_parameters').delete(record2b.id);
      }
    } catch (error) {
      console.log('✅ Test 2 passed - duplicate creation failed as expected:', error.message);
    }

    // Test 3: Create with empty required fields
    console.log('\n📝 Test 3: Creating record with empty required fields...');
    try {
      const testData3 = {
        plant_category: '',
        plant_unit: 'Cement Mill 220',
        parameter_ids_text: JSON.stringify(['param1']),
      };

      const record3 = await pb.collection('cop_footer_parameters').create(testData3);
      console.log('❌ Record created with empty category (should have failed):', record3.id);

      // Clean up if created
      if (record3.id) {
        await pb.collection('cop_footer_parameters').delete(record3.id);
      }
    } catch (error) {
      console.log('✅ Test 3 passed - empty field rejected:', error.message);
    }

    // Test 4: Create with missing required fields
    console.log('\n📝 Test 4: Creating record with missing required fields...');
    try {
      const testData4 = {
        plant_category: 'Tonasa',
        // plant_unit missing
        parameter_ids_text: JSON.stringify(['param1']),
      };

      const record4 = await pb.collection('cop_footer_parameters').create(testData4);
      console.log('❌ Record created with missing unit (should have failed):', record4.id);

      // Clean up if created
      if (record4.id) {
        await pb.collection('cop_footer_parameters').delete(record4.id);
      }
    } catch (error) {
      console.log('✅ Test 4 passed - missing field rejected:', error.message);
    }

    console.log('\n🎯 All tests completed!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testCreateRecordScenarios();
