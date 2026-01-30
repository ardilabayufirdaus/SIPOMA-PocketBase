/**
 * OEE (Overall Equipment Effectiveness) Calculation Utilities
 *
 * Formulas:
 * - Availability = (Planned Production Time - Downtime) / Planned Production Time
 * - Performance = (Actual Output) / (Operating Time * Design Capacity)
 * - Quality = (Good Units) / (Total Units)
 */

export interface OeeMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface DowntimeRecord {
  duration: number; // in minutes
  category: string;
  status: string;
}

export interface ParameterData {
  value: number | null;
  hour: number;
}

/**
 * Calculates Availability based on downtime records.
 * Assuming Planned Production Time is 24 hours (1440 minutes).
 */
export const calculateAvailability = (downtimeRecords: any[]): number => {
  const totalPlannedTime = 1440; // 24 hours in minutes

  const totalDowntime = downtimeRecords.reduce((sum, record) => {
    // Only count downtime that actually stops production
    // Assuming records have a 'duration' field in minutes
    // and statuses like 'Breakdown', 'Stop', 'Unplanned' indicate downtime
    const duration = parseFloat(record.duration) || 0;
    return sum + duration;
  }, 0);

  if (totalDowntime >= totalPlannedTime) return 0;
  return ((totalPlannedTime - totalDowntime) / totalPlannedTime) * 100;
};

/**
 * Calculates Performance based on production output and design capacity.
 * @param hourlyFeed Sum of feed values (Actual Output)
 * @param operatingMinutes Actual time equipment was running
 * @param designCapacity Max rate (e.g., TPH)
 */
export const calculatePerformance = (
  actualOutput: number,
  operatingMinutes: number,
  designCapacity: number
): number => {
  if (operatingMinutes <= 0 || designCapacity <= 0) return 0;

  const operatingHours = operatingMinutes / 60;
  const targetOutput = operatingHours * designCapacity;

  if (targetOutput <= 0) return 0;

  const performance = (actualOutput / targetOutput) * 100;
  return Math.min(performance, 100); // Cap at 100% or allow over-performance? Usually capped for KPI.
};

/**
 * Calculates Quality based on parameter compliance.
 * For CM/RKC, Quality is often defined by physical/chemical properties being in spec.
 */
export const calculateQuality = (
  qualityParameters: { value: number | null; min: number | null; max: number | null }[]
): number => {
  const validData = qualityParameters.filter((p) => p.value !== null && p.value !== undefined);
  if (validData.length === 0) return 100; // Default to 100 if no quality data available

  const inSpecCount = validData.filter((p) => {
    const val = p.value as number;
    const min = p.min !== null ? p.min : -Infinity;
    const max = p.max !== null ? p.max : Infinity;
    return val >= min && val <= max;
  }).length;

  return (inSpecCount / validData.length) * 100;
};

/**
 * Calculate OEE for a range of downtime records
 */
export const calculateAvailabilityRange = (downtimeRecords: any[], daysInRange: number): number => {
  const totalPlannedMinutes = daysInRange * 1440;
  if (totalPlannedMinutes <= 0) return 0;

  const totalDowntime = downtimeRecords.reduce((sum, record) => {
    return sum + (parseFloat(record.duration) || 0);
  }, 0);

  if (totalDowntime >= totalPlannedMinutes) return 0;
  return ((totalPlannedMinutes - totalDowntime) / totalPlannedMinutes) * 100;
};

/**
 * Calculate Performance for a range of production records
 */
export const calculatePerformanceRange = (
  productionRecords: { actualOutput: number; operatingMinutes: number }[],
  designCapacity: number
): number => {
  if (designCapacity <= 0) return 0;

  const totalActual = productionRecords.reduce((sum, r) => sum + r.actualOutput, 0);
  const totalOperatingMinutes = productionRecords.reduce((sum, r) => sum + r.operatingMinutes, 0);

  if (totalOperatingMinutes <= 0) return 0;

  const totalOperatingHours = totalOperatingMinutes / 60;
  const targetOutput = totalOperatingHours * designCapacity;

  if (targetOutput <= 0) return 0;

  const performance = (totalActual / targetOutput) * 100;
  return Math.min(performance, 100);
};

/**
 * Calculate Quality for a range of parameter records
 */
export const calculateQualityRange = (
  allParameterData: { value: number | null; min: number | null; max: number | null }[]
): number => {
  return calculateQuality(allParameterData);
};

/**
 * Calculates overall OEE.
 */
export const calculateOee = (a: number, p: number, q: number): number => {
  return (a / 100) * (p / 100) * (q / 100) * 100;
};

/**
 * Formats a percentage for display.
 */
export const formatOeeValue = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
};
