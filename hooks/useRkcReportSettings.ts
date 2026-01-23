import { useState, useCallback, useEffect } from 'react';
import { RkcReportSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

// Constants for cache management
const CACHE_KEY = CacheKeys.RKC_REPORT_SETTINGS || 'rkc_report_settings';
const COLLECTION = 'rkc_report_settings';
const CACHE_TIME = 15; // Minutes

export const useRkcReportSettings = () => {
  const [records, setRecords] = useState<RkcReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<RkcReportSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection(COLLECTION).getFullList({
          sort: 'order',
        })
      );

      if (result) {
        const typedData = result as unknown as RkcReportSetting[];
        setRecords(typedData);
        // Cache for 15 minutes
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        setRecords([]);
      }
    } catch (error) {
      if ((error as any).status === 404) {
        // Collection doesn't exist yet
        setRecords([]);
      } else if ((error as any).message?.includes('autocancelled')) {
        // Ignore autocancelled requests
      } else {
        // Handle error silently or log if needed
        setRecords([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();

    let isSubscribed = true;
    let unsubPromise: (() => void) | Promise<unknown> | undefined;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection(COLLECTION).subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Clear cache when data changes
            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create') {
              setRecords((prev) =>
                [...prev, e.record as unknown as RkcReportSetting].sort((a, b) => a.order - b.order)
              );
            } else if (e.action === 'update') {
              setRecords((prev) =>
                prev
                  .map((record) =>
                    record.id === e.record.id ? (e.record as unknown as RkcReportSetting) : record
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
      }
    };

    // Start subscription
    subscribe();

    return () => {
      // Mark component as unmounted
      isSubscribed = false;

      // Cancel existing subscription
      if (unsubPromise) {
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {}
        } else if (typeof (unsubPromise as Promise<any>).then === 'function') {
          (unsubPromise as Promise<any>)
            .then((unsub) => {
              if (typeof unsub === 'function') unsub();
            })
            .catch(() => {});
        }
      }
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<RkcReportSetting, 'id'>) => {
      try {
        await pb.collection(COLLECTION).create(record);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: RkcReportSetting) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection(COLLECTION).update(id, updateData);
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
        await pb.collection(COLLECTION).delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently
      }
    },
    [fetchRecords]
  );

  const updateOrder = useCallback(
    async (orderedRecords: RkcReportSetting[]) => {
      try {
        const promises = orderedRecords.map((record, index) =>
          pb.collection(COLLECTION).update(record.id, { order: index })
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

  return { records, loading, addRecord, updateRecord, deleteRecord, updateOrder };
};
