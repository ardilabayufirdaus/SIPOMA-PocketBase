import React from "react";
import { User } from "./types";
import UserIcon from "./components/icons/UserIcon";
import EditIcon from "./components/icons/EditIcon";
import ToggleIcon from "./components/icons/ToggleIcon";
import { formatDate } from "./utils/formatters";
import {
  ResponsiveTable,
  ResponsiveTableRow,
  ResponsiveTableCell,
} from "./components/ResponsiveTable";

interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onToggleUserStatus: (userId: string) => void;
  t: any;
}

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleColorMap: { [key: string]: string } = {
    "Super Admin": "bg-red-100 text-red-700",
    Admin: "bg-red-50 text-red-600",
    Manager: "bg-gray-100 text-gray-700",
    Supervisor: "bg-gray-100 text-gray-700",
    Operator: "bg-gray-100 text-gray-700",
    Viewer: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
        roleColorMap[role] || "bg-gray-100 text-gray-800"
      }`}
    >
      {role}
    </span>
  );
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  onToggleUserStatus,
  t,
}) => {
  return (
    <ResponsiveTable>
      {/* Desktop Headers - Hidden on mobile */}
      <thead className="bg-gray-50 hidden md:table-header-group">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t.name}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t.role}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t.status}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
            {t.last_active}
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {t.actions}
          </th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <ResponsiveTableRow key={user.id}>
            {/* Name */}
            <ResponsiveTableCell label={t.name} className="font-medium">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                      src={user.avatar_url}
                      alt={`${user.full_name}'s avatar`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-white">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            </ResponsiveTableCell>

            {/* Role */}
            <ResponsiveTableCell label={t.role}>
              <div>
                <div className="text-sm text-gray-900 hidden md:block mb-1">
                  {user.department}
                </div>
                <RoleBadge role={user.role} />
              </div>
            </ResponsiveTableCell>

            {/* Status */}
            <ResponsiveTableCell label={t.status}>
              <span
                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                  user.is_active
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.is_active ? t.active : t.inactive}
              </span>
            </ResponsiveTableCell>

            {/* Last Active - Hidden on small screens */}
            <ResponsiveTableCell
              label={t.last_active}
              className="hidden lg:table-cell text-sm text-gray-500"
              hideOnMobile={true}
            >
              {formatDate(user.last_active)}
            </ResponsiveTableCell>

            {/* Actions */}
            <ResponsiveTableCell label={t.actions} className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => onEditUser(user)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Edit ${user.full_name}`}
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleUserStatus(user.id)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={user.is_active ? "Deactivate User" : "Activate User"}
                  aria-label={
                    user.is_active
                      ? `Deactivate ${user.full_name}`
                      : `Activate ${user.full_name}`
                  }
                >
                  <ToggleIcon className="w-4 h-4" />
                </button>
              </div>
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        ))}
      </tbody>
    </ResponsiveTable>
  );
};

export default UserTable;
