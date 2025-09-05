import React, { useState, useMemo } from "react";
import { User, UserRole, PermissionLevel, PlantUnit } from "../../types";
import { getDefaultPermissionsByRole } from "../../hooks/useUsers";

interface UserRolesPageProps {
  users: User[];
  plantUnits: PlantUnit[];
  t: any;
}

const UserRolesPage: React.FC<UserRolesPageProps> = ({
  users,
  plantUnits,
  t,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VIEWER);

  // Group users by role
  const usersByRole = useMemo(() => {
    const grouped: { [key in UserRole]: User[] } = {
      [UserRole.SUPER_ADMIN]: [],
      [UserRole.ADMIN]: [],
      [UserRole.MANAGER]: [],
      [UserRole.SUPERVISOR]: [],
      [UserRole.OPERATOR]: [],
      [UserRole.VIEWER]: [],
    };

    users.forEach((user) => {
      grouped[user.role].push(user);
    });

    return grouped;
  }, [users]);

  // Get default permissions for selected role
  const rolePermissions = useMemo(() => {
    return getDefaultPermissionsByRole(selectedRole, plantUnits);
  }, [selectedRole, plantUnits]);

  const roleColors: { [key in UserRole]: string } = {
    [UserRole.SUPER_ADMIN]:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    [UserRole.ADMIN]:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    [UserRole.MANAGER]:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    [UserRole.SUPERVISOR]:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    [UserRole.OPERATOR]:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    [UserRole.VIEWER]:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  };

  const getPermissionColor = (level: PermissionLevel) => {
    switch (level) {
      case PermissionLevel.ADMIN:
        return "text-red-600 font-semibold";
      case PermissionLevel.WRITE:
        return "text-blue-600 font-medium";
      case PermissionLevel.READ:
        return "text-green-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.user_roles || "User Roles"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t.user_roles_description ||
            "Manage user roles and their permissions"}
        </p>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(usersByRole).map(([role, roleUsers]) => (
          <div
            key={role}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  roleColors[role as UserRole]
                }`}
              >
                {role}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {roleUsers.length}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {t.users_with_role || "users with this role"}
            </p>
            <div className="space-y-1">
              {roleUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="text-xs text-slate-500 dark:text-slate-400"
                >
                  {user.full_name}
                </div>
              ))}
              {roleUsers.length > 3 && (
                <div className="text-xs text-slate-400">
                  +{roleUsers.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Permissions Detail */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t.role_permissions || "Role Permissions"}
        </h2>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.select_role || "Select Role"}
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Permissions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  {t.module || "Module"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  {t.permission_level || "Permission Level"}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  Dashboard
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={getPermissionColor(rolePermissions.dashboard)}
                  >
                    {rolePermissions.dashboard}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  User Management
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={getPermissionColor(
                      rolePermissions.user_management
                    )}
                  >
                    {rolePermissions.user_management}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  Packing Plant
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={getPermissionColor(
                      rolePermissions.packing_plant
                    )}
                  >
                    {rolePermissions.packing_plant}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  Project Management
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={getPermissionColor(
                      rolePermissions.project_management
                    )}
                  >
                    {rolePermissions.project_management}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  System Settings
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={getPermissionColor(
                      rolePermissions.system_settings
                    )}
                  >
                    {rolePermissions.system_settings}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRolesPage;
