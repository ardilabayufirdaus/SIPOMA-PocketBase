import { useState, useCallback, useEffect } from 'react';
import { PicSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';

const CACHE_KEY = CacheKeys.RKC_PIC_SETTINGS;
const CACHE_TIME = 10; // Minutes

export const useRkcPicSettings = () => {
  const [records, setRecords] = useState<PicSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const cached = cacheManager.get<PicSetting[]>(CACHE_KEY);
    if (cached) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        pb.collection('rkc_pic_settings').getFullList({
          sort: 'pic',
        })
      );

      if (result) {
        const typedData = result as unknown as PicSetting[];
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
          pb.collection('rkc_pic_settings').subscribe('*', (e) => {
            if (!isSubscribed) return;
            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create' && e.record) {
              setRecords((prev) =>
                [...prev, e.record as unknown as PicSetting].sort((a, b) =>
                  a.pic.localeCompare(b.pic)
                )
              );
            } else if (e.action === 'update' && e.record) {
              setRecords((prev) =>
                prev.map((record) =>
                  record.id === e.record.id ? (e.record as unknown as PicSetting) : record
                )
              );
            } else if (e.action === 'delete' && e.record) {
              setRecords((prev) => prev.filter((record) => record.id !== e.record.id));
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
  }, []);

  const addRecord = useCallback(
    async (record: Omit<PicSetting, 'id'>) => {
      try {
        await pb.collection('rkc_pic_settings').create(record);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const updateRecord = useCallback(
    async (updatedRecord: PicSetting) => {
      try {
        const { id, ...updateData } = updatedRecord;
        await pb.collection('rkc_pic_settings').update(id, updateData);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      try {
        await pb.collection('rkc_pic_settings').delete(recordId);
        cacheManager.delete(CACHE_KEY);
        fetchRecords();
      } catch {}
    },
    [fetchRecords]
  );

  return { records, loading, addRecord, updateRecord, deleteRecord };
};
