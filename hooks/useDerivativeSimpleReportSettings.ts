import { useState, useCallback, useEffect } from 'react';
import { RkcReportSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

const CACHE_KEY =
  CacheKeys.DERIVATIVE_SIMPLE_REPORT_SETTINGS || 'derivative_simple_report_settings';
const COLLECTION = 'derivative_simple_report_settings';
const CACHE_TIME = 15; // Minutes

export const useDerivativeSimpleReportSettings = () => {
  const [records, setRecords] = useState<RkcReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<RkcReportSetting[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
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

      if (result && result.length > 0) {
        const typedData = result as unknown as RkcReportSetting[];
        setRecords(typedData);
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
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
        // Ignore connection errors
      }
    };

    subscribe();

    return () => {
      isSubscribed = false;
      if (unsubPromise) {
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {
            // Ignore unsubscribe errors
          }
        } else if (unsubPromise && typeof (unsubPromise as any).then === 'function') {
          (unsubPromise as Promise<any>).then((unsub) => {
            if (typeof unsub === 'function') {
              try {
                unsub();
              } catch {
                // Ignore unsubscribe errors
              }
            }
          });
        }
      }
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<RkcReportSetting, 'id'>) => {
      try {
        const result = await safeApiCall(() => pb.collection(COLLECTION).create(record));
        cacheManager.delete(CACHE_KEY);
        await fetchRecords();
        return result as unknown as RkcReportSetting;
      } catch (error) {
        console.error('Error adding derivative simple report setting:', error);
        throw error;
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (id: string, updateData: Partial<RkcReportSetting>) => {
      try {
        const result = await safeApiCall(() => pb.collection(COLLECTION).update(id, updateData));
        cacheManager.delete(CACHE_KEY);
        await fetchRecords();
        return result as unknown as RkcReportSetting;
      } catch (error) {
        console.error('Error updating derivative simple report setting:', error);
        throw error;
      }
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await safeApiCall(() => pb.collection(COLLECTION).delete(recordId));
        cacheManager.delete(CACHE_KEY);
        await fetchRecords();
      } catch (error) {
        console.error('Error deleting derivative simple report setting:', error);
        throw error;
      }
    },
    [fetchRecords]
  );

  const updateOrder = useCallback(
    async (orderedItems: RkcReportSetting[]) => {
      try {
        const updatePromises = orderedItems.map((item, index) =>
          pb.collection(COLLECTION).update(item.id, { order: index })
        );
        await Promise.all(updatePromises);
        cacheManager.delete(CACHE_KEY);
        await fetchRecords();
      } catch (error) {
        console.error('Error updating derivative simple report settings order:', error);
        throw error;
      }
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    updateOrder,
  };
};
