import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

/**
 * Utility untuk export data ke Excel menggunakan xlsx
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = "Sheet1"
) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("Failed to export data to Excel");
  }
};

/**
 * Utility untuk export data ke Excel dengan styling menggunakan ExcelJS
 */
export const exportToExcelStyled = async (
  data: any[],
  filename: string,
  sheetName: string = "Sheet1",
  headers?: string[]
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers if provided
    if (headers && headers.length > 0) {
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6FA" },
        };
      });
    }

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    await workbook.xlsx.writeFile(`${filename}.xlsx`);
  } catch (error) {
    console.error("Error exporting styled Excel:", error);
    throw new Error("Failed to export styled Excel file");
  }
};

/**
 * Utility untuk import data dari Excel
 */
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        console.error("Error importing from Excel:", error);
        reject(new Error("Failed to import data from Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Utility untuk validasi format Excel import
 */
export const validateExcelImport = (
  data: any[],
  requiredFields: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push("File Excel kosong atau tidak valid");
    return { isValid: false, errors };
  }

  // Check required fields
  const firstRow = data[0];
  requiredFields.forEach((field) => {
    if (!(field in firstRow)) {
      errors.push(`Field '${field}' tidak ditemukan dalam file Excel`);
    }
  });

  return { isValid: errors.length === 0, errors };
};
