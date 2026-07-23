import ExcelJS from 'exceljs';
import { pb } from './pocketbase-simple';
import { ParameterSetting } from '../types';
import { parseIndonesianNumber } from './formatters';

export interface MonthlyImportRow {
  date: string;
  parameter_id: string;
  parameter_name: string;
  unit: string;
  hours: Record<number, number | string | null>;
}

export interface MonthlyImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  data: MonthlyImportRow[];
}

/**
 * Generate and download monthly CCR data export to Excel
 * Format Kolom:
 * Kolom 1: Tanggal
 * Kolom 2: Jam (01-24)
 * Kolom 3 dst: Nama Parameter
 */
export async function exportMonthlyCcrData(
  year: number,
  month: number,
  selectedUnit: string
): Promise<void> {
  const monthStr = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  // 1. Fetch Parameter Settings
  let paramSettingsFilter = '';
  if (selectedUnit && selectedUnit !== 'ALL') {
    paramSettingsFilter = `unit="${selectedUnit}" || unit="ALL"`;
  }

  const parameters = await pb.collection('parameter_settings').getFullList<ParameterSetting>({
    filter: paramSettingsFilter || undefined,
    sort: 'parameter',
  });

  if (parameters.length === 0) {
    throw new Error('Tidak ada parameter yang ditemukan untuk unit yang dipilih.');
  }

  // 2. Fetch Parameter Data for the month
  const dataFilter = `date >= "${startDate}" && date <= "${endDate}"`;
  const records = await pb.collection('ccr_parameter_data').getFullList<any>({
    filter: dataFilter,
    limit: 5000,
  });

  // Map existing records by `date_parameterId`
  const recordMap = new Map<string, any>();
  records.forEach((rec) => {
    recordMap.set(`${rec.date}_${rec.parameter_id}`, rec);
  });

  // 3. Create Excel Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIPOMA';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Data CCR Bulanan', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
  });

  // Columns definition:
  // Kolom 1: Tanggal
  // Kolom 2: Jam
  // Kolom 3...N: Nama Parameter
  const columns: Partial<ExcelJS.Column>[] = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Jam', key: 'hour', width: 10 },
  ];

  parameters.forEach((param) => {
    columns.push({
      header: param.parameter,
      key: `param_${param.id}`,
      width: Math.max(param.parameter.length + 4, 18),
    });
  });

  sheet.columns = columns as ExcelJS.Column[];

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNum) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colNum <= 2 ? 'FF772953' : 'FFE95420' }, // Ubuntu Aubergine for Date/Hour, Orange for Parameters
    };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Populate Rows: 24 hours for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
    const isEvenDay = day % 2 === 0;

    for (let h = 1; h <= 24; h++) {
      const hourStr = String(h).padStart(2, '0');
      const rowValues: Record<string, any> = {
        date: dateStr,
        hour: hourStr,
      };

      parameters.forEach((param) => {
        const rec = recordMap.get(`${dateStr}_${param.id}`);
        const val = rec ? rec[`hour${h}`] : null;
        rowValues[`param_${param.id}`] = val !== null && val !== undefined && val !== '' ? val : '';
      });

      const row = sheet.addRow(rowValues);
      row.height = 20;

      // Formatting cells
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber <= 2 ? 'center' : 'right',
        };

        if (isEvenDay) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });
    }
  }

  // Generate and Download Excel File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CCR_Data_Bulanan_${selectedUnit}_${year}-${monthStr}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Download blank Monthly Template
 */
export async function downloadMonthlyTemplate(
  year: number,
  month: number,
  selectedUnit: string
): Promise<void> {
  await exportMonthlyCcrData(year, month, selectedUnit);
}

/**
 * Parse uploaded Monthly Excel file (Wide format: Tanggal | Jam | Param1 | Param2 | ...)
 */
