import { pb } from './pocketbase-simple';

// Re-export pb as supabase untuk kompatibilitas dengan kode lama
export const supabase = pb;

// Interface untuk tipe data user
interface UserData {
  username: string;
  email?: string;
  password: string;
  full_name: string;
  role?: string;
  is_active?: boolean;
  [key: string]: unknown; // untuk field lain
}

// Interface untuk error PocketBase
interface PocketBaseError {
  message: string;
  data?: Record<string, unknown>;
  status?: number;
}

// API Client yang kompatibel dengan supabaseClient.ts
export const apiClient = {
  // User Management - Custom Authentication (Username/Password)
  users: {
    // Login dengan username dan password
    async login(username: string, password: string) {
      try {
        // Login with username and password using PocketBase
        const authData = await pb.collection('users').authWithPassword(username, password);

        // Extract user data
        const userData = authData.record;

        // Format data to match legacy Supabase structure
        // Format data to match legacy structure using user_management
        // Get user permissions from user_management
        const userManagement = await pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${userData.id}"`,
        });

        const permissions = userManagement.items.length > 0 ? userManagement.items[0] : null;

        // Return data in expected format
        return {
          ...userData,
          permissions: permissions,
        };
      } catch {
        throw new Error('Invalid username or password');
      }
    },

    // Register user
    async register(userData: UserData) {
      try {
        // Create the user in PocketBase
        const newUser = await pb.collection('users').create({
          username: userData.username,
          email: userData.email || `${userData.username}@example.com`,
          password: userData.password,
          passwordConfirm: userData.password, // PocketBase requires password confirmation
          full_name: userData.full_name,
          role: userData.role || 'user',
          is_active: userData.is_active !== undefined ? userData.is_active : true,
        });

        // Return created user without password
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        return userWithoutPassword;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Registration failed: ${pbError.message}`);
      }
    },

    // Get user by ID
    async getById(id: string) {
      try {
        const userData = await pb.collection('users').getOne(id);

        // Get permissions
        const userManagement = await pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${id}"`,
        });

        return {
          ...userData,
          permissions: userManagement.items.length > 0 ? userManagement.items[0] : null,
        };
      } catch {
        throw new Error('User not found');
      }
    },

    // Update user
    async update(id: string, userData: Partial<UserData>) {
      try {
        // Update user in PocketBase
        const updatedUser = await pb.collection('users').update(id, userData);
        return updatedUser;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Update failed: ${pbError.message}`);
      }
    },

    // Delete user
    async delete(id: string) {
      try {
        await pb.collection('users').delete(id);
        return { success: true };
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Delete failed: ${pbError.message}`);
      }
    },

    // Get all users
    async getAll() {
      try {
        const users = await pb.collection('users').getFullList();

        // This is inefficient but maintaining compatibility
        const usersWithPermissions = await Promise.all(
          users.map(async (user) => {
            const userManagement = await pb.collection('user_management').getList(1, 1, {
              filter: `user_id = "${user.id}"`,
            });
            return {
              ...user,
              permissions: userManagement.items.length > 0 ? userManagement.items[0] : null,
            };
          })
        );

        return usersWithPermissions;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get users: ${pbError.message}`);
      }
    },

    // Change password
    async changePassword(id: string, currentPassword: string, newPassword: string) {
      try {
        // Verify the user exists
        await pb.collection('users').getOne(id);

        // Update the password
        await pb.collection('users').update(id, {
          password: newPassword,
          passwordConfirm: newPassword,
        });

        return { success: true };
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Password change failed: ${pbError.message}`);
      }
    },

    // Get user by email
    async getByEmail(email: string) {
      try {
        const records = await pb.collection('users').getList(1, 1, {
          filter: `email="${email}"`,
        });

        if (records.items.length === 0) {
          return null;
        }

        const userData = records.items[0];

        // Get permissions
        const userManagement = await pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${userData.id}"`,
        });

        return {
          ...userData,
          permissions: userManagement.items.length > 0 ? userManagement.items[0] : null,
        };
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get user by email: ${pbError.message}`);
      }
    },

    // Update user's last active timestamp
    async updateLastActive(id: string) {
      try {
        await pb.collection('users').update(id, {
          last_active: new Date().toISOString(),
        });
      } catch {
        // Suppress error as this is not critical
        return;
      }
    },

    // Request registration (for new users)
    async requestRegistration({ email, name }: { email: string; name: string }) {
      try {
        const record = await pb.collection('user_requests').create({
          email,
          name,
          status: 'pending',
          created: new Date().toISOString(),
        });

        return record;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Registration request failed: ${pbError.message}`);
      }
    },

    // Get all registration requests
    async getRegistrationRequests() {
      try {
        const records = await pb.collection('user_requests').getFullList({
          sort: '-created',
          filter: 'status="pending"',
        });

        return records;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get registration requests: ${pbError.message}`);
      }
    },

    // Approve a registration request
    async approveRegistrationRequest(
      requestId: string,
      userData: {
        username: string;
        full_name: string;
        role: string;
        password_hash?: string;
        is_active?: boolean;
      }
    ) {
      try {
        // Get the request
        const request = await pb.collection('user_requests').getOne(requestId);

        // Create the user
        const password = userData.password_hash || Math.random().toString(36).substring(2, 10);

        const user = await pb.collection('users').create({
          username: userData.username,
          email: request.email,
          password,
          passwordConfirm: password,
          full_name: userData.full_name,
          role: userData.role,
          is_active: userData.is_active !== undefined ? userData.is_active : true,
        });

        // Update the request status
        await pb.collection('user_requests').update(requestId, {
          status: 'approved',
          processed_at: new Date().toISOString(),
        });

        return user;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to approve registration: ${pbError.message}`);
      }
    },

    // Reject a registration request
    async rejectRegistrationRequest(requestId: string) {
      try {
        // Update the request status
        await pb.collection('user_requests').update(requestId, {
          status: 'rejected',
          processed_at: new Date().toISOString(),
        });

        return { success: true };
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to reject registration: ${pbError.message}`);
      }
    },

    // Get user activity logs
    async getActivityLogs() {
      try {
        const records = await pb.collection('user_activities').getFullList({
          sort: '-created',
          expand: 'user',
        });

        return records;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get activity logs: ${pbError.message}`);
      }
    },
  },

  // Role management
  roles: {
    // Get all roles
    async getAll() {
      try {
        const roles = await pb.collection('roles').getFullList({
          sort: 'name',
        });
        return roles;
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get roles: ${pbError.message}`);
      }
    },

    // Get role by name
    async getByName(name: string) {
      try {
        const roles = await pb.collection('roles').getFullList({
          filter: `name="${name}"`,
        });

        if (!roles.length) throw new Error('Role not found');
        return roles[0];
      } catch (error) {
        const pbError = error as PocketBaseError;
        throw new Error(`Failed to get role: ${pbError.message}`);
      }
    },
  },
};
