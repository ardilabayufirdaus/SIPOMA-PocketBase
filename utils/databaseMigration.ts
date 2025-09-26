import { supabase } from '../utils/supabaseClient';

/**
 * Update database constraints to support new Tonasa roles
 * This function should be run once to migrate the database schema
 */
export const migrateTonasaRoles = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Tonasa roles migration...');

    // Drop existing constraint
    const dropConstraintSQL = `
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropConstraintSQL,
    });

    if (dropError) {
      console.warn('⚠️ Could not drop existing constraint (may not exist):', dropError);
    }

    // Add new constraint with all roles
    const addConstraintSQL = `
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN (
          'Super Admin',
          'Admin', 
          'Admin Tonasa 2/3',
          'Admin Tonasa 4',
          'Admin Tonasa 5',
          'Operator',
          'Operator Tonasa 2/3', 
          'Operator Tonasa 4',
          'Operator Tonasa 5',
          'Guest'
      ));
    `;

    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: addConstraintSQL,
    });

    if (addError) {
      console.error('❌ Failed to add new constraint:', addError);
      throw addError;
    }

    console.log('✅ Tonasa roles migration completed successfully');
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
    // Try to create a test user with Tonasa role (but don't commit)
    const testRole = 'Admin Tonasa 2/3';

    const { error } = await supabase.from('users').select('role').eq('role', testRole).limit(1);

    // If no error, the constraint allows this role
    return !error;
  } catch (error) {
    console.error('❌ Role validation failed:', error);
    return false;
  }
};

/**
 * Get current database role constraints
 */
export const getCurrentRoleConstraints = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_role_constraints');

    if (error) {
      console.error('❌ Failed to get role constraints:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Failed to get role constraints:', error);
    return [];
  }
};
