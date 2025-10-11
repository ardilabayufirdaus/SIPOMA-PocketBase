import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
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
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setUsers(data || []);
      setTotalUsers(count || 0);
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
      const { data, error } = await supabase.from('roles').select('*').order('name');

      if (error) throw error;
      setRoles(data || []);
      cacheManager.set(cacheKey, data || [], 60); // Cache for 1 hour
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
      const { data, error } = await supabase.from('permissions').select('*').order('module_name');

      if (error) throw error;
      setPermissions(data || []);
      cacheManager.set(cacheKey, data || [], 60); // Cache for 1 hour
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.message || 'Failed to fetch permissions');
    }
  };

  const createUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('users').insert(userData).select().single();

      if (error) throw error;
      refreshUsers();
      return data;
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
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      refreshUsers();
      return data;
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
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;
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
      await supabase.from('user_permissions').delete().eq('user_id', userId);

      // Then, add new permissions
      if (permissionIds.length > 0) {
        const permissionInserts = permissionIds.map((permissionId) => ({
          user_id: userId,
          permission_id: permissionId,
        }));

        const { error } = await supabase.from('user_permissions').insert(permissionInserts);

        if (error) throw error;
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
