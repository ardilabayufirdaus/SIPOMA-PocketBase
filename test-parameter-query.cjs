const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testQuery() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    // Get first parameter_settings id
    const paramSettings = await pb.collection('parameter_settings').getFullList({ limit: 1 });
    if (paramSettings.length > 0) {
      const paramId = paramSettings[0].id;
      console.log('Testing with parameter_id:', paramId);

      // Try to create a test record
      const testDate = '2025-10-17';
      const testData = {
        date: testDate,
        parameter_id: paramId,
        hourly_values: {
          1: { value: 100, user_name: 'test', timestamp: new Date().toISOString() },
        },
        name: 'test user',
      };

      console.log('Creating test record...');
      const created = await pb.collection('ccr_parameter_data').create(testData);
      console.log('Created test record:', created.id);

      // Test the fixed query format
      console.log('Testing fixed query format...');
      const dateTimeString = `${testDate} 00:00:00.000Z`;
      const fixedFilter = `date="${dateTimeString}" && parameter_id="${paramId}"`;
      console.log('Fixed filter:', fixedFilter);

      const foundFixed = await pb.collection('ccr_parameter_data').getFirstListItem(fixedFilter);
      console.log('Found with fixed format:', foundFixed.id);

      // Clean up
      await pb.collection('ccr_parameter_data').delete(created.id);
      console.log('Cleaned up test record');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuery();
