import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { User } from '../types';

export const useUserManagement = (_currentUser?: User | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users with their permissions
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await pb.collection('users').getFullList({
        sort: '-created',
      });

      // Transform the data to match User type
      const transformedUsers: User[] = usersData.map((user) => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name || undefined,
        role: user.role,
        is_active: user.is_active !== false,
        created_at: new Date(user.created),
        updated_at: new Date(user.updated),
        last_active: user.last_active ? new Date(user.last_active) : undefined,
        // Use permissions from user record (stored as JSON in PocketBase)
        permissions: user.permissions || {
          dashboard: 'READ',
          plant_operations: {},
          inspection: 'READ',
          project_management: 'READ',
        },
      }));

      setUsers(transformedUsers);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new user
  const addUser = useCallback(
    async (userData: { username: string; password: string; full_name?: string; role: string }) => {
      const userRecord = await pb.collection('users').create({
        username: userData.username,
        password: userData.password,
        passwordConfirm: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        is_active: true,
        permissions: {
          dashboard: 'READ',
          plant_operations: {},
          inspection: 'READ',
          project_management: 'READ',
        },
      });

      // Refresh users list
      await fetchUsers();

      return userRecord;
    },
    [fetchUsers]
  );

  // Update existing user
  const updateUser = useCallback(
    async (
      userId: string,
      userData: {
        username?: string;
        password?: string;
        full_name?: string;
        role?: string;
        is_active?: boolean;
      }
    ) => {
      const updateData: Record<string, unknown> = {};

      if (userData.username) updateData.username = userData.username;
      if (userData.password) {
        updateData.password = userData.password;
        updateData.passwordConfirm = userData.password;
      }
      if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
      if (userData.role) updateData.role = userData.role;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

      const updatedUser = await pb.collection('users').update(userId, updateData);

      // Refresh users list
      await fetchUsers();

      return updatedUser;
    },
    [fetchUsers]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      await pb.collection('users').delete(userId);

      // Refresh users list
      await fetchUsers();
    },
    [fetchUsers]
  );

  // Toggle user active status
  const toggleUserStatus = useCallback(
    async (userId: string) => {
      // Get current status
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found');

      const updatedUser = await pb.collection('users').update(userId, {
        is_active: !user.is_active,
      });

      // Refresh users list
      await fetchUsers();

      return updatedUser;
    },
    [users, fetchUsers]
  );

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loading,
    refetch: fetchUsers,
  };
};

