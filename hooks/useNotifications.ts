import { useState, useCallback } from 'react';

export enum AlertSeverity {
  INFO = 'Info',
  WARNING = 'Warning',
  CRITICAL = 'Critical',
}

export interface Alert {
  id: string;
  message: string;
  timestamp: Date;
  severity: AlertSeverity;
  read: boolean;
}

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
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    browser: true,
    sound: true,
    showCriticalOnly: false,
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, dismissed: true, read: true } : n))
    );
  }, []);

  const snoozeNotification = useCallback(async (notificationId: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, snoozedUntil, read: true } : n))
    );
  }, []);

  const createNotification = useCallback(
    async (
      message: string,
      severity: AlertSeverity,
      category: ExtendedAlert['category'] = 'system',
      actionUrl?: string
    ) => {
      const newNotification: ExtendedAlert = {
        id: `local-${Date.now()}`,
        message,
        severity,
        timestamp: new Date(),
        read: false,
        category,
        actionUrl,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    if (settings.showCriticalOnly && notification.severity !== AlertSeverity.CRITICAL) {
      return false;
    }
    if (notification.dismissed) {
      return false;
    }
    if (notification.snoozedUntil && notification.snoozedUntil > new Date()) {
      return false;
    }
    return true;
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return {
    notifications: filteredNotifications,
    loading,
    settings,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    createNotification,
    updateSettings,
  };
};
