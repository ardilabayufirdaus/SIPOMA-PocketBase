import { pb } from '../utils/pocketbase';
import { PermissionMatrix } from '../types';

// Cache untuk menyimpan hasil pengecekan hak akses sementara (TTL 5 menit)
type PermissionCacheItem = {
  matrix: PermissionMatrix;
  timestamp: number;
};

const permissionCache = new Map<string, PermissionCacheItem>();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

/**
 * Mendapatkan matriks hak akses untuk user dari server
 */
export const fetchUserPermissions = async (userId: string): Promise<PermissionMatrix> => {
  try {
    // Cek cache terlebih dahulu
    const cached = permissionCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.matrix;
    }

    // Fetch dari server
    const result = await pb.collection('user_permissions').getFullList({
      filter: `user_id = '${userId}'`,
      expand: 'permissions',
    });

    // Import buildPermissionMatrix secara dinamis
    const { buildPermissionMatrix } = await import('../utils/permissionUtils');
    const permissionMatrix = buildPermissionMatrix(result || []);

    // Simpan ke cache
    permissionCache.set(userId, {
      matrix: permissionMatrix,
      timestamp: now,
    });

    return permissionMatrix;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load user permissions from server:', error);

    // Return default empty permission matrix
    return {
      dashboard: 'NONE',
      plant_operations: {},
      inspection: 'NONE',
      project_management: 'NONE',
    };
  }
};

/**
 * Memeriksa apakah user memiliki hak akses tertentu - menggunakan server
 */
export const checkUserPermission = async (
  userId: string,
  feature: keyof PermissionMatrix,
  requiredLevel: string = 'READ'
): Promise<boolean> => {
  try {
    // Super Admin bypass - cek dari server
    const userRecord = await pb.collection('users').getOne(userId, { fields: 'id,role' });

    if (userRecord.role === 'Super Admin') {
      return true;
    }

    // Untuk user lainnya, periksa matrix hak akses
    const permissions = await fetchUserPermissions(userId);

    // Handle simple features
    if (typeof permissions[feature] === 'string') {
      return comparePermissionLevel(permissions[feature] as string, requiredLevel);
    }

    // Handle nested features like plant_operations
    if (feature === 'plant_operations' && typeof permissions[feature] === 'object') {
      const plantOps = permissions[feature];
      return Object.values(plantOps).some((category) =>
        Object.values(category).some((level) => comparePermissionLevel(level, requiredLevel))
      );
    }

    return false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking permission from server:', error);
    return false;
  }
};

/**
 * Helper untuk membandingkan level hak akses
 */
const comparePermissionLevel = (userLevel: string, requiredLevel: string): boolean => {
  const levels = ['NONE', 'READ', 'WRITE', 'ADMIN'];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);

  return userIndex >= requiredIndex && userIndex > 0; // Disallow NONE
};

/**
 * Membersihkan cache hak akses
 */
export const clearPermissionCache = (userId?: string) => {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
};
