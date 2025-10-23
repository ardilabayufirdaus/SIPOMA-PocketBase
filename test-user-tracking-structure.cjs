const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

// Test script to verify the new user tracking structure in hourly_values
async function testUserTrackingStructure() {
  try {
    console.log('Testing new user tracking structure...');

    // Test data
    const testDate = '2025-10-17 00:00:00.000Z';
    const testParameterId = 'hs34fzd79wjkips';
    const testUser1 = 'User One';
    const testUser2 = 'User Two';

    // Clear any existing test data
    try {
      const existing = await pb.collection('ccr_parameter_data').getList(1, 1, {
        filter: `date="${testDate}" && parameter_id="${testParameterId}"`,
      });
      if (existing.items.length > 0) {
        await pb.collection('ccr_parameter_data').delete(existing.items[0].id);
        console.log('Cleared existing test data');
      }
    } catch (error) {
      // Expected if no existing data
    }

    // Test 1: Save data for hour 8 with User One
    console.log('Test 1: Saving hour 8 with User One...');
    await pb.collection('ccr_parameter_data').create({
      date: testDate,
      parameter_id: testParameterId,
      hourly_values: {
        8: { value: '100', user_name: testUser1 },
      },
      name: testUser1,
    });

    // Test 2: Update hour 8 with User Two (should replace)
    console.log('Test 2: Updating hour 8 with User Two...');
    const record1 = await pb.collection('ccr_parameter_data').getList(1, 1, {
      filter: `date="${testDate}" && parameter_id="${testParameterId}"`,
    });
    await pb.collection('ccr_parameter_data').update(record1.items[0].id, {
      hourly_values: {
        8: { value: '150', user_name: testUser2 },
      },
      name: testUser2,
    });

    // Test 3: Add hour 9 with User One
    console.log('Test 3: Adding hour 9 with User One...');
    const record2 = await pb.collection('ccr_parameter_data').getList(1, 1, {
      filter: `date="${testDate}" && parameter_id="${testParameterId}"`,
    });
    await pb.collection('ccr_parameter_data').update(record2.items[0].id, {
      hourly_values: {
        8: { value: '150', user_name: testUser2 },
        9: { value: '200', user_name: testUser1 },
      },
      name: testUser2,
    });

    // Verify the data
    console.log('Verifying saved data...');
    const finalRecord = await pb.collection('ccr_parameter_data').getList(1, 1, {
      filter: `date="${testDate}" && parameter_id="${testParameterId}"`,
    });

    console.log('Final record:', JSON.stringify(finalRecord.items[0], null, 2));

    // Check structure
    const hour8 = finalRecord.items[0].hourly_values[8];
    const hour9 = finalRecord.items[0].hourly_values[9];

    if (
      hour8 &&
      typeof hour8 === 'object' &&
      hour8.value === '150' &&
      hour8.user_name === testUser2
    ) {
      console.log('✅ Hour 8 correctly shows User Two');
    } else {
      console.log('❌ Hour 8 structure incorrect:', hour8);
    }

    if (
      hour9 &&
      typeof hour9 === 'object' &&
      hour9.value === '200' &&
      hour9.user_name === testUser1
    ) {
      console.log('✅ Hour 9 correctly shows User One');
    } else {
      console.log('❌ Hour 9 structure incorrect:', hour9);
    }

    // Clean up test data
    await pb.collection('ccr_parameter_data').delete(finalRecord.items[0].id);
    console.log('Test data cleaned up');

    console.log('User tracking structure test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testUserTrackingStructure();
