import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import { useThemeColors } from '../hooks/useThemeColors';

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
  const colors = useThemeColors();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      'fixed top-4 right-4 max-w-md w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden transform transition-all duration-300 z-50';

    return baseStyles;
  };

  const getToastColors = () => {
    const isDark = colors.neutral[0] !== '#ffffff';
    switch (type) {
      case 'success':
        return {
          backgroundColor: isDark ? colors.success[900] + '90' : colors.success[50] + '80',
          borderColor: colors.success[400],
        };
      case 'error':
        return {
          backgroundColor: isDark ? colors.error[900] + '90' : colors.error[50] + '80',
          borderColor: colors.error[400],
        };
      case 'warning':
        return {
          backgroundColor: isDark ? colors.warning[900] + '90' : colors.warning[50] + '80',
          borderColor: colors.warning[400],
        };
      case 'info':
        return {
          backgroundColor: isDark ? colors.info[900] + '90' : colors.info[50] + '80',
          borderColor: colors.info[400],
        };
      default:
        return {
          backgroundColor: isDark ? colors.neutral[800] + '90' : colors.neutral[50] + '80',
          borderColor: colors.neutral[400],
        };
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success[400];
      case 'error':
        return colors.error[400];
      case 'warning':
        return colors.warning[400];
      case 'info':
        return colors.info[400];
      default:
        return colors.neutral[400];
    }
  };

  const getTextColor = () => {
    const isDark = colors.neutral[0] !== '#ffffff';
    switch (type) {
      case 'success':
        return isDark ? colors.success[200] : colors.success[800];
      case 'error':
        return isDark ? colors.error[200] : colors.error[800];
      case 'warning':
        return isDark ? colors.warning[200] : colors.warning[800];
      case 'info':
        return isDark ? colors.info[200] : colors.info[800];
      default:
        return isDark ? colors.neutral[200] : colors.neutral[800];
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={getToastStyles()}
      style={{
        ...getToastColors(),
        borderLeft: `4px solid ${getToastColors().borderColor}`,
        boxShadow: 'var(--shadow-lg)',
      }}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0" style={{ color: getIconColor() }}>
            <CheckBadgeIcon className="h-6 w-6" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium" style={{ color: getTextColor() }}>
              {message}
            </p>
          </div>
          {actionButton && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150"
                style={{
                  backgroundColor: type === 'success' ? colors.success[600] : colors.info[600],
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    type === 'success' ? colors.success[700] : colors.info[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    type === 'success' ? colors.success[600] : colors.info[600];
                }}
                onClick={actionButton.onClick}
              >
                {actionButton.icon &&
                  React.createElement(actionButton.icon, { className: 'h-4 w-4 mr-1' })}
                {actionButton.label}
              </button>
            </div>
          )}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150"
              style={{ color: colors.neutral[400] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.neutral[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.neutral[400];
              }}
              onClick={onClose}
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
    </motion.div>
  );
};

export default Toast;
