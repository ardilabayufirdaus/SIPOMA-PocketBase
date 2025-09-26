import { UserRole } from '../types';

/**
 * Helper functions for role checking
 */

/**
 * Check if a user role is admin-level (includes all admin variants)
 */
export const isAdminRole = (role: UserRole | undefined | null): boolean => {
  if (!role) return false;

  return (
    role === 'Super Admin' ||
    role === 'Admin' ||
    role === 'Admin Tonasa 2/3' ||
    role === 'Admin Tonasa 4' ||
    role === 'Admin Tonasa 5'
  );
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

  return (
    role === 'Operator' ||
    role === 'Operator Tonasa 2/3' ||
    role === 'Operator Tonasa 4' ||
    role === 'Operator Tonasa 5'
  );
};

/**
 * Check if a user role is Super Admin
 */
export const isSuperAdmin = (role: UserRole | undefined | null): boolean => {
  return role === 'Super Admin';
};

/**
 * Check if a user role is Tonasa-specific admin
 */
export const isTonasaAdmin = (role: UserRole | undefined | null): boolean => {
  if (!role) return false;

  return role === 'Admin Tonasa 2/3' || role === 'Admin Tonasa 4' || role === 'Admin Tonasa 5';
};

/**
 * Check if a user role is Tonasa-specific operator
 */
export const isTonasaOperator = (role: UserRole | undefined | null): boolean => {
  if (!role) return false;

  return (
    role === 'Operator Tonasa 2/3' || role === 'Operator Tonasa 4' || role === 'Operator Tonasa 5'
  );
};

/**
 * Get the plant category for Tonasa roles
 */
export const getTonasaPlantCategory = (role: UserRole | undefined | null): string | null => {
  if (!role) return null;

  switch (role) {
    case 'Admin Tonasa 2/3':
    case 'Operator Tonasa 2/3':
      return 'Tonasa 2/3';
    case 'Admin Tonasa 4':
    case 'Operator Tonasa 4':
      return 'Tonasa 4';
    case 'Admin Tonasa 5':
    case 'Operator Tonasa 5':
      return 'Tonasa 5';
    default:
      return null;
  }
};
