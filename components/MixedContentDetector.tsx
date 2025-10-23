import React, { useState, useEffect } from 'react';
import ConnectionHelp from './ConnectionHelp';
import { useMixedContentDetection } from '../hooks/useMixedContentDetection';

/**
 * MixedContentDetector - Component to detect mixed content issues and display guidance
 * - Detects when secure (HTTPS) pages are attempting to access insecure (HTTP) resources
 * - Shows the ConnectionHelp component when mixed content issues are detected
 * - Responds to manual requests to show the connection help
 */
const MixedContentDetector: React.FC = () => {
  const { hasMixedContentIssue, checkedStatus } = useMixedContentDetection();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Listen for manual requests to show help
    const handleShowConnectionHelp = () => {
      setForceShow(true);
    };

    window.addEventListener('sipoma:show-connection-help', handleShowConnectionHelp);

    return () => {
      window.removeEventListener('sipoma:show-connection-help', handleShowConnectionHelp);
    };
  }, []);

  // Show the ConnectionHelp if we've detected an issue or if it was manually requested
  if ((checkedStatus && hasMixedContentIssue) || forceShow) {
    return <ConnectionHelp />;
  }

  // Otherwise, render nothing
  return null;
};

export default MixedContentDetector;
