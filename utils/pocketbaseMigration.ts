import { pb } from './pocketbase';

/**
 * Update database constraints to support Tonasa roles in PocketBase
 * This function should be run once to migrate the database schema
 */
export const migrateTonasaRoles = async (): Promise<void> => {
  try {
    // PocketBase approach would be different from Supabase's SQL approach
    // For PocketBase, we would need to update schema.json or modify collections via API

    // Verify if collection exists and create/update as needed
    const roles = [
      'admin',
      'manager',
      'operator',
      'guest',
      'supervisor',
      'tonasa_admin',
      'tonasa_manager',
      'tonasa_operator',
    ];

    // Create roles if they don't exist
    for (const role of roles) {
      try {
        const exists = await pb.collection('roles').getFirstListItem(`name="${role}"`);
        if (!exists) {
          await pb.collection('roles').create({
            name: role,
            description: `${role} role`,
          });
        }
      } catch {
        // Role doesn't exist, create it
        await pb.collection('roles').create({
          name: role,
          description: `${role} role`,
        });
      }
    }

    return;
  } catch {
    throw new Error('Migration failed');
  }
};

/**
 * Test if a role is valid in the current database schema
 */
export const validateRoleExists = async (testRole: string): Promise<boolean> => {
  try {
    // Check if role exists in PocketBase
    const roleExists = await pb.collection('users').getFirstListItem(`role="${testRole}"`);
    return !!roleExists;
  } catch {
    return false;
  }
};

/**
 * Get the allowed role constraints from the database
 */
export const getRoleConstraints = async (): Promise<string[]> => {
  try {
    // Get all roles from PocketBase
    const roles = await pb.collection('roles').getFullList();
    return roles.map((r) => r.name);
  } catch {
    return [];
  }
};
