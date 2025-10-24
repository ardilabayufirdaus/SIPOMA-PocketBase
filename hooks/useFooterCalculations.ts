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
      if (!data) {
        footer[param.id] = null;
        return;
      }

      // Handle both old hourly_values format and new flat format
      let values: number[] = [];

      if (data.hourly_values) {
        // Old format
        values = Object.values(data.hourly_values)
          .map((v) => {
            if (typeof v === 'object' && v !== null && 'value' in v) {
              return parseFloat(String(v.value));
            }
            return parseFloat(String(v));
          })
          .filter((v) => !isNaN(v));
      } else {
        // New flat format: hour1 to hour24
        for (let hour = 1; hour <= 24; hour++) {
          const hourKey = `hour${hour}` as keyof typeof data;
          const value = data[hourKey];
          if (value !== null && value !== undefined && value !== '') {
            const numValue = parseFloat(String(value));
            if (!isNaN(numValue)) {
              values.push(numValue);
            }
          }
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
        let validValues: number[] = [];

        if (data.hourly_values) {
          // Old format
          validValues = hours
            .map((hour) => {
              const hourData = data.hourly_values[hour];
              if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
                return parseFloat(String(hourData.value));
              }
              return parseFloat(String(hourData));
            })
            .filter((value) => !isNaN(value));
        } else {
          // New flat format
          validValues = hours
            .map((hour) => {
              const hourKey = `hour${hour}` as keyof typeof data;
              const value = data[hourKey];
              if (value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(String(value));
                return isNaN(numValue) ? NaN : numValue;
              }
              return NaN;
            })
            .filter((value) => !isNaN(value));
        }

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
        let validValues: number[] = [];

        if (data.hourly_values) {
          // Old format
          validValues = hours
            .map((hour) => {
              const hourData = data.hourly_values[hour];
              if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
                return parseFloat(String(hourData.value));
              }
              return parseFloat(String(hourData));
            })
            .filter((value) => !isNaN(value));
        } else {
          // New flat format
          validValues = hours
            .map((hour) => {
              const hourKey = `hour${hour}` as keyof typeof data;
              const value = data[hourKey];
              if (value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(String(value));
                return isNaN(numValue) ? NaN : numValue;
              }
              return NaN;
            })
            .filter((value) => !isNaN(value));
        }

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

      // Helper function to get numeric value for a specific hour
      const getHourValue = (hour: number): number => {
        if (data.hourly_values) {
          // Old format
          const hourData = data.hourly_values[hour];
          if (typeof hourData === 'object' && hourData !== null && 'value' in hourData) {
            return parseFloat(String(hourData.value));
          }
          return parseFloat(String(hourData));
        } else {
          // New flat format
          const hourKey = `hour${hour}` as keyof typeof data;
          const value = data[hourKey];
          if (value !== null && value !== undefined && value !== '') {
            const numValue = parseFloat(String(value));
            return isNaN(numValue) ? NaN : numValue;
          }
          return NaN;
        }
      };

      // Helper function to get max from hour range
      const getMaxFromHours = (hours: number[]): number => {
        const values = hours.map(getHourValue).filter((v) => !isNaN(v));
        return values.length > 0 ? Math.max(...values) : 0;
      };

      // Counter Shift 3 (Cont.): Math.max dari data jam 1 sampai dengan jam 7
      const shift3ContMax = getMaxFromHours([1, 2, 3, 4, 5, 6, 7]);
      shiftCounters.shift3Cont[param.id] = shift3ContMax;

      // Counter Shift 1: Math.max dari data jam 8 sampai dengan jam 15 dikurangi dengan nilai data jam 7
      const shift1Max = getMaxFromHours([8, 9, 10, 11, 12, 13, 14, 15]);
      const hour7Value = getHourValue(7);
      shiftCounters.shift1[param.id] = shift1Max - (isNaN(hour7Value) ? 0 : hour7Value);

      // Counter Shift 2: Math.max dari data jam 16 sampai dengan jam 22 dikurangi dengan nilai data jam 15
      const shift2Max = getMaxFromHours([16, 17, 18, 19, 20, 21, 22]);
      const hour15Value = getHourValue(15);
      shiftCounters.shift2[param.id] = shift2Max - (isNaN(hour15Value) ? 0 : hour15Value);

      // Counter Shift 3: Math.max dari data jam 23 sampai dengan jam 24 dikurangi dengan nilai data jam 22
      const shift3Max = getMaxFromHours([23, 24]);
      const hour22Value = getHourValue(22);
      shiftCounters.shift3[param.id] = shift3Max - (isNaN(hour22Value) ? 0 : hour22Value);
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
