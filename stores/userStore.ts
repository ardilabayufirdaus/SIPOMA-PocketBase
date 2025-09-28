import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { User } from '../types';
import { passwordUtils } from '../utils/passwordUtils';
import { buildPermissionMatrix } from '../utils/permissionUtils';

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

  // Realtime subscription management
  initRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
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

  // Realtime subscription
  initRealtimeSubscription: () => {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('Realtime user change:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          set((state) => {
            let updatedUsers = [...state.users];

            if (eventType === 'INSERT' && newRecord) {
              const newUser: User = {
                id: newRecord.id,
                username: newRecord.username,
                full_name: newRecord.full_name || undefined,
                role: newRecord.role,
                is_active: newRecord.is_active,
                created_at: new Date(newRecord.created_at),
                updated_at: new Date(newRecord.updated_at),
                permissions: buildPermissionMatrix([]),
              };
              updatedUsers.unshift(newUser); // Add to top
            } else if (eventType === 'UPDATE' && newRecord) {
              updatedUsers = updatedUsers.map((user) =>
                user.id === newRecord.id
                  ? {
                      ...user,
                      username: newRecord.username,
                      full_name: newRecord.full_name || undefined,
                      role: newRecord.role,
                      is_active: newRecord.is_active,
                      updated_at: new Date(newRecord.updated_at),
                    }
                  : user
              );
            } else if (eventType === 'DELETE' && oldRecord) {
              updatedUsers = updatedUsers.filter((user) => user.id !== oldRecord.id);
            }

            return { users: updatedUsers };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permissions',
        },
        (payload) => {
          console.log('Realtime permission change:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          set((state) => {
            let updatedPermissions = [...state.permissions];

            if (eventType === 'INSERT' && newRecord) {
              updatedPermissions.unshift(newRecord);
            } else if (eventType === 'UPDATE' && newRecord) {
              updatedPermissions = updatedPermissions.map((perm) =>
                perm.id === newRecord.id ? newRecord : perm
              );
            } else if (eventType === 'DELETE' && oldRecord) {
              updatedPermissions = updatedPermissions.filter((perm) => perm.id !== oldRecord.id);
            }

            return { permissions: updatedPermissions };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roles',
        },
        (payload) => {
          console.log('Realtime role change:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          set((state) => {
            let updatedRoles = [...state.roles];

            if (eventType === 'INSERT' && newRecord) {
              updatedRoles.unshift(newRecord);
            } else if (eventType === 'UPDATE' && newRecord) {
              updatedRoles = updatedRoles.map((role) =>
                role.id === newRecord.id ? newRecord : role
              );
            } else if (eventType === 'DELETE' && oldRecord) {
              updatedRoles = updatedRoles.filter((role) => role.id !== oldRecord.id);
            }

            return { roles: updatedRoles };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_permissions',
        },
        async (payload) => {
          console.log('Realtime user_permissions change:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          // For user_permissions changes, we need to refetch the affected user's permissions
          const record = newRecord || oldRecord;
          if (record && (record as any).user_id) {
            const userId = (record as any).user_id;
            try {
              // Refetch permissions for this user
              const { data: userPermissions, error } = await supabase
                .from('user_permissions')
                .select(
                  `
                  permissions (
                    module_name,
                    permission_level,
                    plant_units
                  )
                `
                )
                .eq('user_id', userId);

              if (!error && userPermissions) {
                const permissionsMatrix = buildPermissionMatrix(userPermissions);

                set((state) => ({
                  users: state.users.map((user) =>
                    user.id === userId ? { ...user, permissions: permissionsMatrix } : user
                  ),
                }));
              }
            } catch (err) {
              console.error('Error refetching user permissions:', err);
            }
          }
        }
      )
      .subscribe();

    // Store channel for cleanup if needed
    (get() as any).realtimeChannel = channel;
  },

  cleanupRealtimeSubscription: () => {
    const state = get() as any;
    if (state.realtimeChannel) {
      state.realtimeChannel.unsubscribe();
      state.realtimeChannel = null;
    }
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
      const passwordHash = await passwordUtils.hash(userData.password);

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

      // No need to fetchUsers, realtime will update
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
        avatar_url: userData.avatar_url,
        updated_at: new Date().toISOString(),
      };

      if (userData.password) {
        updateData.password_hash = await passwordUtils.hash(userData.password);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // No need to fetchUsers, realtime will update
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

      // No need to fetchUsers, realtime will update
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
