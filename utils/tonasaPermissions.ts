import { UserRole, PermissionMatrix } from '../types';

/**
 * Default permission configurations for Tonasa roles
 * Based on user requirements for plant-specific access
 */
export const DEFAULT_TONASA_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  'Super Admin': {
    dashboard: 'ADMIN',
    plant_operations: {}, // Will be filled with all plants
    packing_plant: 'ADMIN',
    project_management: 'ADMIN',
    system_settings: 'ADMIN',
    user_management: 'ADMIN',
  },
  Admin: {
    dashboard: 'ADMIN',
    plant_operations: {}, // Will be filled with all plants
    packing_plant: 'ADMIN',
    project_management: 'ADMIN',
    system_settings: 'READ',
    user_management: 'READ',
  },
  'Admin Tonasa 2/3': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 2/3': {
        '220': 'ADMIN', // Cement Mill 220
        '320': 'ADMIN', // Cement Mill 320
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  'Admin Tonasa 4': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 4': {
        '419': 'ADMIN', // Cement Mill 419
        '420': 'ADMIN', // Cement Mill 420
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  'Admin Tonasa 5': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 5': {
        '552': 'ADMIN', // Cement Mill 552
        '553': 'ADMIN', // Cement Mill 553
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  Operator: {
    dashboard: 'READ',
    plant_operations: {}, // Will be filled with all plants as WRITE
    packing_plant: 'READ',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  'Operator Tonasa 2/3': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 2/3': {
        '220': 'WRITE', // Cement Mill 220
        '320': 'WRITE', // Cement Mill 320
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  'Operator Tonasa 4': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 4': {
        '419': 'WRITE', // Cement Mill 419
        '420': 'WRITE', // Cement Mill 420
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  'Operator Tonasa 5': {
    dashboard: 'READ',
    plant_operations: {
      'Tonasa 5': {
        '552': 'WRITE', // Cement Mill 552
        '553': 'WRITE', // Cement Mill 553
      },
    },
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
  Guest: {
    dashboard: 'NONE',
    plant_operations: {},
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  },
};

/**
 * Get default permissions for a specific role
 */
export const getDefaultPermissionsForRole = (role: UserRole): PermissionMatrix => {
  return DEFAULT_TONASA_PERMISSIONS[role] || DEFAULT_TONASA_PERMISSIONS['Guest'];
};

/**
 * Check if a role is a Tonasa-specific role
 */
export const isTonasaRole = (role: UserRole): boolean => {
  return role.includes('Tonasa');
};

/**
 * Get the Tonasa plant category from role name
 */
export const getTonasaCategoryFromRole = (role: UserRole): string | null => {
  if (role.includes('Tonasa 2/3')) return 'Tonasa 2/3';
  if (role.includes('Tonasa 4')) return 'Tonasa 4';
  if (role.includes('Tonasa 5')) return 'Tonasa 5';
  return null;
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
