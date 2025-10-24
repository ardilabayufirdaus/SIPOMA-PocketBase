import { User, PermissionMatrix, PlantOperationsPermissions } from '../types';
import React from 'react';

/**
 * Utility class for role-based access control (RBAC)
 * Provides methods to check user permissions across the application
 */
export class PermissionChecker {
  private user: User | null;
  private cache: Map<string, boolean> = new Map();

  constructor(user: User | null) {
    this.user = user;
  }

  /**
   * Check if user has specific permission level for a feature
   */
  hasPermission(feature: keyof PermissionMatrix, requiredLevel: string = 'READ'): boolean {
    const cacheKey = `${feature}-${requiredLevel}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = this._hasPermission(feature, requiredLevel);
    this.cache.set(cacheKey, result);
    return result;
  }

  private _hasPermission(feature: keyof PermissionMatrix, requiredLevel: string = 'READ'): boolean {
    if (!this.user) return false;

    // Super Admin has all permissions
    if (this.user.role === 'Super Admin') return true;

    // Check if permissions object exists
    if (!this.user.permissions) return false;

    const userPermission = this.user.permissions[feature];

    // Handle string permission format (recommended)
    if (typeof userPermission === 'string') {
      return this.comparePermissionLevel(userPermission, requiredLevel);
    }

    // Handle object permission format (for plant_operations or granular permissions)
    if (typeof userPermission === 'object' && userPermission !== null) {
      // For object format, check if user has any access that meets the required level
      const plantOps = userPermission as PlantOperationsPermissions;
      return Object.values(plantOps).some((category) =>
        Object.values(category).some((level) => this.comparePermissionLevel(level, requiredLevel))
      );
    }

    return false;
  }

  /**
   * Check if user has permission for specific plant operation category and unit
   */
  hasPlantOperationPermission(
    category: string,
    unit: string,
    requiredLevel: string = 'READ'
  ): boolean {
    if (!this.user) return false;

    // Super Admin has all permissions
    if (this.user.role === 'Super Admin') return true;

    // Check if permissions object exists
    if (!this.user.permissions) return false;

    const plantOps = this.user.permissions.plant_operations;
    if (!plantOps || !plantOps[category] || !plantOps[category][unit]) {
      return false;
    }

    return this.comparePermissionLevel(plantOps[category][unit], requiredLevel);
  }

  /**
   * Check if user can access system settings
   * Settings are accessible to all users except Guest
   */
  canAccessSettings(): boolean {
    return this.user?.role !== 'Guest';
  }

  /**
   * Check if user can access dashboard
   */
  canAccessDashboard(): boolean {
    return this.hasPermission('dashboard', 'READ');
  }

  /**
   * Check if user can access plant operations
   */
  canAccessPlantOperations(): boolean {
    return this.hasPermission('plant_operations', 'READ');
  }

  /**
   * Check if user can access project management
   */
  canAccessProjectManagement(): boolean {
    return this.hasPermission('project_management', 'READ');
  }

  /**
   * Check if user can access inspection module
   */
  canAccessInspection(): boolean {
    return this.hasPermission('inspection', 'READ');
  }

  /**
   * Check if user can perform admin actions (create, update, delete)
   */
  canPerformAdminActions(feature: keyof PermissionMatrix): boolean {
    return this.hasPermission(feature, 'ADMIN');
  }

  /**
   * Check if user can perform write actions (create, update)
   */
  canPerformWriteActions(feature: keyof PermissionMatrix): boolean {
    return this.hasPermission(feature, 'WRITE');
  }

  /**
   * Get the highest permission level for a feature
   */
  getPermissionLevel(feature: keyof PermissionMatrix): string {
    if (!this.user) return 'NONE';

    // Super Admin has admin level for everything
    if (this.user.role === 'Super Admin') return 'ADMIN';

    // Check if permissions object exists
    if (!this.user.permissions) return 'NONE';

    const userPermission = this.user.permissions[feature];

    if (typeof userPermission === 'string') {
      return userPermission;
    }

    // For plant operations, return the highest permission level across all categories/units
    if (feature === 'plant_operations' && typeof userPermission === 'object') {
      const plantOps = userPermission as PlantOperationsPermissions;
      let highestLevel = 'NONE';

      Object.values(plantOps).forEach((category) => {
        Object.values(category).forEach((level) => {
          if (this.comparePermissionLevel(level, highestLevel) && level !== highestLevel) {
            highestLevel = level;
          }
        });
      });

      return highestLevel;
    }

    return 'NONE';
  }

  /**
   * Compare permission levels (higher levels include lower levels)
   */
  private comparePermissionLevel(userLevel: string, requiredLevel: string): boolean {
    const levelHierarchy = {
      NONE: 0,
      READ: 1,
      WRITE: 2,
      ADMIN: 3,
    };

    return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
  }
}

/**
 * Default permissions for each role - RECOMMENDED FORMAT
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionMatrix> = {
  'Super Admin': {
    dashboard: 'ADMIN',
    plant_operations: 'ADMIN',
    inspection: 'ADMIN',
    project_management: 'ADMIN',
  },
  Admin: {
    dashboard: 'ADMIN',
    plant_operations: 'WRITE',
    inspection: 'WRITE',
    project_management: 'WRITE',
  },
  Operator: {
    dashboard: 'READ',
    plant_operations: 'READ',
    inspection: 'NONE',
    project_management: 'NONE',
  },
  Guest: {
    dashboard: 'NONE',
    plant_operations: 'NONE',
    inspection: 'NONE',
    project_management: 'NONE',
  },
};

/**
 * Get default permissions for a specific role
 */
export function getDefaultPermissionsForRole(role: string): PermissionMatrix {
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['Guest'];
}

/**
 * Permission levels hierarchy for reference
 */
export const PERMISSION_LEVELS = {
  NONE: 0, // No access
  READ: 1, // View only
  WRITE: 2, // View + Create/Edit
  ADMIN: 3, // Full access + Delete + Manage others
};

/**
 * Hook to get permission checker for current user
 */
export const usePermissions = (user: User | null) => {
  return new PermissionChecker(user);
};

/**
 * Higher-order component to protect routes based on permissions
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof PermissionMatrix,
  requiredLevel: string = 'READ'
) => {
  return (props: P & { user?: User | null }) => {
    const { user, ...restProps } = props;
    const permissionChecker = usePermissions(user);

    if (!permissionChecker.hasPermission(feature, requiredLevel)) {
      return React.createElement(
        'div',
        {
          className: 'flex items-center justify-center min-h-screen',
        },
        React.createElement(
          'div',
          {
            className: 'text-center',
          },
          [null]
        )
      );
    }

    return React.createElement(WrappedComponent, restProps as P);
  };
};

/**
 * Component to conditionally render content based on permissions
 */
export interface PermissionGuardProps {
  user: User | null;
  feature: keyof PermissionMatrix;
  requiredLevel?: string;
  category?: string;
  unit?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  user,
  feature,
  requiredLevel = 'READ',
  category,
  unit,
  fallback = null,
  children,
}) => {
  const permissionChecker = usePermissions(user);

  let hasAccess = false;

  if (category && unit && feature === 'plant_operations') {
    hasAccess = permissionChecker.hasPlantOperationPermission(category, unit, requiredLevel);
  } else {
    hasAccess = permissionChecker.hasPermission(feature, requiredLevel);
  }

  // Jika tidak memiliki akses, langsung kembalikan fallback
  if (!hasAccess) {
    return React.createElement(React.Fragment, null, fallback);
  }

  // Gunakan safeRender untuk mencegah error saat rendering children
  return safeRender(children);
};

/**
 * Safely render React nodes, preventing "Cannot convert object to primitive value" errors
 * by validating child types before rendering
 */
function safeRender(children: React.ReactNode): React.ReactElement {
  // Deteksi kasus lazy component yang gagal
  try {
    // Safety check: stringify sebagai validasi awal
    // Ini akan segera mendeteksi objek yang tidak dapat dikonversi ke string
    // yang merupakan penyebab error "Cannot convert object to primitive value"
    if (
      children !== null &&
      typeof children === 'object' &&
      !React.isValidElement(children) &&
      !Array.isArray(children)
    ) {
      try {
        // Coba stringify untuk deteksi objek problematik
        // Ini untuk mengecek apakah objek bisa dikonversi ke string tanpa error
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = '' + children;
      } catch (_stringifyError) {
        // Jika gagal stringify, ini menunjukkan objek problematik
        // yang menyebabkan error "Cannot convert object to primitive value"
        return React.createElement(
          'div',
          {
            className: 'p-3 border border-red-400 bg-red-50 rounded',
            'data-testid': 'invalid-object-error',
          },
          'Error: Invalid object structure detected'
        );
      }
    }

    // Jika null atau undefined, render fragment kosong
    if (children == null) {
      return React.createElement(React.Fragment);
    }

    // Jika primitive values (string, number, boolean), render langsung
    if (
      typeof children === 'string' ||
      typeof children === 'number' ||
      typeof children === 'boolean'
    ) {
      return React.createElement(React.Fragment, null, children);
    }

    // Jika valid React element, render langsung
    if (React.isValidElement(children)) {
      return React.createElement(React.Fragment, null, children);
    }

    // Jika array, render setiap item dengan safe rendering
    if (Array.isArray(children)) {
      return React.createElement(
        React.Fragment,
        null,
        children.map((child, index) =>
          React.createElement(React.Fragment, { key: index }, safeRender(child))
        )
      );
    }

    // Untuk object yang tidak dikenali atau tidak valid sebagai ReactNode,
    // render error fallback untuk mencegah crash
    return React.createElement(
      'div',
      { className: 'p-2 text-red-600 bg-red-50 rounded', 'data-testid': 'invalid-component' },
      'Invalid component'
    );
  } catch (_renderError) {
    // Tangkap segala error yang muncul dalam proses rendering
    return React.createElement(
      'div',
      { className: 'p-3 border border-red-500 bg-red-50 rounded', 'data-testid': 'render-error' },
      'Error rendering component'
    );
  }
}
