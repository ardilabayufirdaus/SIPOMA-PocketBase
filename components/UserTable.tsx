import React from "react";
import { User } from "../types";
import UserIcon from "./icons/UserIcon";
import EditIcon from "./icons/EditIcon";
import ToggleIcon from "./icons/ToggleIcon";
import TrashIcon from "./icons/TrashIcon";
import { formatDate } from "../utils/formatters";
import Pagination from "./Pagination";

interface UserTableProps {
  users: User[];
  currentUser: User | null;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  t: any;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleColorMap: { [key: string]: string } = {
    "Super Admin":
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    Admin:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
    Manager: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    Supervisor: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400",
    Operator:
      "bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300",
    Viewer:
      "bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300",
  };
  return (
    <span
      className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        roleColorMap[role] ||
        "bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300"
      }`}
    >
      {role}
    </span>
  );
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  t,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Helper function to check if user can be deleted
  const canDeleteUser = (user: User): boolean => {
    // Super admin users cannot be deleted
    if (user.role === "Super Admin") {
      return false;
    }
    // Only super admin can delete other users
    return currentUser?.role === "Super Admin";
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
              >
                {t.name}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
              >
                {t.role}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
              >
                {t.status}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell"
              >
                {t.last_active}
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-11 w-11">
                      {user.avatar_url ? (
                        <img
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-600"
                          src={user.avatar_url}
                          alt={`${user.full_name}'s avatar`}
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-600">
                          <UserIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 dark:text-slate-100 mb-1 hidden md:block">
                    {user.department}
                  </div>
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                        : "bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {user.is_active ? t.active : t.inactive}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  {formatDate(user.last_active)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-150"
                      aria-label={`Edit ${user.full_name}`}
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onToggleUserStatus(user.id)}
                      className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-150"
                      title={
                        user.is_active ? "Deactivate User" : "Activate User"
                      }
                      aria-label={
                        user.is_active
                          ? `Deactivate ${user.full_name}`
                          : `Activate ${user.full_name}`
                      }
                    >
                      <ToggleIcon className="w-5 h-5" />
                    </button>
                    {canDeleteUser(user) && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-150"
                        title={t.delete_user || "Delete User"}
                        aria-label={`${t.delete_user || "Delete"} ${
                          user.full_name
                        }`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default UserTable;
