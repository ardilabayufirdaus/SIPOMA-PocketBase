const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function debugUserPermissionsCreation() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING USER PERMISSIONS CREATION ===\n');

    // Check user_permissions collection schema
    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.error('❌ user_permissions collection not found!');
      return;
    }

    console.log('User Permissions Collection Schema:');
    userPermsCollection.schema.forEach((field) => {
      console.log(
        `  - ${field.name} (${field.type}) required: ${field.required}, unique: ${field.unique}`
      );
      if (field.options && Object.keys(field.options).length > 0) {
        console.log(`    options: ${JSON.stringify(field.options, null, 2)}`);
      }
    });

    // Check existing records
    console.log('\nExisting user_permissions records:');
    const existingRecords = await pb.collection('user_permissions').getList(1, 10);
    console.log(`Total records: ${existingRecords.totalItems}`);

    existingRecords.items.forEach((record) => {
      console.log(
        `  ID: ${record.id}, user_id: ${record.user_id}, role: ${record.role}, custom: ${record.is_custom_permissions}`
      );
      console.log(`  Permissions length: ${record.permissions_data?.length || 0} chars`);
    });

    // Test creating a sample record
    console.log('\n=== TESTING RECORD CREATION ===');

    const testUserId = 'test_user_id_123';
    const testPermissions = {
      dashboard: 'READ',
      plant_operations: { 'Test Unit': 'WRITE' },
      inspection: 'NONE',
    };

    const testData = {
      user_id: testUserId,
      permissions_data: JSON.stringify(testPermissions),
      is_custom_permissions: true,
      role: 'Operator',
    };

    console.log('Test data to create:', JSON.stringify(testData, null, 2));

    try {
      const createdRecord = await pb.collection('user_permissions').create(testData);
      console.log('✅ Test record created successfully:', createdRecord.id);

      // Clean up test record
      await pb.collection('user_permissions').delete(createdRecord.id);
      console.log('✅ Test record cleaned up');
    } catch (createError) {
      console.error('❌ Failed to create test record:', createError.message);
      if (createError.response) {
        console.error('Response data:', JSON.stringify(createError.response.data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUserPermissionsCreation();
