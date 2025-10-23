import { PermissionMatrix, PermissionLevel, PlantOperationsPermissions } from '../types';

const permissionModuleMap: Record<string, keyof PermissionMatrix> = {
  dashboard: 'dashboard',
  plant_operations: 'plant_operations',
  inspection: 'inspection',
  project_management: 'project_management',
};

export const buildPermissionMatrix = (userPermissions: unknown): PermissionMatrix => {
  // Create default permission matrix
  const matrix: PermissionMatrix = {
    dashboard: 'NONE',
    plant_operations: {},
    inspection: 'NONE',
    project_management: 'NONE',
  };

  // Jika tidak ada izin, kembalikan matrix default
  if (!userPermissions) {
    return matrix;
  }

  // Menangani struktur di mana userPermissions adalah array dari user_permissions
  // dan sudah bukan objek di user record

  // If userPermissions is a string (role), return default matrix with basic permissions
  if (typeof userPermissions === 'string') {
    // Set basic permissions based on role
    const role = userPermissions.toLowerCase();

    // Define role-based default permissions
    if (role.includes('admin')) {
      matrix.dashboard = 'READ';
    } else if (role.includes('operator')) {
      matrix.dashboard = 'READ';
    }

    return matrix;
  }

  // Handle case when userPermissions is null or undefined
  if (!userPermissions) {
    return matrix;
  }

  // Ensure we're working with an array for permission objects
  const permissionsArray = Array.isArray(userPermissions) ? userPermissions : [userPermissions];

  permissionsArray.forEach((up: unknown) => {
    // Safe type check for up
    if (!up || typeof up !== 'object') return;

    const upObj = up as Record<string, unknown>;

    // Handle permissions_data field (JSON string from database)
    const permissionsData = upObj.permissions_data;
    if (typeof permissionsData === 'string') {
      try {
        const parsedPermissions = JSON.parse(permissionsData) as Record<string, unknown>;

        // Process each module in the parsed permissions
        Object.entries(parsedPermissions).forEach(([moduleName, permissionValue]) => {
          const moduleKey = permissionModuleMap[moduleName];

          if (moduleKey) {
            if (
              moduleKey === 'plant_operations' &&
              typeof permissionValue === 'object' &&
              permissionValue !== null
            ) {
              // Handle plant operations permissions
              const plantOps = permissionValue as PlantOperationsPermissions;
              matrix.plant_operations = plantOps;
            } else if (typeof permissionValue === 'string') {
              // Handle simple permission levels
              matrix[moduleKey] = permissionValue as PermissionLevel;
            }
          }
        });

        return; // Skip the old permission structure processing
      } catch {
        // Error parsing permissions_data, skip this permission entry
        return;
      }
    }

    // Fallback to old permission structure (for backward compatibility)
    const perm = upObj.permissions as Record<string, unknown> | undefined;

    if (perm) {
      const moduleNameStr = String(perm.module_name || '');
      const moduleKey = permissionModuleMap[moduleNameStr];

      if (moduleKey) {
        if (moduleKey === 'plant_operations') {
          // Handle plant operations permissions
          const plantUnits = perm.plant_units;

          if (plantUnits && Array.isArray(plantUnits)) {
            plantUnits.forEach((unit: Record<string, unknown>) => {
              const category = String(unit.category || '');
              const unitName = String(unit.unit || '');
              const level = String(perm.permission_level || 'NONE') as PermissionLevel;

              if (!matrix.plant_operations[category]) {
                matrix.plant_operations[category] = {};
              }
              matrix.plant_operations[category][unitName] = level;
            });
          }
        } else {
          const level = String(perm.permission_level || 'NONE') as PermissionLevel;
          matrix[moduleKey] = level;
        }
      }
    }
  });

  return matrix;
};

