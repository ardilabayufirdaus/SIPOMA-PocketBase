import { pb } from './pocketbase-simple';
import { CcrParameterDataFlat } from '../hooks/useCcrParameterDataFlat';

/**
 * Validates parameter data existence before saving to prevent duplicates
 * This updated version fixes the date format issue that causes duplicates
 */
export const validateParameterDataFlat = async (
  date: string,
  parameter_id: string
): Promise<{ exists: boolean; id?: string; data?: Partial<CcrParameterDataFlat> }> => {
  if (
    !date ||
    typeof date !== 'string' ||
    date.trim() === '' ||
    date === 'undefined' ||
    date === 'null' ||
    !parameter_id ||
    typeof parameter_id !== 'string'
  ) {
    return { exists: false };
  }

  try {
    // Fix: Use just the date without appending time
    // PocketBase can find the record with just the date string (YYYY-MM-DD)
    const cleanDate = date.split('T')[0]; // Handle cases where date might include time

    // Check if record exists using just the date field
    const existing = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem(`date="${cleanDate}" && parameter_id="${parameter_id}"`, {
        requestKey: `validate_param_flat_${parameter_id}_${cleanDate}`,
        $cancelKey: `validate_param_flat_${parameter_id}_${cleanDate}`,
      });

    if (existing) {
      // Create a flexible record we can modify
      const recordData: Record<string, unknown> = {
        id: existing.id,
        parameter_id: existing.parameter_id,
        date: existing.date,
        name: existing.name,
      };

      // Map hour fields and user fields if they exist
      for (let i = 1; i <= 24; i++) {
        const hourKey = `hour${i}`;
        const userKey = `hour${i}_user`;

        if (hourKey in existing && existing[hourKey] !== null) {
          recordData[hourKey] = existing[hourKey];
        }

        if (userKey in existing) {
          recordData[userKey] = existing[userKey];
        }
      }

      // Handle legacy format with hourly_values
      if ('hourly_values' in existing && existing.hourly_values) {
        Object.entries(existing.hourly_values).forEach(([hour, value]) => {
          const hourNum = parseInt(hour);
          const hourKey = `hour${hourNum}`;
          const userKey = `hour${hourNum}_user`;

          if (typeof value === 'object' && value !== null && 'value' in value) {
            // Object with value and potentially user_name
            const typedValue = value as { value: unknown; user_name?: string };
            recordData[hourKey] = typedValue.value;

            if ('user_name' in value) {
              recordData[userKey] = typedValue.user_name;
            }
          } else {
            // Simple value
            recordData[hourKey] = value;
          }
        });
      }

      return {
        exists: true,
        id: existing.id,
        data: recordData as Partial<CcrParameterDataFlat>,
      };
    }

    return { exists: false };
  } catch (error) {
    // PocketBase ClientResponseError has a status field
    const pbError = error as { status?: number; message?: string };

    // 404 means record doesn't exist - that's normal for new entries
    if (pbError.status === 404) {
      return { exists: false };
    }

    // Any other error should be handled gracefully without blocking operation
    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Dev] Error validating parameter data:', pbError.message);
    }
    return { exists: false };
  }
};

/**
 * Checks if the value for a specific hour has changed
 */
export const hourValueIsDifferent = (
  existingData: Partial<CcrParameterDataFlat>,
  hour: number,
  newValue: string | number | null
): boolean => {
  const hourField = `hour${hour}` as keyof CcrParameterDataFlat;
  const existingValue = existingData[hourField];

  // Handle null/undefined/empty string cases
  if (
    (existingValue === null || existingValue === undefined || existingValue === '') &&
    (newValue === null || newValue === undefined || newValue === '')
  ) {
    return false;
  }

  // Convert to string for comparison (handles number vs string types)
  const existingValueStr =
    existingValue !== null && existingValue !== undefined ? String(existingValue) : '';
  const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : '';

  return existingValueStr !== newValueStr;
};

/**
 * Extract hour data from a flat record
 */
export const extractHourData = (
  data: CcrParameterDataFlat,
  hour: number
): { value: string | number | null; userName: string | null } => {
  const hourField = `hour${hour}` as keyof CcrParameterDataFlat;
  const userField = `hour${hour}_user` as keyof CcrParameterDataFlat;

  return {
    value: data[hourField] as string | number | null,
    userName: (data[userField] as string) || null,
  };
};

/**
 * Prepares data for saving by cleaning null/undefined values
 */
export const prepareDataForSave = (
  data: Partial<CcrParameterDataFlat>
): Record<string, string | number | null> => {
  const result: Record<string, string | number | null> = {};

  // Copy non-null fields to result
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value === '' ? null : value;
    }
  });

  return result;
};

