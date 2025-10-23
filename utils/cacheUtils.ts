import { User } from '../types';
import { DataCompressor } from './batchUtils';
import { cacheMetrics, cacheMetricsUtils } from './cacheMetrics';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  parentRoles: string[];
  childRoles: string[];
  isSystemRole: boolean;
  isActive: boolean;
  priority: number;
  constraints?: Record<string, unknown>;
  metadata: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  module_name: string;
  permission_level: string;
  plant_units: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private prefix = 'sipoma_cache_';

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    try {
      // Compress data before storing
      const compressedData = DataCompressor.compress(entry as unknown as Record<string, unknown>);
      localStorage.setItem(this.prefix + key, compressedData);

      // Track metrics
      const dataSize = cacheMetricsUtils.calculateDataSize(entry);
      const compressedSize = cacheMetricsUtils.calculateCompressedSize(compressedData);
      cacheMetrics.recordSet(dataSize, compressedSize);
    } catch {
      // Silently fail for cache storage
    }
  }

  get<T>(key: string): T | null {
    try {
      const compressedItem = localStorage.getItem(this.prefix + key);
      if (!compressedItem) {
        cacheMetrics.recordMiss();
        return null;
      }

      // Decompress data after retrieving
      const decompressedEntry = DataCompressor.decompress(compressedItem);
      const entry = decompressedEntry as unknown as CacheEntry<T>;

      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        cacheMetrics.recordEviction();
        cacheMetrics.recordMiss();
        return null;
      }

      cacheMetrics.recordHit();
      return entry.data;
    } catch {
      cacheMetrics.recordMiss();
      return null;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Silently fail for cache deletion
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Silently fail for cache clear
    }
  }
}

export const cacheManager = new CacheManager();

// Specific cache utilities for database operations
export const dbCache = {
  // Cache users data with pagination
  setUsers: (
    page: number,
    limit: number,
    data: { users: User[]; total: number },
    ttlMinutes = 5
  ) => {
    const key = `users_page_${page}_limit_${limit}`;
    cacheManager.set(key, data, ttlMinutes);
  },

  getUsers: (page: number, limit: number): { users: User[]; total: number } | null => {
    const key = `users_page_${page}_limit_${limit}`;
    return cacheManager.get(key);
  },

  // Cache roles and permissions (less frequently changing)
  setRoles: (roles: Role[], ttlMinutes = 30) => {
    cacheManager.set('roles', roles, ttlMinutes);
  },

  getRoles: (): Role[] | null => {
    return cacheManager.get('roles');
  },

  setPermissions: (permissions: Permission[], ttlMinutes = 30) => {
    cacheManager.set('permissions', permissions, ttlMinutes);
  },

  getPermissions: (): Permission[] | null => {
    return cacheManager.get('permissions');
  },

  // Invalidate cache on data changes
  invalidateUsers: () => {
    try {
      // For real localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith('sipoma_cache_users_page_')
        );
        keys.forEach((key) => localStorage.removeItem(key));
      }
    } catch {
      // For testing environment, we can't access localStorage directly
      // Cache invalidation will happen naturally through TTL
    }
  },

  invalidateRoles: () => {
    cacheManager.delete('roles');
  },

  invalidatePermissions: () => {
    cacheManager.delete('permissions');
  },

  // Get cache performance metrics
  getMetrics: () => {
    return cacheMetrics.getMetrics();
  },

  // Log cache metrics (for debugging)
  logMetrics: () => {
    cacheMetrics.logMetrics();
  },
};


