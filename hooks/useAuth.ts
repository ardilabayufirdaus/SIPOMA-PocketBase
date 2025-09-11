
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import { User } from "../types";
import useErrorHandler from "./useErrorHandler";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (error) {
        throw error;
      }

      setUser(data as User);
      localStorage.setItem("currentUser", JSON.stringify(data));
      return data;
    } catch (error) {
      handleError(error, "Error logging in");
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

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
