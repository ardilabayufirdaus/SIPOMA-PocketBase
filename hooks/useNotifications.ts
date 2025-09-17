import { useState, useCallback, useEffect } from 'react';
import { Alert, AlertSeverity } from '../types';
import { supabase } from '../utils/supabase';

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  sound: boolean;
  showCriticalOnly: boolean;
}

export interface ExtendedAlert extends Alert {
  category?: 'system' | 'maintenance' | 'production' | 'user' | 'security';
  actionUrl?: string;
  dismissed?: boolean;
  snoozedUntil?: Date;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<ExtendedAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    browser: true,
    sound: true,
    showCriticalOnly: false,
  });
  const [loading, setLoading] = useState(true);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (notification: ExtendedAlert) => {
      if ('Notification' in window && Notification.permission === 'granted' && settings.browser) {
        const browserNotif = new Notification(notification.message, {
          icon: '/sipoma-logo.png',
          badge: '/sipoma-logo.png',
          tag: notification.id,
          silent: !settings.sound,
        });

        // Auto close after 5 seconds
        setTimeout(() => browserNotif.close(), 5000);

        // Handle click to navigate to action URL
        if (notification.actionUrl) {
          browserNotif.onclick = () => {
            window.focus();
            window.location.href = notification.actionUrl!;
          };
        }
      }
    },
    [settings.browser, settings.sound]
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (settings.sound) {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [settings.sound]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } else {
      const parsedNotifications = (data || []).map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp),
        snoozedUntil: notification.snoozed_until ? new Date(notification.snoozed_until) : undefined,
      }));
      setNotifications(parsedNotifications);
    }

    setLoading(false);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase.from('alerts').update({ read: true }).eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase.from('alerts').update({ read: true }).in('id', unreadIds);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [notifications]);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    // For now, we'll just mark as read since dismissed column might not exist
    const { error } = await supabase.from('alerts').update({ read: true }).eq('id', notificationId);

    if (error) {
      console.error('Error dismissing notification:', error);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, dismissed: true, read: true } : n))
      );
    }
  }, []);

  // Snooze notification
  const snoozeNotification = useCallback(async (notificationId: string, minutes: number) => {
    // For now, we'll just mark as read since snoozed_until column might not exist
    const { error } = await supabase.from('alerts').update({ read: true }).eq('id', notificationId);

    if (error) {
      console.error('Error snoozing notification:', error);
    } else {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, snoozedUntil: snoozeUntil, read: true } : n
        )
      );
    }
  }, []);

  // Create new notification
  const createNotification = useCallback(
    async (
      message: string,
      severity: AlertSeverity,
      category: ExtendedAlert['category'] = 'system',
      actionUrl?: string
    ) => {
      const newNotification = {
        message,
        severity,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert([newNotification])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
      } else {
        const parsedNotification: ExtendedAlert = {
          ...data,
          severity: data.severity as AlertSeverity,
          timestamp: new Date(data.timestamp),
          category,
          actionUrl,
        };

        setNotifications((prev) => [parsedNotification, ...prev]);

        // Show browser notification for new alerts
        if (severity === AlertSeverity.CRITICAL || !settings.showCriticalOnly) {
          showBrowserNotification(parsedNotification);
          playNotificationSound();
        }
      }
    },
    [settings.showCriticalOnly, showBrowserNotification, playNotificationSound]
  );

  // Update notification settings
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      // Save to localStorage for persistence
      localStorage.setItem('notificationSettings', JSON.stringify({ ...settings, ...newSettings }));
    },
    [settings]
  );

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, [fetchNotifications, requestNotificationPermission]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newNotification: ExtendedAlert = {
            ...(payload.new as any),
            timestamp: new Date(payload.new.timestamp),
            actionUrl: payload.new.action_url,
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Show browser notification for new alerts
          if (newNotification.severity === AlertSeverity.CRITICAL || !settings.showCriticalOnly) {
            showBrowserNotification(newNotification);
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [settings.showCriticalOnly, showBrowserNotification, playNotificationSound]);

  // Filter notifications based on settings and snooze status
  const filteredNotifications = notifications.filter((notification) => {
    if (notification.dismissed) return false;
    if (notification.snoozedUntil && notification.snoozedUntil > new Date()) return false;
    if (settings.showCriticalOnly && notification.severity !== AlertSeverity.CRITICAL) return false;
    return true;
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    unreadCount,
    loading,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    createNotification,
    updateSettings,
    refetch: fetchNotifications,
  };
};
