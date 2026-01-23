import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { logger } from '../utils/logger';

interface PresenceUser {
  id: string;
  username: string;
  full_name?: string;
  role: string;
  last_seen: Date;
  is_online: boolean;
}

export const usePresenceTracker = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch current online users from user_online collection
  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Get all records from user_online
      const onlineRecords = await pb.collection('user_online').getFullList({
        sort: '-created',
      });

      const onlineUsersData: PresenceUser[] = [];
      const promises = onlineRecords.map(async (record) => {
        try {
          // user_id is a text field, so we must fetch the user manually
          // We use getOne with silence error to avoid crashing if user deleted
          if (!record.user_id) return null;

          const user = await pb.collection('users').getOne(record.user_id);
          return {
            id: user.id,
            username: user.username,
            full_name: user.name,
            role: user.role,
            last_seen: new Date(record.created),
            is_online: true,
          };
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Filter out nulls (deleted users or failed fetches)
      results.forEach((user) => {
        if (user) onlineUsersData.push(user);
      });

      setOnlineUsers(onlineUsersData);
      setIsConnected(true);
    } catch (error) {
      logger.warn('Failed to fetch online users:', error);
      setOnlineUsers([]);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeTracking = async () => {
      await fetchOnlineUsers();

      // Subscribe to changes in user_online collection
      try {
        unsubscribe = await pb.collection('user_online').subscribe('*', () => {
          fetchOnlineUsers();
        });
      } catch (error) {
        console.warn('Failed to subscribe to user_online:', error);
      }
    };

    initializeTracking();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchOnlineUsers]);

  return {
    onlineUsers,
    isConnected,
    // No-op functions to maintain interface compatibility with dashboard
    markOnline: () => {},
    markOffline: () => {},
    refreshOnlineUsers: fetchOnlineUsers,
  };
};
