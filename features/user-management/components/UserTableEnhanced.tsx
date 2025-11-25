import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../../../utils/pocketbase-simple';
import { translations } from '../../../translations';
import { UserRole, PermissionMatrix } from '../../../types';
import { useRealtimeUsers } from '../../../hooks/useRealtimeUsers';
import {
  getPermissionsSummary,
  formatPermissionsDetailed,
} from '../../../utils/permissionDisplayUtils';
import PermissionMatrixEditor from './PermissionMatrixEditor';

// Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedBadge,
  EnhancedSpinner,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import EditIcon from '../../../components/icons/EditIcon';
import TrashIcon from '../../../components/icons/TrashIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XCircleIcon from '../../../components/icons/XCircleIcon';
import PlusIcon from '../../../components/icons/PlusIcon';
import ArrowTrendingUpIcon from '../../../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../../components/icons/ArrowTrendingDownIcon';
import ArrowPathRoundedSquareIcon from '../../../components/icons/ArrowPathRoundedSquareIcon';
import EyeIcon from '../../../components/icons/EyeIcon';
import CogIcon from '../../../components/icons/CogIcon';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  last_active?: string;
  permissions: PermissionMatrix;
}

interface UserTableProps {
  onEditUser: (user: User) => void;
  onAddUser: () => void;
  language?: 'en' | 'id';
}

type SortField = 'username' | 'full_name' | 'role' | 'is_active' | 'created';
type SortDirection = 'asc' | 'desc';

