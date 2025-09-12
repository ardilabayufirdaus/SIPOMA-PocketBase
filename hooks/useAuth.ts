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
        // Query untuk mencari user berdasarkan username atau email
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .or(`username.eq.${identifier},email.eq.${identifier}`)
          .eq("password", password)
          .single();

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
    localStorage.removeItem("currentUser");
  }, []);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    setLoading(false);
  }, []);

  return { user, loading, login, logout };
};
