import { useState, useEffect, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { logger } from '../utils/logger';

interface PresenceUser {
  id: string;
  username: string;
  full_name?: string;
  role: string;
  last_seen: Date;
  is_online: boolean;
  avatarUrl?: string;
}

export const usePresenceTracker = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current online users from user_online collection
  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Get all records from user_online - cannot expand 'user_id' as it is a text field
      // We use 'created' because we are now recreating records on heartbeat (so created time is fresh)
      // Removing time filter to match collection count exactly as per user request
      const onlineRecords = await pb.collection('user_online').getFullList({
        sort: '-created',
      });

      // Map to promises for parallel fetching
      const promises = onlineRecords.map(async (record) => {
        try {
          if (!record.user_id) return null;

          let presenceData: PresenceUser;

          try {
            // Fetch user details manually since user_id is text
            const user = await pb.collection('users').getOne(record.user_id);
            presenceData = {
              id: user.id,
              username: user.username,
              full_name: user.name || user.full_name,
              role: user.role,
              last_seen: new Date(record.created),
              is_online: true,
              avatarUrl: user.avatar ? pb.files.getUrl(user, user.avatar) : undefined,
            };
          } catch (fetchErr: any) {
            // Jika user tidak ditemukan (404), hapus record presence yang usang
            if (fetchErr && fetchErr.status === 404) {
              logger.debug(`Cleaning up stale presence record for deleted user: ${record.user_id}`);
              pb.collection('user_online')
                .delete(record.id)
                .catch(() => {});
            }

            // PERMISSION FALLBACK: If we can't fetch user details, return a placeholder
            // This ensures the COUNT is correct even if we can't show the name
            presenceData = {
              id: record.user_id,
              username: 'User',
              full_name: 'Online User',
              role: 'Unknown',
              last_seen: new Date(record.created),
              is_online: true,
            };
          }

          return presenceData;
        } catch (e) {
          // Record itself is invalid?
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Filter out nulls
      const onlineUsersData = results.filter((u): u is PresenceUser => u !== null);

      // Remove duplicates by user ID
      const uniqueUsers = onlineUsersData.filter(
        (user, index, self) => index === self.findIndex((u) => u.id === user.id)
      );

      setOnlineUsers(uniqueUsers);
      setIsConnected(true);
    } catch (error) {
      logger.warn('Failed to fetch online users:', error);
      setIsConnected(false);
    }
  }, []);

  const lastHeartbeatTimeRef = useRef<number>(0);

  // Heartbeat function: Recreate my record to ensure timestamp updates
  // Since user_online fields (user_id) are static, update() might not change 'updated' timestamp
  // So we delete and create a new record.
  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    // Debounce: prevent running too frequently (e.g. strict mode double mount)
    if (now - lastHeartbeatTimeRef.current < 2000) {
      return;
    }
    lastHeartbeatTimeRef.current = now;

    const userId = pb.authStore.model?.id;
    if (!userId) return;

    try {
      // Find my record(s)
      const records = await pb.collection('user_online').getList(1, 10, {
        filter: `user_id = "${userId}"`,
      });

      // Delete ALL existing records for this user (cleanup old duplicates if any)
      if (records.items.length > 0) {
        await Promise.all(
          records.items.map((item) =>
            pb
              .collection('user_online')
              .delete(item.id)
              .catch((err) => {
                // Ignore 404 errors (record already deleted), rethrow others
                if (err.status !== 404) {
                  // logger.warn('Failed to delete presence record:', err);
                }
              })
          )
        );
      }

      // Create new record
      await pb.collection('user_online').create({
        user_id: userId,
      });
    } catch (error) {
      // Silent fail for heartbeat
      // logger.debug('Heartbeat failed', error);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeTracking = async () => {
      await fetchOnlineUsers();
      await sendHeartbeat(); // Immediate heartbeat

      // START HEARTBEAT INTERVAL (every 2 minutes)
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 2 * 60 * 1000);

      // Subscribe to changes in user_online collection
      try {
        unsubscribe = await pb.collection('user_online').subscribe('*', (e) => {
          // If CREATE, UPDATE, DELETE happens, refresh the list
          // We can optimize by modifying state directly but refresh is safer for accuracy
          if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
            fetchOnlineUsers();
          }
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
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [fetchOnlineUsers, sendHeartbeat]);

  return {
    onlineUsers,
    isConnected,
    refreshOnlineUsers: fetchOnlineUsers,
  };
};
