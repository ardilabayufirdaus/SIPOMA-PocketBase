import { PermissionMatrix, PermissionLevel } from '../types';

/**
 * Utility to format user permissions for display in the user table
 * UPDATED: Simplified model
 */
export const formatPermissionsForDisplay = (permissions: PermissionMatrix): string[] => {
  const accessList: string[] = [];

  // Dashboard access
  if (permissions.dashboard !== 'NONE') {
    accessList.push(`Dashboard: ${permissions.dashboard}`);
  }

  // Plant Operations access (CM)
  if (permissions.cm_plant_operations && permissions.cm_plant_operations !== 'NONE') {
    accessList.push(`CM Operations: ${permissions.cm_plant_operations}`);
  }

  // Plant Operations access (RKC)
  if (permissions.rkc_plant_operations && permissions.rkc_plant_operations !== 'NONE') {
    accessList.push(`RKC Operations: ${permissions.rkc_plant_operations}`);
  }

  // Other modules
  const moduleMap: Record<string, string> = {
    project_management: 'Project Management',
    database: 'Database',
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
    case 'WRITE':
      return 'bg-orange-100 text-orange-800';
    case 'READ':
      return 'bg-blue-100 text-blue-800';
    case 'NONE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
  const getPermissionLevel = (permission: PermissionLevel): string => {
    return permission || 'NONE';
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

  // Plant Operations (CM)
  const cmLevel = getPermissionLevel(permissions.cm_plant_operations);
  if (cmLevel !== 'NONE') {
    details.push({
      module: 'CM Plant Operations',
      access: 'Full Access',
      level: cmLevel,
    });
  }

  // Plant Operations (RKC)
  const rkcLevel = getPermissionLevel(permissions.rkc_plant_operations);
  if (rkcLevel !== 'NONE') {
    details.push({
      module: 'RKC Plant Operations',
      access: 'Full Access',
      level: rkcLevel,
    });
  }

  // Other modules
  const modules = [
    { key: 'project_management', name: 'Project Management' },
    { key: 'database', name: 'Database' },
  ];

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
