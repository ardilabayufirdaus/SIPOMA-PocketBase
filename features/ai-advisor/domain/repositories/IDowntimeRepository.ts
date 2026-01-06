import { DowntimeLog } from '../entities/DowntimeLog';

export interface IDowntimeRepository {
  getRecentDowntimes(unit: string, limit: number): Promise<DowntimeLog[]>;
  saveAnalysis(id: string, analysis: string): Promise<void>;
}
