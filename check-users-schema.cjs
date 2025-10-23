const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkUsersSchema() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== USERS COLLECTION SCHEMA ANALYSIS ===\n');

    const collections = await pb.collections.getFullList();
    const usersCollection = collections.find((c) => c.name === 'users');

    if (usersCollection && usersCollection.schema) {
      console.log('Users collection schema fields:');
      usersCollection.schema.forEach((field) => {
        console.log(`  - ${field.name} (${field.type})`);
      });

      const permissionsField = usersCollection.schema.find((f) => f.name === 'permissions');
      const customFlagField = usersCollection.schema.find(
        (f) => f.name === 'is_custom_permissions'
      );

      console.log(`\nPermissions field exists: ${permissionsField ? 'YES' : 'NO'}`);
      console.log(`Custom permissions flag exists: ${customFlagField ? 'YES' : 'NO'}`);

      if (permissionsField) {
        console.log(`Permissions field type: ${permissionsField.type}`);
      }
      if (customFlagField) {
        console.log(`Custom flag field type: ${customFlagField.type}`);
      }
    }

    // Check a specific user to see raw data
    console.log('\n=== SAMPLE USER RAW DATA ===');
    const user = await pb.collection('users').getFirstListItem('username = "ardila.firdaus"');
    console.log('Raw user data keys:', Object.keys(user));
    console.log('Has permissions field:', user.hasOwnProperty('permissions'));
    console.log('Has is_custom_permissions field:', user.hasOwnProperty('is_custom_permissions'));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsersSchema();
