
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://api.sipoma.site/');

async function testQuery() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');
    
    // Get first parameter_settings id
    const paramSettings = await pb.collection('parameter_settings').getFullList({ limit: 1 });
    if (paramSettings.length > 0) {
      const paramId = paramSettings[0].id;
      console.log('Testing with parameter_id:', paramId);
      
      // Try to find existing ccr_parameter_data
      try {
        const filter = \parameter_id='\'\;
        console.log('Filter:', filter);
        const existing = await pb.collection('ccr_parameter_data').getFirstListItem(filter);
        console.log('Found existing record:', existing.id);
      } catch (error) {
        console.log('No existing record found (expected for new data):', error.message);
      }
      
      // Try to create a test record
      const testDate = '2025-10-17';
      const testData = {
        date: testDate,
        parameter_id: paramId,
        hourly_values: { '1': { value: 100, user_name: 'test', timestamp: new Date().toISOString() } },
        name: 'test user'
      };
      
      console.log('Creating test record...');
      const created = await pb.collection('ccr_parameter_data').create(testData);
      console.log('Created test record:', created.id);
      
      // Try to query it back
      const filter2 = \date='\' && parameter_id='\'\;
      console.log('Query filter:', filter2);
      const found = await pb.collection('ccr_parameter_data').getFirstListItem(filter2);
      console.log('Found created record:', found.id);
      
      // Clean up
      await pb.collection('ccr_parameter_data').delete(created.id);
      console.log('Cleaned up test record');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuery();


