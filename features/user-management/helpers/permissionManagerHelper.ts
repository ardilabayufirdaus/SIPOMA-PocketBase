import { supabase } from '../../../utils/pocketbaseClient';
import { User, Permission } from '../../../types';

export interface PermissionModuleInput {
  userId: string;
  module: string;
  level: string;
}

export interface PlantOperationsPermInput {
  userId: string;
  level: string;
  plantUnits: string[];
}

/**
 * Helper function to fetch all users with their permissions from PocketBase
 */
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    // Get users from PocketBase
    const records = await supabase.collection('users').getList(1, 200, {
      sort: '-created',
      expand: 'user_permissions.permissions',
    });

    const data = records.items;

    // Transform data to match User interface
    const transformedUsers: User[] = (data || []).map((user: any) => ({
      id: String(user.id),
      username: String(user.username),
      fullName: String(user.full_name),
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created,
      updatedAt: user.updated,
      permissions:
        user.expand?.user_permissions?.map((up: any) => ({
          ...up.expand?.permissions,
          plantUnits: up.expand?.permissions?.plant_units || [],
        })) || [],
    }));

    return transformedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Delete all user permissions
 */
export const deleteUserPermissions = async (userId: string): Promise<void> => {
  try {
    // Find all user permissions for this user
    const records = await supabase.collection('user_permissions').getList(1, 100, {
      filter: `user="${userId}"`,
    });

    // Delete each user permission
    const deletePromises = records.items.map((record: any) =>
      supabase.collection('user_permissions').delete(record.id)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting user permissions:', error);
    throw error;
  }
};

/**
 * Create a new permission module for a user
 */
export const createPermissionModule = async (input: PermissionModuleInput): Promise<any> => {
  try {
    // First, check if permission already exists
    const permResults = await supabase.collection('permissions').getList(1, 1, {
      filter: `module_name="${input.module}" && permission_level="${input.level}"`,
    });

    let permissionId;

    if (permResults.items.length > 0) {
      // Permission exists, use it
      permissionId = permResults.items[0].id;
    } else {
      // Create new permission
      const newPermission = await supabase.collection('permissions').create({
        module_name: input.module,
        permission_level: input.level,
        plant_units: [],
      });

      permissionId = newPermission.id;
    }

    // Create user_permission link
    return await supabase.collection('user_permissions').create({
      user: input.userId,
      permissions: permissionId,
    });
  } catch (error) {
    console.error(`Error creating permission module ${input.module}:`, error);
    throw error;
  }
};

/**
 * Create a plant operations permission for a user
 */
export const createPlantOpsPerm = async (input: PlantOperationsPermInput): Promise<any> => {
  try {
    // Check if permission already exists
    const permResults = await supabase.collection('permissions').getList(1, 1, {
      filter: `module_name="plant_operations" && permission_level="${input.level}"`,
    });

    let permissionId;

    if (permResults.items.length > 0) {
      // Permission exists, use it but update plant units
      const existingPerm = permResults.items[0];

      // Update with new plant units
      const updatedPerm = await supabase.collection('permissions').update(existingPerm.id, {
        plant_units: input.plantUnits,
      });

      permissionId = updatedPerm.id;
    } else {
      // Create new permission
      const newPermission = await supabase.collection('permissions').create({
        module_name: 'plant_operations',
        permission_level: input.level,
        plant_units: input.plantUnits,
      });

      permissionId = newPermission.id;
    }

    // Create user_permission link
    return await supabase.collection('user_permissions').create({
      user: input.userId,
      permissions: permissionId,
    });
  } catch (error) {
    console.error(`Error creating plant ops permission for level ${input.level}:`, error);
    throw error;
  }
};

