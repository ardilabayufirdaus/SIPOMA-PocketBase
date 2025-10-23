const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function addUniqueIndexToUserPermissions() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== ADDING UNIQUE INDEX TO USER PERMISSIONS ===\n');

    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.error('❌ user_permissions collection not found!');
      return;
    }

    console.log('Current indexes:', userPermsCollection.indexes || []);

    // Add unique index on user_id
    const updatedCollection = await pb.collections.update(userPermsCollection.id, {
      ...userPermsCollection,
      indexes: [
        'CREATE UNIQUE INDEX idx_user_permissions_user_id ON user_permissions (user_id)',
        'CREATE INDEX idx_user_permissions_role ON user_permissions (role)',
      ],
    });

    console.log('\n✅ Unique index added successfully!');
    console.log('New indexes:', updatedCollection.indexes);

    // Test the unique constraint
    console.log('\n=== TESTING UNIQUE CONSTRAINT ===');

    const existingRecords = await pb.collection('user_permissions').getList(1, 1);
    const existingUserId = existingRecords.items[0]?.user_id;

    if (existingUserId) {
      console.log(`Testing duplicate creation for user_id: ${existingUserId}`);

      const testData = {
        user_id: existingUserId,
        permissions_data: JSON.stringify({ test: 'data' }),
        is_custom_permissions: true,
        role: 'Test',
      };

      try {
        const createdRecord = await pb.collection('user_permissions').create(testData);
        console.log('❌ ERROR: Duplicate record created unexpectedly:', createdRecord.id);
      } catch (createError) {
        console.log('✅ SUCCESS: Duplicate creation properly rejected');
        console.log('Error message:', createError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addUniqueIndexToUserPermissions();
