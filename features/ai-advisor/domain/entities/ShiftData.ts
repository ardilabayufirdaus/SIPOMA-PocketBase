import { DowntimeLog } from './DowntimeLog';

export interface ShiftParameterStats {
  parameterName: string;
  unit: string;
  average: number;
  min: number;
  max: number;
  quality: 'Good' | 'Warning' | 'Bad'; // Based on limits
}

export interface ShiftSiloData {
  siloName: string;
  startLevel: number;
  endLevel: number;
  filled: number; // tons/percent
  consumed: number; // tons/percent
}

export interface ShiftInformation {
  info: string;
  category: string;
}

export interface ShiftData {
  date: string;
  shift: 1 | 2 | 3; // 1: 07-15, 2: 15-23, 3: 23-07
  unit: string;
  parameters: ShiftParameterStats[];
  silos: ShiftSiloData[];
  downtimes: DowntimeLog[];
  information: ShiftInformation[];
}
