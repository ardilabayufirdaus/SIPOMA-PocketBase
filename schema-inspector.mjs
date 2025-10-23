/**
 * PocketBase Schema Inspector
 *
 * This utility checks the actual schema of a PocketBase collection
 * to ensure we're using the correct field names in our queries
 */

import PocketBase from 'pocketbase';

async function inspectSchema() {
  try {
    // Update these values according to your environment
    const pocketbaseUrl = 'http://127.0.0.1:8090';
    const targetCollection = 'ccr_downtime_data';

    // Initialize PocketBase client
    const pb = new PocketBase(pocketbaseUrl);

    // Fetch collections
    const collections = await pb.collections.getFullList();

    // Find the target collection
    const targetCollectionData = collections.find((c) => c.name === targetCollection);

    if (targetCollectionData) {
      // Display collection schema
      console.log('COLLECTION SCHEMA:');
      console.log('==================');
      console.log(JSON.stringify(targetCollectionData.schema, null, 2));

      // Get sample data
      const records = await pb.collection(targetCollection).getList(1, 1, {
        sort: '-created',
      });

      console.log('\nSAMPLE RECORD:');
      console.log('==============');

      if (records.items.length > 0) {
        console.log(JSON.stringify(records.items[0], null, 2));
      } else {
        console.log('No records found in this collection');
      }
    } else {
      console.log(`Collection "${targetCollection}" not found`);
    }
  } catch (error) {
    console.error('Error inspecting schema:', error);
    throw error;
  }
}

// Run the inspection
inspectSchema()
  .then(() => console.log('\nInspection complete!'))
  .catch((error) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  });
