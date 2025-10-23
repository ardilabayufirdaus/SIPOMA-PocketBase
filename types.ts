export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Operator'
  | 'Outsourcing'
  | 'Autonomous'
  | 'Guest';

export type PermissionLevel = 'NONE' | 'READ' | 'WRITE' | 'ADMIN';

export interface PlantOperationsPermissions {
  [category: string]: {
    [unit: string]: PermissionLevel;
  };
}

export interface PermissionMatrix {
  dashboard: PermissionLevel | PlantOperationsPermissions;
  plant_operations: PermissionLevel | PlantOperationsPermissions;
  inspection: PermissionLevel | PlantOperationsPermissions;
  project_management: PermissionLevel | PlantOperationsPermissions;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string; // Optional karena tidak selalu dikirim dari frontend
  full_name?: string; // Optional karena bisa null di database
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  last_active?: Date | string;
  created_at: string | Date;
  updated_at: string | Date;
  permissions: PermissionMatrix;
  is_custom_permissions?: boolean; // Flag untuk menandai apakah permissions sudah di-custom
}

export interface AddUserData {
  username: string;
  full_name: string;
  password?: string; // Optional karena akan di-generate otomatis
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  permissions: PermissionMatrix;
}

// Plant Operations Master Data
export interface PlantUnit {
  id: string;
  unit: string;
  category: string;
  description?: string;
}

export enum ParameterDataType {
  NUMBER = 'Number',
  TEXT = 'Text',
}

export interface ParameterSetting {
  id: string;
  parameter: string;
  data_type: ParameterDataType;
  unit: string;
  category: string;
  min_value?: number;
  max_value?: number;
  opc_min_value?: number;
  opc_max_value?: number;
  pcc_min_value?: number;
  pcc_max_value?: number;
}

export interface SiloCapacity {
  id: string;
  plant_category: string;
  unit: string;
  silo_name: string;
  capacity: number;
  dead_stock: number;
}

export interface ReportSetting {
  id: string;
  parameter_id: string;
  category: string;
  order: number;
}

export interface WhatsAppReportSetting {
  id: string;
  jenis: 'text' | 'number' | 'unit_name' | 'material' | 'feeder' | 'downtime' | 'silo' | 'summary';
  parameter_id?: string; // Required for 'number' type
  data: string; // Manual text for 'text' type, or parameter value for 'number' type
  category: string; // For grouping in report
  plant_unit?: string; // Specific plant unit for this setting
  report_type: 'daily' | 'shift'; // Type of report this setting applies to
  kalkulasi?: 'selisih' | 'total' | 'average' | 'min' | 'max'; // Calculation method for number type
}

export interface PicSetting {
  id: string;
  pic: string;
}

export interface WorkInstruction {
  id: string;
  activity: string;
  doc_code: string;
  doc_title: string;
  description: string;
  link: string;
  plant_category: string;
  plant_unit: string;
}

// CCR Data Entry
export interface CcrSiloData {
  id?: string; // combination of siloId and date
  silo_id?: string;
  date?: string; // YYYY-MM-DD
  shift1: { emptySpace: number | undefined; content: number | undefined };
  shift2: { emptySpace: number | undefined; content: number | undefined };
  shift3: { emptySpace: number | undefined; content: number | undefined };
  // Properti tambahan yang mungkin ada
  capacity?: number;
  percentage?: number;
  silo_name?: string;
  weight_value?: number;
  status?: string;
  unit_id?: string;
}

export interface CcrParameterData {
  id: string; // combination of parameterId and date
  parameter_id: string;
  date: string; // YYYY-MM-DD
  hourly_values: {
    [hour: number]: string | number | { value: string | number; user_name: string };
  }; // hour is 1-24
}

// Extended interface with name field for legacy compatibility
export interface CcrParameterDataWithName extends CcrParameterData {
  name?: string;
}

// New interface with user tracking per hour
export interface CcrParameterDataWithTracking {
  id: string; // combination of parameterId and date
  parameter_id: string;
  date: string; // YYYY-MM-DD
  hourly_values: {
    [hour: number]: {
      value: string | number;
      user_name: string;
      timestamp: string; // ISO timestamp
    };
  };
}

export enum DowntimeStatus {
  OPEN = 'Open',
  CLOSE = 'Close',
}

export interface CcrDowntimeData {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  pic: string;
  problem: string;
  unit: string;
  action?: string;
  corrective_action?: string;
  status?: DowntimeStatus;
}

// Autonomous Data Entry
export enum RiskStatus {
  IDENTIFIED = 'Identified',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export interface AutonomousRiskData {
  id: string;
  unit: string;
  potential_disruption: string;
  preventive_action: string;
  mitigation_plan: string;
  status: RiskStatus;
  date: string; // YYYY-MM-DD
}

// Project Management Types
export interface ProjectTask {
  id: string;
  project_id: string;
  activity: string;
  planned_start: string; // YYYY-MM-DD
  planned_end: string; // YYYY-MM-DD
  actual_start?: string | null; // YYYY-MM-DD
  actual_end?: string | null; // YYYY-MM-DD
  percent_complete: number; // 0-100
}

export enum ProjectStatus {
  ACTIVE = 'active',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  DELAYED = 'delayed',
}

export interface Project {
  id: string;
  title: string;
  budget?: number;
  status: ProjectStatus;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

// CCR Footer Data
export interface CcrFooterData {
  id?: string;
  date: string;
  parameter_id: string;
  plant_unit?: string;
  total: number;
  average: number;
  minimum: number;
  maximum: number;
  shift1_total: number;
  shift2_total: number;
  shift3_total: number;
  shift3_cont_total: number;
  shift1_average: number;
  shift2_average: number;
  shift3_average: number;
  shift3_cont_average: number;
  shift1_counter: number;
  shift2_counter: number;
  shift3_counter: number;
  shift3_cont_counter: number;
}

