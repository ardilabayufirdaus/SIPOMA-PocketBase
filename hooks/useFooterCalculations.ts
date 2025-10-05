import { useMemo } from 'react';
import { ParameterSetting, ParameterDataType } from '../types';

interface FooterCalculationOptions {
  filteredParameterSettings: ParameterSetting[];
  parameterDataMap: Map<string, any>;
}

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
      if (!data || !data.hourly_values) {
        footer[param.id] = null;
        return;
      }

      const values = Object.values(data.hourly_values)
        .map((v) => {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            return parseFloat(String(v.value));
          }
          return parseFloat(String(v));
        })
        .filter((v) => !isNaN(v) && v !== 0);

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
      if (!data || !data.hourly_values) {
        return;
      }

      for (const [shiftKey, hours] of Object.entries(shiftHours)) {
        const validValues = hours
          .map((hour) => {
            const hourData = data.hourly_values[hour];
            if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
              return parseFloat(String(hourData.value));
            }
            return parseFloat(String(hourData));
          })
          .filter((value) => !isNaN(value) && value !== 0);
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
      if (!data || !data.hourly_values) {
        return;
      }

      for (const [shiftKey, hours] of Object.entries(shiftHours)) {
        const validValues = hours
          .map((hour) => {
            const hourData = data.hourly_values[hour];
            if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
              return parseFloat(String(hourData.value));
            }
            return parseFloat(String(hourData));
          })
          .filter((value) => !isNaN(value) && value !== 0);
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
      if (!data || !data.hourly_values) {
        return;
      }

      // Counter Shift 3 (Cont.): Math.max dari data jam 1 sampai dengan jam 7
      const shift3ContHours = [1, 2, 3, 4, 5, 6, 7];
      const shift3ContValues = shift3ContHours
        .map((hour) => {
          const hourData = data.hourly_values[hour];
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            return parseFloat(String(hourData.value));
          }
          return parseFloat(String(hourData));
        })
        .filter((value) => !isNaN(value) && value !== 0);
      shiftCounters.shift3Cont[param.id] =
        shift3ContValues.length > 0 ? Math.max(...shift3ContValues) : 0;

      // Counter Shift 1: Math.max dari data jam 8 sampai dengan jam 15 dikurangi dengan nilai data jam 7
      const shift1Hours = [8, 9, 10, 11, 12, 13, 14, 15];
      const shift1Values = shift1Hours
        .map((hour) => {
          const hourData = data.hourly_values[hour];
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            return parseFloat(String(hourData.value));
          }
          return parseFloat(String(hourData));
        })
        .filter((value) => !isNaN(value) && value !== 0);
      const hour7Value = data.hourly_values[7];
      const hour7Numeric =
        typeof hour7Value === 'object' && hour7Value !== null && 'value' in hour7Value
          ? parseFloat(String(hour7Value.value))
          : parseFloat(String(hour7Value));
      const shift1Max = shift1Values.length > 0 ? Math.max(...shift1Values) : 0;
      shiftCounters.shift1[param.id] = shift1Max - (isNaN(hour7Numeric) ? 0 : hour7Numeric);

      // Counter Shift 2: Math.max dari data jam 16 sampai dengan jam 22 dikurangi dengan nilai data jam 15
      const shift2Hours = [16, 17, 18, 19, 20, 21, 22];
      const shift2Values = shift2Hours
        .map((hour) => {
          const hourData = data.hourly_values[hour];
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            return parseFloat(String(hourData.value));
          }
          return parseFloat(String(hourData));
        })
        .filter((value) => !isNaN(value) && value !== 0);
      const hour15Value = data.hourly_values[15];
      const hour15Numeric =
        typeof hour15Value === 'object' && hour15Value !== null && 'value' in hour15Value
          ? parseFloat(String(hour15Value.value))
          : parseFloat(String(hour15Value));
      const shift2Max = shift2Values.length > 0 ? Math.max(...shift2Values) : 0;
      shiftCounters.shift2[param.id] = shift2Max - (isNaN(hour15Numeric) ? 0 : hour15Numeric);

      // Counter Shift 3: Math.max dari data jam 23 sampai dengan jam 24 dikurangi dengan nilai data jam 22
      const shift3Hours = [23, 24];
      const shift3Values = shift3Hours
        .map((hour) => {
          const hourData = data.hourly_values[hour];
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            return parseFloat(String(hourData.value));
          }
          return parseFloat(String(hourData));
        })
        .filter((value) => !isNaN(value) && value !== 0);
      const hour22Value = data.hourly_values[22];
      const hour22Numeric =
        typeof hour22Value === 'object' && hour22Value !== null && 'value' in hour22Value
          ? parseFloat(String(hour22Value.value))
          : parseFloat(String(hour22Value));
      const shift3Max = shift3Values.length > 0 ? Math.max(...shift3Values) : 0;
      shiftCounters.shift3[param.id] = shift3Max - (isNaN(hour22Numeric) ? 0 : hour22Numeric);
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
