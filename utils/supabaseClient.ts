import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { Database } from "../types/supabase";
import { passwordUtils } from './passwordUtils';
import { emailService } from './emailService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

export const apiClient = {
  // User Management - Custom Authentication (Username/Password)
  users: {
    // Login dengan username dan password
    async login(username: string, password: string) {
      // First, get user by username only (don't expose password hash)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(
          `
          id,
          username,
          full_name,
          role,
          is_active,
          password_hash,
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
        .eq('is_active', true)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Invalid username or password');

      // Verify password using bcrypt
      const isValidPassword = await passwordUtils.verify(password, userData.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Remove password_hash from returned data for security
      const { password_hash, ...data } = userData;

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
          avatar_url,
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
      password: string; // Changed from password_hash to password
      full_name?: string;
      role: string;
    }) {
      // Hash password before storing
      const hashedPassword = await passwordUtils.hash(userData.password);

      const userDataWithHash = {
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        password_hash: hashedPassword,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userDataWithHash])
        .select()
        .single();

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

    // Request user registration with validation and rate limiting
    async requestRegistration({ email, name }: { email: string; name: string }) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Check if email already exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', email.toLowerCase())
        .single();

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Check if there's already a pending request for this email
      const { data: existingRequest } = await supabase
        .from('user_requests')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        throw new Error('Registration request already exists for this email');
      }

      // Rate limiting: Check requests from same IP in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentRequests, error: rateLimitError } = await supabase
        .from('user_requests')
        .select('id')
        .eq('ip_address', '0.0.0.0') // This should be replaced with actual IP detection
        .gte('requested_at', oneHourAgo);

      if (rateLimitError) {
        console.warn('Rate limit check failed:', rateLimitError);
      } else if (recentRequests && recentRequests.length >= 5) {
        throw new Error('Rate limit exceeded. Too many requests from this IP.');
      }

      // Insert the registration request
      const { data, error } = await supabase
        .from('user_requests')
        .insert([
          {
            email: email.toLowerCase(),
            name: name.trim(),
            status: 'pending',
            ip_address: '0.0.0.0', // Should be replaced with actual IP
            user_agent: navigator?.userAgent || 'Unknown',
          },
        ])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          throw new Error('Email already exists');
        }
        throw error;
      }

      // Create in-app notification for Super Admin
      try {
        await supabase.from('alerts').insert([
          {
            message: `New registration request from ${name.trim()} (${email.toLowerCase()})`,
            severity: 'info',
            timestamp: new Date().toISOString(),
            read: false,
          },
        ]);
      } catch (notificationError) {
        console.warn('Failed to create admin notification:', notificationError);
      }

      // Send confirmation email to user
      try {
        await emailService.sendRegistrationRequestNotification(email.toLowerCase(), name.trim());
        await emailService.sendAdminNotification({
          email: email.toLowerCase(),
          name: name.trim(),
          id: data.id,
        });
      } catch (emailError) {
        console.warn('Failed to send notification emails:', emailError);
        // Don't fail the registration if email fails
      }

      return data;
    },

    // Get registration requests with pagination and filtering
    async getRegistrationRequests(
      options: {
        status?: 'pending' | 'approved' | 'rejected' | 'all';
        limit?: number;
        offset?: number;
        search?: string;
      } = {}
    ) {
      const { status = 'pending', limit = 50, offset = 0, search } = options;

      let query = supabase.from('user_requests').select(
        `
          id,
          email,
          name,
          status,
          requested_at,
          processed_at,
          processed_by,
          rejection_reason,
          ip_address,
          created_at,
          updated_at
        `,
        { count: 'exact' }
      );

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      }

      // Apply ordering and pagination
      const { data, error, count } = await query
        .order('requested_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    },

    // Approve registration request
    async approveRegistrationRequest(
      requestId: string,
      userData: {
        username: string;
        full_name: string;
        role: string;
        password_hash: string;
        is_active?: boolean;
      }
    ) {
      // First update the request status
      const { error: requestError } = await supabase
        .from('user_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Then create the user
      const { data, error } = await supabase.from('users').insert([userData]).select().single();

      if (error) throw error;

      // Send approval notification
      try {
        await emailService.sendRegistrationApprovalNotification(
          userData.username, // email is used as username
          userData.full_name,
          userData.username
        );
      } catch (emailError) {
        console.warn('Failed to send approval email:', emailError);
      }

      return data;
    },

    // Reject registration request
    async rejectRegistrationRequest(requestId: string, rejectionReason?: string) {
      // First get the request details for email notification
      const { data: requestData, error: fetchError } = await supabase
        .from('user_requests')
        .select('email, name')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update the request status
      const { data, error } = await supabase
        .from('user_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Send rejection notification
      try {
        await emailService.sendRegistrationRejectionNotification(
          requestData.email,
          requestData.name,
          rejectionReason
        );
      } catch (emailError) {
        console.warn('Failed to send rejection email:', emailError);
      }

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
