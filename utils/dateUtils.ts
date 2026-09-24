/**
 * Date utility functions for use throughout the application
 */

/**
 * Formats a date/time to WITA timezone (Asia/Makassar) with 24-hour format
 * @param date The date to format (defaults to current time)
 * @param options Formatting options
 * @returns Formatted date/time string in WITA timezone
 */
export const formatToWITA = (
  date: Date = new Date(),
  options: {
    includeDate?: boolean;
    includeTime?: boolean;
    format?: 'short' | 'long' | 'iso';
  } = { includeDate: true, includeTime: true, format: 'short' }
): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const { includeDate = true, includeTime = true, format = 'short' } = options;

  const formatterOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Makassar',
    hour12: false,
  };

  if (format === 'iso') {
    // For ISO format, create manually with timezone offset
    const witaTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
    return witaTime.replace(' ', 'T') + '+08:00'; // WITA is UTC+8
  }

  if (includeDate && includeTime) {
    formatterOptions.year = 'numeric';
    formatterOptions.month = '2-digit';
    formatterOptions.day = '2-digit';
    formatterOptions.hour = '2-digit';
    formatterOptions.minute = '2-digit';
    formatterOptions.second = '2-digit';
  } else if (includeDate) {
    formatterOptions.year = 'numeric';
    formatterOptions.month = '2-digit';
    formatterOptions.day = '2-digit';
  } else if (includeTime) {
    formatterOptions.hour = '2-digit';
    formatterOptions.minute = '2-digit';
    formatterOptions.second = '2-digit';
  }

  return new Intl.DateTimeFormat('id-ID', formatterOptions).format(date);
};

/**
 * Get current time in WITA timezone
 * @returns Current time string in HH:mm:ss format
 */
export const getCurrentWITATime = (): string => {
  return formatToWITA(new Date(), { includeDate: false, includeTime: true });
};

/**
 * Get current date in WITA timezone
 * @returns Current date string in yyyy-MM-dd format
 */
export const getCurrentWITADate = (): string => {
  return formatToWITA(new Date(), { includeDate: true, includeTime: false, format: 'iso' }).split(
    'T'
  )[0];
};

/**
 * Formats a date string to ISO8601 format (YYYY-MM-DD)
 * Handles different input formats (DD/MM/YYYY, YYYY-MM-DD)
 *
 * @param dateInput Date as string in various formats
 * @returns ISO8601 formatted date string (YYYY-MM-DD)
 */
export const formatDateToISO8601 = (dateInput: string): string => {
  if (!dateInput || typeof dateInput !== 'string' || dateInput.trim() === '') {
    return '';
  }

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.substring(0, 10); // Only return the date part
  }

  // Handle DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
    const parts = dateInput.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // Try to parse with Date object as fallback
  try {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return formatDateObjectToISO8601(date);
    }
  } catch (e) {
    console.error('Error parsing date:', dateInput, e);
  }

  // Return empty string if we couldn't parse it
  return '';
};

/**
 * Formats a Date object to ISO8601 string (YYYY-MM-DD)
 *
 * @param date Date object
 * @returns ISO8601 formatted date string
 */
export const formatDateObjectToISO8601 = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Format a date according to the specified format
 * @param date The date to format
 * @param format The format string: 'yyyy-MM-dd', 'dd/MM/yyyy', etc.
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: string = 'dd/MM/yyyy'): string {
  if (!date) {
    return '';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() returns 0-11
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-MM-dd HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'dd/MM/yyyy HH:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Get an array of date strings for the past n days
 * @param days Number of past days to include
 * @param format Format for the returned date strings
 * @returns Array of date strings
 */
export function getPastDays(days: number, format: string = 'yyyy-MM-dd'): string[] {
  const dates: string[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date, format));
  }

  return dates;
}

export type DateFormatPreference = 'DD/MM/YYYY' | 'MM/DD/YYYY';

const MONTH_NAMES_MAP: Record<string, number> = {
  // Indonesian
  jan: 0,
  januari: 0,
  peb: 1,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  agu: 7,
  ags: 7,
  agust: 7,
  agustus: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  october: 9,
  nop: 10,
  nov: 10,
  nopember: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
  december: 11,
};

/**
 * Parses a date value from Excel or string input, respecting DD/MM/YYYY vs MM/DD/YYYY preference
 * and auto-resolving unambiguous dates (e.g. day > 12).
 */
