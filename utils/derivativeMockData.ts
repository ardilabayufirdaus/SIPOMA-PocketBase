import {
  PlantUnit,
  ParameterSetting,
  SiloCapacity,
  PicSetting,
  RkcReportSetting,
  CcrDowntimeData,
  AutonomousRiskData,
} from '../types';
import { CcrParameterDataFlat } from '../hooks/useDerivativeCcrParameterDataFlat';

// Mock data arrays for Derivative Plant Operations (Cleared)
export const MOCK_DERIVATIVE_PLANT_UNITS: PlantUnit[] = [];
export const MOCK_DERIVATIVE_PARAMETER_SETTINGS: ParameterSetting[] = [];
export const MOCK_DERIVATIVE_SILO_CAPACITIES: SiloCapacity[] = [];
export const MOCK_DERIVATIVE_PIC_SETTINGS: PicSetting[] = [];
export const MOCK_DERIVATIVE_REPORT_SETTINGS: RkcReportSetting[] = [];
export const MOCK_DERIVATIVE_COP_PARAMETER_IDS: string[] = [];
export const MOCK_DERIVATIVE_COP_FOOTER_PARAMETER_IDS: string[] = [];
export function getMockDerivativeCcrParameterData(_date: string): CcrParameterDataFlat[] {
  return [];
}
export function getMockDerivativeDowntimeData(_date: string): CcrDowntimeData[] {
  return [];
}
export function getMockDerivativeSiloData(_date: string) {
  return [];
}
export function getMockDerivativeInformationData(_date: string) {
  return [];
}
export const MOCK_DERIVATIVE_AUTONOMOUS_RISK_DATA: AutonomousRiskData[] = [];
