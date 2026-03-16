import { useState, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';

export interface SystemHealth {
  cpuLoad: number;
  memoryUsage: number;
  uptime: number;
  latency: number;
  isLive: boolean;
  lastUpdated: string;
}

export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth>({
    cpuLoad: 0,
    memoryUsage: 0,
    uptime: 0,
    latency: 0,
    isLive: false,
    lastUpdated: '',
  });

  useEffect(() => {
    // 1. Subscribe to system_status updates (CPU/Mem from the monitor script)
    const subscribeToStats = async () => {
      try {
        // Check if monitor record exists first (one-time check)
        const record = await pb
          .collection('system_status')
          .getOne('monitor_srv_001')
          .catch(() => null);

        if (!record) {
          console.warn('System monitor record monitor_srv_001 not found. Disabling monitoring.');
          setHealth((prev) => ({ ...prev, isLive: false }));
          return () => {};
        }

        // Initial data
        setHealth((prev) => ({
          ...prev,
          cpuLoad: record.cpu_load || 0,
          memoryUsage: record.memory_usage || 0,
          uptime: record.uptime || 0,
          lastUpdated: record.last_updated || '',
        }));

        // Realtime Subscription
        const unsubscribe = await pb.collection('system_status').subscribe('*', (e) => {
          if (
            e.record.id === 'monitor_srv_001' &&
            (e.action === 'update' || e.action === 'create')
          ) {
            setHealth((prev) => ({
              ...prev,
              cpuLoad: e.record.cpu_load || 0,
              memoryUsage: e.record.memory_usage || 0,
              uptime: e.record.uptime || 0,
              lastUpdated: e.record.last_updated || '',
            }));
          }
        });

        // No polling needed with realtime subscription - remove aggressive polling
        // Fallback check every 5min only if subscription drops
        const pollInterval = setInterval(async () => {
          try {
            const latest = await pb.collection('system_status').getOne('monitor_srv_001');
            setHealth((prev) => ({
              ...prev,
              cpuLoad: latest.cpu_load || 0,
              memoryUsage: latest.memory_usage || 0,
              uptime: latest.uptime || 0,
              lastUpdated: latest.last_updated || '',
            }));
          } catch (err) {
            // Silently ignore - subscription should handle updates
          }
        }, 300000); // 5 minutes

        return () => {
          clearInterval(pollInterval);
          unsubscribe();
        };
      } catch (err) {
        console.warn('System status collection unavailable:', err);
        return () => {};
      }
    };

    // 2. Measure Live Latency (Client -> PB)
    const checkLatency = async () => {
      const start = performance.now();
      try {
        // Simple light-weight request (e.g., list 1 item from a public/light collection or health check)
        // Since PB doesn't have a simple HEAD /health without auth sometimes,
        // we can check 'settings/public' or just list 1 user if allowed, or just await pb.health.check() if version supports

        await pb.health.check();

        const end = performance.now();
        setHealth((prev) => ({
          ...prev,
          latency: Math.round(end - start),
          isLive: true,
        }));
      } catch (err) {
        setHealth((prev) => ({
          ...prev,
          isLive: false, // Mark offline if ping fails
          latency: 0,
        }));
      }
    };

    let cleanupSubscription: (() => void) | undefined;

    subscribeToStats().then((cleanup) => {
      cleanupSubscription = cleanup;
    });

    checkLatency();
    const pingInterval = setInterval(checkLatency, 1000); // Check latency every 1s

    return () => {
      if (cleanupSubscription) cleanupSubscription();
      pb.collection('system_status').unsubscribe('*'); // Unsubscribe wildcard
      clearInterval(pingInterval);
    };
  }, []);

  return health;
};
