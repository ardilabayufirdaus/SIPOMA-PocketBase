import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mixed content issues in the application
 * - Determines if the site is being accessed over HTTPS and trying to load HTTP resources
 * - Tests connection to backend server to check for mixed content blocking
 * - Returns state variables indicating if there's a mixed content issue
 *
 * NOTE: Since backend is now HTTPS (api.sipoma.site via Caddy), mixed content
 * issues should not occur. This hook now returns false by default for sipoma.site.
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

      // Check if we're on a Vercel deployment or sipoma.site
      const isVercel = hostname.includes('vercel.app') || hostname.includes('sipoma.site');
      setIsVercelDeployment(isVercel);
      setIsHttps(protocol === 'https:');

      // If not using HTTPS, we won't have mixed content issues
      if (protocol !== 'https:') {
        setCheckedStatus(true);
        return;
      }

      // For sipoma.site with HTTPS - backend is now also HTTPS
      // So we can safely assume no mixed content issues
      if (hostname.includes('sipoma.site')) {
        // Backend api.sipoma.site is served via HTTPS through Caddy
        // No mixed content issues should occur
        setHasMixedContentIssue(false);
        setCheckedStatus(true);
        return;
      }

      // For other deployments, do actual check
      const checkForMixedContent = async () => {
        try {
          const backendUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
          const url =
            backendUrl.startsWith('http') || backendUrl.startsWith('/')
              ? backendUrl
              : `https://${backendUrl}`;

          // Check if the backend URL is HTTP (which would cause mixed content on HTTPS site)
          if (url.startsWith('http://') && protocol === 'https:') {
            setHasMixedContentIssue(true);
            setCheckedStatus(true);
            return;
          }

          // Backend is HTTPS, no mixed content issue
          setHasMixedContentIssue(false);
          setCheckedStatus(true);
        } catch {
          // Even if check fails, don't assume mixed content - backend is HTTPS
          setHasMixedContentIssue(false);
          setCheckedStatus(true);
        }
      };

      checkForMixedContent();
    } else {
      // Not in browser environment
      setCheckedStatus(true);
      return;
    }

    // Listen for protocol change events from the connection monitor
    const handleProtocolChange = (event: CustomEvent) => {
      // Only set mixed content if actually switching to HTTP backend
      if (event.detail?.protocol === 'http' && event.detail?.forced) {
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
  }, []);

  return {
    hasMixedContentIssue,
    checkedStatus,
    isHttps,
    isVercel: isVercelDeployment,
  };
};
