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
import { EnhancedCard, EnhancedButton } from '../../../components/ui/EnhancedComponents';

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
    className = '',
  }: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    subtitle?: string;
    isLoading?: boolean;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <EnhancedCard
      className={`p-6 hover:shadow-lg transition-all duration-200 ${isLoading ? 'opacity-75' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="min-h-[36px] flex items-center">
            {isLoading ? (
              <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {typeof value === 'number' ? formatIndonesianNumber(value) : value}
              </p>
            )}
          </div>
          {subtitle && (
            <div className="min-h-[16px]">
              {isLoading ? (
                <div className="animate-pulse h-4 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Render children if provided */}
          {children}
        </div>
        <div
          className={`p-3 rounded-full ${
            color === 'primary'
              ? 'bg-blue-100'
              : color === 'success'
                ? 'bg-green-100'
                : color === 'warning'
                  ? 'bg-yellow-100'
                  : 'bg-orange-100'
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
                    : 'text-blue-600'
            }`}
          />
        </div>
      </div>
    </EnhancedCard>
  );

  return (
    <div className="space-y-8 w-full">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              {t.userManagement || 'User Management'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              {t.user_list_description ||
                'Manage and view all users in the system. Control access, permissions, and user status efficiently.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="font-semibold text-gray-900">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            {isSuperAdmin(currentUser?.role) && (
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setShowDefaultPermissions(true)}
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <CogIcon className="w-5 h-5" />
                Default Permissions
              </EnhancedButton>
            )}
            <EnhancedButton
              variant="secondary"
              size="sm"
              onClick={refreshStats}
              disabled={isLoadingStats}
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowPathRoundedSquareIcon
                className={`w-5 h-5 ${isLoadingStats ? 'animate-spin' : ''}`}
              />
              Refresh Stats
            </EnhancedButton>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title={t.total_users_title}
          value={isLoadingStats ? '...' : stats.total}
          icon={UserGroupIcon}
          color="primary"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        />

        <StatCard
          title={t.active_users_title}
          value={isLoadingStats ? '...' : stats.active}
          icon={CheckIcon}
          color="success"
          subtitle={
            isLoadingStats
              ? 'Loading...'
              : `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`
          }
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        />

        <StatCard
          title={t.inactive_users_title}
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
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        />

        <StatCard
          title={t.administrators_title}
          value={isLoadingStats ? '...' : stats.admins}
          icon={ShieldCheckIcon}
          color="warning"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
        />

        <StatCard
          title={t.super_admins_title}
          value={isLoadingStats ? '...' : stats.superAdmins}
          icon={ShieldCheckIcon}
          color="error"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-red-200"
        />

        <StatCard
          title={t.recent_users_title}
          value={isLoadingStats ? '...' : stats.recent}
          icon={UserIcon}
          color="secondary"
          subtitle={t.recent_users_subtitle}
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
        >
          {!isLoadingStats && stats.recentUsers && stats.recentUsers.length > 0 && (
            <div className="mt-4">
              <div className="flex -space-x-2 overflow-hidden">
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white shadow-sm"
                    title={user.username}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-semibold rounded-full">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {stats.recentUsers.length > 5 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                    +{stats.recentUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </StatCard>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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


