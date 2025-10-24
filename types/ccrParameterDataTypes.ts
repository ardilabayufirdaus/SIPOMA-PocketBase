import { CcrParameterData } from '../types';

// Value type for hourly data fields
export type HourlyValueType = string | number | null;

// New interface for CCR Parameter Data with separate hour fields
export interface CcrParameterDataFlat {
  id: string;
  parameter_id: string;
  date: string; // YYYY-MM-DD
  hour1?: HourlyValueType;
  hour2?: HourlyValueType;
  hour3?: HourlyValueType;
  hour4?: HourlyValueType;
  hour5?: HourlyValueType;
  hour6?: HourlyValueType;
  hour7?: HourlyValueType;
  hour8?: HourlyValueType;
  hour9?: HourlyValueType;
  hour10?: HourlyValueType;
  hour11?: HourlyValueType;
  hour12?: HourlyValueType;
  hour13?: HourlyValueType;
  hour14?: HourlyValueType;
  hour15?: HourlyValueType;
  hour16?: HourlyValueType;
  hour17?: HourlyValueType;
  hour18?: HourlyValueType;
  hour19?: HourlyValueType;
  hour20?: HourlyValueType;
  hour21?: HourlyValueType;
  hour22?: HourlyValueType;
  hour23?: HourlyValueType;
  hour24?: HourlyValueType;
  // User fields to track who entered the data
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
  name?: string; // Keep for backward compatibility
}

// Helper to convert between flat and original format
// Define an internal interface for hourly value types to avoid using any
interface HourlyValueObject {
  value: string | number;
  user_name?: string;
}

export const convertToFlat = (data: CcrParameterData): CcrParameterDataFlat => {
  // Create the base flat object
  const flatData: CcrParameterDataFlat = {
    id: data.id,
    parameter_id: data.parameter_id,
    date: data.date,
  };

  // Handle name for CcrParameterDataWithName compatibility
  const dataWithName = data as unknown as { name?: string };
  if (dataWithName.name) {
    flatData.name = dataWithName.name;
  }

  // Convert hourly_values to flat structure
  Object.entries(data.hourly_values || {}).forEach(([hour, value]) => {
    const hourNum = parseInt(hour);
    const hourKey = `hour${hourNum}` as keyof CcrParameterDataFlat;
    const userKey = `hour${hourNum}_user` as keyof CcrParameterDataFlat;

    if (typeof value === 'object' && value !== null && 'value' in value && 'user_name' in value) {
      // Object format with user tracking
      const typedValue = value as HourlyValueObject;
      flatData[hourKey] = String(typedValue.value);
      flatData[userKey] = typedValue.user_name;
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      // Object format without user tracking
      const typedValue = value as HourlyValueObject;
      flatData[hourKey] = String(typedValue.value);
    } else {
      // Simple value format - ensure we handle both string and number values
      if (typeof value === 'string' || typeof value === 'number') {
        flatData[hourKey] = String(value);
      }
    }
  });

  return flatData;
};

// Type for the hourly values object in the legacy format
type HourlyValueRecord = Record<
  string,
  string | number | { value: string | number; user_name: string }
>;

// Helper to convert from flat to legacy format for compatibility
export const convertFromFlat = (flatData: CcrParameterDataFlat): CcrParameterData => {
  const hourlyValues: HourlyValueRecord = {};

  // Convert flat structure to hourly_values
  for (let i = 1; i <= 24; i++) {
    const hourKey = `hour${i}` as keyof CcrParameterDataFlat;
    const userKey = `hour${i}_user` as keyof CcrParameterDataFlat;

    const value = flatData[hourKey];
    const userName = flatData[userKey] as string | undefined;

    if (value !== undefined && value !== null) {
      if (userName) {
        // Include user information if available
        hourlyValues[i.toString()] = { value, user_name: userName };
      } else {
        // Just store the value
        hourlyValues[i.toString()] = value;
      }
    }
  }

  // Create the standard CcrParameterData object
  const result: CcrParameterData = {
    id: flatData.id,
    parameter_id: flatData.parameter_id,
    date: flatData.date,
    hourly_values: hourlyValues,
  };

  // Add name property using type assertion for CcrParameterDataWithName compatibility
  if (flatData.name) {
    (result as unknown as { name?: string }).name = flatData.name;
  }

  return result;
};
