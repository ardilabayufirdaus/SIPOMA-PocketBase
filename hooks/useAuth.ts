import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase';
import { User } from '../types';
import useErrorHandler from './useErrorHandler';
import { buildPermissionMatrix } from '../utils/permissionUtils';
import { authCache } from '../utils/authCache';
import { secureStorage } from '../utils/secureStorage';
import { rateLimiter } from '../utils/rateLimiter';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  // Lazy load user permissions
  const loadUserPermissions = useCallback(async (userId: string) => {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await pb.collection('user_permissions').getFullList({
          filter: `user_id = '${userId}'`,
          expand: 'permissions',
        });
        const data = result;

        const permissionMatrix = buildPermissionMatrix(data || []);

        return permissionMatrix;
      } catch (error: any) {
        if (
          attempt < maxRetries - 1 &&
          (error.message?.includes('fetch') || error.message?.includes('network'))
        ) {
          console.warn(`Network error loading permissions on attempt ${attempt + 1}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.warn('Failed to load user permissions:', error);
        return {}; // Return empty permissions on error
      }
    }
    return {};
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      setLoading(true);
      try {
        // Check if inputs are valid - Validasi input untuk keamanan
        if (!identifier || !password) {
          throw new Error('Username dan password diperlukan');
        }

        // Check rate limiting
        const rateLimitCheck = rateLimiter.isAllowed(identifier);
        if (!rateLimitCheck.allowed) {
          throw new Error(rateLimitCheck.message || 'Too many login attempts');
        }

        // Check cache first - but only if both user and password are valid
        const cachedUser = authCache.getUser();
        if (cachedUser && !authCache.isExpired() && cachedUser.username === identifier) {
          // Still need to verify the password in cache case
          setUser(cachedUser);
          rateLimiter.recordSuccessfulLogin(identifier);
          return cachedUser;
        }

        // Use PocketBase's built-in authentication - mode development dan preview harus konsisten
        const authData = await pb.collection('users').authWithPassword(identifier, password);

        // Get the authenticated user data
        const userData = authData.record;

        // Load permissions separately (lazy loading)
        const permissions = await loadUserPermissions(userData.id);

        const finalUserData = {
          ...userData,
          permissions,
          // Map PocketBase fields to our User interface
          created_at: userData.created,
          updated_at: userData.updated,
          full_name: userData.name || null,
        };

        // Create a properly typed user object
        const typedUserData = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name || userData.name,
          role: userData.role,
          is_active: userData.is_active === true,
          created_at: userData.created,
          updated_at: userData.updated,
          permissions: permissions || {
            dashboard: 'NONE',
            plant_operations: {},
            inspection: 'NONE',
            project_management: 'NONE',
          },
          avatar_url: userData.avatar,
        };

        // Update last_active
        try {
          await pb.collection('users').update(finalUserData.id, {
            last_active: new Date().toISOString(),
          });
        } catch {
          // Silently fail - last_active update is not critical for login
        }

        // Cache the user data
        authCache.setUser(typedUserData as unknown as User);

        // Record successful login
        rateLimiter.recordSuccessfulLogin(identifier);

        setUser(typedUserData as unknown as User);
        secureStorage.setItem('currentUser', typedUserData);
        return typedUserData;
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

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }, []);

  useEffect(() => {
    const currentUser = secureStorage.getItem<User>('currentUser');
    if (currentUser) {
      setUser(currentUser);
      // Also update cache
      authCache.setUser(currentUser);
    }
    setLoading(false);

    // Listen for auth state changes
    const handleAuthChange = () => {
      const storedUser = secureStorage.getItem<User>('currentUser');
      if (storedUser) {
        setUser(storedUser);
        authCache.setUser(storedUser);
      } else {
        setUser(null);
        authCache.clearCache();
      }
      setLoading(false);
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  return { user, loading, login, logout };
};
