import React, { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import { translations } from "../../../translations";
import { UserRole, PermissionMatrix } from "../../../types";
import PermissionMatrixEditor from "./PermissionMatrixEditor";

// Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedModal,
  EnhancedBadge,
} from "../../../components/ui/EnhancedComponents";

// Icons
import UserIcon from "../../../components/icons/UserIcon";
import EyeSlashIcon from "../../../components/icons/EyeSlashIcon";
import ShieldCheckIcon from "../../../components/icons/ShieldCheckIcon";
import CheckIcon from "../../../components/icons/CheckIcon";
import XMarkIcon from "../../../components/icons/XMarkIcon";
import ExclamationTriangleIcon from "../../../components/icons/ExclamationTriangleIcon";

interface UserFormProps {
  user?: any; // For editing
  onClose: () => void;
  onSuccess: () => void;
  language?: "en" | "id";
  isOpen?: boolean; // Add isOpen prop
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onClose,
  onSuccess,
  language = "en",
  isOpen = true, // Default to true for backward compatibility
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "Guest" as UserRole,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isPermissionEditorOpen, setIsPermissionEditorOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<PermissionMatrix>({
    dashboard: "NONE",
    plant_operations: {},
    packing_plant: "NONE",
    project_management: "NONE",
    system_settings: "NONE",
    user_management: "NONE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        password: "", // Don't show existing password
        confirmPassword: "",
        full_name: user.full_name || "",
        role: user.role || "Guest",
        is_active: user.is_active ?? true,
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Password validation (only for new users or when password is provided)
    if (!user || formData.password) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    // Full name validation
    if (formData.full_name && formData.full_name.length > 100) {
      errors.full_name = "Full name must be less than 100 characters";
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
    setError("");

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
        submitData.password_hash = formData.password; // Plain text as per requirements
      }

      if (user) {
        // Update user
        const { error: updateError } = await supabase
          .from("users")
          .update(submitData)
          .eq("id", user.id);

        if (updateError) throw updateError;
      } else {
        // Create new user
        const { error: insertError } = await supabase
          .from("users")
          .insert(submitData);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("User save error:", err);
      setError(err.message || "Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "gray" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "error" };
    if (strength <= 3) return { strength, label: "Fair", color: "warning" };
    if (strength <= 4) return { strength, label: "Good", color: "primary" };
    return { strength, label: "Strong", color: "success" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handlePermissionsChange = (newPermissions: PermissionMatrix) => {
    setUserPermissions(newPermissions);
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        user
          ? t.edit_user_title || "Edit User"
          : t.add_user_title || "Add New User"
      }
      size="lg"
      closeOnBackdrop={true}
      closeOnEscape={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.username || "Username"} *
          </label>
          <EnhancedInput
            value={formData.username}
            onChange={(value) => handleChange("username", value)}
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
              {t.password || "Password"}{" "}
              {user ? "(leave blank to keep current)" : "*"}
            </label>
            <EnhancedInput
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(value) => handleChange("password", value)}
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
                      passwordStrength.color === "error"
                        ? "bg-red-500"
                        : passwordStrength.color === "warning"
                        ? "bg-yellow-500"
                        : passwordStrength.color === "primary"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength.color === "error"
                      ? "text-red-600"
                      : passwordStrength.color === "warning"
                      ? "text-yellow-600"
                      : passwordStrength.color === "primary"
                      ? "text-blue-600"
                      : "text-green-600"
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
              {t.confirm_password || "Confirm Password"}{" "}
              {user ? "(leave blank to keep current)" : "*"}
            </label>
            <EnhancedInput
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(value) => handleChange("confirmPassword", value)}
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
            {t.full_name_label || "Full Name"}
          </label>
          <EnhancedInput
            value={formData.full_name}
            onChange={(value) => handleChange("full_name", value)}
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
            {t.role_label || "Role"} *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "Guest", label: "Guest", color: "secondary" },
              { value: "Operator", label: "Operator", color: "primary" },
              { value: "Admin", label: "Admin", color: "warning" },
              { value: "Super Admin", label: "Super Admin", color: "error" },
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleChange("role", role.value)}
                className={`p-3 border rounded-lg text-center transition-all ${
                  formData.role === role.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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
                formData.is_active ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {t.user_is_active_label || "User Status"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formData.is_active
                  ? "User is active and can log in"
                  : "User is inactive and cannot log in"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleChange("is_active", !formData.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.is_active ? "bg-green-600" : "bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_active ? "translate-x-6" : "translate-x-1"
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
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => setIsPermissionEditorOpen(true)}
              icon={<ShieldCheckIcon className="w-4 h-4" />}
            >
              Edit Permissions
            </EnhancedButton>
          </div>

          {/* Permission Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(userPermissions).map(([key, value]) => {
              if (key === "plant_operations") {
                const plantOpsCount = Object.keys(value as any).length;
                return (
                  <div
                    key={key}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    <span className="font-medium">Plant Operations:</span>{" "}
                    {plantOpsCount > 0 ? `${plantOpsCount} categories` : "None"}
                  </div>
                );
              }
              return (
                <div
                  key={key}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  <span className="font-medium">{key.replace("_", " ")}:</span>{" "}
                  {value === "NONE" ? "None" : value.toLowerCase()}
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
              <span className="text-red-800 dark:text-red-200 font-medium">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <EnhancedButton
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t.cancel_button || "Cancel"}
          </EnhancedButton>

          <EnhancedButton
            variant="primary"
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            icon={
              user ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )
            }
          >
            {isLoading
              ? t.loading || "Saving..."
              : user
              ? t.save_button || "Update User"
              : t.save_button || "Create User"}
          </EnhancedButton>
        </div>
      </form>

      {/* Permission Matrix Editor */}
      <PermissionMatrixEditor
        userId={user?.id || ""}
        currentPermissions={userPermissions}
        onPermissionsChange={handlePermissionsChange}
        onClose={() => setIsPermissionEditorOpen(false)}
        isOpen={isPermissionEditorOpen}
        language={language}
      />
    </EnhancedModal>
  );
};

export default UserForm;
