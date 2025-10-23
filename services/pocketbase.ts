import PocketBase from 'pocketbase';
import { ClientResponseError } from 'pocketbase';

/**
 * File ini adalah service layer untuk PocketBase yang menyediakan konstanta koleksi,
 * tipe data interface yang sesuai dengan skema, dan fungsi helper untuk interaksi dengan PocketBase API.
 * File ini berbeda dengan utils/pocketbase.ts yang digunakan oleh implementasi yang ada
 * dan digunakan untuk backward compatibility.
 */

// Gunakan environment variable untuk URL PocketBase atau fallback ke URL default
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';

// Singleton pattern untuk mencegah multiple client instances
let pbInstance: PocketBase | null = null;

/**
 * Collection names yang sesuai dengan skema database PocketBase
 * Gunakan sebagai konstanta untuk menghindari typo pada query collection
 */
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

/**
 * Interface untuk skema User
 * Sesuai dengan struktur di collection '_pb_users_auth_'
 */
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  is_active?: boolean;
  last_active?: Date;
}

/**
 * Interface untuk Autonomous Risk Data
 */
export interface AutonomousRiskData {
  id?: string;
  date: string;
  unit: string;
  potential_disruption: string;
  preventive_action: string;
  mitigation_plan: string;
  status: string;
}

/**
 * Interface untuk CCR Downtime Data
 */
export interface CCRDowntimeData {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  pic: string;
  problem: string;
  unit: string;
  action: string;
  status: string;
  corrective_action: string;
}

/**
 * Interface untuk CCR Footer Data
 */
export interface CCRFooterData {
  id?: string;
  date: string;
  parameter_id: string;
  plant_unit: string;
  total: number;
  average: number;
  minimum: number;
  maximum: number;
  shift1_total: number;
  shift2_total: number;
  shift3_total: number;
  shift3_cont_total: number;
  shift1_average: number;
  shift2_average: number;
  shift3_average: number;
  shift3_cont_average: number;
  shift1_counter: number;
  shift2_counter: number;
  shift3_counter: number;
  shift3_cont_counter: number;
}

/**
 * Interface untuk CCR Information
 */
export interface CCRInformation {
  id?: string;
  date: Date;
  plant_unit: string;
  information: string;
}

/**
 * Type untuk nilai parameter per jam
 */
export type HourlyValue = {
  value: number | string | null;
  timestamp?: string;
  is_valid?: boolean;
  comments?: string;
};

/**
 * Interface untuk CCR Parameter Data
 */
export interface CCRParameterData {
  id?: string;
  date: string;
  parameter_id: string;
  hourly_values: Record<string, HourlyValue>;
  name: string;
  plant_unit: string;
}

/**
 * Type untuk data silo per shift
 */
export type ShiftData = {
  level?: number;
  inflow?: number;
  outflow?: number;
  timestamp?: string;
  comments?: string;
};

/**
 * Interface untuk CCR Silo Data
 */
export interface CCRSiloData {
  id?: string;
  date: string;
  silo_id: string;
  shift1: Record<string, ShiftData>;
  shift2: Record<string, ShiftData>;
  shift3: Record<string, ShiftData>;
}

/**
 * Interface untuk Cement Types
 */
export interface CementType {
  id?: string;
  cement_type: string;
}

/**
 * Interface untuk COP Parameters
 */
export interface COPParameter {
  id?: string;
  parameter_ids: string[];
  plant_category: string;
  plant_unit: string;
}

/**
 * Type untuk metadata notifikasi
 */
export type NotificationMetadata = {
  source?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  priority?: number;
  tags?: string[];
  additional_info?: Record<string, string | number | boolean>;
};

/**
 * Interface untuk Notifications
 */
export interface Notification {
  id?: string;
  user_id: string;
  message: string;
  title: string;
  severity: string;
  category: string;
  actio_url?: string;
  action_label?: string;
  metadata?: NotificationMetadata;
  read_at?: Date;
  dismissed_at?: Date;
  snoozed_until?: Date;
  expires_at?: Date;
}

/**
 * Type untuk pengurutan parameter
 */
export type ParameterOrderItem = {
  id: string;
  name: string;
  position: number;
  visible: boolean;
  category?: string;
  unit?: string;
};

/**
 * Interface untuk Parameter Order Profiles
 */
export interface ParameterOrderProfile {
  id?: string;
  name: string;
  description?: string;
  user_id: string;
  module: string;
  parameter_type: string;
  category?: string;
  unit?: string;
  parameter_order: Record<string, ParameterOrderItem>;
}

/**
 * Interface untuk Parameter Settings
 */
