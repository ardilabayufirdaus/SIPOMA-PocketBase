import { useCallback, useState } from 'react';
import { useRkcSiloCapacities } from './useRkcSiloCapacities';
import { formatDateToISO8601 } from '../utils/dateUtils';
import { pb } from '../utils/pocketbase-simple';

/**
 * Type definitions based on the schema for RKC Silo Data
 */

// Raw database schema fields
interface CcrSiloDataSchema {
  id?: string;
  date?: string;
  silo_id?: string;
  shift1_empty_space?: number | null;
  shift1_content?: number | null;
  shift2_empty_space?: number | null;
  shift2_content?: number | null;
  shift3_empty_space?: number | null;
  shift3_content?: number | null;
  created?: string;
  updated?: string;
  expand?: {
    silo_id?: {
      id: string;
      silo_name: string;
      capacity: number;
      unit: string;
      [key: string]: unknown;
    };
  };
}

// Structured shift data for UI
interface ShiftData {
  emptySpace: number | null | undefined;
  content: number | null | undefined;
}

// Enhanced silo data for UI with calculations and structured data
export interface SiloData extends CcrSiloDataSchema {
  capacity?: number;
  silo_name?: string;
  percentage?: number;
  status?: string;
  unit_id?: string;
  weight_value?: number;
  shift1?: ShiftData;
  shift2?: ShiftData;
  shift3?: ShiftData;
}

// Query parameters for fetching data
interface SiloDataParams {
  unit_id?: string;
  date?: string;
  silo_id?: string;
  page?: number;
  perPage?: number;
}

/**
 * Hook for managing RKC CCR Silo data with optimized CRUD operations
 * Targeting rkc_ccr_silo_data
 */
