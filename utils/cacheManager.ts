interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private prefix = 'sipoma_cache_';

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch {
      // Silent failure - likely storage quota exceeded
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed: CacheItem<T> = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        this.delete(key);
        return null;
      }

      return parsed.data;
    } catch {
      // Silent failure - possibly corrupted data
      this.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Silent failure
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Silent failure
    }
  }

  /**
   * Get all cache keys (without prefix)
   * @returns Array of cache keys
   */
  getKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter((key) => key.startsWith(this.prefix))
        .map((key) => key.slice(this.prefix.length));
    } catch {
      // Silent failure
      return [];
    }
  }
}

export const cacheManager = new CacheManager();
