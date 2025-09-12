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
        // Query untuk mencari user berdasarkan username
        const result: any = await supabase
          .from("users")
          .select(
            "id, username, full_name, role, avatar_url, last_active, is_active, created_at, permissions"
          )
          .eq("username", identifier)
          .eq("password", password)
          .single();

        const { data, error } = result;

        if (error) {
          throw error;
        }

        // Convert last_active to Date if it's a string
        const userData = data as any;
        if (userData.last_active && typeof userData.last_active === "string") {
          userData.last_active = new Date(userData.last_active);
        }

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
