const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function createUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CREATING USER PERMISSIONS COLLECTION ===\n');

    // Check if collection already exists
    const collections = await pb.collections.getFullList();
    const existingCollection = collections.find((c) => c.name === 'user_permissions');

    if (existingCollection) {
      console.log('✅ user_permissions collection already exists!');
      console.log('Schema fields:');
      existingCollection.schema.forEach((field) => {
        console.log(`  - ${field.name} (${field.type})`);
      });
      return;
    }

    // Create new collection for user permissions
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
            min: 1,
            max: null,
            pattern: '',
          },
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
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_user_permissions_user_id ON user_permissions (user_id)',
        'CREATE INDEX idx_user_permissions_role ON user_permissions (role)',
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
      console.error('Response data:', error.response.data);
    }
  }
}

createUserPermissionsCollection();
