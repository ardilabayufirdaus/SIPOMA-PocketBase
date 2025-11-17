import { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';

const COLLECTION_NAME = 'cop_footer_parameters';

export const useCopFooterParametersRecords = (plantCategory?: string, plantUnit?: string) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!plantCategory || !plantUnit) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await safeApiCall(() =>
        pb.collection(COLLECTION_NAME).getFullList({
          filter: `plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`,
          sort: 'created',
        })
      );

      setRecords(result || []);
    } catch (error) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, refetch: fetchRecords };
};
