import { PermissionMatrix } from '../types';

const permissionModuleMap: Record<string, keyof PermissionMatrix> = {
  dashboard: 'dashboard',
  plant_operations: 'plant_operations',
  packing_plant: 'packing_plant',
  project_management: 'project_management',
  system_settings: 'system_settings',
  user_management: 'user_management',
};

export const buildPermissionMatrix = (userPermissions: any[]): PermissionMatrix => {
  const matrix: PermissionMatrix = {
    dashboard: 'NONE',
    plant_operations: {},
    packing_plant: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  };

  userPermissions.forEach((up: any) => {
    const perm = up.permissions;
    if (perm) {
      const moduleKey = permissionModuleMap[perm.module_name];
      if (moduleKey) {
        if (moduleKey === 'plant_operations') {
          // Handle plant operations permissions
          if (perm.plant_units && Array.isArray(perm.plant_units)) {
            perm.plant_units.forEach((unit: any) => {
              if (!matrix.plant_operations[unit.category]) {
                matrix.plant_operations[unit.category] = {};
              }
              matrix.plant_operations[unit.category][unit.unit] = perm.permission_level;
            });
          }
        } else {
          matrix[moduleKey] = perm.permission_level;
        }
      }
    }
  });

  return matrix;
};
