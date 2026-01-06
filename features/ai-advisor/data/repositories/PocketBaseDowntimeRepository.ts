import { IDowntimeRepository } from '../../domain/repositories/IDowntimeRepository';
import { DowntimeLog } from '../../domain/entities/DowntimeLog';
import { pb, Collections, CCRDowntimeData } from '../../../../services/pocketbase';

export class PocketBaseDowntimeRepository implements IDowntimeRepository {
  async getRecentDowntimes(unit: string, limit: number): Promise<DowntimeLog[]> {
    try {
      const records = await pb
        .collection(Collections.CCR_DOWNTIME_DATA)
        .getList<CCRDowntimeData>(1, limit, {
          filter: `unit="${unit}"`,
          sort: '-created', // Fetch latest
        });

      return records.items.map(this.mapToEntity);
    } catch (error) {
      console.error('Error fetching downtimes:', error);
      return [];
    }
  }

  async saveAnalysis(id: string, analysis: string): Promise<void> {
    try {
      // Assuming we have a field for 'ai_analysis' or we append to 'corrective_action'
      // For now, let's append to 'corrective_action' if specific field doesn't exist
      // Or purely return to UI.
      // Implementation: Update record.
      await pb.collection(Collections.CCR_DOWNTIME_DATA).update(id, {
        corrective_action: `[AI Analysis]: ${analysis}`,
      });
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  private mapToEntity(record: CCRDowntimeData): DowntimeLog {
    return {
      id: record.id || '',
      date: record.date,
      startTime: record.start_time,
      endTime: record.end_time,
      pic: record.pic,
      problem: record.problem,
      unit: record.unit,
      action: record.action,
      rootCauseAnalysis: record.corrective_action, // Mapping existing corrective action implies history contains analysis
    };
  }
}
