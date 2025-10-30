import { useState, useEffect } from 'react';

// Hook to detect online/offline status and auto-switch to normal mode when online
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true); // Mark that we were offline, useful for triggering sync
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset wasOffline after it's been used
  const resetWasOffline = () => setWasOffline(false);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    resetWasOffline,
  };
};
