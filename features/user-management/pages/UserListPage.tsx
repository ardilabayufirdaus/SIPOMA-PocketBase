import React, { useState, useEffect } from 'react';
import UserTable from '../components/UserTableEnhanced';
import UserForm from '../components/UserFormEnhanced';
import { translations } from '../../../translations';
import { supabase } from '../../../utils/supabaseClient';

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

interface User {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  superAdmins: number;
  recent: number; // Added in last 30 days
}

const UserListPage: React.FC = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    superAdmins: 0,
    recent: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const t = translations.en; // Default to English

  useEffect(() => {
    fetchUserStats();
  }, [refreshKey]);

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch stats in parallel
      const [totalRes, activeRes, inactiveRes, adminRes, superAdminRes, recentRes] =
        await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Admin'),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'Super Admin'),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString()),
        ]);

      if (
        totalRes.error ||
        activeRes.error ||
        inactiveRes.error ||
        adminRes.error ||
        superAdminRes.error ||
        recentRes.error
      ) {
        throw new Error('Failed to fetch stats');
      }

      const stats: UserStats = {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        inactive: inactiveRes.count || 0,
        admins: adminRes.count || 0,
        superAdmins: superAdminRes.count || 0,
        recent: recentRes.count || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

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
    setRefreshKey((prev) => prev + 1);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
    subtitle,
  }: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    subtitle?: string;
  }) => (
    <EnhancedCard className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
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
            {t.user_management || 'User Management'}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {t.user_list_description || 'Manage and view all users in the system'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EnhancedBadge variant="secondary" className="px-3 py-1">
            Last updated: {new Date().toLocaleDateString()}
          </EnhancedBadge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Users" value={stats.total} icon={UserGroupIcon} color="primary" />

        <StatCard
          title="Active Users"
          value={stats.active}
          icon={CheckIcon}
          color="success"
          subtitle={`${
            stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
          }% of total`}
        />

        <StatCard
          title="Inactive Users"
          value={stats.inactive}
          icon={XCircleIcon}
          color="warning"
          subtitle={`${
            stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0
          }% of total`}
        />

        <StatCard
          title="Administrators"
          value={stats.admins}
          icon={ShieldCheckIcon}
          color="warning"
        />

        <StatCard
          title="Super Admins"
          value={stats.superAdmins}
          icon={ShieldCheckIcon}
          color="error"
        />

        <StatCard
          title="Recent Users"
          value={stats.recent}
          icon={UserIcon}
          color="secondary"
          subtitle="Added in last 30 days"
        />
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
    </div>
  );
};

export default UserListPage;
