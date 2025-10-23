const PocketBase = require('pocketbase/cjs');
const ExcelJS = require('exceljs');

async function testCCRImport() {
  try {
    // Initialize PocketBase
    const pb = new PocketBase('http://141.11.25.69:8090');

    // Authenticate
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('✅ Connected to PocketBase');

    // Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_import_data.xlsx');
    console.log('✅ Excel file loaded');

    let importCount = 0;
    const errorMessages = [];

    // Test CCR Data Import (from the template we downloaded)
    const worksheet = workbook.getWorksheet(1); // First worksheet
    if (worksheet) {
      console.log('\n📊 Testing CCR Data Import...');

      const ccrData = [];
      let headers = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          headers = [];
          row.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value || '');
          });
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          ccrData.push(rowData);
        }
      });

      console.log(`Found ${ccrData.length} CCR data rows`);

      // Process CCR data (Temperature and Pressure as parameters)
      for (const row of ccrData) {
        const date = String(row.Date);
        const hour = Number(row.Hour);
        const unit = String(row.Unit);

        // Process Temperature parameter
        if (row.Temperature !== undefined && row.Temperature !== null && row.Temperature !== '') {
          try {
            const paramName = 'Temperature';
            const value = row.Temperature;
            const userName = row.Temperature_User ? String(row.Temperature_User) : 'Test User';

            // Find parameter setting
            const paramSettings = await pb.collection('parameter_settings').getFullList({
              filter: `parameter="${paramName}" && unit="${unit}"`,
            });

            if (paramSettings.length > 0) {
              const paramSetting = paramSettings[0];

              // Check existing data
              const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
                filter: `date="${date}" && parameter_id="${paramSetting.id}"`,
              });

              if (existingRecords.length > 0) {
                // Update existing record
                const existingRecord = existingRecords[0];
                const hourField = `hour${hour}`;
                const userField = `hour${hour}_user`;

                const updateFields = {};
                updateFields[hourField] = String(value);
                updateFields[userField] = userName;
                updateFields.name = userName;

                await pb.collection('ccr_parameter_data').update(existingRecord.id, updateFields);
                console.log(`✅ Updated ${paramName} hour ${hour}: ${value} (user: ${userName})`);
              } else {
                // Create new record
                const createFields = {
                  date: date,
                  parameter_id: paramSetting.id,
                  plant_unit: unit,
                  name: userName,
                };
                createFields[`hour${hour}`] = String(value);
                createFields[`hour${hour}_user`] = userName;

                await pb.collection('ccr_parameter_data').create(createFields);
                console.log(`✅ Created ${paramName} hour ${hour}: ${value} (user: ${userName})`);
              }

              importCount++;
            } else {
              errorMessages.push(`Parameter "${paramName}" not found for unit ${unit}`);
            }
          } catch (error) {
            errorMessages.push(`Failed to save Temperature hour ${hour}: ${error.message}`);
          }
        }

        // Process Pressure parameter
        if (row.Pressure !== undefined && row.Pressure !== null && row.Pressure !== '') {
          try {
            const paramName = 'Pressure';
            const value = row.Pressure;
            const userName = row.Pressure_User ? String(row.Pressure_User) : 'Test User';

            // Find parameter setting
            const paramSettings = await pb.collection('parameter_settings').getFullList({
              filter: `parameter="${paramName}" && unit="${unit}"`,
            });

            if (paramSettings.length > 0) {
              const paramSetting = paramSettings[0];

              // Check existing data
              const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
                filter: `date="${date}" && parameter_id="${paramSetting.id}"`,
              });

              if (existingRecords.length > 0) {
                // Update existing record
                const existingRecord = existingRecords[0];
                const hourField = `hour${hour}`;
                const userField = `hour${hour}_user`;

                const updateFields = {};
                updateFields[hourField] = String(value);
                updateFields[userField] = userName;
                updateFields.name = userName;

                await pb.collection('ccr_parameter_data').update(existingRecord.id, updateFields);
                console.log(`✅ Updated ${paramName} hour ${hour}: ${value} (user: ${userName})`);
              } else {
                // Create new record
                const createFields = {
                  date: date,
                  parameter_id: paramSetting.id,
                  plant_unit: unit,
                  name: userName,
                };
                createFields[`hour${hour}`] = String(value);
                createFields[`hour${hour}_user`] = userName;

                await pb.collection('ccr_parameter_data').create(createFields);
                console.log(`✅ Created ${paramName} hour ${hour}: ${value} (user: ${userName})`);
              }

              importCount++;
            } else {
              errorMessages.push(`Parameter "${paramName}" not found for unit ${unit}`);
            }
          } catch (error) {
            errorMessages.push(`Failed to save Pressure hour ${hour}: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Import completed! ${importCount} records imported successfully.`);

    if (errorMessages.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errorMessages.forEach((msg) => console.log(`   - ${msg}`));
    }

    // Verify data in PocketBase
    console.log('\n🔍 Verifying data in PocketBase...');
    const paramRecords = await pb.collection('ccr_parameter_data').getFullList({
      filter: 'date="2025-10-20"',
    });
    console.log(`Parameter records for 2025-10-20: ${paramRecords.length}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCCRImport();
