import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// RBAC Types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, string | number | boolean>;
  description: string;
  category: string;
  isSystemLevel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  parentRoles: string[];
  childRoles: string[];
  isSystemRole: boolean;
  isActive: boolean;
  priority: number;
  constraints?: RoleConstraints;
  metadata: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface RoleConstraints {
  maxUsers?: number;
  allowedDepartments?: string[];
  allowedPlants?: string[];
  timeRestrictions?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  ipRestrictions?: string[];
  sessionDuration?: number;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  conditions?: Record<string, string | number | boolean>;
  metadata: Record<string, string | number | boolean>;
}

export interface RoleHierarchy {
  parentId: string;
  childId: string;
  inheritanceType: 'full' | 'partial' | 'none';
  inheritedPermissions: string[];
  createdAt: Date;
}

export interface PermissionMatrix {
  [resource: string]: {
    [action: string]: {
      allowed: boolean;
      conditions?: Record<string, string | number | boolean>;
      source: 'direct' | 'inherited' | 'computed';
      roleId?: string;
    };
  };
}

export interface AccessRequest {
  id: string;
  userId: string;
  requestedRoles: string[];
  requestedPermissions: string[];
  justification: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  expiresAt: Date;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  constraints?: RoleConstraints;
  isActive: boolean;
  usageCount: number;
}

export interface ComplianceReport {
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
  totalUserRoles: number;
  systemRoles: number;
  rolesWithConstraints: number;
  expiredRoles: number;
}

export interface AccessAuditRecord {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  userName: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface RBACExportData {
  permissions: Permission[];
  roles: Role[];
  roleHierarchies: RoleHierarchy[];
  roleTemplates: RoleTemplate[];
  exportedAt: string;
  version: string;
}

export interface RBACStore {
  // State
  permissions: Permission[];
  roles: Role[];
  userRoles: UserRole[];
  roleHierarchies: RoleHierarchy[];
  accessRequests: AccessRequest[];
  roleTemplates: RoleTemplate[];
  permissionCache: Record<string, PermissionMatrix>;

  // Permission Management
  createPermission: (
    permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Permission>;
  updatePermission: (id: string, updates: Partial<Permission>) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  getPermission: (id: string) => Permission | undefined;
  getPermissionsByCategory: (category: string) => Permission[];

  // Role Management
  createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  cloneRole: (roleId: string, newName: string) => Promise<Role>;
  getRole: (id: string) => Role | undefined;
  getRolesByUser: (userId: string) => Role[];
  getAvailableRoles: (userId: string) => Role[];

  // Role Hierarchy
  addRoleHierarchy: (
    parentId: string,
    childId: string,
    inheritanceType: 'full' | 'partial'
  ) => Promise<void>;
  removeRoleHierarchy: (parentId: string, childId: string) => Promise<void>;
  getRoleHierarchy: (roleId: string) => { parents: Role[]; children: Role[] };
  calculateInheritedPermissions: (roleId: string) => string[];

  // User Role Assignment
  assignRole: (
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date
  ) => Promise<void>;
  unassignRole: (userId: string, roleId: string) => Promise<void>;
  getUserRoles: (userId: string) => UserRole[];
  getUserPermissionMatrix: (userId: string) => PermissionMatrix;

  // Permission Checking
  hasPermission: (
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, string | number | boolean>
  ) => boolean;
  hasRole: (userId: string, roleName: string) => boolean;
  hasAnyRole: (userId: string, roleNames: string[]) => boolean;
  canPerformAction: (
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, string | number | boolean>
  ) => boolean;

  // Access Requests
  createAccessRequest: (
    request: Omit<AccessRequest, 'id' | 'requestedAt' | 'status'>
  ) => Promise<AccessRequest>;
  approveAccessRequest: (requestId: string, reviewedBy: string, comments?: string) => Promise<void>;
  rejectAccessRequest: (requestId: string, reviewedBy: string, comments: string) => Promise<void>;
  getPendingAccessRequests: () => AccessRequest[];
  getUserAccessRequests: (userId: string) => AccessRequest[];

  // Role Templates
  createRoleTemplate: (template: Omit<RoleTemplate, 'id' | 'usageCount'>) => Promise<RoleTemplate>;
  updateRoleTemplate: (id: string, updates: Partial<RoleTemplate>) => Promise<void>;
  deleteRoleTemplate: (id: string) => Promise<void>;
  createRoleFromTemplate: (templateId: string, roleName: string) => Promise<Role>;

  // Analytics & Reporting
  getRoleUsageStats: () => Record<string, number>;
  getPermissionUsageStats: () => Record<string, number>;
  getComplianceReport: () => ComplianceReport;
  getAccessAudit: (userId?: string, dateFrom?: Date, dateTo?: Date) => AccessAuditRecord[];

  // Cache Management
  refreshPermissionCache: (userId: string) => Promise<void>;
  clearPermissionCache: () => void;

  // Bulk Operations
  bulkAssignRoles: (
    assignments: { userId: string; roleId: string; expiresAt?: Date }[]
  ) => Promise<void>;
  bulkUnassignRoles: (assignments: { userId: string; roleId: string }[]) => Promise<void>;

  // Import/Export
  exportRolesAndPermissions: () => RBACExportData;
  importRolesAndPermissions: (data: RBACExportData) => Promise<void>;
}

// Default permissions for SIPOMA system
const defaultPermissions: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // User Management
  {
    name: 'View Users',
    resource: 'users',
    action: 'read',
    category: 'User Management',
    description: 'View user profiles and basic information',
    isSystemLevel: false,
  },
  {
    name: 'Create Users',
    resource: 'users',
    action: 'create',
    category: 'User Management',
    description: 'Create new user accounts',
    isSystemLevel: true,
  },
  {
    name: 'Edit Users',
    resource: 'users',
    action: 'update',
    category: 'User Management',
    description: 'Edit existing user accounts',
    isSystemLevel: true,
  },
  {
    name: 'Delete Users',
    resource: 'users',
    action: 'delete',
    category: 'User Management',
    description: 'Delete user accounts',
    isSystemLevel: true,
  },

