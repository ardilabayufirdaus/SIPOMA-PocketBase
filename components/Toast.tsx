import React, { useEffect, useState } from 'react';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ClipboardIcon from './icons/ClipboardIcon';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000,
  actionButton,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles =
      'fixed top-4 right-4 max-w-md w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 overflow-hidden transform transition-all duration-300 z-50';

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400`;
      case 'info':
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400`;
      default:
        return `${baseStyles} bg-white dark:bg-slate-800 border-l-4 border-gray-400 dark:border-slate-600`;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400 dark:text-green-300';
      case 'error':
        return 'text-red-400 dark:text-red-300';
      case 'warning':
        return 'text-yellow-400 dark:text-yellow-300';
      case 'info':
        return 'text-blue-400 dark:text-blue-300';
      default:
        return 'text-gray-400 dark:text-gray-300';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${getToastStyles()} ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckBadgeIcon className={`h-6 w-6 ${getIconColor()}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
          </div>
          {actionButton && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white ${
                  type === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150`}
                onClick={actionButton.onClick}
              >
                {actionButton.icon && <actionButton.icon className="h-4 w-4 mr-1" />}
                {actionButton.label}
              </button>
            </div>
          )}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
