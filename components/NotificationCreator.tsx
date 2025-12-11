import React, { useState } from 'react';
import { AlertSeverity } from '../hooks/useNotifications';
import { useNotifications } from '../hooks/useNotifications';
import { createDemoNotifications, clearDemoNotifications } from '../utils/demoNotifications';
import PlusIcon from './icons/PlusIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { EnhancedButton, useAccessibility } from './ui/EnhancedComponents';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotificationStore } from '../stores/notificationStore';

interface NotificationCreatorProps {
  t: any;
  isOpen?: boolean;
  onClose?: () => void;
}

const NotificationCreator: React.FC<NotificationCreatorProps> = ({
  t,
  isOpen: externalIsOpen,
  onClose,
}) => {
  const { announceToScreenReader } = useAccessibility();
  const { currentUser } = useCurrentUser();
  const { broadcastNotification } = useNotificationStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.INFO);
  const [category, setCategory] = useState<
    'system' | 'maintenance' | 'production' | 'user' | 'security'
  >('system');

  const { createNotification } = useNotifications();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose || setInternalIsOpen;

  // Only show for Super Admin
  if (currentUser?.role !== 'Super Admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await broadcastNotification({
      title: 'Broadcast Notification',
      message,
      severity,
      category,
    });
    setMessage('');
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  const severityOptions = [
    { value: AlertSeverity.INFO, label: 'Info', color: 'text-blue-600' },
    { value: AlertSeverity.WARNING, label: 'Warning', color: 'text-amber-600' },
    { value: AlertSeverity.CRITICAL, label: 'Critical', color: 'text-blue-600' },
  ];

  const categoryOptions = [
    { value: 'system', label: 'System' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'production', label: 'Production' },
    { value: 'user', label: 'User' },
    { value: 'security', label: 'Security' },
  ];

  if (!isOpen) {
    return null; // Hide the component completely
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 p-5">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/5 rounded-full -translate-y-12 translate-x-12"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <svg
                  className="w-5 h-5 text-indigo-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Create Test Notification
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Send broadcast notification to all users
                </p>
              </div>
            </div>
            <EnhancedButton
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  setIsOpen(false);
                }
              }}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              ariaLabel="Close notification creator"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </EnhancedButton>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Message Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 resize-none"
              rows={3}
              placeholder="Enter notification message..."
              required
            />
          </div>

          {/* Severity Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Severity
            </label>
            <div className="relative">
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 cursor-pointer font-medium"
              >
                {severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Category Field */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 cursor-pointer font-medium"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <EnhancedButton
              type="button"
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  setIsOpen(false);
                }
              }}
              variant="secondary"
              size="sm"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              ariaLabel="Cancel creating notification"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              disabled={!message.trim()}
              variant="primary"
              size="sm"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              ariaLabel="Create notification"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Create Notification
              </span>
            </EnhancedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationCreator;
