import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermission, PermissionLevel } from '../../../src/domain/entities/User';
import { useUserMutations } from '../hooks/useUserUseCases';
import {
  EnhancedModal,
  EnhancedInput,
  EnhancedButton,
  EnhancedCard,
  EnhancedBadge,
} from '../../../components/ui/EnhancedComponents';
import { UserAccessController } from './UserAccessController';
import UserIcon from '../../../components/icons/UserIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';

interface UserFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PERMISSIONS: UserPermission = {
  dashboard: 'NONE',
  cm_plant_operations: 'NONE',
  rkc_plant_operations: 'NONE',
  project_management: 'NONE',
  database: 'NONE',
  inspection: 'NONE',
};

export const UserForm: React.FC<UserFormProps> = ({ user, isOpen, onClose }) => {
  const isEditing = !!user;
  const { createUser, updateUser } = useUserMutations();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'Guest' as UserRole,
    is_active: true,
    employee_id: '',
    password: '',
    passwordConfirm: '',
  });

  const [permissions, setPermissions] = useState<UserPermission>(DEFAULT_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<'profile' | 'access'>('profile');

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'Guest',
          is_active: user.is_active ?? true,
          employee_id: user.employee_id || '',
          password: '',
          passwordConfirm: '',
        });
        setPermissions(user.permissions || DEFAULT_PERMISSIONS);
      } else {
        setFormData({
          username: '',
          name: '',
          email: '',
          role: 'Operator',
          is_active: true,
          employee_id: '',
          password: '',
          passwordConfirm: '',
        });
        setPermissions(DEFAULT_PERMISSIONS);
      }
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      alert('Passwords do not match');
      return;
    }

    try {
      if (isEditing && user) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            ...formData,
            permissions,
          },
        });
      } else {
        await createUser.mutateAsync({
          ...formData,
          permissions,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save user', err);
      alert('Failed to save user');
    }
  };

  const setAllPermissions = (level: PermissionLevel) => {
    const newPermissions = { ...permissions };
    (Object.keys(newPermissions) as (keyof UserPermission)[]).forEach((key) => {
      newPermissions[key] = level;
    });
    setPermissions(newPermissions);
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Update User Account' : 'Register New User'}
      size="lg"
      variant="glass"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Nav - Modern Minimalist */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400 scale-100'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95 opacity-70'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            User Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'access'
                ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400 scale-100'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95 opacity-70'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            Access Control
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Avatar Preview Card */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center mb-4 overflow-hidden border-4 border-white dark:border-slate-700 relative group">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                    {formData.name.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg">
                {formData.name || 'Full Name'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                @{formData.username || 'username'}
              </p>
            </div>

            <EnhancedCard variant="outlined" padding="lg" rounded="2xl" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnhancedInput
                  label="Username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(v) => setFormData({ ...formData, username: v })}
                  required
                  autoComplete="username"
                />
                <EnhancedInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  required
                  autoComplete="name"
                />
              </div>
              <EnhancedInput
                label="Email Address"
                placeholder="john@example.com"
                type="email"
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
                required
                autoComplete="email"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    System Role
                  </label>
                  <select
                    className="w-full h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: `right 1rem center`,
                      backgroundRepeat: `no-repeat`,
                      backgroundSize: `1.5em 1.5em`,
                    }}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Associate">Associate</option>
                    <option value="Operator">Operator</option>
                    <option value="Outsourcing">Outsourcing</option>
                    <option value="Autonomous">Autonomous</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>
                <EnhancedInput
                  label="Employee ID"
                  placeholder="EMP12345"
                  value={formData.employee_id}
                  onChange={(v) => setFormData({ ...formData, employee_id: v })}
                  autoComplete="off"
                />
              </div>
            </EnhancedCard>

            <EnhancedCard variant="outlined" padding="lg" rounded="2xl" className="space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                Security Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnhancedInput
                  label={isEditing ? 'Change Password' : 'Password'}
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                  required={!isEditing}
                  autoComplete="new-password"
                />
                <EnhancedInput
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(v) => setFormData({ ...formData, passwordConfirm: v })}
                  required={!isEditing}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </div>
                <label
                  htmlFor="is_active"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Account is Active
                </label>
              </div>
            </EnhancedCard>
          </div>
        )}

        {/* Access Tab */}
        {activeTab === 'access' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-lg font-black flex items-center gap-2">
                  <ShieldCheckIcon className="w-6 h-6" />
                  Module Access Control
                </h4>
                <p className="text-indigo-100 text-sm mt-1 font-medium italic">
                  Granular control over system modules and data entry permissions.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <EnhancedButton
                    variant="glass"
                    size="xs"
                    onClick={() => setAllPermissions('NONE')}
                    className="bg-white/10 hover:bg-white/20 border-white/20"
                  >
                    Clear All
                  </EnhancedButton>
                  <EnhancedButton
                    variant="glass"
                    size="xs"
                    onClick={() => setAllPermissions('READ')}
                    className="bg-white/10 hover:bg-white/20 border-white/20"
                  >
                    Set All READ
                  </EnhancedButton>
                  <EnhancedButton
                    variant="glass"
                    size="xs"
                    onClick={() => setAllPermissions('WRITE')}
                    className="bg-white/10 hover:bg-white/20 border-white/20"
                  >
                    Set All WRITE
                  </EnhancedButton>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl" />
            </div>

            <UserAccessController
              permissions={permissions}
              onPermissionChange={(key, level) => setPermissions({ ...permissions, [key]: level })}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
          <EnhancedButton
            variant="ghost"
            type="button"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </EnhancedButton>
          <EnhancedButton
            variant="primary"
            type="submit"
            loading={isLoading}
            icon={<CheckIcon className="w-5 h-5" />}
            className="rounded-xl px-8 shadow-indigo-600/25"
          >
            {isEditing ? 'Save Changes' : 'Create User Account'}
          </EnhancedButton>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default UserForm;
