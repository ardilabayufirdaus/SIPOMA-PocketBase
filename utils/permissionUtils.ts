import { PermissionMatrix } from '../types';

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
      switch (perm.module_name) {
        case 'dashboard':
          matrix.dashboard = perm.permission_level;
          break;
        case 'plant_operations':
          // Handle plant operations permissions
          if (perm.plant_units && Array.isArray(perm.plant_units)) {
            perm.plant_units.forEach((unit: any) => {
              if (!matrix.plant_operations[unit.category]) {
                matrix.plant_operations[unit.category] = {};
              }
              matrix.plant_operations[unit.category][unit.unit] = perm.permission_level;
            });
          }
          break;
        case 'packing_plant':
          matrix.packing_plant = perm.permission_level;
          break;
        case 'project_management':
          matrix.project_management = perm.permission_level;
          break;
        case 'system_settings':
          matrix.system_settings = perm.permission_level;
          break;
        case 'user_management':
          matrix.user_management = perm.permission_level;
          break;
      }
    }
  });

  return matrix;
};
