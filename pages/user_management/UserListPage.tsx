import React from "react";
import UserTable from "../../components/UserTable";
import { User } from "../../types";
import { usePagination } from "../../hooks/usePagination";

interface UserListPageProps {
  users: User[];
  currentUser: User | null;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  t: any;
}

const UserListPage: React.FC<UserListPageProps> = ({
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

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.user_list || "Users List"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t.user_list_description || "Manage and view all users in the system"}
        </p>
      </div>

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

export default UserListPage;
