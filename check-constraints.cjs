const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkCollectionConstraints() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING COLLECTION CONSTRAINTS ===\n');

    const collections = await pb.collections.getFullList();
    const userPermsCollection = collections.find((c) => c.name === 'user_permissions');

    if (!userPermsCollection) {
      console.error('❌ user_permissions collection not found!');
      return;
    }

    console.log('Schema fields:');
    userPermsCollection.schema.forEach((field) => {
      console.log(`  - ${field.name}: unique=${field.unique}, required=${field.required}`);
    });

    console.log('\nIndexes:');
    if (userPermsCollection.indexes && userPermsCollection.indexes.length > 0) {
      userPermsCollection.indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index}`);
      });
    } else {
      console.log('  No indexes defined');
    }

    // Check if we can find the unique index
    const hasUniqueIndex = userPermsCollection.indexes?.some(
      (index) => index.includes('user_id') && index.includes('UNIQUE')
    );
    console.log(`\nHas unique index on user_id: ${hasUniqueIndex ? 'YES' : 'NO'}`);

    // Clean up the duplicate record we created
    console.log('\n=== CLEANING UP TEST DATA ===');
    try {
      const duplicateRecords = await pb.collection('user_permissions').getList(1, 50, {
        filter: 'user_id = "nirbztuqpwa5vhl"',
      });

      if (duplicateRecords.totalItems > 1) {
        console.log(`Found ${duplicateRecords.totalItems} records for user nirbztuqpwa5vhl`);
        // Keep the first one, delete the rest
        for (let i = 1; i < duplicateRecords.items.length; i++) {
          await pb.collection('user_permissions').delete(duplicateRecords.items[i].id);
          console.log(`Deleted duplicate record: ${duplicateRecords.items[i].id}`);
        }
      }
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCollectionConstraints();
