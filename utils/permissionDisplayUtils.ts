import { PermissionMatrix, PermissionLevel, PlantOperationsPermissions } from '../types';

/**
 * Utility to format user permissions for display in the user table
 */
export const formatPermissionsForDisplay = (permissions: PermissionMatrix): string[] => {
  const accessList: string[] = [];

  // Dashboard access
  if (permissions.dashboard !== 'NONE') {
    accessList.push(`Dashboard: ${permissions.dashboard}`);
  }

  // Plant Operations access
  if (permissions.plant_operations && typeof permissions.plant_operations === 'object') {
    Object.entries(permissions.plant_operations).forEach(([category, units]) => {
      if (typeof units === 'object') {
        const unitAccess = Object.entries(units)
          .filter(([, level]) => level !== 'NONE')
          .map(([unit, level]) => `${unit}: ${level}`)
          .join(', ');

        if (unitAccess) {
          accessList.push(`${category}: ${unitAccess}`);
        }
      }
    });
  }

  // Other modules
  const moduleMap: Record<string, string> = {
    project_management: 'Project Management',
  };

  Object.entries(moduleMap).forEach(([key, label]) => {
    const level = permissions[key as keyof PermissionMatrix] as PermissionLevel;
    if (level && level !== 'NONE') {
      accessList.push(`${label}: ${level}`);
    }
  });

  return accessList;
};

/**
 * Get a short summary of permissions for compact display
 */
export const getPermissionsSummary = (permissions: PermissionMatrix): string => {
  const accessList = formatPermissionsForDisplay(permissions);

  if (accessList.length === 0) {
    return 'No Access';
  }

  if (accessList.length <= 3) {
    return accessList.join(', ');
  }

  return `${accessList.slice(0, 2).join(', ')} (+${accessList.length - 2} more)`;
};

/**
 * Get permission level color for styling
 */
export const getPermissionLevelColor = (level: PermissionLevel): string => {
  switch (level) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'WRITE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'READ':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'NONE':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

/**
 * Format permissions as detailed list for tooltip or modal
 */
export const formatPermissionsDetailed = (
  permissions: PermissionMatrix
): { module: string; access: string; level: string }[] => {
  const details: { module: string; access: string; level: string }[] = [];

  // Helper function to get permission level as string
  const getPermissionLevel = (permission: PermissionLevel | PlantOperationsPermissions): string => {
    if (typeof permission === 'string') {
      return permission;
    }
    return 'Custom'; // For object permissions
  };

  // Dashboard
  const dashboardLevel = getPermissionLevel(permissions.dashboard);
  if (dashboardLevel !== 'NONE') {
    details.push({
      module: 'Dashboard',
      access: 'Full Dashboard',
      level: dashboardLevel,
    });
  }

  // Plant Operations
  if (permissions.plant_operations && typeof permissions.plant_operations === 'object') {
    Object.entries(permissions.plant_operations).forEach(([category, units]) => {
      if (typeof units === 'object') {
        Object.entries(units).forEach(([unit, level]) => {
          if (level !== 'NONE') {
            details.push({
              module: 'Plant Operations',
              access: `${category} - ${unit}`,
              level: level,
            });
          }
        });
      }
    });
  }

  // Other modules
  const modules = [{ key: 'project_management', name: 'Project Management' }];

  modules.forEach(({ key, name }) => {
    const level = permissions[key as keyof PermissionMatrix] as PermissionLevel;
    if (level && level !== 'NONE') {
      details.push({
        module: name,
        access: `Full ${name}`,
        level: level,
      });
    }
  });

  return details;
};

