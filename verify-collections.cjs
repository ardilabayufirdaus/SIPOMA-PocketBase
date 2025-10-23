const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function verifyCollections() {
  try {
    // First authenticate as admin to get collection info
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Admin authentication successful');

    // Get all collections
    const collections = await pb.collections.getFullList();
    console.log(`Found ${collections.length} collections`);

    // Check for our specific collections
    const profilesCollection = collections.find((c) => c.name === 'parameter_order_profiles');
    const ordersCollection = collections.find((c) => c.name === 'user_parameter_orders');

    if (profilesCollection) {
      console.log('\nParameter Order Profiles collection:');
      console.log(`- ID: ${profilesCollection.id}`);
      console.log(`- Name: ${profilesCollection.name}`);
      console.log(`- List rule: "${profilesCollection.listRule}"`);
      console.log(`- View rule: "${profilesCollection.viewRule}"`);
      console.log(`- Create rule: "${profilesCollection.createRule}"`);
      console.log(`- Update rule: "${profilesCollection.updateRule}"`);
      console.log(`- Delete rule: "${profilesCollection.deleteRule}"`);

      // Get the schema
      console.log('\nSchema fields:');
      profilesCollection.schema.forEach((field) => {
        console.log(`- ${field.name} (${field.type}): required=${field.required || false}`);
        if (field.options) {
          console.log(`  Options: ${JSON.stringify(field.options)}`);
        }
      });
    } else {
      console.log('parameter_order_profiles collection NOT FOUND');
    }

    if (ordersCollection) {
      console.log('\nUser Parameter Orders collection:');
      console.log(`- ID: ${ordersCollection.id}`);
      console.log(`- Name: ${ordersCollection.name}`);
      console.log(`- List rule: "${ordersCollection.listRule}"`);
      console.log(`- View rule: "${ordersCollection.viewRule}"`);
      console.log(`- Create rule: "${ordersCollection.createRule}"`);
      console.log(`- Update rule: "${ordersCollection.updateRule}"`);
      console.log(`- Delete rule: "${ordersCollection.deleteRule}"`);

      // Get the schema
      console.log('\nSchema fields:');
      ordersCollection.schema.forEach((field) => {
        console.log(`- ${field.name} (${field.type}): required=${field.required || false}`);
        if (field.options) {
          console.log(`  Options: ${JSON.stringify(field.options)}`);
        }
      });
    } else {
      console.log('user_parameter_orders collection NOT FOUND');
    }

    // Try to get records from each collection
    if (profilesCollection) {
      try {
        const records = await pb.collection('parameter_order_profiles').getFullList();
        console.log(`\nFound ${records.length} parameter_order_profiles records`);
        if (records.length > 0) {
          console.log('First record:', JSON.stringify(records[0]));
        }
      } catch (error) {
        console.error('Error fetching parameter_order_profiles records:', error.message);
      }
    }

    if (ordersCollection) {
      try {
        const records = await pb.collection('user_parameter_orders').getFullList();
        console.log(`\nFound ${records.length} user_parameter_orders records`);
        if (records.length > 0) {
          console.log('First record:', JSON.stringify(records[0]));
        }
      } catch (error) {
        console.error('Error fetching user_parameter_orders records:', error.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

verifyCollections();
