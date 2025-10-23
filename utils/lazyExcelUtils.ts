/**
 * Lazy-loaded Excel utilities untuk mengurangi bundle size
 * ExcelJS akan di-load hanya ketika diperlukan
 */

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headerStyle?: Record<string, unknown>;
  dataStyle?: Record<string, unknown>;
}

// Lazy load exceljs
const getExcelJS = async () => {
  const ExcelJS = await import('exceljs');
  return ExcelJS.default;
};

/**
 * Export data ke Excel dengan lazy loading
 */
export const exportToExcel = async (
  data: Record<string, unknown>[],
  headers: string[],
  options: ExcelExportOptions = {}
) => {
  const { filename = 'export', sheetName = 'Sheet1', headerStyle = {}, dataStyle = {} } = options;

  try {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    worksheet.addRow(headers);

    // Style headers if provided
    if (Object.keys(headerStyle).length > 0) {
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });
    }

    // Add data
    data.forEach((row) => {
      const values = headers.map((header) => row[header] || '');
      worksheet.addRow(values);
    });

    // Style data if provided
    if (Object.keys(dataStyle).length > 0) {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          row.eachCell((cell) => {
            cell.style = dataStyle;
          });
        }
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw new Error(
      `Error exporting to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Export laporan dengan styling khusus
 */
export const exportReportToExcel = async (
  reportData: Record<string, unknown>[],
  reportTitle: string,
  options: ExcelExportOptions = {}
) => {
  const { filename = 'report', sheetName = 'Report' } = options;

  try {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = reportTitle;
    titleCell.style = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' },
    };

    // Add data starting from row 3
    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      worksheet.insertRow(3, headers);

      // Style headers
      const headerRow = worksheet.getRow(3);
      headerRow.eachCell((cell) => {
        cell.style = {
          font: { bold: true },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
        };
      });

      // Add data rows
      reportData.forEach((row) => {
        const values = headers.map((header) => row[header] || '');
        worksheet.addRow(values);
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw new Error(
      `Error exporting report to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Parse Excel file dengan lazy loading
 */
export const parseExcelFile = async (file: File): Promise<Record<string, unknown>[]> => {
  try {
    const ExcelJS = await getExcelJS();
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    const data: Record<string, unknown>[] = [];

    worksheet?.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          rowData[`col${colNumber}`] = cell.value;
        });
        data.push(rowData);
      }
    });

    return data;
  } catch (error) {
    throw new Error(
      `Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

