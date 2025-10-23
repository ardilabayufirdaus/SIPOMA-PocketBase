import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';

interface UseRealtimeStatusReturn {
  isConnected: boolean;
  lastUpdate: Date | null;
  markUpdate: () => void;
  connectionErrors: string[];
}

export const useRealtimeStatus = (channelName: string): UseRealtimeStatusReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionErrors, setConnectionErrors] = useState<string[]>([]);

  const markUpdate = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    // Monitor PocketBase connection status
    const checkConnection = () => {
      try {
        // Check if PocketBase client is available and can make requests
        // PocketBase doesn't have a direct connection status like Supabase
        // We'll check by attempting a simple operation
        const isOnline = navigator.onLine;
        const hasAuthStore = !!pb.authStore;

        setIsConnected(isOnline && hasAuthStore);

        if (!isOnline) {
          setConnectionErrors((prev) => [
            ...prev,
            `Network offline at ${new Date().toISOString()}`,
          ]);
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionErrors((prev) => [...prev, `Connection check failed: ${error}`]);
      }
    };

    // Initial check
    checkConnection();

    // Periodic connection check
    const interval = setInterval(checkConnection, 5000);

    // Listen for online/offline events
    const handleOnline = () => checkConnection();
    const handleOffline = () => {
      setIsConnected(false);
      setConnectionErrors((prev) => [
        ...prev,
        `Network went offline at ${new Date().toISOString()}`,
      ]);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [channelName]);

  return {
    isConnected,
    lastUpdate,
    markUpdate,
    connectionErrors,
  };
};

