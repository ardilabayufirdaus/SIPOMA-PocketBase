import { useState, useCallback, useEffect } from 'react';
import { ReportSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

// Constants for cache management
const CACHE_KEY = CacheKeys.REPORT_SETTINGS;
const CACHE_TIME = 15; // Minutes

export const useReportSettings = () => {
  const [records, setRecords] = useState<ReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<ReportSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection('report_settings').getFullList({
          sort: 'order',
        })
      );

      if (result) {
        const typedData = result as unknown as ReportSetting[];
        setRecords(typedData);
        // Cache for 15 minutes
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        setRecords([]);
      }
    } catch (error) {
      if (error.status === 404) {
        // Collection doesn't exist yet
        setRecords([]);
      } else if (error.message?.includes('autocancelled')) {
        // Ignore autocancelled requests
      } else {
        // Handle error silently
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
          pb.collection('report_settings').subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Clear cache when data changes
            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create') {
              setRecords((prev) =>
                [...prev, e.record as unknown as ReportSetting].sort((a, b) => a.order - b.order)
              );
            } else if (e.action === 'update') {
              setRecords((prev) =>
                prev
                  .map((record) =>
                    record.id === e.record.id ? (e.record as unknown as ReportSetting) : record
                  )
                  .sort((a, b) => a.order - b.order)
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
          // Handle error silently
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
    async (record: Omit<ReportSetting, 'id'>) => {
      try {
        await pb.collection('report_settings').create(record);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ReportSetting) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection('report_settings').update(id, updateData);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('report_settings').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ReportSetting, 'id'>[]) => {
      try {
        const currentRecords = await pb.collection('report_settings').getFullList();
        for (const record of currentRecords) {
          await pb.collection('report_settings').delete(record.id);
        }
        for (const record of newRecords) {
          await pb.collection('report_settings').create(record);
        }
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const updateOrder = useCallback(
    async (orderedRecords: ReportSetting[]) => {
      try {
        const promises = orderedRecords.map((record, index) =>
          pb.collection('report_settings').update(record.id, { order: index })
        );
        await Promise.all(promises);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords, updateOrder };
};

