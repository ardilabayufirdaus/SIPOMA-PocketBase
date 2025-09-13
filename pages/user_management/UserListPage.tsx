import React, { useMemo } from "react";
import UserTable from "../../components/UserTable";
import { User } from "../../types";
import { usePagination } from "../../hooks/usePagination";
import { useUserManagement } from "../../hooks/useUserManagement";
import RegistrationRequests from "../../components/user_management/RegistrationRequests";
import { H1, Body } from "../../components/ui/Typography";

interface UserListPageProps {
  currentUser: User | null;
  onEditUser: (user: User) => void;
  t: any;
}

const UserListPage: React.FC<UserListPageProps> = ({
  currentUser,
  onEditUser,
  t,
}) => {
  // Ambil data user dan aksi dari hooks
  const { users, deleteUser, toggleUserStatus } =
    useUserManagement(currentUser);
  // Pagination logic
  const { paginatedData, currentPage, totalPages, setCurrentPage } =
    usePagination(users, 10);

  // Sanitasi data user untuk table
  const sanitizedUsers = useMemo(
    () =>
      paginatedData.map((user) => ({
        ...user,
        id: String(user.id),
        full_name: String(user.full_name),
        username: String(user.username),
        role: user.role,
        avatar_url: user.avatar_url,
        is_active: !!user.is_active,
        last_active:
          user.last_active &&
          (typeof user.last_active === "string" ||
            user.last_active instanceof Date)
            ? user.last_active
            : null,
      })),
    [paginatedData]
  );

  // UI
  return (
    <div className="p-4 lg:p-6">
      <RegistrationRequests />
      <div className="mb-6">
        <H1 className="mb-2">{t.user_list || "Users List"}</H1>
        <Body color="secondary">
          {t.user_list_description || "Manage and view all users in the system"}
        </Body>
      </div>
      <UserTable
        users={sanitizedUsers}
        currentUser={currentUser}
        onEditUser={onEditUser}
        onDeleteUser={deleteUser}
        onToggleUserStatus={toggleUserStatus}
        t={t}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default UserListPage;