  // Plant Operations
  {
    name: 'View Plant Data',
    resource: 'plant',
    action: 'read',
    category: 'Plant Operations',
    description: 'View plant operational data',
    isSystemLevel: false,
  },
  {
    name: 'Edit Plant Data',
    resource: 'plant',
    action: 'update',
    category: 'Plant Operations',
    description: 'Modify plant operational data',
    isSystemLevel: false,
  },
  {
    name: 'Control Equipment',
    resource: 'equipment',
    action: 'control',
    category: 'Plant Operations',
    description: 'Control plant equipment and machinery',
    isSystemLevel: false,
  },
  {
    name: 'Emergency Stop',
    resource: 'equipment',
    action: 'emergency_stop',
    category: 'Plant Operations',
    description: 'Emergency stop authority for equipment',
    isSystemLevel: false,
  },

  // Reports & Analytics
  {
    name: 'View Reports',
    resource: 'reports',
    action: 'read',
    category: 'Reports',
    description: 'View generated reports',
    isSystemLevel: false,
  },
  {
    name: 'Create Reports',
    resource: 'reports',
    action: 'create',
    category: 'Reports',
    description: 'Create and generate reports',
    isSystemLevel: false,
  },
  {
    name: 'Export Data',
    resource: 'data',
    action: 'export',
    category: 'Reports',
    description: 'Export data and reports',
    isSystemLevel: false,
  },

