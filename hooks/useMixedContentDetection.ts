import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mixed content issues in the application
 * - Determines if the site is being accessed over HTTPS and trying to load HTTP resources
 * - Tests connection to backend server to check for mixed content blocking
 * - Returns state variables indicating if there's a mixed content issue
 */
export const useMixedContentDetection = () => {
  const [hasMixedContentIssue, setHasMixedContentIssue] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState(false);
  const [isHttps, setIsHttps] = useState(false);
  const [isVercelDeployment, setIsVercelDeployment] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // Check if we're on a Vercel deployment
      const isVercel = hostname.includes('vercel.app') || hostname.includes('sipoma.site');
      setIsVercelDeployment(isVercel);

      setIsHttps(protocol === 'https:');

      // Auto-detect mixed content issue on Vercel HTTPS deployments
      if (isVercel && protocol === 'https:') {
        setHasMixedContentIssue(true);
        setCheckedStatus(true);
        return;
      }

      if (protocol !== 'https:') {
        // Not using HTTPS, so we won't have mixed content issues
        setCheckedStatus(true);
        return;
      }
    } else {
      // Not in browser environment
      return;
    }

    // Check for mixed content issues by attempting a connection to PocketBase
    const checkForMixedContent = async () => {
      try {
        // Always use proxy to avoid CORS issues
        const backendUrl = '/api/pb-proxy/';
        const url = backendUrl;

        await fetch(`${url}/api/health`, {
          method: 'GET',
          mode: 'no-cors', // This allows the request to be sent but we can't read the response
          signal: AbortSignal.timeout(5000),
        });

        // If we're on HTTPS and the above HTTP request succeeded without error,
        // it means the browser is allowing mixed content, so we have no issue
        setHasMixedContentIssue(false);
        setCheckedStatus(true);
      } catch (error) {
        // Check if the error is related to mixed content
        const errorString = String(error);
        const isMixedContentError =
          errorString.includes('Mixed Content') ||
          errorString.includes('blocked:mixed-content') ||
          // Chrome sometimes just blocks the request with a network error
          (isHttps &&
            (errorString.includes('NetworkError') || errorString.includes('Failed to fetch')));

        if (isMixedContentError) {
          setHasMixedContentIssue(true);
        }
        setCheckedStatus(true);
      }
    };

    checkForMixedContent();

    // Listen for protocol change events from the connection monitor
    const handleProtocolChange = (event: CustomEvent) => {
      if (event.detail?.protocol === 'http' && isHttps) {
        setHasMixedContentIssue(true);
      }
    };

    window.addEventListener('pocketbase:protocol:changed', handleProtocolChange as EventListener);

    return () => {
      window.removeEventListener(
        'pocketbase:protocol:changed',
        handleProtocolChange as EventListener
      );
    };
  }, [isHttps]);

  return {
    hasMixedContentIssue,
    checkedStatus,
    isHttps,
    isVercel: isVercelDeployment,
  };
};
