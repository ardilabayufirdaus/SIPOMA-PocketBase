import { useEffect, useState, useCallback } from 'react';

// Service Worker states
export type ServiceWorkerState =
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant'
  | 'error';

export interface ServiceWorkerStatus {
  state: ServiceWorkerState;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

// Custom hook for managing Service Worker
export const useServiceWorker = () => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    state: 'installing',
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    registration: null,
  });

  // Register Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setStatus((prev) => ({ ...prev, isUpdateAvailable: true }));

            newWorker.addEventListener('statechange', () => {
              setStatus((prev) => ({
                ...prev,
                state: newWorker.state as ServiceWorkerState,
              }));

              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
              }
            });
          }
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        setStatus((prev) => ({
          ...prev,
          registration,
          state: registration.active ? 'activated' : 'installing',
        }));
      } catch (error) {
        // Service Worker registration failed - logging removed for production
        setStatus((prev) => ({ ...prev, state: 'error' }));
      }
    } else {
      // Service Worker not supported - logging removed for production
    }
  }, []);

  // Update Service Worker
  const updateServiceWorker = useCallback(async () => {
    if (status.registration) {
      try {
        await status.registration.update();
      } catch (error) {
        // Service Worker update failed - logging removed for production
      }
    }
  }, [status.registration]);

  // Skip waiting (activate new SW immediately)
  const skipWaiting = useCallback(async () => {
    if (status.registration && status.registration.waiting) {
      status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [status.registration]);

  // Send message to Service Worker
  const sendMessage = useCallback((message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      // Trigger background sync
      sendMessage({ type: 'SYNC_DATA' });
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sendMessage]);

  // Register SW on mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // Listen for messages from Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'CACHE_UPDATED':
          break;
        case 'SYNC_COMPLETED':
          break;
        case 'ERROR':
          // Service Worker error - logging removed for production
          break;
        default:
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    ...status,
    registerServiceWorker,
    updateServiceWorker,
    skipWaiting,
    sendMessage,
  };
};

// Hook for monitoring cache status
export const useCacheStatus = () => {
  const [cacheStatus, setCacheStatus] = useState({
    apiCacheSize: 0,
    staticCacheSize: 0,
    totalCacheSize: 0,
    lastUpdated: null as Date | null,
  });

  const updateCacheStatus = useCallback(async () => {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let apiSize = 0;
      let staticSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              const size = parseInt(contentLength);
              totalSize += size;

              if (cacheName.includes('api')) {
                apiSize += size;
              } else if (cacheName.includes('static')) {
                staticSize += size;
              }
            }
          }
        }
      }

      setCacheStatus({
        apiCacheSize: apiSize,
        staticCacheSize: staticSize,
        totalCacheSize: totalSize,
        lastUpdated: new Date(),
      });
    } catch (error) {
      // Failed to get cache status - logging removed for production
    }
  }, []);

  useEffect(() => {
    updateCacheStatus();

    // Update cache status periodically
    const interval = setInterval(updateCacheStatus, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [updateCacheStatus]);

  return cacheStatus;
};

// Hook for offline data management
export const useOfflineData = () => {
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const addToOfflineQueue = useCallback((request: any) => {
    setOfflineQueue((prev) => [...prev, { ...request, timestamp: Date.now() }]);
  }, []);

  const removeFromOfflineQueue = useCallback((index: number) => {
    setOfflineQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
  }, []);

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Load queue from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('offline-queue');
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved));
      } catch (error) {
        // Failed to load offline queue - logging removed for production
      }
    }
  }, []);

  return {
    offlineQueue,
    addToOfflineQueue,
    removeFromOfflineQueue,
    clearOfflineQueue,
  };
};
