import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '../types';
import { SHA256 } from 'crypto-js';

export const useUserManagement = (currentUser?: User | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users with their permissions
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match User type
      const transformedUsers: User[] = (data || []).map((user) => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name || undefined,
        role: user.role,
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at),
        // Transform permissions to the expected format
        permissions:
          user.user_permissions?.reduce((acc: any, up: any) => {
            const perm = up.permissions;
            if (perm) {
              acc[perm.module_name] = {
                level: perm.permission_level,
                plantUnits: perm.plant_units || [],
              };
            }
            return acc;
          }, {}) || {},
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new user
  const addUser = useCallback(
    async (userData: { username: string; password: string; full_name?: string; role: string }) => {
      try {
        // Hash the password
        const password_hash = SHA256(userData.password).toString();

        const { data, error } = await (supabase as any)
          .from('users')
          .insert([
            {
              username: userData.username,
              password_hash,
              full_name: userData.full_name,
              role: userData.role,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Refresh users list
        await fetchUsers();

        return data;
      } catch (error) {
        console.error('Error adding user:', error);
        throw error;
      }
    },
    [fetchUsers]
  );

  // Update existing user
  const updateUser = useCallback(
    async (
      userId: string,
      userData: {
        username?: string;
        password?: string;
        full_name?: string;
        role?: string;
        is_active?: boolean;
      }
    ) => {
      try {
        const updateData: any = {};

        if (userData.username) updateData.username = userData.username;
        if (userData.password) updateData.password_hash = SHA256(userData.password).toString();
        if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
        if (userData.role) updateData.role = userData.role;
        if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

        const { data, error } = await (supabase as any)
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;

        // Refresh users list
        await fetchUsers();

        return data;
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },
    [fetchUsers]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        const { error } = await (supabase as any).from('users').delete().eq('id', userId);

        if (error) throw error;

        // Refresh users list
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },
    [fetchUsers]
  );

  // Toggle user active status
  const toggleUserStatus = useCallback(
    async (userId: string) => {
      try {
        // Get current status
        const user = users.find((u) => u.id === userId);
        if (!user) throw new Error('User not found');

        const { data, error } = await (supabase as any)
          .from('users')
          .update({ is_active: !user.is_active })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;

        // Refresh users list
        await fetchUsers();

        return data;
      } catch (error) {
        console.error('Error toggling user status:', error);
        throw error;
      }
    },
    [users, fetchUsers]
  );

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loading,
    refetch: fetchUsers,
  };
};
