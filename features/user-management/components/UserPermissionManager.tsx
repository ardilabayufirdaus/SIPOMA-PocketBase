import React, { useState, useEffect } from 'react';
import { User, PermissionMatrix, PermissionLevel, UserRole } from '../../../types';
import { pb } from '../../../utils/pocketbase';
import { supabase } from '../../../utils/pocketbaseClient';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import { getDefaultPermissionsForRole } from '../../../utils/tonasaPermissions';

// Enhanced Components
import {
  EnhancedCard,
  EnhancedButton,
  EnhancedBadge,
  EnhancedInput,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';

interface UserPermissionManagerProps {
  language?: 'en' | 'id';
}

const UserPermissionManager: React.FC<UserPermissionManagerProps> = ({ language = 'en' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPermissionEditorOpen, setIsPermissionEditorOpen] = useState(false);
  const [pendingPermissions, setPendingPermissions] = useState<PermissionMatrix | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  // Realtime subscription for user permissions
  useEffect(() => {
    // Set up PocketBase realtime subscription
    pb.collection('user_permissions').subscribe('*', async (data) => {
      console.log('Realtime permission change:', data);
      // Refresh users when permissions change to get updated permission matrix
      await fetchUsers();
    });

    return () => {
      // Clean up subscription
      pb.collection('user_permissions').unsubscribe();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching users from Supabase...');

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      interface DbUser {
        id: string;
        username: string;
        email?: string;
        full_name: string | null;
        role: string;
        is_active: boolean;
        last_active?: string;
        created_at: string;
        updated_at: string;
        user_permissions: UserPermissionData[];
      }

      // Transform data to match User interface
      const transformedUsers: User[] = (data as unknown as DbUser[]).map((user: DbUser) => {
        const permissionMatrix = buildPermissionMatrix(user.user_permissions || []);
        console.log(`User ${user.username} permissions:`, user.user_permissions);
        console.log(`Built permission matrix:`, permissionMatrix);

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name || undefined,
          role: user.role as UserRole,
          is_active: user.is_active,
          last_active: user.last_active ? new Date(user.last_active) : undefined,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
          permissions: permissionMatrix,
        };
      });

      console.log('Transformed users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  interface UserPermissionData {
    permissions: {
      module_name: string;
      permission_level: string;
      plant_units?: unknown[];
    };
  }

  interface PlantUnitData {
    category: string;
    unit: string;
    level: string;
  }

  const buildPermissionMatrix = (userPermissions: UserPermissionData[]): PermissionMatrix => {
    console.log('Building permission matrix from:', userPermissions);

    const matrix: PermissionMatrix = {
      dashboard: 'NONE',
      plant_operations: {},
      inspection: 'NONE',
      project_management: 'NONE',
    };

    userPermissions.forEach((up: UserPermissionData) => {
      const perm = up.permissions;
      console.log('Processing user permission:', up);
      console.log('Permission data:', perm);

      if (perm) {
        switch (perm.module_name) {
          case 'dashboard':
            matrix.dashboard = perm.permission_level as PermissionLevel;
            console.log(`Set dashboard to ${perm.permission_level}`);
            break;
          case 'plant_operations':
            // Handle plant operations permissions
            console.log('Processing plant operations permissions');
            if (perm.plant_units && Array.isArray(perm.plant_units)) {
              console.log('Plant units:', perm.plant_units);
              perm.plant_units.forEach((unit: unknown) => {
                console.log('Processing unit:', unit);
                const unitData = unit as PlantUnitData;
                if (!matrix.plant_operations[unitData.category]) {
                  matrix.plant_operations[unitData.category] = {};
                }
                matrix.plant_operations[unitData.category][unitData.unit] =
                  perm.permission_level as PermissionLevel;
                console.log(
                  `Set ${unitData.category}.${unitData.unit} to ${perm.permission_level}`
                );
              });
            } else {
              console.log('No plant_units found or not an array');
            }
            break;
          case 'inspection':
            matrix.inspection = perm.permission_level as PermissionLevel;
            console.log(`Set inspection to ${perm.permission_level}`);
            break;
          case 'project_management':
            matrix.project_management = perm.permission_level as PermissionLevel;
            console.log(`Set project_management to ${perm.permission_level}`);
            break;
          default:
            console.log(`Unknown module: ${perm.module_name}`);
        }
      } else {
        console.log('No permissions data in user permission:', up);
      }
    });

    console.log('Final permission matrix:', matrix);
    return matrix;
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setPendingPermissions(user.permissions); // Initialize with current user's permissions
    setIsPermissionEditorOpen(true);
  };

  const handlePermissionsChange = (newPermissions: PermissionMatrix) => {
    try {
      console.log('🔄 handlePermissionsChange called with:', newPermissions);
      // Just update pending permissions for preview, don't save yet
      setPendingPermissions(newPermissions);
      console.log('🔄 pendingPermissions updated to:', newPermissions);
    } catch (error) {
      console.error('🔄 Error in handlePermissionsChange:', error);
    }
  };

  const handleSavePermissions = async () => {
    console.log('🔥 UserPermissionManager handleSavePermissions called!');
    console.log('Selected user:', selectedUser);
    console.log('Pending permissions:', pendingPermissions);

    if (!selectedUser || !pendingPermissions) {
      console.error('❌ No selected user or pending permissions');
      return;
    }

    console.log('✅ Saving permissions for user:', selectedUser.id);
    console.log('✅ Pending permissions:', pendingPermissions);

    try {
      // Import the correct save function from userPermissionManager
      const { saveUserPermissions } = await import('../../../utils/userPermissionManager');

      // Save the pending permissions using the same API as other components
      await saveUserPermissions(selectedUser.id, pendingPermissions, 'system');

      // Update local state to reflect saved custom permissions
      setHasUnsavedChanges(false);

      // Refresh users to get updated permissions
      console.log('Refreshing users data...');
      await fetchUsers();

      console.log('✅ Permissions saved successfully');
    } catch (error) {
      console.error('❌ Error saving permissions:', error);
      throw error; // Re-throw so PermissionMatrixEditor can handle the error
    }
  };

  const handleResetToDefault = async () => {
    if (!selectedUser) return;

    try {
      const defaultPerms = await getDefaultPermissionsForRole(selectedUser.role as UserRole);
      setPendingPermissions(defaultPerms);
    } catch (error) {
      console.error('Error resetting to default permissions:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Operator':
        return 'primary';
      case 'Guest':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPermissionSummary = (permissions: PermissionMatrix) => {
    const summary = [];
    if (permissions.dashboard !== 'NONE') summary.push('Dashboard');
    if (permissions.project_management !== 'NONE') summary.push('Projects');
    if (Object.keys(permissions.plant_operations).length > 0) summary.push('Plant Ops');

    return summary.length > 0 ? summary.join(', ') : 'No permissions';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Permission Management
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Manage user permissions and access control
          </p>
        </div>
      </div>

      {/* Filters */}
      <EnhancedCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <EnhancedInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search users..."
              icon={<UserIcon className="w-4 h-4" />}
            />
          </div>

          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Operator">Operator</option>
              <option value="Outsourcing">Outsourcing</option>
              <option value="Autonomous">Autonomous</option>
              <option value="Guest">Guest</option>
            </select>
          </div>
        </div>
      </EnhancedCard>

      {/* Users Table */}
      <EnhancedCard className="p-0">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.full_name || 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedBadge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </EnhancedBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {getPermissionSummary(user.permissions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedBadge variant={user.is_active ? 'success' : 'error'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </EnhancedBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(user)}
                        icon={<ShieldCheckIcon className="w-4 h-4" />}
                      >
                        Edit Permissions
                      </EnhancedButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EnhancedCard>

      {/* Permission Editor Modal */}
      {selectedUser && (
        <PermissionMatrixEditor
          userId={selectedUser.id}
          currentPermissions={pendingPermissions || selectedUser.permissions}
          onPermissionsChange={handlePermissionsChange}
          onSave={handleSavePermissions}
          onResetToDefault={handleResetToDefault}
          onClose={() => {
            setIsPermissionEditorOpen(false);
            setSelectedUser(null);
            setPendingPermissions(null);
          }}
          isOpen={isPermissionEditorOpen}
          language={language}
        />
      )}
    </div>
  );
};

export default UserPermissionManager;
