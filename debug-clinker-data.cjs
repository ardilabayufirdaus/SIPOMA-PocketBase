const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://localhost:8090');

async function debugClinkerData() {
  try {
    // Login first
    await pb.admins.authWithPassword('ardila.firdaus', 'admin@2025');
    console.log('✅ Logged in successfully');

    // Find parameter ID for "Indeks Klinker (%)"
    const parameterResult = await pb.collection('parameter_settings').getList(1, 1, {
      filter: 'parameter = "Indeks Klinker (%)"'
    });

    if (parameterResult.items.length === 0) {
      console.log('❌ Parameter "Indeks Klinker (%)" not found');
      return;
    }

    const parameterId = parameterResult.items[0].id;
    console.log(`✅ Found parameter ID: ${parameterId}`);

    // Get data from ccr_footer_data
    const footerData = await pb.collection('ccr_footer_data').getList(1, 100, {
      filter: `parameter_id = "${parameterId}"`,
      sort: 'date'
    });

    console.log(`📊 Found ${footerData.items.length} records in ccr_footer_data`);

    footerData.items.forEach((record, index) => {
      const value = typeof record.value === 'string' ? parseFloat(record.value) : record.value;
      const isValid = !isNaN(value) && value > 0;
      console.log(`${index + 1}. Date: ${record.date}, Unit: ${record.plant_unit}, Value: ${record.value} (${typeof record.value}), Parsed: ${value}, Valid: ${isValid}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugClinkerData();