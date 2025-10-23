import { useState, useCallback, useEffect } from 'react';
import { SiloCapacity } from '../types';
import { pb } from '../utils/pocketbase';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

// Constants for cache management
const CACHE_KEY = CacheKeys.SILO_CAPACITIES;
const CACHE_TIME = 15; // Minutes

export const useSiloCapacities = () => {
  const [records, setRecords] = useState<SiloCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<SiloCapacity[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await pb.collection('silo_capacities').getFullList({
        sort: 'silo_name',
      });
      const typedData = result as unknown as SiloCapacity[];
      setRecords(typedData);
      // Cache for 15 minutes
      cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
    } catch (error) {
      if (error.status === 404) {
        // Collection doesn't exist yet
        setRecords([]);
      } else if (error.message?.includes('autocancelled')) {
        // Ignore autocancelled requests - this is normal behavior
      } else {
        // Handle error silently or through error monitoring
        setRecords([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();

    let isSubscribed = true;
    let unsubPromise;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection('silo_capacities').subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Clear cache when data changes
            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create') {
              setRecords((prev) =>
                [...prev, e.record as unknown as SiloCapacity].sort((a, b) =>
                  a.silo_name.localeCompare(b.silo_name)
                )
              );
            } else if (e.action === 'update') {
              setRecords((prev) =>
                prev.map((record) =>
                  record.id === e.record.id ? (e.record as unknown as SiloCapacity) : record
                )
              );
            } else if (e.action === 'delete') {
              setRecords((prev) => prev.filter((record) => record.id !== e.record.id));
            } else {
              fetchRecords();
            }
          })
        );
      } catch (error) {
        // Ignore connection errors to prevent excessive logging
        if (!error.message?.includes('autocancelled') && !error.message?.includes('connection')) {
          // Handle error silently or through error monitoring
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
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<SiloCapacity, 'id'>) => {
      try {
        await pb.collection('silo_capacities').create(record);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: SiloCapacity) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection('silo_capacities').update(id, updateData);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('silo_capacities').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<SiloCapacity, 'id'>[]) => {
      try {
        const currentRecords = await pb.collection('silo_capacities').getFullList();
        for (const record of currentRecords) {
          await pb.collection('silo_capacities').delete(record.id);
        }
        for (const record of newRecords) {
          await pb.collection('silo_capacities').create(record);
        }
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};
