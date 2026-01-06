import {
  IParameterRepository,
  ISiloRepository,
  IInformationRepository,
} from '../../domain/repositories/IShiftRepositories';
import {
  ShiftParameterStats,
  ShiftSiloData,
  ShiftInformation,
} from '../../domain/entities/ShiftData';
import { pb, Collections } from '../../../../services/pocketbase';

export class PocketBaseParameterRepository implements IParameterRepository {
  async getShiftStats(date: string, shift: number, unit: string): Promise<ShiftParameterStats[]> {
    // Note: This requires optimized backend query or careful client-side aggregation.
    // For MVP, we fetch ccr_footer_data if available, or compute from ccr_parameter_data.
    // Let's assume ccr_footer_data has the summary.
    try {
      const records = await pb.collection(Collections.CCR_FOOTER_DATA).getList(1, 100, {
        filter: `date="${date}" && plant_unit="${unit}"`,
      });

      return records.items.map((r) => ({
        parameterName: r.expand?.parameter_id?.parameter || 'Unknown', // Need expand
        unit: r.expand?.parameter_id?.unit || '',
        average: shift === 1 ? r.shift1_average : shift === 2 ? r.shift2_average : r.shift3_average,
        min: r.minimum, // Note: Footer might just have daily min/max
        max: r.maximum,
        quality: 'Good', // Placeholder logic
      }));
    } catch {
      return [];
    }
  }
}

export class PocketBaseSiloRepository implements ISiloRepository {
  async getShiftData(date: string, shift: number, unit: string): Promise<ShiftSiloData[]> {
    try {
      const records = await pb.collection(Collections.CCR_SILO_DATA).getList(1, 50, {
        filter: `date="${date}"`,
        expand: 'silo_id',
      });

      // Filter by unit name in memory (assuming unit string "Cement Mill 4" matches silo_id.unit or similar)
      const filteredItems = records.items.filter((r) => r.expand?.silo_id?.unit === unit);

      return filteredItems.map((r) => {
        // Determine shift field, e.g., shift1, shift2
        const currentShiftData = r[`shift${shift}`];
        const prevShiftData = shift > 1 ? r[`shift${shift - 1}`] : {}; // Simplified

        return {
          siloName: r.expand?.silo_id?.silo_name || r.silo_name || 'Unknown',
          startLevel: 0, // Need complex logic to track previous end
          endLevel: currentShiftData?.content || 0,
          filled: 0,
          consumed: 0,
        };
      });
    } catch {
      return [];
    }
  }
}

export class PocketBaseInformationRepository implements IInformationRepository {
  async getShiftInfo(date: string, unit: string): Promise<ShiftInformation[]> {
    try {
      const records = await pb.collection(Collections.CCR_INFORMATION).getList(1, 20, {
        filter: `date="${date}" && plant_unit="${unit}"`,
      });
      return records.items.map((r) => ({
        info: r.information,
        category: 'General',
      }));
    } catch {
      return [];
    }
  }
}
