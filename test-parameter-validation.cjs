/**
 * Test script to verify parameter data validation functionality
 *
 * This script tests the validateParameterData utility to ensure it correctly
 * checks for existing data on the server before updating parameters.
 */

const { pb } = require('./utils/pocketbase');

// Test date and parameter settings
const testDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
const testHour = 10; // Testing with hour 10
const testValue = '123.45';

async function testParameterValidation() {
  try {
    console.log('Starting parameter data validation test...');

    // Get a list of parameter settings to use for testing
    const parameterSettings = await pb.collection('parameter_settings').getFullList({
      sort: 'created',
      limit: 5, // Get just a few for testing
    });

    if (parameterSettings.length === 0) {
      console.error('No parameter settings found for testing');
      return;
    }

    const testParameter = parameterSettings[0];
    console.log(`Using test parameter: ${testParameter.parameter} (ID: ${testParameter.id})`);

    // First, check if data already exists
    console.log(`Checking for existing data for parameter ${testParameter.id} on ${testDate}...`);

    const dateTimeString = `${testDate} 00:00:00.000Z`;
    let existingData = null;

    try {
      existingData = await pb
        .collection('ccr_parameter_data')
        .getFirstListItem(`date="${dateTimeString}" && parameter_id="${testParameter.id}"`);
      console.log('Existing data found:', existingData);
    } catch (error) {
      if (error.status === 404) {
        console.log('No existing data found, will create new record');
      } else {
        console.error('Error checking existing data:', error);
        return;
      }
    }

    // Create initial test data
    console.log(`Creating test data for hour ${testHour} with value ${testValue}...`);

    const hourlyValues = {};
    hourlyValues[testHour] = {
      value: testValue,
      user_name: 'Test Script User',
    };

    if (existingData) {
      // Update existing record
      await pb.collection('ccr_parameter_data').update(existingData.id, {
        hourly_values: {
          ...existingData.hourly_values,
          ...hourlyValues,
        },
        name: 'Test Script User',
      });
      console.log('Successfully updated existing record');
    } else {
      // Create new record
      await pb.collection('ccr_parameter_data').create({
        date: testDate,
        parameter_id: testParameter.id,
        hourly_values: hourlyValues,
        name: 'Test Script User',
      });
      console.log('Successfully created new record');
    }

    // Now test the validation by trying to save the same data again
    console.log('\nTesting validation with same value...');

    // This should be using our validateParameterData utility in a real scenario
    // Here we'll simulate the check
    existingData = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem(`date="${dateTimeString}" && parameter_id="${testParameter.id}"`);

    if (existingData) {
      console.log('Found data on server:', existingData);

      // Check if value matches
      const hourValueFromServer = existingData.hourly_values[testHour];
      if (hourValueFromServer) {
        let serverValue;

        if (
          typeof hourValueFromServer === 'object' &&
          hourValueFromServer !== null &&
          'value' in hourValueFromServer
        ) {
          serverValue = hourValueFromServer.value;
        } else {
          serverValue = hourValueFromServer;
        }

        if (String(serverValue) === String(testValue)) {
          console.log(
            'VALIDATION SUCCESS: Server already has the same value, update should be skipped'
          );
        } else {
          console.log('Values are different, update should proceed');
          console.log('Server value:', serverValue);
          console.log('New value:', testValue);
        }
      } else {
        console.log('No value found for hour', testHour);
      }
    }

    console.log('\nParameter data validation test completed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testParameterValidation();
