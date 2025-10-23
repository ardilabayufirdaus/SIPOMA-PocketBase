import { useState, useCallback, useEffect } from 'react';
import { PicSetting } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';

export const usePicSettings = () => {
  const [records, setRecords] = useState<PicSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await safeApiCall(() =>
        pb.collection('pic_settings').getFullList({
          sort: 'pic',
        })
      );

      if (result) {
        const typedData = result as unknown as PicSetting[];
        setRecords(typedData);
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
  }, [fetchRecords]);

  useEffect(() => {
    let unsubPromise: (() => void) | Promise<(() => void) | undefined> | undefined;

    const setupSubscription = async () => {
      unsubPromise = await safeApiCall(() =>
        pb.collection('pic_settings').subscribe('*', (_e) => {
          // Log bisa menyebabkan konsol menjadi berantakan, sebaiknya komentar saja
          // console.log('PIC settings realtime update:', e.action, e.record);
          fetchRecords(); // Refetch all on any change
        })
      );
    };

    setupSubscription();

    return () => {
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

  const addRecord = useCallback(async (record: Omit<PicSetting, 'id'>) => {
    await safeApiCall(() => pb.collection('pic_settings').create(record));
  }, []);

  const updateRecord = useCallback(async (updatedRecord: PicSetting) => {
    const { id, ...updateData } = updatedRecord;
    await safeApiCall(() => pb.collection('pic_settings').update(id, updateData));
  }, []);

  const deleteRecord = useCallback(async (recordId: string) => {
    await safeApiCall(() => pb.collection('pic_settings').delete(recordId));
  }, []);

  const setAllRecords = useCallback(async (newRecords: Omit<PicSetting, 'id'>[]) => {
    const currentRecords = await safeApiCall(() => pb.collection('pic_settings').getFullList());

    if (currentRecords) {
      for (const record of currentRecords) {
        await safeApiCall(() => pb.collection('pic_settings').delete(record.id));
      }
    }

    for (const record of newRecords) {
      await safeApiCall(() => pb.collection('pic_settings').create(record));
    }
  }, []);

  return { records, loading, addRecord, updateRecord, deleteRecord, setAllRecords };
};

