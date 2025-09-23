import React, { useEffect, useState } from 'react';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import { designSystem } from '../utils/designSystem';

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
      'fixed top-4 right-4 max-w-md w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden transform transition-all duration-300 z-50';

    return baseStyles;
  };

  const getToastColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: designSystem.colors.success[50] + '80',
          borderColor: designSystem.colors.success[400],
        };
      case 'error':
        return {
          backgroundColor: designSystem.colors.error[50] + '80',
          borderColor: designSystem.colors.error[400],
        };
      case 'warning':
        return {
          backgroundColor: designSystem.colors.warning[50] + '80',
          borderColor: designSystem.colors.warning[400],
        };
      case 'info':
        return {
          backgroundColor: designSystem.colors.info[50] + '80',
          borderColor: designSystem.colors.info[400],
        };
      default:
        return {
          backgroundColor: designSystem.colors.gray[50],
          borderColor: designSystem.colors.gray[400],
        };
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return designSystem.colors.success[400];
      case 'error':
        return designSystem.colors.error[400];
      case 'warning':
        return designSystem.colors.warning[400];
      case 'info':
        return designSystem.colors.info[400];
      default:
        return designSystem.colors.gray[400];
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return designSystem.colors.success[800];
      case 'error':
        return designSystem.colors.error[800];
      case 'warning':
        return designSystem.colors.warning[800];
      case 'info':
        return designSystem.colors.info[800];
      default:
        return designSystem.colors.gray[800];
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${getToastStyles()} ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{
        ...getToastColors(),
        borderLeft: `4px solid ${getToastColors().borderColor}`,
        boxShadow: designSystem.shadows.lg,
      }}
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
                  backgroundColor:
                    type === 'success'
                      ? designSystem.colors.success[600]
                      : designSystem.colors.info[600],
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    type === 'success'
                      ? designSystem.colors.success[700]
                      : designSystem.colors.info[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    type === 'success'
                      ? designSystem.colors.success[600]
                      : designSystem.colors.info[600];
                }}
                onClick={actionButton.onClick}
              >
                {actionButton.icon && <actionButton.icon className="h-4 w-4 mr-1" />}
                {actionButton.label}
              </button>
            </div>
          )}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150"
              style={{ color: designSystem.colors.gray[400] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = designSystem.colors.gray[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = designSystem.colors.gray[400];
              }}
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
