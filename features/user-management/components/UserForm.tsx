import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermission } from '../../../src/domain/entities/User';
import { useUserMutations } from '../hooks/useUserUseCases';
import {
  EnhancedModal,
  EnhancedInput,
  EnhancedButton,
} from '../../../components/ui/EnhancedComponents';
import { UserAccessController } from './UserAccessController';
import UserIcon from '../../../components/icons/UserIcon';
import CheckIcon from '../../../components/icons/CheckIcon';

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

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Nav */}
        <div className="flex bg-slate-50 p-1 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'profile' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            User Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'access' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Access Control
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <EnhancedInput
                label="Username"
                value={formData.username}
                onChange={(v) => setFormData({ ...formData, username: v })}
                required
                autoComplete="username"
              />
              <EnhancedInput
                label="Full Name"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                required
                autoComplete="name"
              />
            </div>
            <EnhancedInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
              required
              autoComplete="email"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className="w-full border-slate-300 rounded-lg p-2.5 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Operator">Operator</option>
                  <option value="Outsourcing">Outsourcing</option>
                  <option value="Autonomous">Autonomous</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <EnhancedInput
                label="Employee ID (Optional)"
                value={formData.employee_id}
                onChange={(v) => setFormData({ ...formData, employee_id: v })}
                autoComplete="off"
              />
            </div>

            <hr className="my-4 border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <EnhancedInput
                label={isEditing ? 'New Password (Optional)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(v) => setFormData({ ...formData, password: v })}
                required={!isEditing}
                autoComplete="new-password"
              />
              <EnhancedInput
                label="Confirm Password"
                type="password"
                value={formData.passwordConfirm}
                onChange={(v) => setFormData({ ...formData, passwordConfirm: v })}
                required={!isEditing}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Active Account
              </label>
            </div>
          </div>
        )}

        {/* Access Tab */}
        {activeTab === 'access' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
              <UserIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-800">Access Control</h4>
                <p className="text-xs text-blue-600 mt-1">
                  Define what modules this user can see and interact with.
                  <br />
                  <span className="font-semibold">NONE</span> = Hidden,
                  <span className="font-semibold"> READ</span> = View Only,
                  <span className="font-semibold"> WRITE</span> = Full Access.
                </p>
              </div>
            </div>

            <UserAccessController
              permissions={permissions}
              onPermissionChange={(key, level) => setPermissions({ ...permissions, [key]: level })}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <EnhancedButton variant="ghost" type="button" onClick={onClose}>
            Cancel
          </EnhancedButton>
          <EnhancedButton
            variant="primary"
            type="submit"
            loading={isLoading}
            icon={<CheckIcon className="w-4 h-4" />}
          >
            {isEditing ? 'Save Changes' : 'Create User'}
          </EnhancedButton>
        </div>
      </form>
    </EnhancedModal>
  );
};

export default UserForm;
