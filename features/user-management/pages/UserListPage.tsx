import React, { useState } from 'react';
import UserTable from '../components/UserTableEnhanced';
import UserForm from '../components/UserFormEnhanced';
import DefaultPermissionsModal from '../components/DefaultPermissionsModal';
import { translations } from '../../../translations';
import { formatIndonesianNumber } from '../../../utils/formatUtils';
import { useUserStats } from '../../../hooks/useUserStats';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { isSuperAdmin } from '../../../utils/roleHelpers';

// Enhanced Components
import {
  EnhancedCard,
  EnhancedBadge,
  EnhancedButton,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import UserGroupIcon from '../../../components/icons/UserGroupIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XCircleIcon from '../../../components/icons/XCircleIcon';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import ArrowPathRoundedSquareIcon from '../../../components/icons/ArrowPathRoundedSquareIcon';
import CogIcon from '../../../components/icons/CogIcon';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserListPage: React.FC = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDefaultPermissions, setShowDefaultPermissions] = useState(false);

  // Use the new hook for user stats
  const { stats, isLoading: isLoadingStats, refreshStats } = useUserStats();
  const { currentUser } = useCurrentUser();

  const t = translations.en; // Default to English

  // Refresh stats only when refreshKey changes
  // Using refreshKey pattern to trigger refreshes only when needed
  React.useEffect(() => {
    if (refreshKey > 0) {
      // Skip initial render, let the hook's internal useEffect handle it
      refreshStats();
    }
  }, [refreshKey]); // Remove refreshStats from dependencies to prevent infinite loops

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    // Increment refresh key to trigger fetch of user stats and table data
    setRefreshKey((prev) => prev + 1);
    // Note: refreshStats() is called automatically by the useEffect when refreshKey changes
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
    subtitle,
    isLoading = false,
    children,
  }: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    subtitle?: string;
    isLoading?: boolean;
    children?: React.ReactNode;
  }) => (
    <EnhancedCard
      className={`p-6 hover:shadow-lg transition-shadow duration-200 ${isLoading ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="min-h-[36px] flex items-center">
            {isLoading ? (
              <div className="animate-pulse h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {typeof value === 'number' ? formatIndonesianNumber(value) : value}
              </p>
            )}
          </div>
          {subtitle && (
            <div className="min-h-[16px]">
              {isLoading ? (
                <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Render children if provided */}
          {children}
        </div>
        <div
          className={`p-3 rounded-full ${
            color === 'primary'
              ? 'bg-blue-100 dark:bg-blue-900/20'
              : color === 'success'
                ? 'bg-green-100 dark:bg-green-900/20'
                : color === 'warning'
                  ? 'bg-yellow-100 dark:bg-yellow-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              color === 'primary'
                ? 'text-blue-600'
                : color === 'success'
                  ? 'text-green-600'
                  : color === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
            }`}
          />
        </div>
      </div>
    </EnhancedCard>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.userManagement || 'User Management'}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {t.user_list_description || 'Manage and view all users in the system'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EnhancedBadge variant="secondary" className="px-3 py-1">
            Last updated: {new Date().toLocaleDateString()}
          </EnhancedBadge>
          {isSuperAdmin(currentUser?.role) && (
            <>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setShowDefaultPermissions(true)}
                className="flex items-center gap-2"
              >
                <CogIcon className="w-4 h-4" />
                Default Permissions
              </EnhancedButton>
            </>
          )}
          <EnhancedButton
            variant="secondary"
            size="sm"
            onClick={refreshStats}
            disabled={isLoadingStats}
            className="flex items-center gap-2"
          >
            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
            Refresh Stats
          </EnhancedButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-6">
        <StatCard
          title="Total Users"
          value={isLoadingStats ? '...' : stats.total}
          icon={UserGroupIcon}
          color="primary"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Active Users"
          value={isLoadingStats ? '...' : stats.active}
          icon={CheckIcon}
          color="success"
          subtitle={
            isLoadingStats
              ? 'Loading...'
              : `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`
          }
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Inactive Users"
          value={isLoadingStats ? '...' : stats.inactive}
          icon={XCircleIcon}
          color="warning"
          subtitle={
            isLoadingStats
              ? 'Loading...'
              : `${
                  stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0
                }% of total`
          }
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Administrators"
          value={isLoadingStats ? '...' : stats.admins}
          icon={ShieldCheckIcon}
          color="warning"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Super Admins"
          value={isLoadingStats ? '...' : stats.superAdmins}
          icon={ShieldCheckIcon}
          color="error"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Recent Users"
          value={isLoadingStats ? '...' : stats.recent}
          icon={UserIcon}
          color="secondary"
          subtitle="Added in last 30 days"
          isLoading={isLoadingStats}
        >
          {!isLoadingStats && stats.recentUsers && stats.recentUsers.length > 0 && (
            <div className="mt-4">
              <div className="flex -space-x-2 overflow-hidden">
                {stats.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                    title={user.username}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </StatCard>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <UserTable key={refreshKey} onEditUser={handleEditUser} onAddUser={handleAddUser} />
      </div>

      {/* User Form Modal */}
      <UserForm
        user={editingUser}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        isOpen={showUserForm}
      />

      {/* Default Permissions Modal */}
      <DefaultPermissionsModal
        isOpen={showDefaultPermissions}
        onClose={() => setShowDefaultPermissions(false)}
        onSuccess={() => {
          // Refresh stats after permissions update
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
};

export default UserListPage;
