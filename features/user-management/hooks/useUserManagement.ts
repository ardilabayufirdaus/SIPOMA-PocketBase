import { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

interface UserManagementOptions {
  autoFetch?: boolean;
}

export const useUserManagement = (options: UserManagementOptions = {}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { autoFetch = true } = options;

  useEffect(() => {
    if (autoFetch && currentUser) {
      fetchUsers();
      fetchRoles();
      fetchPermissions();
    }
  }, [autoFetch, currentUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase.from('permissions').select('*').order('module_name');

      if (error) throw error;
      setPermissions(data || []);
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
      await fetchUsers();
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
      await fetchUsers();
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
      await fetchUsers();
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
    fetchUsers,
    fetchRoles,
    fetchPermissions,
    createUser,
    updateUser,
    deleteUser,
    assignPermissions,
    clearError: () => setError(''),
  };
};
