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
        .map((v) => parseFloat(String(v)))
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
          .map((hour) => parseFloat(String(data.hourly_values[hour])))
          .filter((value) => !isNaN(value) && value !== 0);
        const total = validValues.reduce((sum, value) => sum + value, 0);
        shiftTotals[shiftKey][param.id] = total;
      }
    });

    return shiftTotals;
  }, [filteredParameterSettings, parameterDataMap]);

  const parameterShiftDifferenceData = useMemo(() => {
    const shiftDifferences: Record<string, Record<string, number>> = {
      shift1: {},
      shift2: {},
      shift3: {},
      shift3Cont: {},
    };

    const shiftHourRanges = {
      shift1: { start: 8, end: 15 },
      shift2: { start: 16, end: 22 },
      shift3: { start: 23, end: 24 },
      shift3Cont: { start: 1, end: 7 },
    };

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data || !data.hourly_values) {
        return;
      }

      for (const [shiftKey, range] of Object.entries(shiftHourRanges)) {
        const startValue = parseFloat(String(data.hourly_values[range.start]));
        const endValue = parseFloat(String(data.hourly_values[range.end]));

        if (!isNaN(startValue) && !isNaN(endValue)) {
          shiftDifferences[shiftKey][param.id] = endValue - startValue;
        } else {
          shiftDifferences[shiftKey][param.id] = 0;
        }
      }
    });

    return shiftDifferences;
  }, [filteredParameterSettings, parameterDataMap]);

  const counterTotalData = useMemo(() => {
    const counterTotals: Record<string, number> = {};

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data || !data.hourly_values) {
        counterTotals[param.id] = 0;
        return;
      }

      const startValue = parseFloat(String(data.hourly_values[1])); // Jam awal (jam 1)
      const endValue = parseFloat(String(data.hourly_values[24])); // Jam akhir (jam 24)

      if (!isNaN(startValue) && !isNaN(endValue)) {
        counterTotals[param.id] = endValue - startValue;
      } else {
        counterTotals[param.id] = 0;
      }
    });

    return counterTotals;
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
          .map((hour) => parseFloat(String(data.hourly_values[hour])))
          .filter((value) => !isNaN(value) && value !== 0);
        const total = validValues.reduce((sum, value) => sum + value, 0);
        const average = validValues.length > 0 ? total / validValues.length : 0;
        shiftAverages[shiftKey][param.id] = average;
      }
    });

    return shiftAverages;
  }, [filteredParameterSettings, parameterDataMap]);

  return {
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftDifferenceData,
    counterTotalData,
    parameterShiftAverageData,
  };
};
