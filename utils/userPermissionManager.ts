import { supabase } from './supabaseClient';
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
  const defaultPermissions = getDefaultPermissionsForRole(role);

  try {
    // Clear existing permissions first
    await supabase.from('user_permissions').delete().eq('user_id', userId);

    // Insert new permissions based on role
    const permissionInserts = [];

    // Handle basic permissions (non-plant operations)
    for (const [module, level] of Object.entries(defaultPermissions)) {
      if (module === 'plant_operations') continue; // Handle separately

      if (level !== 'NONE') {
        // Check if permission exists or create it
        let { data: existingPerm } = await supabase
          .from('permissions')
          .select('id')
          .eq('module_name', module)
          .eq('permission_level', level)
          .single();

        if (!existingPerm) {
          const { data: newPerm, error: insertError } = await supabase
            .from('permissions')
            .insert({
              module_name: module,
              permission_level: level,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          existingPerm = newPerm;
        }

        if (existingPerm?.id) {
          permissionInserts.push({
            user_id: userId,
            permission_id: existingPerm.id,
          });
        }
      }
    }

    // Handle plant operations permissions
    const plantOps = defaultPermissions.plant_operations;
    if (plantOps && Object.keys(plantOps).length > 0) {
      for (const [category, units] of Object.entries(plantOps)) {
        for (const [unit, level] of Object.entries(units)) {
          if (level !== 'NONE') {
            const plantUnits = [{ category, unit }];

            // Check if permission exists or create it
            let { data: existingPerm } = await supabase
              .from('permissions')
              .select('id')
              .eq('module_name', 'plant_operations')
              .eq('permission_level', level)
              .contains('plant_units', plantUnits)
              .single();

            if (!existingPerm) {
              const { data: newPerm, error: insertError } = await supabase
                .from('permissions')
                .insert({
                  module_name: 'plant_operations',
                  permission_level: level,
                  plant_units: plantUnits,
                })
                .select('id')
                .single();

              if (insertError) throw insertError;
              existingPerm = newPerm;
            }

            if (existingPerm?.id) {
              permissionInserts.push({
                user_id: userId,
                permission_id: existingPerm.id,
              });
            }
          }
        }
      }
    }

    // Insert all user permissions
    if (permissionInserts.length > 0) {
      const { error: userPermError } = await supabase
        .from('user_permissions')
        .insert(permissionInserts);

      if (userPermError) throw userPermError;
    }

    console.log(`✅ Initialized permissions for user ${userId} with role ${role}`);
  } catch (error) {
    console.error(`❌ Failed to initialize permissions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Check if a user has any permissions assigned
 */
export const hasUserPermissions = async (userId: string): Promise<boolean> => {
  try {
    const { data: userPermissions, error } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;

    return userPermissions && userPermissions.length > 0;
  } catch (error) {
    console.error(`❌ Failed to check permissions for user ${userId}:`, error);
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
  console.log(`✅ Updated permissions for user ${userId} to role ${newRole}`);
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
    case 'Guest':
      return 'Limited read-only access to basic features';
    default:
      return 'No special permissions';
  }
};
