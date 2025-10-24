import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { AlertSeverity } from './useNotifications';

/**
 * Hook untuk mengelola notifikasi dengan mudah
 */
export const useEnhancedNotifications = () => {
  const {
    notifications,
    unreadCount,
    preferences,
    isConnected,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    updatePreferences,
    connectRealtime,
    disconnectRealtime,
    loadNotifications,
    clearExpiredNotifications,
    requestBrowserPermission,
  } = useNotificationStore();

  // Initialize notifications
  useEffect(() => {
    loadNotifications();

    // Connect to realtime if enabled
    if (preferences.enableRealtime) {
      connectRealtime();
    }

    // Request browser permission if enabled
    if (preferences.browser) {
      requestBrowserPermission();
    }

    // Cleanup expired notifications every hour
    const cleanupInterval = setInterval(clearExpiredNotifications, 60 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      disconnectRealtime();
    };
  }, []);

  // Reconnect when realtime preference changes
  useEffect(() => {
    if (preferences.enableRealtime && !isConnected) {
      connectRealtime();
    } else if (!preferences.enableRealtime && isConnected) {
      disconnectRealtime();
    }
  }, [preferences.enableRealtime, isConnected]);

  // Helper functions for easy notification creation
  const notify = {
    success: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.INFO,
          category: 'system',
          ...options,
        });
      },
      [addNotification]
    ),

    warning: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.WARNING,
          category: 'system',
          ...options,
        });
      },
      [addNotification]
    ),

    error: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.CRITICAL,
          category: 'system',
          ...options,
        });
      },
      [addNotification]
    ),

    info: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.INFO,
          category: 'system',
          ...options,
        });
      },
      [addNotification]
    ),

    security: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.CRITICAL,
          category: 'security',
          ...options,
        });
      },
      [addNotification]
    ),

    maintenance: useCallback(
      (title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => {
        addNotification({
          title,
          message,
          severity: AlertSeverity.WARNING,
          category: 'maintenance',
          ...options,
        });
      },
      [addNotification]
    ),

    production: useCallback(
      (
        title: string,
        message: string,
        severity: AlertSeverity = AlertSeverity.INFO,
        options?: { actionUrl?: string; actionLabel?: string }
      ) => {
        addNotification({
          title,
          message,
          severity,
          category: 'production',
          ...options,
        });
      },
      [addNotification]
    ),
  };

  // System event notifications
  const notifySystemEvent = useCallback(
    (event: string, details?: string) => {
      switch (event) {
        case 'login':
          notify.success('Welcome back!', details || 'You have successfully logged in.');
          break;
        case 'logout':
          notify.info('Logged out', details || 'You have been logged out successfully.');
          break;
        case 'data_sync':
          notify.info('Data synchronized', details || 'Your data has been synchronized.');
          break;
        case 'backup_complete':
          notify.success(
            'Backup completed',
            details || 'System backup has been completed successfully.'
          );
          break;
        case 'maintenance_start':
          notify.maintenance(
            'Maintenance started',
            details || 'System maintenance is now in progress.'
          );
          break;
        case 'maintenance_end':
          notify.success(
            'Maintenance completed',
            details || 'System maintenance has been completed.'
          );
          break;
        case 'security_alert':
          notify.security('Security Alert', details || 'A security event has been detected.');
          break;
        case 'connection_lost':
          notify.warning(
            'Connection lost',
            details || 'Real-time connection has been lost. Trying to reconnect...'
          );
          break;
        case 'connection_restored':
          notify.success(
            'Connection restored',
            details || 'Real-time connection has been restored.'
          );
          break;
        default:
          notify.info('System notification', details || event);
      }
    },
    [notify]
  );

  // Production event notifications
  const notifyProductionEvent = useCallback(
    (event: string, severity: AlertSeverity, details?: string, plantUnit?: string) => {
      const title = plantUnit ? `${plantUnit}: ${event}` : event;
      notify.production(title, details || `Production event: ${event}`, severity, {
        actionUrl: '/plant-operations',
      });
    },
    [notify]
  );

  // User action notifications
  const notifyUserAction = useCallback(
    (action: string, success: boolean, details?: string) => {
      if (success) {
        notify.success(
          `${action} successful`,
          details || `${action} has been completed successfully.`
        );
      } else {
        notify.error(
          `${action} failed`,
          details || `${action} could not be completed. Please try again.`
        );
      }
    },
    [notify]
  );

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    isConnected,
    loading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    updatePreferences,
    requestBrowserPermission,

    // Helper functions
    notify,
    notifySystemEvent,
    notifyProductionEvent,
    notifyUserAction,

    // Connection management
    connectRealtime,
    disconnectRealtime,

    // Utility
    clearExpiredNotifications,
  };
};

/**
 * Hook untuk mengelola toast notifications (untuk notifikasi sementara)
 */
export const useToastNotifications = () => {
  const { notify } = useEnhancedNotifications();

  const toast = {
    success: useCallback((message: string) => notify.success('Success', message), [notify]),
    error: useCallback((message: string) => notify.error('Error', message), [notify]),
    warning: useCallback((message: string) => notify.warning('Warning', message), [notify]),
    info: useCallback((message: string) => notify.info('Info', message), [notify]),
  };

  return { toast };
};

export default useEnhancedNotifications;
