import React, { useState, useEffect } from 'react';
import { User, PermissionMatrix, UserRole } from '../../../types';
import { pb } from '../../../utils/pocketbase';
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  // Realtime subscription for user permissions
  useEffect(() => {
    let unsubscribePermissions: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    // Set up PocketBase realtime subscription for user_permissions collection
    pb.collection('user_permissions')
      .subscribe('*', async () => {
        // Refresh users when permissions change to get updated permission matrix
        await fetchUsers();
      })
      .then((unsub) => {
        unsubscribePermissions = unsub;
      });

    // Also subscribe to users collection for permission field updates
    pb.collection('users')
      .subscribe('*', async () => {
        // Refresh users when user data changes
        await fetchUsers();
      })
      .then((unsub) => {
        unsubscribeUsers = unsub;
      });

    return () => {
      // Clean up subscriptions
      if (unsubscribePermissions) unsubscribePermissions();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 fetchUsers called');

      // Get users from PocketBase
      const usersResult = await pb.collection('users').getFullList({
        sort: '-created',
        fields: 'id,username,name,role,is_active,created,updated,avatar,last_active,permissions',
      });

      console.log('🔄 Raw users from PocketBase:', usersResult.length);

      // Transform data to match User interface
      const transformedUsers: User[] = usersResult.map((user: Record<string, any>) => {
        console.log(`🔄 User ${user.username} permissions:`, user.permissions);
        return {
          id: user.id,
          username: user.username,
          email: user.username, // PocketBase uses username as email equivalent
          full_name: user.name || undefined,
          role: user.role as UserRole,
          is_active: user.is_active,
          last_active: user.last_active ? new Date(user.last_active) : undefined,
          created_at: new Date(user.created),
          updated_at: new Date(user.updated),
          permissions: user.permissions || {},
        };
      });

      console.log('🔄 Setting users state:', transformedUsers.length);
      setUsers(transformedUsers);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
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
      // Just update pending permissions for preview, don't save yet
      setPendingPermissions(newPermissions);
    } catch {
      // Handle error silently
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !pendingPermissions) {
      // Handle error silently
      return;
    }

    console.log('💾 handleSavePermissions called');
    // Import the correct save function from userPermissionManager
    const { saveUserPermissions } = await import('../../../utils/userPermissionManager');

    // Save the pending permissions using the same API as other components
    await saveUserPermissions(selectedUser.id, pendingPermissions, 'system');
    console.log('💾 Permissions saved successfully, calling fetchUsers');

    // Refresh users to get updated permissions
    await fetchUsers();
    console.log('💾 fetchUsers completed');
  };

  const handleResetToDefault = async () => {
    if (!selectedUser) return;

    try {
      const defaultPerms = await getDefaultPermissionsForRole(selectedUser.role as UserRole);
      setPendingPermissions(defaultPerms);
    } catch {
      // Handle error silently
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
          <h1 className="text-3xl font-bold text-gray-900">User Permission Management</h1>
          <p className="mt-2 text-lg text-gray-600">Manage user permissions and access control</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-600">{user.full_name || 'No name'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EnhancedBadge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </EnhancedBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
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
