import React, { useState } from 'react';
import { useUsersList } from '../hooks/useUserUseCases';
import { User, UserFilter } from '../../../src/domain/entities/User';
import {
  EnhancedButton,
  EnhancedInput,
  EnhancedBadge,
} from '../../../components/ui/EnhancedComponents';
import { UserForm } from '../components/UserForm';
import PlusIcon from '../../../components/icons/PlusIcon';
import PencilIcon from '../../../components/icons/PencilIcon';
import TrashIcon from '../../../components/icons/TrashIcon';

const UserListPage: React.FC = () => {
  const [filter, setFilter] = useState<UserFilter>({
    page: 1,
    perPage: 20,
    role: 'all',
    status: 'all',
  });
  const { data, isLoading } = useUsersList(filter);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Manage system users and their access levels.</p>
        </div>
        <EnhancedButton
          variant="primary"
          icon={<PlusIcon className="w-5 h-5" />}
          onClick={handleCreate}
        >
          Add New User
        </EnhancedButton>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <EnhancedInput
            placeholder="Search users..."
            value={filter.search || ''}
            onChange={(v) => setFilter({ ...filter, search: v })}
            autoComplete="off"
          />
        </div>
        <select
          className="h-[42px] px-3 border border-slate-300 rounded-lg text-sm bg-slate-50"
          value={filter.role}
          onChange={(e) => setFilter({ ...filter, role: e.target.value })}
        >
          <option value="all">All Roles</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Operator">Operator</option>
          <option value="Outsourcing">Outsourcing</option>
          <option value="Autonomous">Autonomous</option>
          <option value="Guest">Guest</option>
        </select>
        <select
          className="h-[42px] px-3 border border-slate-300 rounded-lg text-sm bg-slate-50"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : (
                data?.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <EnhancedBadge variant="secondary">{user.role}</EnhancedBadge>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <EnhancedBadge variant="success">Active</EnhancedBadge>
                      ) : (
                        <EnhancedBadge variant="error">Inactive</EnhancedBadge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {user.permissions?.dashboard === 'WRITE' && (
                          <span
                            className="w-2 h-2 rounded-full bg-green-500"
                            title="Dashboard: Write"
                          ></span>
                        )}
                        {user.permissions?.cm_plant_operations === 'WRITE' && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-500"
                            title="CM Ops: Write"
                          ></span>
                        )}
                        {user.permissions?.rkc_plant_operations === 'WRITE' && (
                          <span
                            className="w-2 h-2 rounded-full bg-orange-500"
                            title="RKC Ops: Write"
                          ></span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Hover to see access</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{(data.page - 1) * data.perPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(data.page * data.perPage, data.totalItems)}
            </span>{' '}
            of <span className="font-medium">{data.totalItems}</span> results
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              variant="outline"
              onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
              disabled={data.page === 1}
              size="sm"
            >
              Previous
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
              disabled={data.page === data.totalPages}
              size="sm"
            >
              Next
            </EnhancedButton>
          </div>
        </div>
      )}

      <UserForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} />
    </div>
  );
};

export default UserListPage;
