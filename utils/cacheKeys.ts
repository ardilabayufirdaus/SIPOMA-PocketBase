/**
 * Constants for cache keys used throughout the application
 * Centralize cache key management to prevent typos and ensure consistency
 */

export const CacheKeys = {
  // Plant Operations
  PLANT_UNITS: 'plant_units',
  PARAMETER_SETTINGS: 'parameter_settings',
  SILO_CAPACITIES: 'silo_capacities',
  REPORT_SETTINGS: 'report_settings',
  PIC_SETTINGS: 'pic_settings',

  // CCR Data
  CCR_PARAMETER_DATA: 'ccr_parameter_data',
  CCR_DOWNTIME_DATA: 'ccr_downtime_data',
  CCR_SILO_DATA: 'ccr_silo_data',
  CCR_FOOTER_DATA: 'ccr_footer_data',

  // Users and Permissions
  USERS: 'users',
  PERMISSIONS: 'permissions',

  // Dashboard Data
  DASHBOARD_STATS: 'dashboard_stats',

  // Create a prefixed key with additional identifiers
  withPrefix: (key: string, ...parts: string[]): string => {
    if (parts.length === 0) return key;
    return `${key}_${parts.join('_')}`;
  },
};

export default CacheKeys;
