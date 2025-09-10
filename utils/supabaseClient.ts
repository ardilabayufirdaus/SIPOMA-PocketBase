import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { User, UserRole } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const apiClient = {
  users: {
    async getByEmail(email: string): Promise<User[]> {
      const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true);

      if (error) throw error;

      return (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        password: (user as any).password,
        full_name: user.full_name,
        role: user.role as UserRole,
        avatar_url: user.avatar_url ?? undefined,
        last_active: new Date(user.last_active),
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        permissions: user.permissions as any,
      }));
    },

    async getById(id: string): Promise<User> {
      const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        password: (data as any).password,
        full_name: data.full_name,
        role: data.role as UserRole,
        avatar_url: data.avatar_url ?? undefined,
        last_active: new Date(data.last_active),
        is_active: data.is_active,
        created_at: new Date(data.created_at),
        permissions: data.permissions as any,
      };
    },

    async updateLastActive(id: string) {
      const { error } = await supabaseClient
        .from("users")
        .update({ last_active: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
  },
};
