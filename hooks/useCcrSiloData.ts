import { useCallback, useState } from 'react';
import { useSiloCapacities } from './useSiloCapacities';
import { formatDateToISO8601 } from '../utils/dateUtils';
import { pb } from '../utils/pocketbase-simple';

/**
 * Type definitions based on the exact PocketBase schema
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
interface SiloData extends CcrSiloDataSchema {
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
 * Hook for managing CCR Silo data with optimized CRUD operations
 * Uses the batched operation hook to reduce server requests
 */
export const useCcrSiloData = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // We're now using direct PocketBase calls instead of batched operations
  // to ensure data in UI always matches what's in the database
  const pendingOperations = 0; // Keep this to maintain API compatibility

  // Get silo capacities for reference data
  const { records: siloCapacities } = useSiloCapacities();

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

        // Use direct PocketBase call instead of batched getList
        const result = await pb.collection('ccr_silo_data').getList(page, perPage, {
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
    [siloCapacities] // Removed getList dependency as we're now using direct PocketBase calls
  );

  /**
   * Get all silo data for a specific date (no pagination)
   * Always fetches fresh data directly from the database
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

        // Optimize query using the combined date+silo_id index
        // Only fetch data for the requested unit if provided
        const filter = `date="${formattedDate}"`;

        // Use expanded silo_id to filter by unit
        const items = await pb.collection('ccr_silo_data').getFullList({
          filter,
          sort: 'created',
          expand: 'silo_id', // Always expand silo_id to get capacity and name
        });

        // Filter by unit on client-side using expanded silo data for better type safety
        let filteredItems = items;
        if (unit_id) {
          filteredItems = items.filter((item) => {
            const expandData = item.expand as CcrSiloDataSchema['expand'] | undefined;
            return expandData?.silo_id?.unit === unit_id;
          });
        }

        // Filter unique records by silo_id to prevent duplicates
        const uniqueItems = filteredItems.filter(
          (item, index, self) => index === self.findIndex((t) => t.silo_id === item.silo_id)
        );

        // Transform raw database records to structured UI data
        return uniqueItems.map((item) => {
          const typedItem = item as unknown as CcrSiloDataSchema;
          const expandData = typedItem.expand;

          // Get capacity and name from expanded silo data or fallback to siloCapacities
          const capacity =
            expandData?.silo_id?.capacity ||
            siloCapacities.find((cap) => cap.id === typedItem.silo_id)?.capacity ||
            0;

          const siloName =
            expandData?.silo_id?.silo_name ||
            siloCapacities.find((cap) => cap.id === typedItem.silo_id)?.silo_name ||
            '';

          // Calculate weight value based on content values (all shifts)
          const totalContent =
            (typedItem.shift1_content || 0) +
            (typedItem.shift2_content || 0) +
            (typedItem.shift3_content || 0);

          // Calculate percentage based on capacity
          const percentage = capacity > 0 ? (totalContent / capacity) * 100 : 0;

          // Get unit from expanded silo data
          const itemUnitId = expandData?.silo_id?.unit || unit_id;

          // Convert flat database schema to structured UI data
          return {
            // Include original database fields
            ...typedItem,
            // Add calculated and enhanced fields
            capacity,
            silo_name: siloName,
            percentage: Math.min(percentage, 100),
            weight_value: totalContent,
            unit_id: itemUnitId,
            // Structure shift data for UI
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
   * Update silo data with optimized performance
   *
   * This function can be called in multiple ways:
   * 1. updateSiloData(id: string, data: Partial<SiloData>) - Update by ID directly
   * 2. updateSiloData({ date, siloId, data }) - Update with flat field data object
   * 3. updateSiloData(date: string, siloId: string, shift: string, field: string, value: number, unitId?: string) - Update specific shift field
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
          // Find the record first - use the indexed fields for better performance
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          // Always fetch fresh data directly from PocketBase
          const records = await pb.collection('ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          // Filter by unit on client-side if needed
          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as CcrSiloDataSchema['expand'] | undefined;
              return expandData?.silo_id?.unit === unitId;
            });
          }

          if (filteredRecords.length === 0) {
            // If no record found, we'll create a new one
            return await pb.collection('ccr_silo_data').create({
              date: formattedDate,
              silo_id: siloId,
              ...data,
            });
          }

          // Use the latest record for update
          const record = filteredRecords[0];

          // Use direct PocketBase call for immediate response
          return await pb.collection('ccr_silo_data').update(record.id, data);
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
          // Use direct PocketBase call for immediate update
          return await pb.collection('ccr_silo_data').update(id, data);
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
          // Find the record using indexed fields for better performance
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          // Always fetch fresh data directly from PocketBase
          const records = await pb.collection('ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          // Filter by unit on client-side if needed
          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as Record<string, unknown> | undefined;
              const siloData = expandData?.silo_id as Record<string, unknown> | undefined;
              return siloData && typeof siloData.unit === 'string' && siloData.unit === unitId;
            });
          }

          // Prepare update data with flat field format
          const shiftNum = shift.replace('shift', '');
          const flatFieldName = `shift${shiftNum}_${field}`;
          const updateData: Record<string, unknown> = {
            [flatFieldName]: value,
          };

          if (filteredRecords.length === 0) {
            // If no record exists, create a new one with the specific field
            return await pb.collection('ccr_silo_data').create({
              date: formattedDate,
              silo_id: siloId,
              ...updateData,
            });
          } else {
            // Update existing record with the specific field
            const record = filteredRecords[0];
            return await pb.collection('ccr_silo_data').update(record.id, updateData);
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to update silo data field'));
          throw err;
        }
      } else {
        throw new Error('Invalid parameters for updateSiloData');
      }
    },
    [] // No dependencies needed as we're using direct PocketBase calls
  );

  /**
   * Create new silo data record with direct database connection
   */
  const createSiloData = useCallback(
    async (data: Partial<CcrSiloDataSchema> | Record<string, unknown>) => {
      try {
        // Format the date if provided
        if (data.date) {
          data.date = formatDateToISO8601(data.date as string);
        }

        // Ensure we're working with flat field schema for silo_id
        if ('silo' in data && !data.silo_id) {
          data.silo_id = data.silo;
          delete (data as Record<string, unknown>).silo;
        }

        // Convert any nested shift structure to flat database fields if needed
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

        // Create record directly in database
        return await pb.collection('ccr_silo_data').create(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create silo data'));
        throw err;
      }
    },
    []
  );

  /**
   * Delete silo data using optimized database operations
   *
   * This function can be called in two ways:
   * 1. deleteSiloData(id: string) - Delete record by ID
   * 2. deleteSiloData(date: string, siloId: string, shift?: string, field?: string, unitId?: string) - Delete specific field or record
   */
  const deleteSiloData = useCallback(
    async (idOrDate: string, siloId?: string, shift?: string, field?: string, unitId?: string) => {
      // Method 1: Delete by ID directly
      if (!siloId) {
        if (!idOrDate) {
          throw new Error('ID is required');
        }

        try {
          // Use direct PocketBase call for delete operation
          await pb.collection('ccr_silo_data').delete(idOrDate);
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
          // Find the record using indexed fields
          const formattedDate = formatDateToISO8601(date);
          const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

          // Always fetch fresh data directly from PocketBase
          const records = await pb.collection('ccr_silo_data').getFullList({
            filter,
            sort: '-created',
            expand: 'silo_id',
          });

          // Filter by unit on client-side if needed
          let filteredRecords = records;
          if (unitId) {
            filteredRecords = records.filter((record) => {
              const expandData = record.expand as CcrSiloDataSchema['expand'] | undefined;
              return expandData?.silo_id?.unit === unitId;
            });
          }

          if (filteredRecords.length === 0) {
            // No record found, nothing to delete
            return { success: true, deleted: false };
          }

          // Use the latest record
          const record = filteredRecords[0];

          // Case 1: Delete specific field in a shift
          if (shift && field) {
            // Convert shift and field to flat field format
            const shiftNum = shift.replace('shift', '');
            const flatFieldName = `shift${shiftNum}_${field}`;

            // Check if we need to delete the whole record by examining other fields
            const otherField = field === 'empty_space' ? 'content' : 'empty_space';
            const otherFlatFieldName = `shift${shiftNum}_${otherField}`;
            const typedRecord = record as unknown as CcrSiloDataSchema;

            // Check if there's data in the other field of this shift
            const hasOtherField =
              typedRecord[otherFlatFieldName as keyof CcrSiloDataSchema] != null;

            // Check for values in other shifts
            const hasOtherShifts = ['1', '2', '3'].some((s) => {
              if (s === shiftNum) return false;

              const emptySpaceField = `shift${s}_empty_space` as keyof CcrSiloDataSchema;
              const contentField = `shift${s}_content` as keyof CcrSiloDataSchema;

              return typedRecord[emptySpaceField] != null || typedRecord[contentField] != null;
            });

            if (!hasOtherField && !hasOtherShifts) {
              // If no other data exists, delete the entire record
              await pb.collection('ccr_silo_data').delete(record.id);
              return { success: true, deleted: true, fullRecord: true };
            } else {
              // Just update to set the specific field to null
              const updateData: Record<string, unknown> = {
                [flatFieldName]: null,
              };

              await pb.collection('ccr_silo_data').update(record.id, updateData);
              return { success: true, deleted: true, fullRecord: false };
            }
          }
          // Case 2: Delete entire record
          else {
            await pb.collection('ccr_silo_data').delete(record.id);
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
    getSiloDataForDate: getDataForDate, // Alias for compatibility with existing code
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