  // System Administration
  {
    name: 'System Configuration',
    resource: 'system',
    action: 'configure',
    category: 'Administration',
    description: 'Configure system settings',
    isSystemLevel: true,
  },
  {
    name: 'View Audit Logs',
    resource: 'audit',
    action: 'read',
    category: 'Administration',
    description: 'View system audit logs',
    isSystemLevel: true,
  },
  {
    name: 'Manage Roles',
    resource: 'roles',
    action: 'manage',
    category: 'Administration',
    description: 'Create and manage user roles',
    isSystemLevel: true,
  },
  {
    name: 'Security Management',
    resource: 'security',
    action: 'manage',
    category: 'Administration',
    description: 'Manage security settings and policies',
    isSystemLevel: true,
  },
];

// Default roles
const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'System Administrator',
    description: 'Full system access with all administrative privileges',
    permissions: [],
    parentRoles: [],
    childRoles: [],
    isSystemRole: true,
    isActive: true,
    priority: 100,
    metadata: { color: '#dc2626', icon: 'shield-check' },
  },
  {
    name: 'Plant Manager',
    description: 'Plant operations management with supervisory access',
    permissions: [],
    parentRoles: [],
    childRoles: [],
    isSystemRole: true,
    isActive: true,
    priority: 80,
    metadata: { color: '#059669', icon: 'building' },
  },
  {
    name: 'Operator',
    description: 'Standard plant operator with operational access',
    permissions: [],
    parentRoles: [],
    childRoles: [],
    isSystemRole: true,
    isActive: true,
    priority: 60,
    metadata: { color: '#0369a1', icon: 'users' },
  },
  {
    name: 'Viewer',
    description: 'Read-only access to plant data and reports',
    permissions: [],
    parentRoles: [],
    childRoles: [],
    isSystemRole: true,
    isActive: true,
    priority: 40,
    metadata: { color: '#6b7280', icon: 'eye' },
  },
];

