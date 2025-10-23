import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { User, UserRole, PermissionMatrix } from '../types';
import useErrorHandler from './useErrorHandler';

// Interface for PocketBase user records
interface PocketBaseUser {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  role: string;
  avatar?: string;
  last_active?: string;
  is_active?: boolean;
  created: string;
  updated: string;
  permissions?: Record<string, unknown>;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Check if user is authenticated using secureStorage instead of pb.authStore
      const { secureStorage } = await import('../utils/secureStorage');
      const currentUser = secureStorage.getItem('currentUser');
      if (!currentUser) {
        // User not authenticated, cannot fetch users list
        setUsers([]);
        setLoading(false);
        return;
      }

      const records = await pb.collection('users').getFullList({
        sort: '-created',
        fields:
          'id,username,email,full_name,role,avatar,last_active,is_active,created,updated,permissions',
      });

      // Use the PocketBaseUser interface defined at the top

      const parsedData = records.map((record) => {
        const user = record as unknown as PocketBaseUser;
        return {
          id: user.id,
          username: user.username,
          email: user.email || '',
          full_name: user.full_name || '',
          role: user.role as UserRole,
          avatar_url: user.avatar,
          last_active: user.last_active ? new Date(user.last_active) : new Date(),
          is_active: user.is_active !== false,
          created_at: new Date(user.created),
          updated_at: new Date(user.updated),
          permissions: (user.permissions || {}) as unknown as PermissionMatrix,
        };
      });
      setUsers(parsedData);
    } catch (error: unknown) {
      // Handle specific error types
      const err = error as { status?: number; message?: string };
      if (err.status === 403 || err.status === 401) {
        // Unauthorized to access users collection
        setUsers([]);
      } else if (err.message?.includes('autocancelled')) {
        // Request was autocancelled, ignoring
      } else {
        handleError(error, 'Error fetching users');
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers };
};

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setLoading(true);
      try {
        // Get user from localStorage (custom auth)
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);

        // Verify user is still active by checking database
        const userRecord = await pb.collection('users').getOne(userData.id);

        if (!userRecord) {
          // User not found, clear localStorage
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        } else {
          // Convert PocketBase record to our User type
          const pocketBaseUser = userRecord as unknown as PocketBaseUser;

          if (pocketBaseUser.is_active === false) {
            // User inactive, clear session
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
          } else {
            // User active, set current user
            const currentUser: User = {
              id: pocketBaseUser.id,
              username: pocketBaseUser.username,
              full_name: pocketBaseUser.full_name || '',
              role: pocketBaseUser.role as UserRole,
              is_active: true,
              created_at: new Date(pocketBaseUser.created),
              updated_at: new Date(pocketBaseUser.updated),
              last_active: pocketBaseUser.last_active
                ? new Date(pocketBaseUser.last_active)
                : undefined,
              permissions: userData.permissions, // Use the permissions from stored user data
            };
            setCurrentUser(currentUser);
          }
        }
      } catch (error) {
        handleError(error, 'Error fetching current user');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();

    // Listen for storage changes (for logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && !e.newValue) {
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleError]);

  return { currentUser, loading };
};
