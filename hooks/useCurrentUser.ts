import { useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../utils/api";

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user from localStorage
        const storedUser = localStorage.getItem("currentUser");
        if (!storedUser) {
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        const userData = JSON.parse(storedUser);

        // Verify user is still active by checking database
        const dbUser = await api.users.getById(userData.id);
        if (!dbUser.is_active) {
          // User inactive, clear session
          localStorage.removeItem("currentUser");
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        // Parse user data
        if (mounted) {
          setCurrentUser(dbUser);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Function untuk logout
  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setError(null);
  };

  return { currentUser, loading, error, logout };
};
