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
  cm_plant_operations: PermissionLevel | PlantOperationsPermissions;
  rkc_plant_operations: PermissionLevel | PlantOperationsPermissions;
  project_management: PermissionLevel | PlantOperationsPermissions;
  database: PermissionLevel;
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

export interface SimpleReportSetting {
  id: string;
  parameter_id: string;
  category: string;
  order: number;
  is_active?: boolean;
}