export async function parseMonthlyCcrImport(file: File): Promise<MonthlyImportResult> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Berkas Excel tidak valid atau tidak memiliki worksheet.');
  }

  const result: MonthlyImportResult = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    data: [],
  };

  // 1. Identify columns from header row (row 1)
  const headerRow = sheet.getRow(1);
  let dateCol = -1;
  let hourCol = -1;

  // Map column index to Parameter object
  const paramColMap = new Map<number, ParameterSetting>();

  // Fetch parameter settings for matching
  const parameters = await pb.collection('parameter_settings').getFullList<ParameterSetting>();
  const paramMapByName = new Map<string, ParameterSetting>();
  const paramMapById = new Map<string, ParameterSetting>();

  parameters.forEach((p) => {
    paramMapById.set(p.id, p);
    paramMapByName.set(p.parameter.trim().toLowerCase(), p);
  });

  headerRow.eachCell((cell, colNum) => {
    const headerVal = String(cell.value || '').trim();
    const lowerVal = headerVal.toLowerCase();

    if (lowerVal === 'tanggal' || lowerVal === 'date') {
      dateCol = colNum;
    } else if (lowerVal === 'jam' || lowerVal === 'hour' || lowerVal === 'time') {
      hourCol = colNum;
    } else if (headerVal) {
      // Try match parameter by ID or Name
      let match = paramMapById.get(headerVal);
      if (!match) {
        match = paramMapByName.get(lowerVal);
      }
      if (match) {
        paramColMap.set(colNum, match);
      }
    }
  });

  if (dateCol === -1 || hourCol === -1) {
    throw new Error(
      'Format kolom Excel tidak sesuai! Kolom 1 (Tanggal) dan Kolom 2 (Jam) wajib ada.'
    );
  }

  if (paramColMap.size === 0) {
    throw new Error('Tidak ada kolom nama parameter yang cocok dengan database.');
  }

  // 2. Group parsed data by (date, parameter_id)
  // Structure: Map<"date_paramId", { date, parameter_id, parameter_name, unit, hours: Record<number, val> }>
  const groupedData = new Map<string, MonthlyImportRow>();

  const totalSheetRows = sheet.rowCount;
  for (let r = 2; r <= totalSheetRows; r++) {
    const row = sheet.getRow(r);
    const dateCellVal = row.getCell(dateCol).value;
    const hourCellVal = row.getCell(hourCol).value;

    if (!dateCellVal || hourCellVal === null || hourCellVal === undefined) continue;

    result.totalRows++;

    // Parse Date
    let dateStr = '';
    if (dateCellVal instanceof Date) {
      dateStr = dateCellVal.toISOString().split('T')[0];
    } else {
      dateStr = String(dateCellVal).trim();
    }

    // Parse Hour (1..24)
    let hourNum = 0;
    if (typeof hourCellVal === 'number') {
      hourNum = Math.floor(hourCellVal);
    } else {
      const cleanHour = String(hourCellVal).replace(/\D/g, '');
      hourNum = parseInt(cleanHour, 10);
    }

    if (isNaN(hourNum) || hourNum < 1 || hourNum > 24) {
      result.invalidRows++;
      result.errors.push(`Baris ${r}: Nilai jam "${hourCellVal}" tidak valid (harus 1-24).`);
      continue;
    }

    // Extract values for each parameter column
    paramColMap.forEach((param, colNum) => {
      const cellVal = row.getCell(colNum).value;
      let parsedVal: number | string | null = null;

      if (cellVal !== null && cellVal !== undefined && cellVal !== '') {
        if (typeof cellVal === 'number') {
          parsedVal = cellVal;
        } else {
          const parsedNum = parseIndonesianNumber(String(cellVal));
          parsedVal = isNaN(parsedNum) ? String(cellVal) : parsedNum;
        }
      }

      const key = `${dateStr}_${param.id}`;
      let entry = groupedData.get(key);
      if (!entry) {
        entry = {
          date: dateStr,
          parameter_id: param.id,
          parameter_name: param.parameter,
          unit: param.unit || 'ALL',
          hours: {},
        };
        groupedData.set(key, entry);
      }

      entry.hours[hourNum] = parsedVal;
    });

    result.validRows++;
  }

  result.data = Array.from(groupedData.values());
  return result;
}

/**
 * Save parsed monthly import entries to PocketBase database
 */
export async function saveMonthlyCcrImportToDb(
  entries: MonthlyImportRow[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const entry = entries[i];
    try {
      // Check if existing record exists for (date, parameter_id)
      const existing = await pb
        .collection('ccr_parameter_data')
        .getFirstListItem(`date="${entry.date}" && parameter_id="${entry.parameter_id}"`)
        .catch(() => null);

      const payload: Record<string, any> = {
        date: entry.date,
        parameter_id: entry.parameter_id,
      };

      for (let h = 1; h <= 24; h++) {
        if (entry.hours[h] !== undefined) {
          payload[`hour${h}`] = entry.hours[h];
        }
      }

      if (existing) {
        await pb.collection('ccr_parameter_data').update(existing.id, payload);
      } else {
        await pb.collection('ccr_parameter_data').create(payload);
      }

      success++;
    } catch (err) {
      failed++;
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { success, failed };
}
