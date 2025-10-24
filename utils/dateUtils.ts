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
      return date.toISOString().split('T')[0];
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
export function formatDate(date: Date, format: string): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() returns 0-11
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
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
