const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function createProperUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CREATING PROPER USER PERMISSIONS COLLECTION ===\n');

    // Delete existing collection if it exists
    const collections = await pb.collections.getFullList();
    const existingCollection = collections.find((c) => c.name === 'user_permissions');

    if (existingCollection) {
      console.log('Deleting existing user_permissions collection...');
      await pb.collections.delete(existingCollection.id);
      console.log('✅ Existing collection deleted');
    }

    // Create new collection with proper schema
    const collectionData = {
      name: 'user_permissions',
      type: 'base',
      schema: [
        {
          name: 'user_id',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'permissions',
          type: 'json',
          required: false,
        },
        {
          name: 'is_custom_permissions',
          type: 'bool',
          required: false,
        },
        {
          name: 'role',
          type: 'text',
          required: false,
        },
      ],
    };

    console.log('Creating new user_permissions collection...');
    const newCollection = await pb.collections.create(collectionData);

    console.log('✅ Collection created successfully!');
    console.log('Collection ID:', newCollection.id);
    console.log('Schema fields:');
    newCollection.schema.forEach((field) => {
      console.log(
        `  - ${field.name} (${field.type}) ${field.required ? '(required)' : ''} ${field.unique ? '(unique)' : ''}`
      );
    });

    // Add indexes
    console.log('\nAdding indexes...');
    const collectionWithIndexes = await pb.collections.update(newCollection.id, {
      ...newCollection,
      indexes: [
        'CREATE UNIQUE INDEX idx_user_permissions_user_id ON user_permissions (user_id)',
        'CREATE INDEX idx_user_permissions_role ON user_permissions (role)',
      ],
    });

    console.log('✅ Indexes added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createProperUserPermissionsCollection();
