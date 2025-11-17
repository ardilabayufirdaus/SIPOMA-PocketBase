import { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';

const COLLECTION_NAME = 'cop_parameters';

export const useCopParameters = (plantCategory?: string, plantUnit?: string) => {
  const [copParameterIds, setCopParameterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Use refs to store current filter values for real-time subscription
  const currentPlantCategoryRef = useRef(plantCategory);
  const currentPlantUnitRef = useRef(plantUnit);

  // Update refs when props change
  currentPlantCategoryRef.current = plantCategory;
  currentPlantUnitRef.current = plantUnit;

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
        .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);

      if (record && record.parameter_ids) {
        setCopParameterIds(record.parameter_ids);
      } else {
        setCopParameterIds([]);
      }
    } catch (error) {
      if (error.status === 404) {
        // Set empty array as fallback
        setCopParameterIds([]);
      } else if (error.message?.includes('autocancelled')) {
        // Ignore autocancelled requests
      } else {
        setCopParameterIds([]);
      }
    }
    setLoading(false);
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    const abortController = new AbortController();

    // Enhanced realtime subscription for COP parameters changes
    let isSubscribed = true;
    let unsubPromise;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;

        // Only subscribe if we have valid plant category and unit
        if (!currentPlantCategoryRef.current || !currentPlantUnitRef.current) {
          return;
        }

        unsubPromise = await safeApiCall(() =>
          pb.collection(COLLECTION_NAME).subscribe('*', (e) => {
            if (!isSubscribed) return;

            // Use current values from refs to check if this event is relevant
            const currentCategory = currentPlantCategoryRef.current;
            const currentUnit = currentPlantUnitRef.current;

            if (
              e.record.plant_category === currentCategory &&
              e.record.plant_unit === currentUnit
            ) {
              if (e.action === 'create' || e.action === 'update') {
                // Update local state with the new parameter_ids
                setCopParameterIds(e.record.parameter_ids || []);
              } else if (e.action === 'delete') {
                // Clear local state if the record is deleted
                setCopParameterIds([]);
              }
            }
          })
        );
      } catch (error) {
        // Ignore connection errors to prevent excessive logging
        if (!error.message?.includes('autocancelled') && !error.message?.includes('connection')) {
          // Do nothing for other errors
        }
      }
    };

    // Only fetch and subscribe if we have valid parameters
    if (plantCategory && plantUnit) {
      fetchCopParameters();
      subscribe();
    }

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

      abortController.abort();
    };
  }, [plantCategory, plantUnit]);

  const saveCopParameters = useCallback(
    async (ids: string[]) => {
      if (!plantCategory || !plantUnit) {
        return;
      }

      try {
        // Find the COP parameters record for this plant category and unit
        const record = await pb
          .collection(COLLECTION_NAME)
          .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);

        // Update the record with new parameter_ids
        await pb.collection(COLLECTION_NAME).update(record.id, { parameter_ids: ids });

        // Update local state immediately for better UX
        setCopParameterIds(ids);

        // Note: Local state will also be updated via real-time subscription
      } catch (error) {
        if (error.status === 404) {
          // Ignore 404 errors
        } else if (error.message?.includes('autocancelled')) {
          // Ignore autocancelled requests
        } else {
          // Do nothing for other errors
        }
      }
    },
    [plantCategory, plantUnit]
  );

  return { copParameterIds, setCopParameterIds: saveCopParameters, loading };
};
