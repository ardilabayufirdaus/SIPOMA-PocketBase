/**
 * Translation Type Safety Utilities
 * Helper functions untuk safe access ke translation objects
 */

type TranslationValue = string | { content: string; author: string }[];

/**
 * Safely get string value dari translation object
 */
export const getTranslationString = (value: TranslationValue): string => {
  if (typeof value === 'string') {
    return value;
  }
  // Jika array (daily_quotes), return empty string atau default message
  return '';
};

/**
 * Safely get complex object dari translation
 */
export const getTranslationObject = <T>(value: TranslationValue): T | null => {
  if (typeof value === 'object' && Array.isArray(value)) {
    return value as unknown as T;
  }
  return null;
};

/**
 * Type guard untuk check apakah value adalah string
 */
export const isTranslationString = (value: TranslationValue): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard untuk check apakah value adalah complex object
 */
export const isTranslationObject = (
  value: TranslationValue
): value is { content: string; author: string }[] => {
  return typeof value === 'object' && Array.isArray(value);
};

/**
 * Safe access untuk translation dengan fallback
 */
export const safeTranslation = (
  translations: Record<string, TranslationValue>,
  key: string,
  fallback: string = ''
): string => {
  const value = translations[key];
  if (value === undefined) {
    return fallback;
  }
  return getTranslationString(value) || fallback;
};

/**
 * Wrapper untuk backward compatibility
 * Converts new translation type to old Record<string, string> format
 */
export const createLegacyTranslations = (
  translations: Record<string, TranslationValue>
): Record<string, string> => {
  const legacy: Record<string, string> = {};

  Object.entries(translations).forEach(([key, value]) => {
    legacy[key] = getTranslationString(value);
  });

  return legacy;
};
