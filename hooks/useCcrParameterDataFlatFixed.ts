import { useCallback, useState, useEffect } from 'react';
import { CcrParameterData } from '../types';
import { useParameterSettings } from './useParameterSettings';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';
import { logger } from '../utils/logger';

// Define a common type for hour values to ensure consistency
export type HourValueType = string | number | null;

// New flat structure for CCR Parameter Data
export interface CcrParameterDataFlat {
  id: string;
  parameter_id: string;
  date: string; // YYYY-MM-DD
  name?: string;
  // Hours 1-24
  hour1?: HourValueType;
  hour2?: HourValueType;
  hour3?: HourValueType;
  hour4?: HourValueType;
  hour5?: HourValueType;
  hour6?: HourValueType;
  hour7?: HourValueType;
  hour8?: HourValueType;
  hour9?: HourValueType;
  hour10?: HourValueType;
  hour11?: HourValueType;
  hour12?: HourValueType;
  hour13?: HourValueType;
  hour14?: HourValueType;
  hour15?: HourValueType;
  hour16?: HourValueType;
  hour17?: HourValueType;
  hour18?: HourValueType;
  hour19?: HourValueType;
  hour20?: HourValueType;
  hour21?: HourValueType;
  hour22?: HourValueType;
  hour23?: HourValueType;
  hour24?: HourValueType;
  // User tracking for each hour
  hour1_user?: string;
  hour2_user?: string;
  hour3_user?: string;
  hour4_user?: string;
  hour5_user?: string;
  hour6_user?: string;
  hour7_user?: string;
  hour8_user?: string;
  hour9_user?: string;
  hour10_user?: string;
  hour11_user?: string;
  hour12_user?: string;
  hour13_user?: string;
  hour14_user?: string;
  hour15_user?: string;
  hour16_user?: string;
  hour17_user?: string;
  hour18_user?: string;
  hour19_user?: string;
  hour20_user?: string;
  hour21_user?: string;
  hour22_user?: string;
  hour23_user?: string;
  hour24_user?: string;
}

// PocketBase record type that might contain hourly_values or flat fields
interface PocketBaseParameterRecord {
  id: string;
  parameter_id: string;
  date: string;
  name?: string;
  plant_unit?: string;
  hourly_values?: Record<string, string | number | { value: string | number; user_name: string }>;
  [key: string]: unknown; // For hour1-hour24 and hour1_user-hour24_user fields
}

// Helper function to get plant unit for a parameter
async function getPlantUnitForParameter(parameter_id: string): Promise<string | null> {
  try {
    // Try to fetch the parameter to get its unit
    const parameter = await pb.collection('parameter_settings').getOne(parameter_id);
    return parameter.unit || null;
  } catch {
    // Error silenced for production
    return null;
  }
}

// Helper function to convert from hourly_values format to flat format
function convertToFlat(data: CcrParameterData): CcrParameterDataFlat {
  const flatData: CcrParameterDataFlat = {
    id: data.id,
    parameter_id: data.parameter_id,
    date: data.date,
  };

  // Handle optional name field
  const withName = data as unknown as { name?: string };
  if (withName.name) {
    flatData.name = withName.name;
  }

  // Convert hourly_values to flat structure
  Object.entries(data.hourly_values || {}).forEach(([hour, value]) => {
    const hourNum = parseInt(hour);
    const hourField = `hour${hourNum}`;
    const userField = `hour${hourNum}_user`;

    // Gunakan casting yang aman
    const mutableFlatData = flatData as unknown as Record<string, unknown>;

    if (typeof value === 'object' && value !== null && 'value' in value && 'user_name' in value) {
      // Object format with user tracking
      const typedValue = value as { value: string | number; user_name: string };
      mutableFlatData[hourField] = typedValue.value;
      mutableFlatData[userField] = typedValue.user_name;
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      // Object format without user tracking
      const typedValue = value as { value: string | number };
      mutableFlatData[hourField] = typedValue.value;
    } else {
      // Simple value format
      mutableFlatData[hourField] = value as string | number;
    }
  });

  return flatData;
}

