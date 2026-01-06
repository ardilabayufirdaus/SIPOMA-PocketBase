export interface DowntimeLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  pic: string;
  problem: string;
  unit: string;
  action: string;
  rootCauseAnalysis?: string; // Field baru untuk menyimpan hasil analisis AI
}
