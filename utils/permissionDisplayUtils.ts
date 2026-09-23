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

  // Plant Operations access (Derivative)
  if (
    permissions.derivative_plant_operations &&
    permissions.derivative_plant_operations !== 'NONE'
  ) {
    accessList.push(`Derivative Operations: ${permissions.derivative_plant_operations}`);
  }

  // Other modules
  const moduleMap: Record<string, string> = {
    project_management: 'Project Management',
    contract_sla_management: 'Contract & SLA Management',
    database: 'Database Hub',
    inspection: 'Inspection',
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
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
    case 'READ':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300';
    case 'NONE':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
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
      module: 'Analytic Dashboard',
      access: 'Dashboard Access',
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

  // Derivative Operations
  if (permissions.derivative_plant_operations) {
    const derLevel = getPermissionLevel(permissions.derivative_plant_operations);
    if (derLevel !== 'NONE') {
      details.push({
        module: 'Derivative Plant Operations',
        access: 'Full Access',
        level: derLevel,
      });
    }
  }

  // Other modules
  const modules = [
    { key: 'project_management', name: 'Capital Project Management' },
    { key: 'contract_sla_management', name: 'Contract & SLA Management' },
    { key: 'database', name: 'System Hub Database' },
    { key: 'inspection', name: 'Maintenance Inspection' },
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
