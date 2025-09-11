import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import {
  User,
  UserRole,
  PermissionMatrix,
  PermissionLevel,
  PlantUnit,
  PlantOperationsPermissions,
} from "../types";
import useErrorHandler from "./useErrorHandler";

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
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
    } catch (error) {
      handleError(error, "Error fetching users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers };
};

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          setCurrentUser(user as User);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        handleError(error, "Error fetching current user");
        setCurrentUser(null);
      }
      finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        fetchCurrentUser();
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [handleError]);

  return { currentUser, loading };
};