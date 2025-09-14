import React from "react";
import UserTable from "../components/UserTable";
import { User } from "../types";
import { usePagination } from "../hooks/usePagination";
import { PermissionChecker, usePermissions } from "../utils/permissions";
import { PermissionLevel } from "../types";

interface UserManagementPageProps {
  users: User[];
  currentUser: User | null;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  t: any;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  users,
  currentUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  t,
}) => {
  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination(users, 10);

  // Use permission system instead of hardcoded role check
  const permissionChecker = usePermissions(currentUser);

  // Check if user has permission to access user management
  if (
    !permissionChecker.hasPermission("user_management", PermissionLevel.READ)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            {t.access_denied || "Access Denied"}
          </h3>
          <p className="text-red-600 dark:text-red-300">
            {t.insufficient_permissions ||
              "You don't have sufficient permissions to access this module"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <UserTable
        users={paginatedUsers}
        currentUser={currentUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
        onToggleUserStatus={onToggleUserStatus}
        t={t}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default UserManagementPage;
