import { pb } from './pocketbase-simple';
import { UserRole } from '../types';
import {
  getDefaultPermissionsForRole,
  getCementMillsForCategory,
  getTonasaCategoryFromRole,
} from './tonasaPermissions';

/**
 * Log permission changes for audit trail
 */
export const logPermissionChange = async (
  userId: string,
  action: 'created' | 'updated' | 'reset_to_default',
  oldPermissions?: Record<string, any>,
  newPermissions?: Record<string, any>,
  changedBy?: string
): Promise<void> => {
  try {
    await pb.collection('user_activity_logs').create({
      user_id: userId,
      action_type: 'permission_change',
      action_details: {
        action,
        old_permissions: oldPermissions,
        new_permissions: newPermissions,
        changed_by: changedBy || 'system',
        timestamp: new Date().toISOString(),
      },
      ip_address: '', // Could be populated from request context
      user_agent: '', // Could be populated from request context
    });
  } catch (error) {
    console.warn('Failed to log permission change:', error);
    // Don't throw error to avoid breaking permission updates
  }
};

/**
 * Initialize default permissions for a newly created user based on their role
 */
export const initializeUserPermissions = async (userId: string, role: UserRole): Promise<void> => {
  try {
    let defaultPermissions: Record<string, any>;

    try {
      // Try to get default permissions from the permission system
      defaultPermissions = await getDefaultPermissionsForRole(role);
    } catch (error) {
      console.warn('Failed to get default permissions from system, using fallback:', error);

      // Fallback permissions based on role
      switch (role) {
        case 'Super Admin':
          defaultPermissions = {
            dashboard: 'ADMIN',
            plant_operations: {},
            inspection: 'ADMIN',
            project_management: 'ADMIN',
          };
          break;
        case 'Admin':
          defaultPermissions = {
            dashboard: 'ADMIN',
            plant_operations: {},
            inspection: 'ADMIN',
            project_management: 'ADMIN',
          };
          break;
        case 'Operator':
          defaultPermissions = {
            dashboard: 'READ',
            plant_operations: {},
            inspection: 'NONE',
            project_management: 'NONE',
          };
          break;
        case 'Guest':
        default:
          defaultPermissions = {
            dashboard: 'NONE',
            plant_operations: {},
            inspection: 'NONE',
            project_management: 'NONE',
          };
          break;
      }
    }

    // Check if user already has permissions
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
    });
    let oldPermissions: Record<string, any> | undefined;
    if (existing.items.length > 0) {
      oldPermissions = JSON.parse(existing.items[0].permissions_data);
    }

    // Create or update user permissions record
    const permissionData = {
      user_id: userId,
      permissions_data: JSON.stringify(defaultPermissions),
      is_custom_permissions: false,
      role: role,
    };

    if (existing.items.length > 0) {
      // Update existing record
      await pb.collection('user_permissions').update(existing.items[0].id, permissionData);
    } else {
      // Create new record
      await pb.collection('user_permissions').create(permissionData);
    }

    // Also update the permissions field in the users collection for consistency
    console.log('🔍 Updating permissions field in users collection during initialization');
    try {
      await pb.collection('users').update(userId, {
        permissions: defaultPermissions,
      });
      console.log('✅ Users collection permissions field updated during initialization');
    } catch (userUpdateError) {
      console.warn(
        '⚠️ Failed to update permissions field in users collection during initialization:',
        userUpdateError
      );
      // Don't throw here as the main permission save was successful
    }

    // Log permission initialization
    await logPermissionChange(userId, 'created', oldPermissions, defaultPermissions);
  } catch (error) {
    console.error('Failed to initialize user permissions:', error);
    // Don't throw error to avoid breaking user creation
    // The user can still be created, permissions can be set later
  }
};

/**
 * Get user permissions from database
 */
export const getUserPermissions = async (userId: string): Promise<Record<string, any> | null> => {
  try {
    const result = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
    });

    if (result.items.length > 0) {
      const item = result.items[0];
      return JSON.parse(item.permissions_data);
    }

    return null;
  } catch (error) {
    console.warn('Failed to get user permissions:', error);
    return null;
  }
};

