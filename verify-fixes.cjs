const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function verifyFixes() {
  try {
    console.log('Testing fixed filter syntax in CcrDataEntryPage.tsx...');

    // Test with the exact filter syntax we used in the patch
    try {
      const records = await pb.collection('parameter_order_profiles').getFullList({
        filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
        sort: '-created',
      });

      console.log(`✅ Success! Retrieved ${records.length} profiles with fixed filter syntax`);
      if (records.length > 0) {
        console.log(`First profile name: ${records[0].name}`);
      }
    } catch (error) {
      console.error('❌ Error with fixed syntax:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }

    // Check if sort field exists
    try {
      console.log('\nVerifying sort field...');
      const collections = await pb.admins
        .authWithPassword('ardila.firdaus@sig.id', 'makassar@270989')
        .then(() => pb.collections.getFullList());

      const profilesCollection = collections.find((c) => c.name === 'parameter_order_profiles');
      if (profilesCollection) {
        console.log('Collection schema fields:');
        const fields = profilesCollection.schema.map((field) => field.name);
        console.log(fields);

        if (fields.includes('created_at')) {
          console.log('✅ created_at field exists');
        } else if (fields.includes('created')) {
          console.log('✅ created field exists');
        } else {
          console.log('❌ Neither created_at nor created fields exist');
        }
      }
    } catch (error) {
      console.error('❌ Error checking schema:', error.message);
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

verifyFixes();
