const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkUsersCollectionSchema() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING USERS COLLECTION SCHEMA ===\n');

    // Get the users collection
    const collections = await pb.collections.getFullList();
    const usersCollection = collections.find((c) => c.name === 'users');

    if (!usersCollection) {
      console.log('❌ Users collection not found');
      return;
    }

    console.log('Users collection schema:');
    console.log('Fields:');
    usersCollection.schema.forEach((field) => {
      console.log(`  - ${field.name}: ${field.type} (${field.required ? 'required' : 'optional'})`);
    });

    console.log('\nTesting permissions field update...');

    // Try to update one user manually
    const testUserId = 'xygvglupqzem82w'; // william.loloallo
    const testPermissions = { dashboard: 'NONE', plant_operations: 'WRITE' };

    try {
      const result = await pb.collection('users').update(testUserId, {
        permissions: testPermissions,
      });
      console.log('✅ Manual update successful');
      console.log('Updated user:', result.username, result.permissions);
    } catch (error) {
      console.error('❌ Manual update failed:', error.message);
      console.error('Response:', error.response?.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersCollectionSchema();
