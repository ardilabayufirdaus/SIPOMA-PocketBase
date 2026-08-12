import { PermissionMatrix, PermissionLevel } from '../types';

const permissionModuleMap: Record<string, keyof PermissionMatrix> = {
  dashboard: 'dashboard',
  plant_operations: 'cm_plant_operations', // Map legacy to new
  cm_plant_operations: 'cm_plant_operations',
  rkc_plant_operations: 'rkc_plant_operations',
  derivative_plant_operations: 'derivative_plant_operations',
  project_management: 'project_management',
  database: 'database',
  inspection: 'inspection',
};

export const buildPermissionMatrix = (userPermissions: unknown): PermissionMatrix => {
  // Create default permission matrix
  const matrix: PermissionMatrix = {
    dashboard: 'NONE',
    cm_plant_operations: 'NONE',
    rkc_plant_operations: 'NONE',
    derivative_plant_operations: 'NONE',
    project_management: 'NONE',
    database: 'NONE',
    inspection: 'NONE',
    plant_operations: {},
  };

  // Jika tidak ada izin, kembalikan matrix default
  if (!userPermissions) {
    return matrix;
  }

  // If userPermissions is an array of permission objects (legacy structure)
  if (Array.isArray(userPermissions)) {
    userPermissions.forEach((item) => {
      const p = item.permissions || item;
      if (p && p.module_name && p.permission_level) {
        const moduleKey = permissionModuleMap[p.module_name] || p.module_name;
        if (p.plant_units && Array.isArray(p.plant_units) && p.plant_units.length > 0) {
          if (typeof matrix.cm_plant_operations !== 'object') {
            (matrix as any).cm_plant_operations = {};
          }
          if (typeof matrix.plant_operations !== 'object') {
            (matrix as any).plant_operations = {};
          }
          p.plant_units.forEach((u: any) => {
            const cat = u.category || 'default';
            const unit = u.unit || 'unit';
            if (!(matrix as any).cm_plant_operations[cat])
              (matrix as any).cm_plant_operations[cat] = {};
            if (!(matrix as any).plant_operations[cat]) (matrix as any).plant_operations[cat] = {};
            (matrix as any).cm_plant_operations[cat][unit] = p.permission_level;
            (matrix as any).plant_operations[cat][unit] = p.permission_level;
          });
        } else {
          (matrix as any)[moduleKey] = p.permission_level;
        }
      }
    });
    return matrix;
  }

  // If userPermissions is already a matrix object, return it (simple pass-through)
  if (typeof userPermissions === 'object' && userPermissions !== null) {
    const p = userPermissions as any;
    return {
      dashboard: p.dashboard || 'NONE',
      cm_plant_operations: p.cm_plant_operations || 'NONE',
      rkc_plant_operations: p.rkc_plant_operations || 'NONE',
      derivative_plant_operations: p.derivative_plant_operations || p.cm_plant_operations || 'NONE',
      project_management: p.project_management || 'NONE',
      database: p.database || 'NONE',
      inspection: p.inspection || 'NONE',
      plant_operations: p.plant_operations || {},
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
        derivative_plant_operations: 'WRITE',
        project_management: 'WRITE',
        database: 'WRITE',
        inspection: 'WRITE',
      };
    }
    if (role.includes('supervisor')) {
      return {
        dashboard: 'WRITE',
        cm_plant_operations: 'WRITE',
        rkc_plant_operations: 'WRITE',
        derivative_plant_operations: 'WRITE',
        project_management: 'WRITE',
        database: 'READ',
        inspection: 'WRITE',
      };
    }
    if (role.includes('operator') || role.includes('associate')) {
      return {
        ...matrix,
        dashboard: 'READ',
        cm_plant_operations: 'WRITE',
        rkc_plant_operations: 'WRITE',
        derivative_plant_operations: 'WRITE',
        inspection: 'WRITE',
      };
    }
  }

  return matrix;
};
