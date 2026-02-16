import { useState, useEffect, useCallback, useRef } from 'react';
import { ClientResponseError } from 'pocketbase';
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

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const onlineRecords = await pb.collection('user_online').getFullList({
        sort: '-created',
      });

      const promises = onlineRecords.map(async (record) => {
        try {
          if (!record.user_id) return null;

          let presenceData: PresenceUser | null = null;

          try {
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
            if (fetchErr.status === 404) {
              // SILENT DELETE: Wrap in catch to prevent console error leak
              try {
                  await pb.collection('user_online').delete(record.id);
              } catch (_) { /* Ignore completely */ }
              return null;
            }
            
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
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validUsers = results.filter((u): u is PresenceUser => u !== null);

      const uniqueUsers = validUsers.filter(
        (user, index, self) => index === self.findIndex((u) => u.id === user.id)
      );

      setOnlineUsers(uniqueUsers);
      setIsConnected(true);
    } catch (error) {
       setIsConnected(false);
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    try {
      const existingRecords = await pb.collection('user_online').getList(1, 50, {
        filter: `user_id = "${userId}"`,
      });

      if (existingRecords.items.length > 0) {
          // Force parallelism but individually catch errors to silence console
          await Promise.all(existingRecords.items.map(async (item) => {
              try {
                  await pb.collection('user_online').delete(item.id);
              } catch (err: any) {
                  // If 404, specifically ignore.
                  // Note: Browser will still log XHR 404 regardless of JS catch unless we preventdefault,
                  // but we can't prevent XHR logging in devtools.
                  // However, this prevents the "Uncaught (in promise)" error.
                  if (err.status !== 404) {
                      // Only care if it's NOT a 404
                  }
              }
          }));
      }

      await pb.collection('user_online').create({
        user_id: userId,
      });

    } catch (error) {
        // Ignore heartbeat flow errors
    }
  }, []);

  useEffect(() => {
    // ... same initialization logic ...
    let unsubscribe: (() => void) | undefined; // Fix type

    const initialize = async () => {
      await fetchOnlineUsers();
      await sendHeartbeat();
      
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 2 * 60 * 1000);

      try {
        unsubscribe = await pb.collection('user_online').subscribe('*', (e) => {
            if (e.action === 'create' || e.action === 'delete') {
                fetchOnlineUsers();
            }
        });
      } catch (err) {
          // Ignore
      }
    };

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [fetchOnlineUsers, sendHeartbeat]);

  return {
    onlineUsers,
    isConnected,
    refreshOnlineUsers: fetchOnlineUsers,
  };
};
