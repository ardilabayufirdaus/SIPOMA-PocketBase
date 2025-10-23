import { useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { UserRole, PermissionMatrix } from '../types';
import { getDefaultPermissionsForRole } from '../utils/tonasaPermissions';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string; // Maps to 'created' in PocketBase
  updated_at: string; // Maps to 'updated' in PocketBase
  avatar_url?: string; // Maps to 'avatar' in PocketBase
  last_active?: string;
  permissions: PermissionMatrix;
}

interface UseRealtimeUsersOptions {
  searchTerm?: string;
  roleFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  currentPage?: number;
  itemsPerPage?: number;
}

export const useRealtimeUsers = (options: UseRealtimeUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const {
    searchTerm = '',
    roleFilter = 'all',
    sortField = 'created', // Field name in PocketBase is 'created', not 'created_at'
    sortDirection = 'desc',
    currentPage = 1,
    itemsPerPage = 10,
  } = options;

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build filter
      let filter = '';
      const filterParts = [];

      // Apply search filter - ensure proper spacing in PocketBase filter syntax
      if (searchTerm) {
        filterParts.push(
          `(username ~ "${searchTerm}" || name ~ "${searchTerm}" || role ~ "${searchTerm}")`
        );
      }

      // Apply role filter - ensure proper spacing in PocketBase filter syntax
      if (roleFilter !== 'all') {
        filterParts.push(`role = "${roleFilter}"`);
      }

      // Join filter parts with proper spacing for PocketBase syntax
      filter = filterParts.length > 0 ? filterParts.join(' && ') : '';

      // Build sort string - make sure to use the correct field name for PocketBase
      // If sortField is 'created_at', convert it to 'created' for PocketBase
      const actualSortField = sortField === 'created_at' ? 'created' : sortField;
      const sort = sortDirection === 'asc' ? actualSortField : `-${actualSortField}`;

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Sort field conversion:', {
          original: sortField,
          converted: actualSortField,
          finalSort: sort,
        });
      }

      // Create a clean options object with type assertion
      const requestOptions: {
        sort: string;
        filter?: string;
        fields?: string;
      } = { sort };

      // Only add filter if not empty string
      if (filter && filter.trim() !== '') {
        requestOptions.filter = filter;
      }

      // Add specific fields we need to reduce response size
      requestOptions.fields =
        'id,username,name,role,is_active,created,updated,avatar,last_active,permissions';

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('PocketBase request options:', JSON.stringify(requestOptions));
      }

      // Use the standard API with proper options
      const result = await pb
        .collection('users')
        .getList(currentPage, itemsPerPage, requestOptions);

      // Debug user data
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Raw user data from PocketBase:', result.items[0]);
      }

      // Process users and fetch their permissions from user_permissions collection
      const processedUsers = await Promise.all(
        (result.items || []).map(async (user) => {
          // Generate avatar URL from PocketBase if avatar exists
          let avatarUrl = '';
          if (user.avatar) {
            // Gunakan method yang benar dari PocketBase SDK
            avatarUrl = pb.files.getUrl(user, user.avatar);
            // Debug avatar URL
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log(`Avatar data for ${user.username}:`, {
                rawAvatar: user.avatar,
                generatedUrl: avatarUrl,
              });
            }
          }

          // Fetch permissions from user_permissions collection
          let userPermissions: PermissionMatrix;
          try {
            const permissionRecords = await pb.collection('user_permissions').getFullList({
              filter: `user_id = '${user.id}'`,
              fields: 'permissions_data',
            });

            if (permissionRecords.length > 0) {
              userPermissions = JSON.parse(permissionRecords[0].permissions_data);
            } else {
              // Use default permissions if no custom permissions found
              userPermissions = await getDefaultPermissionsForRole(user.role);
            }
          } catch (error) {
            // If permission fetch fails, use default permissions
            console.warn(
              `Failed to fetch permissions for user ${user.username}, using defaults:`,
              error
            );
            userPermissions = await getDefaultPermissionsForRole(user.role);
          }

          return {
            id: user.id,
            username: user.username,
            full_name: user.name, // PocketBase menggunakan 'name' bukan 'full_name'
            role: user.role,
            is_active: user.is_active,
            created_at: user.created,
            updated_at: user.updated,
            avatar_url: avatarUrl,
            last_active: user.last_active,
            permissions: userPermissions,
          };
        })
      );

      // Remove any potential duplicates based on user ID
      const uniqueUsers = processedUsers.filter(
        (user, index, self) => index === self.findIndex((u) => u.id === user.id)
      );

      setUsers(uniqueUsers);
      setTotalUsers(result.totalItems || 0);
      setError('');
    } catch (err) {
      // Ignore auto-cancellation errors which happen during component unmount
      if (err.message?.includes('autocancelled')) {
        // Auto-cancelled request, this is normal during component unmount
        return;
      }

      // Try to extract as much information as possible from the error
      const pbError = err as {
        status?: number;
        data?: { message?: string };
        message?: string;
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };

      // Build a more informative error message
      let errorMessage = 'Failed to fetch users';

      // First try standard error properties
      if (pbError.status) {
        errorMessage += ` (Status: ${pbError.status})`;
      } else if (pbError.response?.status) {
        errorMessage += ` (Status: ${pbError.response.status})`;
      }

      // Then try to get detailed message
      if (pbError.data?.message) {
        errorMessage += `: ${pbError.data.message}`;
      } else if (pbError.response?.data?.message) {
        errorMessage += `: ${pbError.response.data.message}`;
      } else if (pbError.message) {
        errorMessage += `: ${pbError.message}`;
      }

      // Handle other errors - log in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error fetching users:', {
          error: err,
          status: pbError.status || pbError.response?.status,
          data: pbError.data || pbError.response?.data,
          requestURL: `/api/collections/users/records?page=${currentPage}&perPage=${itemsPerPage}&sort=${sortDirection === 'asc' ? sortField : `-${sortField}`}`,
          options: { currentPage, itemsPerPage, searchTerm, roleFilter, sortField, sortDirection },
        });
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, sortField, sortDirection, currentPage, itemsPerPage]);

  // Add profile update listener
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUsers(); // Refetch all users when profile is updated
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [fetchUsers]);

  // Real-time subscription with immediate UI updates
  useEffect(() => {
    // Use AbortController for clean cancellation
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Wrapper function for fetchUsers to handle abortion
    const fetchWithAbortSignal = async () => {
      try {
        await fetchUsers();
      } catch (err) {
        // If aborted, silently ignore
        if (signal.aborted) return;

        // Otherwise rethrow
        throw err;
      }
    };

    fetchWithAbortSignal();

    let unsubscribe: (() => void) | undefined;

    pb.collection('users')
      .subscribe('*', (e) => {
        // Handle real-time updates without full refetch for better performance
        switch (e.action) {
          case 'create':
            if (e.record) {
              const newUser = {
                id: e.record.id,
                username: e.record.username,
                full_name: e.record.name, // PocketBase menggunakan 'name' bukan 'full_name'
                role: e.record.role,
                is_active: e.record.is_active,
                created_at: e.record.created,
                updated_at: e.record.updated,
                avatar_url: e.record.avatar ? pb.files.getUrl(e.record, e.record.avatar) : '',
                last_active: e.record.last_active,
                permissions: e.record.permissions || getDefaultPermissionsForRole(e.record.role),
              };

              // Check if user matches current filters
              const matchesSearch =
                !searchTerm ||
                newUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                newUser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || // Ini sudah menggunakan nilai dari field 'name' yang dimapping ke 'full_name'
                newUser.role.toLowerCase().includes(searchTerm.toLowerCase());

              const matchesRole = roleFilter === 'all' || newUser.role === roleFilter;

              if (matchesSearch && matchesRole) {
                setUsers((prev) => {
                  // Check if user already exists to prevent duplicates
                  const existingIndex = prev.findIndex((u) => u.id === newUser.id);
                  if (existingIndex >= 0) {
                    // User already exists, update it instead
                    const updated = [...prev];
                    updated[existingIndex] = newUser;
                    return updated;
                  } else {
                    // Add new user at the beginning and slice to maintain page size
                    return [newUser, ...prev].slice(0, itemsPerPage);
                  }
                });
              }
              setTotalUsers((prev) => prev + 1);
            }
            break;

          case 'update':
            if (e.record) {
              const updatedUser = {
                id: e.record.id,
                username: e.record.username,
                full_name: e.record.name, // PocketBase menggunakan 'name' bukan 'full_name'
                role: e.record.role,
                is_active: e.record.is_active,
                created_at: e.record.created,
                updated_at: e.record.updated,
                avatar_url: e.record.avatar ? pb.files.getUrl(e.record, e.record.avatar) : '',
                last_active: e.record.last_active,
                permissions: e.record.permissions || getDefaultPermissionsForRole(e.record.role),
              };

              setUsers((prev) =>
                prev.map((user) => (user.id === e.record.id ? updatedUser : user))
              );
            }
            break;

          case 'delete':
            if (e.record) {
              setUsers((prev) => prev.filter((user) => user.id !== e.record.id));
              setTotalUsers((prev) => prev - 1);
            }
            break;
        }
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchUsers, searchTerm, roleFilter, itemsPerPage]);

  // Optimistic update functions
  const optimisticUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)));
  }, []);

  const optimisticDeleteUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    setTotalUsers((prev) => prev - 1);
  }, []);

  const optimisticAddUser = useCallback(
    (newUser: User) => {
      setUsers((prev) => [newUser, ...prev.slice(0, itemsPerPage - 1)]);
      setTotalUsers((prev) => prev + 1);
    },
    [itemsPerPage]
  );

  // Deduplicate users to prevent React key warnings
  const deduplicatedUsers = useMemo(() => {
    return users.filter((user, index, self) => index === self.findIndex((u) => u.id === user.id));
  }, [users]);

  return {
    users: deduplicatedUsers,
    totalUsers,
    isLoading,
    error,
    setError,
    refetch: fetchUsers,
    optimisticUpdateUser,
    optimisticDeleteUser,
    optimisticAddUser,
  };
};

