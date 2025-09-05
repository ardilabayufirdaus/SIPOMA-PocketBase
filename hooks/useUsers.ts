import { useState, useCallback, useEffect } from "react";
import { supabase } from "../utils/supabase";
import {
  createUserWithAdmin,
  updateUserWithAdmin,
  deleteUserWithAdmin,
} from "../utils/supabaseAdmin";
import {
  User,
  UserRole,
  PermissionMatrix,
  PermissionLevel,
  PlantUnit,
  PlantOperationsPermissions,
  Department,
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
        department: user.department as Department,
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
      user: Omit<User, "id" | "created_at" | "last_active">,
      plantUnits: PlantUnit[]
    ): Promise<{ success: boolean; tempPassword?: string; error?: string }> => {
      try {
        const permissions =
          user.permissions ||
          getDefaultPermissionsByRole(user.role, plantUnits);

        // Generate temporary password
        const tempPassword =
          "TempPass" + Math.random().toString(36).slice(-8) + "!";

        console.log("Creating user with admin API:", user.email);

        // Step 1: Create user in Supabase Auth using admin API
        const { user: authUser, error: authError } = await createUserWithAdmin(
          user.email,
          tempPassword,
          {
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            permissions,
            avatar_url: user.avatar_url,
          }
        );

        if (authError) {
          console.error("Error creating auth user:", authError);

          // Jika user sudah ada, coba ambil user existing
          if (
            authError.message?.includes("already registered") ||
            authError.message?.includes("already exists")
          ) {
            console.log(
              "User already exists, trying to create profile only..."
            );

            // Coba buat profile tanpa auth user (akan gagal jika ada foreign key)
            const newUserPayload: Database["public"]["Tables"]["users"]["Insert"] =
              {
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department,
                is_active: true,
                last_active: new Date().toISOString(),
                permissions: permissions as any,
                avatar_url: user.avatar_url || null,
              };

            const { data, error } = await supabase
              .from("users")
              .insert([newUserPayload])
              .select("*");

            if (error) {
              console.error("Error adding user profile:", error);
              // Coba cari user yang ada berdasarkan email
              const { data: existingUsers } = await supabase
                .from("users")
                .select("*")
                .eq("email", user.email)
                .limit(1);

              if (existingUsers && existingUsers.length > 0) {
                console.log("User profile already exists");
                fetchUsers();
                return { success: true, tempPassword };
              } else {
                return {
                  success: false,
                  error: "Failed to create user profile",
                };
              }
            } else {
              console.log("User profile created successfully:", data);
              fetchUsers();
              return { success: true, tempPassword };
            }
          } else {
            return { success: false, error: authError.message };
          }
        }

        if (!authUser) {
          console.error("No user returned from auth creation");
          return {
            success: false,
            error: "No user returned from auth creation",
          };
        }

        console.log("Auth user created successfully:", authUser.id);
        console.log("Temporary password generated:", tempPassword);

        // Step 2: Create profile in users table using auth user ID
        const newUserPayload: Database["public"]["Tables"]["users"]["Insert"] =
          {
            id: authUser.id, // Use auth user ID
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
            is_active: true,
            last_active: new Date().toISOString(),
            permissions: permissions as any,
            avatar_url: user.avatar_url || null,
          };

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

          // Jika profile creation gagal, hapus auth user yang sudah dibuat
          console.log("Attempting to cleanup auth user...");
          await deleteUserWithAdmin(authUser.id);
          return { success: false, error: error.message };
        } else {
          console.log("User and profile created successfully!", data);
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
        const { id, created_at, last_active, email, ...updateData } =
          updatedUser;

        // Cek apakah email berubah dengan membandingkan dengan user existing
        const existingUser = users.find((u) => u.id === id);
        const emailChanged = existingUser && existingUser.email !== email;

        // Step 1: Update auth user hanya jika email berubah dan service key tersedia
        if (emailChanged) {
          console.log("Email changed, attempting to update auth user:", email);
          const { error: authError } = await updateUserWithAdmin(id, {
            email: email,
            user_metadata: {
              full_name: updateData.full_name,
            },
          });

          if (authError) {
            console.warn(
              "Could not update auth user (this is OK if no service key):",
              authError.message
            );
            // Continue dengan update profile meskipun auth update gagal
          } else {
            console.log("Auth user updated successfully");
          }
        }

        // Step 2: Update user profile (selalu dilakukan)
        const { error } = await supabase
          .from("users")
          .update({
            ...updateData,
            email: email, // Include email in profile update
            last_active: new Date().toISOString(),
          } as any)
          .eq("id", id);

        if (error) {
          console.error("Error updating user profile:", error);
        } else {
          console.log("User profile updated successfully");
          fetchUsers();
        }
      } catch (err) {
        console.error("Unexpected error updating user:", err);
      }
    },
    [users, fetchUsers]
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

        // Step 1: Delete from users table first
        const { error: profileError } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

        if (profileError) {
          console.error("Error deleting user profile:", profileError);
          return;
        }

        // Step 2: Delete from auth
        const { error: authError } = await deleteUserWithAdmin(userId);

        if (authError) {
          console.error("Error deleting auth user:", authError);
          // Profile already deleted, so just log the error
        }

        console.log("User deleted successfully");
        fetchUsers();
      } catch (err) {
        console.error("Unexpected error deleting user:", err);
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
