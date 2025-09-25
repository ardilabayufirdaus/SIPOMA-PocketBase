import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

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
    // Monitor Supabase connection status
    const checkConnection = () => {
      try {
        const channels = supabase.getChannels();
        const channel = channels.find((ch) => ch.topic.includes(channelName));

        if (channel) {
          const state = channel.state;
          setIsConnected(state === 'joined');

          if (state === 'errored') {
            setConnectionErrors((prev) => [
              ...prev,
              `Channel ${channelName} error at ${new Date().toISOString()}`,
            ]);
          }
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

    // Check if realtime is available and connected
    if (supabase.realtime) {
      // Attempt to track connection via existing channels
      const existingChannels = supabase.getChannels();
      if (existingChannels.length > 0) {
        setIsConnected(true);
      }
    }

    return () => {
      clearInterval(interval);
    };
  }, [channelName]);

  return {
    isConnected,
    lastUpdate,
    markUpdate,
    connectionErrors,
  };
};
