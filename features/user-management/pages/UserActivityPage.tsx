import React, { useState, useEffect } from 'react';
import { useUserActivityStore } from '../../../stores/userActivityStore';
import {
  EnhancedCard,
  EnhancedButton,
  EnhancedBadge,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import ChartBarIcon from '../../../components/icons/ChartBarIcon';
import ClockIcon from '../../../components/icons/ClockIcon';
import EyeIcon from '../../../components/icons/EyeIcon';
import XCircleIcon from '../../../components/icons/XCircleIcon';
import {
  CheckCircleIcon,
  FunnelIcon as FilterIcon,
  ArrowDownTrayIcon as DownloadIcon,
  ArrowPathIcon as RefreshIcon,
} from '@heroicons/react/24/outline';

interface UserActivityPageProps {
  users?: unknown[];
  t: Record<string, string>;
}

const UserActivityPage: React.FC<UserActivityPageProps> = ({ t }) => {
  const {
    sessions,
    actions,
    stats,
    loading,
    error,
    filter,
    fetchSessions,
    fetchActions,
    fetchStats,
    setFilter,
    clearError,
  } = useUserActivityStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'actions'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSessions();
    fetchActions();
  }, [filter]);

  const handleExport = () => {
    // Export functionality
    const dataToExport = activeTab === 'sessions' ? sessions : actions;
    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, `user_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const convertToCSV = (data: unknown[]): string => {
    if (!data.length) return '';
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, unknown>)[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      ),
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div className="p-6">
        <EnhancedCard className="p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Loading Activity Data
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <EnhancedButton
            onClick={() => {
              clearError();
              fetchStats();
              fetchSessions();
              fetchActions();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            Retry
          </EnhancedButton>
        </EnhancedCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {t.activity_monitoring || 'User Activity Monitoring'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t.activity_monitor_desc || 'Monitor and analyze user behavior and system usage'}
          </p>
        </div>
        <div className="flex gap-2">
          <EnhancedButton onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filters
          </EnhancedButton>
          <EnhancedButton onClick={handleExport} variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </EnhancedButton>
          <EnhancedButton
            onClick={() => {
              fetchStats();
              fetchSessions();
              fetchActions();
            }}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </EnhancedButton>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <EnhancedCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filter.dateRange.start}
                  onChange={(e) =>
                    setFilter({
                      dateRange: { ...filter.dateRange, start: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                />
                <input
                  type="date"
                  value={filter.dateRange.end}
                  onChange={(e) =>
                    setFilter({
                      dateRange: { ...filter.dateRange, end: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Action Type
              </label>
              <select
                multiple
                value={filter.actionTypes}
                onChange={(e) =>
                  setFilter({
                    actionTypes: Array.from(e.target.selectedOptions, (option) => option.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
              >
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="view">View</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Success Status
              </label>
              <select
                value={filter.success === undefined ? '' : filter.success.toString()}
                onChange={(e) =>
                  setFilter({
                    success: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
              >
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>
          </div>
        </EnhancedCard>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {stats.activeUsers}/{stats.totalUsers}
                </p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {stats.totalSessions}
                </p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Avg Session Duration
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {formatDuration(Math.round(stats.averageSessionDuration))}
                </p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <EyeIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Actions
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {stats.totalActions}
                </p>
              </div>
            </div>
          </EnhancedCard>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: ChartBarIcon },
            { key: 'sessions', label: 'User Sessions', icon: ClockIcon },
            { key: 'actions', label: 'User Actions', icon: EyeIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Top Users */}
          <EnhancedCard className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Most Active Users
            </h3>
            <div className="space-y-3">
              {stats.topUsers.slice(0, 5).map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.action_count} actions
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Last: {formatDate(user.last_active)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </EnhancedCard>

          {/* Top Modules */}
          <EnhancedCard className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Most Used Modules
            </h3>
            <div className="space-y-3">
              {stats.topModules.slice(0, 5).map((module, index) => (
                <div key={module.module} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {module.module.replace('_', ' ')}
                    </p>
                  </div>
                  <EnhancedBadge variant="secondary">{module.action_count} actions</EnhancedBadge>
                </div>
              ))}
            </div>
          </EnhancedCard>
        </div>
      )}

      {activeTab === 'sessions' && (
        <EnhancedCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Recent User Sessions
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Loading sessions...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Session Start
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {sessions.slice(0, 10).map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {session.full_name || session.username}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {session.role}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          {formatDate(session.session_start)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          {formatDuration(session.duration_minutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          <span className="capitalize">{session.device_type}</span>
                          <br />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {session.browser}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EnhancedBadge variant={session.is_active ? 'success' : 'secondary'}>
                            {session.is_active ? 'Active' : 'Ended'}
                          </EnhancedBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </EnhancedCard>
      )}

      {activeTab === 'actions' && (
        <EnhancedCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Recent User Actions
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Loading actions...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {actions.slice(0, 20).map((action) => (
                      <tr key={action.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {action.full_name || action.username}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              @{action.username}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                              {action.action_type}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {action.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 capitalize">
                          {action.module.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                          {formatDate(action.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {action.success ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                            )}
                            <EnhancedBadge variant={action.success ? 'success' : 'error'}>
                              {action.success
                                ? t.activity_success || 'Success'
                                : t.activity_failed || 'Failed'}
                            </EnhancedBadge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </EnhancedCard>
      )}
    </div>
  );
};

export default UserActivityPage;
