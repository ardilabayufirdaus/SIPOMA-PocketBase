import { User, PermissionMatrix, PlantOperationsPermissions } from '../types';
import React from 'react';

/**
 * Utility class for role-based access control (RBAC)
 * Provides methods to check user permissions across the application
 */
export class PermissionChecker {
  private user: User | null;

  constructor(user: User | null) {
    this.user = user;
  }

  /**
   * Check if user has specific permission level for a feature
   */
  hasPermission(feature: keyof PermissionMatrix, requiredLevel: string = 'READ'): boolean {
    if (!this.user) return false;

    // Super Admin has all permissions
    if (this.user.role === 'Super Admin') return true;

    // Check if permissions object exists
    if (!this.user.permissions) return false;

    const userPermission = this.user.permissions[feature];

    // Handle different permission types
    if (typeof userPermission === 'string') {
      return this.comparePermissionLevel(userPermission, requiredLevel);
    }

    // Handle plant operations permissions (object type)
    if (feature === 'plant_operations' && typeof userPermission === 'object') {
      // For plant operations, check if user has any access to any category/unit
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
   */
  canAccessSettings(): boolean {
    return this.hasPermission('system_settings', 'READ');
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
   * Check if user can access packing plant features
   */
  canAccessPackingPlant(): boolean {
    return this.hasPermission('packing_plant', 'READ');
  }

  /**
   * Check if user can access project management
   */
  canAccessProjectManagement(): boolean {
    return this.hasPermission('project_management', 'READ');
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
          [
            React.createElement(
              'h2',
              {
                key: 'title',
                className: 'text-2xl font-bold text-gray-900 mb-4',
              },
              'Access Denied'
            ),
            React.createElement(
              'p',
              {
                key: 'message',
                className: 'text-gray-600',
              },
              "You don't have permission to access this page."
            ),
          ]
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

  return hasAccess
    ? React.createElement(React.Fragment, null, children)
    : React.createElement(React.Fragment, null, fallback);
};