const UserTable: React.FC<UserTableProps> = ({ onEditUser, onAddUser, language = 'en' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<User | null>(null);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  const t = translations[language];
  const itemsPerPage = 10;

  // Use the real-time users hook for instant updates
  const {
    users,
    totalUsers,
    isLoading,
    error,
    setError,
    refetch,
    optimisticUpdateUser,
    optimisticDeleteUser,
  } = useRealtimeUsers({
    searchTerm: debouncedSearchTerm,
    roleFilter,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
  });

  // Minimal debounce for search input - allow continuous typing without interruption
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Increased to 300ms to allow smooth typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search or filter changes
  }, [debouncedSearchTerm, roleFilter]);

  // Users are already filtered, sorted, and paginated from server
  const displayedUsers = users;

  // Pagination
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const handleViewPermissions = (user: User) => {
    setSelectedUserPermissions(user);
    setShowPermissionsModal(true);
  };

  const handlePermissionsChange = useCallback(
    (newPermissions: PermissionMatrix) => {
      if (selectedUserForEdit) {
        setSelectedUserForEdit({
          ...selectedUserForEdit,
          permissions: newPermissions,
        });
      }
    },
    [selectedUserForEdit]
  );

  const handleEditPermissions = (user: User) => {
    setSelectedUserForEdit(user);
    setShowEditPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForEdit) return;

    try {
      // Import the correct save function from userPermissionManager
      const { saveUserPermissions } = await import('../../../utils/userPermissionManager');

      // Save the permissions using the same API as other components
      await saveUserPermissions(selectedUserForEdit.id, selectedUserForEdit.permissions, 'system');

      // Close modal and reset state
      setShowEditPermissionsModal(false);
      setSelectedUserForEdit(null);

      // Show success message
      setError('');
      // You could add a success state here if needed
    } catch (err) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message?: string }).message
          : String(err);
      setError(errorMsg || 'Failed to update permissions');
    }
  };

  const handleCloseEditPermissions = () => {
    setShowEditPermissionsModal(false);
    setSelectedUserForEdit(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t.confirm_delete_user || 'Are you sure you want to delete this user?')) {
      return;
    }

    // Optimistic update - immediately remove from UI
    optimisticDeleteUser(userId);
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });

    try {
      await pb.collection('users').delete(userId);
      // Real-time subscription will handle the actual update
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      // Note: The real-time subscription will correct the UI if the delete failed
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    // Optimistic update - immediately update UI
    optimisticUpdateUser(userId, {
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    });

    try {
      await pb.collection('users').update(userId, {
        is_active: !isActive,
        updated_at: new Date().toISOString(),
      });
      // Real-time subscription will handle the actual update
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
      // Note: The real-time subscription will correct the UI if the update failed
    }
  };

  const handleBulkToggleActive = async (activate: boolean) => {
    const selectedUserIds = Array.from(selectedUsers);

    // Optimistic update - immediately update UI for all selected users
    selectedUserIds.forEach((userId) => {
      optimisticUpdateUser(userId, {
        is_active: activate,
        updated_at: new Date().toISOString(),
      });
    });

    try {
      // PocketBase doesn't have a direct bulk update, so we need to update each user individually
      const updatePromises = selectedUserIds.map((userId) =>
        pb.collection('users').update(userId, {
          is_active: activate,
          updated_at: new Date().toISOString(),
        })
      );

      await Promise.all(updatePromises);

      setSelectedUsers(new Set());
      setShowBulkActions(false);
      // Real-time subscription will handle the actual updates
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update users';
      setError(errorMessage);
      // Note: The real-time subscription will correct the UI if the update failed
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) {
      return;
    }

    const selectedUserIds = Array.from(selectedUsers);

    // Optimistic update - immediately remove from UI
    selectedUserIds.forEach((userId) => {
      optimisticDeleteUser(userId);
    });

    try {
      // Delete user permissions first, then users (to avoid foreign key constraints)
      for (const userId of selectedUserIds) {
        // Delete user permissions
        const userPermissions = await pb.collection('user_permissions').getList(1, 50, {
          filter: `user_id = "${userId}"`,
          fields: 'id',
        });

        // Delete permissions individually
        const permissionDeletePromises = userPermissions.items.map(
          (perm) =>
            pb
              .collection('user_permissions')
              .delete(perm.id)
              .catch(() => null) // Ignore errors
        );
        await Promise.all(permissionDeletePromises);

        // Now delete the user
        await pb.collection('users').delete(userId);
      }

      setSelectedUsers(new Set());
      setShowBulkActions(false);
      // Real-time subscription will handle the actual updates
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete users';
      setError(`Bulk delete failed: ${errorMessage}. Some users may have been partially deleted.`);
      // Note: The real-time subscription will correct the UI if the delete failed
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === displayedUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(displayedUsers.map((user) => user.id)));
      setShowBulkActions(true);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'manager':
        return 'primary';
      case 'user':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowTrendingUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ArrowTrendingDownIcon className="w-4 h-4 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <EnhancedCard className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <EnhancedSpinner size="lg" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </EnhancedCard>
    );
  }

  if (error) {
    return (
      <EnhancedCard className="p-8 border-red-200">
        <div className="flex flex-col items-center justify-center space-y-4">
          <XCircleIcon className="w-12 h-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800">Error Loading Users</h3>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
          <EnhancedButton
            variant="outline"
            onClick={refetch}
            icon={<ArrowPathRoundedSquareIcon className="w-4 h-4" />}
          >
            Try Again
          </EnhancedButton>
        </div>
      </EnhancedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t.user_list || 'Users'}
          </h2>
          <p className="text-sm text-gray-600">
            {totalUsers} {totalUsers === 1 ? 'user' : 'users'} total
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <EnhancedInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by username or name..."
              className="w-full sm:w-64 pl-10"
              size="sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] shadow-sm"
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

          <EnhancedButton
            variant="primary"
            onClick={onAddUser}
            icon={<PlusIcon className="w-4 h-4" />}
            size="sm"
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            {t.add_user_button || 'Add User'}
          </EnhancedButton>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <EnhancedCard className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="font-semibold text-blue-800">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                </span>
                <p className="text-sm text-blue-600">Choose an action to apply to selected users</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(true)}
                icon={<CheckIcon className="w-4 h-4" />}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Activate
              </EnhancedButton>

              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(false)}
                icon={<XCircleIcon className="w-4 h-4" />}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Deactivate
              </EnhancedButton>

              <EnhancedButton
                variant="error"
                size="sm"
                onClick={handleBulkDelete}
                icon={<TrashIcon className="w-4 h-4" />}
                className="shadow-sm"
              >
                Delete
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUsers(new Set());
                  setShowBulkActions(false);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </EnhancedButton>
            </div>
          </div>
        </EnhancedCard>
      )}

      {/* Table */}
      <EnhancedCard className="overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === displayedUsers.length && displayedUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                  />
                </th>

                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-2">
                    {t.username || 'Username'}
                    <SortIcon field="username" />
                  </div>
                </th>

                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center gap-2">
                    {t.full_name_label || 'Full Name'}
                    <SortIcon field="full_name" />
                  </div>
                </th>

                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-2">
                    {t.role_label || 'Role'}
                    <SortIcon field="role" />
                  </div>
                </th>

                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('is_active')}
                >
                  <div className="flex items-center gap-2">
                    {t.status || 'Status'}
                    <SortIcon field="is_active" />
                  </div>
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t.permissions || 'Permissions'}
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t.actions || 'Actions'}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {displayedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200"
                            src={user.avatar_url}
                            alt={user.username}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-200">
                            <span className="text-white font-semibold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {user.full_name || <span className="text-gray-400 italic">Not set</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <EnhancedBadge variant={getRoleColor(user.role)} className="font-medium">
                      {user.role}
                    </EnhancedBadge>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                      ></div>
                      <EnhancedBadge
                        variant={user.is_active ? 'success' : 'error'}
                        className="font-medium"
                      >
                        {user.is_active ? t.active || 'Active' : t.inactive || 'Inactive'}
                      </EnhancedBadge>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                    <div
                      className="group flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      title={getPermissionsSummary(user.permissions)}
                      onClick={() => handleViewPermissions(user)}
                    >
                      <span className="truncate text-sm">
                        {getPermissionsSummary(user.permissions)}
                      </span>
                      <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                        icon={<EditIcon className="w-4 h-4" />}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1"
                      />

                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPermissions(user)}
                        icon={<CogIcon className="w-4 h-4" />}
                        className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1"
                      />

                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        icon={
                          user.is_active ? (
                            <XCircleIcon className="w-4 h-4" />
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )
                        }
                        className={`px-2 py-1 ${
                          user.is_active
                            ? 'text-blue-600 hover:text-orange-800 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                      />

                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        icon={<TrashIcon className="w-4 h-4" />}
                        className="text-blue-600 hover:text-orange-800 hover:bg-red-50 px-2 py-1"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayedUsers.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <UserIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {debouncedSearchTerm || roleFilter !== 'all' ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-8 max-w-sm mx-auto">
              {debouncedSearchTerm || roleFilter !== 'all'
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : 'Get started by adding your first user to the system.'}
            </p>
            {!(debouncedSearchTerm || roleFilter !== 'all') && (
              <div className="flex justify-center">
                <EnhancedButton
                  variant="primary"
                  onClick={onAddUser}
                  icon={<PlusIcon className="w-5 h-5" />}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  {t.add_user_button || 'Add User'}
                </EnhancedButton>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 font-medium">
                Showing{' '}
                <span className="text-gray-900 font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="text-gray-900 font-semibold">
                  {Math.min(currentPage * itemsPerPage, totalUsers)}
                </span>{' '}
                of <span className="text-gray-900 font-semibold">{totalUsers}</span> users
              </div>

              <div className="flex items-center gap-2">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="shadow-sm hover:shadow-md transition-shadow"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  }
                />

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <EnhancedButton
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[40px] shadow-sm hover:shadow-md transition-all ${
                          pageNum === currentPage ? 'shadow-md' : ''
                        }`}
                      >
                        {pageNum}
                      </EnhancedButton>
                    );
                  })}
                </div>

                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="shadow-sm hover:shadow-md transition-shadow"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </EnhancedCard>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUserPermissions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t.permissions || 'Permissions'} - {selectedUserPermissions.username}
                </h3>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatPermissionsDetailed(selectedUserPermissions.permissions).map(
                    (perm, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900">{perm.module}</div>
                        <div className="text-sm text-gray-600">{perm.access}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              perm.level === 'ADMIN'
                                ? 'bg-orange-100 text-orange-800'
                                : perm.level === 'WRITE'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {perm.level}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <EnhancedButton variant="outline" onClick={() => setShowPermissionsModal(false)}>
                  {t.close || 'Close'}
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditPermissionsModal && selectedUserForEdit && (
        <PermissionMatrixEditor
          userId={selectedUserForEdit.id}
          currentPermissions={selectedUserForEdit.permissions}
          onPermissionsChange={handlePermissionsChange}
          onSave={handleSavePermissions}
          onClose={handleCloseEditPermissions}
          isOpen={showEditPermissionsModal}
          language={language}
        />
      )}
    </div>
  );
};

export default UserTable;


