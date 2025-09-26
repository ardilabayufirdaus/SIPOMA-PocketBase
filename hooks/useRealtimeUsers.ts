import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { UserRole, PermissionMatrix } from '../types';
import { getDefaultPermissionsForRole } from '../utils/tonasaPermissions';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
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
    sortField = 'created_at',
    sortDirection = 'desc',
    currentPage = 1,
    itemsPerPage = 10,
  } = options;

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`
        );
      }

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Process users and add default permissions if not present
      const processedUsers = (data || []).map((user) => ({
        ...user,
        permissions: user.permissions || getDefaultPermissionsForRole(user.role),
      }));

      setUsers(processedUsers);
      setTotalUsers(count || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, sortField, sortDirection, currentPage, itemsPerPage]);

  // Real-time subscription with immediate UI updates
  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel('realtime_users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('Real-time user change:', payload.eventType, payload.new || payload.old);

          // Handle real-time updates without full refetch for better performance
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                setUsers((prev) => {
                  const newUser = payload.new as User;
                  // Check if user matches current filters
                  const matchesSearch =
                    !searchTerm ||
                    newUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    newUser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    newUser.role.toLowerCase().includes(searchTerm.toLowerCase());

                  const matchesRole = roleFilter === 'all' || newUser.role === roleFilter;

                  if (matchesSearch && matchesRole) {
                    return [newUser, ...prev].slice(0, itemsPerPage);
                  }
                  return prev;
                });
                setTotalUsers((prev) => prev + 1);
              }
              break;

            case 'UPDATE':
              if (payload.new) {
                setUsers((prev) =>
                  prev.map((user) => (user.id === payload.new.id ? (payload.new as User) : user))
                );
              }
              break;

            case 'DELETE':
              if (payload.old) {
                setUsers((prev) => prev.filter((user) => user.id !== payload.old.id));
                setTotalUsers((prev) => prev - 1);
              }
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

  return {
    users,
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
