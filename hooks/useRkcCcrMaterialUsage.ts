import { useCallback, useState } from 'react';
import { formatDateToISO8601 } from '../utils/dateUtils';
import { pb } from '../utils/pocketbase-simple';

/**
 * Type definitions for CCR Material Usage
 */

// Raw database schema fields
interface CcrMaterialUsageSchema {
  id?: string;
  date?: string;
  plant_category?: string;
  plant_unit?: string;
  shift?: 'shift3_cont' | 'shift1' | 'shift2' | 'shift3';
  clinker?: number;
  gypsum?: number;
  limestone?: number;
  trass?: number;
  fly_ash?: number;
  fine_trass?: number;
  ckd?: number;
  total_production?: number;
  created?: string;
  updated?: string;
}

// Enhanced material usage data for UI (can be extended with calculated fields)
export interface MaterialUsageData extends CcrMaterialUsageSchema {
  // Additional calculated fields can be added here if needed in the future
}

// Query parameters for fetching data
interface MaterialUsageParams {
  date?: string;
  plant_unit?: string;
  plant_category?: string;
  shift?: string;
  page?: number;
  perPage?: number;
}

/**
 * Hook for managing RKC CCR Material Usage data with CRUD operations
 * Targeting rkc_ccr_material_usage
 */
export const useRkcCcrMaterialUsage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get material usage data for a specific date with pagination
   */
  const getDataForDatePaginated = useCallback(async (params: MaterialUsageParams) => {
    if (!params.date) {
      return { items: [], totalItems: 0, totalPages: 0 };
    }

    setLoading(true);
    setError(null);

    try {
      const formattedDate = formatDateToISO8601(params.date);
      const page = params.page || 1;
      const perPage = params.perPage || 20;

      let filter = `date="${formattedDate}"`;

      if (params.plant_unit) {
        filter += ` && plant_unit="${params.plant_unit}"`;
      }

      if (params.plant_category) {
        filter += ` && plant_category="${params.plant_category}"`;
      }

      if (params.shift) {
        filter += ` && shift="${params.shift}"`;
      }

      const result = await pb.collection('rkc_ccr_material_usage').getList(page, perPage, {
        filter,
        sort: 'created',
      });

      return {
        items: result.items as MaterialUsageData[],
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { items: [], totalItems: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all material usage data for a specific date (no pagination)
   */
  const getDataForDate = useCallback(
    async (date: string, plant_unit?: string, plant_category?: string) => {
      if (!date) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const formattedDate = formatDateToISO8601(date);
        let filter = `date="${formattedDate}"`;

        if (plant_unit) {
          filter += ` && plant_unit="${plant_unit}"`;
        }

        if (plant_category) {
          filter += ` && plant_category="${plant_category}"`;
        }

        const items = await pb.collection('rkc_ccr_material_usage').getFullList({
          filter,
          sort: 'created',
        });

        return items as MaterialUsageData[];
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch material usage data'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get material usage data for specific unit and date
   */
  const getDataForUnitAndDate = useCallback(
    async (date: string, plant_unit: string, plant_category?: string) => {
      if (!date || !plant_unit) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const formattedDate = formatDateToISO8601(date);
        let filter = `date="${formattedDate}" && plant_unit="${plant_unit}"`;

        if (plant_category) {
          filter += ` && plant_category="${plant_category}"`;
        }

        const items = await pb.collection('rkc_ccr_material_usage').getFullList({
          filter,
          sort: 'created',
        });

        return items as MaterialUsageData[];
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch material usage data for unit')
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Create new material usage record
   */
  const createMaterialUsage = useCallback(async (data: Partial<CcrMaterialUsageSchema>) => {
    try {
      // Format the date if provided
      if (data.date) {
        data.date = formatDateToISO8601(data.date as string);
      }

      // Calculate total_production if not provided
      if (data.total_production === undefined && data.clinker !== undefined) {
        const total =
          (data.clinker || 0) +
          (data.gypsum || 0) +
          (data.limestone || 0) +
          (data.trass || 0) +
          (data.fly_ash || 0) +
          (data.fine_trass || 0) +
          (data.ckd || 0);
        data.total_production = total;
      }

      return await pb.collection('rkc_ccr_material_usage').create(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create material usage data'));
      throw err;
    }
  }, []);

  /**
   * Update material usage record
   */
  const updateMaterialUsage = useCallback(
    async (
      idOrDateOrParams: string | Partial<CcrMaterialUsageSchema>,
      dataOrPlantUnit?: Partial<CcrMaterialUsageSchema> | string,
      plantUnit?: string
    ) => {
      // Method 1: Update by ID
      if (typeof idOrDateOrParams === 'string' && typeof dataOrPlantUnit === 'object') {
        const id = idOrDateOrParams;
        const data = dataOrPlantUnit;

        if (!id) {
          throw new Error('ID is required');
        }

        try {
          // Calculate total_production if material fields are being updated
          if (
            data.total_production === undefined &&
            (data.clinker !== undefined ||
              data.gypsum !== undefined ||
              data.limestone !== undefined ||
              data.trass !== undefined ||
              data.fly_ash !== undefined ||
              data.fine_trass !== undefined ||
              data.ckd !== undefined)
          ) {
            // Get current data first to calculate new total
            const currentRecord = await pb.collection('rkc_ccr_material_usage').getOne(id);
            const total =
              (data.clinker ?? currentRecord.clinker ?? 0) +
              (data.gypsum ?? currentRecord.gypsum ?? 0) +
              (data.limestone ?? currentRecord.limestone ?? 0) +
              (data.trass ?? currentRecord.trass ?? 0) +
              (data.fly_ash ?? currentRecord.fly_ash ?? 0) +
              (data.fine_trass ?? currentRecord.fine_trass ?? 0) +
              (data.ckd ?? currentRecord.ckd ?? 0);
            data.total_production = total;
          }

          return await pb.collection('rkc_ccr_material_usage').update(id, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to update material usage data'));
          throw err;
        }
      }
      // Method 2: Update by date and plant_unit
      else if (
        typeof idOrDateOrParams === 'string' &&
        typeof dataOrPlantUnit === 'string' &&
        plantUnit
      ) {
        const date = idOrDateOrParams;
        const shift = dataOrPlantUnit;
        const unit = plantUnit;

        try {
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && plant_unit="${unit}" && shift="${shift}"`;

          const records = await pb.collection('rkc_ccr_material_usage').getFullList({
            filter,
            sort: '-created',
          });

          if (records.length === 0) {
            throw new Error('Material usage record not found');
          }

          const record = records[0];
          return record;
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to find material usage record'));
          throw err;
        }
      } else {
        throw new Error('Invalid parameters for updateMaterialUsage');
      }
    },
    []
  );

  /**
   * Delete material usage record
   */
  const deleteMaterialUsage = useCallback(async (id: string) => {
    try {
      return await pb.collection('rkc_ccr_material_usage').delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete material usage data'));
      throw err;
    }
  }, []);

  /**
   * Save material usage data (create or update based on existence)
   */
  const saveMaterialUsage = useCallback(async (data: Partial<CcrMaterialUsageSchema>) => {
    if (!data.date || !data.plant_unit || !data.shift) {
      throw new Error('Date, plant_unit, and shift are required');
    }

    setLoading(true);
    setError(null);

    try {
      const formattedDate = formatDateToISO8601(data.date);
      const filter = `date="${formattedDate}" && plant_unit="${data.plant_unit}" && shift="${data.shift}"`;

      // Check if record exists
      const existingRecords = await pb.collection('rkc_ccr_material_usage').getFullList({
        filter,
      });

      // Calculate total_production
      const total =
        (data.clinker || 0) +
        (data.gypsum || 0) +
        (data.limestone || 0) +
        (data.trass || 0) +
        (data.fly_ash || 0) +
        (data.fine_trass || 0) +
        (data.ckd || 0);

      const saveData = {
        ...data,
        date: formattedDate,
        total_production: total,
      };

      if (existingRecords.length > 0) {
        // Update existing record
        const record = existingRecords[0];
        return await pb.collection('rkc_ccr_material_usage').update(record.id, saveData);
      } else {
        // Create new record
        return await pb.collection('rkc_ccr_material_usage').create(saveData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save material usage data'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save material usage record (silent version - no loading state)
   */
  const saveMaterialUsageSilent = useCallback(async (data: Partial<CcrMaterialUsageSchema>) => {
    if (!data.date || !data.plant_unit || !data.shift || !data.plant_category) {
      throw new Error('Date, plant_unit, plant_category, and shift are required');
    }

    try {
      const formattedDate = formatDateToISO8601(data.date);
      const filter = `date="${formattedDate}" && plant_unit="${data.plant_unit}" && plant_category="${data.plant_category}" && shift="${data.shift}"`;

      // Check if record exists
      const existingRecords = await pb.collection('rkc_ccr_material_usage').getFullList({
        filter,
      });

      // Calculate total_production
      const total =
        (data.clinker || 0) +
        (data.gypsum || 0) +
        (data.limestone || 0) +
        (data.trass || 0) +
        (data.fly_ash || 0) +
        (data.fine_trass || 0) +
        (data.ckd || 0);

      const saveData = {
        ...data,
        date: formattedDate,
        total_production: total,
      };

      if (existingRecords.length > 0) {
        // Update existing record
        const record = existingRecords[0];
        return await pb.collection('rkc_ccr_material_usage').update(record.id, saveData);
      } else {
        // Create new record
        return await pb.collection('rkc_ccr_material_usage').create(saveData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save material usage data'));
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    getDataForDatePaginated,
    getDataForDate,
    getDataForUnitAndDate,
    createMaterialUsage,
    updateMaterialUsage,
    deleteMaterialUsage,
    saveMaterialUsage,
    saveMaterialUsageSilent,
  };
};
