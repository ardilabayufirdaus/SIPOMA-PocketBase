import { useState, useEffect, useCallback } from 'react';
import { pb } from '../utils/pocketbase-simple';

export interface ServerStatsSummary {
  load: string;
  memory: string;
  disk: string;
  temp?: string;
  status: 'online' | 'offline' | 'warning';
}

export const useServerStats = () => {
  const [stats, setStats] = useState<ServerStatsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.send('/api/server/stats', { method: 'GET' });
      const newStats = result as { load?: string; memory?: string; disk?: string; temp?: string };

      // Basic health check
      let status: 'online' | 'warning' | 'offline' = 'online';

      if (newStats.load) {
        const load1 = parseFloat(newStats.load.split(' ')[0]);
        if (load1 > 10.0) status = 'warning'; // Arbitrary threshold
      }

      if (newStats.temp) {
        const tempVal = parseFloat(newStats.temp);
        if (tempVal > 75) status = 'warning';
      }

      setStats({
        load: newStats.load || '0.00',
        memory: newStats.memory || '',
        disk: newStats.disk || '',
        temp: newStats.temp,
        status,
      });
    } catch (err) {
      console.error('Failed to fetch server stats for dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
};
