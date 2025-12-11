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
      // Only count users who are truly active within the threshold time
      const realOnlineUsers = users.filter((user) => {
        if (!user.is_active) return false;
        if (!user.last_active) return false;

        const lastActive = new Date(user.last_active);
        // Validate date is valid
        if (isNaN(lastActive.getTime())) return false;

        return lastActive >= thresholdTime;
      });

      // No simulation - only show real online users count
      // This ensures accurate data on the dashboard
      setOnlineUsersCount(realOnlineUsers.length);
    };

    // Calculate initially
    calculateOnlineUsers();

    // Update every minute with slight variation
    const interval = setInterval(calculateOnlineUsers, 60000);

    return () => clearInterval(interval);
  }, [users]);

  return onlineUsersCount;
};
