import { IAiAdvisorService } from '../repositories/IAiAdvisorService';
import { IOptimizationRepository } from '../repositories/IOptimizationRepository';
import { OptimizationRecommendation } from '../entities/OptimizationEntities';

export class OptimizeParameters {
  constructor(
    private optRepo: IOptimizationRepository,
    private aiService: IAiAdvisorService
  ) {}

  async execute(unit: string): Promise<OptimizationRecommendation[]> {
    const snapshots = await this.optRepo.getCurrentParameters(unit);

    if (snapshots.length === 0) {
      throw new Error('No parameter data found for this unit.');
    }

    return this.aiService.optimizeParameters(snapshots, unit);
  }
}
