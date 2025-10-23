import { UserRole, PermissionMatrix, PlantOperationsPermissions } from '../types';
import {
  getDefaultPermissionsFromDB,
  getAllDefaultPermissionsFromDB,
} from '../services/defaultPermissionsService';
import { pb } from './pocketbase-simple';

/**
 * Default permission configurations for Tonasa roles (fallback)
 * Used when database doesn't have custom default permissions
 */
export const DEFAULT_TONASA_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  'Super Admin': {
    dashboard: 'ADMIN',
    plant_operations: {}, // Will be filled with all plants
    inspection: 'ADMIN',
    project_management: 'ADMIN',
  },
  Admin: {
    dashboard: 'ADMIN',
    plant_operations: {}, // Will be filled with all plants
    inspection: 'ADMIN',
    project_management: 'ADMIN',
  },
  Manager: {
    dashboard: 'ADMIN',
    plant_operations: {}, // Will be filled with all plants
    inspection: 'WRITE',
    project_management: 'WRITE',
  },
  Operator: {
    dashboard: 'READ',
    plant_operations: {}, // Will be filled with all plants as WRITE
    inspection: 'NONE',
    project_management: 'NONE',
  },
  Outsourcing: {
    dashboard: 'READ',
    plant_operations: {}, // Will be filled with limited plants as READ
    inspection: 'READ',
    project_management: 'NONE',
  },
  Autonomous: {
    dashboard: 'READ',
    plant_operations: {}, // Will be filled with all plants as WRITE
    inspection: 'WRITE',
    project_management: 'READ',
  },
  Guest: {
    dashboard: 'NONE',
    plant_operations: {},
    inspection: 'NONE',
    project_management: 'NONE',
  },
};

/**
 * Fill plant operations permissions based on role
 */
const fillPlantOperationsForRole = async (
  permissions: PermissionMatrix,
  role: UserRole
): Promise<PermissionMatrix> => {
  try {
    // Get all plant units from database
    const plantUnitsRecords = await pb.collection('plant_units').getList(1, 100, {
      sort: 'category,unit',
    });

    const plantOperations: Record<string, Record<string, string>> = {};

    // Fill based on role
    for (const unit of plantUnitsRecords.items) {
      const category = unit.category;
      const unitName = unit.unit;

      if (!plantOperations[category]) {
        plantOperations[category] = {};
      }

      // Set permission level based on role
      switch (role) {
        case 'Super Admin':
        case 'Admin':
          plantOperations[category][unitName] = 'ADMIN';
          break;
        case 'Manager':
          plantOperations[category][unitName] = 'WRITE';
          break;
        case 'Operator':
          plantOperations[category][unitName] = 'WRITE';
          break;
        case 'Autonomous':
          plantOperations[category][unitName] = 'WRITE';
          break;
        case 'Outsourcing':
          plantOperations[category][unitName] = 'READ';
          break;
        case 'Guest':
        default:
          // No plant operations access
          break;
      }
    }

    return {
      ...permissions,
      plant_operations: plantOperations as PlantOperationsPermissions,
    };
  } catch (error) {
    console.warn('Failed to fill plant operations for role:', error);
    // Return permissions as-is if we can't fill plant operations
    return permissions;
  }
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
      // Fill plant operations if not already filled
      return await fillPlantOperationsForRole(dbPermissions, role);
    }
  } catch (error) {
    console.warn(
      `Failed to load default permissions for ${role} from database, using fallback:`,
      error
    );
  }

  // Fallback to hardcoded defaults
  const fallbackPermissions =
    DEFAULT_TONASA_PERMISSIONS[role] || DEFAULT_TONASA_PERMISSIONS['Guest'];
  return await fillPlantOperationsForRole(fallbackPermissions, role);
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
 */
export const validateTonasaPermissions = (
  role: UserRole,
  permissions: PermissionMatrix
): boolean => {
  if (!isTonasaRole(role)) return true;

  const category = getTonasaCategoryFromRole(role);

  if (!category) return false;

  // Check if plant operations permissions match expected
  const plantOps = permissions.plant_operations;

  // Should only have access to their specific category
  const hasOnlyAllowedCategory = Object.keys(plantOps).every((cat) => cat === category);

  if (!hasOnlyAllowedCategory) return false;

  // Check if units match
  const expectedUnits = getCementMillsForCategory(category);
  const actualUnits = Object.keys(plantOps[category] || {});

  const hasCorrectUnits =
    expectedUnits.every((unit) => actualUnits.includes(unit)) &&
    actualUnits.every((unit) => expectedUnits.includes(unit));

  return hasCorrectUnits;
};

