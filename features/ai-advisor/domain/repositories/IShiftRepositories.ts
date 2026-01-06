import { ShiftParameterStats, ShiftSiloData, ShiftInformation } from '../entities/ShiftData';

export interface IParameterRepository {
  getShiftStats(date: string, shift: number, unit: string): Promise<ShiftParameterStats[]>;
}

export interface ISiloRepository {
  getShiftData(date: string, shift: number, unit: string): Promise<ShiftSiloData[]>;
}

export interface IInformationRepository {
  getShiftInfo(date: string, unit: string): Promise<ShiftInformation[]>;
}