// Helper function to convert from flat to hourly_values format
function convertFromFlat(flatData: CcrParameterDataFlat): CcrParameterData {
  const hourlyValues: Record<
    string,
    string | number | { value: string | number; user_name: string }
  > = {};

  // Convert flat structure to hourly_values
  for (let i = 1; i <= 24; i++) {
    const hourField = `hour${i}` as keyof CcrParameterDataFlat;
    const userField = `hour${i}_user` as keyof CcrParameterDataFlat;

    const value = flatData[hourField];
    const userName = flatData[userField] as string | undefined;

    if (value !== undefined && value !== null) {
      if (userName) {
        // Include user information if available
        hourlyValues[i.toString()] = { value: value as string | number, user_name: userName };
      } else {
        // Just store the value
        hourlyValues[i.toString()] = value as string | number;
      }
    }
  }

  return {
    id: flatData.id,
    parameter_id: flatData.parameter_id,
    date: flatData.date,
    hourly_values: hourlyValues,
  };
}

// Extend CcrParameterData interface to include name property for backward compatibility
export interface CcrParameterDataWithName extends CcrParameterData {
  name?: string;
}

export const useCcrParameterDataFlat = () => {
  const { records: parameters, loading: paramsLoading } = useParameterSettings();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // PERUBAHAN ARSITEKTUR:
  // Tidak lagi menggunakan PocketBase realtime subscription
  // Menerapkan arsitektur client-server standar dengan manual refresh

  /**
   * Fungsi untuk memicu refresh data secara manual
   * Ini akan digunakan oleh tombol refresh di UI atau setelah operasi penyimpanan
   */
  const triggerRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      logger.debug('Manual refresh triggered for CCR parameter data');

      // Increment version untuk memicu re-render
      setDataVersion((prev) => prev + 1);

      // Update last refresh time
      const now = new Date();
      setLastRefreshTime(now.toISOString());

      // Delay sejenak untuk memastikan proses refresh terlihat oleh user
      await new Promise((resolve) => setTimeout(resolve, 300));

      return true;
    } catch (err) {
      logger.error('Error during manual refresh:', err);
      return false;
    } finally {
      setIsManualRefreshing(false);
    }
  }, []);

  // Process a PocketBase record into flat format
  const processRecord = useCallback((record: PocketBaseParameterRecord): CcrParameterDataFlat => {
    // Create a record that we can add properties to without TypeScript errors
    const flatRecord: Record<string, unknown> = {
      id: record.id,
      parameter_id: record.parameter_id as string,
      date: record.date as string,
      name: record.name as string | undefined,
    };

    // If the record still has hourly_values (legacy format), convert it
    if (record.hourly_values) {
      // Convert from legacy format
      const legacyData: CcrParameterData = {
        id: record.id,
        parameter_id: record.parameter_id as string,
        date: record.date as string,
        hourly_values: record.hourly_values,
      };
      return convertToFlat(legacyData);
    }

    // Already in flat format, map each hour field
    for (let i = 1; i <= 24; i++) {
      const hourField = `hour${i}`;
      const userField = `hour${i}_user`;

      if (hourField in record && record[hourField] !== undefined && record[hourField] !== null) {
        flatRecord[hourField] = record[hourField];
      }

      if (userField in record && record[userField]) {
        flatRecord[userField] = record[userField];
      }
    }

    // Cast to the proper type before returning
    return flatRecord as unknown as CcrParameterDataFlat;
  }, []);

  const getDataForDate = useCallback(
    async (date: string, plantUnit?: string): Promise<CcrParameterDataFlat[]> => {
      // Enhanced validation for date parameter
      if (
        paramsLoading ||
        parameters.length === 0 ||
        !date ||
        typeof date !== 'string' ||
        date.trim() === '' ||
        date === 'undefined' ||
        date === 'null'
      ) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        // Support both DD/MM/YYYY and YYYY-MM-DD formats
        let isoDate: string;
        if (date.includes('/')) {
          // DD/MM/YYYY format
          const dateParts = date.split('/');
          if (dateParts.length !== 3) {
            return [];
          }
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          isoDate = `${year}-${month}-${day}`;
        } else if (date.includes('-')) {
          // YYYY-MM-DD format - already ISO
          const dateParts = date.split('-');
          if (dateParts.length !== 3 || dateParts[0].length !== 4) {
            return [];
          }
          isoDate = date;
        } else {
          return [];
        }

        // Build query with optional plant_unit filter
        // Don't need to convert date to datetime format
        let filter = `date="${isoDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        // Always fetch fresh data directly from PocketBase
        const result = await pb.collection('ccr_parameter_data').getFullList({
          filter: filter,
          sort: '-created',
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to flat data structure
        const pocketbaseData = result as unknown as PocketBaseParameterRecord[];
        const dailyRecords = new Map(pocketbaseData.map((d) => [d.parameter_id as string, d]));

        return filteredParameters.map((param) => {
          const record = dailyRecords.get(param.id);

          if (record) {
            return processRecord(record);
          }

          // Return empty record structure for parameters without data
          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
          } as CcrParameterDataFlat;
        });
      } catch (error) {
        // Handle autocancelled requests gracefully (common in React StrictMode)
        if (error instanceof Error && error.message.includes('autocancelled')) {
          return [];
        }
        setError(error instanceof Error ? error : new Error('Unknown error fetching data'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [parameters, paramsLoading, processRecord, setLoading, setError]
  );

  const getDataForDatePaginated = useCallback(
    async (
      date: string,
      plantUnit?: string,
      page: number = 1,
      pageSize: number = 100
    ): Promise<{ data: CcrParameterDataFlat[]; total: number; hasMore: boolean }> => {
      // Enhanced validation for date parameter
      if (
        paramsLoading ||
        parameters.length === 0 ||
        !date ||
        typeof date !== 'string' ||
        date.trim() === '' ||
        date === 'undefined' ||
        date === 'null'
      ) {
        return { data: [], total: 0, hasMore: false };
      }

      setLoading(true);
      setError(null);

      try {
        // Support both DD/MM/YYYY and YYYY-MM-DD formats
        let isoDate: string;
        if (date.includes('/')) {
          // DD/MM/YYYY format
          const dateParts = date.split('/');
          if (dateParts.length !== 3) {
            return { data: [], total: 0, hasMore: false };
          }
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          isoDate = `${year}-${month}-${day}`;
        } else if (date.includes('-')) {
          // YYYY-MM-DD format - already ISO
          const dateParts = date.split('-');
          if (dateParts.length !== 3 || dateParts[0].length !== 4) {
            return { data: [], total: 0, hasMore: false };
          }
          isoDate = date;
        } else {
          return { data: [], total: 0, hasMore: false };
        }

        // Build query with optional plant_unit filter and pagination
        let filter = `date="${isoDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        // Always fetch fresh data directly from PocketBase
        const result = await pb.collection('ccr_parameter_data').getList(page, pageSize, {
          filter: filter,
          sort: '-created',
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to flat data structure
        const pocketbaseData = result.items as unknown as PocketBaseParameterRecord[];
        const dailyRecords = new Map(pocketbaseData.map((d) => [d.parameter_id as string, d]));

        const resultData = filteredParameters.map((param) => {
          const record = dailyRecords.get(param.id);

          if (record) {
            return processRecord(record);
          }

          // Return empty record structure for parameters without data
          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
          } as CcrParameterDataFlat;
        });

        const total = result.totalItems;
        const hasMore = result.page < result.totalPages;

        return { data: resultData, total, hasMore };
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Failed to fetch paginated data'));
        return { data: [], total: 0, hasMore: false };
      } finally {
        setLoading(false);
      }
    },
    [parameters, paramsLoading, processRecord, setLoading, setError]
  );

  const updateParameterData = useCallback(
    async (
      parameter_id: string,
      date: string,
      hour: number, // 1-24
      value: string | number | null,
      userName: string, // nama user login
      selectedUnit?: string // parameter tambahan untuk plant_unit
    ) => {
      // Enhanced validation for date parameter
      if (
        !date ||
        typeof date !== 'string' ||
        date.trim() === '' ||
        date === 'undefined' ||
        date === 'null'
      ) {
        throw new Error('Invalid date parameter');
      }

      // Check if we have valid parameter_id
      if (!parameter_id || typeof parameter_id !== 'string' || parameter_id.trim() === '') {
        throw new Error('Invalid parameter_id');
      }

      // Validate hour (1-24)
      if (!hour || typeof hour !== 'number' || hour < 1 || hour > 24) {
        throw new Error('Invalid hour parameter - must be between 1 and 24');
      }

      // Validate userName - allow empty strings but not null/undefined
      if (userName === null || userName === undefined || typeof userName !== 'string') {
        throw new Error('Invalid userName parameter');
      }

      setLoading(true);
      setError(null);

      try {
        // Allow empty userName for Super Admin edits, fallback to Unknown User only for undefined/null
        const safeUserName =
          userName !== undefined && userName !== null ? userName.trim() : 'Unknown User';

        // Normalize the date format (YYYY-MM-DD)
        const normalizedDate = date.split('T')[0];

        // Check for existing data by querying the database directly
        const filter = `date="${normalizedDate}" && parameter_id="${parameter_id}"`;
        const existingRecords = await safeApiCall(
          () =>
            pb.collection('ccr_parameter_data').getFullList({
              filter: filter,
            }),
          { retries: 2, retryDelay: 1000 }
        );

        if (!existingRecords) {
          throw new Error('Failed to check existing records due to network issues');
        }

        // For the flat structure, we need to check if the specific hour field has changed
        if (existingRecords.length > 0) {
          // Update existing record
          const existingRecord = existingRecords[0];
          const hourField = `hour${hour}`;
          const userField = `hour${hour}_user`;

          // Define update fields
          const updateFields: Record<string, string | number | null> = {};

          // If value is null or empty, set the field to null
          if (value === '' || value === null || value === undefined) {
            updateFields[hourField] = null;
            // Masih simpan informasi user meskipun nilai dihapus
            updateFields[userField] = safeUserName;
          } else {
            // Validate numeric values if they should be numbers
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (!isNaN(numericValue) && isFinite(numericValue)) {
              updateFields[hourField] = numericValue;
            } else {
              updateFields[hourField] = value;
            }
            updateFields[userField] = safeUserName;

            // Update juga field name untuk kompatibilitas dengan data lama
            updateFields.name = safeUserName;
          }

          // Update the record with the new hour value - use direct PocketBase call
          const updateResult = await safeApiCall(
            () => pb.collection('ccr_parameter_data').update(existingRecord.id, updateFields),
            { retries: 2, retryDelay: 1000 }
          );

          if (updateResult === null) {
            throw new Error('Failed to update parameter data due to network issues');
          }
        } else {
          // Create a new record with the hour field set
          const createFields: Record<string, string | number | null> = {
            date: normalizedDate, // Pastikan format tanggal konsisten
            parameter_id,
            name: safeUserName, // Keep for backward compatibility
            // Use selectedUnit if provided, otherwise fallback to getting it from parameter_id
            plant_unit: selectedUnit || (await getPlantUnitForParameter(parameter_id)) || 'Unknown',
          };

          // Selalu tambahkan field jam, kosong atau tidak
          if (value === '' || value === null || value === undefined) {
            createFields[`hour${hour}`] = null;
          } else {
            // Validate numeric values if they should be numbers
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (!isNaN(numericValue) && isFinite(numericValue)) {
              createFields[`hour${hour}`] = numericValue;
            } else {
              createFields[`hour${hour}`] = value;
            }
          }
          createFields[`hour${hour}_user`] = safeUserName;

          // Create the record in PocketBase - use direct call
          const createResult = await safeApiCall(
            () => pb.collection('ccr_parameter_data').create(createFields),
            { retries: 2, retryDelay: 1000 }
          );

          if (createResult === null) {
            throw new Error('Failed to create parameter data due to network issues');
          }
        }

        // Trigger data update throughout the app
        setDataVersion((prev) => prev + 1);

        return true;
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Failed to update parameter data'));
        throw error; // Re-throw to allow handling at caller level
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setDataVersion]
  );

  const batchUpdateParameterData = useCallback(
    async (
      updates: Array<{
        parameter_id: string;
        date: string;
        hour: number;
        value: string | number | null;
        userName: string;
        selectedUnit?: string;
      }>
    ) => {
      // Enhanced validation for all updates
      for (const update of updates) {
        if (
          !update.date ||
          typeof update.date !== 'string' ||
          update.date.trim() === '' ||
          !update.parameter_id ||
          typeof update.parameter_id !== 'string' ||
          update.parameter_id.trim() === '' ||
          !update.hour ||
          typeof update.hour !== 'number' ||
          update.hour < 1 ||
          update.hour > 24 ||
          !update.userName ||
          typeof update.userName !== 'string'
        ) {
          throw new Error('Invalid parameters in batch update');
        }
      }

      setLoading(true);
      setError(null);

      try {
        // Process updates in batches to avoid overwhelming the server
        const batchSize = 5; // Process 5 updates at a time
        const results = [];

        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);

          // Process batch concurrently
          const batchPromises = batch.map((update) =>
            updateParameterData(
              update.parameter_id,
              update.date,
              update.hour,
              update.value,
              update.userName,
              update.selectedUnit
            ).catch((error) => {
              // Log error but don't fail the entire batch
              logger.error('Batch update error for parameter:', update.parameter_id, error);
              return null;
            })
          );

          const batchResults = await Promise.allSettled(batchPromises);
          results.push(...batchResults);

          // Add delay between batches to prevent network congestion
          if (i + batchSize < updates.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        // Trigger data update throughout the app
        setDataVersion((prev) => prev + 1);

        // Return results summary
        const successful = results.filter(
          (r) => r.status === 'fulfilled' && r.value !== null
        ).length;
        const failed = results.length - successful;

        return { successful, failed, total: results.length };
      } catch (error) {
        setError(
          error instanceof Error ? error : new Error('Failed to batch update parameter data')
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateParameterData, setLoading, setError, setDataVersion]
  );

  const getDataForDateRange = useCallback(
    async (
      startDate: string,
      endDate: string,
      plantUnit?: string
    ): Promise<CcrParameterDataFlat[]> => {
      // Enhanced validation for date parameters
      if (
        paramsLoading ||
        parameters.length === 0 ||
        !startDate ||
        !endDate ||
        typeof startDate !== 'string' ||
        typeof endDate !== 'string' ||
        startDate.trim() === '' ||
        endDate.trim() === ''
      ) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        // Convert dates to ISO format for database query
        const convertToISO = (dateStr: string): string => {
          if (dateStr.includes('/')) {
            const dateParts = dateStr.split('/');
            if (dateParts.length !== 3) {
              return dateStr;
            }
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            return `${year}-${month}-${day}`;
          }
          return dateStr;
        };

        const isoStartDate = convertToISO(startDate);
        const isoEndDate = convertToISO(endDate);

        // Build query with date range and optional plant_unit filter
        const filterParts = [`date >= "${isoStartDate}"`, `date <= "${isoEndDate}"`];

        // Add plant_unit filter if specified
        if (plantUnit && plantUnit !== 'all') {
          filterParts.push(`plant_unit = "${plantUnit}"`);
        }

        const filter = filterParts.join(' && ');

        // Always fetch fresh data directly from database
        const records = await pb.collection('ccr_parameter_data').getFullList({
          filter: filter,
          sort: '-created',
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to flat data structure
        const pocketbaseData = records as unknown as PocketBaseParameterRecord[];

        // Create a more sophisticated map to handle multiple entries for same parameter across dates
        const recordsMap: Map<string, Map<string, PocketBaseParameterRecord>> = new Map();
        pocketbaseData.forEach((record) => {
          const paramId = record.parameter_id;
          const date = record.date.split('T')[0]; // Normalize date

          if (!recordsMap.has(paramId)) {
            recordsMap.set(paramId, new Map());
          }

          recordsMap.get(paramId)!.set(date, record);
        });

        // For range queries, we need to return data for ALL dates in range,
        // even if no data exists for some dates
        const allResults: CcrParameterDataFlat[] = [];

        // Generate all dates in range
        const startDateObj = new Date(isoStartDate);
        const endDateObj = new Date(isoEndDate);
        const datesInRange: string[] = [];

        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          datesInRange.push(d.toISOString().split('T')[0]);
        }

        // For each date and parameter combination, create records
        datesInRange.forEach((date) => {
          filteredParameters.forEach((param) => {
            const paramRecords = recordsMap.get(param.id);
            const record = paramRecords?.get(date);

            if (record) {
              // Data exists for this date and parameter
              allResults.push(processRecord(record));
            } else {
              // No data for this date and parameter, create empty record
              allResults.push({
                id: `${param.id}-${date}`,
                parameter_id: param.id,
                date: date,
              } as CcrParameterDataFlat);
            }
          });
        });

        return allResults;
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Failed to fetch date range data'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [parameters, paramsLoading, processRecord, setLoading, setError]
  );

  // Convert function to help with transition
  const convertToLegacyFormat = useCallback(
    (flatData: CcrParameterDataFlat[]): CcrParameterDataWithName[] => {
      return flatData.map((item) => {
        const legacyData = convertFromFlat(item);
        // Add the name property if it exists
        if (item.name) {
          (legacyData as CcrParameterDataWithName).name = item.name;
        }
        return legacyData as CcrParameterDataWithName;
      });
    },
    []
  );

  return {
    loading,
    error,
    dataVersion, // Export this so components can re-render when data changes
    lastRefreshTime, // Expose last refresh time to UI
    isManualRefreshing, // Expose refresh state to UI
    triggerRefresh, // Expose manual refresh function to UI
    getDataForDate,
    getDataForDatePaginated,
    getDataForDateRange,
    updateParameterData,
    batchUpdateParameterData,
    convertToLegacyFormat,
  };
};

export default useCcrParameterDataFlat;

