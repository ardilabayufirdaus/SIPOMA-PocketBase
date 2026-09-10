import { useCallback, useState } from 'react';
import { CcrParameterData } from '../types';
import { useDerivativeParameterSettings } from './useDerivativeParameterSettings';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';
import { logger } from '../utils/logger';

export type HourValueType = string | number | null;

export interface CcrParameterDataFlat {
  id: string;
  parameter_id: string;
  date: string;
  name?: string;
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

interface PocketBaseParameterRecord {
  id: string;
  parameter_id: string;
  date: string;
  name?: string;
  hourly_values?: Record<string, unknown>;
  [key: string]: unknown;
}

function convertToFlat(data: CcrParameterData): CcrParameterDataFlat {
  const flatData: CcrParameterDataFlat = {
    id: data.id,
    parameter_id: data.parameter_id,
    date: data.date,
  };

  const withName = data as unknown as { name?: string };
  if (withName.name) {
    flatData.name = withName.name;
  }

  Object.entries(data.hourly_values || {}).forEach(([hour, value]) => {
    const hourNum = parseInt(hour);
    const hourField = `hour${hourNum}`;
    const userField = `hour${hourNum}_user`;

    const mutableFlatData = flatData as unknown as Record<string, unknown>;

    if (typeof value === 'object' && value !== null && 'value' in value && 'user_name' in value) {
      const typedValue = value as { value: string | number; user_name: string };
      mutableFlatData[hourField] = typedValue.value;
      mutableFlatData[userField] = typedValue.user_name;
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      const typedValue = value as { value: string | number };
      mutableFlatData[hourField] = typedValue.value;
    } else {
      mutableFlatData[hourField] = value as string | number;
    }
  });

  return flatData;
}

export const useDerivativeCcrParameterDataFlat = () => {
  const { records: parameters, loading: paramsLoading } = useDerivativeParameterSettings();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());

  const triggerRefresh = useCallback(async () => {
    try {
      logger.debug('Manual refresh triggered for Derivative CCR parameter data');
      setDataVersion((prev) => prev + 1);
      setLastRefreshTime(new Date().toISOString());
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      logger.error('Error during manual refresh:', err);
    }
  }, []);

  const processRecord = useCallback((record: PocketBaseParameterRecord): CcrParameterDataFlat => {
    const flatRecord: Record<string, unknown> = {
      id: record.id,
      parameter_id: record.parameter_id as string,
      date: record.date as string,
      name: record.name as string | undefined,
    };

    if (record.hourly_values) {
      const legacyData: CcrParameterData = {
        id: record.id,
        parameter_id: record.parameter_id as string,
        date: record.date as string,
        hourly_values: record.hourly_values as CcrParameterData['hourly_values'],
      };
      return convertToFlat(legacyData);
    }

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

    return flatRecord as unknown as CcrParameterDataFlat;
  }, []);

  const getDataForDate = useCallback(
    async (date: string, plantUnit?: string): Promise<CcrParameterDataFlat[]> => {
      if (
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
        let isoDate = date;
        if (date.includes('/')) {
          const dateParts = date.split('/');
          if (dateParts.length !== 3) return [];
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          isoDate = `${year}-${month}-${day}`;
        } else if (date.includes('-')) {
          const dateParts = date.split('-');
          if (dateParts.length !== 3 || dateParts[0].length !== 4) return [];
          isoDate = date;
        } else {
          return [];
        }

        let currentParams = parameters;
        if (currentParams.length === 0) {
          try {
            const fetched = await safeApiCall(() =>
              pb.collection('derivative_parameter_settings').getFullList({ sort: 'parameter' })
            );
            if (fetched) currentParams = fetched as unknown as ParameterSetting[];
          } catch {
            // ignore
          }
        }

        let filteredParameters = currentParams;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = currentParams.filter((param) => param.unit === plantUnit);
        }

        let filter = `date="${isoDate}"`;
        if (plantUnit && plantUnit !== 'all') {
          filter += ` && plant_unit="${plantUnit}"`;
        }

        const result = await pb.collection('derivative_ccr_parameter_data').getFullList({
          filter: filter,
          sort: '-created',
        });

        const pocketbaseData = result as unknown as PocketBaseParameterRecord[];

        const freshData = filteredParameters.map((param) => {
          const record = pocketbaseData.find((d) => d.parameter_id === param.id);

          if (record) {
            return processRecord(record);
          }

          return {
            id: `${param.id}-${date}`,
            parameter_id: param.id,
            date: date,
          } as CcrParameterDataFlat;
        });

        return freshData;
      } catch {
        const currentParams = parameters;
        let filteredParameters = currentParams;
        if (plantUnit && plantUnit !== 'all') {
          filteredParameters = currentParams.filter((param) => param.unit === plantUnit);
        }
        return filteredParameters.map(
          (param) =>
            ({
              id: `${param.id}-${date}`,
              parameter_id: param.id,
              date: date,
            }) as CcrParameterDataFlat
        );
      } finally {
        setLoading(false);
      }
    },
    [parameters, processRecord]
  );

  const saveParameterValue = useCallback(
    async (
      parameter_id: string,
      date: string,
      hour: number,
      value: string | number | null,
      userName?: string
    ): Promise<CcrParameterDataFlat | null> => {
      try {
        setLoading(true);

        const paramSetting = parameters.find((p) => p.id === parameter_id);

        const existingRecord = await safeApiCall(() =>
          pb.collection('derivative_ccr_parameter_data').getList(1, 1, {
            filter: `date="${date}" && parameter_id="${parameter_id}"`,
          })
        );

        const hourField = `hour${hour}`;
        const userField = `hour${hour}_user`;

        if (existingRecord && existingRecord.items.length > 0) {
          const recordId = existingRecord.items[0].id;
          const updateData: Record<string, unknown> = {
            [hourField]: value,
          };

          if (userName) {
            updateData[userField] = userName;
          }

          const result = await pb
            .collection('derivative_ccr_parameter_data')
            .update(recordId, updateData);

          triggerRefresh();
          return processRecord(result as unknown as PocketBaseParameterRecord);
        } else {
          const newRecordData: Record<string, unknown> = {
            date,
            parameter_id,
            plant_unit: paramSetting?.unit || 'Derivative',
            name: paramSetting?.parameter || '',
            [hourField]: value,
          };

          if (userName) {
            newRecordData[userField] = userName;
          }

          const result = await pb.collection('derivative_ccr_parameter_data').create(newRecordData);

          triggerRefresh();
          return processRecord(result as unknown as PocketBaseParameterRecord);
        }
      } catch (err) {
        logger.error('Error saving Derivative parameter value:', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [parameters, processRecord, triggerRefresh]
  );

  return {
    getDataForDate,
    saveParameterValue,
    loading,
    error,
    paramsLoading,
    parameters,
    dataVersion,
    triggerRefresh,
    lastRefreshTime,
  };
};
