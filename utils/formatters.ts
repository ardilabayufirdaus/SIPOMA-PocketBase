// Function to format date to DD/MM/YYYY
export const formatDate = (dateInput: Date | string): string => {
  if (!dateInput || (typeof dateInput !== 'string' && !(dateInput instanceof Date))) {
    return '[Invalid Date]';
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '[Invalid Date]';
  }
  // Adjust for timezone offset to prevent day-before issues
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);

  const day = String(correctedDate.getDate()).padStart(2, '0');
  const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
  const year = correctedDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// Function to format date with day of the week for reports
export const formatDateWithDay = (dateInput: Date | string): string => {
  if (!dateInput || (typeof dateInput !== 'string' && !(dateInput instanceof Date))) {
    return '[Invalid Date]';
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '[Invalid Date]';
  }
  // Adjust for timezone offset to prevent day-before issues
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);

  const day = String(correctedDate.getDate()).padStart(2, '0');
  const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
  const year = correctedDate.getFullYear();

  // Add day of the week in Indonesian
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayOfWeek = days[correctedDate.getDay()];

  return `${dayOfWeek}, ${day}/${month}/${year}`;
};

// Function to format date for database queries (YYYY-MM-DD)
export const formatDateForDB = (dateInput: Date | string): string => {
  if (!dateInput || (typeof dateInput !== 'string' && !(dateInput instanceof Date))) {
    return '[Invalid Date]';
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '[Invalid Date]';
  }
  // Adjust for timezone offset to prevent day-before issues
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);

  const day = String(correctedDate.getDate()).padStart(2, '0');
  const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
  const year = correctedDate.getFullYear();

  return `${year}-${month}-${day}`;
};

// Function to format number with dot as thousand separator and 1 decimal place
export const formatNumber = (num: number): string => {
  if (num === null || num === undefined) {
    return '0,0';
  }

  // Format to 1 decimal place and use dot as thousand separator
  const formatted = num.toFixed(1);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

// Function to format number with Indonesian locale (dot as thousand separator, comma as decimal)
export const formatNumberIndonesian = (num: number, maxDecimals: number = 1): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0,0';
  }

  // Format to specified decimal places and use dot as thousand separator
  const formatted = num.toFixed(maxDecimals);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

// Function to format number with dot as thousand separator and configurable decimal places
export const formatNumberWithPrecision = (num: number, precision: number = 1): string => {
  if (num === null || num === undefined) {
    return precision > 0 ? '0,' + '0'.repeat(precision) : '0';
  }

  // Format to specified decimal places and use dot as thousand separator
  const formatted = num.toFixed(precision);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return precision > 0 ? parts.join(',') : parts[0];
};

// Function to format percentage with 1 decimal place
export const formatPercentage = (num: number): string => {
  if (num === null || num === undefined) {
    return '0,0';
  }
  return num.toFixed(1).replace('.', ',');
};

// Calculates duration between two HH:MM time strings
export const calculateDuration = (
  startTime: string,
  endTime: string
): { hours: number; minutes: number } => {
  if (!startTime || !endTime) return { hours: 0, minutes: 0 };

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const start = new Date(0, 0, 0, startHours, startMinutes);
  const end = new Date(0, 0, 0, endHours, endMinutes);

  // Handle overnight duration
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
};

export const formatDuration = (hours: number, minutes: number): string => {
  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  result += `${minutes}m`;
  return result.trim();
};

export const formatTimeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

// Function to format currency in Indonesian Rupiah
export const formatRupiah = (amount: number): string => {
  if (amount === null || amount === undefined) {
    return 'Rp 0';
  }

  // Format number with dot as thousand separator
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
};

// Function to format budget in millions for compact display
export const formatBudgetCompact = (amount: number): string => {
  if (amount === null || amount === undefined) {
    return 'Rp 0';
  }

  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  } else {
    return `Rp ${Math.round(amount)}`;
  }
};

/**
 * Memparse string angka format Indonesia (koma desimal, titik ribuan) menjadi number
 */
export const parseIndonesianNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  let normalized = value.trim();

  // 1. Jika ada koma, maka dipastikan format Indonesia: titik=ribuan, koma=desimal
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, ''); // Hapus semua titik ribuan
    normalized = normalized.replace(',', '.'); // Ganti koma dengan titik desimal
  } else {
    // 2. Jika tidak ada koma, namun ada titik:
    const dotCount = (normalized.match(/\./g) || []).length;

    if (dotCount > 1) {
      normalized = normalized.replace(/\./g, '');
    } else if (dotCount === 1) {
      const parts = normalized.split('.');
      if (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '') {
        normalized = normalized.replace(/\./g, '');
      }
    }
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Menentukan jumlah angka di belakang koma berdasarkan satuan atau nama parameter
 */
export const getPrecisionForParameter = (parameterName: string, unitName: string = ''): number => {
  const searchString = `${parameterName} ${unitName}`.toLowerCase();

  const highPrecision = [
    'bar',
    'psi',
    'kpa',
    'mpa',
    'm³/h',
    'kg/h',
    't/h',
    'l/h',
    'ml/h',
    'pcc',
    'opc',
    'ppc',
  ];
  const mediumPrecision = ['°c', '°f', '°k', '%', 'kg', 'ton', 'm³', 'l', 'ml', 'amp', 'kw'];
  const lowPrecision = ['unit', 'pcs', 'buah', 'batch', 'shift', 'rit'];

  if (highPrecision.some((u) => searchString.includes(u))) return 2;
  if (mediumPrecision.some((u) => searchString.includes(u))) return 1;
  if (lowPrecision.some((u) => searchString.includes(u))) return 0;

  return 1;
};

/**
 * Memformat nilai input untuk tampilan (Indonesian locale)
 */
export const formatIndonesianInput = (
  value: number | string | null | undefined,
  precision: number = 1,
  forcePrecision: boolean = true
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numValue = typeof value === 'string' ? parseIndonesianNumber(value) : value;
  if (numValue === null || isNaN(numValue)) {
    return typeof value === 'string' ? value : '';
  }

  if (!forcePrecision) {
    const parts = numValue.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let result = parts.length > 1 ? parts[0] + ',' + parts[1] : parts[0];

    if (
      typeof value === 'string' &&
      (value.endsWith(',') || value.endsWith('.')) &&
      !result.includes(',')
    ) {
      result += ',';
    }

    return result;
  }

  return formatNumberWithPrecision(numValue, precision);
};
