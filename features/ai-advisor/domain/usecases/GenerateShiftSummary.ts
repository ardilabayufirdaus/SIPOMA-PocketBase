import { IAiAdvisorService } from '../repositories/IAiAdvisorService';
import {
  IParameterRepository,
  ISiloRepository,
  IInformationRepository,
} from '../repositories/IShiftRepositories';
import { IDowntimeRepository } from '../repositories/IDowntimeRepository';
import { ShiftData } from '../entities/ShiftData';

export class GenerateShiftSummary {
  constructor(
    private parameterRepo: IParameterRepository,
    private siloRepo: ISiloRepository,
    private downtimeRepo: IDowntimeRepository,
    private infoRepo: IInformationRepository,
    private aiService: IAiAdvisorService
  ) {}

  async execute(date: string, shift: 1 | 2 | 3, unit: string): Promise<string> {
    // 1. Aggregate Data
    const [parameters, silos, downtimes, info] = await Promise.all([
      this.parameterRepo.getShiftStats(date, shift, unit),
      this.siloRepo.getShiftData(date, shift, unit),
      this.downtimeRepo.getRecentDowntimes(unit, 20), // Get recent logs, ideally filter by shift time window
      this.infoRepo.getShiftInfo(date, unit),
    ]);

    // Filter downtimes for this shift (simple heuristic if not done by repo)
    // NOTE: In a real app, repo should accept date/shift range
    const shiftDowntimes = downtimes.filter((d) => d.date === date); // Simplification

    const shiftData: ShiftData = {
      date,
      shift,
      unit,
      parameters,
      silos,
      downtimes: shiftDowntimes,
      information: info,
    };

    // 2. AI Generation
    return this.aiService.generateShiftReport(shiftData);
  }
}
