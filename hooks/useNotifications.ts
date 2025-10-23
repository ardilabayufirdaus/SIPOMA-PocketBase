import { useState, useCallback, useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';

export enum AlertSeverity {
  INFO = 'Info',
  WARNING = 'Warning',
  CRITICAL = 'Critical',
}

export interface Alert {
  id: string;
  message: string;
  severity: string;
  created_at: string;
  read_at?: string;
  category?: string;
  dismissed?: boolean;
  snoozed_until?: string;
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

export const useNotifications = (currentUser?: { id: string } | null) => {
  const notificationStore = useNotificationStore();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    browser: true,
    sound: true,
    showCriticalOnly: false,
  });

  // Load notifications on mount
  useEffect(() => {
    notificationStore.loadNotifications(currentUser?.id);
    notificationStore.connectRealtime(currentUser?.id);
    notificationStore.clearExpiredNotifications();

    return () => {
      notificationStore.disconnectRealtime();
    };
  }, [currentUser?.id]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      notificationStore.markAsRead(notificationId);
    },
    [notificationStore]
  );

  const markAllAsRead = useCallback(async () => {
    notificationStore.markAllAsRead();
  }, [notificationStore]);

  const dismissNotification = useCallback(
    async (notificationId: string) => {
      notificationStore.dismissNotification(notificationId);
    },
    [notificationStore]
  );

  const snoozeNotification = useCallback(
    async (notificationId: string, minutes: number) => {
      notificationStore.snoozeNotification(notificationId, minutes);
    },
    [notificationStore]
  );

  const createNotification = useCallback(
    async (
      message: string,
      severity: AlertSeverity,
      category: ExtendedAlert['category'] = 'system',
      actionUrl?: string
    ) => {
      notificationStore.addNotification({
        title: 'Notification',
        message,
        severity,
        category,
        actionUrl,
      });
    },
    [notificationStore]
  );

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const filteredNotifications: ExtendedAlert[] = notificationStore.notifications
    .filter((notification) => {
      if (settings.showCriticalOnly && notification.severity !== AlertSeverity.CRITICAL) {
        return false;
      }
      if (notification.dismissedAt) {
        return false;
      }
      if (notification.snoozedUntil && notification.snoozedUntil > new Date()) {
        return false;
      }
      return true;
    })
    .map((notification) => ({
      id: notification.id,
      message: notification.message,
      severity: notification.severity,
      created_at: notification.createdAt.toISOString(),
      category: notification.category as ExtendedAlert['category'],
      actionUrl: notification.actionUrl,
      dismissed: !!notification.dismissedAt,
      snoozedUntil: notification.snoozedUntil,
      read_at: notification.readAt?.toISOString(),
    }));

  const unreadCount = filteredNotifications.filter((n) => !n.read_at).length;

  return {
    notifications: filteredNotifications,
    loading: notificationStore.loading,
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

