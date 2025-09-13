import React, { useState } from "react";
import { ExtendedAlert, NotificationSettings } from "../hooks/useNotifications";
import { AlertSeverity } from "../types";
import { formatTimeSince } from "../utils/formatters";
import BellIcon from "./icons/BellIcon";
import BellSlashIcon from "./icons/BellSlashIcon";
import XMarkIcon from "./icons/XMarkIcon";
import ClockIcon from "./icons/ClockIcon";
import CheckIcon from "./icons/CheckIcon";
import CogIcon from "./icons/CogIcon";
import EyeSlashIcon from "./icons/EyeSlashIcon";
import SpeakerWaveIcon from "./icons/SpeakerWaveIcon";
import SpeakerXMarkIcon from "./icons/SpeakerXMarkIcon";
import { EnhancedButton, useAccessibility } from "./ui/EnhancedComponents";

interface NotificationPanelProps {
  notifications: ExtendedAlert[];
  unreadCount: number;
  settings: NotificationSettings;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  t: any;
  isOpen: boolean;
  onToggle: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  settings,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onSnooze,
  onUpdateSettings,
  t,
  isOpen,
  onToggle,
}) => {
  const { announceToScreenReader } = useAccessibility();
  const [showSettings, setShowSettings] = useState(false);
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

  const severityColors: { [key in AlertSeverity]: string } = {
    [AlertSeverity.CRITICAL]: "bg-red-500",
    [AlertSeverity.WARNING]: "bg-amber-500",
    [AlertSeverity.INFO]: "bg-blue-500",
  };

  const severityIcons: { [key in AlertSeverity]: string } = {
    [AlertSeverity.CRITICAL]: "🚨",
    [AlertSeverity.WARNING]: "⚠️",
    [AlertSeverity.INFO]: "ℹ️",
  };

  const categoryLabels: { [key: string]: string } = {
    system: "System",
    maintenance: "Maintenance",
    production: "Production",
    user: "User",
    security: "Security",
  };

  const snoozeOptions = [
    { label: "15 minutes", value: 15 },
    { label: "1 hour", value: 60 },
    { label: "4 hours", value: 240 },
    { label: "1 day", value: 1440 },
  ];

  const handleSnooze = (notificationId: string, minutes: number) => {
    onSnooze(notificationId, minutes);
    setActiveSnoozeId(null);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (
      settings.showCriticalOnly &&
      notification.severity !== AlertSeverity.CRITICAL
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <EnhancedButton
        onClick={onToggle}
        variant="ghost"
        size="sm"
        className="p-3 min-h-[44px] min-w-[44px]"
        ariaLabel={`View notifications. ${
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "No new notifications"
        }`}
      >
        {settings.browser ? (
          <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        ) : (
          <BellSlashIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-800 animate-pulse"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </EnhancedButton>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-white dark:ring-opacity-10 ring-opacity-5 focus:outline-none z-30 animate-fade-in-fast max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.notifications_title}
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Settings Button */}
              <EnhancedButton
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="sm"
                className="p-1.5"
                ariaLabel="Notification Settings"
              >
                <CogIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </EnhancedButton>
              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <EnhancedButton
                  onClick={onMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-1"
                  ariaLabel={t.mark_all_as_read}
                >
                  {t.mark_all_as_read}
                </EnhancedButton>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Notification Settings
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.browser}
                    onChange={(e) =>
                      onUpdateSettings({ browser: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
                  />
                  <BellIcon className="w-3 h-3" />
                  Browser Notifications
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.sound}
                    onChange={(e) =>
                      onUpdateSettings({ sound: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
                  />
                  {settings.sound ? (
                    <SpeakerWaveIcon className="w-3 h-3" />
                  ) : (
                    <SpeakerXMarkIcon className="w-3 h-3" />
                  )}
                  Sound Alerts
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.showCriticalOnly}
                    onChange={(e) =>
                      onUpdateSettings({ showCriticalOnly: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-red-500">🚨</span>
                  Critical Only
                </label>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                    !notification.read ? "bg-red-50/50 dark:bg-red-500/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          severityColors[notification.severity]
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Category Badge */}
                          {notification.category && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md mb-1">
                              {categoryLabels[notification.category] ||
                                notification.category}
                            </span>
                          )}

                          {/* Message */}
                          <p className="text-sm text-slate-800 dark:text-slate-200 mb-1">
                            <span className="mr-1">
                              {severityIcons[notification.severity]}
                            </span>
                            {t[notification.message as keyof typeof t] ||
                              notification.message}
                          </p>

                          {/* Timestamp */}
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimeSince(notification.timestamp)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <EnhancedButton
                              onClick={() => onMarkAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="p-1"
                              ariaLabel={`Mark notification as read: ${notification.message}`}
                            >
                              <CheckIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </EnhancedButton>
                          )}

                          {/* Snooze Button */}
                          <div className="relative">
                            <EnhancedButton
                              onClick={() =>
                                setActiveSnoozeId(
                                  activeSnoozeId === notification.id
                                    ? null
                                    : notification.id
                                )
                              }
                              variant="ghost"
                              size="sm"
                              className="p-1"
                              ariaLabel={`Snooze notification: ${notification.message}`}
                            >
                              <ClockIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </EnhancedButton>

                            {/* Snooze Dropdown */}
                            {activeSnoozeId === notification.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40">
                                {snoozeOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      handleSnooze(
                                        notification.id,
                                        option.value
                                      )
                                    }
                                    className="block w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dismiss Button */}
                          <EnhancedButton
                            onClick={() => onDismiss(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            ariaLabel={`Dismiss notification: ${notification.message}`}
                          >
                            <XMarkIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          </EnhancedButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <EyeSlashIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.no_new_notifications}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-700">
            <EnhancedButton
              variant="ghost"
              size="sm"
              className="w-full text-center px-4 py-3 text-xs"
              ariaLabel={t.view_all_notifications}
            >
              {t.view_all_notifications}
            </EnhancedButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
