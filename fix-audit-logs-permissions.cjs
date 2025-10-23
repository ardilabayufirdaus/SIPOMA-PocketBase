const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixAuditLogsPermissions() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== FIXING AUDIT LOGS PERMISSIONS ===\n');

    const collections = await pb.collections.getFullList();
    const auditLogsCollection = collections.find((c) => c.name === 'user_activity_logs');

    if (!auditLogsCollection) {
      console.error('❌ user_activity_logs collection not found!');
      return;
    }

    console.log('Current permissions:');
    console.log('  List rule:', auditLogsCollection.listRule || 'null');
    console.log('  View rule:', auditLogsCollection.viewRule || 'null');
    console.log('  Create rule:', auditLogsCollection.createRule || 'null');

    // Allow users to view their own audit logs, but only system can create
    const updatedCollection = await pb.collections.update(auditLogsCollection.id, {
      ...auditLogsCollection,
      listRule: 'user_id = @request.auth.id', // Users can list their own logs
      viewRule: 'user_id = @request.auth.id', // Users can view their own logs
      createRule: null, // Only system can create (via API)
      updateRule: null, // No updates allowed
      deleteRule: null, // No deletions allowed
    });

    console.log('\n✅ Audit logs permissions updated!');
    console.log('New permissions:');
    console.log('  List rule:', updatedCollection.listRule);
    console.log('  View rule:', updatedCollection.viewRule);
    console.log('  Create rule:', updatedCollection.createRule);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAuditLogsPermissions();
