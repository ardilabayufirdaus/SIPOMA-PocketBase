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
            if (typeof permissionValue === 'string') {
              // Handle simple permission levels
              (matrix as any)[moduleKey] = permissionValue as PermissionLevel;
            } else if (typeof permissionValue === 'object' && permissionValue !== null) {
              // Legacy object permission, map to READ/WRITE based on existence
              // If object exists and has keys, assume at least READ.
              // We could try to scan values for WRITE.
              let level = 'READ';
              const str = JSON.stringify(permissionValue);
              if (str.includes('WRITE') || str.includes('ADMIN')) {
                level = 'WRITE';
              }
              (matrix as any)[moduleKey] = level;
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
        let level = String(perm.permission_level || 'NONE') as PermissionLevel;
        if (level === 'NONE') level = 'READ'; // Default legacy existence to READ if not NONE? or respect keys.

        // If it was granular plant ops, the existence of this record means partial access.
        // We'll give it the level specified in the record.
        (matrix as any)[moduleKey] = level;
      }
    }
  });

  return matrix;
};
