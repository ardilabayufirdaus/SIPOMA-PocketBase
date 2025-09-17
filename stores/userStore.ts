import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { User } from '../types';
import { SHA256 } from 'crypto-js';

interface UserManagementState {
  users: User[];
  roles: any[];
  permissions: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Actions
  fetchUsers: (page?: number, limit?: number, includePermissions?: boolean) => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  createUser: (userData: any) => Promise<User>;
  updateUser: (userId: string, userData: any) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  assignPermissions: (userId: string, permissionIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserManagementState>((set, get) => ({
  users: [],
  roles: [],
  permissions: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },

  fetchUsers: async (page = 1, limit = 20, includePermissions = false) => {
    set({ isLoading: true, error: null });
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('users')
        .select(
          includePermissions
            ? `
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
            : `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const transformedUsers: User[] = (data || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name || undefined,
        role: user.role,
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at),
        permissions: includePermissions
          ? user.user_permissions?.reduce((acc: Record<string, any>, up: any) => {
              const perm = up.permissions;
              if (perm) {
                acc[perm.module_name] = {
                  level: perm.permission_level,
                  plantUnits: perm.plant_units || [],
                };
              }
              return acc;
            }, {}) || {}
          : {},
      }));

      set({
        users: page === 1 ? transformedUsers : [...get().users, ...transformedUsers],
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > page * limit,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoles: async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('name');

      if (error) throw error;
      set({ roles: data || [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch roles' });
    }
  },

  fetchPermissions: async () => {
    try {
      const { data, error } = await supabase.from('permissions').select('*').order('module_name');

      if (error) throw error;
      set({ permissions: data || [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch permissions' });
    }
  },

  createUser: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      if (!userData.password) {
        throw new Error('Password is required for new users');
      }
      const passwordHash = SHA256(userData.password).toString();

      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          password_hash: passwordHash,
          full_name: userData.full_name,
          role: userData.role,
          is_active: userData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      await get().fetchUsers();
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create user' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (userId: string, userData: any) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: any = {
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (userData.password) {
        updateData.password_hash = SHA256(userData.password).toString();
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await get().fetchUsers();
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update user' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      await get().fetchUsers();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete user' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  assignPermissions: async (userId: string, permissionIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      // Remove existing permissions
      await supabase.from('user_permissions').delete().eq('user_id', userId);

      // Add new permissions
      if (permissionIds.length > 0) {
        const permissionInserts = permissionIds.map((permissionId) => ({
          user_id: userId,
          permission_id: permissionId,
        }));

        const { error } = await supabase.from('user_permissions').insert(permissionInserts);

        if (error) throw error;
      }

      await get().fetchUsers();
    } catch (err: any) {
      set({ error: err.message || 'Failed to assign permissions' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
