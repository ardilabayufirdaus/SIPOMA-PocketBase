const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function fixFilterIssue() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // First try to create a sample profile to ensure we have data
    try {
      console.log('Creating a test profile...');
      const testProfile = await pb.collection('parameter_order_profiles').create({
        name: 'Test Profile',
        description: 'Auto-created test profile',
        user_id: 'admin',
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        parameter_order: ['test1', 'test2'],
      });
      console.log('Created test profile with ID:', testProfile.id);
    } catch (createErr) {
      console.error('Failed to create test profile:', createErr.message);
    }

    console.log('Testing filter with escaped quotes...');
    const testData = await pb.collection('parameter_order_profiles').getFullList();
    console.log('Total records:', testData.length);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

fixFilterIssue();
