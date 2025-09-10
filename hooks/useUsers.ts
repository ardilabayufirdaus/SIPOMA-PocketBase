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
  // Removed Department import since column deleted
} from "../types";
import { Database } from "../types/supabase";
import useErrorHandler from "./useErrorHandler";

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

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } else {
      const parsedData = (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as UserRole,
        avatar_url: user.avatar_url ?? undefined,
        last_active: new Date(user.last_active),
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        permissions: user.permissions as unknown as PermissionMatrix,
      }));
      setUsers(parsedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = useCallback(
    async (
      user: AddUserData,
      plantUnits: PlantUnit[]
    ): Promise<{ success: boolean; tempPassword?: string; error?: string }> => {
      try {
        const permissions =
          user.permissions ||
          getDefaultPermissionsByRole(user.role, plantUnits);

        // Generate password random untuk pembuatan pengguna baru
        const tempPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12);

        // Step 1: Check if user profile already exists by email
        const { data: existingUsers, error: checkError } = await supabase
          .from("users")
          .select("id, email")
          .eq("email", user.email)
          .limit(1);

        if (checkError) {
          console.error("Error checking existing user:", checkError);
          return { success: false, error: "Failed to check existing user" };
        }

        if (existingUsers && existingUsers.length > 0) {
          return {
            success: false,
            error: "User with this email already exists",
          };
        }

        // Step 2: Create profile in users table directly
        const newUserPayload: Database["public"]["Tables"]["users"]["Insert"] =
          {
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            is_active: true,
            last_active: new Date().toISOString(),
            permissions: permissions as any,
            avatar_url: user.avatar_url || null,
            password: tempPassword, // Store password directly in users table
          } as any;

        const { data, error } = await supabase
          .from("users")
          .insert([newUserPayload])
          .select("*");

        if (error) {
          console.error("Error adding user profile:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });

          // Handle specific 409 conflict error
          if (
            error.code === "23505" ||
            error.message?.includes("duplicate key") ||
            error.message?.includes("already exists")
          ) {
            return {
              success: false,
              error: "User with this email already exists",
            };
          }

          return { success: false, error: error.message };
        } else {
          console.log("User profile created successfully!", data);
          console.log("📧 Email:", user.email);
          console.log("🔑 Temporary Password:", tempPassword);
          console.log("⚠️  User should change password on first login");
          fetchUsers();
          return { success: true, tempPassword };
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "Unexpected error occurred" };
      }
    },
    [fetchUsers]
  );

  const updateUser = useCallback(
    async (updatedUser: User) => {
      try {
        const { id, created_at, last_active, ...updateData } = updatedUser;

        // Update user profile directly in users table
        const { error } = await supabase
          .from("users")
          .update({
            ...updateData,
            last_active: new Date().toISOString(),
          } as any)
          .eq("id", id);

        if (error) {
          console.error("Error updating user profile:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw new Error(`Failed to update user profile: ${error.message}`);
        } else {
          await fetchUsers();
        }
      } catch (err) {
        console.error("Unexpected error updating user:", err);
        throw err; // Re-throw to allow caller to handle
      }
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        // Check if user exists and get their role
        const userToDelete = users.find((u) => u.id === userId);
        if (!userToDelete) {
          console.error("User not found");
          return;
        }

        // Prevent deletion of Super Admin users
        if (userToDelete.role === UserRole.SUPER_ADMIN) {
          console.error("Cannot delete Super Admin users");
          return;
        }

        // Delete from users table directly
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

        if (error) {
          console.error("Error deleting user profile:", error);
          throw new Error(`Failed to delete user profile: ${error.message}`);
        }

        await fetchUsers();
      } catch (err) {
        console.error("Unexpected error deleting user:", err);
        // Optionally, propagate error or handle UI feedback here
      }
    },
    [users, fetchUsers]
  );

  const toggleUserStatus = useCallback(
    async (userId: string) => {
      const userToToggle = users.find((u) => u.id === userId);
      if (!userToToggle) return;

      const { error } = await supabase
        .from("users")
        .update({
          is_active: !userToToggle.is_active,
          last_active: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error toggling user status:", error);
      } else {
        fetchUsers();
      }
    },
    [users, fetchUsers]
  );

  return { users, loading, addUser, updateUser, deleteUser, toggleUserStatus };
};
