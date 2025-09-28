import React, { useState, useEffect, useCallback } from 'react';
import { NotificationData, NotificationPreferences } from '../stores/notificationStore';
import { AlertSeverity } from '../types';
import { formatTimeSince } from '../utils/formatters';
import BellIcon from './icons/BellIcon';
import BellSlashIcon from './icons/BellSlashIcon';
import XMarkIcon from './icons/XMarkIcon';
import ClockIcon from './icons/ClockIcon';
import CheckIcon from './icons/CheckIcon';
import CogIcon from './icons/CogIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface EnhancedNotificationPanelProps {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isOpen: boolean;
  onToggle: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onUpdatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  onAction?: (notification: NotificationData) => void;
}

const EnhancedNotificationPanel: React.FC<EnhancedNotificationPanelProps> = ({
  notifications,
  unreadCount,
  preferences,
  isOpen,
  onToggle,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onSnooze,
  onUpdatePreferences,
  onAction,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // Filter notifications based on current filter and preferences
  const filteredNotifications = notifications
    .filter((n) => {
      // Don't show dismissed notifications
      if (n.dismissedAt) return false;

      // Don't show snoozed notifications that are still snoozed
      if (n.snoozedUntil && n.snoozedUntil > new Date()) return false;

      // Apply filter
      switch (filter) {
        case 'unread':
          return !n.readAt;
        case 'critical':
          return n.severity === AlertSeverity.CRITICAL;
        default:
          return true;
      }
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Auto-mark as read when panel is opened
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(() => {
        // Mark visible unread notifications as read after 3 seconds
        const visibleUnread = filteredNotifications.filter((n) => !n.readAt).slice(0, 5); // Only first 5 visible

        visibleUnread.forEach((n) => onMarkAsRead(n.id));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, filteredNotifications, onMarkAsRead]);

  const handleSnooze = useCallback(
    (id: string, minutes: number) => {
      onSnooze(id, minutes);
      setActiveSnoozeId(null);
    },
    [onSnooze]
  );

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case AlertSeverity.WARNING:
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case AlertSeverity.INFO:
        return <QuestionMarkCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <QuestionMarkCircleIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCategoryIcon = (category: NotificationData['category']) => {
    switch (category) {
      case 'security':
        return <ShieldCheckIcon className="w-4 h-4" />;
      case 'system':
        return <CogIcon className="w-4 h-4" />;
      default:
        return <BellIcon className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case AlertSeverity.WARNING:
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10';
      case AlertSeverity.INFO:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-slate-500 bg-slate-50 dark:bg-slate-900/10';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {preferences.enableRealtime ? (
          <BellIcon className="w-6 h-6" />
        ) : (
          <BellSlashIcon className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:absolute lg:inset-auto lg:right-0 lg:top-12 lg:w-96">
      {/* Backdrop for mobile */}
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50" onClick={onToggle} />

      {/* Panel */}
      <div className="bg-white dark:bg-slate-900 lg:rounded-lg lg:shadow-xl border-l lg:border border-slate-200 dark:border-slate-700 h-full lg:h-auto lg:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Notification settings"
            >
              <CogIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onToggle}
              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Close notifications"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
              Notification Settings
            </h4>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.browser}
                  onChange={(e) => onUpdatePreferences({ browser: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                  Browser notifications
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={(e) => onUpdatePreferences({ sound: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                  Sound alerts
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.showCriticalOnly}
                  onChange={(e) => onUpdatePreferences({ showCriticalOnly: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                  Critical only
                </span>
              </label>

              {preferences.sound && (
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
                    Sound Volume: {Math.round(preferences.soundVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.soundVolume}
                    onChange={(e) =>
                      onUpdatePreferences({ soundVolume: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'all', label: 'All', count: filteredNotifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            {
              key: 'critical',
              label: 'Critical',
              count: notifications.filter(
                (n) => n.severity === AlertSeverity.CRITICAL && !n.dismissedAt
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Actions */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <CheckIcon className="w-4 h-4 inline mr-1" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellSlashIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getSeverityColor(notification.severity)} ${
                    !notification.readAt ? 'bg-opacity-100' : 'bg-opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getSeverityIcon(notification.severity)}
                        {getCategoryIcon(notification.category)}
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {notification.title}
                        </h4>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTimeSince(notification.createdAt)}
                        </span>

                        <div className="flex space-x-1">
                          {notification.actionUrl && (
                            <button
                              onClick={() => onAction?.(notification)}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            >
                              {notification.actionLabel || 'View'}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setActiveSnoozeId(
                                activeSnoozeId === notification.id ? null : notification.id
                              )
                            }
                            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                          >
                            <ClockIcon className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onDismiss(notification.id)}
                            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Snooze Options */}
                  {activeSnoozeId === notification.id && (
                    <div className="mt-3 flex space-x-2">
                      {[15, 60, 240, 1440].map((minutes) => (
                        <button
                          key={minutes}
                          onClick={() => handleSnooze(notification.id, minutes)}
                          className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {minutes < 60
                            ? `${minutes}m`
                            : minutes < 1440
                              ? `${Math.floor(minutes / 60)}h`
                              : '1d'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedNotificationPanel;
