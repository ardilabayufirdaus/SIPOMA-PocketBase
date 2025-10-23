import { useState, useCallback, useRef, useEffect } from 'react';
import { pb, ensureAuthenticated } from '../utils/pocketbase-simple';

// Define the types for our batch operations
interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: T;
  timestamp: number;
}

// Configuration options for the hook
interface BatchedCrudOptions {
  /** Batch interval in milliseconds. Default: 1000ms */
  batchInterval?: number;
  /** Maximum items in a batch before processing. Default: 10 */
  maxBatchSize?: number;
  /** Whether to perform an immediate operation on first call. Default: false */
  immediateFirstOperation?: boolean;
  /** Whether to automatically retry failed operations. Default: true */
  autoRetry?: boolean;
  /** Maximum retries for failed operations. Default: 3 */
  maxRetries?: number;
  /** Cache results in memory to reduce redundant fetches. Default: true */
  enableCache?: boolean;
  /** Cache TTL in milliseconds. Default: 30000ms (30s) */
  cacheTTL?: number;
}

// Return type for the hook
interface BatchedCrudReturn<T> {
  /** Create a new record (batched) */
  create: (collection: string, data: T) => Promise<T>;
  /** Update an existing record (batched) */
  update: (collection: string, id: string, data: Partial<T>) => Promise<T>;
  /** Delete a record (batched) */
  delete: (collection: string, id: string) => Promise<boolean>;
  /** Get a record by ID (cached if enabled) */
  getById: (collection: string, id: string) => Promise<T>;
  /** Get a list of records with filtering (cached if enabled) */
  getList: (
    collection: string,
    page?: number,
    pageSize?: number,
    options?: Record<string, unknown>
  ) => Promise<{ items: T[]; totalItems: number; totalPages: number }>;
  /** Fetch a full list of records (cached if enabled) */
  getFullList: (collection: string, options?: Record<string, unknown>) => Promise<T[]>;
  /** Force all pending operations to execute immediately */
  flush: () => Promise<void>;
  /** Current pending operations count */
  pendingOperations: number;
  /** Whether there are any pending operations */
  hasPendingOperations: boolean;
  /** Clear the cache for specified collection */
  clearCache: (collection?: string) => void;
}

// Cache types
type CacheKey = string;

// Different cache entry types for different operations
interface IdCacheEntry<T> {
  type: 'id';
  data: T;
  timestamp: number;
}

interface ListCacheEntry<T> {
  type: 'list';
  data: { items: T[]; totalItems: number; totalPages: number };
  timestamp: number;
}

interface FullListCacheEntry<T> {
  type: 'fullList';
  data: T[];
  timestamp: number;
}

// Union type for all possible cache entries
type CacheEntry<T> = IdCacheEntry<T> | ListCacheEntry<T> | FullListCacheEntry<T>;

/**
 * Hook for optimized CRUD operations with batching, caching, and retry mechanisms.
 * Reduces server traffic by batching multiple operations and caching results.
 */
