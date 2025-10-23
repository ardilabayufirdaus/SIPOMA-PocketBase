import { useState, useCallback, useEffect } from 'react';
import { ParameterSetting } from '../types';
import { pb } from '../utils/pocketbase';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

// Constants for cache management
const CACHE_KEY = CacheKeys.PARAMETER_SETTINGS;
const CACHE_TIME = 30; // Minutes

export const useParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<ParameterSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection('parameter_settings').getFullList({
          sort: 'parameter',
        })
      );

      if (result) {
        const typedData = result as unknown as ParameterSetting[];
        setRecords(typedData);
        // Cache for 30 minutes since parameter settings don't change frequently
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
        // Handle error silently or through error monitoring
        setRecords([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription for parameter_settings changes
  useEffect(() => {
    // Gunakan variabel untuk mencegah multiple subscriptions
    let isSubscribed = true;
    let unsubPromise;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection('parameter_settings').subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Clear cache when data changes
            cacheManager.delete(CACHE_KEY);

            // Optimized state updates based on event type
            if (e.action === 'create') {
              setRecords((prev) =>
                [
                  ...prev,
                  {
                    ...e.record,
                    parameter: e.record.parameter,
                    data_type: e.record.data_type,
                    unit: e.record.unit,
                    category: e.record.category,
                  } as ParameterSetting,
                ].sort((a, b) => a.parameter.localeCompare(b.parameter))
              );
            } else if (e.action === 'update') {
              setRecords((prev) =>
                prev
                  .map((record) =>
                    record.id === e.record.id
                      ? ({
                          ...e.record,
                          parameter: e.record.parameter,
                          data_type: e.record.data_type,
                          unit: e.record.unit,
                          category: e.record.category,
                        } as ParameterSetting)
                      : record
                  )
                  .sort((a, b) => a.parameter.localeCompare(b.parameter))
              );
            } else if (e.action === 'delete') {
              setRecords((prev) =>
                prev
                  .filter((record) => record.id !== e.record.id)
                  .sort((a, b) => a.parameter.localeCompare(b.parameter))
              );
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
      // Tandai komponen sebagai di-unmount
      isSubscribed = false;

      // Batalkan subscription yang ada
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
    async (record: Omit<ParameterSetting, 'id'>) => {
      // Convert undefined values to null for Supabase compatibility
      const cleanedRecord = {
        ...record,
        min_value: record.min_value === undefined ? null : record.min_value,
        max_value: record.max_value === undefined ? null : record.max_value,
        opc_min_value: record.opc_min_value === undefined ? null : record.opc_min_value,
        opc_max_value: record.opc_max_value === undefined ? null : record.opc_max_value,
        pcc_min_value: record.pcc_min_value === undefined ? null : record.pcc_min_value,
        pcc_max_value: record.pcc_max_value === undefined ? null : record.pcc_max_value,
      };

      try {
        await pb.collection('parameter_settings').create(cleanedRecord);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ParameterSetting) => {
      const { id, ...updateData } = updatedRecord;

      // Convert undefined values to null for Supabase compatibility
      const cleanedUpdateData = {
        ...updateData,
        min_value: updateData.min_value === undefined ? null : updateData.min_value,
        max_value: updateData.max_value === undefined ? null : updateData.max_value,
        opc_min_value: updateData.opc_min_value === undefined ? null : updateData.opc_min_value,
        opc_max_value: updateData.opc_max_value === undefined ? null : updateData.opc_max_value,
        pcc_min_value: updateData.pcc_min_value === undefined ? null : updateData.pcc_min_value,
        pcc_max_value: updateData.pcc_max_value === undefined ? null : updateData.pcc_max_value,
      };

      try {
        await pb.collection('parameter_settings').update(id, cleanedUpdateData);
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
        await pb.collection('parameter_settings').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ParameterSetting, 'id'>[]) => {
      try {
        // First, get all existing records to delete them properly
        const existingRecords = await pb.collection('parameter_settings').getFullList();

        // Delete all existing records if any exist
        if (existingRecords && existingRecords.length > 0) {
          for (const record of existingRecords) {
            await pb.collection('parameter_settings').delete(record.id);
          }
        }

        // Insert new records
        if (newRecords.length > 0) {
          for (const record of newRecords) {
            await pb.collection('parameter_settings').create(record);
          }
        }

        // Clear cache and refresh data
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {
        // Handle error silently or through error monitoring
      }
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    setAllRecords,
  };
};
