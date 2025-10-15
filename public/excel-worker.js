// Web Worker for Excel processing to avoid blocking main thread
// This worker handles Excel file parsing and data extraction

importScripts('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');

self.onmessage = async function (e) {
  const { file, type } = e.data;

  try {
    if (type === 'import') {
      const result = await processExcelImport(file);
      self.postMessage({ success: true, data: result });
    } else if (type === 'export') {
      const result = await processExcelExport(e.data.data);
      self.postMessage({ success: true, blob: result });
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

async function processExcelImport(file) {
  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const result = {
    parameterData: [],
    footerData: [],
    downtimeData: [],
  };

  // Process Parameter Data sheet
  const parameterWorksheet = workbook.getWorksheet('Parameter Data');
  if (parameterWorksheet) {
    const paramHeaders = [];
    parameterWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values);
        paramHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[paramHeaders[colNumber - 1]] = cell.value;
        });
        result.parameterData.push(rowData);
      }
    });
  }

  // Process Footer Data sheet
  const footerWorksheet = workbook.getWorksheet('Footer Data');
  if (footerWorksheet) {
    const footerHeaders = [];
    footerWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values);
        footerHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[footerHeaders[colNumber - 1]] = cell.value;
        });
        result.footerData.push(rowData);
      }
    });
  }

  // Process Downtime Data sheet
  const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
  if (downtimeWorksheet) {
    const downtimeHeaders = [];
    downtimeWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values);
        downtimeHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[downtimeHeaders[colNumber - 1]] = cell.value;
        });
        result.downtimeData.push(rowData);
      }
    });
  }

  return result;
}

async function processExcelExport(data) {
  const workbook = new ExcelJS.Workbook();

  // Parameter Data Sheet
  if (data.parameterData && data.parameterData.length > 0) {
    const parameterWorksheet = workbook.addWorksheet('Parameter Data');
    const paramRows = data.parameterData.map((item) => {
      const row = {
        Date: item.date,
        ParameterId: item.parameter_id,
        Name: item.name,
      };
      // Add hourly values
      for (let hour = 1; hour <= 24; hour++) {
        row[`Hour${hour}`] = item.hourly_values[hour] || '';
      }
      return row;
    });
    parameterWorksheet.addRows(paramRows);
  }

  // Footer Data Sheet
  if (data.footerData && data.footerData.length > 0) {
    const footerWorksheet = workbook.addWorksheet('Footer Data');
    footerWorksheet.addRows(data.footerData);
  }

  // Downtime Data Sheet
  if (data.downtimeData && data.downtimeData.length > 0) {
    const downtimeWorksheet = workbook.addWorksheet('Downtime Data');
    downtimeWorksheet.addRows(data.downtimeData);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
