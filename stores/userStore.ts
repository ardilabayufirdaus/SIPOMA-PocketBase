import { create } from 'zustand';
import { pb } from '../utils/pocketbase-simple';
import { User } from '../types';
import { passwordUtils } from '../utils/passwordUtils';
import { buildPermissionMatrix } from '../utils/permissionUtils';
import { dbCache } from '../utils/cacheUtils';
import { debouncer } from '../utils/batchUtils';

interface UserManagementState {
  users: User[];
  roles: any[];
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
    let unsubscribeUsers: (() => void) | undefined;

    // Subscribe to users collection changes
    pb.collection('users')
      .subscribe('*', (e) => {
        // Debounce real-time updates to reduce database load
        debouncer.debounce(() => {
          set((state) => {
            let updatedUsers = [...state.users];

            if (e.action === 'create' && e.record) {
              const newUser: User = {
                id: e.record.id,
                username: e.record.username,
                full_name: e.record.full_name || undefined,
                role: e.record.role,
                is_active: e.record.is_active,
                created_at: new Date(e.record.created),
                updated_at: new Date(e.record.updated),
                permissions: {
                  dashboard: 'NONE',
                  cm_plant_operations: 'NONE',
                  rkc_plant_operations: 'NONE',
                  project_management: 'NONE',
                  database: 'NONE',
                  inspection: 'NONE',
                },
              };
              updatedUsers.unshift(newUser); // Add to top
              // Invalidate cache on data changes
              dbCache.invalidateUsers();
            } else if (e.action === 'update' && e.record) {
              updatedUsers = updatedUsers.map((user) =>
                user.id === e.record.id
                  ? {
                      ...user,
                      username: e.record.username,
                      full_name: e.record.full_name || undefined,
                      role: e.record.role,
                      is_active: e.record.is_active,
                      avatar_url: e.record.avatar
                        ? pb.files.getUrl(e.record, e.record.avatar)
                        : user.avatar_url,
                      updated_at: new Date(e.record.updated),
                    }
                  : user
              );
              dbCache.invalidateUsers();
            } else if (e.action === 'delete' && e.record) {
              updatedUsers = updatedUsers.filter((user) => user.id !== e.record.id);
              dbCache.invalidateUsers();
            }

            return { users: updatedUsers };
          });
        });
      })
      .then((unsub) => {
        unsubscribeUsers = unsub;
      });

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  },

  cleanupRealtimeSubscription: () => {
    // For now, cleanup is handled by the unsubscribe function returned by initRealtimeSubscription
  },

  fetchUsers: async (page = 1, limit = 20, includePermissions = false) => {
    set({ isLoading: true, error: null });

    // Check cache first
    const cached = dbCache.getUsers(page, limit);
    if (cached && !includePermissions) {
      // Don't cache permission-included queries for security
      set({
        users: page === 1 ? cached.users : [...get().users, ...cached.users],
        pagination: {
          page,
          limit,
          total: cached.total,
          hasMore: cached.total > page * limit,
        },
        isLoading: false,
      });
      return;
    }

    try {
      const result = await pb.collection('users').getList(page, limit, {
        sort: '-created',
      });

      const transformedUsers: User[] = await Promise.all(
        result.items.map(async (user: any) => {
          let permissions = {
            dashboard: 'NONE',
            cm_plant_operations: 'NONE',
            rkc_plant_operations: 'NONE',
            project_management: 'NONE',
            database: 'NONE',
            inspection: 'NONE',
          };

          if (includePermissions) {
            try {
              const permRecord = await pb.collection('user_management').getList(1, 1, {
                filter: `user_id = "${user.id}"`,
              });
              if (permRecord.items.length > 0) {
                const p = permRecord.items[0];
                permissions = {
                  dashboard: p.dashboard || 'NONE',
                  cm_plant_operations: p.cm_plant_operations || 'NONE',
                  rkc_plant_operations: p.rkc_plant_operations || 'NONE',
                  project_management: p.project_management || 'NONE',
                  database: p.database || 'NONE',
                  inspection: p.inspection || 'NONE',
                };
              }
            } catch (e) {
              console.warn(`Failed to fetch permissions for user ${user.id}`, e);
            }
          }

          return {
            id: user.id,
            username: user.username,
            full_name: user.name || undefined,
            role: user.role,
            is_active: user.is_active,
            created_at: new Date(user.created),
            updated_at: new Date(user.updated),
            permissions: permissions as any,
          };
        })
      );

      // Cache the result if not including permissions
      if (!includePermissions) {
        dbCache.setUsers(page, limit, { users: transformedUsers, total: result.totalItems });
      }

      set({
        users: page === 1 ? transformedUsers : [...get().users, ...transformedUsers],
        pagination: {
          page,
          limit,
          total: result.totalItems,
          hasMore: result.totalItems > page * limit,
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
      const result = await pb.collection('roles').getFullList({
        sort: 'name',
      });
      set({ roles: result });
    } catch {
      set({ error: 'Failed to fetch roles' });
    }
  },

  createUser: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      if (!userData.password) {
        throw new Error('Password is required for new users');
      }

      // Create user in PocketBase
      const newUser = await pb.collection('users').create({
        username: userData.username,
        password: userData.password, // PocketBase will hash it automatically
        passwordConfirm: userData.password, // PocketBase requires password confirmation
        name: userData.full_name || '', // PocketBase menggunakan field 'name' bukan 'full_name'
        role: userData.role,
        is_active: userData.is_active ?? true,
      });

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      // Create permissions record in user_management
      const perms = userData.permissions || {
        dashboard: 'NONE',
        cm_plant_operations: 'NONE',
        rkc_plant_operations: 'NONE',
        project_management: 'NONE',
        database: 'NONE',
        inspection: 'NONE',
      };

      await pb.collection('user_management').create({
        user_id: newUser.id,
        ...perms,
      });

      // Map PocketBase response to our User type
      const mappedUser = {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.name,
        role: newUser.role,
        is_active: newUser.is_active,
        avatar_url: newUser.avatar ? pb.files.getUrl(newUser, newUser.avatar) : null,
        created_at: new Date(newUser.created),
        updated_at: new Date(newUser.updated),
        permissions: perms as any,
      };

      // No need to fetchUsers, realtime will update
      return mappedUser;
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
      // Don't send avatar_url to PocketBase as it uses 'avatar' field for file uploads
      // Avatar uploads are handled separately in ProfileEditModal
      const updateData: Record<string, unknown> = {
        username: userData.username,
        name: userData.full_name, // PocketBase menggunakan field 'name' bukan 'full_name'
        role: userData.role,
        is_active: userData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (userData.password) {
        updateData.password_hash = await passwordUtils.hash(userData.password);
      }

      // Update user data in PocketBase
      const updatedUser = await pb.collection('users').update(userId, updateData);

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Manually trigger a refresh for all connected clients
      pb.collection('users').authRefresh();

      // Update permissions in user_management if provided
      if (userData.permissions) {
        const permRecord = await pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${userId}"`,
        });

        if (permRecord.items.length > 0) {
          await pb
            .collection('user_management')
            .update(permRecord.items[0].id, userData.permissions);
        } else {
          await pb.collection('user_management').create({
            user_id: userId,
            ...userData.permissions,
          });
        }
      }

      // Map PocketBase response to our User type
      const mappedUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        full_name: updatedUser.name,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        avatar_url: updatedUser.avatar ? pb.files.getUrl(updatedUser, updatedUser.avatar) : null,
        created_at: new Date(updatedUser.created),
        updated_at: new Date(updatedUser.updated),
        permissions: userData.permissions || {},
      };

      // No need to fetchUsers, realtime will update
      return mappedUser;
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
      // Delete user from PocketBase
      await pb.collection('users').delete(userId);

      // No need to fetchUsers, realtime will update
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete user' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  assignPermissions: async (userId: string, permissions: any) => {
    set({ isLoading: true, error: null });
    try {
      // Find existing permission record
      const permRecord = await pb.collection('user_management').getList(1, 1, {
        filter: `user_id = "${userId}"`,
      });

      if (permRecord.items.length > 0) {
        await pb.collection('user_management').update(permRecord.items[0].id, permissions);
      } else {
        await pb.collection('user_management').create({
          user_id: userId,
          ...permissions,
        });
      }

      // Refresh users list after updating permissions
      await get().fetchUsers(1, get().pagination.limit, true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign permissions';
      set({ error: errorMessage });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
