import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  AddUserData,
  UserRole,
  PermissionLevel,
  PermissionMatrix,
  PlantOperationsPermissions,
  PlantUnit,
} from "../types";
import { getDefaultPermissionsByRole } from "../hooks/useUsers";
import { validators, validateForm } from "../utils/validation";
import ChevronDownIcon from "./icons/ChevronDownIcon";

interface UserFormProps {
  userToEdit: User | null;
  onSave: (user: User | AddUserData) => void;
  onCancel: () => void;
  t: any;
  plantUnits: PlantUnit[];
}

const UserForm: React.FC<UserFormProps> = ({
  userToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

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

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: UserRole.OPERATOR,
    is_active: true,
    permissions: getDefaultPermissionsByRole(UserRole.OPERATOR, plantUnits),
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const validationRules = {
    full_name: [
      (value: string) => validators.required(value, "Full name"),
      (value: string) => validators.minLength(value, 2, "Full name"),
      (value: string) => validators.maxLength(value, 100, "Full name"),
    ],
    email: [
      (value: string) => validators.required(value, "Email"),
      (value: string) => validators.email(value),
    ],
    password: [
      (value: string) => validators.required(value, "Password"),
      (value: string) => validators.minLength(value, 8, "Password"),
    ],
    role: [(value: string) => validators.required(value, "Role")],
  };

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        full_name: userToEdit.full_name,
        email: userToEdit.email,
        password: "", // Password tidak ditampilkan saat edit
        role: userToEdit.role,
        is_active: userToEdit.is_active,
        permissions:
          userToEdit.permissions ||
          getDefaultPermissionsByRole(userToEdit.role, plantUnits),
      });
    } else {
      // Reset form untuk add user - pastikan semua field kosong
      const defaultRole = UserRole.OPERATOR;
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: defaultRole,
        is_active: true,
        permissions: getDefaultPermissionsByRole(defaultRole, plantUnits),
      });
    }

    // Reset errors dan touched state saat mode berubah
    setErrors({});
    setTouched({});
  }, [userToEdit, plantUnits]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "role") {
      const newRole = value as UserRole;
      setFormData((prev) => ({
        ...prev,
        role: newRole,
        permissions: getDefaultPermissionsByRole(newRole, plantUnits),
      }));
    } else if (name === "department") {
      // Removed department handling since column is removed
      // Ignore or handle gracefully
      return;
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field on blur
    if (validationRules[name as keyof typeof validationRules]) {
      const fieldRules = validationRules[name as keyof typeof validationRules];
      for (const rule of fieldRules) {
        const result = rule(formData[name as keyof typeof formData] as string);
        if (!result.isValid && result.error) {
          setErrors((prev) => ({ ...prev, [name]: result.error! }));
          break;
        }
      }
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePermissionChange = (
    module: keyof PermissionMatrix,
    level: PermissionLevel
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: level,
      },
    }));
  };

  const handleCategoryPermissionChange = (
    category: string,
    level: PermissionLevel
  ) => {
    const updatedUnits = { ...formData.permissions.plant_operations[category] };
    Object.keys(updatedUnits).forEach((unit) => {
      updatedUnits[unit] = level;
    });

    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        plant_operations: {
          ...prev.permissions.plant_operations,
          [category]: updatedUnits,
        },
      },
    }));
  };

  const handleUnitPermissionChange = (
    category: string,
    unit: string,
    level: PermissionLevel
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        plant_operations: {
          ...prev.permissions.plant_operations,
          [category]: {
            ...prev.permissions.plant_operations[category],
            [unit]: level,
          },
        },
      },
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const validation = validateForm(formData, validationRules);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setIsSubmitting(false);
      // Mark all fields as touched to show errors
      const touchedFields = Object.keys(validationRules).reduce(
        (acc, field) => {
          acc[field] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setTouched(touchedFields);
      return;
    }

    try {
      if (userToEdit) {
        // Pastikan permissions selalu di-include saat edit user
        const updatedUser = {
          ...userToEdit,
          ...formData,
          permissions: formData.permissions, // Explicitly include permissions
        };
        await onSave(updatedUser);
      } else {
        // Untuk add user, gunakan AddUserData dengan password
        const newUser: AddUserData = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
          permissions: formData.permissions,
        };
        await onSave(newUser);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      // Handle save error - could show toast or set form error
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules: { key: keyof PermissionMatrix; label: string }[] = [
    { key: "dashboard", label: t.module_dashboard },
    { key: "user_management", label: t.module_user_management },
    { key: "packing_plant", label: t.module_packing_plant },
    { key: "project_management", label: t.module_project_management },
    { key: "system_settings", label: t.module_system_settings },
  ];

  return (
    <form
      onSubmit={(e) => {
        handleSubmit(e);
      }}
    >
      <div className="max-h-[70vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-5 lg:divide-x lg:divide-slate-200 dark:lg:divide-slate-700">
        {/* Section 1: User Details (Left Column) */}
        <div className="lg:col-span-2 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3 mb-5">
              {t.user_details_title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.full_name_label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.full_name && touched.full_name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500"
                  }`}
                  aria-invalid={
                    errors.full_name && touched.full_name ? "true" : "false"
                  }
                  aria-describedby={
                    errors.full_name && touched.full_name
                      ? "full_name-error"
                      : undefined
                  }
                />
                {errors.full_name && touched.full_name && (
                  <p
                    id="full_name-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.full_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.email_label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="off"
                  placeholder="Enter email address"
                  className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.email && touched.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500"
                  }`}
                  aria-invalid={
                    errors.email && touched.email ? "true" : "false"
                  }
                  aria-describedby={
                    errors.email && touched.email ? "email-error" : undefined
                  }
                />
                {errors.email && touched.email && (
                  <p
                    id="email-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>
              {!userToEdit && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {t.password_label || "Password"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    placeholder="Enter password"
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.password && touched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500"
                    }`}
                    aria-invalid={
                      errors.password && touched.password ? "true" : "false"
                    }
                    aria-describedby={
                      errors.password && touched.password
                        ? "password-error"
                        : undefined
                    }
                  />
                  {errors.password && touched.password && (
                    <p
                      id="password-error"
                      className="mt-1 text-sm text-red-600"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.role_label}
                </label>
                <select
                  name="role"
                  id="role"
                  value={formData.role ?? UserRole.OPERATOR}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {userToEdit && (
                <div className="sm:col-span-2 flex items-center pt-2">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-3 block text-sm text-slate-900 dark:text-slate-100"
                  >
                    {t.user_is_active_label}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Module Permissions (Right Column) */}
        <div className="lg:col-span-3 p-6 space-y-6">
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
                    value={formData.permissions[key] as PermissionLevel}
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
                                      formData.permissions.plant_operations[
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
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
        >
          {t.cancel_button}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-semibold text-white border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t.saving || "Saving..."}
            </div>
          ) : (
            t.save_button
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
