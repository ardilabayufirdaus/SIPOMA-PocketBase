import React, { useState, useMemo, useEffect } from "react";
import { User } from "../../types";
import { usePagination } from "../../hooks/usePagination";
import { api } from "../../utils/api";

interface UserActivityPageProps {
  users: User[];
  t: any;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
}

const UserActivityPage: React.FC<UserActivityPageProps> = ({ users, t }) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7");

  useEffect(() => {
    const fetchActivityLogs = async () => {
      setLoading(true);
      try {
        const logs = await api.users.getActivityLogs();
        setActivityLogs(logs.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) })));
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivityLogs();
  }, []);

  const filteredActivities = useMemo(() => {
    let filtered = activityLogs;

    if (selectedUser !== "all") {
      filtered = filtered.filter(
        (activity) => activity.user_id === selectedUser
      );
    }

    if (selectedAction !== "all") {
      filtered = filtered.filter(
        (activity) => activity.action === selectedAction
      );
    }

    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((activity) => activity.timestamp >= cutoffDate);

    return filtered;
  }, [activityLogs, selectedUser, selectedAction, dateRange]);

  const {
    paginatedData: paginatedActivities,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination(filteredActivities, 15);

  const onlineUsers = useMemo(() => {
    return users.filter((user) => {
      const recentActivity = activityLogs.find(
        (activity) =>
          activity.user_id === user.id &&
          activity.timestamp > new Date(Date.now() - 10 * 60 * 1000)
      );
      return !!recentActivity;
    });
  }, [users, activityLogs]);

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
        return "🔑";
      case "logout":
        return "🚪";
      case "create_user":
      case "edit_user":
        return "👤";
      case "delete_user":
        return "🗑️";
      case "view_report":
        return "📊";
      case "export_data":
        return "📤";
      default:
        return "📝";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "login":
        return "text-green-600";
      case "logout":
        return "text-blue-600";
      case "delete_user":
        return "text-red-600";
      case "create_user":
      case "edit_user":
        return "text-purple-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.user_activity || "User Activity"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t.user_activity_description ||
            "Monitor user activities and online status"}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t.online_users || "Online Users"} ({onlineUsers.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              {user.full_name}
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t.no_online_users || "No users currently online"}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t.activity_filters || "Activity Filters"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.user || "User"}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="all">{t.all_users || "All Users"}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.action || "Action"}
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="all">{t.all_actions || "All Actions"}</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create_user">Create User</option>
              <option value="edit_user">Edit User</option>
              <option value="delete_user">Delete User</option>
              <option value="view_report">View Report</option>
              <option value="export_data">Export Data</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.date_range || "Date Range"}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="1">{t.last_24_hours || "Last 24 Hours"}</option>
              <option value="7">{t.last_7_days || "Last 7 Days"}</option>
              <option value="30">{t.last_30_days || "Last 30 Days"}</option>
              <option value="90">{t.last_90_days || "Last 90 Days"}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t.activity_log || "Activity Log"} ({filteredActivities.length}{" "}
          {t.entries || "entries"})
        </h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t.user || "User"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t.action || "Action"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t.timestamp || "Timestamp"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t.ip_address || "IP Address"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {activity.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getActionIcon(activity.action)}
                        </span>
                        <span className={getActionColor(activity.action)}>
                          {activity.action
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatTimestamp(activity.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {activity.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Showing {(currentPage - 1) * 15 + 1} to{" "}
              {Math.min(currentPage * 15, filteredActivities.length)} of{" "}
              {filteredActivities.length} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-red-500 text-white rounded">
                {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityPage;