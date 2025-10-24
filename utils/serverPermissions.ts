import { User, PermissionMatrix } from '../types';
import React from 'react';
import { checkUserPermission, fetchUserPermissions } from '../services/permissionService';

/**
 * Utility class for role-based access control (RBAC)
 * Provides methods to check user permissions across the application
 * This version gets permissions from server instead of localStorage
 */
export class PermissionChecker {
  private userId: string | null;
  private userRole: string | null;
  private cache: Map<string, boolean> = new Map();
  private permissionMatrixPromise: Promise<PermissionMatrix> | null = null;

  constructor(user: User | null) {
    this.userId = user ? user.id : null;
    this.userRole = user ? user.role : null;

    // Pre-fetch permissions if user exists
    if (this.userId) {
      this.permissionMatrixPromise = fetchUserPermissions(this.userId);
    }
  }

  /**
   * Check if user has specific permission level for a feature
   */
  async hasPermissionAsync(
    feature: keyof PermissionMatrix,
    requiredLevel: string = 'READ'
  ): Promise<boolean> {
    if (!this.userId) return false;

    const cacheKey = `${feature}-${requiredLevel}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Use server-side permission check
    const result = await checkUserPermission(this.userId, feature, requiredLevel);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Synchronous version for backward compatibility
   * WARNING: This uses cached permission data and may not be accurate if permissions changed on server
   */
  hasPermission(feature: keyof PermissionMatrix, requiredLevel: string = 'READ'): boolean {
    const cacheKey = `${feature}-${requiredLevel}`;

    // Return from cache if exists
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // For synchronous access, start async check and return default false
    if (this.userId) {
      this.hasPermissionAsync(feature, requiredLevel).then((result) => {
        this.cache.set(cacheKey, result);
      });
    }

    // Return default false until async check completes
    // Future calls will use the cached value once resolved
    return false;
  }

  /**
   * Check if user has permission for specific plant operation category and unit
   * Uses server-side permission check
   */
  async hasPlantOperationPermissionAsync(
    category: string,
    unit: string,
    requiredLevel: string = 'READ'
  ): Promise<boolean> {
    if (!this.userId) return false;

    const cacheKey = `plant_operations-${category}-${unit}-${requiredLevel}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Get full permission matrix
    try {
      const permissions = await fetchUserPermissions(this.userId);

      const plantOps = permissions.plant_operations;
      if (!plantOps || !plantOps[category] || !plantOps[category][unit]) {
        this.cache.set(cacheKey, false);
        return false;
      }

      const result = this.comparePermissionLevel(plantOps[category][unit], requiredLevel);
      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Synchronous version for backward compatibility
   */
  hasPlantOperationPermission(
    category: string,
    unit: string,
    requiredLevel: string = 'READ'
  ): boolean {
    const cacheKey = `plant_operations-${category}-${unit}-${requiredLevel}`;

    // Return from cache if exists
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // For synchronous access, start async check and return default false
    if (this.userId) {
      this.hasPlantOperationPermissionAsync(category, unit, requiredLevel).then((result) => {
        this.cache.set(cacheKey, result);
      });
    }

    // Return default false until async check completes
    return false;
  }

  /**
   * Helper method to compare permission levels
   */
  private comparePermissionLevel(userLevel: string, requiredLevel: string): boolean {
    const levels = ['NONE', 'READ', 'WRITE', 'ADMIN'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(requiredLevel);

    return userIndex >= requiredIndex && userIndex > 0;
  }

  /**
   * Check if user can access system settings
   * Settings are accessible to all users except Guest
   */
  canAccessSettings(): boolean {
    return this.userRole !== 'Guest';
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
    if (!this.userId) return 'NONE';

    const levels = ['NONE', 'READ', 'WRITE', 'ADMIN'];

    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      if (this.hasPermission(feature, level)) {
        return level;
      }
    }

    return 'NONE';
  }
}

/**
 * Hook to get permission checker for current user
 */
export const usePermissions = (user: User | null) => {
  return new PermissionChecker(user);
};

// Helper to get component display name for better debugging
function getDisplayName<P>(WrappedComponent: React.ComponentType<P>): string {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

/**
 * Higher-order component to protect routes based on permissions
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof PermissionMatrix,
  requiredLevel: string = 'READ'
) => {
  const WithPermissionComponent = (props: P & { user?: User | null }) => {
    const { user, ...restProps } = props;
    const permissionChecker = usePermissions(user);

    // Start permission check in background
    const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);

    React.useEffect(() => {
      let mounted = true;
      permissionChecker.hasPermissionAsync(feature, requiredLevel).then((result) => {
        if (mounted) {
          setHasAccess(result);
        }
      });

      return () => {
        mounted = false;
      };
    }, [user?.id]);

    // Show loading or restricted access
    if (hasAccess === null) {
      // Loading state
      return React.createElement(
        'div',
        { className: 'flex items-center justify-center min-h-screen' },
        'Loading...'
      );
    }

    if (!hasAccess) {
      // No access
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
          React.createElement(
            'h1',
            {
              className: 'text-2xl font-bold text-gray-700 dark:text-gray-200',
            },
            '403 - Access Denied'
          ),
          React.createElement(
            'p',
            {
              className: 'mt-2 text-gray-600 dark:text-gray-300',
            },
            'You do not have permission to access this resource'
          )
        )
      );
    }

    // Has access, render the component
    return React.createElement(WrappedComponent, restProps as P);
  };

  WithPermissionComponent.displayName = `WithPermission(${getDisplayName(WrappedComponent)})`;
  return WithPermissionComponent;
};