export const useRBACStore = create<RBACStore>()(
  persist(
    (set, get) => ({
      // Initial State
      permissions: [],
      roles: [],
      userRoles: [],
      roleHierarchies: [],
      accessRequests: [],
      roleTemplates: [],
      permissionCache: {},

      // Create Permission
      createPermission: async (permissionData) => {
        const permission: Permission = {
          ...permissionData,
          id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          permissions: [...state.permissions, permission],
        }));

        return permission;
      },

      // Update Permission
      updatePermission: async (id, updates) => {
        set((state) => ({
          permissions: state.permissions.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      // Delete Permission
      deletePermission: async (id) => {
        set((state) => ({
          permissions: state.permissions.filter((p) => p.id !== id),
          roles: state.roles.map((r) => ({
            ...r,
            permissions: r.permissions.filter((pId) => pId !== id),
          })),
        }));
      },

      // Get Permission
      getPermission: (id) => {
        return get().permissions.find((p) => p.id === id);
      },

      // Get Permissions by Category
      getPermissionsByCategory: (category) => {
        return get().permissions.filter((p) => p.category === category);
      },

      // Create Role
      createRole: async (roleData) => {
        const role: Role = {
          ...roleData,
          id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system', // In production, use actual user ID
        };

        set((state) => ({
          roles: [...state.roles, role],
        }));

        return role;
      },

      // Update Role
      updateRole: async (id, updates) => {
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          ),
        }));

        // Clear cache for affected users
        get().clearPermissionCache();
      },

      // Delete Role
      deleteRole: async (id) => {
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id),
          userRoles: state.userRoles.filter((ur) => ur.roleId !== id),
          roleHierarchies: state.roleHierarchies.filter(
            (rh) => rh.parentId !== id && rh.childId !== id
          ),
        }));

        get().clearPermissionCache();
      },

      // Clone Role
      cloneRole: async (roleId, newName) => {
        const originalRole = get().getRole(roleId);
        if (!originalRole) throw new Error('Role not found');

        const clonedRole = await get().createRole({
          ...originalRole,
          name: newName,
          isSystemRole: false,
        });

        return clonedRole;
      },

      // Get Role
      getRole: (id) => {
        return get().roles.find((r) => r.id === id);
      },

      // Get Roles by User
      getRolesByUser: (userId) => {
        const userRoles = get().userRoles.filter((ur) => ur.userId === userId && ur.isActive);
        return userRoles.map((ur) => get().getRole(ur.roleId)).filter(Boolean) as Role[];
      },

      // Get Available Roles
      getAvailableRoles: (userId) => {
        const assignedRoleIds = get()
          .userRoles.filter((ur) => ur.userId === userId && ur.isActive)
          .map((ur) => ur.roleId);

        return get().roles.filter((r) => r.isActive && !assignedRoleIds.includes(r.id));
      },

      // Add Role Hierarchy
      addRoleHierarchy: async (parentId, childId, inheritanceType) => {
        const hierarchy: RoleHierarchy = {
          parentId,
          childId,
          inheritanceType,
          inheritedPermissions:
            inheritanceType === 'full' ? get().getRole(parentId)?.permissions || [] : [],
          createdAt: new Date(),
        };

        set((state) => ({
          roleHierarchies: [...state.roleHierarchies, hierarchy],
        }));

        get().clearPermissionCache();
      },

      // Remove Role Hierarchy
      removeRoleHierarchy: async (parentId, childId) => {
        set((state) => ({
          roleHierarchies: state.roleHierarchies.filter(
            (rh) => !(rh.parentId === parentId && rh.childId === childId)
          ),
        }));

        get().clearPermissionCache();
      },

      // Get Role Hierarchy
      getRoleHierarchy: (roleId) => {
        const hierarchies = get().roleHierarchies;
        const parents = hierarchies
          .filter((rh) => rh.childId === roleId)
          .map((rh) => get().getRole(rh.parentId))
          .filter(Boolean) as Role[];

        const children = hierarchies
          .filter((rh) => rh.parentId === roleId)
          .map((rh) => get().getRole(rh.childId))
          .filter(Boolean) as Role[];

        return { parents, children };
      },

      // Calculate Inherited Permissions
      calculateInheritedPermissions: (roleId) => {
        const visited = new Set<string>();
        const permissions = new Set<string>();

        const collectPermissions = (id: string) => {
          if (visited.has(id)) return;
          visited.add(id);

          const role = get().getRole(id);
          if (role) {
            role.permissions.forEach((p) => permissions.add(p));
          }

          const hierarchies = get().roleHierarchies.filter((rh) => rh.childId === id);
          hierarchies.forEach((rh) => {
            if (rh.inheritanceType === 'full') {
              collectPermissions(rh.parentId);
            } else if (rh.inheritanceType === 'partial') {
              rh.inheritedPermissions.forEach((p) => permissions.add(p));
            }
          });
        };

        collectPermissions(roleId);
        return Array.from(permissions);
      },

      // Assign Role
      assignRole: async (userId, roleId, assignedBy, expiresAt) => {
        const userRole: UserRole = {
          id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          roleId,
          assignedBy,
          assignedAt: new Date(),
          expiresAt,
          isActive: true,
          conditions: {},
          metadata: {},
        };

        set((state) => ({
          userRoles: [...state.userRoles, userRole],
        }));

        await get().refreshPermissionCache(userId);
      },

      // Unassign Role
      unassignRole: async (userId, roleId) => {
        set((state) => ({
          userRoles: state.userRoles.map((ur) =>
            ur.userId === userId && ur.roleId === roleId ? { ...ur, isActive: false } : ur
          ),
        }));

        await get().refreshPermissionCache(userId);
      },

      // Get User Roles
      getUserRoles: (userId) => {
        return get().userRoles.filter((ur) => ur.userId === userId && ur.isActive);
      },

      // Get User Permission Matrix
      getUserPermissionMatrix: (userId) => {
        const cached = get().permissionCache[userId];
        if (cached) return cached;

        const matrix: PermissionMatrix = {};
        const userRoles = get().getRolesByUser(userId);

        userRoles.forEach((role) => {
          const allPermissions = get().calculateInheritedPermissions(role.id);
          allPermissions.forEach((permissionId) => {
            const permission = get().getPermission(permissionId);
            if (permission) {
              if (!matrix[permission.resource]) {
                matrix[permission.resource] = {};
              }
              matrix[permission.resource][permission.action] = {
                allowed: true,
                conditions: permission.conditions,
                source: 'direct',
                roleId: role.id,
              };
            }
          });
        });

        // Cache the result
        set((state) => ({
          permissionCache: { ...state.permissionCache, [userId]: matrix },
        }));

        return matrix;
      },

      // Has Permission
      hasPermission: (
        userId: string,
        resource: string,
        action: string,
        context?: Record<string, string | number | boolean>
      ) => {
        const matrix = get().getUserPermissionMatrix(userId);
        const permission = matrix[resource]?.[action];

        if (!permission?.allowed) return false;

        // Check conditions if they exist
        if (permission.conditions && context) {
          // Simple condition checking (extend as needed)
          for (const [key, value] of Object.entries(permission.conditions)) {
            if (context[key] !== value) return false;
          }
        }

        return true;
      },

      // Has Role
      hasRole: (userId, roleName) => {
        const userRoles = get().getRolesByUser(userId);
        return userRoles.some((role) => role.name === roleName);
      },

      // Has Any Role
      hasAnyRole: (userId, roleNames) => {
        const userRoles = get().getRolesByUser(userId);
        return userRoles.some((role) => roleNames.includes(role.name));
      },

      // Can Perform Action
      canPerformAction: (
        userId: string,
        resource: string,
        action: string,
        context?: Record<string, string | number | boolean>
      ) => {
        return get().hasPermission(userId, resource, action, context);
      },

      // Create Access Request
      createAccessRequest: async (requestData) => {
        const request: AccessRequest = {
          ...requestData,
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestedAt: new Date(),
          status: 'pending',
        };

        set((state) => ({
          accessRequests: [...state.accessRequests, request],
        }));

        return request;
      },

      // Approve Access Request
      approveAccessRequest: async (requestId, reviewedBy, comments) => {
        set((state) => ({
          accessRequests: state.accessRequests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'approved' as const,
                  reviewedBy,
                  reviewedAt: new Date(),
                  reviewComments: comments,
                }
              : req
          ),
        }));

        // Auto-assign roles (implement as needed)
        const request = get().accessRequests.find((r) => r.id === requestId);
        if (request) {
          for (const roleId of request.requestedRoles) {
            await get().assignRole(request.userId, roleId, reviewedBy);
          }
        }
      },

      // Reject Access Request
      rejectAccessRequest: async (requestId, reviewedBy, comments) => {
        set((state) => ({
          accessRequests: state.accessRequests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: 'rejected' as const,
                  reviewedBy,
                  reviewedAt: new Date(),
                  reviewComments: comments,
                }
              : req
          ),
        }));
      },

      // Get Pending Access Requests
      getPendingAccessRequests: () => {
        return get().accessRequests.filter((req) => req.status === 'pending');
      },

      // Get User Access Requests
      getUserAccessRequests: (userId) => {
        return get().accessRequests.filter((req) => req.userId === userId);
      },

      // Create Role Template
      createRoleTemplate: async (templateData) => {
        const template: RoleTemplate = {
          ...templateData,
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          usageCount: 0,
        };

        set((state) => ({
          roleTemplates: [...state.roleTemplates, template],
        }));

        return template;
      },

      // Update Role Template
      updateRoleTemplate: async (id, updates) => {
        set((state) => ({
          roleTemplates: state.roleTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      // Delete Role Template
      deleteRoleTemplate: async (id) => {
        set((state) => ({
          roleTemplates: state.roleTemplates.filter((t) => t.id !== id),
        }));
      },

      // Create Role from Template
      createRoleFromTemplate: async (templateId, roleName) => {
        const template = get().roleTemplates.find((t) => t.id === templateId);
        if (!template) throw new Error('Template not found');

        const role = await get().createRole({
          name: roleName,
          description: template.description,
          permissions: [...template.permissions],
          parentRoles: [],
          childRoles: [],
          isSystemRole: false,
          isActive: true,
          priority: 50,
          constraints: template.constraints,
          metadata: {},
          createdBy: 'system',
        });

        // Update template usage count
        set((state) => ({
          roleTemplates: state.roleTemplates.map((t) =>
            t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
          ),
        }));

        return role;
      },

      // Get Role Usage Stats
      getRoleUsageStats: () => {
        const userRoles = get().userRoles.filter((ur) => ur.isActive);
        const stats: Record<string, number> = {};

        userRoles.forEach((ur) => {
          stats[ur.roleId] = (stats[ur.roleId] || 0) + 1;
        });

        return stats;
      },

      // Get Permission Usage Stats
      getPermissionUsageStats: () => {
        const roles = get().roles.filter((r) => r.isActive);
        const stats: Record<string, number> = {};

        roles.forEach((role) => {
          role.permissions.forEach((permId) => {
            stats[permId] = (stats[permId] || 0) + 1;
          });
        });

        return stats;
      },

      // Get Compliance Report
      getComplianceReport: () => {
        const roles = get().roles;
        const userRoles = get().userRoles.filter((ur) => ur.isActive);
        const permissions = get().permissions;

        return {
          totalRoles: roles.length,
          activeRoles: roles.filter((r) => r.isActive).length,
          totalPermissions: permissions.length,
          totalUserRoles: userRoles.length,
          systemRoles: roles.filter((r) => r.isSystemRole).length,
          rolesWithConstraints: roles.filter((r) => r.constraints).length,
          expiredRoles: userRoles.filter((ur) => ur.expiresAt && ur.expiresAt < new Date()).length,
        };
      },

      // Get Access Audit
      getAccessAudit: (userId, dateFrom, dateTo) => {
        let userRoles = get().userRoles;

        if (userId) {
          userRoles = userRoles.filter((ur) => ur.userId === userId);
        }

        if (dateFrom || dateTo) {
          userRoles = userRoles.filter((ur) => {
            const assignedAt = ur.assignedAt;
            return (!dateFrom || assignedAt >= dateFrom) && (!dateTo || assignedAt <= dateTo);
          });
        }

        return userRoles.map((ur) => ({
          ...ur,
          roleName: get().getRole(ur.roleId)?.name || 'Unknown',
          userName: `User ${ur.userId}`, // In production, fetch actual user name
        }));
      },

      // Refresh Permission Cache
      refreshPermissionCache: async (userId) => {
        const matrix = get().getUserPermissionMatrix(userId);
        set((state) => ({
          permissionCache: { ...state.permissionCache, [userId]: matrix },
        }));
      },

      // Clear Permission Cache
      clearPermissionCache: () => {
        set(() => ({ permissionCache: {} }));
      },

      // Bulk Assign Roles
      bulkAssignRoles: async (assignments) => {
        const userRoles = assignments.map((assignment) => ({
          id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...assignment,
          assignedBy: 'system',
          assignedAt: new Date(),
          isActive: true,
          conditions: {},
          metadata: {},
        }));

        set((state) => ({
          userRoles: [...state.userRoles, ...userRoles],
        }));

        // Refresh cache for all affected users
        const userIds = [...new Set(assignments.map((a) => a.userId))];
        for (const userId of userIds) {
          await get().refreshPermissionCache(userId);
        }
      },

      // Bulk Unassign Roles
      bulkUnassignRoles: async (assignments) => {
        set((state) => ({
          userRoles: state.userRoles.map((ur) =>
            assignments.some((a) => a.userId === ur.userId && a.roleId === ur.roleId)
              ? { ...ur, isActive: false }
              : ur
          ),
        }));

        // Refresh cache for all affected users
        const userIds = [...new Set(assignments.map((a) => a.userId))];
        for (const userId of userIds) {
          await get().refreshPermissionCache(userId);
        }
      },

      // Export Roles and Permissions
      exportRolesAndPermissions: () => {
        const { permissions, roles, roleHierarchies, roleTemplates } = get();
        return {
          permissions,
          roles,
          roleHierarchies,
          roleTemplates,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
      },

      // Import Roles and Permissions
      importRolesAndPermissions: async (data) => {
        if (data.version !== '1.0') {
          throw new Error('Unsupported import format version');
        }

        set((state) => ({
          permissions: [...state.permissions, ...data.permissions],
          roles: [...state.roles, ...data.roles],
          roleHierarchies: [...state.roleHierarchies, ...data.roleHierarchies],
          roleTemplates: [...state.roleTemplates, ...data.roleTemplates],
        }));

        get().clearPermissionCache();
      },
    }),
    {
      name: 'sipoma-rbac-store',
      partialize: (state) => ({
        permissions: state.permissions,
        roles: state.roles,
        userRoles: state.userRoles,
        roleHierarchies: state.roleHierarchies,
        accessRequests: state.accessRequests,
        roleTemplates: state.roleTemplates,
      }),
    }
  )
);

// Initialize default data
export const initializeRBACDefaults = async () => {
  const store = useRBACStore.getState();

  // Initialize default permissions
  if (store.permissions.length === 0) {
    for (const permData of defaultPermissions) {
      await store.createPermission(permData);
    }
  }

  // Initialize default roles
  if (store.roles.length === 0) {
    for (const roleData of defaultRoles) {
      await store.createRole({
        ...roleData,
        createdBy: 'system',
      });
    }
  }
};

