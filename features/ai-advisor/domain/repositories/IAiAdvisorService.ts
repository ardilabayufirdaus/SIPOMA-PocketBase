import { DowntimeLog } from '../entities/DowntimeLog';

export interface IAiAdvisorService {
  analyzeRootCause(currentProblem: DowntimeLog, history: DowntimeLog[]): Promise<string>;
  generateShiftReport(data: import('../entities/ShiftData').ShiftData): Promise<string>;
  optimizeParameters(
    snapshots: import('../entities/OptimizationEntities').ParameterSnapshot[],
    unit: string
  ): Promise<import('../entities/OptimizationEntities').OptimizationRecommendation[]>;
}
