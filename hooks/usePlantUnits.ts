import { useState, useCallback, useEffect } from 'react';
import { PlantUnit } from '../types';
import { pb } from '../utils/pocketbase';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';
import { getFullListOptimized } from '../utils/optimizationAdapter';

const CACHE_KEY = CacheKeys.PLANT_UNITS;
const CACHE_TIME = 10; // Minutes

export const usePlantUnits = () => {
  const [records, setRecords] = useState<PlantUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<PlantUnit[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      // Gunakan fungsi optimasi untuk getFullList
      const result = await safeApiCall(() =>
        getFullListOptimized('plant_units', {
          sort: 'category,unit',
          limit: 500,
        })
      );

      if (result) {
        const typedData = result as unknown as PlantUnit[];
        setRecords(typedData);
        // Cache for 10 minutes (tetap gunakan cache manager yg ada)
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        setRecords([]);
      }
    } catch (error) {
      // If collection doesn't exist, set empty data
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        setRecords([]);
      } else {
        // Silently fail for other errors
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription for plant_units changes
  useEffect(() => {
    let isSubscribed = true;
    let unsubPromise;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection('plant_units').subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Clear cache when data changes
            cacheManager.delete(CACHE_KEY);

            // Optimized state updates based on event type
            if (e.action === 'create' && e.record) {
              setRecords((prev) =>
                [...prev, e.record as unknown as PlantUnit].sort(
                  (a, b) => a.category.localeCompare(b.category) || a.unit.localeCompare(b.unit)
                )
              );
            } else if (e.action === 'update' && e.record) {
              setRecords((prev) =>
                prev.map((record) =>
                  record.id === e.record.id ? (e.record as unknown as PlantUnit) : record
                )
              );
            } else if (e.action === 'delete' && e.record) {
              setRecords((prev) => prev.filter((record) => record.id !== e.record.id));
            }
          })
        );
      } catch (error) {
        // Ignore connection errors to prevent excessive logging
        if (!error.message?.includes('autocancelled') && !error.message?.includes('connection')) {
          // Log error silently or handle through error monitoring
        }
      }
    };

    // Start subscription
    subscribe();

    return () => {
      // Mark component as unmounted
      isSubscribed = false;

      // Cancel existing subscription
      if (unsubPromise) {
        // Handle different types that might be returned by subscribe()
        if (typeof unsubPromise === 'function') {
          // If it's already a function, just call it
          try {
            unsubPromise();
          } catch {
            // Ignore cleanup errors
          }
        } else if (unsubPromise && typeof unsubPromise.then === 'function') {
          // If it's a Promise, properly handle it
          unsubPromise
            .then((unsub) => {
              if (typeof unsub === 'function') {
                unsub();
              }
            })
            .catch(() => {
              // Ignore cleanup errors
            });
        }
      }
    };
  }, []);

  const addRecord = useCallback(
    async (record: Omit<PlantUnit, 'id'>) => {
      try {
        await pb.collection('plant_units').create(record);
        // Clear cache on data change
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Error handled silently or could be logged
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: PlantUnit) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection('plant_units').update(id, updateData);
        // Clear cache on data change
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Error handled silently
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('plant_units').delete(recordId);
        // Clear cache on data change
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Error handled silently
      }
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<PlantUnit, 'id'>[]) => {
      try {
        // Get all existing records
        const existingRecords = await pb.collection('plant_units').getFullList();

        // Delete all existing records
        for (const record of existingRecords) {
          await pb.collection('plant_units').delete(record.id);
        }

        // Insert new records
        for (const record of newRecords) {
          await pb.collection('plant_units').create(record);
        }

        // Refresh the data
        fetchRecords();
      } catch {
        // Error handled silently
      }
    },
    [fetchRecords]
  );

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    setAllRecords,
    loading,
  };
};
