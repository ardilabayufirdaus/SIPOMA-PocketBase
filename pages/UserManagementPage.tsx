import React from "react";
import UserTable from "../components/UserTable";
import { User } from "../types";
import { usePagination } from "../hooks/usePagination";

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
