import { useState, useEffect, useCallback, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';

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
      // Perlebar filter ke 2 jam terakhir untuk toleransi timezone
      // Format YYYY-MM-DD HH:MM:SS lebih aman untuk filter PocketBase string
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .split('.')[0];

      const onlineRecords = await pb.collection('user_online').getFullList({
        filter: `updated > "${twoHoursAgo}"`,
        sort: '-updated',
      });

      if (onlineRecords.length === 0) {
        setOnlineUsers([]);
        setIsConnected(true);
        return;
      }

      const promises = onlineRecords.map(async (record) => {
        try {
          if (!record.user_id) return null;

          try {
            const user = await pb.collection('users').getOne(record.user_id);
            return {
              id: user.id,
              username: user.username,
              full_name: user.name || user.full_name,
              role: user.role,
              last_seen: new Date(record.updated),
              is_online: true,
              avatarUrl: user.avatar ? pb.files.getUrl(user, user.avatar) : undefined,
            };
          } catch (fetchErr) {
            // Jika gagal ambil data user (misal: Guest), tetap tampilkan ID sebagai placeholder
            return {
              id: record.user_id,
              username: 'User ' + record.user_id.slice(-4),
              role: 'Unknown',
              last_seen: new Date(record.updated),
              is_online: true,
            };
          }
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
      console.error('PresenceTracker Error:', error);
      setIsConnected(false);
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    try {
      // Cari record aktif untuk user ini
      const existingRecords = await pb.collection('user_online').getList(1, 10, {
        filter: `user_id="${userId}"`,
        sort: '-created',
      });

      if (existingRecords.items.length > 0) {
        // Gunakan record terbaru yang ada
        const latest = existingRecords.items[0];

        // Update timestamp 'updated' untuk menandakan keaktifan
        try {
          await pb.collection('user_online').update(latest.id, {
            user_id: userId, // Update field yang sama (no-op) untuk merefresh 'updated'
          });
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            // Jika record sudah hilang (mungkin dihapus tab lain), buat baru
            await pb.collection('user_online').create({ user_id: userId });
          }
        }

        // Jika ada duplikasi (lebih dari 1 record), bersihkan sisanya secara senyap
        if (existingRecords.items.length > 1) {
          for (let i = 1; i < existingRecords.items.length; i++) {
            try {
              await pb.collection('user_online').delete(existingRecords.items[i].id);
            } catch (_) {
              /* Ignore silent */
            }
          }
        }
      } else {
        // Belum ada record, buat baru
        await pb.collection('user_online').create({
          user_id: userId,
        });
      }
    } catch (error) {
      // Ignore heartbeat flow errors to keep app running
    }
  }, []);

  useEffect(() => {
    // ... same initialization logic ...
    let unsubscribe: (() => void) | undefined; // Fix type

    const initialize = async () => {
      await fetchOnlineUsers();
      await sendHeartbeat();
      // Fetch again to include the record we just created/updated
      await fetchOnlineUsers();

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
