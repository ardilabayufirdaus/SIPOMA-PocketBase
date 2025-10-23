const ExcelJS = require('exceljs');

async function testImportLogic() {
  console.log('Testing Excel Import Logic...');

  try {
    // Read the test file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_import_data.xlsx');

    let importCount = 0;
    const errorMessages = [];

    // Test Parameter Data Import
    const paramWorksheet = workbook.getWorksheet('Parameter Data');
    if (paramWorksheet) {
      console.log('\n=== Testing Parameter Data Import ===');

      const paramData = [];
      let paramHeaders = [];

      paramWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          paramHeaders = row.values.map((v) => String(v || ''));
          console.log('Headers:', paramHeaders);
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[paramHeaders[colNumber - 1]] = cell.value;
          });
          paramData.push(rowData);
        }
      });

      console.log('Found', paramData.length, 'parameter data rows');

      // Test parsing logic
      const requiredFields = ['Date', 'Hour', 'Unit'];
      const invalidRows = paramData.filter((row, index) => {
        const missingFields = requiredFields.filter((field) => !row[field]);
        if (missingFields.length > 0) {
          errorMessages.push(
            `Parameter Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
          );
          return true;
        }
        return false;
      });

      if (invalidRows.length === 0) {
        // Test parameter processing
        const allColumns = Object.keys(paramData[0]).filter(
          (key) => !['Date', 'Hour', 'Unit', 'Shift'].includes(key)
        );
        const parameterColumns = allColumns.filter((key) => !key.endsWith('_User'));

        console.log('Parameter columns found:', parameterColumns);

        // Count data entries
        let dataEntries = 0;
        for (const row of paramData) {
          const hour = Number(row.Hour);

          for (const paramName of parameterColumns) {
            const value = row[paramName];

            if (value !== undefined && value !== null && value !== '') {
              dataEntries++;
            }
          }
        }

        console.log('Data entries found:', dataEntries);
        importCount += dataEntries;
      }
    }

    // Test Footer Data Import
    const footerWorksheet = workbook.getWorksheet('Footer Data');
    if (footerWorksheet) {
      console.log('\n=== Testing Footer Data Import ===');

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

      console.log('Found', footerData.length, 'footer data rows');
      importCount += footerData.length;
    }

    // Test Downtime Data Import
    const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
    if (downtimeWorksheet) {
      console.log('\n=== Testing Downtime Data Import ===');

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

      console.log('Found', downtimeData.length, 'downtime data rows');
      importCount += downtimeData.length;
    }

    // Test Silo Data Import
    const siloWorksheet = workbook.getWorksheet('Silo Data');
    if (siloWorksheet) {
      console.log('\n=== Testing Silo Data Import ===');

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

      console.log('Found', siloData.length, 'silo data rows');
      importCount += siloData.length;
    }

    console.log('\n=== Import Test Summary ===');
    console.log('Total records that would be imported:', importCount);
    console.log('Errors found:', errorMessages.length);

    if (errorMessages.length > 0) {
      console.log('Error messages:');
      errorMessages.forEach((msg) => console.log('  -', msg));
    }

    console.log('\n✅ Import logic test completed successfully!');
  } catch (error) {
    console.error('❌ Import test failed:', error.message);
  }
}

testImportLogic();
