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
 * Di development menggunakan proxy, di production menggunakan HTTPS langsung
 */
export const getPocketbaseUrl = (): string => {
  // In development, use the proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    return '/api/pb-proxy/';
  }
  // In production, use direct HTTPS
  return 'https://api.sipoma.site/';
};

// Fungsi untuk mendeteksi protokol yang berfungsi (selalu return https)
export const detectWorkingProtocol = async (): Promise<Protocol> => {
  return 'https';
};

// Singleton pattern untuk PocketBase instance
let pbInstance: PocketBase | null = null;

// Fungsi untuk mendapatkan instance PocketBase
const getPocketBaseInstance = (): PocketBase => {
  if (!pbInstance) {
    pbInstance = new PocketBase(getPocketbaseUrl());
    pbInstance.autoCancellation(false);
    logger.info('PocketBase instance diinisialisasi dengan HTTPS langsung');
  }
  return pbInstance;
};

// Export instance PocketBase
export const pb = getPocketBaseInstance();

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
  USER_ACTIONS: 'user_actions',
  USER_PARAMETER_ORDERS: 'user_parameter_orders',
  USER_PERMISSIONS: 'user_permissions',
  USER_SESSIONS: 'user_sessions',
  WORK_INSTRUCTIONS: 'work_instructions',
};
