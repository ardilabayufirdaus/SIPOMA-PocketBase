import { useState, useCallback, useEffect } from 'react';
import { SimpleReportSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

// Constants for cache management
const CACHE_KEY = 'simple_report_settings';
const CACHE_TIME = 15; // Minutes

export const useSimpleReportSettings = () => {
  const [records, setRecords] = useState<SimpleReportSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<SimpleReportSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection('simple_report_settings').getFullList({
          sort: 'order',
        })
      );

      if (result) {
        const typedData = result as unknown as SimpleReportSetting[];
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
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(
    async (data: Omit<SimpleReportSetting, 'id' | 'created' | 'updated'>) => {
      try {
        const result = await safeApiCall(() =>
          pb.collection('simple_report_settings').create(data)
        );

        if (result) {
          const newRecord = result as unknown as SimpleReportSetting;
          setRecords((prev) => [...prev, newRecord]);
          // Invalidate cache
          cacheManager.delete(CACHE_KEY);
          return newRecord;
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const updateRecord = useCallback(async (id: string, data: Partial<SimpleReportSetting>) => {
    try {
      const result = await safeApiCall(() =>
        pb.collection('simple_report_settings').update(id, data)
      );

      if (result) {
        const updatedRecord = result as unknown as SimpleReportSetting;
        setRecords((prev) => prev.map((record) => (record.id === id ? updatedRecord : record)));
        // Invalidate cache
        cacheManager.delete(CACHE_KEY);
        return updatedRecord;
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await safeApiCall(() => pb.collection('simple_report_settings').delete(id));

      setRecords((prev) => prev.filter((record) => record.id !== id));
      // Invalidate cache
      cacheManager.delete(CACHE_KEY);
    } catch (error) {
      throw error;
    }
  }, []);

  const updateOrder = useCallback(async (items: SimpleReportSetting[]) => {
    try {
      // Update order for all items
      const updates = items.map((item, index) =>
        safeApiCall(() =>
          pb.collection('simple_report_settings').update(item.id, { order: index + 1 })
        )
      );

      await Promise.all(updates);

      // Update local state
      setRecords(items.map((item, index) => ({ ...item, order: index + 1 })));
      // Invalidate cache
      cacheManager.delete(CACHE_KEY);
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    updateOrder,
    refetch: fetchRecords,
  };
};
