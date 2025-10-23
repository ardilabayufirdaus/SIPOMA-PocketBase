const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testUserPermissionsSave() {
  try {
    console.log('Testing user permissions save...');

    // Try to authenticate with different credentials
    const credentials = [
      { email: 'ardila.firdaus@sig.id', password: 'makassar@270989' },
      { email: 'ardila.firdaus', password: 'makassar@270989' },
      { email: 'ardila.firdaus@sig.id', password: 'password123' },
    ];

    let authenticated = false;
    for (const cred of credentials) {
      try {
        console.log(`Trying to authenticate with ${cred.email}...`);
        await pb.collection('_pb_users_auth_').authWithPassword(cred.email, cred.password);
        console.log('Authentication successful');
        authenticated = true;
        break;
      } catch (error) {
        console.log(`Authentication failed for ${cred.email}: ${error.message}`);
      }
    }

    if (!authenticated) {
      console.log('Could not authenticate. Trying admin auth...');
      try {
        await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
        console.log('Admin authentication successful');
      } catch (adminError) {
        console.log('Admin authentication also failed:', adminError.message);
        return;
      }
    }

    // Get a test user
    console.log('Getting users...');
    const users = await pb.collection('_pb_users_auth_').getList(1, 5);
    if (users.items.length === 0) {
      console.log('No users found');
      return;
    }

    const testUser = users.items[0];
    console.log('Test user:', {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
    });

    // Test permissions object
    const testPermissions = {
      dashboard: 'ADMIN',
      plant_operations: {
        CCR: {
          'CCR-1': 'WRITE',
          'CCR-2': 'READ',
        },
      },
    };

    console.log('Test permissions:', JSON.stringify(testPermissions, null, 2));

    // Try to save permissions
    console.log('Attempting to save permissions...');
    try {
      const result = await pb.collection('_pb_users_auth_').update(testUser.id, {
        permissions: testPermissions,
      });
      console.log('✅ Permissions saved successfully!');
      console.log('Updated user:', result);
    } catch (saveError) {
      console.log('❌ Failed to save permissions:', saveError.message);
      console.log('Error details:', saveError);

      // Check if permissions field exists
      console.log('Checking collection schema...');
      try {
        const collections = await pb.collections.getFullList();
        const usersCollection = collections.find((c) => c.name === '_pb_users_auth_');

        if (usersCollection) {
          console.log('Users collection fields:');
          usersCollection.fields.forEach((field) => {
            console.log(`- ${field.name}: ${field.type}`);
          });

          const permissionsField = usersCollection.fields.find((f) => f.name === 'permissions');
          console.log('Permissions field exists:', !!permissionsField);

          if (permissionsField) {
            console.log('Permissions field details:', JSON.stringify(permissionsField, null, 2));
          } else {
            console.log('Permissions field does not exist. Available fields:');
            usersCollection.fields.forEach((field) => {
              console.log(`  ${field.name} (${field.type})`);
            });
          }
        }
      } catch (schemaError) {
        console.log('Could not check schema:', schemaError.message);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUserPermissionsSave();
