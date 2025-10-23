import { useEffect, useState, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';

const COLLECTION_NAME = 'cop_parameters';

export const useCopParameters = (plantCategory?: string, plantUnit?: string) => {
  const [copParameterIds, setCopParameterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCopParameters = useCallback(async () => {
    if (!plantCategory || !plantUnit) {
      setCopParameterIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Find COP parameters for specific plant category and unit
      const record = await pb
        .collection(COLLECTION_NAME)
        .getFirstListItem(`plant_category="${plantCategory}" && plant_unit="${plantUnit}"`);

      if (record && record.parameter_ids) {
        setCopParameterIds(record.parameter_ids);
      } else {
        setCopParameterIds([]);
      }
    } catch (error) {
      if (error.status === 404) {
        console.warn(
          `COP parameters belum dibuat untuk ${plantCategory} - ${plantUnit}. Parameter kosong akan digunakan.`
        );
        // Set empty array as fallback
        setCopParameterIds([]);
      } else if (error.message?.includes('autocancelled')) {
        // Ignore autocancelled requests
        console.debug('Request dibatalkan, mengabaikan.');
      } else {
        console.error('Error fetching COP parameters:', error);
        setCopParameterIds([]);
      }
    }
    setLoading(false);
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchCopParameters();
    return () => {
      abortController.abort();
    };
  }, [fetchCopParameters]);

  const saveCopParameters = useCallback(
    async (ids: string[]) => {
      if (!plantCategory || !plantUnit) {
        console.warn('Plant category dan unit harus disediakan untuk menyimpan COP parameters');
        return;
      }

      try {
        // Find the COP parameters record for this plant category and unit
        const record = await pb
          .collection(COLLECTION_NAME)
          .getFirstListItem(`plant_category="${plantCategory}" && plant_unit="${plantUnit}"`);

        // Update the record with new parameter_ids
        await pb.collection(COLLECTION_NAME).update(record.id, { parameter_ids: ids });

        // Update local state
        setCopParameterIds(ids);
      } catch (error) {
        if (error.status === 404) {
          console.warn(
            `COP parameters belum dibuat untuk ${plantCategory} - ${plantUnit}. Buat manual di PocketBase Admin Panel dengan plant_category: "${plantCategory}", plant_unit: "${plantUnit}", dan parameter_ids: []`
          );
        } else if (error.message?.includes('autocancelled')) {
          // Ignore autocancelled requests
          console.debug('Request dibatalkan, mengabaikan.');
        } else {
          console.error('Error saving COP parameters:', error);
        }
      }
    },
    [plantCategory, plantUnit]
  );

  return { copParameterIds, setCopParameterIds: saveCopParameters, loading };
};

