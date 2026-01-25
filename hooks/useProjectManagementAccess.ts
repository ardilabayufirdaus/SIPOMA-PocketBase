import { usePermissions } from '../utils/permissions';
import { useCurrentUser } from './useCurrentUser';

export const useProjectManagementAccess = () => {
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);

  const canRead = permissionChecker.hasPermission('project_management', 'READ');
  const canWrite = permissionChecker.hasPermission('project_management', 'WRITE');

  return {
    canRead,
    canWrite,
  };
};
