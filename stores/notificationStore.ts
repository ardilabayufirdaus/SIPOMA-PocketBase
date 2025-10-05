import { create } from 'zustand';
import { supabase } from '../utils/supabase';
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
  subscription: any;
  loading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Omit<NotificationData, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  loadNotifications: () => Promise<void>;
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

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date() } : n
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount - (state.notifications.find((n) => n.id === id && !n.readAt) ? 1 : 0)
      ),
    }));
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

  connectRealtime: async () => {
    const state = get();
    if (state.subscription || !state.preferences.enableRealtime) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification = payload.new as Record<string, unknown>;
            state.addNotification({
              title: String(notification.title || ''),
              message: String(notification.message || ''),
              severity: (notification.severity as AlertSeverity) || AlertSeverity.INFO,
              category: (notification.category as NotificationData['category']) || 'system',
              actionUrl: notification.action_url ? String(notification.action_url) : undefined,
              actionLabel: notification.action_label
                ? String(notification.action_label)
                : undefined,
              metadata: (notification.metadata as Record<string, unknown>) || {},
              userId: String(notification.user_id || ''),
            });
          }
        )
        .subscribe((status) => {
          set({ isConnected: status === 'SUBSCRIBED' });
        });

      set({ subscription });
    } catch {
      set({ error: 'Failed to connect to realtime notifications' });
    }
  },

  disconnectRealtime: () => {
    const state = get();
    if (state.subscription) {
      state.subscription.unsubscribe();
      set({ subscription: null, isConnected: false });
    }
  },

  loadNotifications: async () => {
    set({ loading: true, error: null });

    try {
      // For now, load from localStorage - can be enhanced with database later
      const savedNotifications = localStorage.getItem('sipoma_notifications');
      let notifications: NotificationData[] = [];

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        notifications = parsed.map((n: Record<string, unknown>) => ({
          ...n,
          createdAt: new Date(String(n.createdAt)),
          readAt: n.readAt ? new Date(String(n.readAt)) : undefined,
          dismissedAt: n.dismissedAt ? new Date(String(n.dismissedAt)) : undefined,
          snoozedUntil: n.snoozedUntil ? new Date(String(n.snoozedUntil)) : undefined,
          expiresAt: n.expiresAt ? new Date(String(n.expiresAt)) : undefined,
        })) as NotificationData[];
      }

      const unreadCount = notifications.filter((n) => !n.readAt && !n.dismissedAt).length;

      set({
        notifications,
        unreadCount,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load notifications',
        loading: false,
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
