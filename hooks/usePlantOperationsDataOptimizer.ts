import { useState, useCallback, useEffect } from 'react';
import { pb } from '../utils/pocketbase';
import { logger } from '../utils/logger';
import { safeApiCall } from '../utils/connectionCheck';

// Type definitions
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

type QueryCache = Record<string, CacheEntry<unknown>>;

type DataBatch = {
  parameterData: Record<string, unknown>[];
  siloData: Record<string, unknown>[];
  downtimeData: Record<string, unknown>[];
  footerData: Record<string, unknown>[];
  informationData: Record<string, unknown>[];
};

/**
 * Optimized hook for fetching plant operations data with query caching, batching, and stream processing.
 * This hook improves performance when loading data across multiple plant operations modules.
 */
export function usePlantOperationsDataOptimizer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBatchingEnabled, setIsBatchingEnabled] = useState(true);
  const [queryCacheEnabled, setQueryCacheEnabled] = useState(true);
  const [queryCache, setQueryCache] = useState<QueryCache>({});

  // Cache expiry time in milliseconds (5 minutes)
  const CACHE_EXPIRY = 5 * 60 * 1000;

  // Initialize the optimizer
  useEffect(() => {
    if (!isInitialized) {
      logger.info('Initializing Plant Operations Data Optimizer');
      setIsInitialized(true);
    }

    // Clean up query cache periodically
    const cacheCleanupInterval = setInterval(() => {
      if (queryCacheEnabled) {
        const now = Date.now();
        setQueryCache((prevCache) => {
          const newCache = { ...prevCache };
          let expiredCount = 0;

          Object.entries(newCache).forEach(([key, entry]) => {
            if (now - entry.timestamp > CACHE_EXPIRY) {
              delete newCache[key];
              expiredCount++;
            }
          });

          if (expiredCount > 0) {
            logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
          }

          return newCache;
        });
      }
    }, 60000); // Run cleanup every minute

    return () => {
      clearInterval(cacheCleanupInterval);
    };
  }, [isInitialized, queryCacheEnabled]);

  /**
   * Generate a cache key for a query
   */
  const generateCacheKey = useCallback((collection: string, params: Record<string, unknown>) => {
    return `${collection}:${JSON.stringify(params)}`;
  }, []);

  /**
   * Optimized function to fetch data with caching
   */
  const fetchOptimized = useCallback(
    async <T>(
      collection: string,
      params: Record<string, unknown>,
      options: {
        bypassCache?: boolean;
        forceRefresh?: boolean;
        cacheTTL?: number; // in milliseconds
      } = {}
    ): Promise<T> => {
      const { bypassCache = false, forceRefresh = false, cacheTTL = CACHE_EXPIRY } = options;
      const cacheKey = generateCacheKey(collection, params);

      // Check cache first if enabled and not bypassed
      if (queryCacheEnabled && !bypassCache && !forceRefresh) {
        const cachedData = queryCache[cacheKey];
        if (cachedData && Date.now() - cachedData.timestamp < cacheTTL) {
          logger.debug(`Cache hit for ${collection}`);
          return cachedData.data as T;
        }
      }

      // Fetch fresh data
      try {
        const result = await safeApiCall(() =>
          pb.collection(collection).getFullList({
            ...params,
          })
        );

        // Cache the result if caching is enabled
        if (queryCacheEnabled && !bypassCache && result) {
          setQueryCache((prevCache) => ({
            ...prevCache,
            [cacheKey]: {
              data: result,
              timestamp: Date.now(),
            },
          }));
        }

        return result as T;
      } catch (error) {
        logger.error(`Error fetching ${collection}:`, error);
        throw error;
      }
    },
    [queryCacheEnabled, queryCache, generateCacheKey]
  );

  /**
   * Get parameter data for a date and plant unit with optimized query
   */
  const getOptimizedParameterData = useCallback(
    async (date: string, plantUnit?: string) => {
      // Support both date formats and validate
      let isoDate = date;
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Build the query filter
      let filter = `date="${isoDate}"`;
      if (plantUnit && plantUnit !== 'all') {
        filter += ` && plant_unit="${plantUnit}"`;
      }

      return fetchOptimized<Record<string, unknown>[]>('ccr_parameter_data', {
        filter,
        sort: '-created',
      });
    },
    [fetchOptimized]
  );

  /**
   * Get silo data for a date and plant unit with optimized query
   */
  const getOptimizedSiloData = useCallback(
    async (date: string, unitId?: string) => {
      // Support both date formats and validate
      let isoDate = date;
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Build the query filter
      let filter = `date="${isoDate}"`;
      if (unitId && unitId !== 'all') {
        filter += ` && unit_id="${unitId}"`;
      }

      return fetchOptimized<Record<string, unknown>[]>('ccr_silo_data', {
        filter,
        sort: 'created',
        expand: 'silo_id',
      });
    },
    [fetchOptimized]
  );

  /**
   * Get downtime data for a date and plant unit with optimized query
   */
  const getOptimizedDowntimeData = useCallback(
    async (date: string, unit?: string) => {
      // Support both date formats and validate
      let isoDate = date;
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Build the query filter
      let filter = `date="${isoDate}"`;
      if (unit && unit !== 'all') {
        filter += ` && unit="${unit}"`;
      }

      return fetchOptimized<Record<string, unknown>[]>('ccr_downtime_data', {
        filter,
        sort: 'start_time',
      });
    },
    [fetchOptimized]
  );

  /**
   * Get footer data for a date and plant unit with optimized query
   */
  const getOptimizedFooterData = useCallback(
    async (date: string, plantUnit?: string, parameterId?: string) => {
      // Support both date formats and validate
      let isoDate = date;
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Build the query filter
      let filter = `date="${isoDate}"`;
      if (plantUnit && plantUnit !== 'all') {
        filter += ` && plant_unit="${plantUnit}"`;
      }
      if (parameterId) {
        filter += ` && parameter_id="${parameterId}"`;
      }

      return fetchOptimized<Record<string, unknown>[]>('ccr_footer_data', {
        filter,
        sort: 'parameter_id',
      });
    },
    [fetchOptimized]
  );

  /**
   * Get information data for a date and plant unit with optimized query
   */
  const getOptimizedInformationData = useCallback(
    async (date: string, plantUnit?: string) => {
      // Support both date formats and validate
      let isoDate = date;
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Build the query filter
      let filter = `date="${isoDate}"`;
      if (plantUnit && plantUnit !== 'all') {
        filter += ` && plant_unit="${plantUnit}"`;
      }

      return fetchOptimized<Record<string, unknown>[]>('ccr_information', {
        filter,
        sort: 'created',
      });
    },
    [fetchOptimized]
  );

  /**
   * Load all plant operations data for a date in a single batch
   */
  const loadAllPlantOperationsData = useCallback(
    async (date: string, plantUnit?: string): Promise<DataBatch> => {
      if (!isBatchingEnabled) {
        // Load each data type individually if batching is disabled
        const parameterData = await getOptimizedParameterData(date, plantUnit);
        const siloData = await getOptimizedSiloData(date, plantUnit);
        const downtimeData = await getOptimizedDowntimeData(date, plantUnit);
        const footerData = await getOptimizedFooterData(date, plantUnit);
        const informationData = await getOptimizedInformationData(date, plantUnit);

        return { parameterData, siloData, downtimeData, footerData, informationData };
      }

      // Use Promise.all for parallel loading with batching enabled
      try {
        const [parameterData, siloData, downtimeData, footerData, informationData] =
          await Promise.all([
            getOptimizedParameterData(date, plantUnit),
            getOptimizedSiloData(date, plantUnit),
            getOptimizedDowntimeData(date, plantUnit),
            getOptimizedFooterData(date, plantUnit),
            getOptimizedInformationData(date, plantUnit),
          ]);

        return { parameterData, siloData, downtimeData, footerData, informationData };
      } catch (error) {
        logger.error('Error loading plant operations data in batch:', error);
        throw error;
      }
    },
    [
      isBatchingEnabled,
      getOptimizedParameterData,
      getOptimizedSiloData,
      getOptimizedDowntimeData,
      getOptimizedFooterData,
      getOptimizedInformationData,
    ]
  );

  /**
   * Clear the query cache for specific collection or all collections
   */
  const clearQueryCache = useCallback((collection?: string) => {
    if (!collection) {
      // Clear entire cache
      setQueryCache({});
      logger.debug('Cleared entire query cache');
      return;
    }

    // Clear only entries for the specified collection
    setQueryCache((prevCache) => {
      const newCache = { ...prevCache };
      let clearedCount = 0;

      Object.keys(newCache).forEach((key) => {
        if (key.startsWith(`${collection}:`)) {
          delete newCache[key];
          clearedCount++;
        }
      });

      logger.debug(`Cleared ${clearedCount} cache entries for collection: ${collection}`);
      return newCache;
    });
  }, []);

  /**
   * Toggle query caching on/off
   */
  const toggleQueryCaching = useCallback(
    (enabled: boolean) => {
      setQueryCacheEnabled(enabled);
      if (!enabled) {
        // Clear cache when disabling
        clearQueryCache();
      }
    },
    [clearQueryCache]
  );

  /**
   * Toggle request batching on/off
   */
  const toggleBatching = useCallback((enabled: boolean) => {
    setIsBatchingEnabled(enabled);
  }, []);

  return {
    // Core functionality
    fetchOptimized,
    loadAllPlantOperationsData,

    // Optimized data fetchers
    getOptimizedParameterData,
    getOptimizedSiloData,
    getOptimizedDowntimeData,
    getOptimizedFooterData,
    getOptimizedInformationData,

    // Cache management
    clearQueryCache,
    toggleQueryCaching,
    toggleBatching,

    // State
    isCachingEnabled: queryCacheEnabled,
    isBatchingEnabled,
    isInitialized,
  };
}
