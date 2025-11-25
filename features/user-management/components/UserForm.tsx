import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { translations } from '../../../translations';
import { UserRole } from '../../../types';
import { User } from '../../../src/shared/types';

interface UserFormProps {
  user?: User; // For editing
  onClose: () => void;
  onSuccess: () => void;
  language?: 'en' | 'id';
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess, language = 'en' }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Guest' as UserRole,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createUser, updateUser } = useUserStore();
  const t = translations[language];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', // Don't show existing password
        full_name: user.full_name || '',
        role: user.role || 'Guest',
        is_active: user.is_active ?? true,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.username) {
        setError('Username is required');
        return;
      }

      if (!user && !formData.password) {
        setError('Password is required for new users');
        return;
      }

      if (user) {
        // Update user
        await updateUser(user.id, {
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          ...(formData.password && { password: formData.password }),
        });
      } else {
        // Create new user
        await createUser({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {user ? t.edit_user_title || 'Edit User' : t.add_user_title || 'Add New User'}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            role="form"
            aria-labelledby="user-form-title"
          >
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t.username || 'Username'}
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                aria-describedby={error ? 'username-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  borderColor: error ? 'var(--color-error)' : 'var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-neutral-0)',
                }}
              />
              {error && (
                <p
                  id="username-error"
                  className="mt-1 text-sm"
                  style={{ color: 'var(--color-error)' }}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.password || 'Password'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                autoComplete="new-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                {t.full_name_label || 'Full Name'}
              </label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                autoComplete="name"
                aria-describedby="fullname-help"
                aria-required="false"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p id="fullname-help" className="mt-1 text-sm text-gray-500">
                Enter the user's full display name (optional)
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {t.role_label || 'Role'}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                aria-describedby="role-help"
                aria-required="true"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Guest">Guest</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Outsourcing">Outsourcing</option>
                <option value="Operator">Operator</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
              <p id="role-help" className="mt-1 text-sm text-gray-500">
                Select the user&apos;s role and permissions level
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                aria-describedby="active-help"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
              <p id="active-help" className="sr-only">
                Toggle to activate or deactivate the user account
              </p>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-h-[44px]"
              >
                {t.cancel_button || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? t.loading || 'Saving...' : t.save_button || 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;


