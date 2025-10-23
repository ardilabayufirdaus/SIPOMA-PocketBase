const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function analyzeExistingCollections() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== ANALYZING EXISTING COLLECTIONS ===\n');

    const collections = await pb.collections.getFullList();

    // Analyze default_permissions collection
    const defaultPerms = collections.find((c) => c.name === 'default_permissions');
    if (defaultPerms) {
      console.log('default_permissions collection:');
      console.log('  Schema:');
      defaultPerms.schema.forEach((field) => {
        console.log(`    - ${field.name}: ${field.type}`);
        if (field.options && Object.keys(field.options).length > 0) {
          console.log(`      options: ${JSON.stringify(field.options, null, 2)}`);
        }
      });
      console.log('  Indexes:', defaultPerms.indexes);
    }

    // Analyze user_activity_logs collection
    const activityLogs = collections.find((c) => c.name === 'user_activity_logs');
    if (activityLogs) {
      console.log('\nuser_activity_logs collection:');
      console.log('  Schema:');
      activityLogs.schema.forEach((field) => {
        console.log(`    - ${field.name}: ${field.type}`);
      });
    }

    // Check if we can use user record fields directly
    console.log('\n=== RECOMMENDED APPROACH ===');
    console.log('Based on analysis, recommended structure:');
    console.log('1. Store permissions directly in user record (JSON field)');
    console.log('2. Use default_permissions collection for role defaults');
    console.log('3. Use user_activity_logs for audit trail');
    console.log('4. Create separate collection only if needed for complex relationships');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeExistingCollections();
