import { supabase } from './supabaseClient';
import { UserRole } from '../types';

/**
 * Test if the database supports the new Tonasa roles
 */
export const testTonasaRoleSupport = async (): Promise<{
  isSupported: boolean;
  unsupportedRoles: UserRole[];
  error?: string;
}> => {
  const tonasaRoles: UserRole[] = [
    'Admin Tonasa 2/3',
    'Admin Tonasa 4',
    'Admin Tonasa 5',
    'Operator Tonasa 2/3',
    'Operator Tonasa 4',
    'Operator Tonasa 5',
  ];

  const unsupportedRoles: UserRole[] = [];

  try {
    // Test each Tonasa role by attempting to query users with that role
    for (const role of tonasaRoles) {
      try {
        const { error } = await supabase.from('users').select('id').eq('role', role).limit(1);

        // If we get a constraint error, the role is not supported
        if (error && error.code === '22P02') {
          unsupportedRoles.push(role);
        }
      } catch (testError) {
        console.warn(`Warning: Could not test role ${role}:`, testError);
      }
    }

    return {
      isSupported: unsupportedRoles.length === 0,
      unsupportedRoles,
    };
  } catch (error) {
    return {
      isSupported: false,
      unsupportedRoles: tonasaRoles,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get a simple migration checker
 */
export const checkDatabaseMigrationNeeded = async (): Promise<boolean> => {
  try {
    const result = await testTonasaRoleSupport();
    return !result.isSupported;
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return true; // Assume migration is needed if we can't check
  }
};

/**
 * Log system status for debugging
 */
export const logSystemStatus = async (): Promise<void> => {
  try {
    const migrationNeeded = await checkDatabaseMigrationNeeded();
    const roleSupport = await testTonasaRoleSupport();

    console.log('🔍 SIPOMA System Status:');
    console.log('  Database migration needed:', migrationNeeded);
    console.log('  Tonasa roles supported:', roleSupport.isSupported);

    if (roleSupport.unsupportedRoles.length > 0) {
      console.log('  Unsupported roles:', roleSupport.unsupportedRoles);
    }

    if (roleSupport.error) {
      console.log('  Error:', roleSupport.error);
    }
  } catch (error) {
    console.error('Failed to log system status:', error);
  }
};
