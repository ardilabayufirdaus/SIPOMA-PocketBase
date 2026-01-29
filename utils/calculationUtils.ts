import { ParameterSetting, ParameterDataType } from '../types';

/**
 * Utilitas untuk menghitung data operasional dari data mentah parameter per jam.
 */

interface DailyCalculations {
  total: number;
  avg: number;
  min: number;
  max: number;
}

interface ShiftCalculations {
  total: number;
  avg: number;
  counter: number;
}

export const calculateParameterStats = (
  param: ParameterSetting,
  data: any
): DailyCalculations | null => {
  if (param.data_type !== ParameterDataType.NUMBER || !data) {
    return null;
  }

  const values: number[] = [];

  // Handle both old hourly_values format and new flat format
  if (data.hourly_values) {
    Object.values(data.hourly_values).forEach((v: any) => {
      const val =
        typeof v === 'object' && v !== null && 'value' in v
          ? parseFloat(String(v.value))
          : parseFloat(String(v));
      if (!isNaN(val)) values.push(val);
    });
  } else {
    for (let hour = 1; hour <= 24; hour++) {
      const value = data[`hour${hour}`];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(String(value));
        if (!isNaN(numValue)) values.push(numValue);
      }
    }
  }

  if (values.length === 0) return null;

  const total = values.reduce((sum, val) => sum + val, 0);
  return {
    total,
    avg: total / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export const calculateShiftStats = (
  param: ParameterSetting,
  data: any,
  shiftHours: number[]
): { total: number; avg: number } => {
  if (param.data_type !== ParameterDataType.NUMBER || !data) {
    return { total: 0, avg: 0 };
  }

  const values: number[] = [];

  shiftHours.forEach((hour) => {
    let val = NaN;
    if (data.hourly_values) {
      const hourData = data.hourly_values[hour];
      val =
        typeof hourData === 'object' && hourData !== null && 'value' in hourData
          ? parseFloat(String(hourData.value))
          : parseFloat(String(hourData));
    } else {
      const value = data[`hour${hour}`];
      if (value !== null && value !== undefined && value !== '') {
        val = parseFloat(String(value));
      }
    }
    if (!isNaN(val)) values.push(val);
  });

  const total = values.reduce((sum, v) => sum + v, 0);
  return {
    total,
    avg: values.length > 0 ? total / values.length : 0,
  };
};

export const calculateShiftCounter = (
  param: ParameterSetting,
  data: any,
  shiftKey: 'shift1' | 'shift2' | 'shift3' | 'shift3Cont'
): number => {
  if (param.data_type !== ParameterDataType.NUMBER || !data) return 0;

  const getHourValue = (hour: number): number => {
    if (data.hourly_values) {
      const hourData = data.hourly_values[hour];
      const val =
        typeof hourData === 'object' && hourData !== null && 'value' in hourData
          ? parseFloat(String(hourData.value))
          : parseFloat(String(hourData));
      return isNaN(val) ? NaN : val;
    } else {
      const value = data[`hour${hour}`];
      if (value !== null && value !== undefined && value !== '') {
        const val = parseFloat(String(value));
        return isNaN(val) ? NaN : val;
      }
      return NaN;
    }
  };

  const getMaxFromHours = (hours: number[]): number => {
    const values = hours.map(getHourValue).filter((v) => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 0;
  };

  switch (shiftKey) {
    case 'shift3Cont':
      return getMaxFromHours([1, 2, 3, 4, 5, 6, 7]);
    case 'shift1': {
      const max = getMaxFromHours([8, 9, 10, 11, 12, 13, 14, 15]);
      const prev = getHourValue(7);
      return max - (isNaN(prev) ? 0 : prev);
    }
    case 'shift2': {
      const max = getMaxFromHours([16, 17, 18, 19, 20, 21, 22]);
      const prev = getHourValue(15);
      return max - (isNaN(prev) ? 0 : prev);
    }
    case 'shift3': {
      const max = getMaxFromHours([23, 24]);
      const prev = getHourValue(22);
      return max - (isNaN(prev) ? 0 : prev);
    }
    default:
      return 0;
  }
};
