import { useState, useCallback, useEffect } from 'react';
import { SiloCapacity } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

const CACHE_KEY = CacheKeys.RKC_SILO_CAPACITIES;
const CACHE_TIME = 15; // Minutes

export const useRkcSiloCapacities = () => {
  const [records, setRecords] = useState<SiloCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const cached = cacheManager.get<SiloCapacity[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await pb.collection('rkc_silo_capacities').getFullList({
        sort: 'silo_name',
      });
      const typedData = result as unknown as SiloCapacity[];
      setRecords(typedData);
      cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        setRecords([]);
      } else {
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
          pb.collection('rkc_silo_capacities').subscribe('*', (e) => {
            if (!isSubscribed) return;
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
    async (record: Omit<SiloCapacity, 'id'>) => {
      try {
        await pb.collection('rkc_silo_capacities').create(record);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: SiloCapacity) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection('rkc_silo_capacities').update(id, updateData);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('rkc_silo_capacities').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const setAllRecords = useCallback(
    async (newRecords: Omit<SiloCapacity, 'id'>[]) => {
      try {
        const currentRecords = await pb.collection('rkc_silo_capacities').getFullList();
        for (const record of currentRecords) {
          await pb.collection('rkc_silo_capacities').delete(record.id);
        }
        for (const record of newRecords) {
          await pb.collection('rkc_silo_capacities').create(record);
        }
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};
