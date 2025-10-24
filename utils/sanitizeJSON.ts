// Utility function to safely sanitize objects for JSON stringification
// Prevents "Converting circular structure to JSON" errors

/**
 * Sanitizes an object to prevent circular reference errors when converting to JSON
 * Removes DOM elements, functions, and handles circular references
 *
 * @param obj - Any object to be sanitized
 * @returns A sanitized version of the object safe for JSON stringification
 */
export const sanitizeForJSON = (obj: any): any => {
  if (!obj) return obj;

  try {
    const seen = new WeakSet();
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        // Skip DOM elements and functions
        if (
          (typeof window !== 'undefined' &&
            (value instanceof Element || value instanceof Node || value instanceof Event)) ||
          typeof value === 'function'
        ) {
          return '[DOM Element/Function Removed]';
        }

        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      })
    );
  } catch (e) {
    // If sanitization fails, return a simple object noting the error
    return {
      sanitization_error: true,
      error_type: e instanceof Error ? e.message : 'Unknown error',
      original_type: obj ? typeof obj : 'null',
    };
  }
};

export default sanitizeForJSON;
