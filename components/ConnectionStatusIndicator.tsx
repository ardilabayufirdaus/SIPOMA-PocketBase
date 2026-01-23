import React, { useState, useEffect } from 'react';
import { useMixedContentDetection } from '../hooks/useMixedContentDetection';
import { checkConnection } from '../utils/connectionMonitor';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface ConnectionStatusIndicatorProps {
  className?: string;
  variant?: 'fixed' | 'inline';
}

/**
 * ConnectionStatusIndicator - A small indicator showing backend connection status
 * - Shows connection status with color indicator
 * - Offers help link for mixed content issues when detected
 */
const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className = '',
  variant = 'fixed',
}) => {
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'checking' | 'offline'
  >('checking');
  const { hasMixedContentIssue, isHttps } = useMixedContentDetection();
  const { isOnline } = useOfflineStatus();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const checkBackendConnection = async () => {
      if (!isOnline) {
        setConnectionStatus('offline');
        return;
      }

      setConnectionStatus('checking');
      const isConnected = await checkConnection(5000);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkBackendConnection();

    // Periodically check connection
    const intervalId = setInterval(checkBackendConnection, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isOnline]);

  // If there's a mixed content issue and we're showing help, render nothing
  // because the ConnectionHelp component will already be showing
  if (hasMixedContentIssue && showHelp) {
    return null;
  }

  const getStatusColorClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'offline':
        return 'bg-orange-500';
      case 'checking':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusText = () => {
    if (hasMixedContentIssue) {
      return 'Mixed Content Issue';
    }

    switch (connectionStatus) {
      case 'connected':
        return 'Online'; // Keep it short for header
      case 'disconnected':
        return 'Server Offline';
      case 'offline':
        return 'No Network';
      case 'checking':
        return '...';
      default:
        return 'Unknown';
    }
  };

  const handleShowHelp = () => {
    if (hasMixedContentIssue) {
      // Set flag to show help
      setShowHelp(true);

      // Send event for any listeners to show the full ConnectionHelp
      window.dispatchEvent(new CustomEvent('sipoma:show-connection-help'));
    }
  };

  // Check if we're on Vercel
  const isVercel =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('sipoma.site'));

  // Only show prominent indicator if there's actually a mixed content issue detected
  // This stays fixed at top because it's a critical error
  if (isVercel && isHttps && hasMixedContentIssue) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-500 text-white rounded text-sm flex items-center gap-2.5 z-[1000] shadow-md font-bold">
        <div className="w-3 h-3 bg-white rounded-full" />
        <span>HTTPS to HTTP connection blocked</span>

        <button
          onClick={handleShowHelp}
          className="bg-white text-red-500 border-none cursor-pointer text-sm px-3 py-1 ml-1.5 font-bold rounded"
        >
          Show Solution
        </button>
      </div>
    );
  }

  // Base container classes
  const containerClasses =
    variant === 'fixed'
      ? 'fixed bottom-2.5 right-2.5 px-3 py-2 bg-slate-900/75 text-white rounded text-xs flex items-center gap-1.5 z-[1000] shadow-sm backdrop-blur-sm'
      : `flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ${className}`;

  return (
    <div className={containerClasses}>
      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColorClass()} animate-pulse`} />
      <span className="hidden sm:inline-block">{getStatusText()}</span>

      {hasMixedContentIssue && isHttps && (
        <button
          onClick={handleShowHelp}
          className="bg-transparent text-blue-400 border-none cursor-pointer text-xs px-1 hover:underline"
        >
          Help?
        </button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
