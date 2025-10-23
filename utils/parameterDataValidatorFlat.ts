import { pb } from './pocketbase-simple';
import { CcrParameterDataFlat } from '../hooks/useCcrParameterDataFlat';

/**
 * Validates parameter data existence before saving to prevent duplicates
 * This updated version works with both legacy and flat data formats
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
    // Normalize the date format (YYYY-MM-DD) without adding time
    const normalizedDate = date.split('T')[0];

    // Check if record exists - using just date without time part
    const existing = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem(`date="${normalizedDate}" && parameter_id="${parameter_id}"`, {
        requestKey: `validate_param_flat_${parameter_id}_${normalizedDate}`,
        $cancelKey: `validate_param_flat_${parameter_id}_${normalizedDate}`,
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

      // Cast to the required type
      const flatData = recordData as unknown as CcrParameterDataFlat;

      return {
        exists: true,
        id: existing.id,
        data: flatData,
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
    // Use browser-compatible error logging that works in both dev and prod
    if (typeof window !== 'undefined') {
      // Only log in development
      // Safe check for development environment in Vite
      // @ts-ignore - This is a Vite-specific feature that TypeScript doesn't understand
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[Dev] Error validating parameter data (flat):', pbError.message);
      }
    }
    return { exists: false };
  }
};

/**
 * Compares two flat parameter data records to check if values are different
 * Returns true if there are differences in hour values
 */
/**
 * Compares an individual hour value between two records
 * Returns true if the values are different
 */
export const hourValueIsDifferent = (
  hour: number,
  current: Partial<CcrParameterDataFlat>,
  updated: Partial<CcrParameterDataFlat>
): boolean => {
  const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;

  // Use explicit type casting since we're dynamically accessing properties
  const currentValue = current[hourKey] as string | number | null | undefined;
  const updatedValue = updated[hourKey] as string | number | null | undefined;

  // Different if one has a value and the other doesn't
  if (
    (currentValue === undefined || currentValue === null) &&
    updatedValue !== undefined &&
    updatedValue !== null
  ) {
    return true;
  }

  // Different if both have values but they're not equal
  if (currentValue !== updatedValue) {
    return true;
  }

  return false;
};

/**
 * Compares two flat parameter data records to check if values are different
 * Returns true if there are differences in hour values
 */
export const flatParameterDataIsDifferent = (
  current: Partial<CcrParameterDataFlat>,
  updated: Partial<CcrParameterDataFlat>
): boolean => {
  // Check each hour field
  for (let i = 1; i <= 24; i++) {
    if (hourValueIsDifferent(i, current, updated)) {
      return true;
    }
  }

  return false;
};

/**
 * Extracts hour-specific data from a flat parameter data record
 * Useful for partial updates of specific hours
 */
export const extractHourData = (
  hour: number,
  data: Partial<CcrParameterDataFlat>
): { value: string | number | null | undefined; user?: string } => {
  const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
  const userKey = `hour${hour}_user` as keyof CcrParameterDataFlat;

  return {
    value: data[hourKey] as string | number | null | undefined,
    user: data[userKey] as string | undefined,
  };
};

/**
 * Prepares flat parameter data for saving to PocketBase
 * Removes any null or undefined values to avoid type errors
 */
export const prepareDataForSave = (
  data: Partial<CcrParameterDataFlat>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  // Include core fields
  if (data.id) result.id = data.id;
  if (data.parameter_id) result.parameter_id = data.parameter_id;
  if (data.date) result.date = data.date;
  if (data.name) result.name = data.name;

  // Include hour values and user fields if they exist
  for (let i = 1; i <= 24; i++) {
    const hourKey = `hour${i}` as keyof CcrParameterDataFlat;
    const userKey = `hour${i}_user` as keyof CcrParameterDataFlat;

    const hourValue = data[hourKey];
    if (hourValue !== undefined && hourValue !== null) {
      result[hourKey] = hourValue;
    }

    const userValue = data[userKey];
    if (userValue !== undefined) {
      result[userKey] = userValue;
    }
  }

  return result;
};

