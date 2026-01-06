import { IAiAdvisorService } from '../repositories/IAiAdvisorService';
import { IDowntimeRepository } from '../repositories/IDowntimeRepository';
import { DowntimeLog } from '../entities/DowntimeLog';

export class AnalyzeRootCause {
  constructor(
    private downtimeRepository: IDowntimeRepository,
    private aiService: IAiAdvisorService
  ) {}

  async execute(currentDowntime: DowntimeLog): Promise<string> {
    // 1. Fetch relevant history for context
    // Ambil 5 downtime terakhir dari unit yang sama untuk melihat pola
    const history = await this.downtimeRepository.getRecentDowntimes(currentDowntime.unit, 5);

    // 2. Perform AI Analysis
    const analysis = await this.aiService.analyzeRootCause(currentDowntime, history);

    // 3. Save result (optional, or return to UI to let user decide to save)
    // await this.downtimeRepository.saveAnalysis(currentDowntime.id, analysis);

    return analysis;
  }
}
