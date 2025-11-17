import { useState, useCallback, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { cacheManager } from '../utils/cacheManager';
import { CacheKeys } from '../utils/cacheKeys';
import { safeApiCall } from '../utils/connectionCheck';
import { getFullListOptimized } from '../utils/optimizationAdapter';

const CACHE_KEY = 'plant_categories';
const CACHE_TIME = 10; // Minutes

export const usePlantCategories = () => {
  const [data, setData] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);

    // Check cache first
    const cached = cacheManager.get<{ id: string; name: string }[]>(CACHE_KEY);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      // Get all plant units and extract distinct categories
      const result = await safeApiCall(() =>
        getFullListOptimized('plant_units', {
          fields: 'category',
          limit: 500,
        })
      );

      if (result) {
        const categories = [...new Set(result.map((item: any) => item.category))].sort();
        const categoryObjects = categories.map((cat) => ({ id: cat, name: cat }));
        setData(categoryObjects);
        cacheManager.set(CACHE_KEY, categoryObjects, CACHE_TIME);
      } else {
        setData([]);
      }
    } catch (error) {
      // If collection doesn't exist, set empty data
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        setData([]);
      } else {
        // Silently fail for other errors
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { data, loading, refetch: fetchCategories };
};
