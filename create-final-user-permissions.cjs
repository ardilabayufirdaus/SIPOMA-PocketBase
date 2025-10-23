const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function createUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CREATING USER PERMISSIONS COLLECTION ===\n');

    // Delete existing if it exists
    const collections = await pb.collections.getFullList();
    const existing = collections.find((c) => c.name === 'user_permissions');
    if (existing) {
      console.log('Deleting existing user_permissions collection...');
      await pb.collections.delete(existing.id);
    }

    // Create collection following the same pattern as default_permissions
    const collectionData = {
      name: 'user_permissions',
      type: 'base',
      schema: [
        {
          name: 'user_id',
          type: 'text',
          required: true,
          unique: true,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
        {
          name: 'permissions_data',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
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
          options: {
            min: null,
            max: null,
            pattern: '',
          },
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

createUserPermissionsCollection();
