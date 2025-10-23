import React from 'react';

/**
 * ConnectionHelp component provides guidance for users experiencing mixed content
 * issues when accessing the application over HTTPS while the backend is on HTTP
 */
const ConnectionHelp: React.FC = () => {
  // Check if we're on Vercel
  const isVercel =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('sipoma.site'));

  const handleAllowInsecureContent = () => {
    // Open instructions in a new tab
    window.open('https://www.clickssl.net/blog/how-to-allow-mixed-content-on-browsers', '_blank');
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '20px auto',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: isVercel ? '0 5px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: isVercel ? '2px solid #f44336' : 'none',
        position: 'relative',
        zIndex: 1001,
      }}
    >
      {isVercel && (
        <div
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            padding: '10px 15px',
            marginBottom: '15px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          VERCEL DEPLOYMENT NOTICE: Mixed Content Blocking
        </div>
      )}
      <h2
        style={{
          color: '#d32f2f',
          marginTop: '0',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px',
        }}
      >
        Mixed Content Issues Detected
      </h2>

      <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
        Your browser is blocking connections to the SIPOMA backend server because it uses HTTP
        (insecure) while the Vercel-hosted website is loaded over HTTPS (secure).
      </p>

      <div
        style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Why is this happening?</h3>
        <p style={{ margin: '0', lineHeight: '1.5' }}>
          Modern browsers block &quot;mixed content&quot; (HTTP resources on HTTPS pages) by default
          for security. The SIPOMA backend server at <strong>141.11.25.69:8090</strong> uses HTTP,
          but Vercel hosts this site using HTTPS, causing this security conflict.
        </p>
      </div>

      <h3>How to fix this:</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Option 1: Allow insecure content for this site</h4>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Look for a shield or lock icon in your browser&apos;s address bar</li>
          <li>Click on it and select &quot;Allow&quot; or &quot;Load unsafe scripts&quot;</li>
          <li>Refresh the page</li>
        </ol>
        <button
          onClick={handleAllowInsecureContent}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            fontWeight: 'bold',
          }}
        >
          Learn how to allow mixed content
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Option 2: Access the site directly via HTTP</h4>
        <p>Try accessing the application using HTTP directly:</p>
        {window.location.hostname.includes('vercel.app') ? (
          <p style={{ fontWeight: 'bold', color: '#d32f2f', marginTop: '10px' }}>
            Note: Vercel deployments only support HTTPS. For development, please use
            <span style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', margin: '0 5px' }}>
              npm run dev
            </span>
            to run a local HTTP server instead.
          </p>
        ) : (
          <a
            href={window.location.href.replace('https://', 'http://')}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Open with HTTP
          </a>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          padding: '15px',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Note for Administrators</h4>
        <p style={{ margin: '0', lineHeight: '1.5' }}>
          To permanently fix this issue, consider configuring SSL/TLS on your PocketBase server or
          setting up a reverse proxy with SSL termination.
        </p>
      </div>
    </div>
  );
};

export default ConnectionHelp;

