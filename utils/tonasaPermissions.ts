import { UserRole, PermissionMatrix } from '../types';
import { getDefaultPermissionsFromDB } from '../services/defaultPermissionsService';

/**
 * Default permission configurations for Tonasa roles (fallback)
 * Used when database doesn't have custom default permissions
 * UPDATED: Simplified model (NONE, READ, WRITE)
 */
export const DEFAULT_TONASA_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  'Super Admin': {
    dashboard: 'WRITE',
    cm_plant_operations: 'WRITE',
    rkc_plant_operations: 'WRITE',
    project_management: 'WRITE',
    database: 'WRITE',
  },
  Admin: {
    dashboard: 'WRITE',
    cm_plant_operations: 'WRITE',
    rkc_plant_operations: 'WRITE',
    project_management: 'WRITE',
    database: 'WRITE',
  },
  Manager: {
    dashboard: 'WRITE',
    cm_plant_operations: 'WRITE',
    rkc_plant_operations: 'WRITE',
    project_management: 'WRITE',
    database: 'READ',
  },
  Operator: {
    dashboard: 'READ',
    cm_plant_operations: 'WRITE',
    rkc_plant_operations: 'WRITE',
    project_management: 'NONE',
    database: 'NONE',
  },
  Outsourcing: {
    dashboard: 'READ',
    cm_plant_operations: 'READ',
    rkc_plant_operations: 'READ',
    project_management: 'NONE',
    database: 'NONE',
  },
  Autonomous: {
    dashboard: 'READ',
    cm_plant_operations: 'WRITE',
    rkc_plant_operations: 'WRITE',
    project_management: 'READ',
    database: 'NONE',
  },
  Guest: {
    dashboard: 'NONE',
    cm_plant_operations: 'NONE',
    rkc_plant_operations: 'NONE',
    project_management: 'NONE',
    database: 'NONE',
  },
};

/**
 * Get default permissions for a specific role
 * First tries to load from database, falls back to hardcoded defaults
 */
export const getDefaultPermissionsForRole = async (role: UserRole): Promise<PermissionMatrix> => {
  try {
    // Try to get from database first
    const dbPermissions = await getDefaultPermissionsFromDB(role);
    if (dbPermissions) {
      return dbPermissions;
    }
  } catch (error) {
    console.warn(
      `Failed to load default permissions for ${role} from database, using fallback:`,
      error
    );
  }

  // Fallback to hardcoded defaults
  return DEFAULT_TONASA_PERMISSIONS[role] || DEFAULT_TONASA_PERMISSIONS['Guest'];
};

/**
 * Get default permissions for a specific role (synchronous version for backward compatibility)
 * Note: This will only return hardcoded defaults, not database values
 */
export const getDefaultPermissionsForRoleSync = (role: UserRole): PermissionMatrix => {
  return DEFAULT_TONASA_PERMISSIONS[role] || DEFAULT_TONASA_PERMISSIONS['Guest'];
};

/**
 * Check if a role is a Tonasa-specific role
 * Note: With the new role structure, this always returns false
 */
export const isTonasaRole = (_role: UserRole): boolean => {
  return false; // No more Tonasa-specific roles in the new structure
};

/**
 * Get the Tonasa plant category from role name
 * Note: With the new role structure, this always returns null
 */
export const getTonasaCategoryFromRole = (_role: UserRole): string | null => {
  return null; // No more Tonasa-specific roles in the new structure
};

/**
 * Get cement mill units for a specific Tonasa category
 */
export const getCementMillsForCategory = (category: string): string[] => {
  switch (category) {
    case 'Tonasa 2/3':
      return ['220', '320'];
    case 'Tonasa 4':
      return ['419', '420'];
    case 'Tonasa 5':
      return ['552', '553'];
    default:
      return [];
  }
};

/**
 * Validate if permissions match the expected Tonasa role constraints
 * STUB: Always returns true for simplified model
 */
export const validateTonasaPermissions = (
  _role: UserRole,
  _permissions: PermissionMatrix
): boolean => {
  return true;
};
