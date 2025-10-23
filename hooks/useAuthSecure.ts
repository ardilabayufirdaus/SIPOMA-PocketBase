import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { User } from '../types';
import useErrorHandler from './useErrorHandler';
import { authCache } from '../utils/authCache';
import { secureStorage } from '../utils/secureStorage';
import { rateLimiter } from '../utils/rateLimiter';
import { clearPermissionCache } from '../services/permissionService';

// Versi minimal dari User yang disimpan di localStorage
// Tidak menyimpan permissions untuk keamanan
export type MinimalUser = Omit<User, 'permissions'> & {
  // Menambahkan token agar tidak perlu login ulang
  auth_token?: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const login = useCallback(
    async (identifier: string, password: string) => {
      setLoading(true);
      try {
        // Check rate limiting
        const rateLimitCheck = rateLimiter.isAllowed(identifier);
        if (!rateLimitCheck.allowed) {
          throw new Error(rateLimitCheck.message || 'Too many login attempts');
        }

        // Use PocketBase's built-in authentication
        const authData = await pb.collection('users').authWithPassword(identifier, password);

        // Get the authenticated user data
        const userData = authData.record;

        // Create a properly typed user object (WITHOUT permissions)
        const minimalUserData: MinimalUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name || userData.name,
          role: userData.role,
          is_active: userData.is_active === true,
          created_at: userData.created,
          updated_at: userData.updated,
          avatar_url: userData.avatar,
          auth_token: pb.authStore.token, // Save token for auto-login
        };

        // Update last_active
        try {
          await pb.collection('users').update(userData.id, {
            last_active: new Date().toISOString(),
          });
        } catch {
          // Silently fail - last_active update is not critical for login
        }

        // Record successful login
        rateLimiter.recordSuccessfulLogin(identifier);

        // Dapatkan user lengkap untuk state aplikasi
        const fullUserData: User = {
          ...minimalUserData,
          // Permissions akan diambil dari server saat diperlukan
          permissions: {
            dashboard: 'NONE',
            plant_operations: {},
            inspection: 'NONE',
            project_management: 'NONE',
          },
        };

        // Simpan user minimal (tanpa permissions) di localStorage
        secureStorage.setItem('currentUser', minimalUserData);

        // Set user lengkap untuk state aplikasi
        setUser(fullUserData);

        return fullUserData;
      } catch (error) {
        // Provide user-friendly error messages
        let errorMessage = 'Error logging in';
        if (error instanceof Error) {
          if (
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('connection')
          ) {
            errorMessage =
              'Network connection error. Please check your internet connection and try again.';
          } else if (error.message.includes('Invalid username or password')) {
            errorMessage = error.message;
          } else {
            errorMessage = 'Login failed. Please try again later.';
          }
        }
        handleError(error, errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const logout = useCallback(() => {
    setUser(null);
    setLoading(false);
    secureStorage.removeItem('currentUser');
    authCache.clearCache();
    clearPermissionCache(); // Clear permission cache
    pb.authStore.clear(); // Clear PocketBase auth

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }, []);

  useEffect(() => {
    // Restore session from localStorage but without permissions
    const storedUser = secureStorage.getItem<MinimalUser>('currentUser');

    if (storedUser) {
      // Restore PocketBase auth token
      if (storedUser.auth_token) {
        pb.authStore.save(storedUser.auth_token);
      }

      // Set minimal user data for initial render
      setUser({
        ...storedUser,
        // Permissions diambil dari server saat diperlukan
        permissions: {
          dashboard: 'NONE',
          plant_operations: {},
          inspection: 'NONE',
          project_management: 'NONE',
        },
      });
    }

    setLoading(false);

    // Listen for auth state changes
    const handleAuthChange = () => {
      const storedUser = secureStorage.getItem<MinimalUser>('currentUser');
      if (storedUser) {
        setUser({
          ...storedUser,
          // Permissions diambil dari server saat diperlukan
          permissions: {
            dashboard: 'NONE',
            plant_operations: {},
            inspection: 'NONE',
            project_management: 'NONE',
          },
        });
      } else {
        setUser(null);
        authCache.clearCache();
        clearPermissionCache(); // Clear permission cache
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  return { user, loading, login, logout };
};
