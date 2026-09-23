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
import RealtimeIndicator from '../../../components/ui/RealtimeIndicator';

const UserListPage: React.FC = () => {
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
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Access Control
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  User Management
                </span>
                <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                User Management
              </h1>
              <p className="text-xs text-slate-300 font-normal mt-0.5">
                Kelola kredensial pengguna, peran otentikasi sistem, departemen, dan kebijakan hak
                akses.
              </p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-xs transition-all min-h-[36px] shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Stats Section - Compact & Precision */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <UserGroupIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Now
            </p>
            <p className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Admin Role
            </p>
            <p className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              {data?.items.filter((u) => u.role.includes('Admin')).length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) - Compact & Precision */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
            className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value, page: 1 })}
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

          <select
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={filter.status}
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value as UserFilter['status'], page: 1 })
            }
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Table Section - COP Analysis Presisi Standard */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50 shrink-0">
              <UserGroupIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Daftar Akun Pengguna
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Menampilkan {data?.items.length || 0} dari {data?.totalItems || 0} total pengguna
                terdaftar
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700 dark:bg-slate-800 text-white">
              <tr>
                <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  User Details
                </th>
                <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  System Role
                </th>
                <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Account Status
                </th>
                <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Permissions
                </th>
                <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-500 font-medium">Memuat data pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                data?.items.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-xs font-mono font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {user.is_active && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-sans font-bold text-xs text-slate-900 dark:text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs font-mono">
                      <EnhancedBadge
                        variant={
                          getRoleColor(user.role) as
                            | 'primary'
                            | 'secondary'
                            | 'success'
                            | 'warning'
                            | 'error'
                            | 'neutral'
                        }
                        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md"
                      >
                        {user.role}
                      </EnhancedBadge>
                    </td>
                    <td className="py-2 px-3 text-xs font-mono">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs font-mono">
                      <div className="flex gap-1 flex-wrap items-center">
                        {(() => {
                          const moduleCodes: Record<string, { code: string; label: string }> = {
                            dashboard: { code: 'DSH', label: 'Analytic Dashboard' },
                            cm_plant_operations: { code: 'CM', label: 'CM Plant Operations' },
                            rkc_plant_operations: { code: 'RKC', label: 'RKC Operations' },
                            derivative_plant_operations: {
                              code: 'DER',
                              label: 'Derivative Operations',
                            },
                            project_management: { code: 'PRJ', label: 'Capital Project Mgmt' },
                            contract_sla_management: { code: 'SLA', label: 'Contract & SLA' },
                            database: { code: 'DAT', label: 'Database Hub' },
                            inspection: { code: 'INS', label: 'Maintenance Inspection' },
                          };

                          const entries = Object.entries(user.permissions || {}).filter(
                            ([, level]) => level && level !== 'NONE'
                          );

                          if (entries.length === 0) {
                            return (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                No access
                              </span>
                            );
                          }

                          return entries.map(([key, level]) => {
                            const mod = moduleCodes[key] || {
                              code: key.slice(0, 3).toUpperCase(),
                              label: key.replace(/_/g, ' '),
                            };
                            const isWrite = level === 'WRITE';

                            return (
                              <EnhancedTooltip
                                key={key}
                                content={`${mod.label}: ${level} (${isWrite ? 'Full Access' : 'View Only'})`}
                              >
                                <div
                                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono inline-flex items-center gap-0.5 border shadow-xs ${
                                    isWrite
                                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                      : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                                  }`}
                                >
                                  <span>{mod.code}</span>
                                  <span
                                    className={`text-[8px] font-black ${
                                      isWrite
                                        ? 'text-emerald-800 dark:text-emerald-200'
                                        : 'text-indigo-800 dark:text-indigo-200'
                                    }`}
                                  >
                                    :{isWrite ? 'W' : 'R'}
                                  </span>
                                </div>
                              </EnhancedTooltip>
                            );
                          });
                        })()}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs font-mono text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors"
                          title="Edit User"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Section */}
        {data && data.totalItems > 0 && (
          <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-850/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Showing{' '}
              <span className="text-slate-900 dark:text-white font-bold">
                {(data.page - 1) * data.perPage + 1}
              </span>{' '}
              to{' '}
              <span className="text-slate-900 dark:text-white font-bold">
                {Math.min(data.page * data.perPage, data.totalItems)}
              </span>{' '}
              of <span className="text-slate-900 dark:text-white font-bold">{data.totalItems}</span>{' '}
              users
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                disabled={data.page === 1}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold">
                <span className="text-indigo-600 dark:text-indigo-400">{data.page}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 dark:text-slate-300">{data.totalPages}</span>
              </div>
              <button
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                disabled={data.page === data.totalPages}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <UserForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} />
    </div>
  );
};

export default UserListPage;
