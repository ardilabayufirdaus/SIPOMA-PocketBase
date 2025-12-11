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

  // Update user presence
  const updatePresence = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      const presenceData = {
        user_id: userId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      };

      // Find existing presence record for this user
      const existingRecords = await pb.collection('user_presence').getFullList({
        filter: `user_id = "${userId}"`,
        limit: 1,
      });

      if (existingRecords.length > 0) {
        // Update existing record
        await pb.collection('user_presence').update(existingRecords[0].id, presenceData);
      } else {
        // Create new record
        await pb.collection('user_presence').create(presenceData);
      }
    } catch (error) {
      logger.warn('Failed to update presence:', error);
    }
  }, []);

  // Mark current user as online
  const markOnline = useCallback(() => {
    const currentUser = pb.authStore.model;
    if (currentUser) {
      updatePresence(currentUser.id, true);
    }
  }, [updatePresence]);

  // Mark current user as offline
  const markOffline = useCallback(() => {
    const currentUser = pb.authStore.model;
    if (currentUser) {
      updatePresence(currentUser.id, false);
    }
  }, [updatePresence]);

  // Threshold for considering a user as online (in milliseconds)
  // User must have heartbeat within last 2 minutes to be considered online
  const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

  // Fetch current online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Get users who are marked as online in presence collection
      const presenceRecords = await pb.collection('user_presence').getFullList({
        filter: 'is_online = true',
        sort: '-last_seen',
      });

      // Get user details for each presence record
      const onlineUsersData: PresenceUser[] = [];
      const now = Date.now();

      for (const presence of presenceRecords) {
        try {
          // Validate last_seen is within the threshold
          const lastSeen = new Date(presence.last_seen || 0);
          const timeSinceLastSeen = now - lastSeen.getTime();

          // Skip users who haven't been seen recently (stale presence data)
          if (timeSinceLastSeen > ONLINE_THRESHOLD_MS) {
            // Mark as offline since they haven't been active
            try {
              await pb.collection('user_presence').update(presence.id, { is_online: false });
            } catch {
              // Ignore update errors
            }
            continue;
          }

          const userRecord = await pb.collection('users').getOne(presence.user_id);
          onlineUsersData.push({
            id: userRecord.id,
            username: userRecord.username,
            full_name: userRecord.name,
            role: userRecord.role,
            last_seen: lastSeen,
            is_online: true,
          });
        } catch {
          // User might be deleted, skip
          continue;
        }
      }

      setOnlineUsers(onlineUsersData);
    } catch (error) {
      logger.warn('Failed to fetch online users:', error);
      // Fallback to last_active based logic if presence tracking fails
      setOnlineUsers([]);
    }
  }, []);

  useEffect(() => {
    let presenceSubscription: (() => void) | null = null;

    const initializePresenceTracking = async () => {
      try {
        // Mark current user as online when component mounts
        markOnline();

        // Subscribe to presence changes
        presenceSubscription = await pb.collection('user_presence').subscribe('*', (e) => {
          if (e.action === 'create' || e.action === 'update') {
            fetchOnlineUsers();
          }
        });

        // Initial fetch
        await fetchOnlineUsers();

        setIsConnected(true);
      } catch (error) {
        logger.warn('Presence tracking initialization failed:', error);
        setIsConnected(false);
      }
    };

    initializePresenceTracking();

    // Heartbeat to keep user online
    const heartbeatInterval = setInterval(() => {
      markOnline();
    }, 30000); // Update every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, mark as offline after a delay
        setTimeout(() => {
          if (document.hidden) {
            markOffline();
          }
        }, 60000); // 1 minute delay
      } else {
        // Page is visible again, mark as online
        markOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (presenceSubscription) {
        presenceSubscription();
      }

      // Mark offline when component unmounts
      markOffline();
    };
  }, [markOnline, markOffline, fetchOnlineUsers]);

  return {
    onlineUsers,
    isConnected,
    markOnline,
    markOffline,
    refreshOnlineUsers: fetchOnlineUsers,
  };
};
