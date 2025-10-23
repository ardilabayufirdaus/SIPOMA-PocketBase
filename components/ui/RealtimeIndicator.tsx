import React, { useState, useEffect } from 'react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
  className?: string;
}

const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  lastUpdate,
  className = '',
}) => {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

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


