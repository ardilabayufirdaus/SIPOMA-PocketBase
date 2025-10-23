import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PermissionMatrix, PlantOperationsPermissions, PermissionLevel } from '../../../types';
import { pb } from '../../../utils/pocketbase';
import { translations } from '../../../translations';

// Enhanced Components
import {
  EnhancedCard,
  EnhancedButton,
  EnhancedBadge,
  EnhancedModal,
} from '../../../components/ui/EnhancedComponents';

// Icons
import ShieldCheckIcon from '../../../components/icons/ShieldCheckIcon';
import CheckIcon from '../../../components/icons/CheckIcon';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ExclamationTriangleIcon from '../../../components/icons/ExclamationTriangleIcon';
import EyeSlashIcon from '../../../components/icons/EyeSlashIcon';
import EditIcon from '../../../components/icons/EditIcon';
import CogIcon from '../../../components/icons/CogIcon';
import VirtualTable from '../../../components/VirtualTable';

const permissionLevels: PermissionLevel[] = ['NONE', 'READ', 'WRITE', 'ADMIN'];

interface PermissionMatrixEditorProps {
  userId: string;
  currentPermissions: PermissionMatrix;
  onPermissionsChange: (permissions: PermissionMatrix) => void;
  onSave?: () => Promise<void>;
  onClose: () => void;
  onResetToDefault?: () => void;
  isOpen: boolean;
  language?: 'en' | 'id';
}

