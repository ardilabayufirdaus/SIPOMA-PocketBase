import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { User } from "../types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        // Get user data from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          setError(`Failed to fetch user data: ${userError.message}`);

          // If user not found in users table, create a basic user object from auth
          if (mounted) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email || "",
              full_name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "User",
              role: "viewer" as any,
              department: "Other" as any,
              avatar_url: session.user.user_metadata?.avatar_url,
              last_active: new Date(),
              is_active: true,
              created_at: new Date(session.user.created_at || Date.now()),
              permissions: {} as any,
            });
          }
        } else {
          // Parse user data from database
          if (mounted) {
            setCurrentUser({
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role as any, // Type assertion for database string values
              department: userData.department as any, // Type assertion for database string values
              avatar_url: userData.avatar_url ?? undefined,
              last_active: new Date(userData.last_active),
              is_active: userData.is_active,
              created_at: new Date(userData.created_at),
              permissions: userData.permissions as any,
            });
          }
        }
      } catch (err) {
        console.error("Error getting current user:", err);
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

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        getCurrentUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { currentUser, loading, error };
};
