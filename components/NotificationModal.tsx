import React from 'react';
import Modal from './Modal';
import { EnhancedButton } from './ui/EnhancedComponents';
import CheckIcon from './icons/CheckIcon';
import XMarkIcon from './icons/XMarkIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import { ExtendedAlert } from '../hooks/useNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ExtendedAlert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  t: Record<string, string>;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  t,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.notifications_title || 'Notifications'}>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.notifications_title || 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <EnhancedButton
                onClick={markAllAsRead}
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

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors ${
                  !notification.read_at
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {notification.category || 'system'}
                      </span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          notification.severity === 'Critical'
                            ? 'bg-red-500'
                            : notification.severity === 'Warning'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                        }`}
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {notification.message}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!notification.read_at && (
                      <EnhancedButton
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        ariaLabel="Mark as read"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </EnhancedButton>
                    )}
                    <EnhancedButton
                      onClick={() => dismissNotification(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 text-red-500 hover:text-red-600"
                      ariaLabel="Dismiss notification"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </EnhancedButton>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <EyeSlashIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.no_new_notifications || 'No new notifications'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <EnhancedButton
            variant="ghost"
            size="sm"
            className="w-full text-center px-4 py-3 text-xs"
            ariaLabel={t.view_all_notifications || 'View all notifications'}
          >
            {t.view_all_notifications || 'View all notifications'}
          </EnhancedButton>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;

