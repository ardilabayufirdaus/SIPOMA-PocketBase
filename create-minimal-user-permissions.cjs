const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function createMinimalUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CREATING MINIMAL USER PERMISSIONS COLLECTION ===\n');

    // Create collection with minimal schema first
    const collectionData = {
      name: 'user_permissions',
      type: 'base',
      schema: [
        {
          name: 'user_id',
          type: 'text',
          required: true,
          options: {},
        },
        {
          name: 'permissions',
          type: 'json',
          required: false,
          options: {},
        },
        {
          name: 'is_custom_permissions',
          type: 'bool',
          required: false,
          options: {},
        },
        {
          name: 'role',
          type: 'text',
          required: false,
          options: {},
        },
      ],
    };

    console.log('Creating user_permissions collection...');
    const newCollection = await pb.collections.create(collectionData);

    console.log('✅ Collection created successfully!');
    console.log('Collection ID:', newCollection.id);
    console.log('Schema fields:');
    newCollection.schema.forEach((field) => {
      console.log(`  - ${field.name} (${field.type})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createMinimalUserPermissionsCollection();
