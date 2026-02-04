import React, { useState, useMemo } from 'react';
import { useUsersList, useUserMutations } from '../hooks/useUserUseCases';
import { User, UserFilter } from '../../../src/domain/entities/User';
import {
  EnhancedButton,
  EnhancedInput,
  EnhancedBadge,
  EnhancedCard,
  EnhancedTooltip,
} from '../../../components/ui/EnhancedComponents';
import { UserForm } from '../components/UserForm';
import PlusIcon from '../../../components/icons/PlusIcon';
import PencilIcon from '../../../components/icons/PencilIcon';
import TrashIcon from '../../../components/icons/TrashIcon';
import UserGroupIcon from '../../../components/icons/UserGroupIcon';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import { useTranslation } from '../../../hooks/useTranslation';

const UserListPage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<UserFilter>({
    page: 1,
    perPage: 20,
    role: 'all',
    status: 'all',
  });
  const { data, isLoading } = useUsersList(filter);
  const { deleteUser } = useUserMutations();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0 };
    return {
      total: data.totalItems || 0,
      active: data.items.filter((u) => u.is_active).length,
      inactive: data.items.filter((u) => !u.is_active).length,
    };
  }, [data]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Manager':
        return 'primary';
      case 'Supervisor':
        return 'secondary';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage system users, roles, and administrative access controls.
          </p>
        </div>
        <EnhancedButton
          variant="primary"
          size="lg"
          icon={<PlusIcon className="w-5 h-5" />}
          onClick={handleCreate}
          className="shadow-indigo-500/25"
        >
          Add New User
        </EnhancedButton>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedCard variant="glass" className="border-l-4 border-l-indigo-500 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl">
              <UserGroupIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </EnhancedCard>
        <EnhancedCard variant="glass" className="border-l-4 border-l-emerald-500 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full absolute" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Now</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </EnhancedCard>
        <EnhancedCard variant="glass" className="border-l-4 border-l-amber-500 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl">
              <ShieldCheckIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admin Role</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {data?.items.filter((u) => u.role.includes('Admin')).length || 0}
              </p>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Control Bar (Search & Filter) */}
      <EnhancedCard variant="glass" padding="md" className="backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <EnhancedInput
              placeholder="Search by name, email, or username..."
              value={filter.search || ''}
              onChange={(v) => setFilter({ ...filter, search: v, page: 1 })}
              autoComplete="off"
              className="bg-white/50 dark:bg-slate-800/50"
              icon={
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-48">
              <select
                className="w-full h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                value={filter.role}
                onChange={(e) => setFilter({ ...filter, role: e.target.value, page: 1 })}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: `right 1rem center`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: `1.5em 1.5em`,
                }}
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Operator">Operator</option>
                <option value="Outsourcing">Outsourcing</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Guest">Guest</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value as any, page: 1 })}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: `right 1rem center`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: `1.5em 1.5em`,
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </EnhancedCard>

      {/* Main Table Section */}
      <EnhancedCard variant="glass" padding="none" className="overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  User Details
                </th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  System Role
                </th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  Account Status
                </th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  Permissions
                </th>
                <th className="px-6 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Loading user database...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                data?.items.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-300"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full rounded-[14px] object-cover bg-white"
                              />
                            ) : (
                              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-indigo-600 font-black text-xl">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {user.is_active && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <EnhancedBadge
                        variant={getRoleColor(user.role) as any}
                        className="px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm"
                      >
                        {user.role}
                      </EnhancedBadge>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            Inactive
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {Object.entries(user.permissions || {}).map(([key, level]) => {
                          if (level === 'NONE') return null;
                          return (
                            <EnhancedTooltip
                              key={key}
                              content={`${key.replace(/_/g, ' ')}: ${level}`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  level === 'WRITE'
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <span className="text-[10px] font-black">
                                  {key
                                    .split('_')
                                    .map((word) => word[0])
                                    .join('')
                                    .toUpperCase()}
                                </span>
                              </div>
                            </EnhancedTooltip>
                          );
                        })}
                        {(!user.permissions ||
                          Object.values(user.permissions).every((v) => v === 'NONE')) && (
                          <span className="text-xs text-slate-400 italic">No access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(user.id)}
                          className="p-2 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination Section */}
        {data && data.totalItems > 0 && (
          <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="text-slate-900 dark:text-white font-bold">
                {(data.page - 1) * data.perPage + 1}
              </span>{' '}
              to{' '}
              <span className="text-slate-900 dark:text-white font-bold">
                {Math.min(data.page * data.perPage, data.totalItems)}
              </span>{' '}
              of <span className="text-slate-900 dark:text-white font-bold">{data.totalItems}</span>{' '}
              total users
            </div>
            <div className="flex gap-3">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                disabled={data.page === 1}
                className="bg-white dark:bg-slate-900"
              >
                Previous
              </EnhancedButton>
              <div className="flex items-center gap-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold">
                <span className="text-indigo-600">{data.page}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 dark:text-slate-300">{data.totalPages}</span>
              </div>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                disabled={data.page === data.totalPages}
                className="bg-white dark:bg-slate-900"
              >
                Next
              </EnhancedButton>
            </div>
          </div>
        )}
      </EnhancedCard>

      <UserForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} />
    </div>
  );
};

export default UserListPage;
