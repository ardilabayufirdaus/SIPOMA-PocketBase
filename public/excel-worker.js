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
    siloData: [],
  };

  // Process Parameter Data sheet
  const parameterWorksheet = workbook.getWorksheet('Parameter Data');
  if (parameterWorksheet) {
    const paramHeaders = [];
    parameterWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Fix array handling with filter to avoid undefined values
        const values = Array.from(row.values).filter((v) => v !== undefined);
        paramHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (paramHeaders[colNumber - 1]) {
            rowData[paramHeaders[colNumber - 1]] = cell.value;
          }
        });

        // Only add rows with actual data
        if (Object.keys(rowData).length > 0) {
          result.parameterData.push(rowData);
        }
      }
    });
  }

  // Process Footer Data sheet
  const footerWorksheet = workbook.getWorksheet('Footer Data');
  if (footerWorksheet) {
    const footerHeaders = [];
    footerWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values).filter((v) => v !== undefined);
        footerHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (footerHeaders[colNumber - 1]) {
            rowData[footerHeaders[colNumber - 1]] = cell.value;
          }
        });

        // Only add rows with actual data
        if (Object.keys(rowData).length > 0) {
          result.footerData.push(rowData);
        }
      }
    });
  }

  // Process Downtime Data sheet
  const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
  if (downtimeWorksheet) {
    const downtimeHeaders = [];
    downtimeWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values).filter((v) => v !== undefined);
        downtimeHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (downtimeHeaders[colNumber - 1]) {
            rowData[downtimeHeaders[colNumber - 1]] = cell.value;
          }
        });

        // Only add rows with actual data
        if (Object.keys(rowData).length > 0) {
          result.downtimeData.push(rowData);
        }
      }
    });
  }

  // Process Silo Data sheet
  const siloWorksheet = workbook.getWorksheet('Silo Data');
  if (siloWorksheet) {
    const siloHeaders = [];
    siloWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const values = Array.from(row.values).filter((v) => v !== undefined);
        siloHeaders.push(...values.map((v) => String(v || '')));
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (siloHeaders[colNumber - 1]) {
            rowData[siloHeaders[colNumber - 1]] = cell.value;
          }
        });

        // Only add rows with actual data
        if (Object.keys(rowData).length > 0) {
          result.siloData.push(rowData);
        }
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

    // Extract unique parameter names
    const parameterNames = new Set();
    data.parameterData.forEach((item) => {
      if (item.name) {
        parameterNames.add(item.name);
      }
    });

    // Create headers for the format expected by handleImport
    const parameterHeaders = ['Date', 'Hour', 'Shift', 'Unit', ...Array.from(parameterNames)];
    parameterWorksheet.addRow(parameterHeaders);

    // Group data by date and unit
    const groupedData = {};
    data.parameterData.forEach((item) => {
      const key = `${item.date}-${item.unit || 'unknown'}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          date: item.date,
          unit: item.unit,
          parameters: {},
        };
      }

      // Add parameter data
      groupedData[key].parameters[item.name] = item.hourly_values;
    });

    // Add rows for each hour and each date/unit
    Object.values(groupedData).forEach((dateUnitGroup) => {
      for (let hour = 1; hour <= 24; hour++) {
        // Determine shift for this hour
        let shift = '';
        if (hour >= 1 && hour <= 7) shift = 'Shift 3 (Cont)';
        else if (hour >= 8 && hour <= 15) shift = 'Shift 1';
        else if (hour >= 16 && hour <= 22) shift = 'Shift 2';
        else shift = 'Shift 3';

        const row = [dateUnitGroup.date, hour, shift, dateUnitGroup.unit];

        // Add parameter values
        parameterNames.forEach((paramName) => {
          const paramData = dateUnitGroup.parameters[paramName];
          let value = '';

          if (paramData && paramData[hour]) {
            const hourData = paramData[hour];
            // Handle different data formats
            if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
              value = hourData.value;
            } else {
              value = hourData;
            }
          }

          row.push(value);
        });

        parameterWorksheet.addRow(row);
      }
    });
  }

  // Footer Data Sheet
  if (data.footerData && data.footerData.length > 0) {
    const footerWorksheet = workbook.addWorksheet('Footer Data');

    // Extract all unique keys for headers
    const allKeys = new Set();
    data.footerData.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    // Add header row
    const footerHeaders = Array.from(allKeys);
    footerWorksheet.addRow(footerHeaders);

    // Add data rows
    data.footerData.forEach((item) => {
      const rowData = [];
      footerHeaders.forEach((header) => {
        rowData.push(item[header] || '');
      });
      footerWorksheet.addRow(rowData);
    });
  }

  // Downtime Data Sheet
  if (data.downtimeData && data.downtimeData.length > 0) {
    const downtimeWorksheet = workbook.addWorksheet('Downtime Data');

    // Use standard headers expected by import function
    const downtimeHeaders = [
      'Date',
      'Start_Time',
      'End_Time',
      'Unit',
      'PIC',
      'Problem',
      'Action',
      'Corrective_Action',
      'Status',
    ];
    downtimeWorksheet.addRow(downtimeHeaders);

    // Add data rows
    data.downtimeData.forEach((item) => {
      downtimeWorksheet.addRow([
        item.date || '',
        item.start_time || '',
        item.end_time || '',
        item.unit || '',
        item.pic || '',
        item.problem || '',
        item.action || '',
        item.corrective_action || '',
        item.status || 'Open',
      ]);
    });
  }

  // Silo Data Sheet
  if (data.siloData && data.siloData.length > 0) {
    const siloWorksheet = workbook.addWorksheet('Silo Data');

    // Use standard headers expected by import function
    const siloHeaders = [
      'Date',
      'Silo_ID',
      'Shift1_EmptySpace',
      'Shift1_Content',
      'Shift2_EmptySpace',
      'Shift2_Content',
      'Shift3_EmptySpace',
      'Shift3_Content',
    ];
    siloWorksheet.addRow(siloHeaders);

    // Add data rows
    data.siloData.forEach((item) => {
      siloWorksheet.addRow([
        item.date || '',
        item.silo_id || '',
        item.shift1?.emptySpace || '',
        item.shift1?.content || '',
        item.shift2?.emptySpace || '',
        item.shift2?.content || '',
        item.shift3?.emptySpace || '',
        item.shift3?.content || '',
      ]);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
