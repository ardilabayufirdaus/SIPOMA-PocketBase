import { useState, useEffect, useCallback } from 'react';

interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  hasUpdates: boolean;
  canInstall: boolean;
}

export interface UseServiceWorkerOptions {
  onUpdateAvailable?: () => void;
  onInstallPrompt?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: PWAInstallPrompt;
  }
}

export function useServiceWorker(options: UseServiceWorkerOptions = {}) {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Register service worker
  const registerSW = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setSwRegistration(registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              options.onUpdateAvailable?.();
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          setUpdateAvailable(true);
          options.onUpdateAvailable?.();
        }
      });

      return registration;
    } catch (error) {
      void error;
      return null;
    }
  }, [options]);

  // Update service worker
  const updateSW = useCallback(async () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  }, [swRegistration]);

  // Handle install prompt
  useEffect(() => {
    const handleInstallPrompt = (e: PWAInstallPrompt) => {
      e.preventDefault();
      setInstallPrompt(e);
      options.onInstallPrompt?.();
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [options]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      options.onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      options.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options]);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      void error;
      return false;
    }
  }, [installPrompt]);

  // Initialize on mount
  useEffect(() => {
    registerSW();
  }, [registerSW]);

  return {
    swRegistration,
    updateAvailable,
    installPrompt: installPrompt !== null,
    isOnline,
    updateSW,
    installPWA,
    canInstall: installPrompt !== null,
  };
}

export function usePWAStatus(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    hasUpdates: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone) ||
      document.referrer.includes('android-app://');

    // Check if app is installed (approximate)
    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setStatus((prev) => ({
      ...prev,
      isStandalone,
      isInstalled,
    }));

    // Listen for install prompt
    const handleInstallPrompt = () => {
      setStatus((prev) => ({
        ...prev,
        isInstallable: true,
        canInstall: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      localStorage.setItem('pwa-installed', 'true');
      setStatus((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for online/offline
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

// Utility functions
export const PWAUtils = {
  // Check if PWA is supported
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Get PWA display mode
  getDisplayMode: (): string => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  },

  // Check if running on mobile
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  // Get network information
  getNetworkInfo: () => {
    interface NetworkConnection {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    }

    const connection =
      ('connection' in navigator &&
        (navigator as Navigator & { connection?: NetworkConnection }).connection) ||
      ('mozConnection' in navigator &&
        (navigator as Navigator & { mozConnection?: NetworkConnection }).mozConnection) ||
      ('webkitConnection' in navigator &&
        (navigator as Navigator & { webkitConnection?: NetworkConnection }).webkitConnection);

    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return null;
  },

  // Cache management
  clearCache: async (): Promise<void> => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  },

  // Get cache size
  getCacheSize: async (): Promise<number> => {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  },
};

