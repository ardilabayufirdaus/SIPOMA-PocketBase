import { useCallback } from 'react';
import { CcrParameterDataWithName, useCcrParameterData } from './useCcrParameterData';
import { validateParameterData } from '../utils/parameterDataValidator';

/**
 * Enhanced CCR Parameter Data Hook with data duplication prevention
 * Extends the useCcrParameterData hook with additional safety checks
 */
export const useEnhancedCcrParameterData = () => {
  const ccrParameterDataHook = useCcrParameterData();
  const {
    getDataForDate,
    getDataForDatePaginated,
    getDataForDateRange,
    updateParameterData,
    loading,
  } = ccrParameterDataHook;

  // Enhanced parameter update with validation to prevent data duplication
  const safeUpdateParameterData = useCallback(
    async (
      date: string,
      parameter_id: string,
      hour: number, // 1-24
      value: string | number | null,
      userName: string // nama user login
    ) => {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.info('[Dev] Safe parameter update initiated for parameter:', parameter_id);
      }

      // First validate that server data matches expected data
      try {
        // Check if data already exists on the server
        const validationResult = await validateParameterData(date, parameter_id);

        // Data exists, compare before updating to prevent duplication
        if (validationResult.exists && validationResult.hourly_values) {
          const currentHourValue = validationResult.hourly_values[hour.toString()];

          // Skip update if we're setting the same value that already exists
          // This prevents unnecessary writes and potential duplication
          if (currentHourValue) {
            let currentValue;

            // Handle different data formats
            if (
              typeof currentHourValue === 'object' &&
              currentHourValue !== null &&
              'value' in currentHourValue
            ) {
              currentValue = currentHourValue.value;
            } else {
              currentValue = currentHourValue;
            }

            // If values are identical, skip the update
            if (currentValue === value) {
              if (import.meta.env?.DEV) {
                // eslint-disable-next-line no-console
                console.info('[Dev] Skipping update - value already matches server data:', {
                  parameter: parameter_id,
                  hour,
                  value,
                });
              }
              return;
            }
          }
        }

        // Proceed with the update if validation passes
        await updateParameterData(date, parameter_id, hour, value, userName);
      } catch (error) {
        // Handle errors gracefully
        if (import.meta.env?.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[Dev] Error in safeUpdateParameterData:', error);
        }
        // Re-throw for component-level error handling
        throw error;
      }
    },
    [updateParameterData]
  );

  return {
    getDataForDate,
    getDataForDatePaginated,
    getDataForDateRange,
    updateParameterData: safeUpdateParameterData, // Replace with our safer version
    loading,
  };
};

