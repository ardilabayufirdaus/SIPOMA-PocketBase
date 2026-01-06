import { IOptimizationRepository } from '../../domain/repositories/IOptimizationRepository';
import { ParameterSnapshot } from '../../domain/entities/OptimizationEntities';
import { pb, Collections } from '../../../../services/pocketbase';
import { formatDateToISO8601 } from '../../../../utils/dateUtils';

export class PocketBaseOptimizationRepository implements IOptimizationRepository {
  async getCurrentParameters(unit: string): Promise<ParameterSnapshot[]> {
    try {
      // Fetch the latest parameters for the given unit
      // We assume 'date' is today or the latest available entry
      // Strategy: Get latest entry by date sort desc
      const today = formatDateToISO8601(new Date().toISOString());

      const records = await pb.collection(Collections.CCR_PARAMETER_DATA).getList(1, 100, {
        filter: `date="${today}" && plant_unit="${unit}"`,
        expand: 'parameter_id',
      });

      // Determine current shift time to pick the right column (shift1_value, shift2_value, etc)
      // For simplicity, we'll take the latest non-null value from the shifts or just map all available
      // A better approach: check record.updated or specific time columns if they existed.
      // Here we'll average non-null values as "current" or pick shift 3 if filled, else 2...

      return records.items.map((r) => {
        let currentVal = 0;
        let lastUpdatedTimestamp = r.updated;

        // Logic to find latest value from hourly data
        // Priority: hourly_values JSON > hour columns
        if (r.hourly_values && typeof r.hourly_values === 'object') {
          const hours = Object.keys(r.hourly_values)
            .map(Number)
            .sort((a, b) => b - a); // Descending
          for (const h of hours) {
            const valObj = r.hourly_values[h];
            if (valObj && valObj.value !== null && valObj.value !== undefined) {
              currentVal = Number(valObj.value);
              if (valObj.timestamp) lastUpdatedTimestamp = valObj.timestamp;
              break;
            }
          }
        } else {
          // Fallback to columns hour24 down to hour1
          for (let h = 24; h >= 1; h--) {
            const val = r[`hour${h}`];
            if (val !== null && val !== undefined && val !== '') {
              currentVal = Number(val);
              break;
            }
          }
        }

        // Fallback backward compatibility or shift columns if hourly missing completely
        // (Only if still 0)
        if (currentVal === 0) {
          if (r.shift3_value) currentVal = r.shift3_value;
          else if (r.shift2_value) currentVal = r.shift2_value;
          else if (r.shift1_value) currentVal = r.shift1_value;
        }

        return {
          parameterName: r.expand?.parameter_id?.parameter || 'Unknown',
          unit: r.expand?.parameter_id?.unit || '',
          currentValue: Number(currentVal),
          timestamp: lastUpdatedTimestamp,
        };
      });
    } catch (e) {
      console.error('Error fetching parameters:', e);
      return [];
    }
  }
}
