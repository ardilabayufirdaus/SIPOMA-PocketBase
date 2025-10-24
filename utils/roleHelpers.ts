import { UserRole } from '../types';

/**
 * Helper functions for role checking
 */

/**
 * Check if a user role is admin-level (includes all admin variants)
 */
export const isAdminRole = (role: UserRole | undefined | null): boolean => {
  if (!role) return false;

  return role === 'Super Admin' || role === 'Admin' || role === 'Manager';
};

/**
 * Check if a user role has admin privileges (Super Admin or any Admin variant)
 */
export const hasAdminPrivileges = (role: UserRole | undefined | null): boolean => {
  return isAdminRole(role);
};

/**
 * Check if a user role is operator-level (includes all operator variants)
 */
export const isOperatorRole = (role: UserRole | undefined | null): boolean => {
  if (!role) return false;

  return role === 'Operator' || role === 'Outsourcing' || role === 'Autonomous';
};

/**
 * Check if a user role is Super Admin
 */
export const isSuperAdmin = (role: UserRole | undefined | null): boolean => {
  return role === 'Super Admin';
};

/**
 * Check if a user role is Tonasa-specific admin
 * Note: With new role structure, this always returns false
 */
export const isTonasaAdmin = (_role: UserRole | undefined | null): boolean => {
  return false; // No more Tonasa-specific roles
};

/**
 * Check if a user role is Tonasa-specific operator
 * Note: With new role structure, this always returns false
 */
export const isTonasaOperator = (_role: UserRole | undefined | null): boolean => {
  return false; // No more Tonasa-specific roles
};

/**
 * Get the plant category for Tonasa roles
 */
/**
 * Get Tonasa plant category from role
 * Note: With new role structure, this always returns null
 */
export const getTonasaPlantCategory = (_role: UserRole | undefined | null): string | null => {
  return null; // No more Tonasa-specific roles
};
