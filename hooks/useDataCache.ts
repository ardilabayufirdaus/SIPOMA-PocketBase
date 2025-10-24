import { useState, useEffect, useCallback } from 'react';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export const useDataCache = <T>() => {
  const [cache, setCache] = useState<Map<string, CacheItem<T>>>(new Map());
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    size: 0,
  });

  // Generate cache key
  const generateKey = useCallback((...args: any[]): string => {
    return args
      .map((arg) => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join('|');
  }, []);

  // Check if cache item is expired
  const isExpired = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp > CACHE_DURATION;
  }, []);

  // Clean expired items
  const cleanExpired = useCallback(() => {
    setCache((prevCache) => {
      const newCache = new Map();
      for (const [key, item] of prevCache) {
        if (!isExpired(item.timestamp)) {
          newCache.set(key, item);
        }
      }
      return newCache;
    });
  }, [isExpired]);

  // Enforce max cache size (LRU eviction)
  const enforceMaxSize = useCallback(() => {
    setCache((prevCache) => {
      if (prevCache.size <= MAX_CACHE_SIZE) return prevCache;

      const entries = Array.from(prevCache.entries());
      // Sort by timestamp (oldest first) and remove oldest items
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const newCache = new Map();
      for (let i = Math.floor(MAX_CACHE_SIZE * 0.8); i < entries.length; i++) {
        newCache.set(entries[i][0], entries[i][1]);
      }

      return newCache;
    });
  }, []);

  // Get data from cache
  const get = useCallback(
    (key: string): T | null => {
      const item = cache.get(key);

      if (!item) {
        setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
        return null;
      }

      if (isExpired(item.timestamp)) {
        setCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(key);
          return newCache;
        });
        setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
        return null;
      }

      setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
      return item.data;
    },
    [cache, isExpired]
  );

  // Set data to cache
  const set = useCallback(
    (key: string, data: T) => {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        key,
      };

      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(key, item);
        return newCache;
      });

      setStats((prev) => ({ ...prev, size: prev.size + 1 }));

      // Clean up if needed
      cleanExpired();
      enforceMaxSize();
    },
    [cleanExpired, enforceMaxSize]
  );

  // Clear cache
  const clear = useCallback(() => {
    setCache(new Map());
    setStats({ hits: 0, misses: 0, size: 0 });
  }, []);

  // Get cache statistics
  const getStats = useCallback(() => {
    const hitRate =
      stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0;

    return {
      ...stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: cache.size,
    };
  }, [stats, cache.size]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpired();
    }, CACHE_DURATION / 4); // Clean every 1.25 minutes

    return () => clearInterval(interval);
  }, [cleanExpired]);

  return {
    get,
    set,
    clear,
    getStats,
    generateKey,
  };
};

// Specialized hook for CCR data caching
export const useCcrDataCache = () => {
  const cache = useDataCache<any[]>();

  const getCachedData = useCallback(
    (month: number, year: number, plantUnit?: string) => {
      const key = cache.generateKey('ccr_data', month, year, plantUnit || 'all');
      return cache.get(key);
    },
    [cache]
  );

  const setCachedData = useCallback(
    (month: number, year: number, plantUnit: string | undefined, data: any[]) => {
      const key = cache.generateKey('ccr_data', month, year, plantUnit || 'all');
      cache.set(key, data);
    },
    [cache]
  );

  const getCachedProcessedData = useCallback(
    (month: number, year: number, plantUnit?: string, selectedParams?: string[]) => {
      const key = cache.generateKey(
        'processed_data',
        month,
        year,
        plantUnit || 'all',
        selectedParams?.join(',') || 'all'
      );
      return cache.get(key);
    },
    [cache]
  );

  const setCachedProcessedData = useCallback(
    (
      month: number,
      year: number,
      plantUnit: string | undefined,
      selectedParams: string[] | undefined,
      data: any
    ) => {
      const key = cache.generateKey(
        'processed_data',
        month,
        year,
        plantUnit || 'all',
        selectedParams?.join(',') || 'all'
      );
      cache.set(key, data);
    },
    [cache]
  );

  return {
    getCachedData,
    setCachedData,
    getCachedProcessedData,
    setCachedProcessedData,
    clearCache: cache.clear,
    getStats: cache.getStats,
  };
};
