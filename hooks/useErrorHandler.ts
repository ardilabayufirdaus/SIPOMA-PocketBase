import { useState, useCallback } from 'react';

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleError: (error: unknown, defaultMessage?: string) => void;
  isError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (error: unknown, defaultMessage = 'An unexpected error occurred') => {
      console.error('Error handled:', error);

      if (error && typeof error === 'object' && 'message' in error) {
        setError((error as Error).message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError(defaultMessage);
      }
    },
    []
  );

  return {
    error,
    setError,
    clearError,
    handleError,
    isError: !!error,
  };
};

export default useErrorHandler;


