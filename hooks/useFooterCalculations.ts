import { useMemo } from 'react';
import { ParameterSetting, ParameterDataType } from '../types';

interface FooterCalculationOptions {
  filteredParameterSettings: ParameterSetting[];
  parameterDataMap: Map<string, any>;
}

// Helper to safely parse numeric values (handles strings with decimal comma, nested objects, numbers)
export const parseNumericValue = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object' && 'value' in val) {
    return parseNumericValue(val.value);
  }
  const cleanStr = String(val).trim().replace(',', '.');
  const num = parseFloat(cleanStr);
  return !isNaN(num) && isFinite(num) ? num : null;
};

// Helper to get numeric value for a specific hour from either flat or legacy hourly_values format
export const getHourNumericValue = (data: any, hour: number): number | null => {
  if (!data) return null;

  // 1. Check flat format (hour1..hour24) first (modern schema)
  const hourKey = `hour${hour}` as keyof typeof data;
  if (
    hourKey in data &&
    data[hourKey] !== null &&
    data[hourKey] !== undefined &&
    data[hourKey] !== ''
  ) {
    const parsed = parseNumericValue(data[hourKey]);
    if (parsed !== null) return parsed;
  }

  // 2. Check legacy hourly_values object as fallback
  if (data.hourly_values && typeof data.hourly_values === 'object') {
    const val = data.hourly_values[hour] ?? data.hourly_values[String(hour)];
    const parsed = parseNumericValue(val);
    if (parsed !== null) return parsed;
  }

  return null;
};

export const useFooterCalculations = ({
  filteredParameterSettings,
  parameterDataMap,
}: FooterCalculationOptions) => {
  const parameterFooterData = useMemo(() => {
    const footer: Record<string, { total: number; avg: number; min: number; max: number } | null> =
      {};

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        footer[param.id] = null;
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data) {
        footer[param.id] = null;
        return;
      }

      const values: number[] = [];
      for (let hour = 1; hour <= 24; hour++) {
        const val = getHourNumericValue(data, hour);
        if (val !== null) {
          values.push(val);
        }
      }

      if (values.length === 0) {
        footer[param.id] = null;
        return;
      }

      const total = values.reduce((sum, val) => sum + val, 0);
      const avg = total / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      footer[param.id] = { total, avg, min, max };
    });

    return footer;
  }, [filteredParameterSettings, parameterDataMap]);

  const parameterShiftFooterData = useMemo(() => {
    const shiftTotals: Record<string, Record<string, number>> = {
      shift1: {},
      shift2: {},
      shift3: {},
      shift3Cont: {},
    };

    const shiftHours = {
      shift1: [8, 9, 10, 11, 12, 13, 14, 15],
      shift2: [16, 17, 18, 19, 20, 21, 22],
      shift3: [23, 24],
      shift3Cont: [1, 2, 3, 4, 5, 6, 7],
    };

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data) {
        return;
      }

      for (const [shiftKey, hours] of Object.entries(shiftHours)) {
        const validValues = hours
          .map((hour) => getHourNumericValue(data, hour))
          .filter((v): v is number => v !== null);

        const total = validValues.reduce((sum, value) => sum + value, 0);
        shiftTotals[shiftKey][param.id] = total;
      }
    });

    return shiftTotals;
  }, [filteredParameterSettings, parameterDataMap]);

  const parameterShiftAverageData = useMemo(() => {
    const shiftAverages: Record<string, Record<string, number>> = {
      shift1: {},
      shift2: {},
      shift3: {},
      shift3Cont: {},
    };

    const shiftHours = {
      shift1: [8, 9, 10, 11, 12, 13, 14, 15],
      shift2: [16, 17, 18, 19, 20, 21, 22],
      shift3: [23, 24],
      shift3Cont: [1, 2, 3, 4, 5, 6, 7],
    };

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data) {
        return;
      }

      for (const [shiftKey, hours] of Object.entries(shiftHours)) {
        const validValues = hours
          .map((hour) => getHourNumericValue(data, hour))
          .filter((v): v is number => v !== null);

        const total = validValues.reduce((sum, value) => sum + value, 0);
        const average = validValues.length > 0 ? total / validValues.length : 0;
        shiftAverages[shiftKey][param.id] = average;
      }
    });

    return shiftAverages;
  }, [filteredParameterSettings, parameterDataMap]);

  const parameterShiftCounterData = useMemo(() => {
    const shiftCounters: Record<string, Record<string, number>> = {
      shift1: {},
      shift2: {},
      shift3: {},
      shift3Cont: {},
    };

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data) {
        return;
      }

      // Helper function to get max from hour range
      const getMaxFromHours = (hours: number[]): number => {
        const values = hours
          .map((hour) => getHourNumericValue(data, hour))
          .filter((v): v is number => v !== null);
        return values.length > 0 ? Math.max(...values) : 0;
      };

      // Counter Shift 3 (Cont.): Math.max dari data jam 1 sampai dengan jam 7
      const shift3ContMax = getMaxFromHours([1, 2, 3, 4, 5, 6, 7]);
      shiftCounters.shift3Cont[param.id] = shift3ContMax;

      // Counter Shift 1: Math.max dari data jam 8 sampai dengan jam 15 dikurangi dengan nilai data jam 7
      const shift1Max = getMaxFromHours([8, 9, 10, 11, 12, 13, 14, 15]);
      const hour7Value = getHourNumericValue(data, 7) ?? 0;
      shiftCounters.shift1[param.id] = Math.max(0, shift1Max - hour7Value);

      // Counter Shift 2: Math.max dari data jam 16 sampai dengan jam 22 dikurangi dengan nilai data jam 15
      const shift2Max = getMaxFromHours([16, 17, 18, 19, 20, 21, 22]);
      const hour15Value = getHourNumericValue(data, 15) ?? 0;
      shiftCounters.shift2[param.id] = Math.max(0, shift2Max - hour15Value);

      // Counter Shift 3: Math.max dari data jam 23 sampai dengan jam 24 dikurangi dengan nilai data jam 22
      const shift3Max = getMaxFromHours([23, 24]);
      const hour22Value = getHourNumericValue(data, 22) ?? 0;
      shiftCounters.shift3[param.id] = Math.max(0, shift3Max - hour22Value);
    });

    return shiftCounters;
  }, [filteredParameterSettings, parameterDataMap]);

  return {
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftAverageData,
    parameterShiftCounterData,
  };
};
