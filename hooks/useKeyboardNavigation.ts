import { useCallback, useRef } from 'react';

interface TableDimensions {
  rows: number;
  cols: number;
}

interface KeyboardNavigationOptions {
  getSiloTableDimensions: () => TableDimensions;
  getParameterTableDimensions: () => TableDimensions;
  focusCell: (table: 'silo' | 'parameter', row: number, col: number) => void;
}

export const useKeyboardNavigation = ({
  getSiloTableDimensions,
  getParameterTableDimensions,
  focusCell,
}: KeyboardNavigationOptions) => {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getInputRef = useCallback((table: 'silo' | 'parameter', row: number, col: number) => {
    return `${table}-${row}-${col}`;
  }, []);

  const setInputRef = useCallback((key: string, element: HTMLInputElement | null) => {
    if (element) {
      inputRefs.current.set(key, element);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      table: 'silo' | 'parameter',
      currentRow: number,
      currentCol: number
    ) => {
      const navigationKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Enter',
        'Tab',
        'Escape',
      ];

      if (!navigationKeys.includes(e.key)) {
        return;
      }

      // Handle Escape to clear focus
      if (e.key === 'Escape') {
        (e.target as HTMLInputElement).blur();
        return;
      }

      e.preventDefault();

      let newRow = currentRow;
      let newCol = currentCol;
      let newTable = table;

      const { rows: siloRows, cols: siloCols } = getSiloTableDimensions();
      const { rows: paramRows, cols: paramCols } = getParameterTableDimensions();

      // Early return if no valid tables
      if (siloRows === 0 && paramRows === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          if (table === 'silo') {
            newRow = Math.max(0, currentRow - 1);
          } else if (table === 'parameter') {
            if (currentRow > 0) {
              newRow = currentRow - 1;
            } else if (siloRows > 0) {
              // Jump to silo table
              newTable = 'silo';
              newRow = siloRows - 1;
              newCol = Math.min(currentCol, siloCols - 1);
            }
          }
          break;

        case 'ArrowDown':
        case 'Enter':
          if (table === 'silo') {
            if (currentRow < siloRows - 1) {
              newRow = currentRow + 1;
            } else if (paramRows > 0) {
              // Jump to parameter table
              newTable = 'parameter';
              newRow = 0;
              newCol = Math.min(currentCol, paramCols - 1);
            }
          } else if (table === 'parameter') {
            newRow = Math.min(paramRows - 1, currentRow + 1);
          }
          break;

        case 'ArrowLeft':
          newCol = Math.max(0, currentCol - 1);
          break;

        case 'ArrowRight':
        case 'Tab':
          if (table === 'silo') {
            if (currentCol < siloCols - 1) {
              newCol = currentCol + 1;
            } else if (currentRow < siloRows - 1) {
              newCol = 0;
              newRow = currentRow + 1;
            } else if (paramRows > 0 && paramCols > 0) {
              // Jump to parameter table
              newTable = 'parameter';
              newRow = 0;
              newCol = 0;
            }
          } else if (table === 'parameter') {
            if (currentCol < paramCols - 1) {
              newCol = currentCol + 1;
            } else if (currentRow < paramRows - 1) {
              newCol = 0;
              newRow = currentRow + 1;
            }
          }
          break;
      }

      // Validate new position and focus
      const isValidSilo = newTable === 'silo' && newRow < siloRows && newCol < siloCols;
      const isValidParam = newTable === 'parameter' && newRow < paramRows && newCol < paramCols;

      if (isValidSilo || isValidParam) {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          focusCell(newTable, newRow, newCol);
        });
      }
    },
    [focusCell, getSiloTableDimensions, getParameterTableDimensions]
  );

  return {
    setInputRef,
    handleKeyDown,
  };
};
