/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Optional flag to trigger the function on the leading edge instead of the trailing edge
 * @returns A debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  // Using function keyword instead of arrow function to preserve 'this' context
  return function (...args: Parameters<T>): void {
    // Store original this context
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const later = function (): void {
      timeout = null;
      if (!immediate) func.apply(self, args);
    };

    const callNow = immediate && !timeout;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(self, args);
    }
  };
}
