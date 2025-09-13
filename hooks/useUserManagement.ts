// ...existing code...
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import {
  User,
  AddUserData,
  UserRole,
  PermissionMatrix,
  PermissionLevel,
  PlantUnit,
  PlantOperationsPermissions,
} from "../types";
import useErrorHandler from "./useErrorHandler";

/**
 * Helper untuk generate permission plant operations berdasarkan unit dan kategori
 * @param plantUnits Daftar unit plant
 * @param getPermission Fungsi untuk menentukan permission per kategori/unit
 * @returns PlantOperationsPermissions
 */
export const generatePlantOpsPermissions = (
  plantUnits: PlantUnit[],
  getPermission: (category: string, unit: string) => PermissionLevel
): PlantOperationsPermissions => {
  const permissions: PlantOperationsPermissions = {};
  plantUnits.forEach((unit) => {
    if (!permissions[unit.category]) permissions[unit.category] = {};
    permissions[unit.category][unit.unit] = getPermission(
      unit.category,
      unit.unit
    );
  });
  return permissions;
};

/**
 * Helper untuk mendapatkan default permission matrix berdasarkan role user
 * @param role Role user
 * @param plantUnits Daftar unit plant
 * @returns PermissionMatrix
 */
// ...existing code...

/**
 * Custom hook untuk manajemen user pada aplikasi.
 * Menyediakan API CRUD, pengaturan permission, dan utilitas terkait user management.
 * @param currentUser User yang sedang login (opsional)
 * @returns Object API user management
 */
export const useUserManagement = (currentUser?: User | null) => {
  // --- State ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();
  const hasUserManagementAccess = currentUser?.role === "Super Admin";

  // Fetch users from view user_list (permissions from user_permissions)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_list")
        .select(
          "id, username, full_name, role, last_active, is_active, avatar_url, created_at, permissions"
        );
      if (error) throw error;
      const mapped = (data || []).map((u: any) => ({
        ...u,
        last_active: u.last_active ? new Date(u.last_active) : undefined,
        created_at: u.created_at ? new Date(u.created_at) : undefined,
        permissions: u.permissions,
      }));
      setUsers(mapped);
    } catch (err) {
      handleError(err, "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Add user
  const addUser = useCallback(
    async (userData: AddUserData) => {
      try {
        // Prepare user insert (remove permissions)
        const userInsert = {
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role,
          avatar_url: userData.avatar_url,
          is_active: userData.is_active,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        // @ts-expect-error: bypass type error for custom view/table
        const { error: userError, data: userDataResult } = await supabase
          .from("users")
          .insert([userInsert as any])
          .select();
        if (userError) throw userError;
        const userId = (userDataResult && (userDataResult as any)[0]?.id) as
          | string
          | undefined;
        if (userId) {
          const permInsert = {
            user_id: userId,
            dashboard: userData.permissions.dashboard,
            user_management: userData.permissions.user_management,
            plant_operations: userData.permissions.plant_operations,
            packing_plant: userData.permissions.packing_plant,
            project_management: userData.permissions.project_management,
            system_settings: userData.permissions.system_settings,
          };
          // @ts-expect-error: bypass type error for custom view/table
          const { error: permError } = await supabase
            .from("user_permissions")
            .insert([permInsert as any]);
          if (permError) throw permError;
        }
        fetchUsers();
      } catch (err) {
        handleError(err, "Error adding user");
      }
    },
    [fetchUsers, handleError]
  );

  // Update user
  const updateUser = useCallback(
    async (userId: string, updates: Partial<User>) => {
      try {
        // Prepare user update (remove permissions)
        const userFields: any = { ...updates };
        delete userFields.permissions;
        if (userFields.created_at && userFields.created_at instanceof Date) {
          userFields.created_at = userFields.created_at.toISOString();
        }
        if (userFields.last_active && userFields.last_active instanceof Date) {
          userFields.last_active = userFields.last_active.toISOString();
        }
        if (Object.keys(userFields).length > 0) {
          // @ts-expect-error: bypass type error for custom view/table
          const { error: userError } = await supabase
            .from("users")
            .update(userFields as any)
            .eq("id", userId);
          if (userError) throw userError;
        }
        // Prepare permissions update
        if (updates.permissions) {
          const permUpdate = {
            dashboard: updates.permissions.dashboard,
            user_management: updates.permissions.user_management,
            plant_operations: updates.permissions.plant_operations,
            packing_plant: updates.permissions.packing_plant,
            project_management: updates.permissions.project_management,
            system_settings: updates.permissions.system_settings,
          };
          // @ts-expect-error: bypass type error for custom view/table
          const { error: permError } = await supabase
            .from("user_permissions")
            .update(permUpdate as any)
            .eq("user_id", userId);
          if (permError) throw permError;
        }
        fetchUsers();
      } catch (err) {
        handleError(err, "Error updating user");
      }
    },
    [fetchUsers, handleError]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      if (!hasUserManagementAccess)
        throw new Error("Access denied. Only Super Admin can delete users.");
      try {
        const userToDelete = users.find((u) => u.id === userId);
        if (!userToDelete) throw new Error("User not found");
        if (userToDelete.role === UserRole.SUPER_ADMIN)
          throw new Error("Cannot delete Super Admin users");
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);
        if (error) throw error;
        fetchUsers();
      } catch (err) {
        handleError(err, "Error deleting user");
      }
    },
    [users, fetchUsers, handleError, hasUserManagementAccess]
  );

  // Toggle user status
  const toggleUserStatus = useCallback(
    async (userId: string) => {
      if (!hasUserManagementAccess)
        throw new Error(
          "Access denied. Only Super Admin can toggle user status."
        );
      const userToToggle = users.find((u) => u.id === userId);
      if (!userToToggle) return;
      try {
        // bypass type error for custom view/table
        const { error } = await supabase
          .from("users")
          .update({
            is_active: !userToToggle.is_active,
            last_active: new Date().toISOString(),
          } as unknown as any)
          .eq("id", userId);
        if (error) throw error;
        fetchUsers();
      } catch (error) {
        handleError(error, "Error toggling user status");
      }
    },
    [users, fetchUsers, handleError, hasUserManagementAccess]
  );

  // API yang diekspor oleh hooks useUserManagement
  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  };
};

