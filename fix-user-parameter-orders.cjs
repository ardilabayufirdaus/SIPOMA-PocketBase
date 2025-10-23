const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixUserParameterOrders() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // Get the user_parameter_orders collection
    const collections = await pb.collections.getFullList();
    const ordersCollection = collections.find((c) => c.name === 'user_parameter_orders');

    if (ordersCollection) {
      console.log('Updating user_parameter_orders permissions...');

      // Set permissions to public
      await pb.collections.update(ordersCollection.id, {
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: 'user_id = @request.auth.id',
        deleteRule: 'user_id = @request.auth.id',
      });

      console.log('user_parameter_orders permissions updated');
    } else {
      console.log('user_parameter_orders collection not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

fixUserParameterOrders();
