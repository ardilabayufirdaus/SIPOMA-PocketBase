const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://api.sipoma.site/');

async function createFooterData() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Authenticated');

    const targetDate = '2025-10-27';
    const plantUnit = 'Cement Mill 220';
    const plantCategory = 'Tonasa 2/3';

    // Get parameter settings for counter feeders
    const counterParams = await pb.collection('parameter_settings').getFullList({
      filter: `parameter ~ 'Counter Feeder' && category = '${plantCategory}' && unit = '${plantUnit}'`,
    });

    console.log('Found counter parameters:', counterParams.length);

    for (const param of counterParams) {
      console.log(`Processing ${param.parameter} (ID: ${param.id})`);

      // Check if footer data already exists
      const existingFooter = await pb.collection('ccr_footer_data').getFullList({
        filter: `date = '${targetDate}' && parameter_id = '${param.id}' && unit_id = '${plantUnit}'`,
      });

      if (existingFooter.length > 0) {
        console.log(`Footer data already exists for ${param.parameter}`);
        continue;
      }

      // Get parameter data for this date
      const paramData = await pb.collection('ccr_parameter_data').getFullList({
        filter: `date = '${targetDate}' && parameter_id = '${param.id}'`,
      });

      if (paramData.length === 0) {
        console.log(`No parameter data found for ${param.parameter}`);
        continue;
      }

      const record = paramData[0];
      console.log(`Found parameter data record`);

      // Calculate shift counters using the correct logic from useFooterCalculations.ts
      const shiftHours = {
        shift1: [8, 9, 10, 11, 12, 13, 14, 15],
        shift2: [16, 17, 18, 19, 20, 21, 22],
        shift3: [23, 24],
        shift3_cont: [1, 2, 3, 4, 5, 6, 7],
      };

      // Helper function to get max from hour range
      const getMaxFromHours = (hours) => {
        const values = hours
          .map((hour) => {
            const field = `hour${hour}`;
            const value = record[field];
            if (value !== null && value !== undefined && value !== '') {
              const numValue = parseFloat(String(value));
              return isNaN(numValue) ? NaN : numValue;
            }
            return NaN;
          })
          .filter((v) => !isNaN(v));
        return values.length > 0 ? Math.max(...values) : 0;
      };

      // Helper function to get value for specific hour
      const getHourValue = (hour) => {
        const field = `hour${hour}`;
        const value = record[field];
        if (value !== null && value !== undefined && value !== '') {
          const numValue = parseFloat(String(value));
          return isNaN(numValue) ? NaN : numValue;
        }
        return NaN;
      };

      // Counter Shift 3 (Cont.): Math.max dari data jam 1 sampai dengan jam 7
      const shift3_cont_counter = getMaxFromHours(shiftHours.shift3_cont);

      // Counter Shift 1: Math.max dari data jam 8 sampai dengan jam 15 dikurangi dengan nilai data jam 7
      const shift1Max = getMaxFromHours(shiftHours.shift1);
      const hour7Value = getHourValue(7);
      const shift1_counter = shift1Max - (isNaN(hour7Value) ? 0 : hour7Value);

      // Counter Shift 2: Math.max dari data jam 16 sampai dengan jam 22 dikurangi dengan nilai data jam 15
      const shift2Max = getMaxFromHours(shiftHours.shift2);
      const hour15Value = getHourValue(15);
      const shift2_counter = shift2Max - (isNaN(hour15Value) ? 0 : hour15Value);

      // Counter Shift 3: Math.max dari data jam 23 sampai dengan jam 24 dikurangi dengan nilai data jam 22
      const shift3Max = getMaxFromHours(shiftHours.shift3);
      const hour22Value = getHourValue(22);
      const shift3_counter = shift3Max - (isNaN(hour22Value) ? 0 : hour22Value);

      // Create footer data with all required fields based on existing record
      const footerData = {
        date: targetDate,
        parameter_id: param.id,
        plant_unit: plantUnit,
        // unit_id: plantUnit, // Remove unit_id field
        total: 0,
        average: 0,
        minimum: 0,
        maximum: 0,
        shift1_total: 0,
        shift2_total: 0,
        shift3_total: 0,
        shift3_cont_total: 0,
        shift1_average: 0,
        shift2_average: 0,
        shift3_average: 0,
        shift3_cont_average: 0,
        shift1_counter: Math.max(0, shift1_counter),
        shift2_counter: Math.max(0, shift2_counter),
        shift3_counter: Math.max(0, shift3_counter),
        shift3_cont_counter: Math.max(0, shift3_cont_counter),
      };

      await pb.collection('ccr_footer_data').create(footerData);
      console.log(
        `Created footer data for ${param.parameter}: shift1=${shift1_counter}, shift2=${shift2_counter}, shift3=${shift3_counter}, shift3_cont=${shift3_cont_counter}`
      );
    }

    console.log('Footer data creation completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

createFooterData();
