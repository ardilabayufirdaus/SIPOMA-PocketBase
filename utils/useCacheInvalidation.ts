import { useCallback } from 'react';
import { cacheManager } from './cacheManager';
import { CacheKeys } from './cacheKeys';

/**
 * Hook to handle cache invalidation for different collections
 * Provides methods to invalidate specific collections or all collections
 */
export const useCacheInvalidation = () => {
  /**
   * Invalidate all cache entries for a specific collection
   * @param collection The collection to invalidate
   */
  const invalidateCollection = useCallback((collection: string) => {
    const keys = cacheManager.getKeys();
    keys.forEach((key) => {
      if (key.startsWith(collection)) {
        cacheManager.delete(key);
      }
    });
  }, []);

  /**
   * Invalidate specific cache key
   * @param key The cache key to invalidate
   */
  const invalidateKey = useCallback((key: string) => {
    cacheManager.delete(key);
  }, []);

  /**
   * Invalidate all plant operation related caches
   */
  const invalidatePlantOperations = useCallback(() => {
    const collectionsToInvalidate = [
      CacheKeys.PLANT_UNITS,
      CacheKeys.PARAMETER_SETTINGS,
      CacheKeys.SILO_CAPACITIES,
      CacheKeys.REPORT_SETTINGS,
      CacheKeys.CCR_PARAMETER_DATA,
      CacheKeys.CCR_DOWNTIME_DATA,
      CacheKeys.CCR_FOOTER_DATA,
    ];

    collectionsToInvalidate.forEach((collection) => {
      invalidateCollection(collection);
    });
  }, [invalidateCollection]);

  /**
   * Invalidate all caches
   */
  const invalidateAll = useCallback(() => {
    cacheManager.clear();
  }, []);

  return {
    invalidateCollection,
    invalidateKey,
    invalidatePlantOperations,
    invalidateAll,
  };
};

export default useCacheInvalidation;
