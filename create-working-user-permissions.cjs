const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function createWorkingUserPermissionsCollection() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CREATING WORKING USER PERMISSIONS COLLECTION ===\n');

    // Create collection with working schema - use relation for user_id
    const collectionData = {
      name: 'user_permissions',
      type: 'base',
      schema: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          unique: true,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['username', 'name'],
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
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['Super Admin', 'Manager', 'Operator', 'Autonomous', 'Viewer'],
          },
        },
      ],
    };

    console.log('Creating user_permissions collection with relation...');
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

createWorkingUserPermissionsCollection();