export const useRkcCcrSiloData = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const pendingOperations = 0;

  // Get RKC silo capacities for reference data
  const { records: siloCapacities } = useRkcSiloCapacities();

  /**
   * Get silo data for a specific date with pagination
   */
  const getDataForDatePaginated = useCallback(
    async (params: SiloDataParams) => {
      if (!params.date || !params.unit_id) {
        return { items: [], totalItems: 0, totalPages: 0 };
      }

      setLoading(true);
      setError(null);

      try {
        const formattedDate = formatDateToISO8601(params.date);
        const page = params.page || 1;
        const perPage = params.perPage || 20;

        const filter = params.silo_id
          ? `date="${formattedDate}" && unit_id="${params.unit_id}" && silo_id="${params.silo_id}"`
          : `date="${formattedDate}" && unit_id="${params.unit_id}"`;

        const result = await pb.collection('rkc_ccr_silo_data').getList(page, perPage, {
          filter,
          sort: 'created',
          expand: 'silo_id',
        });

        // Enhance data with capacities
        const enhancedData = result.items.map((item) => {
          const capacity = siloCapacities.find((cap) => cap.id === item.silo_id)?.capacity || 0;
          const percentage =
            capacity > 0 ? (((item.weight_value as number) || 0) / capacity) * 100 : 0;

          return {
            ...item,
            capacity,
            percentage: Math.min(percentage, 100),
            silo_name: siloCapacities.find((cap) => cap.id === item.silo_id)?.silo_name || '',
          };
        });

        return {
          items: enhancedData,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        return { items: [], totalItems: 0, totalPages: 0 };
      } finally {
        setLoading(false);
      }
    },
    [siloCapacities]
  );

  /**
   * Get all silo data for a specific date (no pagination)
   */
  const getDataForDate = useCallback(
    async (date: string, unit_id?: string) => {
      if (!date) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const formattedDate = formatDateToISO8601(date);

        const filter = `date="${formattedDate}"`;

        const items = await pb.collection('rkc_ccr_silo_data').getFullList({
          filter,
          sort: 'created',
          expand: 'silo_id',
        });

        let filteredItems = items;
        if (unit_id) {
          filteredItems = items.filter((item) => {
            const expandData = item.expand as CcrSiloDataSchema['expand'] | undefined;
            return expandData?.silo_id?.unit === unit_id;
          });
        }

        const uniqueItems = filteredItems.filter(
          (item, index, self) => index === self.findIndex((t) => t.silo_id === item.silo_id)
        );

        return uniqueItems.map((item) => {
          const typedItem = item as unknown as CcrSiloDataSchema;
          const expandData = typedItem.expand;

          const capacity =
            expandData?.silo_id?.capacity ||
            siloCapacities.find((cap) => cap.id === typedItem.silo_id)?.capacity ||
            0;

          const siloName =
            expandData?.silo_id?.silo_name ||
            siloCapacities.find((cap) => cap.id === typedItem.silo_id)?.silo_name ||
            '';

          const totalContent =
            (typedItem.shift1_content || 0) +
            (typedItem.shift2_content || 0) +
            (typedItem.shift3_content || 0);

          const percentage = capacity > 0 ? (totalContent / capacity) * 100 : 0;

          const itemUnitId = expandData?.silo_id?.unit || unit_id;

          return {
            ...typedItem,
            capacity,
            silo_name: siloName,
            percentage: Math.min(percentage, 100),
            weight_value: totalContent,
            unit_id: itemUnitId,
            shift1: {
              emptySpace: typedItem.shift1_empty_space,
              content: typedItem.shift1_content,
            },
            shift2: {
              emptySpace: typedItem.shift2_empty_space,
              content: typedItem.shift2_content,
            },
            shift3: {
              emptySpace: typedItem.shift3_empty_space,
              content: typedItem.shift3_content,
            },
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [siloCapacities]
  );

  /**
   * Update silo data
   */
  const updateSiloData = useCallback(
    async (
      idOrDateOrParams: string | { date: string; siloId: string; data: Record<string, unknown> },
      dataOrSiloId?: Partial<SiloData> | string,
      shift?: string,
      field?: string,
      value?: number,
      unitId?: string
    ) => {
      // Method 1: Update with flat field params object
      if (
        typeof idOrDateOrParams === 'object' &&
        'date' in idOrDateOrParams &&
        'siloId' in idOrDateOrParams
      ) {
        const { date, siloId, data } = idOrDateOrParams;

        try {
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          const records = await pb.collection('rkc_ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as CcrSiloDataSchema['expand'] | undefined;
              return expandData?.silo_id?.unit === unitId;
            });
          }

          if (filteredRecords.length === 0) {
            return await pb.collection('rkc_ccr_silo_data').create({
              date: formattedDate,
              silo_id: siloId,
              ...data,
            });
          }

          const record = filteredRecords[0];
          return await pb.collection('rkc_ccr_silo_data').update(record.id, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to update silo data'));
          throw err;
        }
      }
      // Method 2: Update by ID directly
      else if (typeof idOrDateOrParams === 'string' && typeof dataOrSiloId === 'object') {
        const id = idOrDateOrParams;
        const data = dataOrSiloId;

        if (!id) {
          throw new Error('ID is required');
        }

        try {
          return await pb.collection('rkc_ccr_silo_data').update(id, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to update silo data'));
          throw err;
        }
      }
      // Method 3: Update specific shift field
      else if (
        typeof idOrDateOrParams === 'string' &&
        typeof dataOrSiloId === 'string' &&
        shift &&
        field &&
        value !== undefined
      ) {
        const date = idOrDateOrParams;
        const siloId = dataOrSiloId;

        try {
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          const records = await pb.collection('rkc_ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as Record<string, unknown> | undefined;
              const siloData = expandData?.silo_id as Record<string, unknown> | undefined;
              return siloData && typeof siloData.unit === 'string' && siloData.unit === unitId;
            });
          }

          const shiftNum = shift.replace('shift', '');
          const flatFieldName = `shift${shiftNum}_${field}`;
          const updateData: Record<string, unknown> = {
            [flatFieldName]: value,
          };

          if (filteredRecords.length === 0) {
            return await pb.collection('rkc_ccr_silo_data').create({
              date: formattedDate,
              silo_id: siloId,
              ...updateData,
            });
          } else {
            const record = filteredRecords[0];
            return await pb.collection('rkc_ccr_silo_data').update(record.id, updateData);
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to update silo data field'));
          throw err;
        }
      } else {
        throw new Error('Invalid parameters for updateSiloData');
      }
    },
    []
  );

  /**
   * Create new silo data record
   */
  const createSiloData = useCallback(
    async (data: Partial<CcrSiloDataSchema> | Record<string, unknown>) => {
      try {
        if (data.date) {
          data.date = formatDateToISO8601(data.date as string);
        }

        if ('silo' in data && !data.silo_id) {
          data.silo_id = data.silo;
          delete (data as Record<string, unknown>).silo;
        }

        if ('shift1' in data && typeof data.shift1 === 'object') {
          const shift1 = data.shift1 as ShiftData;
          if (shift1.emptySpace !== undefined) {
            data.shift1_empty_space = shift1.emptySpace;
          }
          if (shift1.content !== undefined) {
            data.shift1_content = shift1.content;
          }
          delete (data as Record<string, unknown>).shift1;
        }

        if ('shift2' in data && typeof data.shift2 === 'object') {
          const shift2 = data.shift2 as ShiftData;
          if (shift2.emptySpace !== undefined) {
            data.shift2_empty_space = shift2.emptySpace;
          }
          if (shift2.content !== undefined) {
            data.shift2_content = shift2.content;
          }
          delete (data as Record<string, unknown>).shift2;
        }

        if ('shift3' in data && typeof data.shift3 === 'object') {
          const shift3 = data.shift3 as ShiftData;
          if (shift3.emptySpace !== undefined) {
            data.shift3_empty_space = shift3.emptySpace;
          }
          if (shift3.content !== undefined) {
            data.shift3_content = shift3.content;
          }
          delete (data as Record<string, unknown>).shift3;
        }

        return await pb.collection('rkc_ccr_silo_data').create(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create silo data'));
        throw err;
      }
    },
    []
  );

  /**
   * Delete silo data
   */
  const deleteSiloData = useCallback(
    async (idOrDate: string, siloId?: string, shift?: string, field?: string, unitId?: string) => {
      // Method 1: Delete by ID directly
      if (!siloId) {
        if (!idOrDate) {
          throw new Error('ID is required');
        }

        try {
          await pb.collection('rkc_ccr_silo_data').delete(idOrDate);
          return { success: true };
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to delete silo data'));
          throw err;
        }
      }
      // Method 2: Find and delete specific field or record
      else {
        const date = idOrDate;

        try {
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          const records = await pb.collection('rkc_ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as CcrSiloDataSchema['expand'] | undefined;
              return expandData?.silo_id?.unit === unitId;
            });
          }

          if (filteredRecords.length === 0) {
            return { success: true, deleted: false };
          }

          const record = filteredRecords[0];

          if (shift && field) {
            const shiftNum = shift.replace('shift', '');
            const flatFieldName = `shift${shiftNum}_${field}`;

            const otherField = field === 'empty_space' ? 'content' : 'empty_space';
            const otherFlatFieldName = `shift${shiftNum}_${otherField}`;
            const typedRecord = record as unknown as CcrSiloDataSchema;

            const hasOtherField =
              typedRecord[otherFlatFieldName as keyof CcrSiloDataSchema] != null;

            const hasOtherShifts = ['1', '2', '3'].some((s) => {
              if (s === shiftNum) return false;

              const emptySpaceField = `shift${s}_empty_space` as keyof CcrSiloDataSchema;
              const contentField = `shift${s}_content` as keyof CcrSiloDataSchema;

              return typedRecord[emptySpaceField] != null || typedRecord[contentField] != null;
            });

            if (!hasOtherField && !hasOtherShifts) {
              await pb.collection('rkc_ccr_silo_data').delete(record.id);
              return { success: true, deleted: true, fullRecord: true };
            } else {
              const updateData: Record<string, unknown> = {
                [flatFieldName]: null,
              };

              await pb.collection('rkc_ccr_silo_data').update(record.id, updateData);
              return { success: true, deleted: true, fullRecord: false };
            }
          } else {
            await pb.collection('rkc_ccr_silo_data').delete(record.id);
            return { success: true, deleted: true, fullRecord: true };
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to delete silo data'));
          throw err;
        }
      }
    },
    []
  );

  return {
    getDataForDate,
    getSiloDataForDate: getDataForDate,
    getDataForDatePaginated,
    updateSiloData,
    createSiloData,
    deleteSiloData,
    loading,
    error,
    hasPendingOperations: pendingOperations > 0,
    pendingOperations,
  };
};
