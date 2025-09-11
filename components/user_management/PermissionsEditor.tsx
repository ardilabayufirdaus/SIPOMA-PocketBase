
import React, { useState, useMemo } from 'react';
import { PermissionMatrix, PermissionLevel, PlantUnit } from '../../types';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface PermissionsEditorProps {
  permissions: PermissionMatrix;
  plantUnits: PlantUnit[];
  onPermissionChange: (permissions: PermissionMatrix) => void;
  t: any;
}

const PermissionsEditor: React.FC<PermissionsEditorProps> = ({ permissions, plantUnits, onPermissionChange, t }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const plantUnitsByCategory = useMemo(() => {
    return plantUnits.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit.unit);
      acc[unit.category].sort();
      return acc;
    }, {} as Record<string, string[]>);
  }, [plantUnits]) as Record<string, string[]>;

  const handlePermissionChange = (
    module: keyof PermissionMatrix,
    level: PermissionLevel
  ) => {
    const newPermissions = { ...permissions, [module]: level };
    onPermissionChange(newPermissions);
  };

  const handleCategoryPermissionChange = (
    category: string,
    level: PermissionLevel
  ) => {
    const updatedUnits = { ...permissions.plant_operations[category] };
    Object.keys(updatedUnits).forEach((unit) => {
      updatedUnits[unit] = level;
    });

    const newPermissions = {
      ...permissions,
      plant_operations: {
        ...permissions.plant_operations,
        [category]: updatedUnits,
      },
    };
    onPermissionChange(newPermissions);
  };

  const handleUnitPermissionChange = (
    category: string,
    unit: string,
    level: PermissionLevel
  ) => {
    const newPermissions = {
      ...permissions,
      plant_operations: {
        ...permissions.plant_operations,
        [category]: {
          ...permissions.plant_operations[category],
          [unit]: level,
        },
      },
    };
    onPermissionChange(newPermissions);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const modules: { key: keyof PermissionMatrix; label: string }[] = [
    { key: "dashboard", label: t.module_dashboard },
    { key: "user_management", label: t.module_user_management },
    { key: "packing_plant", label: t.module_packing_plant },
    { key: "project_management", label: t.module_project_management },
    { key: "system_settings", label: t.module_system_settings },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3 mb-5">
        {t.permissions_title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        {modules.map(({ key, label }) => (
          <div key={key}>
            <label
              htmlFor={`perm-${key}`}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {label}
            </label>
            <select
              id={`perm-${key}`}
              name={`perm-${key}`}
              value={permissions[key] as PermissionLevel}
              onChange={(e) =>
                handlePermissionChange(
                  key,
                  e.target.value as PermissionLevel
                )
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              {Object.values(PermissionLevel).map((level) => (
                <option key={level} value={level}>
                  {t[`permission_level_${level}`]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
          {t.module_plant_operations}
        </h4>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
          {Object.entries(plantUnitsByCategory).map(
            ([category, units]) => {
              const isExpanded = expandedCategories.has(category);
              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    aria-expanded={isExpanded}
                    aria-controls={`permissions-category-${category}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDownIcon
                        className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {category}
                      </span>
                    </div>
                    <div
                      className="w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value=""
                        onChange={(e) =>
                          handleCategoryPermissionChange(
                            category,
                            e.target.value as PermissionLevel
                          )
                        }
                        className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                      >
                        <option value="" disabled>
                          {t.set_for_all_units}
                        </option>
                        {Object.values(PermissionLevel).map((level) => (
                          <option key={level} value={level}>
                            {t[`permission_level_${level}`]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </button>
                  {isExpanded && (
                    <div
                      id={`permissions-category-${category}`}
                      className="pl-8 pr-3 pb-3"
                    >
                      <div className="border-l-2 border-slate-200 pl-6 pt-3 space-y-3">
                        {units.map((unit) => (
                          <div
                            key={unit}
                            className="flex items-center justify-between"
                          >
                            <label className="text-sm text-slate-600">
                              {unit}
                            </label>
                            <select
                              value={
                                permissions.plant_operations[
                                  category
                                ]?.[unit] || PermissionLevel.NONE
                              }
                              onChange={(e) =>
                                handleUnitPermissionChange(
                                  category,
                                  unit,
                                  e.target.value as PermissionLevel
                                )
                              }
                              className="w-48 pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                            >
                              {Object.values(PermissionLevel).map(
                                (level) => (
                                  <option key={level} value={level}>
                                    {t[`permission_level_${level}`]}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsEditor;
