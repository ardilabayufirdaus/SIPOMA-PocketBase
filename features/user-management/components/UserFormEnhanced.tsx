import React, { useState, useEffect, useMemo } from 'react';
import { supabase, apiClient } from '../../../utils/supabaseClient';
import { passwordUtils } from '../../../utils/passwordUtils';
import { translations } from '../../../translations';
import { UserRole, PermissionMatrix } from '../../../types';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import { useUserManagementPerformance } from '../../../hooks/usePerformanceMonitor';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { getDefaultPermissionsForRole, isTonasaRole } from '../../../utils/tonasaPermissions';
import DatabaseMigrationPrompt from '../../../components/DatabaseMigrationPrompt';
import { isAdminRole } from '../../../utils/roleHelpers';
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedModal,
  EnhancedBadge,
} from '../../../components/ui/EnhancedComponents';

// Icons
import UserIcon from '../../../components/icons/UserIcon';
import EyeSlashIcon from '../../../components/icons/EyeSlashIcon';
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ExclamationTriangleIcon from '../../../components/icons/ExclamationTriangleIcon';

interface UserFormProps {
  user?: any; // For editing
  onClose: () => void;
  onSuccess: () => void;
  language?: 'en' | 'id';
  isOpen?: boolean; // Add isOpen prop
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onClose,
  onSuccess,
  language = 'en',
  isOpen = true, // Default to true for backward compatibility
}) => {
  const performanceMonitor = useUserManagementPerformance();
  const { currentUser } = useCurrentUser();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'Guest' as UserRole,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPermissionEditorOpen, setIsPermissionEditorOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<PermissionMatrix>({
    dashboard: 'NONE',
    plant_operations: {},
    inspection: 'NONE',
    project_management: 'NONE',
    system_settings: 'NONE',
    user_management: 'NONE',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState<{
    isActive: boolean;
    userData: any;
    permissions: PermissionMatrix;
  } | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<
    Array<{
      username: string;
      password: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
      errors?: string[];
    }>
  >([]);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    successes: number;
    failures: number;
  }>({ current: 0, total: 0, successes: 0, failures: 0 });
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migrationError, setMigrationError] = useState('');

  const t = translations[language];

  const fetchUserPermissions = async () => {
    if (!user?.id) return;

    try {
      // Single query with join to get all permissions at once
      const { data, error } = await supabase
        .from('user_permissions')
        .select(
          `
          permission_id,
          permissions (
            module_name,
            permission_level,
            plant_units
          )
        `
        )
        .eq('user_id', user.id);

      if (error) throw error;

      // Build permission matrix from data more efficiently
      const matrix: PermissionMatrix = {
        dashboard: 'NONE',
        plant_operations: {},
        inspection: 'NONE',
        project_management: 'NONE',
        system_settings: 'NONE',
        user_management: 'NONE',
      };

      (data || []).forEach((up: any) => {
        const perm = up.permissions;
        if (perm) {
          const level = perm.permission_level;
          switch (perm.module_name) {
            case 'dashboard':
              matrix.dashboard = level;
              break;
            case 'plant_operations':
              // Handle plant units more efficiently
              if (perm.plant_units && Array.isArray(perm.plant_units)) {
                perm.plant_units.forEach((unit: any) => {
                  if (!matrix.plant_operations[unit.category]) {
                    matrix.plant_operations[unit.category] = {};
                  }
                  matrix.plant_operations[unit.category][unit.unit] = level;
                });
              }
              break;
            case 'project_management':
              matrix.project_management = level;
              break;
            case 'system_settings':
              matrix.system_settings = level;
              break;
            case 'user_management':
              matrix.user_management = level;
              break;
          }
        }
      });

      setUserPermissions(matrix);
    } catch (err: any) {
      console.error('Error fetching user permissions:', err);
      setError(err.message || 'Failed to fetch user permissions');
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', // Don't show existing password
        confirmPassword: '',
        full_name: user.full_name || '',
        role: user.role || 'Guest',
        is_active: user.is_active ?? true,
      });
      fetchUserPermissions();
    } else {
      // Reset permissions for new user
      setUserPermissions({
        dashboard: 'NONE',
        plant_operations: {},
        inspection: 'NONE',
        project_management: 'NONE',
        system_settings: 'NONE',
        user_management: 'NONE',
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and dots';
    }

    // Password validation (only for new users or when password is provided)
    if (!user || formData.password) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password =
          'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Full name validation
    if (formData.full_name && formData.full_name.length > 100) {
      errors.full_name = 'Full name must be less than 100 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    // Optimistic update: immediately update UI
    const optimisticUserData = {
      ...formData,
      id: user?.id || `temp-${Date.now()}`, // Temporary ID for new users
      created_at: user?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOptimisticUpdate({
      isActive: true,
      userData: optimisticUserData,
      permissions: { ...userPermissions },
    });

    // Call onSuccess immediately for optimistic UI update
    onSuccess();

    try {
      const submitData: any = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim() || null,
        role: formData.role,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      // Only include password if it's provided (for new users or password changes)
      if (formData.password) {
        submitData.password_hash = await passwordUtils.hash(formData.password);
      }

      let userId = user?.id;

      if (user) {
        // Update user
        performanceMonitor.startOperation('user_update');
        const { error: updateError } = await supabase
          .from('users')
          .update(submitData)
          .eq('id', user.id);

        if (updateError) throw updateError;
        performanceMonitor.endOperation('user_update', true);
      } else {
        // Create new user
        performanceMonitor.startOperation('user_creation');
        const newUser = await apiClient.users.create({
          username: formData.username.trim(),
          password: formData.password,
          full_name: formData.full_name.trim() || undefined,
          role: formData.role,
        });
        userId = newUser.id;
        performanceMonitor.endOperation('user_creation', true);
      }

      // Save permissions if userId exists
      if (userId) {
        performanceMonitor.startOperation('permission_save');
        await saveUserPermissions(userId);
        performanceMonitor.endOperation('permission_save', true);
      }

      // Success - clear optimistic update
      setOptimisticUpdate(null);
      onClose();
    } catch (err: any) {
      console.error('User save error:', err);

      // Check if it's a role constraint error
      if (err.code === '23514' && err.message && err.message.includes('users_role_check')) {
        setMigrationError(err.message);
        setShowMigrationPrompt(true);
      } else {
        setError(err.message || 'Failed to save user');
      }

      // Rollback optimistic update on error
      setOptimisticUpdate(null);

      // End operations with failure
      performanceMonitor.endOperation('user_creation', false, err.message);
      performanceMonitor.endOperation('user_update', false, err.message);
      performanceMonitor.endOperation('permission_save', false, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').filter((row) => row.trim());
      const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());

      // Expected headers: username,password,full_name,role,is_active
      const expectedHeaders = ['username', 'password', 'full_name', 'role', 'is_active'];
      const headerValid = expectedHeaders.every((h) => headers.includes(h));

      if (!headerValid) {
        setError('CSV must have headers: username,password,full_name,role,is_active');
        return;
      }

      const parsedUsers = rows.slice(1).map((row, index) => {
        const values = row.split(',').map((v) => v.trim());
        const user: any = {};
        headers.forEach((header, i) => {
          user[header] = values[i] || '';
        });

        // Validate and set defaults
        const errors: string[] = [];
        if (!user.username) errors.push('Username required');
        if (!user.password) errors.push('Password required');
        if (user.password && user.password.length < 8)
          errors.push('Password must be at least 8 characters');

        const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Operator', 'Guest'];
        if (!validRoles.includes(user.role)) {
          user.role = 'Guest'; // Default to Guest
        }

        user.is_active = user.is_active?.toLowerCase() === 'true' || user.is_active === '1';
        user.errors = errors;

        return user;
      });

      setBulkUsers(parsedUsers);
      setBulkProgress({ current: 0, total: parsedUsers.length, successes: 0, failures: 0 });
      setError('');
    } catch (err) {
      setError('Failed to parse CSV file');
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkUsers.length === 0) return;

    setIsLoading(true);
    setError('');
    setBulkProgress({ current: 0, total: bulkUsers.length, successes: 0, failures: 0 });

    performanceMonitor.startOperation('bulk_user_creation', { userCount: bulkUsers.length });

    const results = { successes: 0, failures: 0 };

    for (let i = 0; i < bulkUsers.length; i++) {
      const userData = bulkUsers[i];
      setBulkProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        // Create user using apiClient for proper password hashing
        await apiClient.users.create({
          username: userData.username,
          password: userData.password,
          full_name: userData.full_name || undefined,
          role: userData.role,
        });

        results.successes++;
        setBulkProgress((prev) => ({ ...prev, successes: results.successes }));
      } catch (err: any) {
        console.error(`Failed to create user ${userData.username}:`, err);
        results.failures++;
        setBulkProgress((prev) => ({ ...prev, failures: results.failures }));
      }
    }

    performanceMonitor.endOperation(
      'bulk_user_creation',
      results.failures === 0,
      `Created ${results.successes} users, ${results.failures} failed`
    );

    setIsLoading(false);
    onSuccess();

    if (results.failures === 0) {
      setIsBulkMode(false);
      setBulkUsers([]);
      onClose();
    } else {
      setError(`${results.successes} users created successfully, ${results.failures} failed`);
    }
  };

  const saveUserPermissions = async (userId: string) => {
    try {
      // Delete existing user permissions first to avoid duplicates
      await supabase.from('user_permissions').delete().eq('user_id', userId);

      // Collect all permissions to insert
      const permissionsToInsert = [];

      // Handle simple permissions
      const simplePermissions = [
        { module: 'dashboard', level: userPermissions.dashboard },
        { module: 'project_management', level: userPermissions.project_management },
        { module: 'system_settings', level: userPermissions.system_settings },
        { module: 'user_management', level: userPermissions.user_management },
      ];

      for (const perm of simplePermissions) {
        if (perm.level !== 'NONE') {
          permissionsToInsert.push({
            module_name: perm.module,
            permission_level: perm.level,
            plant_units: [],
          });
        }
      }

      // Handle plant operations permissions
      if (
        userPermissions.plant_operations &&
        Object.keys(userPermissions.plant_operations).length > 0
      ) {
        const plantUnits = [];
        Object.entries(userPermissions.plant_operations).forEach(([category, units]) => {
          Object.entries(units).forEach(([unit, level]) => {
            if (level !== 'NONE') {
              plantUnits.push({ category, unit, level });
            }
          });
        });

        if (plantUnits.length > 0) {
          // Group by permission level
          const levelGroups = plantUnits.reduce(
            (acc, record) => {
              if (!acc[record.level]) acc[record.level] = [];
              acc[record.level].push({ category: record.category, unit: record.unit });
              return acc;
            },
            {} as Record<string, Array<{ category: string; unit: string }>>
          );

          for (const [level, units] of Object.entries(levelGroups)) {
            permissionsToInsert.push({
              module_name: 'plant_operations',
              permission_level: level,
              plant_units: units,
            });
          }
        }
      }

      if (permissionsToInsert.length === 0) return;

      // Batch insert permissions
      const { data: insertedPermissions, error: insertError } = await supabase
        .from('permissions')
        .upsert(permissionsToInsert, { onConflict: 'module_name,permission_level' })
        .select('id, module_name, permission_level');

      if (insertError) throw insertError;

      // Create user_permissions entries
      const userPermissionInserts = (insertedPermissions || []).map((perm: any) => ({
        user_id: userId,
        permission_id: perm.id,
      }));

      if (userPermissionInserts.length > 0) {
        const { error: userPermError } = await supabase
          .from('user_permissions')
          .insert(userPermissionInserts);

        if (userPermError) throw userPermError;
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      throw error;
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-assign default permissions when role changes
    if (field === 'role' && typeof value === 'string') {
      const role = value as UserRole;
      const defaultPermissions = getDefaultPermissionsForRole(role);
      setUserPermissions(defaultPermissions);
    }

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: 'gray' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'error' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'warning' };
    if (strength <= 4) return { strength, label: 'Good', color: 'primary' };
    return { strength, label: 'Strong', color: 'success' };
  };

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handlePermissionsChange = (newPermissions: PermissionMatrix) => {
    setUserPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!user?.id) return;

    try {
      await saveUserPermissions(user.id);
      setIsPermissionEditorOpen(false);
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      setError(err.message || 'Failed to save permissions');
    }
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        user
          ? t.edit_user_title || 'Edit User'
          : isBulkMode
            ? 'Bulk Create Users'
            : t.add_user_title || 'Add New User'
      }
      size="lg"
      closeOnBackdrop={true}
      closeOnEscape={true}
    >
      {!user && (
        <div className="flex justify-end mb-4">
          <EnhancedButton
            variant="secondary"
            size="sm"
            onClick={() => setIsBulkMode(!isBulkMode)}
            type="button"
          >
            {isBulkMode ? 'Single User' : 'Bulk Upload'}
          </EnhancedButton>
        </div>
      )}

      {isBulkMode ? (
        <div className="space-y-6">
          {/* Bulk Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-gray-600 dark:text-gray-400">
                  <p className="text-lg font-medium">Upload CSV File</p>
                  <p className="text-sm mt-1">Click to select or drag and drop</p>
                  <p className="text-xs mt-2 text-gray-500">
                    Format: username,password,full_name,role,is_active
                  </p>
                </div>
              </label>
            </div>

            {bulkUsers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Preview ({bulkUsers.length} users)</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Success: {bulkProgress.successes} | Failed: {bulkProgress.failures}
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Username
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Full Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {bulkUsers.map((user, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{user.username}</td>
                          <td className="px-4 py-3 text-sm">{user.full_name}</td>
                          <td className="px-4 py-3 text-sm">{user.role}</td>
                          <td className="px-4 py-3 text-sm">
                            {user.errors && user.errors.length > 0 ? (
                              <span className="text-red-600">Errors: {user.errors.join(', ')}</span>
                            ) : (
                              <span className="text-green-600">Valid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bulkProgress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Progress: {bulkProgress.current}/{bulkProgress.total}
                      </span>
                      <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <EnhancedButton
              variant="secondary"
              onClick={() => {
                setIsBulkMode(false);
                setBulkUsers([]);
                setBulkProgress({ current: 0, total: 0, successes: 0, failures: 0 });
              }}
              type="button"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={handleBulkSubmit}
              disabled={bulkUsers.length === 0 || isLoading}
              loading={isLoading}
              type="button"
            >
              {isLoading ? 'Creating Users...' : `Create ${bulkUsers.length} Users`}
            </EnhancedButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.username || 'Username'} *
            </label>
            <EnhancedInput
              value={formData.username}
              onChange={(value) => handleChange('username', value)}
              placeholder="Enter username"
              icon={<UserIcon className="w-4 h-4" />}
              error={validationErrors.username}
              className="w-full"
              autoComplete="username"
            />
            {validationErrors.username && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {validationErrors.username}
              </p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.password || 'Password'} {user ? '(leave blank to keep current)' : '*'}
              </label>
              <EnhancedInput
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(value) => handleChange('password', value)}
                placeholder="Enter password"
                icon={<EyeSlashIcon className="w-4 h-4" />}
                error={validationErrors.password}
                autoComplete="new-password"
              />
              {formData.password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'error'
                          ? 'bg-red-500'
                          : passwordStrength.color === 'warning'
                            ? 'bg-yellow-500'
                            : passwordStrength.color === 'primary'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.color === 'error'
                        ? 'text-red-600'
                        : passwordStrength.color === 'warning'
                          ? 'text-yellow-600'
                          : passwordStrength.color === 'primary'
                            ? 'text-blue-600'
                            : 'text-green-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              {validationErrors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.confirm_password || 'Confirm Password'}{' '}
                {user ? '(leave blank to keep current)' : '*'}
              </label>
              <EnhancedInput
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(value) => handleChange('confirmPassword', value)}
                placeholder="Confirm password"
                icon={<EyeSlashIcon className="w-4 h-4" />}
                error={validationErrors.confirmPassword}
                autoComplete="new-password"
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.full_name_label || 'Full Name'}
            </label>
            <EnhancedInput
              value={formData.full_name}
              onChange={(value) => handleChange('full_name', value)}
              placeholder="Enter full name"
              icon={<UserIcon className="w-4 h-4" />}
              error={validationErrors.full_name}
              className="w-full"
              autoComplete="name"
            />
            {validationErrors.full_name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {validationErrors.full_name}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.role_label || 'Role'} *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'Guest', label: 'Guest', color: 'secondary' },
                { value: 'Operator', label: 'Operator', color: 'primary' },
                { value: 'Operator Tonasa 2/3', label: 'Operator Tonasa 2/3', color: 'primary' },
                { value: 'Operator Tonasa 4', label: 'Operator Tonasa 4', color: 'primary' },
                { value: 'Operator Tonasa 5', label: 'Operator Tonasa 5', color: 'primary' },
                { value: 'Admin', label: 'Admin', color: 'warning' },
                { value: 'Admin Tonasa 2/3', label: 'Admin Tonasa 2/3', color: 'warning' },
                { value: 'Admin Tonasa 4', label: 'Admin Tonasa 4', color: 'warning' },
                { value: 'Admin Tonasa 5', label: 'Admin Tonasa 5', color: 'warning' },
                { value: 'Super Admin', label: 'Super Admin', color: 'error' },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleChange('role', role.value)}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    formData.role === role.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{role.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  formData.is_active ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t.user_is_active_label || 'User Status'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.is_active
                    ? 'User is active and can log in'
                    : 'User is inactive and cannot log in'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-green-600' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Permission Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  User Permissions
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure detailed access permissions for this user
                </p>
              </div>
              {isAdminRole(currentUser?.role) ? (
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPermissionEditorOpen(true)}
                  icon={<ShieldCheckIcon className="w-4 h-4" />}
                  disabled={!user?.id}
                >
                  Edit Permissions
                </EnhancedButton>
              ) : null}
            </div>
            {!user?.id && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Save the user first to configure permissions
              </p>
            )}

            {/* Permission Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(userPermissions).map(([key, value]) => {
                if (key === 'plant_operations') {
                  const plantOpsCount = Object.keys(value as any).length;
                  return (
                    <div key={key} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Plant Operations:</span>{' '}
                      {plantOpsCount > 0 ? `${plantOpsCount} categories` : 'None'}
                    </div>
                  );
                }
                return (
                  <div key={key} className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{key.replace('_', ' ')}:</span>{' '}
                    {value === 'NONE' ? 'None' : value.toLowerCase()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <EnhancedButton variant="outline" onClick={onClose} disabled={isLoading}>
              {t.cancel_button || 'Cancel'}
            </EnhancedButton>

            <EnhancedButton
              variant="primary"
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              icon={user ? <CheckIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            >
              {isLoading
                ? t.loading || 'Saving...'
                : user
                  ? t.save_button || 'Update User'
                  : t.save_button || 'Create User'}
            </EnhancedButton>
          </div>
        </form>
      )}

      {/* Permission Matrix Editor */}
      <PermissionMatrixEditor
        userId={user?.id || ''}
        currentPermissions={userPermissions}
        onPermissionsChange={handlePermissionsChange}
        onSave={handleSavePermissions}
        onClose={() => setIsPermissionEditorOpen(false)}
        isOpen={isPermissionEditorOpen}
        language={language}
      />

      {/* Database Migration Prompt */}
      {showMigrationPrompt && (
        <DatabaseMigrationPrompt
          error={migrationError}
          onDismiss={() => {
            setShowMigrationPrompt(false);
            setMigrationError('');
          }}
        />
      )}
    </EnhancedModal>
  );
};

export default UserForm;
