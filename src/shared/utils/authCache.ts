import { User, PermissionMatrix } from '../types';
import { secureStorage } from './secureStorage';

interface AuthCache {
  user: User | null;
  permissions: PermissionMatrix;
  lastLogin: number;
  expiresAt: number;
}

class AuthCacheManager {
  private static instance: AuthCacheManager;
  private cache: AuthCache | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager();
    }
    return AuthCacheManager.instance;
  }

  setUser(user: User): void {
    this.cache = {
      user,
      permissions: user.permissions,
      lastLogin: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    };

    // Store in secure storage instead of localStorage
    secureStorage.setItem('authCache', this.cache);
  }

  getUser(): User | null {
    if (!this.cache) {
      // Try to load from secure storage
      this.cache = secureStorage.getItem<AuthCache>('authCache');
      // Check if cache is still valid
      if (this.cache && this.cache.expiresAt < Date.now()) {
        this.clearCache();
        return null;
      }
    }

    return this.cache?.user || null;
  }

  getPermissions(): PermissionMatrix | null {
    return this.cache?.permissions || null;
  }

  isExpired(): boolean {
    return !this.cache || this.cache.expiresAt < Date.now();
  }

  clearCache(): void {
    this.cache = null;
    secureStorage.removeItem('authCache');
  }

  refreshCache(): void {
    if (this.cache) {
      this.cache.expiresAt = Date.now() + this.CACHE_DURATION;
      secureStorage.setItem('authCache', this.cache);
    }
  }
}

export const authCache = AuthCacheManager.getInstance();
