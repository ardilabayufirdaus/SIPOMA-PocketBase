import React, { useState, useEffect } from 'react';
import { pb } from '../../../utils/pocketbase-simple';
import { translations } from '../../../translations';
import { UserRole, PermissionMatrix } from '../../../types';
import { useRealtimeUsers } from '../../../hooks/useRealtimeUsers';
import {
  getPermissionsSummary,
  formatPermissionsDetailed,
} from '../../../utils/permissionDisplayUtils';

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
      console.error('Error deleting user:', errorMessage);
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
      console.error('Error updating user status:', errorMessage);
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
      console.error('Error bulk updating users:', errorMessage);
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
      console.error('Error bulk deleting users:', errorMessage);
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
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </EnhancedCard>
    );
  }

  if (error) {
    return (
      <EnhancedCard className="p-8 border-red-200 dark:border-red-800">
        <div className="flex flex-col items-center justify-center space-y-4">
          <XCircleIcon className="w-12 h-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Error Loading Users
            </h3>
            <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.user_list || 'Users'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {totalUsers} {totalUsers === 1 ? 'user' : 'users'} total
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <EnhancedInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
            className="w-full sm:w-64"
            size="sm"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
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
          >
            {t.add_user_button || 'Add User'}
          </EnhancedButton>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <EnhancedCard className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(true)}
                icon={<CheckIcon className="w-4 h-4" />}
              >
                Activate
              </EnhancedButton>

              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(false)}
                icon={<XCircleIcon className="w-4 h-4" />}
              >
                Deactivate
              </EnhancedButton>

              <EnhancedButton
                variant="error"
                size="sm"
                onClick={handleBulkDelete}
                icon={<TrashIcon className="w-4 h-4" />}
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
              >
                Cancel
              </EnhancedButton>
            </div>
          </div>
        </EnhancedCard>
      )}

      {/* Table */}
      <EnhancedCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === displayedUsers.length && displayedUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center">
                    {t.username || 'Username'}
                    <SortIcon field="username" />
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center">
                    {t.full_name_label || 'Full Name'}
                    <SortIcon field="full_name" />
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    {t.role_label || 'Role'}
                    <SortIcon field="role" />
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('is_active')}
                >
                  <div className="flex items-center">
                    {t.status || 'Status'}
                    <SortIcon field="is_active" />
                  </div>
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.permissions || 'Permissions'}
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.actions || 'Actions'}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {displayedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar_url}
                            alt={user.username}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.full_name || '-'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <EnhancedBadge variant={getRoleColor(user.role)}>{user.role}</EnhancedBadge>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <EnhancedBadge variant={user.is_active ? 'success' : 'error'}>
                      {user.is_active ? t.active || 'Active' : t.inactive || 'Inactive'}
                    </EnhancedBadge>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white max-w-xs">
                    <div
                      className="truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                      title={getPermissionsSummary(user.permissions)}
                      onClick={() => handleViewPermissions(user)}
                    >
                      {getPermissionsSummary(user.permissions)}
                      <EyeIcon className="inline-block w-4 h-4 ml-1 text-gray-400" />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      icon={<EditIcon className="w-4 h-4" />}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {t.edit || 'Edit'}
                    </EnhancedButton>

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
                      className={
                        user.is_active
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-green-600 hover:text-green-800'
                      }
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </EnhancedButton>

                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      icon={<TrashIcon className="w-4 h-4" />}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t.delete || 'Delete'}
                    </EnhancedButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayedUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {debouncedSearchTerm || roleFilter !== 'all' ? 'No users found' : 'No users'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {debouncedSearchTerm || roleFilter !== 'all'
                ? 'Try adjusting your search or filter settings.'
                : 'Get started by adding a new user.'}
            </p>
            {!(debouncedSearchTerm || roleFilter !== 'all') && (
              <div className="mt-6">
                <EnhancedButton
                  variant="primary"
                  onClick={onAddUser}
                  icon={<PlusIcon className="w-4 h-4" />}
                >
                  {t.add_user_button || 'Add User'}
                </EnhancedButton>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </EnhancedButton>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>

              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-l-md"
                  >
                    Previous
                  </EnhancedButton>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <EnhancedButton
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="rounded-none"
                      >
                        {pageNum}
                      </EnhancedButton>
                    );
                  })}

                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-r-md"
                  >
                    Next
                  </EnhancedButton>
                </nav>
              </div>
            </div>
          </div>
        )}
      </EnhancedCard>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUserPermissions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
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
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {perm.module}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {perm.access}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              perm.level === 'ADMIN'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : perm.level === 'WRITE'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
    </div>
  );
};

export default UserTable;
