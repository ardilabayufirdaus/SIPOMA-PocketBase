const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test');
  worksheet.addRow(['Activity', 'Start']);
  worksheet.addRow(['Data 1', 'Data 2']);
  
  const buffer = await workbook.xlsx.writeBuffer();
  
  const workbook2 = new ExcelJS.Workbook();
  await workbook2.xlsx.load(buffer);
  const worksheet2 = workbook2.worksheets[0];
  
  const headers = worksheet2.getRow(1).values;
  
  try {
     const normalized = headers.map(h => h?.toString().trim());
     console.log("normalized:", normalized);
     const res = normalized.some(h => h.toLowerCase() === 'activity');
     console.log("some res:", res);
  } catch (e) {
     console.log("Error:", e.message);
  }
}

test();
