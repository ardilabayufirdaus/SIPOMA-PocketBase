import * as XLSX from 'xlsx';

/**
 * Interface untuk konfigurasi export Excel
 */
export interface ExcelExportConfig {
  filename: string;
  sheetName?: string;
  headers?: string[];
  data: Record<string, unknown>[];
  styling?: {
    headerStyle?: unknown;
    dataStyle?: unknown;
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
 * Utility untuk export data ke Excel menggunakan xlsx dengan styling dasar
 */
export const exportToExcel = (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Utility untuk export data ke Excel dengan konfigurasi lengkap
 */
export const exportToExcelAdvanced = (config: ExcelExportConfig) => {
  try {
    const { data, filename, sheetName = 'Sheet1', headers, styling } = config;

    // Buat worksheet dari data
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: headers,
      skipHeader: !headers,
    });

    // Apply basic styling jika disediakan
    if (styling) {
      // Header styling
      if (styling.headerStyle && headers) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = styling.headerStyle;
        }
      }

      // Data styling
      if (styling.dataStyle) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let row = headers ? 1 : 0; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = styling.dataStyle;
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Utility untuk export multiple sheets ke Excel
 */
export const exportMultipleSheets = (
  sheets: { name: string; data: Record<string, unknown>[]; headers?: string[] }[],
  filename: string
) => {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ name, data, headers }) => {
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: headers,
        skipHeader: !headers,
      });
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting multiple sheets:', error);
    throw new Error('Failed to export multiple sheets to Excel');
  }
};

/**
 * Utility untuk export data ke Excel dengan styling menggunakan XLSX
 */
export const exportToExcelStyled = (
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Sheet1',
  headers?: string[]
) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: headers,
      skipHeader: !headers,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
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
  const { file, sheetName, requiredFields, skipRows = 0 } = config;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const targetSheetName = sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[targetSheetName];

        if (!worksheet) {
          reject(new Error(`Sheet '${targetSheetName}' not found in Excel file`));
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Return array of arrays
          defval: '', // Default value for empty cells
          blankrows: false, // Skip blank rows
        }) as any[][];

        // Skip rows jika diperlukan
        const processedData = jsonData.slice(skipRows);

        // Convert to objects jika ada header
        let result: any[];
        if (processedData.length > 0) {
          const headers = processedData[0] as string[];
          result = processedData.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        } else {
          result = [];
        }

        resolve(result);
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
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
        }) as any[][];

        resolve({
          sheets: workbook.SheetNames,
          preview: jsonData.slice(0, maxRows),
          totalRows: jsonData.length,
        });
      } catch (error) {
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
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets: { [sheetName: string]: Record<string, unknown>[] } = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
          }) as unknown[][];

          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1).map((row) => {
              const obj: Record<string, unknown> = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });
            sheets[sheetName] = rows;
          } else {
            sheets[sheetName] = [];
          }
        });

        resolve({
          sheets,
          sheetNames: workbook.SheetNames,
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