/**
 * Save user permissions (custom permissions)
 */
export const saveUserPermissions = async (
  userId: string,
  permissions: Record<string, any>,
  changedBy?: string
): Promise<void> => {
  try {
    console.log('🔍 saveUserPermissions called with:', { userId, permissions, changedBy });

    // Get existing permissions for logging
    const existing = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
    });

    console.log('🔍 Existing permissions query result:', {
      totalItems: existing.totalItems,
      items: existing.items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
      })),
    });

    let oldPermissions: Record<string, any> | undefined;
    if (existing.items.length > 0) {
      oldPermissions = JSON.parse(existing.items[0].permissions_data);
      console.log('🔍 Found existing permissions, will UPDATE');
    } else {
      console.log('🔍 No existing permissions found, will CREATE');
    }

    // Create or update user permissions record
    const permissionData = {
      user_id: userId,
      permissions_data: JSON.stringify(permissions),
      is_custom_permissions: true,
      role: existing.items[0]?.role || 'Unknown',
    };

    console.log('🔍 Permission data to save:', permissionData);

    if (existing.items.length > 0) {
      // Update existing record
      console.log('🔍 Updating existing record:', existing.items[0].id);
      await pb.collection('user_permissions').update(existing.items[0].id, permissionData);
      console.log('✅ Update successful');
    } else {
      // Create new record
      console.log('🔍 Creating new record');
      await pb.collection('user_permissions').create(permissionData);
      console.log('✅ Create successful');
    }

    // Also update the permissions field in the users collection for consistency
    console.log('🔍 Updating permissions field in users collection');
    try {
      await pb.collection('users').update(userId, {
        permissions: permissions,
      });
      console.log('✅ Users collection permissions field updated');
    } catch (userUpdateError) {
      console.warn('⚠️ Failed to update permissions field in users collection:', userUpdateError);
      // Don't throw here as the main permission save was successful
    }

    // Log permission change
    await logPermissionChange(userId, 'updated', oldPermissions, permissions, changedBy);

    // Dispatch custom event to notify components that permissions have changed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('user-permissions-changed', {
          detail: { userId, permissions, changedBy },
        })
      );
    }
  } catch (error) {
    console.error('❌ Failed to save user permissions:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
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

  // Get existing permissions for logging
  const existing = await pb.collection('user_permissions').getList(1, 1, {
    filter: `user_id = '${userId}'`,
  });

  let oldPermissions: Record<string, any> | undefined;
  if (existing.items.length > 0) {
    oldPermissions = JSON.parse(existing.items[0].permissions_data);
  }

  // Update permissions to defaults
  const permissionData = {
    user_id: userId,
    permissions_data: JSON.stringify(defaultPermissions),
    is_custom_permissions: false,
    role: role,
  };

  if (existing.items.length > 0) {
    await pb.collection('user_permissions').update(existing.items[0].id, permissionData);
  } else {
    await pb.collection('user_permissions').create(permissionData);
  }

  // Also update the permissions field in the users collection for consistency
  console.log('🔍 Updating permissions field in users collection for reset');
  try {
    await pb.collection('users').update(userId, {
      permissions: defaultPermissions,
    });
    console.log('✅ Users collection permissions field updated for reset');
  } catch (userUpdateError) {
    console.warn(
      '⚠️ Failed to update permissions field in users collection during reset:',
      userUpdateError
    );
    // Don't throw here as the main permission save was successful
  }

  // Log permission change
  await logPermissionChange(
    userId,
    'reset_to_default',
    oldPermissions,
    defaultPermissions,
    changedBy
  );

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
    const res = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
      fields: 'id',
    });

    return res.totalItems > 0;
  } catch {
    return false;
  }
};

/**
 * Check if user has custom permissions (not default)
 */
export const hasCustomPermissions = async (userId: string): Promise<boolean> => {
  try {
    const res = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${userId}'`,
      fields: 'is_custom_permissions',
    });

    return res.items.length > 0 && res.items[0].is_custom_permissions === true;
  } catch {
    return false;
  }
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

