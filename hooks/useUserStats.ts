import { useState, useEffect, useRef } from 'react';
import { pb } from '../utils/pocketbase-simple';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  superAdmins: number;
  recent: number; // Added in last 30 days
  recentUsers?: Array<{
    id: string;
    username: string;
    avatar: string;
    created: string;
  }>;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    superAdmins: 0,
    recent: 0,
    recentUsers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track component mounting state
  const isMounted = useRef(true);

  // Use a ref to store cancel functions
  const cancelRequests = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Initial fetch
    fetchUserStats();

    // Cleanup function to handle unmounting
    return () => {
      isMounted.current = false;
      // Cancel all pending requests when component unmounts
      cancelAllRequests();
    };
  }, []);

  // Helper to cancel all pending requests
  const cancelAllRequests = () => {
    cancelRequests.current.forEach((cancelFn) => cancelFn());
    cancelRequests.current = [];
  };

  const fetchUserStats = async () => {
    try {
      // Cancel any previous requests first
      cancelAllRequests();

      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsLoading(true);
        setError(null);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Create a single abort controller for the request
      const controller = new AbortController();

      // Store cancel function
      cancelRequests.current = [() => controller.abort()];

      // Use a single request to fetch all users instead of multiple smaller requests
      // This will reduce network overhead and prevent multiple round-trips
      const allUsers = await pb.collection('users').getFullList({
        fields: 'id,is_active,role,created,username,avatar',
        $autoCancel: false,
        requestKey: 'all-users-stats',
        signal: controller.signal,
      });

      if (!isMounted.current) return;

      // Calculate all stats from the single dataset
      const totalCount = allUsers.length;
      const activeCount = allUsers.filter((user) => user.is_active === true).length;
      const inactiveCount = allUsers.filter((user) => user.is_active === false).length;
      const adminCount = allUsers.filter((user) => user.role === 'Admin').length;
      const superAdminCount = allUsers.filter((user) => user.role === 'Super Admin').length;

      // Filter for recent users (last 30 days) and get their details including avatar
      const recentUsersArray = allUsers.filter((user) => {
        // Check if user was created in the last 30 days
        const createdDate = new Date(user.created);
        return createdDate >= thirtyDaysAgo;
      });

      const recentCount = recentUsersArray.length;

      // Process recent users to include avatar URLs
      const recentUsersWithAvatars = recentUsersArray.map((user) => {
        let avatarUrl = '';
        if (user.avatar) {
          // Construct proper URL for avatar from PocketBase
          avatarUrl = pb.files.getUrl(user, user.avatar);
        }

        return {
          id: user.id,
          username: user.username || '',
          avatar: avatarUrl,
          created: user.created,
        };
      });

      // Sort recent users by creation date (newest first)
      recentUsersWithAvatars.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      // Only update state if component is still mounted
      if (isMounted.current) {
        setStats({
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount,
          admins: adminCount,
          superAdmins: superAdminCount,
          recent: recentCount,
          recentUsers: recentUsersWithAvatars.slice(0, 5), // Only get top 5 recent users
        });
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (isMounted.current) {
        // Check if it's an AbortError (request was cancelled) or auto-cancellation
        const error = err as { name?: string; status?: number; message?: string };
        if (
          error.name === 'AbortError' ||
          (error.status === 0 && error.message?.includes('autocancelled'))
        ) {
          // This is an expected cancellation, don't show error to user
          // Remove console logging to reduce noise in production
        } else {
          // This is an actual error
          // eslint-disable-next-line no-console
          console.error('Error fetching user stats:', err);
          setError('Failed to fetch user statistics');
        }
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Wrapper for refresh stats to ensure it's only called when component is mounted
  const refreshStats = () => {
    if (isMounted.current) {
      fetchUserStats();
    }
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
};

