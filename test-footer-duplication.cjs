const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFooterData() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    // Get first parameter_settings id
    const paramSettings = await pb.collection('parameter_settings').getFullList({ limit: 1 });
    if (paramSettings.length > 0) {
      const paramId = paramSettings[0].id;
      console.log('Testing with parameter_id:', paramId);

      const testDate = '2025-10-17';
      const footerData = {
        date: testDate,
        parameter_id: paramId,
        plant_unit: 'CCR',
        total: 1000,
        average: 50,
        minimum: 10,
        maximum: 100,
        shift1_total: 300,
        shift2_total: 400,
        shift3_total: 300,
        shift3_cont_total: 0,
        shift1_average: 45,
        shift2_average: 55,
        shift3_average: 50,
        shift3_cont_average: 0,
        shift1_counter: 7,
        shift2_counter: 7,
        shift3_counter: 6,
        shift3_cont_counter: 0,
      };

      console.log('Testing footer data duplication fix...');

      // Simulate the fixed saveFooterData logic
      const saveFooterData = async (footerData) => {
        const data = {
          date: footerData.date,
          parameter_id: footerData.parameter_id,
          plant_unit: footerData.plant_unit || 'CCR',
          total: footerData.total,
          average: footerData.average,
          minimum: footerData.minimum,
          maximum: footerData.maximum,
          shift1_total: footerData.shift1_total,
          shift2_total: footerData.shift2_total,
          shift3_total: footerData.shift3_total,
          shift3_cont_total: footerData.shift3_cont_total,
          shift1_average: footerData.shift1_average,
          shift2_average: footerData.shift2_average,
          shift3_average: footerData.shift3_average,
          shift3_cont_average: footerData.shift3_cont_average,
          shift1_counter: footerData.shift1_counter,
          shift2_counter: footerData.shift2_counter,
          shift3_counter: footerData.shift3_counter,
          shift3_cont_counter: footerData.shift3_cont_counter,
          updated_at: new Date().toISOString(),
        };

        // Check if record already exists (using fixed filter)
        const dateTimeString = `${footerData.date} 00:00:00.000Z`;
        const existingRecords = await pb.collection('ccr_footer_data').getFullList({
          filter: `date="${dateTimeString}" && parameter_id="${footerData.parameter_id}" && plant_unit="${footerData.plant_unit || 'CCR'}"`,
        });

        if (existingRecords.length > 0) {
          // Update existing record
          const existingId = existingRecords[0].id;
          console.log('Updating existing record:', existingId);
          const updated = await pb.collection('ccr_footer_data').update(existingId, data);
          return { ...data, id: existingId };
        } else {
          // Create new record
          console.log('Creating new record');
          const record = await pb.collection('ccr_footer_data').create(data);
          return record;
        }
      };

      console.log('First save (should create)...');
      const result1 = await saveFooterData(footerData);
      console.log('Result 1 ID:', result1.id);

      console.log('Second save (should update existing)...');
      const result2 = await saveFooterData(footerData);
      console.log('Result 2 ID:', result2.id);

      // Check if IDs are the same (no duplication)
      console.log('Same ID (no duplication):', result1.id === result2.id);

      // Check total records
      const allRecords = await pb.collection('ccr_footer_data').getFullList();
      console.log('Total footer records:', allRecords.length);

      // Clean up
      for (const record of allRecords) {
        await pb.collection('ccr_footer_data').delete(record.id);
      }
      console.log('Cleaned up all test records');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFooterData();
