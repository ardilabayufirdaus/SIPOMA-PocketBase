import { useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { safeApiCall } from '../utils/connectionCheck';
import { formatDateToISO8601 } from '../utils/dateUtils';
import { logger } from '../utils/logger';

interface ProductionCapacity {
  id?: string;
  date: string;
  plant_unit: string;
  plant_category: string;
  wet: number;
  dry: number;
  moisture: number;
  updated?: string;
  created?: string;
}

// Interfaces needed for calculation
interface ParameterSetting {
  id: string;
  parameter: string;
  unit: string;
}

interface HourlyParameterData {
  hour1?: number | null;
  hour2?: number | null;
  hour3?: number | null;
  hour4?: number | null;
  hour5?: number | null;
  hour6?: number | null;
  hour7?: number | null;
  hour8?: number | null;
  hour9?: number | null;
  hour10?: number | null;
  hour11?: number | null;
  hour12?: number | null;
  hour13?: number | null;
  hour14?: number | null;
  hour15?: number | null;
  hour16?: number | null;
  hour17?: number | null;
  hour18?: number | null;
  hour19?: number | null;
  hour20?: number | null;
  hour21?: number | null;
  hour22?: number | null;
  hour23?: number | null;
  hour24?: number | null;
}

export const useProductionCapacity = () => {
  // Sync capacity data to PocketBase (Create or Update)
  const syncCapacity = useCallback(async (data: ProductionCapacity) => {
    if (!data.date || !data.plant_unit) return null;

    try {
      const formattedDate = formatDateToISO8601(data.date);
      const filter = `date="${formattedDate}" && plant_unit="${data.plant_unit}"`;

      // Check for existing record
      const existingRecords = await safeApiCall(
        () => pb.collection('monitoring_production_capacity').getFullList({ filter }),
        { retries: 2 }
      );

      const payload = {
        ...data,
        date: formattedDate,
        wet: parseFloat(data.wet.toFixed(2)),
        dry: parseFloat(data.dry.toFixed(2)),
        moisture: parseFloat(data.moisture.toFixed(2)),
      };

      if (existingRecords && existingRecords.length > 0) {
        const record = existingRecords[0];

        // Only update if values have changed significantly to avoid spamming
        const hasChanged =
          Math.abs(record.wet - payload.wet) > 0.01 ||
          Math.abs(record.dry - payload.dry) > 0.01 ||
          Math.abs(record.moisture - payload.moisture) > 0.01;

        if (hasChanged) {
          return await safeApiCall(
            () => pb.collection('monitoring_production_capacity').update(record.id, payload),
            { retries: 2 }
          );
        }
        return record;
      } else {
        return await safeApiCall(
          () => pb.collection('monitoring_production_capacity').create(payload),
          { retries: 2 }
        );
      }
    } catch (error) {
      logger.error('Failed to sync production capacity', error);
      return null;
    }
  }, []);

  // NEW: Robust function to recalculate and sync capacity from raw data sources
  // Can be called from any data entry hook
  const recalculateAndSyncCapacity = useCallback(
    async (
      date: string,
      plantUnit: string,
      plantCategory?: string,
      cachedSettings?: Map<string, string>
    ) => {
      if (!date || !plantUnit) return;

      try {
        const formattedDate = formatDateToISO8601(date);

        // 1. Fetch Material Usage (Wet Production)
        let wetProduction = 0;
        let inferredCategory = plantCategory || '';

        try {
          const materialRecords = await pb.collection('ccr_material_usage').getFullList({
            filter: `date="${formattedDate}" && plant_unit="${plantUnit}"`,
          });

          if (materialRecords.length > 0) {
            // Try to get category from material usage if not provided
            if (!inferredCategory) {
              inferredCategory = materialRecords[0].plant_category || '';
            }
          }

          // Sum total_production from all shifts/records
          wetProduction = materialRecords.reduce(
            (sum, item) => sum + (item.total_production || 0),
            0
          );
        } catch (e) {
          // Ignore, assume 0
        }

        // If we still don't have a category, try to guess or use default (optional)
        if (!inferredCategory) {
          // Try to fetch from parameter settings linked to this unit?
          // Or just skip saving if category is strict? PocketBase might require it if made required.
          // For now let's leave it empty string if not found, monitoring page might fail to show it if filtered by category.
        }

        // 2. Calculate Average Moisture
        let averageMoisture = 0;
        try {
          let paramMap: Map<string, string>;

          if (cachedSettings) {
            paramMap = cachedSettings;
          } else {
            // Fetch parameter settings to find IDs (OLD WAY)
            const paramSettings = await pb.collection('parameter_settings').getFullList({
              filter: `unit="${plantUnit}"`,
            });

            paramMap = new Map<string, string>();
            paramSettings.forEach((setting) => {
              const s = setting as unknown as ParameterSetting;
              paramMap.set(s.parameter, s.id);
            });
          }

          const h2oGypsumId = paramMap.get('H2O Gypsum (%)');
          const setGypsumId = paramMap.get('Set. Feeder Gypsum (%)');
          const h2oTrassId = paramMap.get('H2O Trass (%)');
          const setTrassId = paramMap.get('Set. Feeder Trass (%)');
          const h2oLimestoneId = paramMap.get('H2O Limestone (%)');
          const setLimestoneId = paramMap.get('Set. Feeder Limestone (%)');

          const parameterIds = [
            h2oGypsumId,
            setGypsumId,
            h2oTrassId,
            setTrassId,
            h2oLimestoneId,
            setLimestoneId,
          ].filter(Boolean);

          if (parameterIds.length > 0) {
            const filterConditions = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');
            const paramData = await pb.collection('ccr_parameter_data').getFullList({
              filter: `date="${formattedDate}" && (${filterConditions})`,
            });

            const dataMap = new Map<string, HourlyParameterData>();
            paramData.forEach((record) => {
              dataMap.set(record.parameter_id, record as unknown as HourlyParameterData);
            });

            // Calculate hourly total moisture
            const validTotals: number[] = [];
            for (let hour = 1; hour <= 24; hour++) {
              const hourKey = `hour${hour}` as keyof HourlyParameterData;

              const h2oG = h2oGypsumId ? dataMap.get(h2oGypsumId)?.[hourKey] || null : null;
              const setG = setGypsumId ? dataMap.get(setGypsumId)?.[hourKey] || null : null;
              const h2oT = h2oTrassId ? dataMap.get(h2oTrassId)?.[hourKey] || null : null;
              const setT = setTrassId ? dataMap.get(setTrassId)?.[hourKey] || null : null;
              const h2oL = h2oLimestoneId ? dataMap.get(h2oLimestoneId)?.[hourKey] || null : null;
              const setL = setLimestoneId ? dataMap.get(setLimestoneId)?.[hourKey] || null : null;

              const gypsum = h2oG !== null && setG !== null ? (setG * h2oG) / 100 : null;
              const trass = h2oT !== null && setT !== null ? (setT * h2oT) / 100 : null;
              const limestone = h2oL !== null && setL !== null ? (setL * h2oL) / 100 : null;

              const values = [gypsum, trass, limestone].filter(
                (val) => val !== null && !isNaN(val)
              );
              if (values.length > 0) {
                validTotals.push(values.reduce((sum, val) => sum + val, 0));
              }
            }

            if (validTotals.length > 0) {
              averageMoisture = validTotals.reduce((sum, val) => sum + val, 0) / validTotals.length;
            }
          }
        } catch (e) {
          // Ignore moisture calculation error
        }

        // 3. Calculate Dry Production
        const dryProduction = wetProduction - (averageMoisture * wetProduction) / 100;

        // 4. Sync
        if (inferredCategory) {
          await syncCapacity({
            date: formattedDate,
            plant_unit: plantUnit,
            plant_category: inferredCategory,
            wet: wetProduction,
            dry: dryProduction,
            moisture: averageMoisture,
          });
        }
      } catch (err) {
        logger.error('Error in recalculateAndSyncCapacity', err);
      }
    },
    [syncCapacity]
  );

  // NEW: Bulk Sync All History
  const syncAllHistory = useCallback(
    async (onProgress?: (current: number, total: number, message: string) => void) => {
      try {
        if (onProgress) onProgress(0, 0, 'Initializing sync...');

        // 0. PRE-FETCH ALL PARAMETER SETTINGS (Optimization)
        if (onProgress) onProgress(0, 0, 'Loading parameter settings...');
        const allSettings =
          (await safeApiCall(
            () =>
              pb.collection('parameter_settings').getFullList({
                sort: 'unit',
              }),
            { retries: 2 }
          )) || [];

        // Build a nested map: Unit -> ParameterName -> ID
        const globalSettingsMap = new Map<string, Map<string, string>>();
        allSettings.forEach((setting) => {
          const s = setting as unknown as ParameterSetting;
          if (!s.unit) return;
          if (!globalSettingsMap.has(s.unit)) {
            globalSettingsMap.set(s.unit, new Map());
          }
          globalSettingsMap.get(s.unit)?.set(s.parameter, s.id);
        });

        // 1. Get total count first
        const firstPage = await safeApiCall(
          () =>
            pb.collection('ccr_material_usage').getList(1, 1, {
              fields: 'id',
            }),
          { retries: 3 }
        );

        if (!firstPage || firstPage.totalItems === 0) {
          if (onProgress) onProgress(0, 0, 'No data found.');
          return;
        }

        const totalRecords = firstPage.totalItems;
        if (onProgress)
          onProgress(0, totalRecords, `Found ${totalRecords} records. Starting batch sync...`);

        // 2. Process in chunks using pagination to avoid timeouts/network errors
        const PROCESS_PAGE_SIZE = 50; // Fetch 50 records at a time
        const totalPages = Math.ceil(totalRecords / PROCESS_PAGE_SIZE);
        let processedCount = 0;

        // Track unique keys to avoid duplicate processing if multiple records exist for same unit/date (shifts)
        const processedKeys = new Set<string>();

        for (let page = 1; page <= totalPages; page++) {
          // Fetch one page
          const records = await safeApiCall(
            () =>
              pb.collection('ccr_material_usage').getList(page, PROCESS_PAGE_SIZE, {
                sort: '-date',
                fields: 'date,plant_unit,plant_category,total_production',
              }),
            { retries: 3 } // Retry on network error
          );

          if (!records || records.items.length === 0) break;

          const targets: Array<{ date: string; plantUnit: string; plantCategory: string }> = [];

          // Filter unique targets in this batch
          records.items.forEach((rec) => {
            if (!rec.date || !rec.plant_unit) return;

            const key = `${formatDateToISO8601(rec.date)}__${rec.plant_unit}`;
            if (!processedKeys.has(key)) {
              processedKeys.add(key);
              targets.push({
                date: rec.date,
                plantUnit: rec.plant_unit,
                plantCategory: rec.plant_category || '',
              });
            }
          });

          // Process this batch of unique targets
          if (targets.length > 0) {
            // Further limit concurrency for the calculation part
            const CALC_BATCH_SIZE = 5; // Increased from 3 due to optimization
            for (let i = 0; i < targets.length; i += CALC_BATCH_SIZE) {
              const batch = targets.slice(i, i + CALC_BATCH_SIZE);

              await Promise.all(
                batch.map(async (target) => {
                  // Pass the cached settings map for this unit
                  const unitSettings = globalSettingsMap.get(target.plantUnit);
                  await recalculateAndSyncCapacity(
                    target.date,
                    target.plantUnit,
                    target.plantCategory,
                    unitSettings
                  );
                })
              );

              // Tiny delay to keep UI responsive
              await new Promise((resolve) => setTimeout(resolve, 20)); // Reduced delay
            }
          }

          processedCount += records.items.length;
          if (onProgress)
            onProgress(
              processedCount,
              totalRecords,
              `Syncing... processed ${processedCount}/${totalRecords} records`
            );
        }

        if (onProgress) onProgress(totalRecords, totalRecords, 'Sync completed!');
      } catch (err) {
        logger.error('Error in syncAllHistory', err);
        if (onProgress)
          onProgress(0, 0, 'Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
        throw err;
      }
    },
    [recalculateAndSyncCapacity]
  );

  // NEW: Fetch monthly capacity data
  const getMonthlyCapacity = useCallback(
    async (month: string, plantUnit: string, plantCategory?: string) => {
      // month format: YYYY-MM
      if (!month || !plantUnit) return [];

      try {
        // Construct date range for the month
        const startDate = `${month}-01`;
        // Calculate end date (last day of month)
        const [year, m] = month.split('-').map(Number);
        const lastDay = new Date(year, m, 0).getDate();
        const endDate = `${month}-${lastDay}`;

        let filter = `date >= "${startDate}" && date <= "${endDate}" && plant_unit="${plantUnit}"`;
        if (plantCategory) {
          filter += ` && plant_category="${plantCategory}"`;
        }

        const records = await safeApiCall(
          () =>
            pb.collection('monitoring_production_capacity').getFullList({
              filter,
              sort: 'date',
            }),
          { retries: 2 }
        );

        return records; // Returns null if failed, or array if success
      } catch (err) {
        logger.error('Failed to fetch monthly capacity', err);
        return null;
      }
    },
    []
  );

  return { syncCapacity, recalculateAndSyncCapacity, syncAllHistory, getMonthlyCapacity };
};
