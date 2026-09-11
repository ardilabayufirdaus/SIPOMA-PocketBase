import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';

const COLLECTION_NAME = 'cop_footer_parameters';

export type CopFooterAggregationType = 'average' | 'total' | 'min' | 'max';

export interface CopFooterParameterConfig {
  id: string;
  aggregation: CopFooterAggregationType;
}

export const normalizeCopFooterConfigs = (raw: any): CopFooterParameterConfig[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { id: item, aggregation: 'average' as CopFooterAggregationType };
      }
      if (item && typeof item === 'object' && item.id) {
        const agg: CopFooterAggregationType = ['average', 'total', 'min', 'max'].includes(
          item.aggregation
        )
          ? item.aggregation
          : 'average';
        return { id: String(item.id), aggregation: agg };
      }
      return null;
    })
    .filter((x): x is CopFooterParameterConfig => x !== null);
};

export const useCopFooterParameters = (plantCategory?: string, plantUnit?: string) => {
  const [copFooterConfigs, setCopFooterConfigs] = useState<CopFooterParameterConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const copFooterParameterIds = useMemo(
    () => copFooterConfigs.map((c) => c.id),
    [copFooterConfigs]
  );

  // Use refs to store current filter values for real-time subscription
  const currentPlantCategoryRef = useRef(plantCategory);
  const currentPlantUnitRef = useRef(plantUnit);

  // Update refs when props change
  currentPlantCategoryRef.current = plantCategory;
  currentPlantUnitRef.current = plantUnit;

  const fetchCopFooterParameters = useCallback(async () => {
    if (!plantCategory || !plantUnit) {
      setCopFooterConfigs([]);
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
        setCopFooterConfigs(normalizeCopFooterConfigs(record.parameter_ids));
      } else {
        setCopFooterConfigs([]);
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Set empty array as fallback
        setCopFooterConfigs([]);
      } else if (error.message?.includes('autocancelled')) {
        // Ignore autocancelled requests
      } else {
        setCopFooterConfigs([]);
      }
    }
    setLoading(false);
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    const abortController = new AbortController();

    // Enhanced realtime subscription for COP footer parameters changes
    let isSubscribed = true;
    let unsubPromise: any;

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
                // Update local state with the new configs
                setCopFooterConfigs(normalizeCopFooterConfigs(e.record.parameter_ids));
              } else if (e.action === 'delete') {
                // Clear local state if the record is deleted
                setCopFooterConfigs([]);
              }
            }
          })
        );
      } catch (error: any) {
        // Ignore connection errors to prevent excessive logging
        if (!error.message?.includes('autocancelled') && !error.message?.includes('connection')) {
          // Do nothing for other errors
        }
      }
    };

    // Only fetch and subscribe if we have valid parameters
    if (plantCategory && plantUnit) {
      fetchCopFooterParameters();
      subscribe();
    }

    return () => {
      // Tandai komponen sebagai di-unmount
      isSubscribed = false;

      // Batalkan subscription yang ada
      if (unsubPromise) {
        // Handle different types that might be returned by subscribe()
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {
            // Ignore cleanup errors
          }
        } else if (unsubPromise && typeof unsubPromise.then === 'function') {
          unsubPromise
            .then((unsub: any) => {
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
  }, [plantCategory, plantUnit, fetchCopFooterParameters]);

  const updateCopFooterParameters = useCallback(
    async (configsOrIds: (CopFooterParameterConfig | string)[]) => {
      if (!plantCategory || !plantUnit) {
        return;
      }

      // Convert any array of strings or configs into CopFooterParameterConfig[]
      const existingMap = new Map(copFooterConfigs.map((c) => [c.id, c.aggregation]));
      const newConfigs: CopFooterParameterConfig[] = configsOrIds.map((item) => {
        if (typeof item === 'string') {
          return {
            id: item,
            aggregation: existingMap.get(item) || 'average',
          };
        }
        return {
          id: item.id,
          aggregation: item.aggregation || existingMap.get(item.id) || 'average',
        };
      });

      try {
        // Try to find existing record
        const existingRecord = await pb
          .collection(COLLECTION_NAME)
          .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);

        // Update existing record
        await pb.collection(COLLECTION_NAME).update(existingRecord.id, {
          parameter_ids: newConfigs,
        });

        // Note: Local state will be updated via real-time subscription
        // But let's also update immediately for better UX
        setCopFooterConfigs(newConfigs);
      } catch (error: any) {
        if (error.status === 404) {
          // Create new record if not exists
          await pb.collection(COLLECTION_NAME).create({
            plant_category: plantCategory,
            plant_unit: plantUnit,
            parameter_ids: newConfigs,
          });
          setCopFooterConfigs(newConfigs);
        } else {
          throw error;
        }
      }
    },
    [plantCategory, plantUnit, copFooterConfigs]
  );

  return {
    copFooterConfigs,
    copFooterParameterIds,
    setCopFooterConfigs: updateCopFooterParameters,
    setCopFooterParameterIds: updateCopFooterParameters,
    loading,
    refetch: fetchCopFooterParameters,
  };
};
