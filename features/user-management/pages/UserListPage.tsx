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
      className={`p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ${isLoading ? 'opacity-75' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</p>
          <div className="min-h-[36px] flex items-center">
            {isLoading ? (
              <div className="animate-pulse h-8 w-16 bg-slate-200 rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {typeof value === 'number' ? formatIndonesianNumber(value) : value}
              </p>
            )}
          </div>
          {subtitle && (
            <div className="min-h-[16px]">
              {isLoading ? (
                <div className="animate-pulse h-4 w-24 bg-slate-200 rounded mt-1"></div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Render children if provided */}
          {children}
        </div>
        <div
          className={`p-3 rounded-xl ${
            color === 'primary'
              ? 'bg-gradient-to-br from-indigo-100 to-indigo-200/80'
              : color === 'success'
                ? 'bg-gradient-to-br from-emerald-100 to-emerald-200/80'
                : color === 'warning'
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200/80'
                  : color === 'secondary'
                    ? 'bg-gradient-to-br from-violet-100 to-violet-200/80'
                    : color === 'error'
                      ? 'bg-gradient-to-br from-rose-100 to-rose-200/80'
                      : 'bg-gradient-to-br from-slate-100 to-slate-200/80'
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              color === 'primary'
                ? 'text-indigo-600'
                : color === 'success'
                  ? 'text-emerald-600'
                  : color === 'warning'
                    ? 'text-amber-600'
                    : color === 'secondary'
                      ? 'text-violet-600'
                      : color === 'error'
                        ? 'text-rose-600'
                        : 'text-slate-600'
            }`}
          />
        </div>
      </div>
    </EnhancedCard>
  );

  return (
    <div className="space-y-8 w-full">
      {/* Page Header - Indigo/Slate Gradient Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6 lg:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <UserGroupIcon className="w-7 h-7 text-indigo-200" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {t.userManagement || 'User Management'}
              </h1>
              <p className="text-sm text-indigo-200/80 font-medium max-w-2xl">
                {t.user_list_description ||
                  'Manage and view all users in the system. Control access, permissions, and user status efficiently.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <div className="text-xs text-indigo-200/70">Last updated</div>
              <div className="font-semibold text-white text-sm">
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
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <CogIcon className="w-5 h-5" />
                Default Permissions
              </EnhancedButton>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title={t.total_users_title}
          value={isLoadingStats ? '...' : stats.total}
          icon={UserGroupIcon}
          color="primary"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200/80"
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
          className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 border border-emerald-200/60"
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
          className="bg-gradient-to-br from-amber-50/80 to-amber-100/50 border border-amber-200/60"
        />

        <StatCard
          title={t.administrators_title}
          value={isLoadingStats ? '...' : stats.admins}
          icon={ShieldCheckIcon}
          color="primary"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 border border-indigo-200/60"
        />

        <StatCard
          title={t.super_admins_title}
          value={isLoadingStats ? '...' : stats.superAdmins}
          icon={ShieldCheckIcon}
          color="error"
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-violet-50/80 to-violet-100/50 border border-violet-200/60"
        />

        <StatCard
          title={t.recent_users_title}
          value={isLoadingStats ? '...' : stats.recent}
          icon={UserIcon}
          color="secondary"
          subtitle={t.recent_users_subtitle}
          isLoading={isLoadingStats}
          className="bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80"
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
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold rounded-full">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {stats.recentUsers.length > 5 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
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
