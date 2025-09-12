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
import { Database } from "../types/supabase";
import useErrorHandler from "./useErrorHandler";
import { api } from "../utils/api";

const generatePlantOpsPermissions = (
  plantUnits: PlantUnit[],
  getPermission: (category: string, unit: string) => PermissionLevel
): PlantOperationsPermissions => {
  const permissions: PlantOperationsPermissions = {};
  plantUnits.forEach((unit) => {
    if (!permissions[unit.category]) {
      permissions[unit.category] = {};
    }
    permissions[unit.category][unit.unit] = getPermission(
      unit.category,
      unit.unit
    );
  });
  return permissions;
};

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
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          (category) => {
            if (
              category === "Production" ||
              category === "Quality Control" ||
              category === "Control Room"
            ) {
              return PermissionLevel.WRITE;
            }
            return PermissionLevel.READ;
          }
        ),
        packing_plant: PermissionLevel.WRITE,
        project_management: PermissionLevel.READ,
      };
    case UserRole.OPERATOR:
      return {
        ...baseMatrix,
        plant_operations: generatePlantOpsPermissions(
          plantUnits,
          (category) => {
            if (category === "Production" || category === "Control Room")
              return PermissionLevel.WRITE;
            if (category === "Quality Control") return PermissionLevel.READ;
            return PermissionLevel.NONE;
          }
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

export const useUserManagement = (currentUser?: User | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  // Role-based access control check
  const hasUserManagementAccess = currentUser?.role === "Super Admin";

  const fetchUsers = useCallback(async () => {
    // Only Super Admin can fetch users
    if (!hasUserManagementAccess) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use raw query with type assertion to get users with permissions
      const { data, error } = await (supabase as any)
        .from("user_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      const parsedData = (data || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email || "",
        full_name: user.full_name,
        role: user.role as UserRole,
        avatar_url: user.avatar_url ?? undefined,
        last_active: new Date(user.last_active),
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        permissions: user.permissions as unknown as PermissionMatrix,
      }));
      setUsers(parsedData);
    } catch (error) {
      handleError(error, "Error fetching users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, hasUserManagementAccess]);

  const addUser = useCallback(
    async (
      user: AddUserData,
      plantUnits: PlantUnit[]
    ): Promise<{ success: boolean; tempPassword?: string; error?: string }> => {
      // Only Super Admin can add users
      if (!hasUserManagementAccess) {
        return {
          success: false,
          error: "Access denied. Only Super Admin can add users.",
        };
      }

      try {
        const permissions =
          user.permissions ||
          getDefaultPermissionsByRole(user.role, plantUnits);

        const tempPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12);

        // Create user in users table first
        const { data: newUser, error: userError } = await (supabase as any)
          .from("users")
          .insert({
            username: user.username,
            email: user.email || `${user.username}@sig.id`,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active ?? true,
            password: tempPassword,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          })
          .select()
          .single();

        if (userError) {
          throw userError;
        }

        // Create permissions in user_permissions table
        const { error: permissionsError } = await (supabase as any)
          .from("user_permissions")
          .insert({
            user_id: newUser.id,
            dashboard: permissions.dashboard,
            user_management: permissions.user_management,
            plant_operations: permissions.plant_operations,
            packing_plant: permissions.packing_plant,
            project_management: permissions.project_management,
            system_settings: permissions.system_settings,
          });

        if (permissionsError) {
          // If permissions insert fails, we should ideally rollback the user creation
          // For now, we'll just log the error and continue
          console.warn(
            "Failed to create permissions for user:",
            permissionsError
          );
        }

        fetchUsers();
        return { success: true, tempPassword };
      } catch (err) {
        handleError(err, "Error adding user");
        return { success: false, error: "Unexpected error occurred" };
      }
    },
    [fetchUsers, handleError, hasUserManagementAccess]
  );

  const updateUser = useCallback(
    async (updatedUser: User) => {
      // Only Super Admin can update users
      if (!hasUserManagementAccess) {
        throw new Error("Access denied. Only Super Admin can update users.");
      }

      try {
        const { id, created_at, last_active, ...updateData } = updatedUser;

        const { error } = await supabase
          .from("users")
          .update({
            ...updateData,
            last_active: new Date().toISOString(),
          } as any)
          .eq("id", id);

        if (error) {
          throw error;
        }
        await fetchUsers();
      } catch (err) {
        handleError(err, "Error updating user");
        throw err;
      }
    },
    [fetchUsers, handleError, hasUserManagementAccess]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      // Only Super Admin can delete users
      if (!hasUserManagementAccess) {
        throw new Error("Access denied. Only Super Admin can delete users.");
      }

      try {
        const userToDelete = users.find((u) => u.id === userId);
        if (!userToDelete) {
          throw new Error("User not found");
        }

        if (userToDelete.role === UserRole.SUPER_ADMIN) {
          throw new Error("Cannot delete Super Admin users");
        }

        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

        if (error) {
          throw error;
        }

        await fetchUsers();
      } catch (err) {
        handleError(err, "Error deleting user");
      }
    },
    [users, fetchUsers, handleError, hasUserManagementAccess]
  );

  const toggleUserStatus = useCallback(
    async (userId: string) => {
      // Only Super Admin can toggle user status
      if (!hasUserManagementAccess) {
        throw new Error(
          "Access denied. Only Super Admin can toggle user status."
        );
      }

      const userToToggle = users.find((u) => u.id === userId);
      if (!userToToggle) return;

      try {
        const { error } = await supabase
          .from("users")
          .update({
            is_active: !userToToggle.is_active,
            last_active: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }
        fetchUsers();
      } catch (error) {
        handleError(error, "Error toggling user status");
      }
    },
    [users, fetchUsers, handleError, hasUserManagementAccess]
  );

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    fetchUsers,
    hasUserManagementAccess, // Export access control state
  };
};
