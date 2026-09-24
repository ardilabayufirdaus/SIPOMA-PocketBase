/**
 * PocketBase utilities - Simplified version for direct HTTPS connection
 */

import PocketBase from 'pocketbase';
import { logger } from './logger';

// Type definitions
type Protocol = 'http' | 'https';

// Check if we're in Vercel deployment
export const isVercelDeployment = (): boolean => {
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    const isHttps = protocol === 'https:';
    return (hostname.includes('vercel.app') || hostname.includes('sipoma.site')) && isHttps;
  }
  return false;
};

// Check if we're accessing from HTTPS in general
export const isHttpsProtocol = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  return false;
};

// Check if we're in a secure context (HTTPS or localhost)
export const isSecureContext = (): boolean => {
  if (typeof window !== 'undefined') {
    if (typeof window.isSecureContext === 'boolean') {
      return window.isSecureContext;
    }
    return (
      window.location.protocol === 'https:' ||
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    );
  }
  return false;
};

/**
 * Fungsi untuk mendapatkan URL PocketBase
 * Menggunakan proxy di development, direct HTTPS di production
 */
export const getPocketbaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const { origin, hostname, port } = window.location;
    if (
      port === '8090' ||
      hostname === '172.18.80.101' ||
      hostname === '172.18.6.98' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      origin.includes('172.18.80.101') ||
      origin.includes('172.18.6.98')
    ) {
      return origin;
    }
  }
  const url =
    import.meta.env.VITE_POCKETBASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://172.18.80.101:8090');
  return url.replace(/\/$/, '');
};

// Fungsi untuk mendeteksi protokol yang berfungsi (selalu return https)
export const detectWorkingProtocol = async (): Promise<Protocol> => {
  return 'https';
};

// Singleton pattern untuk PocketBase instance
let pbInstance: PocketBase | null = null;

// Fungsi untuk mendapatkan instance PocketBase
export const getPocketBaseInstance = (): PocketBase => {
  if (!pbInstance) {
    pbInstance = new PocketBase(getPocketbaseUrl());
    pbInstance.autoCancellation(false);
    logger.info('PocketBase instance diinisialisasi');
  }
  return pbInstance;
};

// Export instance PocketBase via lazy Proxy
export const pb: PocketBase = new Proxy({} as PocketBase, {
  get(_target, prop, receiver) {
    const instance = getPocketBaseInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(_target, prop, value, receiver) {
    const instance = getPocketBaseInstance();
    return Reflect.set(instance, prop, value, receiver);
  },
});

// Export fungsi untuk reset koneksi jika diperlukan
export const resetConnection = (): void => {
  pbInstance = null;
  logger.info('PocketBase connection reset');
};

// Collection names yang sesuai dengan skema database PocketBase
export const Collections = {
  USERS: '_pb_users_auth_',
  AUTONOMOUS_RISK_DATA: 'autonomous_risk_data',
  CCR_DOWNTIME_DATA: 'ccr_downtime_data',
  CCR_FOOTER_DATA: 'ccr_footer_data',
  CCR_INFORMATION: 'ccr_information',
  CCR_PARAMETER_DATA: 'ccr_parameter_data',
  CCR_SILO_DATA: 'ccr_silo_data',
  CEMENT_TYPES: 'cement_types',
  COP_PARAMETERS: 'cop_parameters',
  NOTIFICATIONS: 'notifications',
  PARAMETER_ORDER_PROFILES: 'parameter_order_profiles',
  PARAMETER_SETTINGS: 'parameter_settings',
  PERMISSIONS: 'permissions',
  PIC_SETTINGS: 'pic_settings',
  PLANT_UNITS: 'plant_units',
  PROJECT_TASKS: 'project_tasks',
  PROJECTS: 'projects',
  REPORT_SETTINGS: 'report_settings',
  SILO_CAPACITIES: 'silo_capacities',
  USER_PARAMETER_ORDERS: 'user_parameter_orders',
  USER_PERMISSIONS: 'user_permissions',
  USER_MANAGEMENT: 'user_management',
  WORK_INSTRUCTIONS: 'work_instructions',

  // Derivative Plant Operations Collections
  DERIVATIVE_PLANT_UNITS: 'derivative_plant_units',
  DERIVATIVE_PARAMETER_SETTINGS: 'derivative_parameter_settings',
  DERIVATIVE_SILO_CAPACITIES: 'derivative_silo_capacities',
  DERIVATIVE_PIC_SETTINGS: 'derivative_pic_settings',
  DERIVATIVE_COP_PARAMETERS: 'derivative_cop_parameters',
  DERIVATIVE_REPORT_SETTINGS: 'derivative_report_settings',
  DERIVATIVE_COP_FOOTER_PARAMETERS: 'derivative_cop_footer_parameters',
  DERIVATIVE_CCR_PARAMETER_DATA: 'derivative_ccr_parameter_data',
  DERIVATIVE_CCR_DOWNTIME_DATA: 'derivative_ccr_downtime_data',
  DERIVATIVE_CCR_SILO_DATA: 'derivative_ccr_silo_data',
  DERIVATIVE_CCR_FOOTER_DATA: 'derivative_ccr_footer_data',
  DERIVATIVE_CCR_INFORMATION: 'derivative_ccr_information',
  DERIVATIVE_AUTONOMOUS_RISK_DATA: 'derivative_autonomous_risk_data',
};