/**
 * Helper untuk mendapatkan default permission matrix berdasarkan role user
 * @param role Role user
 * @param plantUnits Daftar unit plant
 * @returns PermissionMatrix
 */
export const getDefaultPermissionsByRole = (
  role: UserRole,
  plantUnits: PlantUnit[]
): PermissionMatrix => {
  const baseMatrix = {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.NONE,
    plant_operations: {},
    packing_plant: PermissionLevel.NONE,
    project_management: PermissionLevel.NONE,
    system_settings: PermissionLevel.NONE,
  };
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return {
        dashboard: PermissionLevel.ADMIN,
        user_management: PermissionLevel.ADMIN,
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          () => PermissionLevel.ADMIN
        ),
        packing_plant: PermissionLevel.ADMIN,
        project_management: PermissionLevel.ADMIN,
        system_settings: PermissionLevel.ADMIN,
      };
    case UserRole.MANAGER:
      return {
        dashboard: PermissionLevel.ADMIN,
        user_management: PermissionLevel.READ,
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          () => PermissionLevel.ADMIN
        ),
        packing_plant: PermissionLevel.ADMIN,
        project_management: PermissionLevel.ADMIN,
        system_settings: PermissionLevel.WRITE,
      };
    case UserRole.SUPERVISOR:
      return {
        ...baseMatrix,
        plant_operations: generatePlantOpsPermissions(plantUnits, (category) =>
          ["Production", "Quality Control", "Control Room"].includes(category)
            ? PermissionLevel.WRITE
            : PermissionLevel.READ
        ),
        packing_plant: PermissionLevel.WRITE,
        project_management: PermissionLevel.READ,
      };
    case UserRole.OPERATOR:
      return {
        ...baseMatrix,
        plant_operations: generatePlantOpsPermissions(plantUnits, (category) =>
          ["Production", "Control Room"].includes(category)
            ? PermissionLevel.WRITE
            : category === "Quality Control"
            ? PermissionLevel.READ
            : PermissionLevel.NONE
        ),
        packing_plant: PermissionLevel.WRITE,
      };
    case UserRole.VIEWER:
      return {
        dashboard: PermissionLevel.READ,
        user_management: PermissionLevel.READ,
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          () => PermissionLevel.READ
        ),
        packing_plant: PermissionLevel.READ,
        project_management: PermissionLevel.READ,
        system_settings: PermissionLevel.READ,
      };
    default:
      return {
        dashboard: PermissionLevel.NONE,
        user_management: PermissionLevel.NONE,
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          () => PermissionLevel.NONE
        ),
        packing_plant: PermissionLevel.NONE,
        project_management: PermissionLevel.NONE,
        system_settings: PermissionLevel.NONE,
      };
  }
};