export function useBatchedCrudOperations<T extends Record<string, unknown>>(
  options: BatchedCrudOptions = {}
): BatchedCrudReturn<T> {
  // Default options
  const {
    batchInterval = 1000,
    maxBatchSize = 10,
    immediateFirstOperation = false,
    autoRetry = true,
    maxRetries = 3,
    enableCache = true,
    cacheTTL = 30000, // 30 seconds
  } = options;

  // Batch operations queue
  const [operations, setOperations] = useState<BatchOperation<T>[]>([]);

  // Cache for read operations - type-safe implementation
  const cache = useRef<Map<CacheKey, CacheEntry<T>>>(new Map());

  // Batch processing timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Flag for first operation
  const isFirstOperationRef = useRef<boolean>(true);

  /**
   * Generate a cache key from collection name and parameters
   */
  const generateCacheKey = (collection: string, params: Record<string, unknown>): CacheKey => {
    return `${collection}:${JSON.stringify(params)}`;
  };

  /**
   * Process all batched operations
   */
  const processBatch = useCallback(async () => {
    if (operations.length === 0) return;

    const currentOperations = [...operations];
    setOperations([]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Ensure authentication before processing batch operations
    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      // Re-add operations to the queue if auth failed
      setOperations((prev) => [...prev, ...currentOperations]);
      return;
    }

    // Group operations by collection for more efficient processing
    const operationsByCollection = currentOperations.reduce<Record<string, BatchOperation<T>[]>>(
      (acc, op) => {
        if (!acc[op.collection]) {
          acc[op.collection] = [];
        }
        acc[op.collection].push(op);
        return acc;
      },
      {}
    );

    try {
      // Process each collection's operations
      for (const [collection, ops] of Object.entries(operationsByCollection)) {
        // Process operations in parallel for each collection
        await Promise.all(
          ops.map(async (op) => {
            try {
              switch (op.type) {
                case 'create':
                  if (op.data) {
                    await pb.collection(collection).create(op.data);
                    // Clear collection cache on create
                    if (enableCache) {
                      clearCollectionCache(collection);
                    }
                  }
                  break;
                case 'update':
                  if (op.id && op.data) {
                    await pb.collection(collection).update(op.id, op.data);
                    // Invalidate specific cache entries
                    if (enableCache) {
                      invalidateCacheForId(collection, op.id);
                    }
                  }
                  break;
                case 'delete':
                  if (op.id) {
                    await pb.collection(collection).delete(op.id);
                    // Invalidate specific cache entries
                    if (enableCache) {
                      invalidateCacheForId(collection, op.id);
                    }
                  }
                  break;
              }
            } catch {
              // Silently handle errors but still retry if needed
              if (autoRetry) {
                retryOperation(op);
              }
            }
          })
        );
      }
    } catch {
      // Handle batch errors silently
    }
  }, [operations, enableCache]);

  /**
   * Retry a failed operation with exponential backoff
   */
  const retryOperation = useCallback(
    (operation: BatchOperation<T>, attempt: number = 1) => {
      if (attempt > maxRetries) {
        // Max retries reached, silently fail
        return;
      }

      // Exponential backoff for retries
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);

      setTimeout(() => {
        setOperations((prev) => [...prev, { ...operation, timestamp: Date.now() }]);
      }, delay);
    },
    [maxRetries]
  );

  /**
   * Clear specific collection cache
   */
  const clearCollectionCache = useCallback(
    (collection: string) => {
      if (!enableCache) return;

      // Remove all cache entries for this collection
      for (const key of cache.current.keys()) {
        if (key.startsWith(`${collection}:`)) {
          cache.current.delete(key);
        }
      }
    },
    [enableCache]
  );

  /**
   * Invalidate cache entries for a specific ID
   */
  const invalidateCacheForId = useCallback(
    (collection: string, id: string) => {
      if (!enableCache) return;

      // Remove specific ID entry
      cache.current.delete(`${collection}:id:${id}`);

      // Collection list caches are also invalidated
      clearCollectionCache(collection);
    },
    [enableCache, clearCollectionCache]
  );

  /**
   * Queue an operation for batched processing
   */
  const queueOperation = useCallback(
    (operation: BatchOperation<T>) => {
      setOperations((prev) => [...prev, operation]);

      // Process immediately if this is the first operation and immediateFirstOperation is true
      if (isFirstOperationRef.current && immediateFirstOperation) {
        isFirstOperationRef.current = false;
        processBatch();
        return;
      }

      // Start batch timer if not already running
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          processBatch();
          timeoutRef.current = null;
        }, batchInterval);
      }

      // Process batch immediately if max size reached
      if (operations.length >= maxBatchSize) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        processBatch();
      }
    },
    [batchInterval, maxBatchSize, operations.length, processBatch, immediateFirstOperation]
  );

  /**
   * Create operation (batched)
   */
  const create = useCallback(
    async (collection: string, data: T): Promise<T> => {
      queueOperation({
        type: 'create',
        collection,
        data,
        timestamp: Date.now(),
      });
      return data; // Return data optimistically
    },
    [queueOperation]
  );

  /**
   * Update operation (batched)
   */
  const update = useCallback(
    async (collection: string, id: string, data: Partial<T>): Promise<T> => {
      queueOperation({
        type: 'update',
        collection,
        id,
        data: data as T,
        timestamp: Date.now(),
      });

      // If we have this item in cache, optimistically update it
      if (enableCache) {
        const cacheKey = `${collection}:id:${id}`;
        const cachedItem = cache.current.get(cacheKey);

        if (cachedItem && cachedItem.type === 'id') {
          // Safe to spread the data as we know it's an object
          const updatedData = { ...cachedItem.data, ...data };
          cache.current.set(cacheKey, {
            type: 'id',
            data: updatedData,
            timestamp: Date.now(),
          });
          return updatedData;
        }
      }

      // If not in cache or cache disabled, return optimistic data
      // Use type assertion with unknown as intermediate step for safety
      return { id, ...data } as unknown as T;
    },
    [queueOperation, enableCache]
  );

  /**
   * Delete operation (batched)
   */
  const deleteOperation = useCallback(
    async (collection: string, id: string): Promise<boolean> => {
      queueOperation({
        type: 'delete',
        collection,
        id,
        timestamp: Date.now(),
      });
      return true; // Return success optimistically
    },
    [queueOperation]
  );

  /**
   * Get record by ID (with caching)
   */
  const getById = useCallback(
    async (collection: string, id: string): Promise<T> => {
      // Check cache first
      if (enableCache) {
        const cacheKey = `${collection}:id:${id}`;
        const cachedItem = cache.current.get(cacheKey);

        if (
          cachedItem &&
          cachedItem.type === 'id' &&
          Date.now() - cachedItem.timestamp < cacheTTL
        ) {
          return cachedItem.data;
        }
      }

      // Ensure we're authenticated before fetching data
      await ensureAuthenticated();

      // Fetch from API
      const data = await pb.collection(collection).getOne(id);

      // Cache the result
      if (enableCache) {
        const cacheKey = `${collection}:id:${id}`;
        cache.current.set(cacheKey, {
          type: 'id',
          data: data as unknown as T,
          timestamp: Date.now(),
        });
      }

      return data as unknown as T;
    },
    [enableCache, cacheTTL]
  );

  /**
   * Get a list of records (with caching)
   */
  const getList = useCallback(
    async (
      collection: string,
      page = 1,
      pageSize = 20,
      options: Record<string, unknown> = {}
    ): Promise<{ items: T[]; totalItems: number; totalPages: number }> => {
      const params = { page, pageSize, ...options };

      // Check cache first
      if (enableCache) {
        const cacheKey = generateCacheKey(collection, params);
        const cachedItem = cache.current.get(cacheKey);

        if (
          cachedItem &&
          cachedItem.type === 'list' &&
          Date.now() - cachedItem.timestamp < cacheTTL
        ) {
          return cachedItem.data;
        }
      }

      // Ensure we're authenticated before fetching data
      await ensureAuthenticated();

      // Fetch from API
      const result = await pb.collection(collection).getList(page, pageSize, options);

      const data = {
        items: result.items as unknown as T[],
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      };

      // Cache the result
      if (enableCache) {
        const cacheKey = generateCacheKey(collection, params);
        cache.current.set(cacheKey, {
          type: 'list',
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    },
    [enableCache, cacheTTL, generateCacheKey]
  );

  /**
   * Get a full list of records (with caching)
   */
  const getFullList = useCallback(
    async (collection: string, options: Record<string, unknown> = {}): Promise<T[]> => {
      // Check cache first
      if (enableCache) {
        const cacheKey = generateCacheKey(collection, { fullList: true, ...options });
        const cachedItem = cache.current.get(cacheKey);

        if (
          cachedItem &&
          cachedItem.type === 'fullList' &&
          Date.now() - cachedItem.timestamp < cacheTTL
        ) {
          return cachedItem.data;
        }
      }

      // Ensure we're authenticated before fetching data
      await ensureAuthenticated();

      // Fetch from API
      const items = await pb.collection(collection).getFullList(options);

      // Cache the result
      if (enableCache) {
        const cacheKey = generateCacheKey(collection, { fullList: true, ...options });
        cache.current.set(cacheKey, {
          type: 'fullList',
          data: items as unknown as T[],
          timestamp: Date.now(),
        });
      }

      return items as unknown as T[];
    },
    [enableCache, cacheTTL, generateCacheKey]
  );

  /**
   * Clear cache for a specific collection or all collections
   */
  const clearCache = useCallback(
    (collection?: string) => {
      if (!enableCache) return;

      if (collection) {
        clearCollectionCache(collection);
      } else {
        cache.current.clear();
      }
    },
    [enableCache, clearCollectionCache]
  );

  /**
   * Force processing of all pending operations
   */
  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await processBatch();
  }, [processBatch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Process pending operations on component unmount
  useEffect(() => {
    return () => {
      if (operations.length > 0) {
        processBatch();
      }
    };
  }, [operations, processBatch]);

  return {
    create,
    update,
    delete: deleteOperation,
    getById,
    getList,
    getFullList,
    flush,
    pendingOperations: operations.length,
    hasPendingOperations: operations.length > 0,
    clearCache,
  };
}

