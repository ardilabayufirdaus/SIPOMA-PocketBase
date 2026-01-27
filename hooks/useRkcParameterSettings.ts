import { useState, useCallback, useEffect } from 'react';
import { ParameterSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

const CACHE_KEY = CacheKeys.RKC_PARAMETER_SETTINGS;
const CACHE_TIME = 30; // Minutes

export const useRkcParameterSettings = () => {
  const [records, setRecords] = useState<ParameterSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const cached = cacheManager.get<ParameterSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection('rkc_parameter_settings').getFullList({
          sort: 'parameter',
        })
      );

      if (result) {
        const typedData = result as unknown as ParameterSetting[];
        setRecords(typedData);
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        setRecords([]);
      }
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        setRecords([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    let isSubscribed = true;
    let unsubPromise: (() => void) | Promise<unknown> | undefined;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection('rkc_parameter_settings').subscribe('*', (e) => {
            if (!isSubscribed) return;
            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create' && e.record) {
              setRecords((prev) =>
                [...prev, e.record as unknown as ParameterSetting].sort((a, b) =>
                  a.parameter.localeCompare(b.parameter)
                )
              );
            } else if (e.action === 'update' && e.record) {
              setRecords((prev) =>
                prev.map((r) =>
                  r.id === e.record.id ? (e.record as unknown as ParameterSetting) : r
                )
              );
            } else if (e.action === 'delete') {
              setRecords((prev) => prev.filter((r) => r.id !== e.record.id));
            }
          })
        );
      } catch (error) {}
    };

    subscribe();

    return () => {
      isSubscribed = false;
      if (unsubPromise) {
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {}
        } else if (unsubPromise && typeof (unsubPromise as Promise<unknown>).then === 'function') {
          (unsubPromise as Promise<() => void>)
            .then((unsub) => {
              if (typeof unsub === 'function') unsub();
            })
            .catch(() => {});
        }
      }
    };
  }, [fetchRecords]);

  const addRecord = useCallback(
    async (record: Omit<ParameterSetting, 'id'>) => {
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
        await pb.collection('rkc_parameter_settings').create(cleanedRecord);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: ParameterSetting) => {
      const { id, ...updateData } = updatedRecord;
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
        await pb.collection('rkc_parameter_settings').update(id, cleanedUpdateData);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('rkc_parameter_settings').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<ParameterSetting, 'id'>[]) => {
      try {
        const existingRecords = await pb.collection('rkc_parameter_settings').getFullList();
        if (existingRecords && existingRecords.length > 0) {
          for (const record of existingRecords) {
            await pb.collection('rkc_parameter_settings').delete(record.id);
          }
        }
        if (newRecords.length > 0) {
          for (const record of newRecords) {
            await pb.collection('rkc_parameter_settings').create(record);
          }
        }
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};
