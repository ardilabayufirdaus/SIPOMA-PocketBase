import React, { useState, useEffect } from "react";
import {
  PermissionMatrix,
  PlantOperationsPermissions,
  PermissionLevel,
} from "../../../types";
import { supabase } from "../../../utils/supabaseClient";
import { translations } from "../../../translations";

// Enhanced Components
import {
  EnhancedCard,
  EnhancedButton,
  EnhancedBadge,
  EnhancedModal,
} from "../../../components/ui/EnhancedComponents";

// Icons
import ShieldCheckIcon from "../../../components/icons/ShieldCheckIcon";
import CheckIcon from "../../../components/icons/CheckIcon";
import XMarkIcon from "../../../components/icons/XMarkIcon";
import ExclamationTriangleIcon from "../../../components/icons/ExclamationTriangleIcon";
import EyeSlashIcon from "../../../components/icons/EyeSlashIcon";
import EditIcon from "../../../components/icons/EditIcon";
import CogIcon from "../../../components/icons/CogIcon";

interface PermissionMatrixEditorProps {
  userId: string;
  currentPermissions: PermissionMatrix;
  onPermissionsChange: (permissions: PermissionMatrix) => void;
  onSave?: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  language?: "en" | "id";
}

const PermissionMatrixEditor: React.FC<PermissionMatrixEditorProps> = ({
  userId,
  currentPermissions,
  onPermissionsChange,
  onSave,
  onClose,
  isOpen,
  language = "en",
}) => {
  const [permissions, setPermissions] =
    useState<PermissionMatrix>(currentPermissions);
  const [plantUnits, setPlantUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "plant">("general");

  const t = translations[language];

  useEffect(() => {
    setPermissions(currentPermissions);
    fetchPlantUnits();
  }, [currentPermissions]);

  const fetchPlantUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("plant_units")
        .select("*")
        .order("category", { ascending: true })
        .order("unit", { ascending: true });

      if (error) throw error;
      setPlantUnits(data || []);
    } catch (err: any) {
      console.error("Error fetching plant units:", err);
    }
  };

  const handlePermissionChange = (
    feature: keyof PermissionMatrix,
    level: PermissionLevel
  ) => {
    const newPermissions = { ...permissions };

    if (feature === "plant_operations") {
      // Handle plant operations separately
      if (level === "NONE") {
        newPermissions[feature] = {};
      } else {
        // Initialize with all plant units if not exists
        if (
          !newPermissions[feature] ||
          typeof newPermissions[feature] === "string"
        ) {
          newPermissions[feature] = {};
        }

        // Set permission for all units
        const plantOps = newPermissions[feature] as PlantOperationsPermissions;
        plantUnits.forEach((unit) => {
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

    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const handlePlantOperationPermissionChange = (
    category: string,
    unit: string,
    level: PermissionLevel
  ) => {
    const newPermissions = { ...permissions };
    const plantOps =
      newPermissions.plant_operations as PlantOperationsPermissions;

    if (!plantOps[category]) {
      plantOps[category] = {};
    }

    plantOps[category][unit] = level;
    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const getPermissionLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case "NONE":
        return "secondary";
      case "READ":
        return "primary";
      case "WRITE":
        return "warning";
      case "ADMIN":
        return "error";
      default:
        return "secondary";
    }
  };

  const getPermissionLevelIcon = (level: PermissionLevel) => {
    switch (level) {
      case "NONE":
        return <XMarkIcon className="w-3 h-3" />;
      case "READ":
        return <EyeSlashIcon className="w-3 h-3" />;
      case "WRITE":
        return <EditIcon className="w-3 h-3" />;
      case "ADMIN":
        return <CogIcon className="w-3 h-3" />;
      default:
        return <XMarkIcon className="w-3 h-3" />;
    }
  };

  const getPermissionLevelLabel = (level: PermissionLevel) => {
    switch (level) {
      case "NONE":
        return "None";
      case "READ":
        return "Read";
      case "WRITE":
        return "Write";
      case "ADMIN":
        return "Admin";
      default:
        return "None";
    }
  };

  const permissionFeatures = [
    {
      key: "dashboard",
      label: "Dashboard",
      description: "Access to main dashboard and analytics",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      key: "plant_operations",
      label: "Plant Operations",
      description: "Access to plant operations and monitoring",
      icon: <CogIcon className="w-5 h-5" />,
    },
    {
      key: "packing_plant",
      label: "Packing Plant",
      description: "Access to packing plant operations",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      key: "project_management",
      label: "Project Management",
      description: "Access to project management tools",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      key: "system_settings",
      label: "System Settings",
      description: "Access to system configuration",
      icon: <CogIcon className="w-5 h-5" />,
    },
    {
      key: "user_management",
      label: "User Management",
      description: "Access to user management features",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
  ];

  const permissionLevels: PermissionLevel[] = [
    "NONE",
    "READ",
    "WRITE",
    "ADMIN",
  ];

  const groupedPlantUnits = plantUnits.reduce((acc, unit) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        // Use parent save handler
        await onSave();
      } else {
        // Fallback to local save simulation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onClose();
      }
    } catch (err) {
      setError("Failed to save permissions");
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
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === "general"
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            General Permissions
          </button>
          <button
            onClick={() => setActiveTab("plant")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === "plant"
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {permissionFeatures.map((feature, index) => (
                <div
                  key={feature.key}
                  className="group relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
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
                            feature.key === "plant_operations"
                              ? false // Handled separately
                              : permissions[
                                  feature.key as keyof PermissionMatrix
                                ] === level;

                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() =>
                                handlePermissionChange(
                                  feature.key as keyof PermissionMatrix,
                                  level
                                )
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
        {activeTab === "plant" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Plant Operations Access Control
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure granular permissions for each plant unit
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedPlantUnits).map(
                ([category, units], categoryIndex) => (
                  <div
                    key={category}
                    className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    style={{ animationDelay: `${categoryIndex * 150}ms` }}
                  >
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CogIcon className="w-5 h-5" />
                        {category}
                      </h4>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(units as any[]).map((unit, unitIndex) => {
                          const currentLevel =
                            (
                              permissions.plant_operations as PlantOperationsPermissions
                            )?.[category]?.[unit.unit] || "NONE";

                          return (
                            <div
                              key={unit.id}
                              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-md p-4"
                              style={{
                                animationDelay: `${
                                  categoryIndex * 150 + unitIndex * 50
                                }ms`,
                              }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {unit.unit}
                                </span>
                                <div className="flex items-center gap-2">
                                  {getPermissionLevelIcon(currentLevel)}
                                  <EnhancedBadge
                                    variant={getPermissionLevelColor(
                                      currentLevel
                                    )}
                                    className="text-xs"
                                  >
                                    {getPermissionLevelLabel(currentLevel)}
                                  </EnhancedBadge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {permissionLevels.map((level) => (
                                  <button
                                    key={level}
                                    type="button"
                                    onClick={() =>
                                      handlePlantOperationPermissionChange(
                                        category,
                                        unit.unit,
                                        level
                                      )
                                    }
                                    className={`relative p-2 text-xs font-medium rounded-md border transition-all duration-200 transform hover:scale-105 ${
                                      currentLevel === level
                                        ? `border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-md`
                                        : `border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`
                                    }`}
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      {getPermissionLevelIcon(level)}
                                      <span>{level}</span>
                                    </div>
                                    {currentLevel === level && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              )}
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
              <span className="text-red-800 dark:text-red-200 font-medium">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
    </EnhancedModal>
  );
};

export default PermissionMatrixEditor;
