const ExcelJS = require('exceljs');

async function debugExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('test_import_data.xlsx');

  const paramWorksheet = workbook.getWorksheet('Parameter Data');
  console.log('Headers:');
  paramWorksheet.getRow(1).eachCell((cell, colNumber) => {
    console.log('Column ' + colNumber + ': ' + cell.value);
  });

  console.log('\nFirst data row:');
  paramWorksheet.getRow(2).eachCell((cell, colNumber) => {
    console.log('Column ' + colNumber + ': ' + cell.value + ' (type: ' + typeof cell.value + ')');
  });

  console.log('\nAll data rows:');
  paramWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Skip header
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const headerCell = paramWorksheet.getRow(1).getCell(colNumber);
        rowData[headerCell.value] = cell.value;
      });
      console.log('Row ' + rowNumber + ':', rowData);
    }
  });
}

debugExcel();
