import React from 'react';
import ApiProxyTester from '../components/ApiProxyTester';

/**
 * Test page to verify that the API proxy is working correctly
 * Access this page at /test-proxy to check if the API proxy is working
 */
export default function TestProxy() {
  return (
    <div>
      <ApiProxyTester />
    </div>
  );
}
