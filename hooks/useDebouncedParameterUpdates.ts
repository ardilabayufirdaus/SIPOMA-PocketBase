import { useCallback, useRef, useState } from 'react';

interface DebouncedUpdateOptions {
  selectedDate: string;
  updateParameterData: (
    date: string,
    parameterId: string,
    hour: number,
    value: string | null,
    userName: string
  ) => Promise<any>;
  getParameterDataForDate: (date: string) => Promise<any[]>;
  currentUserName: string;
  onSuccess?: (parameterId: string, hour: number) => void;
  onError?: (parameterId: string, error: string) => void;
}

export const useDebouncedParameterUpdates = ({
  selectedDate,
  updateParameterData,
  getParameterDataForDate,
  currentUserName,
  onSuccess,
  onError,
}: DebouncedUpdateOptions) => {
  const [savingParameterId, setSavingParameterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedUpdates = useRef<Map<string, { value: string; timer: NodeJS.Timeout }>>(new Map());

  const updateParameterDataDebounced = useCallback(
    (parameterId: string, hour: number, value: string) => {
      const updateKey = `${parameterId}-${hour}`;

      // Cancel previous debounced update for this parameter-hour
      const previousUpdate = debouncedUpdates.current.get(updateKey);
      if (previousUpdate) {
        clearTimeout(previousUpdate.timer);
      }

      // Set up debounced database update
      const timer = setTimeout(async () => {
        try {
          setSavingParameterId(parameterId);
          setError(null);

          const finalValue = value === '' ? null : value;
          await updateParameterData(selectedDate, parameterId, hour, finalValue, currentUserName);

          // Refetch data to ensure consistency
          const updatedData = await getParameterDataForDate(selectedDate);

          onSuccess?.(parameterId, hour);
        } catch (error) {
          console.error('Error updating parameter data:', error);
          const errorMessage = `Failed to save data for parameter ${parameterId}`;
          setError(errorMessage);
          onError?.(parameterId, errorMessage);

          // Revert optimistic update on error
          try {
            const revertedData = await getParameterDataForDate(selectedDate);
            // Note: The parent component should handle the revert
          } catch (revertError) {
            console.error('Error reverting data:', revertError);
          }
        } finally {
          setSavingParameterId(null);
          debouncedUpdates.current.delete(updateKey);
        }
      }, 800); // 800ms debounce delay

      // Store the timer for potential cancellation
      debouncedUpdates.current.set(updateKey, { value, timer });
    },
    [
      selectedDate,
      updateParameterData,
      getParameterDataForDate,
      currentUserName,
      onSuccess,
      onError,
    ]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    debouncedUpdates.current.forEach((update) => {
      clearTimeout(update.timer);
    });
    debouncedUpdates.current.clear();
  }, []);

  return {
    savingParameterId,
    error,
    updateParameterDataDebounced,
    cleanup,
  };
};