export interface ParameterSetting {
  id?: string;
  parameter: string;
  data_type: string;
  unit: string;
  category: string;
  min_value?: number;
  max_value?: number;
  opc_min_value?: number;
  opc_max_value?: number;
  pcc_min_value?: number;
  pcc_max_value?: number;
}

/**
 * Interface untuk Permissions
 */
export interface Permission {
  id?: string;
  module_name: string;
  permission_level: string;
  plant_units: string[];
}

/**
 * Interface untuk PIC Settings
 */
export interface PICSetting {
  id?: string;
  pic: string;
}

/**
 * Interface untuk Plant Units
 */
export interface PlantUnit {
  id?: string;
  unit: string;
  category: string;
  description?: string;
}

/**
 * Interface untuk Project Tasks
 */
export interface ProjectTask {
  id?: string;
  project_id: string;
  activity: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  planned_start?: string;
  percent_complete?: number;
}

/**
 * Interface untuk Projects
 */
export interface Project {
  id?: string;
  title: string;
  budget?: number;
  status: string;
}

/**
 * Interface untuk Report Settings
 */
export interface ReportSetting {
  id?: string;
  parameter_id: string;
  category: string;
  order: number;
}

/**
 * Interface untuk Silo Capacities
 */
export interface SiloCapacity {
  id?: string;
  plant_category: string;
  unit: string;
  silo_name: string;
  capacity: number;
  dead_stock: number;
}

/**
 * Type untuk metadata user action
 */
export type UserActionMetadata = {
  browser?: string;
  device?: string;
  os?: string;
  request_params?: Record<string, string | number | boolean>;
  response_code?: number;
  duration_ms?: number;
  affected_records?: string[];
};

/**
 * Interface untuk User Actions
 */
export interface UserAction {
  id?: string;
  user_id: string;
  action_type: string;
  module: string;
  description: string;
  ip_address?: string;
  metadata?: UserActionMetadata;
  success: boolean;
  error_message?: string;
}

/**
 * Interface untuk User Parameter Orders
 */
export interface UserParameterOrder {
  id?: string;
  user_id: string;
  module: string;
  category?: string;
  parameter_type: string;
  unit?: string;
  parameter_order: Record<string, ParameterOrderItem>;
}

/**
 * Interface untuk User Permissions
 */
export interface UserPermission {
  id?: string;
  user_id: string;
  permission_id: string[];
}

/**
 * Interface untuk User Sessions
 */
export interface UserSession {
  id?: string;
  user_id: string;
  session_start?: Date;
  session_end?: Date;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  location?: string;
  is_active?: boolean;
  last_activity?: Date;
  duration_minutes?: number;
}

/**
 * Interface untuk Work Instructions
 */
export interface WorkInstruction {
  id?: string;
  activity: string;
  doc_code: string;
  doc_title: string;
  description?: string;
  link?: string;
  plant_category: string;
  plant_unit: string;
}

// Inisialisasi dan konfigurasi PocketBase
export const pb = (() => {
  if (!pbInstance) {
    // Inisialisasi PocketBase dengan konfigurasi default
    pbInstance = new PocketBase(pocketbaseUrl);

    // Mengatur global fetch timeout dengan lebih panjang
    pbInstance.autoCancellation(false); // Matikan auto cancellation built-in

    // Delay antar request untuk menghindari terlalu banyak request sekaligus
    let lastRequestTime = 0;
    const minRequestInterval = 100; // minimal 100ms antar request

    // Sebagai alternatif untuk throttling, kita bisa membungkus PocketBase dengan throttler sederhana
    let throttlePromise = Promise.resolve();
    const throttle = <T>(fn: () => Promise<T>): Promise<T> => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < minRequestInterval) {
        const waitTime = minRequestInterval - timeSinceLastRequest;
        throttlePromise = throttlePromise.then(
          () => new Promise((resolve) => setTimeout(resolve, waitTime))
        );
      }

      return throttlePromise.then(() => {
        lastRequestTime = Date.now();
        return fn();
      });
    };

    // Intercept all HTTP requests dengan method lain yang lebih aman untuk TypeScript
    pbInstance.beforeSend = (url, options) => {
      const originalPromise = () => fetch(url, options);

      // Retry logic untuk network errors
      const retryFetch = async (retries = 3, delay = 1000): Promise<Response> => {
        try {
          return await throttle(originalPromise);
        } catch (error) {
          const isNetworkError =
            error instanceof TypeError ||
            (error instanceof Error &&
              (error.message.includes('network') || error.message.includes('ERR_NETWORK')));

          if (retries > 0 && isNetworkError) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryFetch(retries - 1, delay * 2); // Exponential backoff
          }
          throw error;
        }
      };

      return retryFetch();
    };

    // Set up automatic auth state detection di browser environment
    if (typeof window !== 'undefined') {
      pbInstance.authStore.onChange(() => {
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      });
    }
  }
  return pbInstance;
})();

