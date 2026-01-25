import { useCurrentUser } from './useCurrentUser';
import { PermissionLevel } from '../types';

export interface PlantOperationsAccess {
  canRead: boolean;
  canWrite: boolean;
  permissionLevel: PermissionLevel;
}

/**
 * Hook to determine access level for Plant Operations modules (CM or RKC).
 * Uses permissions sourced from 'user_management' collection via useCurrentUser.
 *
 * @param section 'CM' or 'RKC', defaults to 'CM'
 * @returns Object containing access flags
 */
export const usePlantOperationsAccess = (section: 'CM' | 'RKC' = 'CM'): PlantOperationsAccess => {
  const { currentUser } = useCurrentUser();

  // Default to NONE if no user or permissions
  if (!currentUser || !currentUser.permissions) {
    return {
      canRead: false,
      canWrite: false,
      permissionLevel: 'NONE',
    };
  }

  // Get the specific permission level based on section
  // permissions property is already populated from user_management by useCurrentUser hook
  const permissionLevel =
    section === 'RKC'
      ? currentUser.permissions.rkc_plant_operations
      : currentUser.permissions.cm_plant_operations;

  return {
    canRead: permissionLevel === 'READ' || permissionLevel === 'WRITE',
    canWrite: permissionLevel === 'WRITE',
    permissionLevel: permissionLevel || 'NONE',
  };
};
