const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testSimplifiedStructure() {
  try {
    console.log('Testing simplified hourly_values structure...');

    // Create test data with simplified structure
    const testData = {
      date: '2025-10-17 00:00:00.000Z',
      parameter_id: 'hs34fzd79wjkips',
      hourly_values: {
        1: '400', // Simplified: just value, no user_name/timestamp
        2: '450',
      },
      name: 'Ardila Bayu Firdaus',
    };

    console.log('Test data structure:', JSON.stringify(testData, null, 2));

    // Try to create/update record
    const existing = await pb.collection('ccr_parameter_data').getList(1, 1, {
      filter: 'date="2025-10-17 00:00:00.000Z" && parameter_id="hs34fzd79wjkips"',
    });

    if (existing.items.length > 0) {
      // Update existing
      await pb.collection('ccr_parameter_data').update(existing.items[0].id, {
        hourly_values: testData.hourly_values,
        name: testData.name,
      });
      console.log('Updated existing record');
    } else {
      // Create new
      await pb.collection('ccr_parameter_data').create(testData);
      console.log('Created new record');
    }

    // Verify the saved data
    const saved = await pb.collection('ccr_parameter_data').getList(1, 1, {
      filter: 'date="2025-10-17 00:00:00.000Z" && parameter_id="hs34fzd79wjkips"',
    });

    if (saved.items.length > 0) {
      console.log('Saved data structure:');
      console.log(JSON.stringify(saved.items[0], null, 2));
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testSimplifiedStructure();
