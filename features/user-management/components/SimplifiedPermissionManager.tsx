import React, { useState, useEffect } from 'react';
import { PermissionMatrix, PermissionLevel, User } from '../../../types';
import { DEFAULT_ROLE_PERMISSIONS, getDefaultPermissionsForRole } from '../../../utils/permissions';
import { EnhancedButton, EnhancedModal } from '../../../components/ui/EnhancedComponents';

// Icons
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import CogIcon from '../../../components/icons/CogIcon';
import ChartBarIcon from '../../../components/icons/ChartBarIcon';
import ClipboardDocumentListIcon from '../../../components/icons/ClipboardDocumentListIcon';
import CheckIcon from '../../../components/icons/CheckIcon';

interface SimplifiedPermissionManagerProps {
  user: User | null;
  currentPermissions: PermissionMatrix;
  onPermissionsChange: (permissions: PermissionMatrix) => void;
  onSave?: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  language?: 'en' | 'id';
}

const SimplifiedPermissionManager: React.FC<SimplifiedPermissionManagerProps> = ({
  user,
  currentPermissions,
  onPermissionsChange,
  onSave,
  onClose,
  isOpen,
  language = 'en',
}) => {
  const [permissions, setPermissions] = useState<PermissionMatrix>(currentPermissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Update local state when currentPermissions changes
  useEffect(() => {
    setPermissions(currentPermissions);
  }, [currentPermissions]);

  // Permission modules configuration
  const permissionModules = [
    {
      key: 'dashboard' as keyof PermissionMatrix,
      label: language === 'id' ? 'Dashboard' : 'Dashboard',
      description:
        language === 'id' ? 'Akses ke halaman dashboard utama' : 'Access to main dashboard page',
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      key: 'plant_operations' as keyof PermissionMatrix,
      label: language === 'id' ? 'Operasi Pabrik' : 'Plant Operations',
      description:
        language === 'id'
          ? 'Akses ke data dan operasi pabrik'
          : 'Access to plant data and operations',
      icon: <CogIcon className="w-5 h-5" />,
    },
    {
      key: 'inspection' as keyof PermissionMatrix,
      label: language === 'id' ? 'Inspeksi' : 'Inspection',
      description:
        language === 'id'
          ? 'Akses ke modul inspeksi dan audit'
          : 'Access to inspection and audit modules',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    },
    {
      key: 'project_management' as keyof PermissionMatrix,
      label: language === 'id' ? 'Manajemen Proyek' : 'Project Management',
      description: language === 'id' ? 'Akses ke manajemen proyek' : 'Access to project management',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    },
  ];

  const permissionLevelLabels = {
    NONE: language === 'id' ? 'Tidak Ada' : 'None',
    READ: language === 'id' ? 'Baca' : 'Read',
    WRITE: language === 'id' ? 'Tulis' : 'Write',
    ADMIN: language === 'id' ? 'Admin' : 'Admin',
  };

  const handlePermissionChange = (module: keyof PermissionMatrix, level: PermissionLevel) => {
    const newPermissions = { ...permissions };
    newPermissions[module] = level;
    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const handleRolePreset = (role: string) => {
    const rolePermissions = getDefaultPermissionsForRole(role);
    setPermissions(rolePermissions);
    onPermissionsChange(rolePermissions);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      if (onSave) {
        await onSave();
        setSuccessMessage(
          language === 'id' ? 'Permission berhasil disimpan!' : 'Permissions saved successfully!'
        );
        setTimeout(() => onClose(), 1500);
      }
    } catch {
      setError(language === 'id' ? 'Gagal menyimpan permission' : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPermissionLevel = (module: keyof PermissionMatrix): PermissionLevel => {
    const permission = permissions[module];
    return typeof permission === 'string' ? permission : 'NONE';
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'id' ? 'Kelola Permission' : 'Manage Permissions'}
      size="lg"
      closeOnBackdrop={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'id' ? 'Konfigurasi Permission' : 'Permission Configuration'}
            </h3>
            <p className="text-sm text-gray-600">
              {user?.username
                ? `${language === 'id' ? 'Untuk user:' : 'For user:'} ${user.username}`
                : language === 'id'
                  ? 'Atur level akses untuk setiap modul'
                  : 'Set access levels for each module'}
            </p>
          </div>
        </div>

        {/* Role Presets */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            {language === 'id' ? 'Preset Role' : 'Role Presets'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(DEFAULT_ROLE_PERMISSIONS).map((role) => (
              <EnhancedButton
                key={role}
                variant="outline"
                size="sm"
                onClick={() => handleRolePreset(role)}
                className="text-xs"
              >
                {role.replace('_', ' ')}
              </EnhancedButton>
            ))}
          </div>
        </div>

        {/* Permission Modules */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            {language === 'id' ? 'Permission per Modul' : 'Module Permissions'}
          </h4>

          <div className="grid gap-4">
            {permissionModules.map((module) => {
              const currentLevel = getCurrentPermissionLevel(module.key);

              return (
                <div
                  key={module.key}
                  className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          {module.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {module.label}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-6">
                        {(['NONE', 'READ', 'WRITE', 'ADMIN'] as PermissionLevel[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handlePermissionChange(module.key, level)}
                            className={`relative px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                              currentLevel === level
                                ? `border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-lg`
                                : `border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50`
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{permissionLevelLabels[level]}</span>
                            </div>
                            {currentLevel === level && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <EnhancedButton variant="outline" onClick={onClose} disabled={saving}>
            {language === 'id' ? 'Batal' : 'Cancel'}
          </EnhancedButton>
          <EnhancedButton variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
            {saving ? (
              language === 'id' ? (
                'Menyimpan...'
              ) : (
                'Saving...'
              )
            ) : (
              <>
                <CheckIcon className="w-4 h-4 mr-2" />
                {language === 'id' ? 'Simpan' : 'Save'}
              </>
            )}
          </EnhancedButton>
        </div>
      </div>
    </EnhancedModal>
  );
};

export default SimplifiedPermissionManager;
