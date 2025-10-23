import React, { useState, useEffect } from 'react';
import {
  User,
  PermissionMatrix,
  PermissionLevel,
  PlantOperationsPermissions,
  UserRole,
} from '../../../types';
import { pb } from '../../../utils/pocketbase';
import { supabase } from '../../../utils/pocketbaseClient';
import {
  fetchAllUsers,
  deleteUserPermissions,
  createPermissionModule,
  createPlantOpsPerm,
} from '../helpers/permissionManagerHelper';
import SimplifiedPermissionManager from './SimplifiedPermissionManager';

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
import CogIcon from '../../../components/icons/CogIcon';
import ChartBarIcon from '../../../components/icons/ChartBarIcon';

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
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pendingPermissions, setPendingPermissions] = useState<PermissionMatrix | null>(null);

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
      console.log('Realtime permission change (new):', data);
      // Refresh users when permissions change to get updated permission matrix
      await fetchUsers();
    });

    return () => {
      // Clean up subscription
      pb.collection('user_permissions').unsubscribe();
    };
  }, []);

  const fetchUsers = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      setIsLoading(true);

      // Use helper function to fetch users
      const users = await fetchAllUsers();

      // Process users to build permission matrix
      const transformedUsers = users.map((user) => ({
        ...user,
        permissions: buildPermissionMatrix((user.permissions ?? []) as Array<any>),
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error(`❌ Error fetching users (attempt ${retryCount + 1}):`, err);
      const errorMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message?: string }).message
          : String(err);
      // Check if it's a network error and we haven't exceeded max retries
      if (
        errorMsg?.includes('Failed to fetch') ||
        (errorMsg?.includes('ERR_NETWORK_CHANGED') && retryCount < maxRetries)
      ) {
        setTimeout(() => fetchUsers(retryCount + 1), retryDelay);
        return;
      }
      // If it's not a network error or we've exceeded retries, show the error
      setError(errorMsg || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const buildPermissionMatrix = (
    userPermissions: Array<{ permissions: unknown }>
  ): PermissionMatrix => {
    const matrix: PermissionMatrix = {
      dashboard: 'NONE',
      plant_operations: {},
      inspection: 'NONE',
      project_management: 'NONE',
    };

    userPermissions.forEach((up) => {
      const perm = up.permissions as {
        module_name?: keyof PermissionMatrix;
        permission_level?: PermissionLevel;
        plant_units?: Array<{ category: string; unit: string }>;
      };
      if (perm) {
        const moduleName = perm.module_name as keyof PermissionMatrix;
        const level = perm.permission_level as PermissionLevel;

        if (moduleName === 'plant_operations') {
          if (!matrix.plant_operations || typeof matrix.plant_operations === 'string') {
            matrix.plant_operations = {};
          }
          const plantOps = matrix.plant_operations as PlantOperationsPermissions;

          if (perm.plant_units && Array.isArray(perm.plant_units)) {
            perm.plant_units.forEach((unit) => {
              if (!plantOps[unit.category]) {
                plantOps[unit.category] = {};
              }
              plantOps[unit.category][unit.unit] = level;
            });
          }
        } else {
          matrix[moduleName] = level;
        }
      }
    });

    return matrix;
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setPendingPermissions(JSON.parse(JSON.stringify(user.permissions))); // Initialize with deep copy of current permissions
    setIsPermissionEditorOpen(true);
    setError(''); // Clear any previous errors
    setSuccessMessage(''); // Clear any previous success messages
  };

  const handlePermissionsChange = (newPermissions: PermissionMatrix) => {
    // Only update local state, don't save to database yet
    setPendingPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !pendingPermissions) return;

    try {
      setError('');

      // Import the correct save function from userPermissionManager
      const { saveUserPermissions } = await import('../../../utils/userPermissionManager');

      // Save the pending permissions using the same API as other components
      await saveUserPermissions(selectedUser.id, pendingPermissions, 'system');

      // Permissions will be updated via realtime subscription
      setSuccessMessage('✅ Permissions saved successfully!');
      setError(''); // Clear any previous errors on success
      // Close modal and reset state
      setIsPermissionEditorOpen(false);
      setSelectedUser(null);
      setPendingPermissions(null);
    } catch (err) {
      console.error('💥 Error updating permissions:', err);
      const errorMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message?: string }).message
          : String(err);
      setError(errorMsg || 'Failed to update permissions');
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

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter(
    (u) => u.role === 'Super Admin' || u.role === 'Admin' || u.role === 'Manager'
  ).length;
  const usersWithPermissions = users.filter(
    (u) => getPermissionSummary(u.permissions) !== 'No permissions'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              User Permission Management
            </h1>
            <p className="text-xl text-primary-100">
              Manage user permissions and access control across all modules
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-sm text-primary-100">Total Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold">{activeUsers}</div>
              <div className="text-sm text-primary-100">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{activeUsers}</div>
              <div className="text-primary-100">Active Users</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{adminUsers}</div>
              <div className="text-primary-100">Admin Users</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{usersWithPermissions}</div>
              <div className="text-primary-100">With Permissions</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {Math.round((usersWithPermissions / totalUsers) * 100)}%
              </div>
              <div className="text-primary-100">Permission Rate</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <EnhancedCard className="p-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <EnhancedInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search users by name, username, or email..."
                icon={<UserIcon className="w-4 h-4" />}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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

            <EnhancedButton variant="outline" onClick={() => fetchUsers()} className="px-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </EnhancedButton>

            <EnhancedButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4"
            >
              <CogIcon className="w-4 h-4" />
            </EnhancedButton>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permission Level
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <option value="all">All Levels</option>
                  <option value="admin">Admin Access</option>
                  <option value="write">Write Access</option>
                  <option value="read">Read Access</option>
                  <option value="none">No Access</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Active
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <option value="all">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </EnhancedCard>

      {/* Messages */}
      {(error || successMessage) && (
        <div className="mb-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Success</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      <EnhancedCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Loading users...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please wait while we fetch the latest data
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No users found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No users have been added yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/10 dark:hover:to-primary-800/10 transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.full_name || 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedBadge
                        variant={getRoleBadgeVariant(user.role)}
                        className="font-medium"
                      >
                        {user.role}
                      </EnhancedBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {getPermissionSummary(user.permissions)}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {user.permissions.dashboard !== 'NONE' && (
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full"
                              title="Dashboard"
                            ></div>
                          )}
                          {user.permissions.project_management !== 'NONE' && (
                            <div
                              className="w-2 h-2 bg-purple-500 rounded-full"
                              title="Projects"
                            ></div>
                          )}
                          {Object.keys(user.permissions.plant_operations).length > 0 && (
                            <div
                              className="w-2 h-2 bg-orange-500 rounded-full"
                              title="Plant Operations"
                            ></div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            user.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <EnhancedBadge variant={user.is_active ? 'success' : 'error'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </EnhancedBadge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(user)}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border-blue-200 hover:border-blue-300"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="w-4 h-4" />
                          Edit Permissions
                        </div>
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
        <SimplifiedPermissionManager
          user={selectedUser}
          currentPermissions={pendingPermissions || selectedUser.permissions}
          onPermissionsChange={handlePermissionsChange}
          onSave={handleSavePermissions}
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
