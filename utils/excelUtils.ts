// Lazy load ExcelJS to reduce initial bundle size
let ExcelLibrary: typeof import('exceljs') | null = null;

const getExcelJS = async () => {
  if (!ExcelLibrary) {
    const module = await import('exceljs');
    ExcelLibrary = module.default;
  }
  return ExcelLibrary;
};

/**
 * Interface untuk konfigurasi export Excel
 */
export interface ExcelExportConfig {
  filename: string;
  sheetName?: string;
  headers?: string[];
  data: Record<string, unknown>[];
  styling?: {
    headerStyle?: Record<string, unknown>;
    dataStyle?: Record<string, unknown>;
  };
}

/**
 * Interface untuk konfigurasi import Excel
 */
export interface ExcelImportConfig {
  file: File;
  sheetName?: string;
  requiredFields?: string[];
  skipRows?: number;
}

/**
 * Utility untuk export data ke Excel menggunakan exceljs dengan styling dasar
 */
export const exportToExcel = async (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  try {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length > 0) {
      // Set headers dari keys pertama
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map((header) => ({
        header,
        key: header,
        width: 15,
      }));

      // Add rows
      worksheet.addRows(data);
    }

    // Write buffer and download for browser compatibility
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
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Utility untuk export data ke Excel dengan konfigurasi lengkap
 */
export const exportToExcelAdvanced = async (config: ExcelExportConfig) => {
  try {
    const { data, filename, sheetName = 'Sheet1', headers, styling } = config;
    const ExcelJS = await getExcelJS();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Set columns dengan headers
    if (headers) {
      worksheet.columns = headers.map((header) => ({
        header,
        key: header,
        width: 15,
      }));
    } else if (data.length > 0) {
      const dataHeaders = Object.keys(data[0]);
      worksheet.columns = dataHeaders.map((header) => ({
        header,
        key: header,
        width: 15,
      }));
    }

    // Add data
    worksheet.addRows(data);

    // Apply styling jika disediakan
    if (styling) {
      // Header styling
      if (styling.headerStyle && worksheet.getRow(1)) {
        worksheet.getRow(1).eachCell((cell) => {
          cell.style = styling.headerStyle!;
        });
      }

      // Data styling
      if (styling.dataStyle) {
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            // Skip header row
            row.eachCell((cell) => {
              cell.style = styling.dataStyle!;
            });
          }
        });
      }
    }

    await workbook.xlsx.writeFile(`${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Utility untuk export multiple sheets ke Excel
 */
export const exportMultipleSheets = async (
  sheets: { name: string; data: Record<string, unknown>[]; headers?: string[] }[],
  filename: string
) => {
  try {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();

    sheets.forEach(({ name, data, headers }) => {
      const worksheet = workbook.addWorksheet(name);

      if (headers) {
        worksheet.columns = headers.map((header) => ({
          header,
          key: header,
          width: 15,
        }));
      } else if (data.length > 0) {
        const dataHeaders = Object.keys(data[0]);
        worksheet.columns = dataHeaders.map((header) => ({
          header,
          key: header,
          width: 15,
        }));
      }

      worksheet.addRows(data);
    });

    // Write buffer and download for browser compatibility
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
  } catch (error) {
    console.error('Error exporting multiple sheets:', error);
    throw new Error('Failed to export multiple sheets to Excel');
  }
};

/**
 * Utility untuk export data ke Excel dengan styling menggunakan ExcelJS
 */
export const exportToExcelStyled = async (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1',
  headers?: string[]
) => {
  try {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (headers) {
      worksheet.columns = headers.map((header) => ({
        header,
        key: header,
        width: 15,
      }));
    } else if (data.length > 0) {
      const dataHeaders = Object.keys(data[0]);
      worksheet.columns = dataHeaders.map((header) => ({
        header,
        key: header,
        width: 15,
      }));
    }

    worksheet.addRows(data);

    // Write buffer and download for browser compatibility
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
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Utility untuk import data dari Excel dengan konfigurasi
 */
export const importFromExcel = async (
  config: ExcelImportConfig
): Promise<Record<string, unknown>[]> => {
  const { file, sheetName, skipRows = 0 } = config;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const targetSheetName = sheetName || workbook.worksheets[0].name;
        const worksheet = workbook.getWorksheet(targetSheetName);

        if (!worksheet) {
          reject(new Error(`Sheet '${targetSheetName}' not found in Excel file`));
          return;
        }

        const data: Record<string, unknown>[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber <= skipRows) return; // Skip rows

          const rowData: Record<string, unknown> = {};
          row.eachCell((cell, colNumber) => {
            const header = worksheet.getCell(1, colNumber).value as string;
            if (header) {
              rowData[header] = cell.value;
            }
          });

          // Only add if row has data
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        });

        resolve(data);
      } catch (error) {
        console.error('Error importing from Excel:', error);
        reject(new Error('Failed to import data from Excel'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Utility untuk import data dari Excel (versi sederhana untuk kompatibilitas)
 */
export const importFromExcelSimple = (file: File): Promise<Record<string, unknown>[]> => {
  return importFromExcel({ file });
};

/**
 * Utility untuk validasi format Excel import
 */
export const validateExcelImport = (
  data: Record<string, unknown>[],
  requiredFields: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push('File Excel kosong atau tidak valid');
    return { isValid: false, errors };
  }

  // Check required fields
  const firstRow = data[0];
  if (!firstRow || typeof firstRow !== 'object') {
    errors.push('Format data tidak valid');
    return { isValid: false, errors };
  }

  requiredFields.forEach((field) => {
    if (!(field in firstRow)) {
      errors.push(`Field '${field}' tidak ditemukan dalam file Excel`);
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Utility untuk preview Excel file tanpa import penuh
 */
export const previewExcelFile = async (
  file: File,
  maxRows: number = 5
): Promise<{
  sheets: string[];
  preview: unknown[][];
  totalRows: number;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const firstSheet = workbook.worksheets[0];
        const preview: unknown[][] = [];
        let totalRows = 0;

        firstSheet.eachRow((row, rowNumber) => {
          totalRows = rowNumber;
          if (rowNumber <= maxRows) {
            const rowData: unknown[] = [];
            row.eachCell((cell) => {
              rowData.push(cell.value);
            });
            preview.push(rowData);
          }
        });

        resolve({
          sheets: workbook.worksheets.map((ws) => ws.name),
          preview,
          totalRows,
        });
      } catch {
        reject(new Error('Failed to preview Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Utility untuk import multiple sheets dari Excel
 */
export const importMultipleSheets = async (
  file: File
): Promise<{
  sheets: { [sheetName: string]: Record<string, unknown>[] };
  sheetNames: string[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheets: { [sheetName: string]: Record<string, unknown>[] } = {};
        const sheetNames: string[] = [];

        workbook.worksheets.forEach((worksheet) => {
          const sheetName = worksheet.name;
          sheetNames.push(sheetName);
          const data: Record<string, unknown>[] = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rowData: Record<string, unknown> = {};
            row.eachCell((cell, colNumber) => {
              const header = worksheet.getCell(1, colNumber).value as string;
              if (header) {
                rowData[header] = cell.value;
              }
            });

            if (Object.keys(rowData).length > 0) {
              data.push(rowData);
            }
          });

          sheets[sheetName] = data;
        });

        resolve({
          sheets,
          sheetNames,
        });
      } catch (error) {
        console.error('Error importing multiple sheets:', error);
        reject(new Error('Failed to import multiple sheets from Excel'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

