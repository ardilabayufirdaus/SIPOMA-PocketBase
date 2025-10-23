const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function addPermissionsFieldsToUsers() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== ADDING PERMISSIONS FIELDS TO USERS COLLECTION ===\n');

    // Get the users collection
    const collections = await pb.collections.getFullList();
    const usersCollection = collections.find((c) => c.name === 'users');

    if (!usersCollection) {
      console.error('Users collection not found!');
      return;
    }

    console.log('Current schema fields:');
    usersCollection.schema.forEach((field) => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    // Check if fields already exist
    const hasPermissions = usersCollection.schema.some((f) => f.name === 'permissions');
    const hasCustomFlag = usersCollection.schema.some((f) => f.name === 'is_custom_permissions');

    if (hasPermissions && hasCustomFlag) {
      console.log('\n✅ Both permissions fields already exist!');
      return;
    }

    // Add permissions field (JSON)
    if (!hasPermissions) {
      console.log('\nAdding permissions field...');
      const permissionsField = {
        name: 'permissions',
        type: 'json',
        required: false,
        options: {},
      };
      usersCollection.schema.push(permissionsField);
    }

    // Add is_custom_permissions field (bool)
    if (!hasCustomFlag) {
      console.log('Adding is_custom_permissions field...');
      const customFlagField = {
        name: 'is_custom_permissions',
        type: 'bool',
        required: false,
        options: {},
      };
      usersCollection.schema.push(customFlagField);
    }

    // Update the collection
    console.log('\nUpdating users collection schema...');
    const updatedCollection = await pb.collections.update(usersCollection.id, {
      name: usersCollection.name,
      type: usersCollection.type,
      schema: usersCollection.schema,
      indexes: usersCollection.indexes || [],
    });

    console.log('✅ Schema updated successfully!');
    console.log('\nNew schema fields:');
    updatedCollection.schema.forEach((field) => {
      console.log(`  - ${field.name} (${field.type})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

addPermissionsFieldsToUsers();
