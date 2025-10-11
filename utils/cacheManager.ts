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
    } catch (error) {
      console.warn('Failed to cache data:', error);
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
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to delete cache:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

export const cacheManager = new CacheManager();
