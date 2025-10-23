const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function recreateProfiles() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // Delete and recreate the collection
    try {
      const collections = await pb.collections.getFullList();
      const profilesCollection = collections.find((c) => c.name === 'parameter_order_profiles');

      if (profilesCollection) {
        console.log('Deleting existing collection...');
        await pb.collections.delete(profilesCollection.id);
        console.log('Collection deleted');
      }

      // Create new collection with text user_id field
      console.log('Creating new collection...');
      const schema = {
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
          {
            name: 'parameter_order',
            type: 'json',
            required: true,
          },
        ],
      };

      const result = await pb.collections.create(schema);
      console.log('Collection created with id:', result.id);

      // Set permissions - completely public
      await pb.collections.update(result.id, {
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: 'user_id = @request.auth.id',
        deleteRule: 'user_id = @request.auth.id',
      });
      console.log('Permissions set to public');

      // Create a test record
      const testRecord = await pb.collection('parameter_order_profiles').create({
        name: 'Default Profile',
        description: 'Default parameter order profile',
        user_id: 'system',
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        parameter_order: ['param1', 'param2', 'param3'],
      });
      console.log('Test record created with id:', testRecord.id);
    } catch (error) {
      console.error('Error in recreation:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data));
      }
    }
  } catch (error) {
    console.error('Error in auth:', error.message);
  }
}

recreateProfiles();
