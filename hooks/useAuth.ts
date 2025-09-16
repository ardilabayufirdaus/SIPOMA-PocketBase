import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import { User } from "../types";
import useErrorHandler from "./useErrorHandler";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const login = useCallback(
    async (identifier, password) => {
      setLoading(true);
      try {
        // Query langsung ke tabel users untuk validasi credentials
        const { data, error } = await (supabase as any)
          .from("users")
          .select(
            `
            id,
            username,
            full_name,
            role,
            last_active,
            is_active,
            avatar_url,
            created_at,
            user_permissions (
              permissions (
                module_name,
                permission_level,
                plant_units
              )
            )
          `
          )
          .eq("username", identifier)
          .eq("password_hash", password)
          .eq("is_active", true)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No rows returned
            throw new Error("Invalid username or password");
          }
          throw error;
        }

        if (!data) {
          throw new Error("Invalid username or password");
        }

        const userData = {
          ...data,
          permissions:
            (data as any).user_permissions?.map((up: any) => up.permissions) ||
            [],
        };

        // Convert dates
        if (userData.last_active && typeof userData.last_active === "string") {
          userData.last_active = new Date(userData.last_active);
        }
        if (userData.created_at && typeof userData.created_at === "string") {
          userData.created_at = new Date(userData.created_at);
        }

        // Update last_active
        await (supabase as any)
          .from("users")
          .update({ last_active: new Date().toISOString() })
          .eq("id", userData.id);

        setUser(userData as User);
        localStorage.setItem("currentUser", JSON.stringify(userData));
        return userData;
      } catch (error) {
        handleError(error, "Error logging in");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const logout = useCallback(() => {
    setUser(null);
    setLoading(false);
    localStorage.removeItem("currentUser");

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("authStateChanged"));
  }, []);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    setLoading(false);

    // Listen for auth state changes
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  return { user, loading, login, logout };
};
