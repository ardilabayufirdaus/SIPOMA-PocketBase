const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function updateUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== UPDATING USER PERMISSIONS COLLECTION ===\n');

    // Get the existing collection
    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.error('user_permissions collection not found!');
      return;
    }

    console.log('Current schema:');
    userPermsCollection.schema.forEach((field) => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    // Update schema to match our needs
    const newSchema = [
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
    ];

    console.log('\nUpdating schema...');
    const updatedCollection = await pb.collections.update(userPermsCollection.id, {
      name: userPermsCollection.name,
      type: userPermsCollection.type,
      schema: newSchema,
      indexes: [
        'CREATE UNIQUE INDEX idx_user_permissions_user_id ON user_permissions (user_id)',
        'CREATE INDEX idx_user_permissions_role ON user_permissions (role)',
      ],
    });

    console.log('✅ Schema updated successfully!');
    console.log('New schema fields:');
    updatedCollection.schema.forEach((field) => {
      console.log(`  - ${field.name} (${field.type})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

updateUserPermissionsCollection();
