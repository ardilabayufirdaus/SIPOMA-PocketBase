import { useState, useCallback, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { Inspection } from '../services/pocketbase';

export const useInspectionData = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('inspections').getList(1, 100, {
        sort: '-date',
      });

      const mappedData = records.items.map((record: any) => ({
        id: record.id,
        date: record.date,
        title: record.title,
        equipment: record.equipment,
        status: record.status,
        findings: record.findings,
        inspector_id: record.inspector_id,
        created: record.created,
        updated: record.updated,
      }));

      setInspections(mappedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Jangan tampilkan error jika koleksi belum ada (404), biarkan kosong
      if (errorMessage.includes('404')) {
        setInspections([]);
      } else {
        setError(errorMessage);

        // Auto-retry for network errors
        if (
          retryCount < 3 &&
          (errorMessage.includes('Failed to fetch') || errorMessage.includes('network'))
        ) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => fetchInspections(retryCount + 1), delay);
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const addInspection = useCallback(
    async (data: Omit<Inspection, 'id' | 'created' | 'updated'>) => {
      try {
        await pb.collection('inspections').create(data);
        fetchInspections();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add inspection';
        throw new Error(errorMessage);
      }
    },
    [fetchInspections]
  );

  const updateInspection = useCallback(
    async (id: string, data: Partial<Inspection>) => {
      try {
        await pb.collection('inspections').update(id, data);
        fetchInspections();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update inspection';
        throw new Error(errorMessage);
      }
    },
    [fetchInspections]
  );

  const deleteInspection = useCallback(
    async (id: string) => {
      try {
        await pb.collection('inspections').delete(id);
        fetchInspections();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete inspection';
        throw new Error(errorMessage);
      }
    },
    [fetchInspections]
  );

  return {
    inspections,
    loading,
    error,
    addInspection,
    updateInspection,
    deleteInspection,
    refetch: fetchInspections,
  };
};
