import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { translations } from '../../../translations';
import { UserRole } from '../../../types';

// Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedBadge,
  EnhancedSpinner,
  cn,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import EditIcon from '../../../components/icons/EditIcon';
import TrashIcon from '../../../components/icons/TrashIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XCircleIcon from '../../../components/icons/XCircleIcon';
import EyeSlashIcon from '../../../components/icons/EyeSlashIcon';
import PlusIcon from '../../../components/icons/PlusIcon';
import ArrowTrendingUpIcon from '../../../components/icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from '../../../components/icons/ArrowTrendingDownIcon';
import ArrowPathRoundedSquareIcon from '../../../components/icons/ArrowPathRoundedSquareIcon';

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
}

interface UserTableProps {
  onEditUser: (user: User) => void;
  onAddUser: () => void;
  language?: 'en' | 'id';
}

type SortField = 'username' | 'full_name' | 'role' | 'is_active' | 'created_at';
type SortDirection = 'asc' | 'desc';

const UserTable: React.FC<UserTableProps> = ({ onEditUser, onAddUser, language = 'en' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const t = translations[language];
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'full_name') {
        aValue = aValue || '';
        bValue = bValue || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      setSelectedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleBulkToggleActive = async (activate: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: activate, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedUsers));

      if (error) throw error;
      await fetchUsers();
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (err: any) {
      console.error('Error bulk updating users:', err);
      setError(err.message || 'Failed to update users');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().in('id', Array.from(selectedUsers));

      if (error) throw error;
      await fetchUsers();
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (err: any) {
      console.error('Error bulk deleting users:', err);
      setError(err.message || 'Failed to delete users');
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
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((user) => user.id)));
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
            onClick={fetchUsers}
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
            {filteredAndSortedUsers.length} {filteredAndSortedUsers.length === 1 ? 'user' : 'users'}{' '}
            total
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
                      selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0
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
                  {t.actions || 'Actions'}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
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
        {paginatedUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm ? 'No users found' : 'No users'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Get started by adding a new user.'}
            </p>
            {!searchTerm && (
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
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedUsers.length}</span> results
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
    </div>
  );
};

export default UserTable;
