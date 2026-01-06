import { ParameterSnapshot } from '../entities/OptimizationEntities';

export interface IOptimizationRepository {
  getCurrentParameters(unit: string): Promise<ParameterSnapshot[]>;
}
