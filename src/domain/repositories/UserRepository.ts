import { User, UserFilter, PaginatedResult } from '../entities/User';

export interface CreateUserDTO {
  username: string;
  email: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  role: string;
  is_active: boolean;
  employee_id?: string;
  permissions: {
    dashboard: string;
    cm_plant_operations: string;
    rkc_plant_operations: string;
    project_management: string;
    database: string;
  };
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  employee_id?: string;
  password?: string;
  passwordConfirm?: string;
  permissions?: {
    dashboard: string;
    cm_plant_operations: string;
    rkc_plant_operations: string;
    project_management: string;
    database: string;
  };
}

export interface IUserRepository {
  getUsers(filter: UserFilter): Promise<PaginatedResult<User>>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDTO): Promise<User>;
  updateUser(id: string, user: UpdateUserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
