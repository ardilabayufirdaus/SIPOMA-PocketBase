import React, { useState, useEffect } from 'react';
import ConnectionHelp from './ConnectionHelp';
import { useMixedContentDetection } from '../hooks/useMixedContentDetection';

/**
 * MixedContentDetector - Component to detect mixed content issues and display guidance
 * - Detects when secure (HTTPS) pages are attempting to access insecure (HTTP) resources
 * - Shows the ConnectionHelp component when mixed content issues are detected
 * - Responds to manual requests to show the connection help
 * - Auto-detects Vercel deployments and shows help
 */
const MixedContentDetector: React.FC = () => {
  const { hasMixedContentIssue, checkedStatus, isHttps } = useMixedContentDetection();
  const [forceShow, setForceShow] = useState(false);
  const [isVercel, setIsVercel] = useState(false);

  useEffect(() => {
    // Check if we're on Vercel
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsVercel(hostname.includes('vercel.app') || hostname.includes('sipoma.site'));
    }

    // Listen for manual requests to show help
    const handleShowConnectionHelp = () => {
      setForceShow(true);
    };

    window.addEventListener('sipoma:show-connection-help', handleShowConnectionHelp);

    return () => {
      window.removeEventListener('sipoma:show-connection-help', handleShowConnectionHelp);
    };
  }, []);

  // Show the ConnectionHelp if:
  // 1. We've detected a mixed content issue
  // 2. It was manually requested
  // 3. We're on Vercel deployment with HTTPS
  if ((checkedStatus && hasMixedContentIssue) || forceShow || (isVercel && isHttps)) {
    return <ConnectionHelp />;
  }

  // Otherwise, render nothing
  return null;
};

export default MixedContentDetector;
