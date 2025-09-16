import React from "react";

export type UserRole = "Super Admin" | "Admin" | "Operator" | "Guest";

export type PermissionLevel = "NONE" | "READ" | "WRITE" | "ADMIN";

export interface PlantOperationsPermissions {
  [category: string]: {
    [unit: string]: PermissionLevel;
  };
}

export interface PermissionMatrix {
  dashboard: PermissionLevel;
  plant_operations: PlantOperationsPermissions;
  packing_plant: PermissionLevel;
  project_management: PermissionLevel;
  system_settings: PermissionLevel;
  user_management: PermissionLevel;
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
  last_active?: Date;
  created_at: Date;
  updated_at: Date;
  permissions: PermissionMatrix;
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

// Plant Operations Types
export enum MachineStatus {
  RUNNING = "Running",
  STOPPED = "Stopped",
  MAINTENANCE = "Maintenance",
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  output: number; // tons per hour
  uptime: number; // percentage
  temperature: number; // Celsius
}

export interface Kpi {
  id: string;
  title: string;
  value: string;
  unit: string;
  trend: number; // positive for up, negative for down, 0 for stable
  icon: React.ComponentType<{ className?: string }>;
}

export enum AlertSeverity {
  INFO = "Info",
  WARNING = "Warning",
  CRITICAL = "Critical",
}

export interface Alert {
  id: string;
  message: string;
  timestamp: Date;
  severity: AlertSeverity;
  read: boolean;
}

// Plant Operations Master Data
export interface PlantUnit {
  id: string;
  unit: string;
  category: string;
}

export enum ParameterDataType {
  NUMBER = "Number",
  TEXT = "Text",
}

export interface ParameterSetting {
  id: string;
  parameter: string;
  data_type: ParameterDataType;
  unit: string;
  category: string;
  min_value?: number;
  max_value?: number;
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
}

// CCR Data Entry
export interface CcrSiloData {
  id: string; // combination of siloId and date
  silo_id: string;
  date: string; // YYY-MM-DD
  shift1: { emptySpace?: number; content?: number };
  shift2: { emptySpace?: number; content?: number };
  shift3: { emptySpace?: number; content?: number };
}

export interface CcrParameterData {
  id: string; // combination of parameterId and date
  parameter_id: string;
  date: string; // YYYY-MM-DD
  hourly_values: { [hour: number]: string | number }; // hour is 1-24
}

export enum DowntimeStatus {
  OPEN = "Open",
  CLOSE = "Close",
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
  IDENTIFIED = "Identified",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
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

// Packing Plant Master Data
export interface PackingPlantMasterRecord {
  id: string;
  area: string;
  plant_code: string;
  silo_capacity: number;
  dead_stock: number;
  cement_type: string;
}

// Packing Plant Stock Data
export interface PackingPlantStockRecord {
  id: string;
  record_id?: string;
  date: string; // YYYY-MM-DD
  area: string;
  opening_stock: number;
  stock_received: number;
  stock_out: number;
  closing_stock: number;
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
  ACTIVE = "active",
  IN_PROGRESS = "In Progress",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled",
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  DELAYED = "delayed",
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
