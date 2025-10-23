import { pb } from './pocketbase-simple';

// Define types for hourly values
export type HourlyValue = {
  value: string | number;
  user_name: string;
};

export type HourlyValues = Record<string, HourlyValue | string | number>;

/**
 * Validates parameter data existence before saving to prevent duplicates
 * This is especially useful for CCR Parameter Data Entry to ensure data integrity
 */
export const validateParameterData = async (
  date: string,
  parameter_id: string
): Promise<{ exists: boolean; id?: string; hourly_values?: HourlyValues }> => {
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
    // Format date for query (PocketBase stores date fields as datetime strings)
    const dateTimeString = `${date} 00:00:00.000Z`;

    // Check if record exists
    const existing = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem(`date="${dateTimeString}" && parameter_id="${parameter_id}"`, {
        requestKey: `validate_param_${parameter_id}_${date}`,
        $cancelKey: `validate_param_${parameter_id}_${date}`,
      });

    if (existing) {
      return {
        exists: true,
        id: existing.id,
        hourly_values: existing.hourly_values || {},
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
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[Dev] Error validating parameter data:', pbError.message);
      }
    }
    return { exists: false };
  }
};

/**
 * Compares two hourly_values objects to check if they're different
 * Returns true if there are differences
 */
export const hourlyValuesAreDifferent = (current: HourlyValues, updated: HourlyValues): boolean => {
  // Check if keys are different
  const currentKeys = Object.keys(current).sort();
  const updatedKeys = Object.keys(updated).sort();

  if (currentKeys.length !== updatedKeys.length) {
    return true;
  }

  for (let i = 0; i < currentKeys.length; i++) {
    if (currentKeys[i] !== updatedKeys[i]) {
      return true;
    }

    const currentHour = currentKeys[i];
    const currentValue = current[currentHour];
    const updatedValue = updated[currentHour];

    // Compare values based on structure
    if (typeof currentValue !== typeof updatedValue) {
      return true;
    }

    if (typeof currentValue === 'object' && currentValue !== null) {
      // For new structure with user tracking
      const typedCurrentValue = currentValue as HourlyValue;
      const typedUpdatedValue = updatedValue as HourlyValue;

      if (
        typedCurrentValue.value !== typedUpdatedValue.value ||
        typedCurrentValue.user_name !== typedUpdatedValue.user_name
      ) {
        return true;
      }
    } else {
      // For simple value comparison (legacy format)
      if (currentValue !== updatedValue) {
        return true;
      }
    }
  }

  return false;
};

