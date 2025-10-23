import React, { useState, useEffect } from 'react';
import { useMixedContentDetection } from '../hooks/useMixedContentDetection';
import { checkConnection } from '../utils/connectionMonitor';

/**
 * ConnectionStatusIndicator - A small indicator showing backend connection status
 * - Shows connection status with color indicator
 * - Offers help link for mixed content issues when detected
 */
const ConnectionStatusIndicator: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');
  const { hasMixedContentIssue, isHttps } = useMixedContentDetection();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const checkBackendConnection = async () => {
      setConnectionStatus('checking');
      const isConnected = await checkConnection(5000);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkBackendConnection();

    // Periodically check connection
    const intervalId = setInterval(checkBackendConnection, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // If there's a mixed content issue and we're showing help, render nothing
  // because the ConnectionHelp component will already be showing
  if (hasMixedContentIssue && showHelp) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4caf50'; // Green
      case 'disconnected':
        return '#f44336'; // Red
      case 'checking':
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e'; // Gray
    }
  };

  const getStatusText = () => {
    if (hasMixedContentIssue) {
      return 'Mixed Content Issue';
    }

    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Checking...';
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

  // Show a more prominent indicator for Vercel deployments
  if (isVercel && isHttps) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          fontWeight: 'bold',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
          }}
        />
        <span>HTTPS to HTTP connection blocked</span>

        <button
          onClick={handleShowHelp}
          style={{
            backgroundColor: 'white',
            color: '#f44336',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 12px',
            marginLeft: '5px',
            fontWeight: 'bold',
            borderRadius: '4px',
          }}
        >
          Show Solution
        </button>
      </div>
    );
  }

  // Standard indicator for non-Vercel environments
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 1000,
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: getStatusColor(),
          borderRadius: '50%',
        }}
      />
      <span>{getStatusText()}</span>

      {hasMixedContentIssue && isHttps && (
        <button
          onClick={handleShowHelp}
          style={{
            backgroundColor: 'transparent',
            color: '#2196f3',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 5px',
            marginLeft: '5px',
            textDecoration: 'underline',
          }}
        >
          Need Help?
        </button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;

