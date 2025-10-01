// Test script to verify CCR parameter data saving
// Run with: node test-ccr-data-saving.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co'; // Replace with actual URL
const supabaseKey = 'your-supabase-anon-key'; // Replace with actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCcrParameterDataSaving() {
  console.log('Testing CCR parameter data saving...');

  const testDate = '2025-10-01';
  const testParameterId = 'test-param-001';
  const testHour = 10;
  const testValue = '25.5';
  const testUserName = 'Test User';

  try {
    // First, check if test record exists
    const { data: existing, error: fetchError } = await supabase
      .from('ccr_parameter_data')
      .select('*')
      .eq('date', testDate)
      .eq('parameter_id', testParameterId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing data:', fetchError);
      return;
    }

    console.log('Existing record:', existing);

    // Prepare data for upsert
    const currentHourlyValues = existing?.hourly_values || {};

    const updatedHourlyValues = {
      ...currentHourlyValues,
      [testHour]: {
        value: testValue,
        user_name: testUserName,
        timestamp: new Date().toISOString(),
      },
    };

    const upsertData = {
      date: testDate,
      parameter_id: testParameterId,
      hourly_values: updatedHourlyValues,
      name: testUserName,
    };

    console.log('Upserting data:', upsertData);

    // Perform upsert
    const { data, error } = await supabase
      .from('ccr_parameter_data')
      .upsert(upsertData, { onConflict: 'date,parameter_id' });

    if (error) {
      console.error('Error upserting data:', error);
      return;
    }

    console.log('Successfully upserted data:', data);

    // Verify the data was saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('ccr_parameter_data')
      .select('*')
      .eq('date', testDate)
      .eq('parameter_id', testParameterId)
      .single();

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return;
    }

    console.log('Verified saved data:', verifyData);
    console.log('Hourly values:', verifyData.hourly_values);

    if (verifyData.hourly_values && verifyData.hourly_values[testHour]) {
      console.log('✅ Test PASSED: Data saved correctly');
      console.log('Saved value:', verifyData.hourly_values[testHour].value);
      console.log('Saved user:', verifyData.hourly_values[testHour].user_name);
    } else {
      console.log('❌ Test FAILED: Data not saved correctly');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Uncomment to run the test
// testCcrParameterDataSaving();
