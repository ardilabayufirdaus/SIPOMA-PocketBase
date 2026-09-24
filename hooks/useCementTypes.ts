import { useState, useCallback, useEffect } from 'react';
import { CementType } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';
import { getFullListOptimized } from '../utils/optimizationAdapter';

const CACHE_KEY = CacheKeys.CEMENT_TYPES;
const CACHE_TIME = 10; // Minutes

const DEFAULT_CEMENT_TYPES: CementType[] = [
  {
    id: 'default-opc',
    name: 'OPC',
    code: 'OPC',
    description: 'Ordinary Portland Cement',
    category: 'CM',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'default-pcc',
    name: 'PCC',
    code: 'PCC',
    description: 'Portland Composite Cement',
    category: 'CM',
    is_active: true,
    sort_order: 2,
  },
];

export const useCementTypes = () => {
  const [records, setRecords] = useState<CementType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const cached = cacheManager.get<CementType[]>(CACHE_KEY);
    if (cached && cached.length > 0) {
      setRecords(cached);
      setLoading(false);
      return;
    }

    try {
      const result = await safeApiCall(() =>
        getFullListOptimized('cement_types', {
          sort: 'sort_order,name',
          limit: 100,
        })
      );

      if (result && Array.isArray(result) && result.length > 0) {
        const typedData = result as unknown as CementType[];
        setRecords(typedData);
        cacheManager.set(CACHE_KEY, typedData, CACHE_TIME);
      } else {
        // Fallback default jika tabel belum ada atau kosong
        setRecords(DEFAULT_CEMENT_TYPES);
      }
    } catch (error) {
      setRecords(DEFAULT_CEMENT_TYPES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Enhanced realtime subscription
  useEffect(() => {
    let isSubscribed = true;
    let unsubscribeFn: (() => void) | undefined;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        const unsub = await safeApiCall(() =>
          pb.collection('cement_types').subscribe('*', (e) => {
            if (!isSubscribed) return;

            cacheManager.delete(CACHE_KEY);

            if (e.action === 'create' && e.record) {
              setRecords((prev) =>
                [
                  ...prev.filter((p) => p.id !== e.record.id),
                  e.record as unknown as CementType,
                ].sort(
                  (a, b) =>
                    (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name)
                )
              );
            } else if (e.action === 'update' && e.record) {
              setRecords((prev) =>
                prev.map((record) =>
                  record.id === e.record.id ? (e.record as unknown as CementType) : record
                )
              );
            } else if (e.action === 'delete' && e.record) {
              setRecords((prev) => prev.filter((record) => record.id !== e.record.id));
            }
          })
        );
        if (typeof unsub === 'function') {
          unsubscribeFn = unsub;
        }
      } catch (error) {
        // Silently handle
      }
    };

    subscribe();

    return () => {
      isSubscribed = false;
      if (unsubscribeFn) {
        unsubscribeFn();
      } else {
        try {
          pb.collection('cement_types').unsubscribe('*');
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Cascade rename existing ccr_parameter_data if name changed
  const cascadeRenameData = async (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;

    try {
      const hourFilters = Array.from({ length: 24 }, (_, i) => `hour${i + 1} = '${oldName}'`).join(
        ' || '
      );
      const res = await pb.collection('ccr_parameter_data').getList(1, 200, {
        filter: hourFilters,
      });

      if (res.items && res.items.length > 0) {
        for (const item of res.items) {
          const updates: Record<string, string> = {};
          for (let h = 1; h <= 24; h++) {
            if (item[`hour${h}`] === oldName) {
              updates[`hour${h}`] = newName;
            }
          }
          if (Object.keys(updates).length > 0) {
            await pb.collection('ccr_parameter_data').update(item.id, updates);
          }
        }
      }
    } catch (err) {
      console.warn('Cascade rename warning:', err);
    }
  };

  const addRecord = async (data: Omit<CementType, 'id'>): Promise<CementType | null> => {
    try {
      const created = await pb.collection('cement_types').create(data);
      cacheManager.delete(CACHE_KEY);
      const newRecord = created as unknown as CementType;
      setRecords((prev) =>
        [...prev, newRecord].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name)
        )
      );
      return newRecord;
    } catch (error) {
      console.error('Failed to add cement type:', error);
      throw error;
    }
  };

  const updateRecord = async (
    id: string,
    data: Partial<CementType>,
    oldName?: string
  ): Promise<CementType | null> => {
    try {
      const updated = await pb.collection('cement_types').update(id, data);
      cacheManager.delete(CACHE_KEY);
      const updatedRecord = updated as unknown as CementType;
      setRecords((prev) => prev.map((record) => (record.id === id ? updatedRecord : record)));

      // If name changed, cascade update existing historical logsheet data
      if (oldName && data.name && oldName !== data.name) {
        cascadeRenameData(oldName, data.name);
      }

      return updatedRecord;
    } catch (error) {
      console.error('Failed to update cement type:', error);
      throw error;
    }
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    try {
      await pb.collection('cement_types').delete(id);
      cacheManager.delete(CACHE_KEY);
      setRecords((prev) => prev.filter((record) => record.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete cement type:', error);
      throw error;
    }
  };

  return {
    records,
    loading,
    refetch: fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
};