export const parseExcelDateWithFormat = (
  val: any,
  preference: DateFormatPreference = 'DD/MM/YYYY'
): Date | null => {
  if (val === null || val === undefined || val === '') return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  if (typeof val === 'object' && val !== null && 'result' in val) {
    return parseExcelDateWithFormat(val.result, preference);
  }

  if (typeof val === 'number') {
    // Excel serial number (days since Dec 30, 1899)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dt = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(dt.getTime()) ? null : dt;
  }

  const strVal = String(val).trim();
  if (!strVal) return null;

  // 1. Named month formats: e.g. "15 Maret 2026", "15-Mar-2026", "March 15, 2026"
  const namedMonthMatch1 = strVal.match(/^(\d{1,2})[\s-.]([a-zA-Z]+)[\s.-](\d{2,4})$/);
  if (namedMonthMatch1) {
    const d = parseInt(namedMonthMatch1[1], 10);
    const mStr = namedMonthMatch1[2].toLowerCase();
    let y = parseInt(namedMonthMatch1[3], 10);
    if (y < 100) y += y > 50 ? 1900 : 2000;
    const m = MONTH_NAMES_MAP[mStr];
    if (m !== undefined) {
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  const namedMonthMatch2 = strVal.match(/^([a-zA-Z]+)[\s.-](\d{1,2})[,\s\-.]+(\d{2,4})$/);
  if (namedMonthMatch2) {
    const mStr = namedMonthMatch2[1].toLowerCase();
    const d = parseInt(namedMonthMatch2[2], 10);
    let y = parseInt(namedMonthMatch2[3], 10);
    if (y < 100) y += y > 50 ? 1900 : 2000;
    const m = MONTH_NAMES_MAP[mStr];
    if (m !== undefined) {
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  // 2. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = strVal.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // 3. Two-number dates with 4-digit or 2-digit year: num1 / num2 / yyyy or num1 - num2 - yyyy
  const slashMatch = strVal.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slashMatch) {
    const num1 = parseInt(slashMatch[1], 10);
    const num2 = parseInt(slashMatch[2], 10);
    let y = parseInt(slashMatch[3], 10);
    if (y < 100) y += y > 50 ? 1900 : 2000;

    let day: number;
    let month: number;

    // Unambiguous case 1: num1 > 12 (must be DD/MM)
    if (num1 > 12 && num2 <= 12) {
      day = num1;
      month = num2 - 1;
    }
    // Unambiguous case 2: num2 > 12 (must be MM/DD)
    else if (num2 > 12 && num1 <= 12) {
      month = num1 - 1;
      day = num2;
    }
    // Ambiguous case (both <= 12): adhere to preference
    else {
      if (preference === 'MM/DD/YYYY') {
        month = num1 - 1;
        day = num2;
      } else {
        // Default DD/MM/YYYY
        day = num1;
        month = num2 - 1;
      }
    }

    const dt = new Date(y, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  // 4. Fallback: native Date parse
  const dt = new Date(strVal);
  if (!isNaN(dt.getTime())) return dt;

  return null;
};

export const extractCellString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = String(val.getFullYear());
    return `${d}/${m}/${y}`;
  }
  if (typeof val === 'object') {
    if ('text' in val && val.text) return String(val.text).trim();
    if ('result' in val && val.result !== undefined) return extractCellString(val.result);
    if ('richText' in val && Array.isArray(val.richText)) {
      return val.richText
        .map((rt: any) => rt.text || '')
        .join('')
        .trim();
    }
  }
  return String(val).trim();
};

export interface ExcelColumnMapping {
  activityCol: number;
  plannedStartCol: number;
  plannedEndCol: number;
  actualStartCol: number;
  actualEndCol: number;
  progressCol: number;
}

/**
 * Intelligently maps column indices from Excel header row text
 */
export const detectExcelColumnMapping = (
  headerRow: (string | number | null)[]
): ExcelColumnMapping => {
  let activityCol = -1;
  let plannedStartCol = -1;
  let plannedEndCol = -1;
  let actualStartCol = -1;
  let actualEndCol = -1;
  let progressCol = -1;

  const headers = headerRow.map((cell) => extractCellString(cell).toLowerCase().trim());

  headers.forEach((h, idx) => {
    if (!h) return;

    // Progress (%)
    if (
      h.includes('progress') ||
      h.includes('persen') ||
      h.includes('%') ||
      h.includes('bobot') ||
      h.includes('complete')
    ) {
      if (progressCol === -1) progressCol = idx;
    }
    // Realisasi Selesai / Actual End
    else if (
      (h.includes('realisasi') &&
        (h.includes('selesai') || h.includes('akhir') || h.includes('end'))) ||
      (h.includes('actual') &&
        (h.includes('end') || h.includes('finish') || h.includes('complete')))
    ) {
      if (actualEndCol === -1) actualEndCol = idx;
    }
    // Realisasi Mulai / Actual Start
    else if (
      (h.includes('realisasi') &&
        (h.includes('mulai') || h.includes('awal') || h.includes('start'))) ||
      (h.includes('actual') && (h.includes('start') || h.includes('begin')))
    ) {
      if (actualStartCol === -1) actualStartCol = idx;
    }
    // Rencana Selesai / Planned End
    else if (
      (h.includes('rencana') &&
        (h.includes('selesai') ||
          h.includes('akhir') ||
          h.includes('end') ||
          h.includes('target'))) ||
      (h.includes('plan') && (h.includes('end') || h.includes('finish') || h.includes('target')))
    ) {
      if (plannedEndCol === -1) plannedEndCol = idx;
    }
    // Rencana Mulai / Planned Start
    else if (
      (h.includes('rencana') &&
        (h.includes('mulai') || h.includes('awal') || h.includes('start'))) ||
      (h.includes('plan') && (h.includes('start') || h.includes('begin')))
    ) {
      if (plannedStartCol === -1) plannedStartCol = idx;
    }
    // Aktivitas / Task
    else if (
      h.includes('aktivitas') ||
      h.includes('task') ||
      h.includes('kegiatan') ||
      h.includes('pekerjaan') ||
      h.includes('uraian') ||
      h.includes('nama') ||
      h.includes('item')
    ) {
      if (activityCol === -1) activityCol = idx;
    }
  });

  // Fallback if headers were not explicitly matched by name
  if (activityCol === -1) {
    const firstCell = headers[1] || headers[0] || '';
    if (firstCell.includes('no') || firstCell === '#') {
      activityCol = 2;
      plannedStartCol = plannedStartCol !== -1 ? plannedStartCol : 3;
      plannedEndCol = plannedEndCol !== -1 ? plannedEndCol : 4;
      actualStartCol = actualStartCol !== -1 ? actualStartCol : 5;
      actualEndCol = actualEndCol !== -1 ? actualEndCol : 6;
      progressCol = progressCol !== -1 ? progressCol : 7;
    } else {
      activityCol = 1;
      plannedStartCol = plannedStartCol !== -1 ? plannedStartCol : 2;
      plannedEndCol = plannedEndCol !== -1 ? plannedEndCol : 3;
      actualStartCol = actualStartCol !== -1 ? actualStartCol : 4;
      actualEndCol = actualEndCol !== -1 ? actualEndCol : 5;
      progressCol = progressCol !== -1 ? progressCol : 6;
    }
  }

  // Ensure all missing columns have sensible defaults relative to activityCol
  if (plannedStartCol === -1) plannedStartCol = activityCol + 1;
  if (plannedEndCol === -1) plannedEndCol = activityCol + 2;
  if (actualStartCol === -1) actualStartCol = activityCol + 3;
  if (actualEndCol === -1) actualEndCol = activityCol + 4;
  if (progressCol === -1) progressCol = activityCol + 5;

  return {
    activityCol,
    plannedStartCol,
    plannedEndCol,
    actualStartCol,
    actualEndCol,
    progressCol,
  };
};

/**
 * Scans an array of raw Excel rows to detect whether date columns contain unambiguous
 * evidence of DD/MM/YYYY (first number > 12) or MM/DD/YYYY (second number > 12).
 */
export const detectSheetDateFormat = (
  rawRows: (string | number | null)[][],
  dateColumnIndices: number[] = [2, 3, 4, 5]
): {
  detectedFormat: DateFormatPreference;
  confidence: 'HIGH' | 'DEFAULT';
  hasEvidence: boolean;
} => {
  let ddMmEvidenceCount = 0;
  let mmDdEvidenceCount = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;

    for (const colIdx of dateColumnIndices) {
      if (colIdx < 0 || colIdx >= row.length) continue;
      const cellVal = row[colIdx];
      const strVal = extractCellString(cellVal);
      if (strVal) {
        const match = strVal.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
        if (match) {
          const n1 = parseInt(match[1], 10);
          const n2 = parseInt(match[2], 10);
          if (n1 > 12 && n2 <= 12) {
            ddMmEvidenceCount++;
          } else if (n2 > 12 && n1 <= 12) {
            mmDdEvidenceCount++;
          }
        }
      }
    }
  }

  if (mmDdEvidenceCount > 0 && ddMmEvidenceCount === 0) {
    return {
      detectedFormat: 'MM/DD/YYYY',
      confidence: 'HIGH',
      hasEvidence: true,
    };
  }

  if (ddMmEvidenceCount > 0) {
    return {
      detectedFormat: 'DD/MM/YYYY',
      confidence: 'HIGH',
      hasEvidence: true,
    };
  }

  // Default standard Indonesian format
  return {
    detectedFormat: 'DD/MM/YYYY',
    confidence: 'DEFAULT',
    hasEvidence: false,
  };
};
