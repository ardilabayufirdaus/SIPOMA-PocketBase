import React, { useState, useEffect } from 'react';
import { realtimeMonitor } from '../../utils/realtimeMonitor';

interface RealtimeIndicatorProps {
  className?: string;
}

const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean>(realtimeMonitor.isConnected);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(realtimeMonitor.lastUpdate);
  const [showPulse, setShowPulse] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  // Subscribe to realtime connection status changes
  useEffect(() => {
    const unsubscribe = realtimeMonitor.addListener((connected, lastUpdateTime) => {
      setIsConnected(connected);
      setLastUpdate(lastUpdateTime);

      // Update subscription count
      let count = 0;
      realtimeMonitor.activeSubscriptions.forEach((value) => {
        count += value;
      });
      setSubscriptionCount(count);

      // Show pulse animation on updates
      if (lastUpdateTime) {
        setShowPulse(true);
        const timer = setTimeout(() => setShowPulse(false), 2000);
        return () => clearTimeout(timer);
      }
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isConnected ? `bg-green-500 ${showPulse ? 'animate-pulse' : ''}` : 'bg-red-500'
          }`}
        />
        <span
          className={`font-medium ${
            isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {isConnected ? 'Realtime' : 'Offline'}
        </span>
        {subscriptionCount > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
            ({subscriptionCount})
          </span>
        )}
      </div>
      {lastUpdate && (
        <span className="text-slate-500 dark:text-slate-400">
          Last: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default RealtimeIndicator;

