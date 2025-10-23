import { CcrParameterDataFlat, HourlyValueType } from '../types/ccrParameterDataTypes';

/**
 * Format validator untuk memastikan data parameter sesuai dengan format yang diharapkan
 * oleh PocketBase sebelum melakukan penyimpanan
 */
export function formatParameterDataFlat(data: Partial<CcrParameterDataFlat>): {
  isValid: boolean;
  errors?: string[];
  formattedData: Partial<CcrParameterDataFlat>;
} {
  const errors: string[] = [];
  const formattedData: Partial<CcrParameterDataFlat> = { ...data };

  // Normalize the date format
  if (typeof data.date === 'string') {
    try {
      // Handle different date formats and standardize to YYYY-MM-DD
      const dateStr = data.date;
      // If the date contains 'T', take just the date part
      if (dateStr.includes('T')) {
        formattedData.date = dateStr.split('T')[0];
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in correct format YYYY-MM-DD, do nothing
        formattedData.date = dateStr;
      } else {
        // Try to parse as a date and format
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          formattedData.date = parsedDate.toISOString().split('T')[0];
        } else {
          errors.push(`Invalid date format: ${dateStr}`);
        }
      }
    } catch (e) {
      errors.push(`Error parsing date: ${data.date}`);
    }
  } else if (!data.date) {
    errors.push('Date is required');
  }

  // Validate parameter_id
  if (!data.parameter_id) {
    errors.push('Parameter ID is required');
  }

  // Normalize hour values: convert string numbers to actual numbers or strings
  // and empty strings to null
  Array.from({ length: 24 }, (_, i) => i + 1).forEach((hour) => {
    const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
    const value = data[hourKey];

    if (value !== undefined) {
      if (value === '') {
        // Empty strings should be converted to null for PocketBase
        formattedData[hourKey] = null;
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        // Convert string numbers to actual numbers
        // Need to cast to any first to bypass TypeScript checking
        // since the HourlyValueType can be string | number | null
        (formattedData[hourKey] as any) = Number(value);
      }
      // Otherwise keep as is
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    formattedData,
  };
}
