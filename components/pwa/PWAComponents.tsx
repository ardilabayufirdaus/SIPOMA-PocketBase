import React, { useState } from 'react';
import { useServiceWorker, usePWAStatus } from '../../hooks/usePWA';

interface PWAInstallBannerProps {
  className?: string;
  theme?: 'light' | 'dark';
  position?: 'top' | 'bottom' | 'fixed';
  showOnMobile?: boolean;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = '',
  theme = 'light',
  position = 'top',
  showOnMobile = true,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { installPWA, canInstall } = useServiceWorker();
  const pwaStatus = usePWAStatus();

  // Don't show banner if:
  // - Already installed
  // - Not installable
  // - Dismissed
  // - Mobile restriction
  if (pwaStatus.isInstalled || !canInstall || dismissed) {
    return null;
  }

  if (
    !showOnMobile &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  ) {
    return null;
  }

  const baseClasses = `
    ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
    border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}
    shadow-lg rounded-lg p-4 m-4
    ${position === 'fixed' ? 'fixed z-50' : 'relative'}
    ${position === 'top' ? 'top-4 left-4 right-4' : ''}
    ${position === 'bottom' ? 'bottom-4 left-4 right-4' : ''}
  `;

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Install SIPOMA App</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Add to your home screen for quick access and offline usage
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PWAUpdateNotificationProps {
  className?: string;
  theme?: 'light' | 'dark';
}

const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  className = '',
  theme = 'light',
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { updateAvailable, updateSW } = useServiceWorker();

  if (!updateAvailable || dismissed) {
    return null;
  }

  const baseClasses = `
    ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
    border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}
    shadow-lg rounded-lg p-4 m-4
  `;

  const handleUpdate = () => {
    updateSW();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Update Available</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              A new version of SIPOMA is available
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PWAStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const PWAStatusIndicator: React.FC<PWAStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const pwaStatus = usePWAStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = () => {
    if (!pwaStatus.isOnline) return 'text-red-500';
    if (pwaStatus.isInstalled) return 'text-green-500';
    if (pwaStatus.canInstall) return 'text-yellow-500';
    return 'text-slate-500';
  };

  const getStatusText = () => {
    if (!pwaStatus.isOnline) return 'Offline';
    if (pwaStatus.isInstalled) return 'Installed';
    if (pwaStatus.canInstall) return 'Installable';
    return 'Web App';
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`}></div>
        {showDetails && (
          <span className={`text-xs font-medium ${getStatusColor()}`}>{getStatusText()}</span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          <div className="space-y-1">
            <div>Status: {getStatusText()}</div>
            <div>Mode: {pwaStatus.isStandalone ? 'Standalone' : 'Browser'}</div>
            {pwaStatus.hasUpdates && <div className="text-yellow-300">Updates available</div>}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

interface OfflineIndicatorProps {
  className?: string;
  message?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  message = 'You are currently offline',
}) => {
  const { isOnline } = usePWAStatus();

  if (isOnline) return null;

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

export { PWAInstallBanner, PWAUpdateNotification, PWAStatusIndicator, OfflineIndicator };


