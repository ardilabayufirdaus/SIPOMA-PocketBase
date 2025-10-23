import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from '../types/supabase';
import { AlertSeverity, ExtendedAlert } from './useNotifications';
import { pb } from '../utils/pocketbase-simple';

// Enhanced debounce function with cancel support
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  sound: boolean;
  showCriticalOnly: boolean;
}

// Optimized notification actions interface
export interface NotificationActions {
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

// Cache for notifications to prevent unnecessary re-renders
const notificationCache = new Map<string, ExtendedAlert[]>();
const CACHE_DURATION = 30000; // 30 seconds

export const useOptimizedNotifications = () => {
  const [notifications, setNotifications] = useState<ExtendedAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    browser: true,
    sound: true,
    showCriticalOnly: false,
  });
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetch = useCallback(
    debounce(async () => {
      const now = Date.now();
      const cacheKey = 'notifications';

      // Check cache first
      if (notificationCache.has(cacheKey) && now - lastFetch < CACHE_DURATION) {
        return;
      }

      try {
        const records = await pb.collection('alerts').getFullList({
          sort: '-created_at',
          limit: 50,
        });

        const processedNotifications: ExtendedAlert[] =
          (records as unknown as Alert[])?.map((alert) => ({
            ...alert,
            category: (alert.category || 'system') as ExtendedAlert['category'],
            dismissed: alert.dismissed || false,
            snoozedUntil: alert.snoozed_until ? new Date(alert.snoozed_until) : undefined,
          })) || [];

        // Update cache
        notificationCache.set(cacheKey, processedNotifications);
        setNotifications(processedNotifications);
        setLastFetch(now);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    [lastFetch]
  );

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification with optimized options
  const showBrowserNotification = useCallback(
    (notification: ExtendedAlert) => {
      if ('Notification' in window && Notification.permission === 'granted' && settings.browser) {
        const browserNotif = new Notification(notification.message, {
          icon: '/sipoma-logo.png',
          badge: '/sipoma-logo.png',
          tag: notification.id,
          silent: !settings.sound,
          requireInteraction: notification.severity === AlertSeverity.CRITICAL,
        });

        // Auto close after 5 seconds for non-critical
        if (notification.severity !== AlertSeverity.CRITICAL) {
          setTimeout(() => browserNotif.close(), 5000);
        }
      }
    },
    [settings.browser, settings.sound]
  );

  // Optimized mark as read function
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );

    // Async update to database
    try {
      await pb.collection('alerts').update(id, { read_at: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Optimized mark all as read function
  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notification) =>
        !notification.read_at ? { ...notification, read_at: now } : notification
      )
    );

    // Async batch update to database
    try {
      const unreadNotifications = notifications.filter((n) => !n.read_at);
      for (const notification of unreadNotifications) {
        await pb.collection('alerts').update(notification.id, { read_at: now });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Optimized dismiss function
  const dismissNotification = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, dismissed: true } : notification
      )
    );

    try {
      await pb.collection('alerts').update(id, { dismissed: true });
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, []);

  // Optimized snooze function
  const snoozeNotification = useCallback(async (id: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60000);

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, snoozedUntil } : notification
      )
    );

    try {
      await pb.collection('alerts').update(id, { snoozed_until: snoozedUntil.toISOString() });
    } catch (error) {
      console.error('Failed to snooze notification:', error);
    }
  }, []);

  // Optimized settings update
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    const now = new Date();
    return notifications.filter((notification) => {
      // Filter out dismissed notifications
      if (notification.dismissed) return false;

      // Filter out snoozed notifications
      if (notification.snoozedUntil && notification.snoozedUntil > now) return false;

      // Filter by severity if showCriticalOnly is enabled
      if (settings.showCriticalOnly && notification.severity !== AlertSeverity.CRITICAL) {
        return false;
      }

      return true;
    });
  }, [notifications, settings.showCriticalOnly]);

  // Memoized unread count
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter((notification) => !notification.read_at).length;
  }, [filteredNotifications]);

  // Memoized actions object to prevent unnecessary re-renders
  const actions = useMemo<NotificationActions>(
    () => ({
      markAsRead,
      markAllAsRead,
      dismissNotification,
      snoozeNotification,
      updateSettings,
    }),
    [markAsRead, markAllAsRead, dismissNotification, snoozeNotification, updateSettings]
  );

  // Initialize and setup polling
  useEffect(() => {
    requestNotificationPermission();
    debouncedFetch();

    // Setup real-time subscription for critical alerts only
    let criticalUnsubscribe: (() => void) | undefined;
    pb.collection('alerts')
      .subscribe('*', (e) => {
        if (e.action === 'create') {
          const newAlert = e.record as unknown as ExtendedAlert;
          if (newAlert.severity === 'CRITICAL') {
            setNotifications((prev) => [newAlert, ...prev]);
            showBrowserNotification(newAlert);
          }
        }
      })
      .then((unsub) => {
        criticalUnsubscribe = unsub;
      });

    // Setup real-time subscription for info alerts (registration requests)
    let infoUnsubscribe: (() => void) | undefined;
    pb.collection('alerts')
      .subscribe('*', (e) => {
        if (e.action === 'create') {
          const newAlert = e.record as unknown as ExtendedAlert;
          if (newAlert.severity === 'INFO') {
            setNotifications((prev) => [newAlert, ...prev]);
            showBrowserNotification(newAlert);
          }
        }
      })
      .then((unsub) => {
        infoUnsubscribe = unsub;
      });

    // Cleanup polling interval (less frequent for optimization)
    const pollInterval = setInterval(debouncedFetch, 60000); // Poll every minute

    return () => {
      if (criticalUnsubscribe) criticalUnsubscribe();
      if (infoUnsubscribe) infoUnsubscribe();
      clearInterval(pollInterval);
      debouncedFetch.cancel();
    };
  }, [debouncedFetch, requestNotificationPermission, showBrowserNotification]);

  return {
    notifications: filteredNotifications,
    unreadCount,
    settings,
    actions,
    isLoading: loading,
  };
};

