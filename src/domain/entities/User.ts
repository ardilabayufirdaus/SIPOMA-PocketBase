import { RecordModel } from 'pocketbase';

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Operator'
  | 'Outsourcing'
  | 'Autonomous'
  | 'Guest';

export type PermissionLevel = 'NONE' | 'READ' | 'WRITE';

export interface UserPermission {
  dashboard: PermissionLevel;
  cm_plant_operations: PermissionLevel;
  rkc_plant_operations: PermissionLevel;
  project_management: PermissionLevel;
  database: PermissionLevel;
}

export interface User {
  id: string;
  username: string; // From auth store
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  is_active: boolean;
  last_active?: string;
  employee_id?: string;
  permissions?: UserPermission; // Joined from user_management
  created: string;
  updated: string;
}

// Filter untuk pencarian
export interface UserFilter {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}
