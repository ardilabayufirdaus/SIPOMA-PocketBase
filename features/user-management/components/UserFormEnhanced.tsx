import React, { useState, useEffect, useMemo } from 'react';
import { pb } from '../../../utils/pocketbase-simple';
import { passwordUtils } from '../../../utils/passwordUtils';
import { translations } from '../../../translations';
import { UserRole, PermissionMatrix } from '../../../types';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import { useUserManagementPerformance } from '../../../hooks/usePerformanceMonitor';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { getDefaultPermissionsForRole, isTonasaRole } from '../../../utils/tonasaPermissions';
import {
  initializeUserPermissions,
  logPermissionChange,
} from '../../../utils/userPermissionManager';
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
  });
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);
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
  const [bulkConfig, setBulkConfig] = useState<{
    usernames: string;
    password: string;
    role: UserRole;
  }>({
    usernames: '',
    password: '',
    role: 'Operator' as UserRole,
  });
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migrationError, setMigrationError] = useState('');

  const t = translations[language];

  const fetchUserPermissions = async (retryCount = 0) => {
    if (!user?.id) return;

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

    try {
      // Get user data from PocketBase - permissions are stored directly in the user record
      const userData = await pb.collection('users').getOne(user.id);

      if (userData && userData.permissions) {
        // Permissions are stored as a JSON object in PocketBase
        const permissions = userData.permissions;
        setUserPermissions(permissions);
        // Check if permissions are custom (not default)
        setIsCustomPermissions(userData.is_custom_permissions || false);
      } else {
        // Fallback to default permissions if none are set
        const defaultPerms = await getDefaultPermissionsForRole(user.role);
        setUserPermissions(defaultPerms);
        setIsCustomPermissions(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      const isNetworkError =
        error?.message?.includes('ERR_NETWORK_CHANGED') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError');

      if (isNetworkError && retryCount < maxRetries) {
        console.warn(
          `Network error fetching user permissions, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
        );
        setTimeout(() => fetchUserPermissions(retryCount + 1), retryDelay);
        return;
      }

      // If it's not a network error or we've exhausted retries, fall back to default permissions
      console.error('Error fetching user permissions:', error?.message || 'Unknown error');
      console.log('Falling back to default permissions for role:', user.role);
      const defaultPerms = await getDefaultPermissionsForRole(user.role);
      setUserPermissions(defaultPerms);
      setIsCustomPermissions(false);

      // Only set error state for non-network errors or after all retries
      if (!isNetworkError || retryCount >= maxRetries) {
        setError(`Failed to load user permissions: ${error?.message || 'Unknown error'}`);
      }
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
        const updateData = {
          username: formData.username.trim(),
          name: formData.full_name.trim() || null, // PocketBase menggunakan field 'name' bukan 'full_name'
          role: formData.role,
          is_active: formData.is_active,
          permissions: userPermissions, // Simpan permissions di user record
          is_custom_permissions: isCustomPermissions, // Flag untuk custom permissions
        };

        const updatedUser = await pb.collection('users').update(user.id, updateData);
        performanceMonitor.endOperation('user_update', true);
      } else {
        // Create new user
        performanceMonitor.startOperation('user_creation');
        const newUserData = {
          username: formData.username.trim(),
          password: formData.password,
          passwordConfirm: formData.password, // PocketBase requires password confirmation
          name: formData.full_name.trim() || '', // PocketBase menggunakan field 'name' bukan 'full_name'
          role: formData.role,
          is_active: formData.is_active,
          permissions: userPermissions, // Simpan permissions di user record
          is_custom_permissions: isCustomPermissions, // Flag untuk custom permissions
        };

        const newUser = await pb.collection('users').create(newUserData);
        userId = newUser.id;
        performanceMonitor.endOperation('user_creation', true);
      }

      // Save permissions if userId exists
      if (userId) {
        performanceMonitor.startOperation('permission_save');

        // Get old permissions for audit trail
        let oldPermissions;
        if (user) {
          try {
            const userData = await pb.collection('users').getOne(user.id);
            oldPermissions = userData.permissions;
          } catch (error) {
            // Ignore error, old permissions might not exist
          }
        }

        await saveUserPermissions(userId);

        // Log permission change for audit trail
        const action = user ? (isCustomPermissions ? 'updated' : 'reset_to_default') : 'created';
        await logPermissionChange(userId, action, oldPermissions, userPermissions);

        performanceMonitor.endOperation('permission_save', true);
      }

      // Success - clear optimistic update and call onSuccess
      setOptimisticUpdate(null);
      onSuccess();
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
    const errors: string[] = [];

    for (let i = 0; i < bulkUsers.length; i++) {
      const userData = bulkUsers[i];
      setBulkProgress((prev) => ({ ...prev, current: i + 1 }));

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          // Create user using PocketBase directly - use correct field names
          const pbUserData = {
            username: userData.username,
            password: userData.password,
            passwordConfirm: userData.password, // PocketBase requires password confirmation
            name: userData.full_name || userData.username, // PocketBase uses 'name' field
            role: userData.role,
            is_active: userData.is_active,
          };

          const newUser = await pb.collection('users').create(pbUserData);

          // Initialize permissions for the new user
          await initializeUserPermissions(newUser.id, userData.role as UserRole);

          results.successes++;
          setBulkProgress((prev) => ({ ...prev, successes: results.successes }));
          break; // Success, exit retry loop
        } catch (err: any) {
          retryCount++;

          const errorMessage = err?.message || err?.toString() || 'Unknown error';
          console.error(
            `Failed to create user ${userData.username} (attempt ${retryCount}/${maxRetries + 1}):`,
            err
          );

          // Check if it's a network error that we should retry
          const isNetworkError =
            errorMessage.includes('ERR_NETWORK') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('network') ||
            err?.name === 'TypeError';

          if (isNetworkError && retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying user ${userData.username} creation in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Final failure
          results.failures++;
          setBulkProgress((prev) => ({ ...prev, failures: results.failures }));

          // Add detailed error message
          const detailedError = `User ${userData.username}: ${errorMessage}`;
          errors.push(detailedError);
          break; // Exit retry loop on final failure
        }
      }
    }

    performanceMonitor.endOperation(
      'bulk_user_creation',
      results.failures === 0,
      `Created ${results.successes} users, ${results.failures} failed`
    );

    setIsLoading(false);

    // Show detailed error summary if there were failures
    if (errors.length > 0) {
      const errorSummary = errors.slice(0, 5).join('\n'); // Show first 5 errors
      const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : '';
      setError(
        `Bulk creation completed:\n${results.successes} successful, ${results.failures} failed\n\nErrors:\n${errorSummary}${moreErrors}`
      );
    }

    if (results.successes > 0) {
      onSuccess();
    }

    if (results.failures === 0) {
      setIsBulkMode(false);
      setBulkUsers([]);
      onClose();
    }
  };

  const saveUserPermissions = async (userId: string) => {
    try {
      // Gunakan fungsi yang ada untuk menyimpan izin hanya di koleksi user_permissions
      await initializeUserPermissions(userId, formData.role as UserRole);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save permissions';
      console.error('Error saving permissions:', errorMessage);
      throw new Error(errorMessage);
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
      getDefaultPermissionsForRole(role).then((defaultPermissions) => {
        setUserPermissions(defaultPermissions);
        setIsCustomPermissions(false); // Reset to default when role changes
      });
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
    // Mark as custom permissions when user manually changes them
    setIsCustomPermissions(true);
  };

  const handleResetToDefault = async () => {
    if (!user) return;

    try {
      const defaultPerms = await getDefaultPermissionsForRole(user.role);
      setUserPermissions(defaultPerms);
      setIsCustomPermissions(false);
    } catch (error) {
      console.error('Error resetting to default permissions:', error);
      setError('Failed to reset permissions to default');
    }
  };

  const generateBulkUsers = () => {
    if (!bulkConfig.usernames.trim()) {
      setError('Please enter usernames');
      return;
    }

    if (!bulkConfig.password.trim()) {
      setError('Password is required');
      return;
    }

    if (!bulkConfig.role) {
      setError('Role selection is required');
      return;
    }

    setError(''); // Clear any previous errors

    // Parse usernames from comma-separated string
    const usernameList = bulkConfig.usernames
      .split(',')
      .map((username) => username.trim())
      .filter((username) => username.length > 0);

    if (usernameList.length === 0) {
      setError('No valid usernames found');
      return;
    }

    if (usernameList.length > 100) {
      setError('Maximum 100 users allowed at once');
      return;
    }

    const users = [];
    const existingUsernames = new Set();

    for (const username of usernameList) {
      // Check for duplicate usernames
      if (existingUsernames.has(username)) {
        users.push({
          username,
          password: bulkConfig.password,
          full_name: username, // Use username as full name for now
          role: bulkConfig.role,
          is_active: true,
          errors: [`Duplicate username: ${username}`],
        });
      } else {
        existingUsernames.add(username);
        users.push({
          username,
          password: bulkConfig.password,
          full_name: username,
          role: bulkConfig.role,
          is_active: true,
          errors: [],
        });
      }
    }

    setBulkUsers(users);
    setBulkProgress({ current: 0, total: 0, successes: 0, failures: 0 });
  };

  const handleSavePermissions = async () => {
    if (!user?.id) return;

    try {
      // Import the correct save function from userPermissionManager
      const { saveUserPermissions } = await import('../../../utils/userPermissionManager');

      // Save the edited permissions (userPermissions state) to user_permissions collection
      await saveUserPermissions(user.id, userPermissions, 'system');

      // Update local state to reflect saved custom permissions
      setIsCustomPermissions(true);

      setIsPermissionEditorOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save permissions';
      console.error('Error saving permissions:', errorMessage);
      setError(errorMessage);
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
          {/* Bulk Generation Section */}
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                Bulk User Creation
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Enter usernames separated by commas, all users will use the same password and role.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usernames (comma-separated)
                </label>
                <textarea
                  value={bulkConfig.usernames}
                  onChange={(e) =>
                    setBulkConfig((prev) => ({ ...prev, usernames: e.target.value }))
                  }
                  placeholder="kadir, safruddin.haeruddin, muhammad.nur6218, antonius.sukma, bahrun..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-h-[100px] resize-y"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter usernames separated by commas. Maximum 100 users at once.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (Same for all users)
                </label>
                <input
                  type="password"
                  value={bulkConfig.password}
                  onChange={(e) => setBulkConfig((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="password123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={bulkConfig.role}
                  onChange={(e) =>
                    setBulkConfig((prev) => ({ ...prev, role: e.target.value as UserRole }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Role</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Operator">Operator</option>
                  <option value="Outsourcing">Outsourcing</option>
                  <option value="Autonomous">Autonomous</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <EnhancedButton
                variant="secondary"
                onClick={generateBulkUsers}
                disabled={!bulkConfig.usernames.trim() || !bulkConfig.password || !bulkConfig.role}
              >
                {bulkUsers.length > 0 ? 'Regenerate Users' : 'Generate Users'}
              </EnhancedButton>

              {bulkUsers.length > 0 && (
                <EnhancedButton variant="outline" onClick={() => setBulkUsers([])}>
                  Clear
                </EnhancedButton>
              )}
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'Guest', label: 'Guest', color: 'secondary' },
                { value: 'Outsourcing', label: 'Outsourcing', color: 'primary' },
                { value: 'Operator', label: 'Operator', color: 'primary' },
                { value: 'Autonomous', label: 'Autonomous', color: 'primary' },
                { value: 'Manager', label: 'Manager', color: 'warning' },
                { value: 'Admin', label: 'Admin', color: 'warning' },
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
        onResetToDefault={user ? handleResetToDefault : undefined}
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
