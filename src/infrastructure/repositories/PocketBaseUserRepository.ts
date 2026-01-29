import PocketBase from 'pocketbase';
import { getAdminPb } from '../../../utils/pocketbase-admin';
import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
} from '../../domain/repositories/UserRepository';
import {
  User,
  UserFilter,
  PaginatedResult,
  UserRole,
  UserPermission,
} from '../../domain/entities/User';

export class PocketBaseUserRepository implements IUserRepository {
  async getUsers(filter: UserFilter): Promise<PaginatedResult<User>> {
    const pb = await getAdminPb();
    const page = filter.page || 1;
    const perPage = filter.perPage || 50;

    // Simple filter construction
    const filterParts: string[] = [];
    if (filter.search) {
      filterParts.push(`(name ~ "${filter.search}" || role ~ "${filter.search}")`);
    }
    if (filter.role && filter.role !== 'all') {
      filterParts.push(`role = "${filter.role}"`);
    }
    if (filter.status && filter.status !== 'all') {
      const isActive = filter.status === 'active';
      filterParts.push(`is_active = ${isActive}`);
    }

    const filterStr = filterParts.length > 0 ? filterParts.join(' && ') : '';

    const records = await pb.collection('users').getList(page, perPage, {
      filter: filterStr,
      sort: '-created',
    });

    const items = await Promise.all(
      records.items.map(async (record) => {
        const permissions = await this.getUserPermissions(pb, record.id);
        return this.mapToEntity(pb, record, permissions);
      })
    );

    return {
      items,
      totalItems: records.totalItems,
      totalPages: records.totalPages,
      page: records.page,
      perPage: records.perPage,
    };
  }

  async getUserById(id: string): Promise<User> {
    const pb = await getAdminPb();
    const record = await pb.collection('users').getOne(id);
    const permissions = await this.getUserPermissions(pb, id);
    return this.mapToEntity(pb, record, permissions);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const pb = await getAdminPb();

    // 1. Create Auth User
    const userRecord = await pb.collection('users').create({
      username: data.username,
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      name: data.name,
      role: data.role,
      is_active: data.is_active,
      employee_id: data.employee_id,
    });

    // 2. Create Permission Record
    await pb.collection('user_management').create({
      user_id: userRecord.id,
      dashboard: data.permissions.dashboard,
      cm_plant_operations: data.permissions.cm_plant_operations,
      rkc_plant_operations: data.permissions.rkc_plant_operations,
      project_management: data.permissions.project_management,
      database: data.permissions.database,
      inspection: data.permissions.inspection,
    });

    return this.getUserById(userRecord.id);
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const pb = await getAdminPb();

    // 1. Update User Profile
    const userData: any = {};
    if (data.email) userData.email = data.email;
    if (data.name) userData.name = data.name;
    if (data.role) userData.role = data.role;
    if (data.is_active !== undefined) userData.is_active = data.is_active;
    if (data.employee_id) userData.employee_id = data.employee_id;
    if (data.password) {
      userData.password = data.password;
      userData.passwordConfirm = data.passwordConfirm;
    }

    if (Object.keys(userData).length > 0) {
      await pb.collection('users').update(id, userData);
    }

    // 2. Update Permissions if provided
    if (data.permissions) {
      // Find existing permission ref
      const permRecord = await this.getPermissionRecordId(pb, id);

      const permData = {
        dashboard: data.permissions.dashboard,
        cm_plant_operations: data.permissions.cm_plant_operations,
        rkc_plant_operations: data.permissions.rkc_plant_operations,
        project_management: data.permissions.project_management,
        database: data.permissions.database,
        inspection: data.permissions.inspection,
      };

      if (permRecord) {
        await pb.collection('user_management').update(permRecord, permData);
      } else {
        // Create if missing (edge case)
        await pb.collection('user_management').create({
          user_id: id,
          ...permData,
        });
      }
    }

    return this.getUserById(id);
  }

  async deleteUser(id: string): Promise<void> {
    const pb = await getAdminPb();
    await pb.collection('users').delete(id);

    // Attempt to delete associated permission record
    const permId = await this.getPermissionRecordId(pb, id);
    if (permId) {
      await pb.collection('user_management').delete(permId);
    }
  }

  // --- Helpers ---

  private async getUserPermissions(pb: PocketBase, userId: string): Promise<UserPermission> {
    try {
      const records = await pb.collection('user_management').getList(1, 1, {
        filter: `user_id = "${userId}"`,
      });

      if (records.items.length > 0) {
        const item = records.items[0];
        return {
          dashboard: item.dashboard || 'NONE',
          cm_plant_operations: item.cm_plant_operations || 'NONE',
          rkc_plant_operations: item.rkc_plant_operations || 'NONE',
          project_management: item.project_management || 'NONE',
          database: item.database || 'NONE',
          inspection: item.inspection || 'NONE',
        };
      }
    } catch (e) {
      console.warn(`Could not fetch permissions for user ${userId}`, e);
    }

    // Default fallback
    return {
      dashboard: 'NONE',
      cm_plant_operations: 'NONE',
      rkc_plant_operations: 'NONE',
      project_management: 'NONE',
      database: 'NONE',
      inspection: 'NONE',
    };
  }

  private async getPermissionRecordId(pb: PocketBase, userId: string): Promise<string | null> {
    const records = await pb.collection('user_management').getList(1, 1, {
      filter: `user_id = "${userId}"`,
      fields: 'id',
    });
    return records.items.length > 0 ? records.items[0].id : null;
  }

  private mapToEntity(pb: PocketBase, record: any, permissions: UserPermission): User {
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      name: record.name,
      avatar: record.avatar ? pb.files.getUrl(record, record.avatar) : undefined,
      role: record.role as UserRole,
      is_active: record.is_active,
      created: record.created,
      updated: record.updated,
      employee_id: record.employee_id,
      permissions,
    };
  }
}
