const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixActivityLogsAccessRules() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== FIXING ACTIVITY LOGS ACCESS RULES ===\n');

    // Get the user_activity_logs collection
    const collections = await pb.collections.getFullList();
    const activityLogsCollection = collections.find((c) => c.name === 'user_activity_logs');

    if (!activityLogsCollection) {
      console.log('❌ user_activity_logs collection not found');
      return;
    }

    console.log('Current access rules:');
    console.log('- createRule:', activityLogsCollection.createRule);
    console.log('- listRule:', activityLogsCollection.listRule);
    console.log('- viewRule:', activityLogsCollection.viewRule);

    // Update access rules to allow all authenticated users to create logs, but only admins to view them
    const updatedCollection = {
      ...activityLogsCollection,
      createRule: '@request.auth.id != null', // Any authenticated user can create logs
      listRule: '@request.auth.role = "Super Admin" || @request.auth.role = "Admin"',
      viewRule: '@request.auth.role = "Super Admin" || @request.auth.role = "Admin"',
    };

    console.log('\nUpdating access rules...');
    await pb.collections.update(activityLogsCollection.id, updatedCollection);

    console.log('✅ Activity logs access rules updated successfully');

    // Verify the update
    const updatedCollections = await pb.collections.getFullList();
    const updatedActivityLogs = updatedCollections.find((c) => c.name === 'user_activity_logs');

    console.log('\nUpdated access rules:');
    console.log('- createRule:', updatedActivityLogs.createRule);
    console.log('- listRule:', updatedActivityLogs.listRule);
    console.log('- viewRule:', updatedActivityLogs.viewRule);
  } catch (error) {
    console.error('❌ Failed to update activity logs access rules:', error.message);
  }
}

fixActivityLogsAccessRules();
