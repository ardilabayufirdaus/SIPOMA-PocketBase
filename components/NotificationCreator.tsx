import React, { useState } from 'react';
import { AlertSeverity } from '../hooks/useNotifications';
import { EnhancedButton, useAccessibility } from './ui/EnhancedComponents';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotificationStore } from '../stores/notificationStore';

interface NotificationCreatorProps {
  t: Record<string, string>;
  isOpen?: boolean;
  onClose?: () => void;
}

const NotificationCreator: React.FC<NotificationCreatorProps> = ({
  isOpen: externalIsOpen,
  onClose,
}) => {
  useAccessibility();
  const { currentUser } = useCurrentUser();
  const { broadcastNotification } = useNotificationStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.INFO);
  const [category, setCategory] = useState<
    'system' | 'maintenance' | 'production' | 'user' | 'security'
  >('system');

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose || setInternalIsOpen;

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
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-ubuntu">
      <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden transform transition-all border border-white/10">
        {/* Ubuntu Desktop Header Style */}
        <div className="relative bg-gradient-to-r from-[#300a24] to-[#5e2750] p-4 flex items-center justify-between border-b border-white/10 shadow-md">
          {/* Subtle Noise Texture overlay could go here if supported, simplified for now */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shadow-inner ring-1 ring-white/20">
              <svg
                className="w-4 h-4 text-[#E95420]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Create Notification</h3>
              <p className="text-[10px] text-white/60 font-medium tracking-wider uppercase">
                Broadcast System Alert
              </p>
            </div>
          </div>

          {/* Window Controls style close button */}
          <button
            onClick={() => {
              if (onClose) onClose();
              else setIsOpen(false);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E95420]/50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#F7F7F7]">
          {/* Message Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider pl-1">
              Message Content
            </label>
            <div className="relative group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-[#333333] placeholder:text-gray-400 focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-all duration-200 resize-none shadow-sm group-hover:border-gray-400"
                rows={4}
                placeholder="Type your broadcast message here..."
                required
              />
              <div className="absolute top-3 right-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Severity Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#333333] uppercase tracking-wider pl-1">
                Severity Level
              </label>
              <div className="relative">
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                  className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#333333] focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-all hover:border-gray-400 cursor-pointer shadow-sm font-medium"
                >
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Visual Indicator for Severity */}
              <div className="flex gap-1 pt-1 pl-1">
                <div
                  className={`h-1 flex-1 rounded-full ${severity === AlertSeverity.INFO ? 'bg-blue-500' : 'bg-gray-200'}`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${severity === AlertSeverity.WARNING ? 'bg-amber-500' : 'bg-gray-200'}`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${severity === AlertSeverity.CRITICAL ? 'bg-red-500' : 'bg-gray-200'}`}
                ></div>
              </div>
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#333333] uppercase tracking-wider pl-1">
                Target Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as
                        | 'system'
                        | 'maintenance'
                        | 'production'
                        | 'user'
                        | 'security'
                    )
                  }
                  className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#333333] focus:outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] transition-all hover:border-gray-400 cursor-pointer shadow-sm font-medium capitalize"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
            <EnhancedButton
              type="button"
              onClick={() => {
                if (onClose) onClose();
                else setIsOpen(false);
              }}
              variant="secondary"
              size="sm"
              className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#333333] rounded-lg font-bold text-sm tracking-wide transition-colors shadow-sm"
              ariaLabel="Cancel"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              disabled={!message.trim()}
              variant="primary"
              size="sm"
              className="px-6 py-2.5 bg-[#E95420] hover:bg-[#c2410c] text-white rounded-lg font-bold text-sm tracking-wide shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
              ariaLabel="Send Broadcast"
            >
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Broadcast Now
            </EnhancedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationCreator;
