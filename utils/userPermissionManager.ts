import { pb } from './pocketbase-simple';
import { UserRole, PermissionMatrix } from '../types';
import {
  getDefaultPermissionsForRole,
  getCementMillsForCategory,
  getTonasaCategoryFromRole,
} from './tonasaPermissions';

/**
 * Initialize default permissions for a newly created user based on their role
 */
export const initializeUserPermissions = async (userId: string, role: UserRole): Promise<void> => {
  // Get default permissions from the permission system
  const defaultPermissions = await getDefaultPermissionsForRole(role);

  // Check if user already has permissions in user_management
  const existing = await pb.collection('user_management').getList(1, 1, {
    filter: `user_id = '${userId}'`,
  });

  // Create or update record in user_management
  const permissionData = {
    user_id: userId,
    dashboard: defaultPermissions.dashboard,
    cm_plant_operations: defaultPermissions.cm_plant_operations,
    rkc_plant_operations: defaultPermissions.rkc_plant_operations,
    project_management: defaultPermissions.project_management,
    database: defaultPermissions.database,
  };

  if (existing.items.length > 0) {
    // Update existing record
    await pb.collection('user_management').update(existing.items[0].id, permissionData);
  } else {
    // Create new record
    await pb.collection('user_management').create(permissionData);
  }

  // Also update the permissions field in the users collection for consistency
  await pb.collection('users').update(userId, {
    permissions: defaultPermissions,
  });
};

/**
 * Get user permissions from database (user_management collection)
 */
export const getUserPermissions = async (userId: string): Promise<PermissionMatrix | null> => {
  const result = await pb.collection('user_management').getList(1, 1, {
    filter: `user_id = '${userId}'`,
  });

  if (result.items.length > 0) {
    const item = result.items[0];
    return {
      dashboard: item.dashboard || 'NONE',
      cm_plant_operations: item.cm_plant_operations || 'NONE',
      rkc_plant_operations: item.rkc_plant_operations || 'NONE',
      project_management: item.project_management || 'NONE',
      database: item.database || 'NONE',
    };
  }

  return null;
};

/**
 * Save user permissions
 */
export const saveUserPermissions = async (
  userId: string,
  permissions: PermissionMatrix,
  changedBy?: string
): Promise<void> => {
  // Get existing record in user_management
  const existing = await pb.collection('user_management').getList(1, 1, {
    filter: `user_id = '${userId}'`,
  });

  const permissionData = {
    user_id: userId,
    dashboard: permissions.dashboard,
    cm_plant_operations: permissions.cm_plant_operations,
    rkc_plant_operations: permissions.rkc_plant_operations,
    project_management: permissions.project_management,
    database: permissions.database,
  };

  if (existing.items.length > 0) {
    await pb.collection('user_management').update(existing.items[0].id, permissionData);
  } else {
    await pb.collection('user_management').create(permissionData);
  }

  // Also update the permissions field in the users collection for consistency
  await pb.collection('users').update(userId, {
    permissions: permissions,
    updated: new Date().toISOString(), // Force update timestamp to trigger real-time events
  });

  // Dispatch custom event to notify components that permissions have changed
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('user-permissions-changed', {
        detail: { userId, permissions, changedBy },
      })
    );
  }
};

/**
 * Reset user permissions to role defaults
 */
export const resetUserPermissionsToDefault = async (
  userId: string,
  role: UserRole,
  changedBy?: string
): Promise<void> => {
  const defaultPermissions = await getDefaultPermissionsForRole(role);

  // Get existing record in user_management
  const existing = await pb.collection('user_management').getList(1, 1, {
    filter: `user_id = '${userId}'`,
  });

  const permissionData = {
    user_id: userId,
    dashboard: defaultPermissions.dashboard,
    cm_plant_operations: defaultPermissions.cm_plant_operations,
    rkc_plant_operations: defaultPermissions.rkc_plant_operations,
    project_management: defaultPermissions.project_management,
    database: defaultPermissions.database,
  };

  if (existing.items.length > 0) {
    await pb.collection('user_management').update(existing.items[0].id, permissionData);
  } else {
    await pb.collection('user_management').create(permissionData);
  }

  // Also update the permissions field in the users collection for consistency
  await pb.collection('users').update(userId, {
    permissions: defaultPermissions,
  });

  // Dispatch custom event to notify components that permissions have changed
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('user-permissions-changed', {
        detail: { userId, permissions: defaultPermissions, changedBy },
      })
    );
  }
};

/**
 * Check if a user has any permissions assigned
 */
export const hasUserPermissions = async (userId: string): Promise<boolean> => {
  try {
    const res = await pb.collection('user_management').getList(1, 1, {
      filter: `user_id = '${userId}'`,
      fields: 'id',
    });

    return res.totalItems > 0;
  } catch {
    return false;
  }
};

/**
 * Check if user has custom permissions (Simplified for the new model)
 */
export const hasCustomPermissions = async (_userId: string): Promise<boolean> => {
  // In the new simplified model, we don't track "is_custom_permissions" explicitly in the DB
  // For now, always return true as most permissions are set per-user
  return true;
};

/**
 * Update user permissions when their role changes
 */
export const updateUserPermissionsForRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  await initializeUserPermissions(userId, newRole);
  return;
};

/**
 * Get user-friendly description of permissions for a role
 */
export const getPermissionDescription = (role: UserRole): string => {
  const category = getTonasaCategoryFromRole(role);

  if (category) {
    const mills = getCementMillsForCategory(category);
    const accessLevel = role.includes('Admin') ? 'ADMIN' : 'WRITE';
    const levelText = accessLevel === 'ADMIN' ? 'full administrative access' : 'operational access';

    return `${levelText} to ${category} plant operations (Cement Mills: ${mills.join(', ')})`;
  }

  switch (role) {
    case 'Super Admin':
      return 'Full administrative access to all system features';
    case 'Admin':
      return 'Administrative access to most system features';
    case 'Operator':
      return 'Operational access to plant operations and basic features';
    case 'Autonomous':
      return 'Autonomous operational access with inspection and project management capabilities';
    case 'Guest':
      return 'Limited read-only access to basic features';
    default:
      return 'No special permissions';
  }
};
