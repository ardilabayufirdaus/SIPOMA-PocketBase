const PocketBase = require('pocketbase/cjs');

// Test with regular user authentication (not admin)
const pb = new PocketBase('http://141.11.25.69:8090');

async function testUserAuth() {
  try {
    // Try to authenticate as regular user - we need to find a regular user first
    const users = await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // Get list of regular users
    const allUsers = await pb.collection('users').getFullList({ fields: 'id,email,role' });
    console.log('Available users:');
    allUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.role})`);
    });

    if (allUsers.length > 0) {
      // Try to authenticate as first regular user
      const testUser = allUsers[0];
      console.log(`Testing auth as: ${testUser.email}`);

      // For testing, we'll use admin auth but check permissions
      console.log('Current auth store:', {
        isValid: pb.authStore.isValid,
        model: pb.authStore.model
          ? {
              id: pb.authStore.model.id,
              email: pb.authStore.model.email,
              role: pb.authStore.model.role,
            }
          : null,
      });

      // Test parameter data access with current auth
      const paramSettings = await pb.collection('parameter_settings').getFullList({ limit: 1 });
      if (paramSettings.length > 0) {
        const paramId = paramSettings[0].id;
        const testDate = '2025-10-17';
        const dateTimeString = `${testDate} 00:00:00.000Z`;

        console.log('Testing parameter data access...');

        // Try to read
        const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
          filter: `date="${dateTimeString}" && parameter_id="${paramId}"`,
        });
        console.log('Read access: OK (${existingRecords.length} records)');

        // Try to create/update
        const testData = {
          date: testDate,
          parameter_id: paramId,
          hourly_values: {
            1: { value: 999, user_name: 'Permission Test', timestamp: new Date().toISOString() },
          },
          name: 'Permission Test',
        };

        if (existingRecords.length > 0) {
          // Try update
          const updateResult = await pb
            .collection('ccr_parameter_data')
            .update(existingRecords[0].id, {
              hourly_values: {
                1: {
                  value: 999,
                  user_name: 'Permission Test',
                  timestamp: new Date().toISOString(),
                },
              },
              name: 'Permission Test',
            });
          console.log('Update access: OK');
        } else {
          // Try create
          const createResult = await pb.collection('ccr_parameter_data').create(testData);
          console.log('Create access: OK');
        }
      }
    }
  } catch (error) {
    console.error('Auth test error:', error.message);
  }
}

testUserAuth();
