import { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';

const COLLECTION_NAME = 'rkc_cop_footer_parameters';

export const useRkcCopFooterParameters = (plantCategory?: string, plantUnit?: string) => {
  const [copFooterParameterIds, setCopFooterParameterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Use refs to store current filter values for real-time subscription
  const currentPlantCategoryRef = useRef(plantCategory);
  const currentPlantUnitRef = useRef(plantUnit);

  // Update refs when props change
  currentPlantCategoryRef.current = plantCategory;
  currentPlantUnitRef.current = plantUnit;

  const fetchCopFooterParameters = useCallback(async () => {
    if (!plantCategory || !plantUnit) {
      setCopFooterParameterIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Find COP footer parameters for specific plant category and unit
      const record = await pb
        .collection(COLLECTION_NAME)
        .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);

      if (record && record.parameter_ids) {
        setCopFooterParameterIds(record.parameter_ids);
      } else {
        setCopFooterParameterIds([]);
      }
    } catch (error) {
      if ((error as any).status === 404) {
        // Set empty array as fallback
        setCopFooterParameterIds([]);
      } else if ((error as any).message?.includes('autocancelled')) {
        // Ignore autocancelled requests
      } else {
        setCopFooterParameterIds([]);
      }
    }
    setLoading(false);
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    const abortController = new AbortController();

    // Enhanced realtime subscription for COP footer parameters changes
    let isSubscribed = true;
    let unsubPromise: (() => void) | Promise<unknown> | undefined;

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
                setCopFooterParameterIds(e.record.parameter_ids || []);
              } else if (e.action === 'delete') {
                // Clear local state if the record is deleted
                setCopFooterParameterIds([]);
              }
            }
          })
        );
      } catch (error) {
        // Ignore connection errors
      }
    };

    // Only fetch and subscribe if we have valid parameters
    if (plantCategory && plantUnit) {
      fetchCopFooterParameters();
      subscribe();
    }

    return () => {
      // Mark component as unmounted
      isSubscribed = false;

      // Cancel existing subscription
      if (unsubPromise) {
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {}
        } else if (typeof (unsubPromise as Promise<any>).then === 'function') {
          (unsubPromise as Promise<any>)
            .then((unsub) => {
              if (typeof unsub === 'function') unsub();
            })
            .catch(() => {});
        }
      }

      abortController.abort();
    };
  }, [plantCategory, plantUnit, fetchCopFooterParameters]);

  const updateCopFooterParameters = useCallback(
    async (parameterIds: string[]) => {
      if (!plantCategory || !plantUnit) {
        return;
      }

      try {
        // Try to find existing record
        const existingRecord = await pb
          .collection(COLLECTION_NAME)
          .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);

        // Update existing record
        await pb.collection(COLLECTION_NAME).update(existingRecord.id, {
          parameter_ids: parameterIds,
        });

        // Note: Local state will be updated via real-time subscription
        // But let's also update immediately for better UX
        setCopFooterParameterIds(parameterIds);
      } catch (error) {
        if ((error as any).status === 404) {
          // Create new record if not exists
          await pb.collection(COLLECTION_NAME).create({
            plant_category: plantCategory,
            plant_unit: plantUnit,
            parameter_ids: parameterIds,
          });
          setCopFooterParameterIds(parameterIds);
        } else {
          throw error;
        }
      }
    },
    [plantCategory, plantUnit]
  );

  return {
    copFooterParameterIds,
    setCopFooterParameterIds: updateCopFooterParameters,
    loading,
    refetch: fetchCopFooterParameters,
  };
};
