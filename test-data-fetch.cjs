const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testDataFetch() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    // Test the corrected query used in the hook (after fix)
    const isoDate = '2025-10-20'; // Date that has data
    const correctedFilter = `date="${isoDate}"`;
    console.log('Corrected filter:', correctedFilter);

    // Also test without time part
    const dateOnlyFilter = `date~"${isoDate}"`;
    console.log('Date only filter:', dateOnlyFilter);

    const data = await pb.collection('ccr_parameter_data').getFullList({
      filter: correctedFilter,
    });

    console.log('Raw data from database:', data.length, 'records');

    // Test with date-only filter
    const data2 = await pb.collection('ccr_parameter_data').getFullList({
      filter: dateOnlyFilter,
    });
    console.log(
      'Data with date-only filter:',
      data2.items ? data2.items.length : data2.length,
      'records'
    );

    if (data.length > 0) {
      console.log('First record structure:');
      const record = data[0];
      console.log('ID:', record.id);
      console.log('Parameter ID:', record.parameter_id);
      console.log('Date:', record.date);
      console.log('Hour1:', record.hour1);
      console.log('Hour1_user:', record.hour1_user);
      console.log('Hour2:', record.hour2);
      console.log('Hour2_user:', record.hour2_user);

      // Test conversion
      const hourly_values = {};
      for (let hour = 1; hour <= 24; hour++) {
        const hourField = `hour${hour}`;
        const userField = `hour${hour}_user`;
        const value = record[hourField];
        const userName = record[userField];

        if (value !== null && value !== undefined && value !== '') {
          hourly_values[hour] = {
            value: value,
            user_name: userName || 'Unknown User',
            timestamp: record.updated || record.created || new Date().toISOString(),
          };
        } else {
          hourly_values[hour] = null;
        }
      }

      console.log('Converted hourly_values (first 5 hours):');
      for (let i = 1; i <= 5; i++) {
        console.log(`Hour ${i}:`, hourly_values[i]);
      }
    } else {
      console.log('No data found for today. Let me check what dates have data...');

      // Check what dates have data
      const allData = await pb.collection('ccr_parameter_data').getFullList({ limit: 10 });
      const dates = [...new Set(allData.map((d) => d.date))];
      console.log('Available dates in database:', dates);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDataFetch();
