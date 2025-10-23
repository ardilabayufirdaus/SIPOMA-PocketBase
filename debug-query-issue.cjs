const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function debugQueryIssue() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== DEBUGGING QUERY ISSUE ===\n');

    const targetUserId = '3ucxta9dvkumzvf';

    // Test different query formats
    console.log('--- Testing different query formats ---');

    // Query 1: Exact same as frontend
    console.log("Query 1: user_id = '${userId}'");
    try {
      const result1 = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = '${targetUserId}'`,
      });
      console.log('Result 1:', {
        totalItems: result1.totalItems,
        itemsCount: result1.items.length,
      });
    } catch (error) {
      console.log('Query 1 failed:', error.message);
    }

    // Query 2: Double quotes
    console.log('Query 2: user_id = "${userId}"');
    try {
      const result2 = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = "${targetUserId}"`,
      });
      console.log('Result 2:', {
        totalItems: result2.totalItems,
        itemsCount: result2.items.length,
      });
    } catch (error) {
      console.log('Query 2 failed:', error.message);
    }

    // Query 3: No quotes
    console.log('Query 3: user_id = userId');
    try {
      const result3 = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = ${targetUserId}`,
      });
      console.log('Result 3:', {
        totalItems: result3.totalItems,
        itemsCount: result3.items.length,
      });
    } catch (error) {
      console.log('Query 3 failed:', error.message);
    }

    // Query 4: Get all and filter manually
    console.log('Query 4: Get all records and filter manually');
    try {
      const allRecords = await pb.collection('user_permissions').getFullList();
      const matchingRecords = allRecords.filter((record) => record.user_id === targetUserId);
      console.log('Manual filter result:', { totalMatching: matchingRecords.length });
      if (matchingRecords.length > 0) {
        console.log('Matching record:', {
          id: matchingRecords[0].id,
          user_id: matchingRecords[0].user_id,
          role: matchingRecords[0].role,
          is_custom_permissions: matchingRecords[0].is_custom_permissions,
        });
      }
    } catch (error) {
      console.log('Query 4 failed:', error.message);
    }

    // Check collection access rules
    console.log('\n--- Checking collection access rules ---');
    try {
      const collections = await pb.collections.getFullList();
      const userPermsCollection = collections.find((c) => c.name === 'user_permissions');
      if (userPermsCollection) {
        console.log('Access rules:');
        console.log('- listRule:', userPermsCollection.listRule);
        console.log('- viewRule:', userPermsCollection.viewRule);
        console.log('- createRule:', userPermsCollection.createRule);
        console.log('- updateRule:', userPermsCollection.updateRule);
        console.log('- deleteRule:', userPermsCollection.deleteRule);
      }
    } catch (error) {
      console.log('❌ Could not get access rules:', error.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugQueryIssue();
