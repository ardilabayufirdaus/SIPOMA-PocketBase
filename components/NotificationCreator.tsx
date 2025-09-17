import React, { useState } from 'react';
import { AlertSeverity } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { createDemoNotifications, clearDemoNotifications } from '../utils/demoNotifications';
import PlusIcon from './icons/PlusIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { EnhancedButton, useAccessibility } from './ui/EnhancedComponents';

interface NotificationCreatorProps {
  t: any;
}

const NotificationCreator: React.FC<NotificationCreatorProps> = ({ t }) => {
  const { announceToScreenReader } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.INFO);
  const [category, setCategory] = useState<
    'system' | 'maintenance' | 'production' | 'user' | 'security'
  >('system');

  const { createNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await createNotification(message, severity, category);
    setMessage('');
    setIsOpen(false);
  };

  const severityOptions = [
    { value: AlertSeverity.INFO, label: 'Info', color: 'text-blue-600' },
    { value: AlertSeverity.WARNING, label: 'Warning', color: 'text-amber-600' },
    { value: AlertSeverity.CRITICAL, label: 'Critical', color: 'text-red-600' },
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create Test Notification
          </h3>
          <EnhancedButton
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            ariaLabel="Close notification creator"
          >
            ×
          </EnhancedButton>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Enter notification message..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <EnhancedButton
              type="button"
              onClick={() => setIsOpen(false)}
              variant="secondary"
              size="sm"
              ariaLabel="Cancel creating notification"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              disabled={!message.trim()}
              variant="primary"
              size="sm"
              ariaLabel="Create notification"
            >
              Create Notification
            </EnhancedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationCreator;
