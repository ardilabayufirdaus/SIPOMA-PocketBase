const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testParameterUpdate() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated as admin');

    // Get first parameter
    const paramSettings = await pb.collection('parameter_settings').getFullList({ limit: 1 });
    if (paramSettings.length > 0) {
      const paramId = paramSettings[0].id;
      console.log('Testing with parameter_id:', paramId);

      // Try to update parameter data
      const testDate = '2025-10-17';
      const userName = 'Test User';

      console.log('Testing updateParameterData logic...');

      // Simulate the updateParameterData logic
      const dateTimeString = `${testDate} 00:00:00.000Z`;
      console.log('DateTime string:', dateTimeString);

      // Check existing record
      const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date="${dateTimeString}" && parameter_id="${paramId}"`,
      });

      console.log('Existing records found:', existingRecords.length);

      if (existingRecords.length > 0) {
        console.log('Will update existing record:', existingRecords[0].id);

        // Update existing record
        const existing = existingRecords[0];
        const currentHourlyValues = existing.hourly_values || {};
        const updatedHourlyValues = { ...currentHourlyValues };

        // Add/update hour 1
        updatedHourlyValues['1'] = {
          value: 123,
          user_name: userName,
          timestamp: new Date().toISOString(),
        };

        const updateResult = await pb.collection('ccr_parameter_data').update(existing.id, {
          hourly_values: updatedHourlyValues,
          name: userName,
        });

        console.log('Update successful:', updateResult.id);
      } else {
        console.log('Will create new record');

        // Create new record
        const newData = {
          date: testDate,
          parameter_id: paramId,
          hourly_values: {
            1: {
              value: 123,
              user_name: userName,
              timestamp: new Date().toISOString(),
            },
          },
          name: userName,
        };

        const createResult = await pb.collection('ccr_parameter_data').create(newData);
        console.log('Create successful:', createResult.id);
      }

      // Verify the data was saved
      const verifyRecords = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date="${dateTimeString}" && parameter_id="${paramId}"`,
      });

      console.log('Verification - records after update:', verifyRecords.length);
      if (verifyRecords.length > 0) {
        console.log('Saved data:', JSON.stringify(verifyRecords[0].hourly_values, null, 2));
      }
    } else {
      console.log('No parameter settings found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testParameterUpdate();
