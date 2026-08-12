import { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';

const COLLECTION_NAME = 'derivative_cop_parameters';
const CACHE_TIME = 30; // Minutes

export const useDerivativeCopParameters = (plantCategory?: string, plantUnit?: string) => {
  const [copParameterIds, setCopParameterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Use refs
  const currentPlantCategoryRef = useRef(plantCategory);
  const currentPlantUnitRef = useRef(plantUnit);

  currentPlantCategoryRef.current = plantCategory;
  currentPlantUnitRef.current = plantUnit;

  const fetchCopParameters = useCallback(async () => {
    if (!plantCategory || !plantUnit) {
      setCopParameterIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const cacheKey = CacheKeys.withPrefix(
      CacheKeys.DERIVATIVE_COP_PARAMETERS,
      plantCategory,
      plantUnit
    );

    const cached = cacheManager.get<string[]>(cacheKey);
    if (cached && cached.length > 0) {
      setCopParameterIds(cached);
      setLoading(false);
      return;
    }

    try {
      const record = await safeApiCall(() =>
        pb
          .collection(COLLECTION_NAME)
          .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`)
      );

      if (record && record.parameter_ids && record.parameter_ids.length > 0) {
        setCopParameterIds(record.parameter_ids);
        cacheManager.set(cacheKey, record.parameter_ids, CACHE_TIME);
      } else {
        setCopParameterIds([]);
      }
    } catch {
      setCopParameterIds([]);
    } finally {
      setLoading(false);
    }
  }, [plantCategory, plantUnit]);

  useEffect(() => {
    const abortController = new AbortController();
    let isSubscribed = true;
    let unsubPromise: (() => void) | Promise<unknown> | undefined;

    const subscribe = async () => {
      try {
        if (!isSubscribed) return;
        if (!currentPlantCategoryRef.current || !currentPlantUnitRef.current) return;

        unsubPromise = await safeApiCall(() =>
          pb.collection(COLLECTION_NAME).subscribe('*', (e) => {
            if (!isSubscribed) return;

            const currentCategory = currentPlantCategoryRef.current;
            const currentUnit = currentPlantUnitRef.current;

            if (
              e.record.plant_category === currentCategory &&
              e.record.plant_unit === currentUnit
            ) {
              const cacheKey = CacheKeys.withPrefix(
                CacheKeys.DERIVATIVE_COP_PARAMETERS,
                currentCategory,
                currentUnit
              );
              cacheManager.delete(cacheKey);

              if (e.action === 'create' || e.action === 'update') {
                setCopParameterIds(e.record.parameter_ids || []);
              } else if (e.action === 'delete') {
                setCopParameterIds([]);
              }
            }
          })
        );
      } catch (_error) {
        /* ignore subscription error */
      }
    };

    if (plantCategory && plantUnit) {
      fetchCopParameters();
      subscribe();
    }

    return () => {
      isSubscribed = false;
      if (unsubPromise) {
        if (typeof unsubPromise === 'function') {
          try {
            unsubPromise();
          } catch {
            /* ignore */
          }
        } else if (unsubPromise && typeof (unsubPromise as Promise<unknown>).then === 'function') {
          (unsubPromise as Promise<() => void>)
            .then((unsub) => {
              if (typeof unsub === 'function') unsub();
            })
            .catch(() => {});
        }
      }
      abortController.abort();
    };
  }, [plantCategory, plantUnit, fetchCopParameters]);

  const saveCopParameters = useCallback(
    async (ids: string[]) => {
      if (!plantCategory || !plantUnit) {
        return;
      }

      try {
        const cacheKey = CacheKeys.withPrefix(
          CacheKeys.DERIVATIVE_COP_PARAMETERS,
          plantCategory,
          plantUnit
        );

        let record;
        try {
          record = await pb
            .collection(COLLECTION_NAME)
            .getFirstListItem(`plant_category = "${plantCategory}" && plant_unit = "${plantUnit}"`);
        } catch (err) {
          if ((err as { status?: number })?.status === 404) {
            record = null;
          } else {
            throw err;
          }
        }

        if (record) {
          await pb.collection(COLLECTION_NAME).update(record.id, { parameter_ids: ids });
        } else {
          await pb.collection(COLLECTION_NAME).create({
            plant_category: plantCategory,
            plant_unit: plantUnit,
            parameter_ids: ids,
          });
        }

        setCopParameterIds(ids);
        cacheManager.delete(cacheKey);
      } catch (_error) {
        /* ignore save error */
      }
    },
    [plantCategory, plantUnit]
  );

  return { copParameterIds, setCopParameterIds: saveCopParameters, loading };
};
