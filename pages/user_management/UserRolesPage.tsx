import { useState, useMemo, useEffect, FC } from "react";
import {
  User,
  UserRole,
  PermissionLevel,
  PlantUnit,
  PermissionMatrix,
} from "../../types";
import { getDefaultPermissionsByRole } from "../../hooks/useUserManagement";
import { api } from "../../utils/api";
import PermissionsEditor from "../../components/user_management/PermissionsEditor";
import { H1, Body } from "../../components/ui/Typography";

interface UserRolesPageProps {
  users: User[];
  plantUnits: PlantUnit[];
  t: any;
}

const UserRolesPage: FC<UserRolesPageProps> = ({ users, plantUnits, t }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VIEWER);
  const [permissions, setPermissions] = useState<PermissionMatrix>(
    getDefaultPermissionsByRole(selectedRole, plantUnits)
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPermissions(getDefaultPermissionsByRole(selectedRole, plantUnits));
  }, [selectedRole, plantUnits]);

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

  const handlePermissionChange = (newPermissions: PermissionMatrix) => {
    setPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      // This is a placeholder for the actual API call to save the permissions for the role.
      // You would need to implement this API endpoint in your backend.
      // await api.users.updateRolePermissions(selectedRole, permissions);
      console.log("Saving permissions for role:", selectedRole, permissions);
      alert("Permissions saved successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions.");
    } finally {
      setIsSaving(false);
    }
  };

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
      "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <H1 className="mb-2">{t.user_roles || "User Roles"}</H1>
        <Body color="secondary">
          {t.user_roles_description ||
            "Manage user roles and their permissions"}
        </Body>
      </div>

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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t.role_permissions || "Role Permissions"}
        </h2>

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

        <PermissionsEditor
          permissions={permissions}
          plantUnits={plantUnits}
          onPermissionChange={handlePermissionChange}
          t={t}
        />

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSavePermissions}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-semibold text-white border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRolesPage;
