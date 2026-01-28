import { PermissionMatrix, PermissionLevel } from '../types';

const permissionModuleMap: Record<string, keyof PermissionMatrix> = {
  dashboard: 'dashboard',
  plant_operations: 'cm_plant_operations', // Map legacy to new
  cm_plant_operations: 'cm_plant_operations',
  rkc_plant_operations: 'rkc_plant_operations',
  project_management: 'project_management',
  database: 'database',
};

export const buildPermissionMatrix = (userPermissions: unknown): PermissionMatrix => {
  // Create default permission matrix
  const matrix: PermissionMatrix = {
    dashboard: 'NONE',
    cm_plant_operations: 'NONE',
    rkc_plant_operations: 'NONE',
    project_management: 'NONE',
    database: 'NONE',
  };

  // Jika tidak ada izin, kembalikan matrix default
  if (!userPermissions) {
    return matrix;
  }

  // If userPermissions is already a matrix object, return it (simple pass-through)
  if (typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
    const p = userPermissions as any;
    return {
      dashboard: p.dashboard || 'NONE',
      cm_plant_operations: p.cm_plant_operations || 'NONE',
      rkc_plant_operations: p.rkc_plant_operations || 'NONE',
      project_management: p.project_management || 'NONE',
      database: p.database || 'NONE',
    };
  }

  // If userPermissions is a string (role), return default matrix with basic permissions
  if (typeof userPermissions === 'string') {
    const role = userPermissions.toLowerCase();
    if (role.includes('admin') || role.includes('super')) {
      return {
        dashboard: 'WRITE',
        cm_plant_operations: 'WRITE',
        rkc_plant_operations: 'WRITE',
        project_management: 'WRITE',
        database: 'WRITE',
      };
    }
    if (role.includes('operator')) {
      return {
        ...matrix,
        dashboard: 'READ',
        cm_plant_operations: 'WRITE',
        rkc_plant_operations: 'WRITE',
      };
    }
  }

  return matrix;
};
