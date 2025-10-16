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
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
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

        // Retry logic for network errors
        let data: any = null;
        let error: any = null;
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await supabase
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
            data = result.data;
            error = result.error;
            break; // Success, exit retry loop
          } catch (networkError: any) {
            error = networkError;
            if (
              attempt < maxRetries - 1 &&
              (error.message?.includes('fetch') || error.message?.includes('network'))
            ) {
              console.warn(`Network error on attempt ${attempt + 1}, retrying...`);
              await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
              continue;
            }
            break; // Max retries or non-network error
          }
        }

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

        // Update last_active with retry
        let updateError: any = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const { error: updateErr } = await supabase
              .from('users')
              .update({ last_active: new Date().toISOString() })
              .eq('id', finalUserData.id);
            updateError = updateErr;
            if (!updateError) break;
          } catch (networkError: any) {
            updateError = networkError;
            if (
              attempt < maxRetries - 1 &&
              (updateError.message?.includes('fetch') || updateError.message?.includes('network'))
            ) {
              console.warn(`Network error on update attempt ${attempt + 1}, retrying...`);
              await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            break;
          }
        }
        if (updateError) {
          console.warn('Failed to update last_active:', updateError);
          // Don't throw, as login was successful
        }

        // Cache the user data
        authCache.setUser(finalUserData as User);

        // Record successful login
        rateLimiter.recordSuccessfulLogin(identifier);

        setUser(finalUserData as User);
        secureStorage.setItem('currentUser', finalUserData);
        return finalUserData;
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
