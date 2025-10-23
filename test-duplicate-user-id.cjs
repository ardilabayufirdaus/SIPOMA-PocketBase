const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testDuplicateUserId() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== TESTING DUPLICATE USER_ID CREATION ===\n');

    // Get an existing user ID from the records
    const existingRecords = await pb.collection('user_permissions').getList(1, 1);
    const existingUserId = existingRecords.items[0]?.user_id;

    if (!existingUserId) {
      console.log('No existing records found to test with');
      return;
    }

    console.log(`Testing with existing user_id: ${existingUserId}`);

    const testData = {
      user_id: existingUserId,
      permissions_data: JSON.stringify({ dashboard: 'READ' }),
      is_custom_permissions: true,
      role: 'Test',
    };

    console.log('Attempting to create duplicate record...');

    try {
      const createdRecord = await pb.collection('user_permissions').create(testData);
      console.log('❌ Unexpectedly succeeded in creating duplicate:', createdRecord.id);
    } catch (createError) {
      console.log('✅ Expected error for duplicate user_id:', createError.message);
      if (createError.response) {
        console.log('Error details:', JSON.stringify(createError.response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDuplicateUserId();
