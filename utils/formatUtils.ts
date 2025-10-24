/**
 * Utility functions for formatting data
 */

/**
 * Format number in Indonesian format (dot for thousands, comma for decimal, max 1 decimal place)
 * @param num - The number to format
 * @returns Formatted string
 */
export const formatIndonesianNumber = (num: number): string => {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

/**
 * Format currency in Indonesian Rupiah
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatIndonesianCurrency = (amount: number): string => {
  return `Rp ${formatIndonesianNumber(amount)}`;
};
