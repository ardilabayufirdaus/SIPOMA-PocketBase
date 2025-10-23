/**
 * Utilitas untuk menangani konversi data silo dengan aman
 *
 * @param obj Object yang akan dikonversi ke string
 * @returns String hasil konversi
 */
export const safeStringify = (obj: unknown): string => {
  if (obj === null || obj === undefined) {
    return '';
  }

  try {
    // Handle primitives
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'boolean') return String(obj);

    // Handle objects
    return JSON.stringify(obj);
  } catch {
    // Silent error, hanya kembalikan nilai default
    return '[Object]';
  }
};

/**
 * Mengubah objek menjadi format yang konsisten untuk data shift
 *
 * @param shiftData Data shift yang akan dinormalisasi
 * @returns Data shift yang sudah dinormalisasi
 */
export const normalizeShiftData = (
  shiftData: unknown
): { emptySpace: number | undefined; content: number | undefined } => {
  if (!shiftData) {
    return { emptySpace: undefined, content: undefined };
  }

  try {
    if (typeof shiftData === 'object' && shiftData !== null) {
      const data = shiftData as Record<string, unknown>;
      return {
        emptySpace: typeof data.emptySpace === 'number' ? data.emptySpace : undefined,
        content: typeof data.content === 'number' ? data.content : undefined,
      };
    }

    return { emptySpace: undefined, content: undefined };
  } catch {
    // Silent error
    return { emptySpace: undefined, content: undefined };
  }
};

