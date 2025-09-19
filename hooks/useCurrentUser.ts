import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../utils/api';
import { buildPermissionMatrix } from '../utils/permissionUtils';
import { secureStorage } from '../utils/secureStorage';

interface UserPermission {
  permissions: {
    module_name: string;
    permission_level: string;
    plant_units?: Array<{
      category: string;
      unit: string;
    }>;
  };
}

interface DbUser {
  id: string;
  username: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_permissions?: UserPermission[];
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user from secureStorage
        const storedUser = secureStorage.getItem<User>('currentUser');
        if (!storedUser) {
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        const userData = storedUser;

        // Skip database verification for guest users (they don't exist in DB)
        if (userData.role === 'Guest') {
          if (mounted) {
            setCurrentUser(userData);
            setLoading(false);
          }
          return;
        }

        // Verify user is still active by checking database (only for non-guest users)
        const dbUserRaw = await api.users.getById(userData.id);
        const dbUser = {
          ...dbUserRaw,
          permissions: buildPermissionMatrix(
            (dbUserRaw as { user_permissions?: UserPermission[] }).user_permissions || []
          ),
        };
        if (!dbUser.is_active) {
          // User inactive, clear session
          localStorage.removeItem('currentUser');
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        // Parse user data
        if (mounted) {
          setCurrentUser(dbUser);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getCurrentUser();

    // Listen for auth state changes
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        setCurrentUser(null);
        setLoading(false);
        setError(null);
      } else {
        // Re-verify user if needed
        getCurrentUser();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  // Function untuk logout - menggunakan useAuth logout
  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setError(null);
    setLoading(false);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }, []);

  return { currentUser, loading, error, logout };
};
