import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Admin client untuk operasi yang memerlukan service role
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// WARNING: Service key should NOT be exposed in frontend
// This is for development only - implement proper backend API for production
const isServiceKeyAvailable = !!supabaseServiceKey;

if (import.meta.env.PROD && supabaseServiceKey) {
  console.warn('🚨 SECURITY WARNING: Service key detected in production frontend!');
}

// Use service role key for admin operations only
const supabaseKey = supabaseServiceKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Utility to check if admin operations are available
export const isAdminOperationAvailable = () => isServiceKeyAvailable;

// Function untuk membuat user dengan admin privileges
export const createUserWithAdmin = async (
  email: string,
  password: string,
  userData: {
    full_name: string;
    role: string;
    permissions?: any;
    avatar_url?: string;
  }
) => {
  try {
    // Jika menggunakan service key, gunakan admin API
    if (supabaseServiceKey) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) throw authError;
      return { user: authUser.user, error: null };
    } else {
      // Jika tidak ada service key, gunakan signup biasa
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      return { user: data.user, error };
    }
  } catch (error) {
    return { user: null, error };
  }
};

// Function untuk update user dengan admin privileges
export const updateUserWithAdmin = async (
  userId: string,
  updates: {
    email?: string;
    password?: string;
    user_metadata?: any;
  }
) => {
  try {
    if (supabaseServiceKey) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
      return { user: data.user, error };
    } else {
      // Jika tidak ada service key, kembalikan error
      return {
        user: null,
        error: { message: 'Admin operations require service key' },
      };
    }
  } catch (error) {
    return { user: null, error };
  }
};

// Function untuk delete user dengan admin privileges
export const deleteUserWithAdmin = async (userId: string) => {
  try {
    if (supabaseServiceKey) {
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error };
    } else {
      return { error: { message: 'Admin operations require service key' } };
    }
  } catch (error) {
    return { error };
  }
};
