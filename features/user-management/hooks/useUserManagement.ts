import { useState, useEffect } from 'react';
import { pb } from '../../../utils/pocketbase';
import { useAuth } from '../../../hooks/useAuth';
import { cacheManager } from '../../../utils/cacheManager';

interface UserManagementOptions {
  autoFetch?: boolean;
  pageSize?: number;
}

export const useUserManagement = (options: UserManagementOptions = {}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const { autoFetch = true, pageSize = 50 } = options;

  useEffect(() => {
    if (autoFetch && currentUser) {
      fetchUsers(1);
      fetchRoles();
      fetchPermissions();
    }
  }, [autoFetch, currentUser]);

  const goToPage = (page: number) => {
    fetchUsers(page);
  };

  const refreshUsers = () => {
    fetchUsers(currentPage);
  };

  const fetchUsers = async (page: number = 1) => {
    try {
      setIsLoading(true);

      const result = await pb.collection('users').getList(page, pageSize, {
        sort: '-created',
      });

      setUsers(result.items || []);
      setTotalUsers(result.totalItems || 0);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    const cacheKey = 'roles';
    const cached = cacheManager.get<any[]>(cacheKey);
    if (cached) {
      setRoles(cached);
      return;
    }

    try {
      const result = await pb.collection('roles').getFullList({
        sort: 'name',
      });

      setRoles(result || []);
      cacheManager.set(cacheKey, result || [], 60); // Cache for 1 hour
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
    }
  };

  const fetchPermissions = async () => {
    const cacheKey = 'permissions';
    const cached = cacheManager.get<any[]>(cacheKey);
    if (cached) {
      setPermissions(cached);
      return;
    }

    try {
      const result = await pb.collection('permissions').getFullList({
        sort: 'module_name',
      });

      setPermissions(result || []);
      cacheManager.set(cacheKey, result || [], 60); // Cache for 1 hour
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.message || 'Failed to fetch permissions');
    }
  };

  const createUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const result = await pb.collection('users').create(userData);

      refreshUsers();
      return result;
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: any) => {
    try {
      setIsLoading(true);
      const result = await pb.collection('users').update(userId, userData);

      refreshUsers();
      return result;
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      await pb.collection('users').delete(userId);

      refreshUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const assignPermissions = async (userId: string, permissionIds: string[]) => {
    try {
      setIsLoading(true);

      // First, remove existing permissions
      const existingPermissions = await pb.collection('user_permissions').getFullList({
        filter: `user_id="${userId}"`,
      });

      for (const perm of existingPermissions) {
        await pb.collection('user_permissions').delete(perm.id);
      }

      // Then, add new permissions
      if (permissionIds.length > 0) {
        const permissionInserts = permissionIds.map((permissionId) => ({
          user_id: userId,
          permission_id: permissionId,
        }));

        for (const permData of permissionInserts) {
          await pb.collection('user_permissions').create(permData);
        }
      }
    } catch (err: any) {
      console.error('Error assigning permissions:', err);
      setError(err.message || 'Failed to assign permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    roles,
    permissions,
    isLoading,
    error,
    currentPage,
    totalUsers,
    pageSize,
    fetchUsers,
    fetchRoles,
    fetchPermissions,
    createUser,
    updateUser,
    deleteUser,
    assignPermissions,
    goToPage,
    refreshUsers,
    clearError: () => setError(''),
  };
};

