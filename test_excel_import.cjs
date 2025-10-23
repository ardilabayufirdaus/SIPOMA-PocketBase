const PocketBase = require('pocketbase/cjs');
const ExcelJS = require('exceljs');

async function testImport() {
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

    // Test Footer Data Import
    const footerWorksheet = workbook.getWorksheet('Footer Data');
    if (footerWorksheet) {
      console.log('\n📋 Testing Footer Data Import...');

      const footerData = [];
      let footerHeaders = [];

      footerWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          footerHeaders = row.values.map((v) => String(v || ''));
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[footerHeaders[colNumber - 1]] = cell.value;
          });
          footerData.push(rowData);
        }
      });

      for (const row of footerData) {
        try {
          const footerFields = {
            date: String(row.Date),
            parameter_id: 'footer_' + String(row.Date), // Using a dummy parameter_id for footer
            plant_unit: String(row.Unit),
            total: 0,
            average: 0,
            minimum: 0,
            maximum: 0,
            target_production: row.Target_Production ? Number(row.Target_Production) : 0,
            next_shift_pic: row.Next_Shift_PIC ? String(row.Next_Shift_PIC) : '',
            handover_notes: row.Handover_Notes ? String(row.Handover_Notes) : '',
          };

          await pb.collection('ccr_footer_data').create(footerFields);
          console.log(`✅ Created footer data for ${row.Date}`);
          importCount++;
        } catch (error) {
          errorMessages.push(`Failed to save footer data: ${error.message}`);
        }
      }
    }

    // Test Downtime Data Import
    const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
    if (downtimeWorksheet) {
      console.log('\n⏱️  Testing Downtime Data Import...');

      const downtimeData = [];
      let downtimeHeaders = [];

      downtimeWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          downtimeHeaders = row.values.map((v) => String(v || ''));
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[downtimeHeaders[colNumber - 1]] = cell.value;
          });
          downtimeData.push(rowData);
        }
      });

      for (const row of downtimeData) {
        try {
          const downtimeFields = {
            date: String(row.Date),
            start_time: String(row.Start_Time),
            end_time: String(row.End_Time),
            unit: String(row.Unit),
            pic: String(row.PIC),
            problem: String(row.Problem),
            action: row.Action ? String(row.Action) : undefined,
            corrective_action: row.Corrective_Action ? String(row.Corrective_Action) : undefined,
            status: 'Close',
          };

          const result = await pb.collection('ccr_downtime_data').create(downtimeFields);
          console.log(`✅ Created downtime data for ${row.Date} - ${row.Problem}`);
          importCount++;
        } catch (error) {
          errorMessages.push(`Failed to save downtime data: ${error.message}`);
        }
      }
    }

    // Test Silo Data Import
    const siloWorksheet = workbook.getWorksheet('Silo Data');
    if (siloWorksheet) {
      console.log('\n🏗️  Testing Silo Data Import...');

      const siloData = [];
      let siloHeaders = [];

      siloWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          siloHeaders = row.values.map((v) => String(v || ''));
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[siloHeaders[colNumber - 1]] = cell.value;
          });
          siloData.push(rowData);
        }
      });

      for (const row of siloData) {
        try {
          const siloFields = {
            date: String(row.Date),
            silo_id: String(row.Silo_ID),
            shift1: {
              emptySpace: row.Shift1_EmptySpace ? Number(row.Shift1_EmptySpace) : undefined,
              content: row.Shift1_Content ? Number(row.Shift1_Content) : undefined,
            },
            shift2: {
              emptySpace: row.Shift2_EmptySpace ? Number(row.Shift2_EmptySpace) : undefined,
              content: row.Shift2_Content ? Number(row.Shift2_Content) : undefined,
            },
            shift3: {
              emptySpace: row.Shift3_EmptySpace ? Number(row.Shift3_EmptySpace) : undefined,
              content: row.Shift3_Content ? Number(row.Shift3_Content) : undefined,
            },
          };

          await pb.collection('ccr_silo_data').create(siloFields);
          console.log(`✅ Created silo data for ${row.Silo_ID} on ${row.Date}`);
          importCount++;
        } catch (error) {
          errorMessages.push(`Failed to save silo data: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Import completed! ${importCount} records imported successfully.`);

    if (errorMessages.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errorMessages.forEach((msg) => console.log(`   - ${msg}`));
    }

    // Verify data was saved
    console.log('\n🔍 Verifying data in PocketBase...');

    const paramRecords = await pb.collection('ccr_parameter_data').getFullList({
      filter: 'date="2025-10-20"',
      limit: 10,
    });
    console.log(`Parameter records for 2025-10-20: ${paramRecords.length}`);

    const footerRecords = await pb.collection('ccr_footer_data').getFullList({
      filter: 'date="2025-10-20"',
      limit: 10,
    });
    console.log(`Footer records for 2025-10-20: ${footerRecords.length}`);

    const downtimeRecords = await pb.collection('ccr_downtime_data').getFullList({
      filter: 'date="2025-10-20"',
      limit: 10,
    });
    console.log(`Downtime records for 2025-10-20: ${downtimeRecords.length}`);

    const siloRecords = await pb.collection('ccr_silo_data').getFullList({
      filter: 'date="2025-10-20"',
      limit: 10,
    });
    console.log(`Silo records for 2025-10-20: ${siloRecords.length}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testImport();
