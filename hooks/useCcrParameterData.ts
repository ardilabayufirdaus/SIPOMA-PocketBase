import { useCallback, useState, useRef } from 'react';
import { CcrParameterData } from '../types';
import { useParameterSettings } from './useParameterSettings';
import { pb } from '../utils/pocketbase';
import { useCcrDataCache } from './useDataCache';
import { logger } from '../utils/logger';

// Extend CcrParameterData interface untuk include name property
export interface CcrParameterDataWithName extends CcrParameterData {
  name?: string;
}

export const useCcrParameterData = () => {
  const { records: parameters, loading: paramsLoading } = useParameterSettings();
  const cache = useCcrDataCache();
  // Version state untuk membantu trigger refresh manual saja
  const [dataVersion, setDataVersion] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(new Date().toISOString());
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

      // Clear cache sehingga data akan di-fetch ulang
      cache.clearCache();

      // Increment version untuk memicu re-render
      setDataVersion((prev) => prev + 1);

      // Update last refresh time
      const now = new Date();
      setLastUpdateTime(now.toISOString());

      // Delay sejenak untuk memastikan proses refresh terlihat oleh user
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsManualRefreshing(false);
    }
  }, [cache]);

  const getDataForDate = useCallback(
    async (date: string, plantUnit?: string): Promise<CcrParameterDataWithName[]> => {
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

      try {
        // Support both DD/MM/YYYY and YYYY-MM-DD formats
        let isoDate: string;
        if (date.includes('/')) {
          // DD/MM/YYYY format
          const dateParts = date.split('/');
          if (dateParts.length !== 3) {
            console.error('Invalid date format:', date);
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
            console.error('Invalid date format:', date);
            return [];
          }
          isoDate = date;
        } else {
          console.error('Invalid date format:', date);
          return [];
        }

        // Build query with optional plant_unit filter
        // Use date-only filter to match database storage format
        let filter = `date="${isoDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        const data = await pb.collection('ccr_parameter_data').getFullList({
          filter: filter,
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to application type with proper error handling
        const pocketbaseData = (data || []) as unknown[];
        const dailyRecords = new Map(pocketbaseData.map((d) => [(d as any).parameter_id, d]));

        return filteredParameters.map((param) => {
          const record = dailyRecords.get(param.id) as any;
          if (record) {
            // Convert flat structure (hour1, hour2, ..., hour24) to hourly_values object
            const hourly_values: Record<string, unknown> = {};
            for (let hour = 1; hour <= 24; hour++) {
              const hourField = `hour${hour}`;
              const userField = `hour${hour}_user`;
              const value = record[hourField];
              const userName = record[userField];

              if (value !== null && value !== undefined && value !== '') {
                hourly_values[hour] = {
                  value: value,
                  user_name: userName || 'Unknown User',
                  timestamp: record.updated || record.created || new Date().toISOString(),
                };
              } else {
                hourly_values[hour] = null;
              }
            }

            return {
              id: record.id,
              parameter_id: record.parameter_id,
              date: record.date,
              hourly_values: hourly_values,
              name: record.name ?? undefined,
            } as CcrParameterDataWithName;
          }
          // Return empty record structure for parameters without data
          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
            hourly_values: {},
            name: undefined,
          } as CcrParameterDataWithName;
        });
      } catch (error) {
        console.error('Error in getDataForDate:', error);
        return [];
      }
    },
    [parameters, paramsLoading]
  );

  const getDataForDatePaginated = useCallback(
    async (
      date: string,
      plantUnit?: string,
      page: number = 1,
      pageSize: number = 100
    ): Promise<{ data: CcrParameterDataWithName[]; total: number; hasMore: boolean }> => {
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

      try {
        // Support both DD/MM/YYYY and YYYY-MM-DD formats
        let isoDate: string;
        if (date.includes('/')) {
          // DD/MM/YYYY format
          const dateParts = date.split('/');
          if (dateParts.length !== 3) {
            console.error('Invalid date format:', date);
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
            console.error('Invalid date format:', date);
            return { data: [], total: 0, hasMore: false };
          }
          isoDate = date;
        } else {
          console.error('Invalid date format:', date);
          return { data: [], total: 0, hasMore: false };
        }

        // Build query with optional plant_unit filter and pagination
        let filter = `date="${isoDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        const data = await pb.collection('ccr_parameter_data').getList(page, pageSize, {
          filter: filter,
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to application type with proper error handling
        const pocketbaseData = (data.items || []) as unknown[];
        const dailyRecords = new Map(pocketbaseData.map((d) => [(d as any).parameter_id, d]));

        const resultData = filteredParameters.map((param) => {
          const record = dailyRecords.get(param.id) as any;
          if (record) {
            return {
              id: record.id,
              parameter_id: record.parameter_id,
              date: record.date,
              hourly_values: record.hourly_values || {},
              name: record.name ?? undefined,
            } as CcrParameterDataWithName;
          }
          // Return empty record structure for parameters without data
          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
            hourly_values: {},
            name: undefined,
          } as CcrParameterDataWithName;
        });

        const total = data.totalItems || 0;
        const hasMore = data.page * data.perPage < total;

        return { data: resultData, total, hasMore };
      } catch (error) {
        console.error('Error in getDataForDatePaginated:', error);
        return { data: [], total: 0, hasMore: false };
      }
    },
    [parameters, paramsLoading]
  );

  const updateParameterData = useCallback(
    async (
      date: string,
      parameter_id: string,
      hour: number, // 1-24
      value: string | number | null,
      userName: string // nama user login
    ) => {
      // Enhanced validation for date parameter
      if (
        !date ||
        typeof date !== 'string' ||
        date.trim() === '' ||
        date === 'undefined' ||
        date === 'null'
      ) {
        console.error('Invalid date provided to updateParameterData:', date);
        return;
      }

      // Check if we have valid parameter_id
      if (!parameter_id || typeof parameter_id !== 'string') {
        console.error('Invalid parameter_id provided to updateParameterData:', parameter_id);
        return;
      }

      try {
        // Only log on development mode
        if ((import.meta as any).env?.DEV) {
          // Development logging removed
        }

        // Try the query with proper error handling and retry logic
        let existing = null;
        let fetchError = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            const filter = `date="${date}" && parameter_id="${parameter_id}"`;
            const result = await pb.collection('ccr_parameter_data').getList(1, 1, {
              filter: filter,
            });

            existing = result.items.length > 0 ? result.items[0] : null;
            fetchError = null;
            break; // Success, exit retry loop
          } catch (networkError) {
            console.error(`Network error on attempt ${retryCount + 1}:`, networkError);
            retryCount++;

            if (retryCount < maxRetries) {
              // Wait before retry (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              // If all retries failed, set error
              fetchError = networkError;
            }
          }
        }

        if (fetchError) {
          console.error('Error fetching existing parameter data:', fetchError);

          if (fetchError.code !== 'PGRST116') {
            return;
          }
        }

        const currentHourlyValues =
          typeof existing?.hourly_values === 'object' && existing?.hourly_values !== null
            ? existing.hourly_values
            : {};

        // Transform current hourly values to new format if needed
        const transformedCurrentValues: {
          [hour: number]: { value: string | number; user_name: string; timestamp: string };
        } = {};

        Object.entries(currentHourlyValues).forEach(([hour, hourData]) => {
          const hourNum = parseInt(hour);
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            // Already in new format
            transformedCurrentValues[hourNum] = hourData as {
              value: string | number;
              user_name: string;
              timestamp: string;
            };
          } else {
            // Legacy format - convert with existing user
            transformedCurrentValues[hourNum] = {
              value: hourData as string | number,
              user_name: existing?.name || 'Unknown',
              timestamp: new Date().toISOString(),
            };
          }
        });

        const updatedHourlyValues = { ...transformedCurrentValues };

        if (value === '' || value === null || value === undefined) {
          // Remove the hour key if input is cleared
          delete updatedHourlyValues[hour];
        } else {
          // Update or add the hour with user tracking
          updatedHourlyValues[hour] = {
            value: value,
            user_name: userName,
            timestamp: new Date().toISOString(),
          };
        }

        // If all hourly_values are empty, delete the record from PocketBase
        if (Object.keys(updatedHourlyValues).length === 0) {
          if (existing) {
            await pb.collection('ccr_parameter_data').delete(existing.id);
          }
        } else {
          // Prepare upsert data - always include name for backward compatibility
          const upsertData: any = {
            date,
            parameter_id,
            hourly_values: updatedHourlyValues,
            name: userName, // Keep for backward compatibility, but per-hour tracking is in hourly_values
          };

          // Prepare data for PocketBase
          const recordData = {
            date,
            parameter_id,
            hourly_values: updatedHourlyValues,
            name: userName, // Keep for backward compatibility
          };

          // Update or create record
          if (existing) {
            // Update existing record
            await pb.collection('ccr_parameter_data').update(existing.id, recordData);
          } else {
            // Create new record
            await pb.collection('ccr_parameter_data').create(recordData);
          }
        }
      } catch (error) {
        console.error('Error in updateParameterData:', error);
        throw error; // Re-throw untuk error handling di component
      }
    },
    []
  );

  const getDataForDateRange = useCallback(
    async (
      startDate: string,
      endDate: string,
      plantUnit?: string
    ): Promise<CcrParameterDataWithName[]> => {
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

      try {
        // Convert dates to ISO format for database query
        const convertToISO = (dateStr: string): string => {
          if (dateStr.includes('/')) {
            const dateParts = dateStr.split('/');
            if (dateParts.length !== 3) {
              console.error('Invalid date format:', dateStr);
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

        // Check cache first
        const start = new Date(isoStartDate);
        const cachedData = cache.getCachedData(
          start.getMonth() + 1,
          start.getFullYear(),
          plantUnit
        );

        if (cachedData) {
          return cachedData;
        }

        // Build query with date range and optional plant_unit filter
        let filter = `date >= "${isoStartDate}" && date <= "${isoEndDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        const result = await pb.collection('ccr_parameter_data').getFullList({
          filter: filter,
        });

        // Filter parameters based on plant unit if specified
        let filteredParameters = parameters;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = parameters.filter((param) => param.unit === plantUnit);
        }

        // Map PocketBase response to application type with proper error handling
        const pocketbaseData = (result || []) as unknown[];
        const dailyRecords = new Map(pocketbaseData.map((d) => [(d as any).parameter_id, d]));

        // For range queries, we need to return data for ALL dates in range,
        // even if no data exists for some dates
        const allResults: CcrParameterDataWithName[] = [];

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
            const recordKey = `${param.id}-${date}`;
            const record = dailyRecords.get(param.id) as any;

            if (record && record.date === date) {
              // Data exists for this date and parameter
              allResults.push({
                id: record.id,
                parameter_id: record.parameter_id,
                date: record.date,
                hourly_values: record.hourly_values || {},
                name: record.name ?? undefined,
              } as CcrParameterDataWithName);
            } else {
              // No data for this date and parameter, create empty record
              allResults.push({
                id: recordKey,
                parameter_id: param.id,
                date: date,
                hourly_values: {},
                name: undefined,
              } as CcrParameterDataWithName);
            }
          });
        });

        // Cache the results
        cache.setCachedData(start.getMonth() + 1, start.getFullYear(), plantUnit, allResults);

        return allResults;
      } catch (error) {
        console.error('Error in getDataForDateRange:', error);
        return [];
      }
    },
    [parameters, paramsLoading, cache]
  );

  return {
    dataVersion,
    getDataForDate,
    getDataForDatePaginated,
    getDataForDateRange,
    updateParameterData,
    triggerRefresh,
    lastUpdateTime,
    isManualRefreshing,
    loading: paramsLoading,
  };
};
