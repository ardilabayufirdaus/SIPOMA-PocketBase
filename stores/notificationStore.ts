import { create } from 'zustand';
import { pb } from '../utils/pocketbase';
import { AlertSeverity } from '../hooks/useNotifications';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: 'system' | 'maintenance' | 'production' | 'user' | 'security' | 'audit';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  snoozedUntil?: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  sound: boolean;
  showCriticalOnly: boolean;
  enableRealtime: boolean;
  soundVolume: number;
  categories: {
    system: boolean;
    maintenance: boolean;
    production: boolean;
    user: boolean;
    security: boolean;
    audit: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isConnected: boolean;
  subscription: (() => void) | { unsubscribe: () => void } | null;
  loading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Omit<NotificationData, 'id' | 'createdAt'>) => void;
  broadcastNotification: (
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'userId'>
  ) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  connectRealtime: (userId?: string) => void;
  disconnectRealtime: () => void;
  loadNotifications: (userId?: string) => Promise<void>;
  clearExpiredNotifications: () => void;
  requestBrowserPermission: () => Promise<boolean>;
}

const defaultPreferences: NotificationPreferences = {
  email: true,
  browser: true,
  sound: true,
  showCriticalOnly: false,
  enableRealtime: true,
  soundVolume: 0.7,
  categories: {
    system: true,
    maintenance: true,
    production: true,
    user: true,
    security: true,
    audit: false,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: defaultPreferences,
  isConnected: false,
  subscription: null,
  loading: false,
  error: null,

  addNotification: (notificationData) => {
    const notification: NotificationData = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    const state = get();

    // Check if notification should be shown based on preferences
    const shouldShow =
      state.preferences.categories[notification.category] &&
      (!state.preferences.showCriticalOnly || notification.severity === AlertSeverity.CRITICAL);

    if (!shouldShow) return;

    // Check quiet hours
    if (state.preferences.quietHours.enabled && isInQuietHours(state.preferences.quietHours)) {
      if (notification.severity !== AlertSeverity.CRITICAL) return;
    }

    set((state) => {
      const newNotifications = [notification, ...state.notifications].slice(0, 100);

      // Save to localStorage
      localStorage.setItem('sipoma_notifications', JSON.stringify(newNotifications));

      return {
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      };
    });

    // Show browser notification
    if (state.preferences.browser) {
      showBrowserNotification(notification);
    }

    // Play sound
    if (state.preferences.sound) {
      playNotificationSound(state.preferences.soundVolume);
    }
  },

  broadcastNotification: async (notificationData) => {
    try {
      set({ loading: true, error: null });

      // Get all active users
      const users = await pb.collection('users').getFullList({
        filter: 'is_active=true',
      });

      if (!users || users.length === 0) return;

      // Create notifications for all users
      const notifications = users.map((user) => ({
        title: notificationData.title,
        message: notificationData.message,
        severity: notificationData.severity,
        category: notificationData.category,
        actio_url: notificationData.actionUrl,
        action_label: notificationData.actionLabel,
        metadata: notificationData.metadata,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }));

      // Insert notifications in batch
      for (const notification of notifications) {
        await pb.collection('notifications').create(notification);
      }

      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to broadcast notification',
      });
    }
  },

  markAsRead: async (id) => {
    try {
      await pb.collection('notifications').update(id, {
        read_at: new Date().toISOString(),
      });

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date() } : n
        ),
        unreadCount: Math.max(
          0,
          state.unreadCount - (state.notifications.find((n) => n.id === id && !n.readAt) ? 1 : 0)
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    }
  },

  markAllAsRead: () => {
    const now = new Date();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, readAt: n.readAt || now })),
      unreadCount: 0,
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, dismissedAt: new Date() } : n
      ),
    }));
  },

  snoozeNotification: (id, minutes) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, snoozedUntil } : n)),
    }));
  },

  updatePreferences: (newPreferences) => {
    set((state) => ({
      preferences: { ...state.preferences, ...newPreferences },
    }));

    // Save to localStorage
    const state = get();
    localStorage.setItem('notification_preferences', JSON.stringify(state.preferences));

    // Update realtime connection if needed
    if (newPreferences.enableRealtime !== undefined) {
      if (newPreferences.enableRealtime) {
        state.connectRealtime();
      } else {
        state.disconnectRealtime();
      }
    }
  },

  connectRealtime: async (userId?: string) => {
    const state = get();
    if (state.subscription || !state.preferences.enableRealtime) return;

    try {
      let currentUserId = userId;

      if (!currentUserId) {
        // In PocketBase, we can get current user from pb.authStore
        const user = pb.authStore.model;
        if (!user) return;
        currentUserId = user.id;
      }

      let unsubscribe: (() => void) | undefined;

      pb.collection('notifications')
        .subscribe('*', (e) => {
          if (e.record.user_id === currentUserId && e.action === 'create') {
            const notification = e.record;
            state.addNotification({
              title: String(notification.title || ''),
              message: String(notification.message || ''),
              severity: (notification.severity as AlertSeverity) || AlertSeverity.INFO,
              category: (notification.category as NotificationData['category']) || 'system',
              actionUrl: notification.actio_url ? String(notification.actio_url) : undefined,
              actionLabel: notification.action_label
                ? String(notification.action_label)
                : undefined,
              metadata: (notification.metadata as Record<string, unknown>) || {},
              userId: String(notification.user_id || ''),
            });
          }
        })
        .then((unsub) => {
          unsubscribe = unsub;
        });

      set({ subscription: unsubscribe, isConnected: true });
    } catch {
      set({ error: 'Failed to connect to realtime notifications' });
    }
  },

  disconnectRealtime: () => {
    const state = get();
    if (state.subscription) {
      // For PocketBase, subscription is a function that we call to unsubscribe
      if (typeof state.subscription === 'function') {
        state.subscription();
      } else if (typeof state.subscription.unsubscribe === 'function') {
        state.subscription.unsubscribe();
      }
      set({ subscription: null, isConnected: false });
    }
  },

  loadNotifications: async (userId?: string) => {
    try {
      set({ loading: true, error: null });

      let currentUserId = userId;

      if (!currentUserId) {
        const user = pb.authStore.model;
        if (!user) {
          set({ loading: false });
          return;
        }
        currentUserId = user.id;
      }

      const result = await pb.collection('notifications').getList(1, 50, {
        filter: `user_id = '${currentUserId}'`,
        sort: '-created',
      });

      const notifications = result.items;
      if (notifications && notifications.length > 0) {
        const formattedNotifications: NotificationData[] = notifications.map(
          (n: Record<string, unknown>) => ({
            id: String(n.id || ''),
            title: String(n.title || ''),
            message: String(n.message || ''),
            severity: (n.severity as AlertSeverity) || AlertSeverity.INFO,
            category: (n.category as NotificationData['category']) || 'system',
            actionUrl: n.actio_url ? String(n.actio_url) : undefined,
            actionLabel: n.action_label ? String(n.action_label) : undefined,
            metadata: (n.metadata as Record<string, unknown>) || {},
            userId: String(n.user_id || ''),
            createdAt: new Date(String(n.created_at || '')),
            readAt: n.read_at ? new Date(String(n.read_at)) : undefined,
            dismissedAt: n.dismissed_at ? new Date(String(n.dismissed_at)) : undefined,
            snoozedUntil: n.snoozed_until ? new Date(String(n.snoozed_until)) : undefined,
            expiresAt: n.expires_at ? new Date(String(n.expires_at)) : undefined,
          })
        );

        const unreadCount = formattedNotifications.filter((n) => !n.readAt).length;

        set({
          notifications: formattedNotifications,
          unreadCount,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load notifications',
      });
    }
  },

  clearExpiredNotifications: () => {
    const now = new Date();
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.expiresAt || n.expiresAt > now),
    }));
  },

  requestBrowserPermission: async () => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },
}));

// Helper functions
function isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = quietHours.startTime.split(':').map(Number);
  const [endHour, endMin] = quietHours.endTime.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Spans midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

function showBrowserNotification(notification: NotificationData) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const browserNotif = new Notification(notification.title, {
    body: notification.message,
    icon: '/sipoma-logo.png',
    badge: '/sipoma-logo.png',
    tag: notification.id,
    requireInteraction: notification.severity === AlertSeverity.CRITICAL,
    data: {
      url: notification.actionUrl,
    },
  });

  browserNotif.onclick = () => {
    window.focus();
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    browserNotif.close();
  };

  // Auto close non-critical notifications
  if (notification.severity !== AlertSeverity.CRITICAL) {
    setTimeout(() => browserNotif.close(), 5000);
  }
}

function playNotificationSound(volume: number) {
  const audio = new Audio('/notification-sound.mp3');
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {
    // Silently fail if audio can't be played
  });
}

// Initialize preferences from localStorage
const savedPreferences = localStorage.getItem('notification_preferences');
if (savedPreferences) {
  try {
    const preferences = JSON.parse(savedPreferences);
    useNotificationStore.getState().updatePreferences(preferences);
  } catch {
    // Use default preferences
  }
}

export default useNotificationStore;
