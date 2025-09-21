import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '../types';
import useErrorHandler from './useErrorHandler';
import { buildPermissionMatrix } from '../utils/permissionUtils';
import { passwordUtils } from '../utils/passwordUtils';
import { authCache } from '../utils/authCache';
import { secureStorage } from '../utils/secureStorage';
import { rateLimiter } from '../utils/rateLimiter';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  // Lazy load user permissions
  const loadUserPermissions = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      const permissionMatrix = buildPermissionMatrix(data || []);

      return permissionMatrix;
    } catch (error) {
      console.warn('Failed to load user permissions:', error);
      return {}; // Return empty permissions on error
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      setLoading(true);
      try {
        // Check rate limiting
        const rateLimitCheck = rateLimiter.isAllowed(identifier);
        if (!rateLimitCheck.allowed) {
          throw new Error(rateLimitCheck.message || 'Too many login attempts');
        }

        // Check cache first
        const cachedUser = authCache.getUser();
        if (cachedUser && !authCache.isExpired()) {
          setUser(cachedUser);
          rateLimiter.recordSuccessfulLogin(identifier);
          return cachedUser;
        }

        // Optimized query: only get basic user data first
        const { data, error } = await supabase
          .from('users')
          .select(
            `
            id,
            username,
            password_hash,
            full_name,
            role,
            last_active,
            is_active,
            avatar_url,
            created_at
          `
          )
          .eq('username', identifier)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned - record failed attempt
            rateLimiter.recordFailedAttempt(identifier);
            throw new Error('Invalid username or password');
          }
          throw error;
        }

        if (!data) {
          rateLimiter.recordFailedAttempt(identifier);
          throw new Error('Invalid username or password');
        }

        // Verify password
        const userData = data as any;

        if (!userData.password_hash) {
          console.error('Debug: No password_hash found for user:', userData.username);
          rateLimiter.recordFailedAttempt(identifier);
          throw new Error('Account not properly configured. Please contact admin.');
        }

        const isValidPassword = await passwordUtils.verify(password, userData.password_hash);

        if (!isValidPassword) {
          rateLimiter.recordFailedAttempt(identifier);
          throw new Error('Invalid username or password');
        }

        // Load permissions separately (lazy loading)
        const permissions = await loadUserPermissions(userData.id);

        const finalUserData = {
          ...userData,
          permissions,
        };

        // Convert dates
        if (finalUserData.last_active && typeof finalUserData.last_active === 'string') {
          finalUserData.last_active = new Date(finalUserData.last_active);
        }
        if (finalUserData.created_at && typeof finalUserData.created_at === 'string') {
          finalUserData.created_at = new Date(finalUserData.created_at);
        }

        // Update last_active
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', finalUserData.id);

        // Cache the user data
        authCache.setUser(finalUserData as User);

        // Record successful login
        rateLimiter.recordSuccessfulLogin(identifier);

        setUser(finalUserData as User);
        secureStorage.setItem('currentUser', finalUserData);
        return finalUserData;
      } catch (error) {
        handleError(error, 'Error logging in');
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
