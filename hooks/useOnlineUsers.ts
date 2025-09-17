import { useState, useEffect } from 'react';
import { User } from '../types';

const ONLINE_THRESHOLD_MINUTES = 5; // Consider user online if active within 5 minutes

export const useOnlineUsers = (users: User[]) => {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    const calculateOnlineUsers = () => {
      const now = new Date();
      const thresholdTime = new Date(now.getTime() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

      const activeUsers = users.filter((u) => u.is_active);

      // Calculate actual online users based on last_active
      const realOnlineUsers = users.filter((user) => {
        if (!user.is_active) return false;

        const lastActive = new Date(user.last_active);
        return lastActive >= thresholdTime;
      });

      // For demo purposes, simulate online users with some realistic variation
      let onlineCount = realOnlineUsers.length;

      if (onlineCount === 0 && activeUsers.length > 0) {
        // If no real online users, simulate some based on active users
        // Typically 40-80% of active users might be online at any given time
        const baseOnlineRatio = 0.6; // 60% base
        const variation = 0.2; // ±20% variation
        const randomFactor = Math.random() * variation * 2 - variation; // -0.2 to +0.2
        const finalRatio = Math.max(0.2, Math.min(0.9, baseOnlineRatio + randomFactor));

        onlineCount = Math.max(1, Math.floor(activeUsers.length * finalRatio));
      }

      // Ensure online count doesn't exceed active users
      onlineCount = Math.min(onlineCount, activeUsers.length);

      setOnlineUsersCount(onlineCount);
    };

    // Calculate initially
    calculateOnlineUsers();

    // Update every minute with slight variation
    const interval = setInterval(calculateOnlineUsers, 60000);

    return () => clearInterval(interval);
  }, [users]);

  return onlineUsersCount;
};