/**
 * Utilitas untuk menangani error dari PocketBase
 * @param error Error dari PocketBase
 * @returns Error message yang lebih user-friendly
 */
export const handlePocketBaseError = (error: unknown): string => {
  if (error instanceof ClientResponseError) {
    if (error.status === 401) {
      return 'Anda tidak memiliki akses untuk operasi ini. Silakan login kembali.';
    } else if (error.status === 403) {
      return 'Anda tidak memiliki izin untuk operasi ini.';
    } else if (error.status === 404) {
      return 'Data yang Anda cari tidak ditemukan.';
    } else if (error.data && typeof error.data === 'object') {
      // Extract field-specific errors
      const fieldErrors = Object.entries(error.data)
        .filter(([_, value]) => !!value)
        .map(([field, value]) => `${field}: ${value}`)
        .join(', ');

      return fieldErrors || error.message;
    }
    return error.message;
  }

  return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
};

/**
 * Utilitas untuk mengecek apakah user memiliki akses ke fitur tertentu
 * @param userId ID user
 * @param moduleName Nama modul yang ingin diakses
 * @param requiredLevel Level akses minimum yang dibutuhkan
 * @param plantUnit Unit plant (opsional) jika fitur spesifik ke plant tertentu
 */
export const checkUserPermission = async (
  userId: string,
  moduleName: string,
  requiredLevel: 'read' | 'write' | 'admin',
  plantUnit?: string
): Promise<boolean> => {
  try {
    // Cek terlebih dahulu jika user adalah super admin
    const user = await pb.collection(Collections.USERS).getOne(userId);
    if (user.role === 'super_admin') {
      return true;
    }

    // Ambil semua permission user
    const userPermissions = await pb.collection(Collections.USER_PERMISSIONS).getFullList({
      filter: `user_id="${userId}"`,
      expand: 'permission_id',
    });

    // Mapping level akses ke nilai numerik
    const levelValues = {
      read: 1,
      write: 2,
      admin: 3,
    };

    // Cek setiap permission
    for (const userPerm of userPermissions) {
      const permissions = userPerm.expand?.permission_id;

      if (!permissions) continue;

      // Jika array, loop melalui setiap permission
      if (Array.isArray(permissions)) {
        for (const perm of permissions) {
          if (perm.module_name === moduleName) {
            // Cek level akses
            const permLevel = perm.permission_level.toLowerCase();
            const requiredLevelValue = levelValues[requiredLevel];
            const userLevelValue = levelValues[permLevel as keyof typeof levelValues] || 0;

            if (userLevelValue >= requiredLevelValue) {
              // Jika plantUnit tidak disediakan atau user memiliki akses ke plant tersebut
              if (!plantUnit || (perm.plant_units && perm.plant_units.includes(plantUnit))) {
                return true;
              }
            }
          }
        }
      }
      // Jika bukan array, cek permission langsung
      else if (typeof permissions === 'object') {
        const perm = permissions;
        if (perm.module_name === moduleName) {
          // Cek level akses
          const permLevel = perm.permission_level.toLowerCase();
          const requiredLevelValue = levelValues[requiredLevel];
          const userLevelValue = levelValues[permLevel as keyof typeof levelValues] || 0;

          if (userLevelValue >= requiredLevelValue) {
            // Jika plantUnit tidak disediakan atau user memiliki akses ke plant tersebut
            if (!plantUnit || (perm.plant_units && perm.plant_units.includes(plantUnit))) {
              return true;
            }
          }
        }
      }
    }

    // Jika sampai di sini, berarti tidak memiliki akses
    return false;
  } catch (error) {
    // Log error secara silent untuk mencegah peringatan eslint
    // eslint-disable-next-line no-console
    console.error('Error checking user permission:', error);
    return false;
  }
};

/**
 * Utility untuk mengecek koneksi ke PocketBase server
 * @returns Promise<boolean> true jika terhubung, false jika tidak
 */
export const checkPocketBaseConnection = async (): Promise<boolean> => {
  try {
    // Coba ping dengan request sederhana ke health check endpoint
    const response = await fetch(`${pocketbaseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // Timeout 5 detik
    });
    return response.ok;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('PocketBase connection check failed:', error);
    return false;
  }
};

/**
 * Utility untuk menunggu koneksi PocketBase tersedia
 * @param maxRetries Jumlah maksimal percobaan
 * @param delayMs Delay antar percobaan dalam ms
 * @returns Promise<boolean> true jika berhasil connect, false jika gagal
 */
export const waitForPocketBaseConnection = async (
  maxRetries = 10,
  delayMs = 2000
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkPocketBaseConnection()) {
      return true;
    }
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
};

export default pb;
