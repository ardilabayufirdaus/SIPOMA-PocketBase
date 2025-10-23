import React, { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { getPocketbaseUrl } from '../utils/pocketbase';

/**
 * Component to test the API proxy in the UI
 * This is especially useful for testing on Vercel deployments
 */
export default function ApiProxyTester() {
  const [results, setResults] = useState({
    isVercel: false,
    url: '',
    getTestResult: null,
    getTestMessage: 'Not run',
    collectionsTestResult: null,
    collectionsTestMessage: 'Not run',
    isLoading: false,
  });

  const pocketbaseUrl = getPocketbaseUrl();

  // Check if we're on Vercel
  useEffect(() => {
    const isVercel =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('.vercel.app') || process.env.VERCEL === '1');

    setResults((prev) => ({
      ...prev,
      isVercel,
      url: pocketbaseUrl,
    }));
  }, [pocketbaseUrl]);

  // Run the basic health check test
  const runHealthTest = async () => {
    setResults((prev) => ({ ...prev, isLoading: true, getTestMessage: 'Testing...' }));

    try {
      const pb = new PocketBase(pocketbaseUrl);
      const healthCheck = await pb.health.check();

      setResults((prev) => ({
        ...prev,
        getTestResult: true,
        getTestMessage: `Success! Code: ${healthCheck.code}`,
        isLoading: false,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        getTestResult: false,
        getTestMessage: `Failed: ${error.message}`,
        isLoading: false,
      }));
    }
  };

  // Run the collections list test
  const runCollectionsTest = async () => {
    setResults((prev) => ({ ...prev, isLoading: true, collectionsTestMessage: 'Testing...' }));

    try {
      const pb = new PocketBase(pocketbaseUrl);
      const collections = await pb.collections.getFullList();

      setResults((prev) => ({
        ...prev,
        collectionsTestResult: true,
        collectionsTestMessage: `Success! Found ${collections.length} collections`,
        isLoading: false,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        collectionsTestResult: false,
        collectionsTestMessage: `Failed: ${error.message}`,
        isLoading: false,
      }));
    }
  };

  // Styling for the component
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
    },
    header: {
      background: results.isVercel ? '#0070f3' : '#333',
      color: 'white',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px',
    },
    section: {
      background: '#f9f9f9',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '15px',
      border: '1px solid #ddd',
    },
    button: {
      background: '#0070f3',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '10px',
      marginTop: '10px',
    },
    success: {
      color: 'green',
      fontWeight: 'bold',
    },
    error: {
      color: 'red',
      fontWeight: 'bold',
    },
    neutral: {
      color: '#666',
    },
    loading: {
      opacity: 0.7,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>API Proxy Tester</h1>
        <p>Environment: {results.isVercel ? 'Vercel Deployment' : 'Local/Other'}</p>
        <p>PocketBase URL: {results.url}</p>
      </div>

      <div style={styles.section}>
        <h2>Health Check Test</h2>
        <p>Tests a basic GET request to the PocketBase health endpoint</p>
        <div>
          <strong>Result: </strong>
          <span
            style={
              results.getTestResult === null
                ? styles.neutral
                : results.getTestResult
                  ? styles.success
                  : styles.error
            }
          >
            {results.getTestMessage}
          </span>
        </div>
        <button style={styles.button} onClick={runHealthTest} disabled={results.isLoading}>
          Run Health Test
        </button>
      </div>

      <div style={styles.section}>
        <h2>Collections Test</h2>
        <p>Tests fetching collections list from PocketBase</p>
        <div>
          <strong>Result: </strong>
          <span
            style={
              results.collectionsTestResult === null
                ? styles.neutral
                : results.collectionsTestResult
                  ? styles.success
                  : styles.error
            }
          >
            {results.collectionsTestMessage}
          </span>
        </div>
        <button style={styles.button} onClick={runCollectionsTest} disabled={results.isLoading}>
          Run Collections Test
        </button>
      </div>

      <div style={styles.section}>
        <h2>Information</h2>
        <p>
          {results.isVercel ? (
            <>
              You are running on a Vercel deployment. The API proxy should be active, and requests
              should be routed through <code>/api/pb-proxy</code> automatically.
            </>
          ) : (
            <>
              You are running in a non-Vercel environment. Requests should go directly to the
              PocketBase server at <code>{pocketbaseUrl}</code>.
            </>
          )}
        </p>
        <p>If tests are failing, make sure:</p>
        <ul>
          <li>The PocketBase server is running and accessible</li>
          <li>The API proxy is correctly deployed to Vercel</li>
          <li>
            The <code>vercel.json</code> file is properly configured
          </li>
        </ul>
      </div>
    </div>
  );
}
