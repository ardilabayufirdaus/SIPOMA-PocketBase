import { useCurrentUser } from './useCurrentUser';
import { PermissionLevel } from '../types';

export interface PlantOperationsAccess {
  canRead: boolean;
  canWrite: boolean;
  permissionLevel: PermissionLevel;
}

/**
 * Hook to determine access level for Plant Operations modules (CM, RKC, or DERIVATIVE).
 * Uses permissions sourced from 'user_management' collection via useCurrentUser.
 *
 * @param section 'CM' | 'RKC' | 'DERIVATIVE', defaults to 'CM'
 * @returns Object containing access flags
 */
export const usePlantOperationsAccess = (
  section: 'CM' | 'RKC' | 'DERIVATIVE' = 'CM'
): PlantOperationsAccess => {
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
  let permissionLevel: PermissionLevel = 'NONE';
  if (section === 'RKC') {
    permissionLevel = currentUser.permissions.rkc_plant_operations || 'NONE';
  } else if (section === 'DERIVATIVE') {
    permissionLevel =
      currentUser.permissions.derivative_plant_operations ||
      currentUser.permissions.cm_plant_operations ||
      'NONE';
  } else {
    permissionLevel = currentUser.permissions.cm_plant_operations || 'NONE';
  }

  return {
    canRead: permissionLevel === 'READ' || permissionLevel === 'WRITE',
    canWrite: permissionLevel === 'WRITE',
    permissionLevel: permissionLevel || 'NONE',
  };
};
