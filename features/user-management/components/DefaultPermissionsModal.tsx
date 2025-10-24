import React, { useState, useEffect } from 'react';
import { pb } from '../../../utils/pocketbase';
import { UserRole, PermissionMatrix } from '../../../types';
import { getDefaultPermissionsForRole } from '../../../utils/tonasaPermissions';
import { saveDefaultPermissionsToDB } from '../../../services/defaultPermissionsService';
import { translations } from '../../../translations';

// Enhanced Components
import {
  EnhancedModal,
  EnhancedButton,
  EnhancedCard,
  EnhancedBadge,
} from '../../../components/ui/EnhancedComponents';

// Icons
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ExclamationTriangleIcon from '../../../components/icons/ExclamationTriangleIcon';

interface DefaultPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: 'en' | 'id';
}

const DefaultPermissionsModal: React.FC<DefaultPermissionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Super Admin');
  const [permissions, setPermissions] = useState<PermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = translations[language];

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Manager',
    'Operator',
    'Outsourcing',
    'Autonomous',
    'Guest',
  ];

  const modules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'plant_operations', label: 'Plant Operations' },
    { key: 'inspection', label: 'Inspection' },
    { key: 'project_management', label: 'Project Management' },
  ];

  const permissionLevels = [
    { value: 'NONE', label: 'None', color: 'gray' },
    { value: 'READ', label: 'Read', color: 'blue' },
    { value: 'WRITE', label: 'Write', color: 'yellow' },
    { value: 'ADMIN', label: 'Admin', color: 'red' },
  ];

  // Load permissions when role changes
  useEffect(() => {
    const loadPermissions = async () => {
      if (selectedRole) {
        setIsLoadingPermissions(true);
        try {
          const rolePermissions = await getDefaultPermissionsForRole(selectedRole);
          setPermissions(rolePermissions);
        } catch (error) {
          console.error('Failed to load permissions:', error);
          setError('Failed to load permissions');
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    loadPermissions();
  }, [selectedRole]);

  const handlePermissionChange = (module: keyof PermissionMatrix, level: string) => {
    if (!permissions) return;

    setPermissions((prev) => ({
      ...prev!,
      [module]: level as any,
    }));
  };

  const handleSave = async () => {
    if (!permissions) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await saveDefaultPermissionsToDB(selectedRole, permissions);
      setSuccess('Default permissions updated successfully!');
      onSuccess?.();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update default permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoadingPermissions(true);
    try {
      const rolePermissions = await getDefaultPermissionsForRole(selectedRole);
      setPermissions(rolePermissions);
    } catch (error) {
      console.error('Failed to reset permissions:', error);
      setError('Failed to reset permissions');
    } finally {
      setIsLoadingPermissions(false);
    }
    setError('');
    setSuccess('');
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Default Permissions Management"
      size="xl"
    >
      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Role
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium">{role}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default permissions
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <EnhancedCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permission Matrix for {selectedRole}
            </h3>
          </div>

          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading permissions...</span>
            </div>
          ) : permissions ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <div
                  key={module.key}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{module.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Module access level
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {permissionLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() =>
                          handlePermissionChange(module.key as keyof PermissionMatrix, level.value)
                        }
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          permissions[module.key as keyof PermissionMatrix] === level.value
                            ? `bg-${level.color}-100 dark:bg-${level.color}-900/20 text-${level.color}-700 dark:text-${level.color}-300 border border-${level.color}-300`
                            : `bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Failed to load permissions
            </div>
          )}
        </EnhancedCard>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <EnhancedButton variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset to Default
          </EnhancedButton>

          <div className="flex gap-3">
            <EnhancedButton variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </EnhancedButton>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
          </div>
        )}
      </div>
    </EnhancedModal>
  );
};

export default DefaultPermissionsModal;
