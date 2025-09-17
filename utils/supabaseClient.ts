import { createClient } from '@supabase/supabase-js';
// import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Temporarily use any type to resolve 'never' type issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const apiClient = {
  // User Management - Custom Authentication (Username/Password)
  users: {
    // Login dengan username dan password
    async login(username: string, password: string) {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .eq('username', username)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      return data;
    },

    // Get user by ID dengan permissions
    async getById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      return data;
    },

    // Get all users dengan permissions
    async getAll() {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Create new user
    async create(userData: {
      username: string;
      password_hash: string;
      full_name?: string;
      role: string;
    }) {
      const { data, error } = await supabase.from('users').insert([userData]).select().single();

      if (error) throw error;
      return data;
    },

    // Update user
    async update(
      id: string,
      userData: {
        username?: string;
        password_hash?: string;
        full_name?: string;
        role?: string;
        is_active?: boolean;
      }
    ) {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Delete user
    async delete(id: string) {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) throw error;
    },

    // Toggle user active status
    async toggleActive(id: string) {
      // Get current status
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle status
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: !currentUser.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Get user by email
    async getByEmail(email: string) {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          user_permissions (
            permissions (
              module_name,
              permission_level,
              plant_units
            )
          )
        `
        )
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    },

    // Update last active timestamp
    async updateLastActive(id: string) {
      const { data, error } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Request user registration
    async requestRegistration({ email, name }: { email: string; name: string }) {
      const { data, error } = await supabase
        .from('user_requests')
        .insert([
          {
            email,
            name,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Get registration requests
    async getRegistrationRequests() {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Approve registration request
    async approveRegistrationRequest(requestId: string, userData: any) {
      // First update the request status
      const { error: requestError } = await supabase
        .from('user_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Then create the user
      const { data, error } = await supabase.from('users').insert([userData]).select().single();

      if (error) throw error;
      return data;
    },

    // Reject registration request
    async rejectRegistrationRequest(requestId: string) {
      const { data, error } = await supabase
        .from('user_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Get user activity logs
    async getActivityLogs() {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  },

  // Permissions Management
  permissions: {
    // Get all permissions
    async getAll() {
      const { data, error } = await supabase.from('permissions').select('*').order('module_name');

      if (error) throw error;
      return data || [];
    },

    // Get permissions by module
    async getByModule(moduleName: string) {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('module_name', moduleName);

      if (error) throw error;
      return data || [];
    },

    // Assign permission to user
    async assignToUser(userId: string, permissionId: string) {
      const { data, error } = await supabase
        .from('user_permissions')
        .insert([
          {
            user_id: userId,
            permission_id: permissionId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Remove permission from user
    async removeFromUser(userId: string, permissionId: string) {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },

    // Get user permissions
    async getUserPermissions(userId: string) {
      const { data, error } = await supabase
        .from('user_permissions')
        .select(
          `
          permissions (
            id,
            module_name,
            permission_level,
            plant_units
          )
        `
        )
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
  },

  // Roles Management
  roles: {
    // Get all roles
    async getAll() {
      const { data, error } = await supabase.from('roles').select('*').order('name');

      if (error) throw error;
      return data || [];
    },

    // Get role by name
    async getByName(name: string) {
      const { data, error } = await supabase.from('roles').select('*').eq('name', name).single();

      if (error) throw error;
      return data;
    },
  },
};
