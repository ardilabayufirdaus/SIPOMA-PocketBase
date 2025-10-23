import { pb } from '../utils/pocketbase-simple';
import { UserRole, PermissionMatrix } from '../types';

/**
 * Interface untuk default permissions record di database
 */
interface DefaultPermissionsRecord {
  id: string;
  role: UserRole;
  permissions_data: string; // JSON string of PermissionMatrix
  created: string;
  updated: string;
}

/**
 * Mendapatkan default permissions untuk role tertentu dari database
 */
export const getDefaultPermissionsFromDB = async (
  role: UserRole
): Promise<PermissionMatrix | null> => {
  try {
    const records = await pb.collection('default_permissions').getFullList({
      filter: `role = '${role}'`,
      limit: 1,
    });

    if (records.length > 0) {
      return JSON.parse(records[0].permissions_data) as PermissionMatrix;
    }

    return null;
  } catch (error) {
    console.warn('Failed to load default permissions from database:', error);
    return null;
  }
};

/**
 * Menyimpan default permissions untuk role tertentu ke database
 */
export const saveDefaultPermissionsToDB = async (
  role: UserRole,
  permissions: PermissionMatrix
): Promise<void> => {
  try {
    // Cek apakah sudah ada record untuk role ini
    const existingRecords = await pb.collection('default_permissions').getFullList({
      filter: `role = '${role}'`,
      limit: 1,
    });

    const data = {
      role,
      permissions_data: JSON.stringify(permissions),
    };

    if (existingRecords.length > 0) {
      // Update existing record
      await pb.collection('default_permissions').update(existingRecords[0].id, data);
    } else {
      // Create new record
      await pb.collection('default_permissions').create(data);
    }
  } catch (error) {
    console.error('Failed to save default permissions to database:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua default permissions dari database
 */
export const getAllDefaultPermissionsFromDB = async (): Promise<
  Record<UserRole, PermissionMatrix>
> => {
  try {
    const records = await pb.collection('default_permissions').getFullList();

    const result: Partial<Record<UserRole, PermissionMatrix>> = {};

    records.forEach((record) => {
      const defaultRecord = record as unknown as DefaultPermissionsRecord;
      result[defaultRecord.role] = JSON.parse(defaultRecord.permissions_data) as PermissionMatrix;
    });

    return result as Record<UserRole, PermissionMatrix>;
  } catch (error) {
    console.warn('Failed to load all default permissions from database:', error);
    return {} as Record<UserRole, PermissionMatrix>;
  }
};

