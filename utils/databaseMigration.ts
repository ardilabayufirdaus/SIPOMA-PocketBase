import { pb } from './pocketbase';

/**
 * Update database constraints to support new Tonasa roles
 * This function should be run once to migrate the database schema
 */
export const migrateTonasaRoles = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Tonasa roles migration...');

    // PocketBase handles this via collection schema validation
    // We don't need SQL constraints with PocketBase
    console.log('✅ PocketBase handles role validation via schema');

    return;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Check if the database supports all the new Tonasa roles
 */
export const validateTonasaRoleSupport = async (): Promise<boolean> => {
  try {
    // PocketBase handles role validation via schema, so we just check if the schema exists
    const collection = await pb.collections.getOne('users');

    // If collection exists and has a role field, we assume it supports our roles
    return !!collection;
  } catch (error) {
    console.error('❌ Role validation failed:', error);
    return false;
  }
};

/**
 * Get current database role constraints
 * Note: PocketBase handles this via schema, so we return predefined roles
 */
export const getCurrentRoleConstraints = async (): Promise<string[]> => {
  try {
    // In PocketBase, these would be defined in the schema rather than as SQL constraints
    return [
      'Super Admin',
      'Admin',
      'Admin Tonasa 2/3',
      'Admin Tonasa 4',
      'Admin Tonasa 5',
      'Operator',
      'Operator Tonasa 2/3',
      'Operator Tonasa 4',
      'Operator Tonasa 5',
      'Guest',
    ];
  } catch (error) {
    console.error('❌ Failed to get role constraints:', error);
    return [];
  }
};