const PermissionMatrixEditor: React.FC<PermissionMatrixEditorProps> = ({
  userId,
  currentPermissions,
  onPermissionsChange,
  onSave,
  onClose,
  onResetToDefault,
  isOpen,
  language = 'en',
}) => {
  const [permissions, setPermissions] = useState<PermissionMatrix>(() =>
    JSON.parse(JSON.stringify(currentPermissions))
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'plant'>('general');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const t = translations[language];

  // Notify parent when permissions change (but not during initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      try {
        console.log('📤 PermissionMatrixEditor calling onPermissionsChange with:', permissions);
        onPermissionsChange(permissions);
        console.log('📤 onPermissionsChange call completed');
      } catch (error) {
        console.error('📤 Error calling onPermissionsChange:', error);
      }
    }
  }, [permissions, onPermissionsChange, isInitialLoad]);

  // Reset initial load flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoad(true);
      // Create deep copy to avoid reference sharing
      setPermissions(JSON.parse(JSON.stringify(currentPermissions)));
      // Use setTimeout to ensure state is set before resetting flag
      setTimeout(() => setIsInitialLoad(false), 0);
    }
  }, [isOpen, currentPermissions]);

  // Helper function to get color for permission level
  const getPermissionLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case 'NONE':
        return 'secondary';
      case 'READ':
        return 'primary';
      case 'WRITE':
        return 'warning';
      case 'ADMIN':
        return 'error';
      default:
        return 'secondary';
    }
  };

  // Use React Query for caching plant units - lazy load when plant tab is active
  const {
    data: plantUnits = [],
    isLoading: loadingPlantUnits,
    error: plantUnitsError,
  } = useQuery({
    queryKey: ['plant-units'],
    queryFn: async (): Promise<any[]> => {
      const { supabase } = await import('../../../utils/pocketbaseClient');
      const records = await supabase.collection('plant_units').getList(1, 100, {
        sort: 'category,unit',
      });

      return records.items || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: activeTab === 'plant', // Only fetch when plant tab is active
  });

  useEffect(() => {
    setPermissions(currentPermissions);
  }, [currentPermissions]);

  // Memoize expensive calculations
  const groupedPlantUnits = useMemo(() => {
    return plantUnits.reduce((acc: Record<string, any[]>, unit: any) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit);
      return acc;
    }, {});
  }, [plantUnits]);

  const permissionOptions = useMemo(
    () =>
      permissionLevels.map((level) => ({
        value: level,
        label: level,
        color: getPermissionLevelColor(level),
      })),
    []
  );

  const handlePermissionChange = useCallback(
    (feature: keyof PermissionMatrix, level: PermissionLevel) => {
      setPermissions((prevPermissions) => {
        const newPermissions = { ...prevPermissions };

        if (feature === 'plant_operations') {
          // Handle plant operations separately
          if (level === 'NONE') {
            newPermissions[feature] = {};
          } else {
            // Initialize with all plant units if not exists
            if (!newPermissions[feature] || typeof newPermissions[feature] === 'string') {
              newPermissions[feature] = {};
            }

            // Set permission for all units
            const plantOps = newPermissions[feature] as PlantOperationsPermissions;
            plantUnits.forEach((unit: any) => {
              if (!plantOps[unit.category]) {
                plantOps[unit.category] = {};
              }
              plantOps[unit.category][unit.unit] = level;
            });
          }
        } else {
          // Simple permission
          newPermissions[feature] = level;
        }

        return newPermissions;
      });
    },
    [plantUnits]
  );

  const handlePlantOperationPermissionChange = (
    category: string,
    unit: string,
    level: PermissionLevel
  ) => {
    const newPermissions = { ...permissions };
    const plantOps = newPermissions.plant_operations as PlantOperationsPermissions;

    if (!plantOps[category]) {
      plantOps[category] = {};
    }

    plantOps[category][unit] = level;
    setPermissions(newPermissions);
    // onPermissionsChange will be called by useEffect when permissions state changes
  };

  const getPermissionLevelIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'NONE':
        return <XMarkIcon className="w-3 h-3" />;
      case 'READ':
        return <EyeSlashIcon className="w-3 h-3" />;
      case 'WRITE':
        return <EditIcon className="w-3 h-3" />;
      case 'ADMIN':
        return <CogIcon className="w-3 h-3" />;
      default:
        return <XMarkIcon className="w-3 h-3" />;
    }
  };

  const getPermissionLevelLabel = (level: PermissionLevel) => {
    switch (level) {
      case 'NONE':
        return 'None';
      case 'READ':
        return 'Read';
      case 'WRITE':
        return 'Write';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'None';
    }
  };

  const permissionFeatures = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Access to main dashboard and analytics',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      key: 'plant_operations',
      label: 'Plant Operations',
      description: 'Access to plant operations and monitoring',
      icon: <CogIcon className="w-5 h-5" />,
    },
    {
      key: 'inspection',
      label: 'Inspection',
      description: 'Access to inspection and quality control',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      key: 'project_management',
      label: 'Project Management',
      description: 'Access to project management tools',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
  ];

  const UnitPermissionItem = React.memo<{
    unit: any;
    category: string;
    permissions: PermissionMatrix;
    onPermissionChange: (category: string, unit: string, level: PermissionLevel) => void;
    permissionLevels: PermissionLevel[];
    getPermissionLevelColor: (level: PermissionLevel) => string;
    getPermissionLevelLabel: (level: PermissionLevel) => string;
    getPermissionLevelIcon: (level: PermissionLevel) => React.ReactNode;
  }>(
    ({
      unit,
      category,
      permissions,
      onPermissionChange,
      permissionLevels,
      getPermissionLevelColor,
      getPermissionLevelLabel,
      getPermissionLevelIcon,
    }) => {
      const currentLevel =
        (permissions.plant_operations as PlantOperationsPermissions)?.[category]?.[unit.unit] ||
        'NONE';

      return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 p-2 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {unit.unit}
            </span>
            <EnhancedBadge
              variant={getPermissionLevelColor(currentLevel) as any}
              className="text-xs px-1.5 py-0.5"
            >
              {getPermissionLevelLabel(currentLevel)}
            </EnhancedBadge>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {permissionLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onPermissionChange(category, unit.unit, level)}
                className={`relative p-1 text-xs font-medium rounded border transition-all duration-150 transform hover:scale-105 ${
                  currentLevel === level
                    ? `border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-sm`
                    : `border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600`
                }`}
                title={`${unit.unit} - ${level}`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="text-xs">{getPermissionLevelIcon(level)}</div>
                  <span className="text-xs leading-none">{level}</span>
                </div>
                {currentLevel === level && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }
  );

  UnitPermissionItem.displayName = 'UnitPermissionItem';

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    console.log('PermissionMatrixEditor handleSave called');
    console.log('onSave prop exists:', !!onSave);
    console.log('onSave function:', onSave);
    console.log('Current permissions state:', permissions);

    setSaving(true);
    try {
      if (onSave) {
        console.log('Calling parent onSave function...');
        // Use parent save handler
        await onSave();
        console.log('Parent onSave completed, closing modal');
        onClose();
      } else {
        console.log('No onSave prop provided, using fallback');
        // Fallback to local save simulation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onClose();
      }
    } catch (err) {
      console.error('Error in handleSave:', err);
      setError('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User Permissions"
      size="xl"
      closeOnBackdrop={false}
      closeOnEscape={false}
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'general'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            General Permissions
          </button>
          <button
            onClick={() => setActiveTab('plant')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'plant'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Plant Operations
          </button>
        </div>

        {/* Custom Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permission Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure access levels for different modules and features
            </p>
          </div>
        </div>

        {/* General Permissions Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {permissionFeatures.map((feature) => (
                <div
                  key={feature.key}
                  className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {feature.label}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-6">
                        {permissionLevels.map((level) => {
                          const isSelected =
                            feature.key === 'plant_operations'
                              ? false // Handled separately
                              : permissions[feature.key as keyof PermissionMatrix] === level;

                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() =>
                                handlePermissionChange(feature.key as keyof PermissionMatrix, level)
                              }
                              className={`relative px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                                isSelected
                                  ? `border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-lg`
                                  : `border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {getPermissionLevelIcon(level)}
                                <span>{getPermissionLevelLabel(level)}</span>
                              </div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plant Operations Tab */}
        {activeTab === 'plant' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Plant Operations Access Control
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure granular permissions for each plant unit
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {Object.entries(groupedPlantUnits).map(([category, units]) => {
                const isCollapsed = collapsedCategories.has(category);
                return (
                  <div
                    key={category}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategoryCollapse(category)}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 p-3 text-left hover:from-primary-700 hover:to-primary-800 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CogIcon className="w-4 h-4 text-white" />
                          <span className="text-sm font-semibold text-white">{category}</span>
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                            {(units as Array<any>).length} units
                          </span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-white transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="p-3">
                        {(units as Array<any>).length > 50 ? (
                          <VirtualTable
                            data={units as Array<any>}
                            itemHeight={80}
                            containerHeight={400}
                            renderRow={(unit) => (
                              <UnitPermissionItem
                                key={unit.id}
                                unit={unit}
                                category={category}
                                permissions={permissions}
                                onPermissionChange={handlePlantOperationPermissionChange}
                                permissionLevels={permissionLevels}
                                getPermissionLevelColor={getPermissionLevelColor}
                                getPermissionLevelLabel={getPermissionLevelLabel}
                                getPermissionLevelIcon={getPermissionLevelIcon}
                              />
                            )}
                          />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {(units as Array<any>).map((unit) => (
                              <UnitPermissionItem
                                key={unit.id}
                                unit={unit}
                                category={category}
                                permissions={permissions}
                                onPermissionChange={handlePlantOperationPermissionChange}
                                permissionLevels={permissionLevels}
                                getPermissionLevelColor={getPermissionLevelColor}
                                getPermissionLevelLabel={getPermissionLevelLabel}
                                getPermissionLevelIcon={getPermissionLevelIcon}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Reset to Default Button */}
          {onResetToDefault && (
            <EnhancedButton
              variant="outline"
              onClick={onResetToDefault}
              disabled={saving}
              className="px-4 py-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/20"
            >
              <div className="flex items-center gap-2">
                <CogIcon className="w-4 h-4" />
                Reset to Default
              </div>
            </EnhancedButton>
          )}

          {/* Right-aligned action buttons */}
          <div className="flex gap-3">
            <EnhancedButton
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2"
            >
              <div className="flex items-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </div>
            </EnhancedButton>

            <EnhancedButton
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
            >
              <div className="flex items-center gap-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save Permissions
                  </>
                )}
              </div>
            </EnhancedButton>
          </div>
        </div>
      </div>
    </EnhancedModal>
  );
};

export default PermissionMatrixEditor;

