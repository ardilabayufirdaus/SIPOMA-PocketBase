const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function recreateParameters() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // Check if the collection exists
    const collections = await pb.collections.getFullList();
    const paramProfileCollection = collections.find((c) => c.name === 'parameter_order_profiles');

    if (!paramProfileCollection) {
      console.log('Collection parameter_order_profiles does not exist, creating it...');
      // Create the collection since it doesn't exist
      await pb.collections.create({
        name: 'parameter_order_profiles',
        type: 'base',
        schema: [
          { name: 'idx', type: 'number' },
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'user_id', type: 'text', required: true },
          { name: 'module', type: 'text', required: true },
          { name: 'parameter_type', type: 'text', required: true },
          { name: 'category', type: 'text' },
          { name: 'unit', type: 'text' },
          { name: 'parameter_order', type: 'json', required: true },
        ],
        listRule: '', // Public
        viewRule: '', // Public
      });
      console.log('Collection created successfully');
    } else {
      console.log('Collection parameter_order_profiles already exists');

      // Try to create a sample record to verify it works
      try {
        console.log('Creating a test profile...');
        await pb.collection('parameter_order_profiles').create({
          name: 'Test Profile',
          description: 'Test profile description',
          user_id: 'admin',
          module: 'plant_operations',
          parameter_type: 'ccr_parameters',
          parameter_order: ['test1', 'test2', 'test3'],
        });
        console.log('Test profile created successfully');

        // Verify we can retrieve it
        const profiles = await pb.collection('parameter_order_profiles').getFullList({
          filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
        });
        console.log(`Retrieved ${profiles.length} profiles`);
      } catch (createError) {
        console.error('Error creating test profile:', createError.message);
        if (createError.response) {
          console.error('Response data:', createError.response.data);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

recreateParameters();
