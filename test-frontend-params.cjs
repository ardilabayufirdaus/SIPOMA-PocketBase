const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testParameterDataCall() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    // Simulate the parameters that would be passed from frontend
    const selectedDate = '2025-10-17'; // This should be in YYYY-MM-DD format
    const paramId = '0g09kcaj7ezuw64'; // First parameter ID
    const hour = 1;
    const finalValue = '123'; // String value
    const userName = 'Test User'; // Valid user name

    console.log('Testing updateParameterData with parameters:');
    console.log('- selectedDate:', selectedDate);
    console.log('- paramId:', paramId);
    console.log('- hour:', hour);
    console.log('- finalValue:', finalValue);
    console.log('- userName:', userName);

    // Call the updateParameterData logic directly
    const dateTimeString = `${selectedDate} 00:00:00.000Z`;
    console.log('DateTime string for query:', dateTimeString);

    // Check existing record
    const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
      filter: `date="${dateTimeString}" && parameter_id="${paramId}"`,
    });

    console.log('Existing records found:', existingRecords.length);

    let existing = null;
    if (existingRecords.length > 0) {
      existing = existingRecords[0];
      console.log('Will update existing record:', existing.id);
    } else {
      console.log('Will create new record');
    }

    // Continue with update logic
    const currentHourlyValues = existing ? existing.hourly_values || {} : {};
    const updatedHourlyValues = { ...currentHourlyValues };

    if (finalValue === '' || finalValue === null || finalValue === undefined) {
      delete updatedHourlyValues[hour.toString()];
      console.log('Removing hour', hour, 'from data');
    } else {
      updatedHourlyValues[hour.toString()] = {
        value: finalValue,
        user_name: userName,
        timestamp: new Date().toISOString(),
      };
      console.log('Updating hour', hour, 'with value:', finalValue);
    }

    // Check if all hourly_values are empty
    if (Object.keys(updatedHourlyValues).length === 0) {
      if (existing) {
        console.log('Deleting record because no hourly values left');
        await pb.collection('ccr_parameter_data').delete(existing.id);
      } else {
        console.log('No data to save');
      }
    } else {
      if (existing) {
        // Update existing record
        console.log('Updating existing record...');
        const updateResult = await pb.collection('ccr_parameter_data').update(existing.id, {
          hourly_values: updatedHourlyValues,
          name: userName,
        });
        console.log('Update successful:', updateResult.id);
      } else {
        // Create new record
        console.log('Creating new record...');
        const upsertData = {
          date: selectedDate,
          parameter_id: paramId,
          hourly_values: updatedHourlyValues,
          name: userName,
        };
        const createResult = await pb.collection('ccr_parameter_data').create(upsertData);
        console.log('Create successful:', createResult.id);
      }
    }

    // Verify final result
    const finalRecords = await pb.collection('ccr_parameter_data').getFullList({
      filter: `date="${dateTimeString}" && parameter_id="${paramId}"`,
    });

    console.log('Final records count:', finalRecords.length);
    if (finalRecords.length > 0) {
      console.log('Final data:', JSON.stringify(finalRecords[0].hourly_values, null, 2));
    }
  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testParameterDataCall();
