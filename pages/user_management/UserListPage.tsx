import React from "react";
import UserTable from "../../components/UserTable";
import { User } from "../../types";
import { usePagination } from "../../hooks/usePagination";
import { useUserManagement } from "../../hooks/useUserManagement";
import RegistrationRequests from "../../components/user_management/RegistrationRequests";

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
  const { users, loading, deleteUser, toggleUserStatus } = useUserManagement();
  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination(users, 10);

  const sanitizedUsers = paginatedUsers.map((user) => ({
    ...user,
    id: String(user.id),
    full_name: String(user.full_name),
    email: String(user.email),
    role: user.role,
    avatar_url: user.avatar_url,
    is_active: !!user.is_active,
  }));

  return (
    <div className="p-4 lg:p-6">
      <RegistrationRequests />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.user_list || "Users List"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t.user_list_description || "Manage and view all users in the system"}
        </p>
      </div>

      <UserTable
        users={sanitizedUsers}
        currentUser={currentUser}
        onEditUser={onEditUser}
        onDeleteUser={deleteUser}
        onToggleUserStatus={toggleUserStatus}
        t={{
          name: t.name,
          role: t.role,
          status: t.status,
          last_active: t.last_active,
          actions: t.actions,
          active: t.active,
          inactive: t.inactive,
          delete_user: t.delete_user,
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default UserListPage;