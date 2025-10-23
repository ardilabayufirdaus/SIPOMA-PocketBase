// Test file to verify that the API proxy is working correctly

/**
 * This file contains functions to test the API proxy implementation
 * Run these tests after deploying to Vercel to verify that everything works
 */

// Import the PocketBase client
import PocketBase from 'pocketbase';
import { getPocketbaseUrl } from '../utils/pocketbase';

/**
 * Test the API proxy with a simple GET request
 * @returns {Promise<boolean>} Whether the test succeeded
 */
async function testProxyGet() {
  try {
    const pb = new PocketBase(getPocketbaseUrl());

    // Try to get the health status
    const response = await pb.health.check();

    console.log('API Proxy GET test:', response);
    return !!response.code; // Should return a code if successful
  } catch (error) {
    console.error('API Proxy GET test failed:', error);
    return false;
  }
}

/**
 * Test the API proxy with authentication
 * @returns {Promise<boolean>} Whether the test succeeded
 */
async function testProxyAuth(email, password) {
  try {
    const pb = new PocketBase(getPocketbaseUrl());

    // Try to authenticate
    const authData = await pb.admins.authWithPassword(email, password);

    console.log('API Proxy Auth test:', authData ? 'Successful' : 'Failed');
    return !!authData;
  } catch (error) {
    console.error('API Proxy Auth test failed:', error);
    return false;
  }
}

/**
 * Test the API proxy with a file download
 * @returns {Promise<boolean>} Whether the test succeeded
 */
async function testProxyFileDownload(recordId, collectionName = 'documents') {
  try {
    const pb = new PocketBase(getPocketbaseUrl());

    // Get file URL through the proxy
    const record = await pb.collection(collectionName).getOne(recordId);

    if (record && record.file) {
      const fileUrl = pb.files.getUrl(record, record.file);
      console.log('File URL via proxy:', fileUrl);

      // Try to download the file
      const response = await fetch(fileUrl);
      const success = response.ok;

      console.log('API Proxy File Download test:', success ? 'Successful' : 'Failed');
      return success;
    }

    console.log('API Proxy File Download test: No file found');
    return false;
  } catch (error) {
    console.error('API Proxy File Download test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runApiProxyTests(email = '', password = '', fileRecordId = '') {
  console.log('Running API Proxy Tests...');
  console.log('PocketBase URL:', getPocketbaseUrl());

  const getTest = await testProxyGet();

  let authTest = false;
  if (email && password) {
    authTest = await testProxyAuth(email, password);
  } else {
    console.log('Skipping auth test (no credentials provided)');
  }

  let fileTest = false;
  if (fileRecordId) {
    fileTest = await testProxyFileDownload(fileRecordId);
  } else {
    console.log('Skipping file test (no file record ID provided)');
  }

  console.log('\nTest Results:');
  console.log('- GET Test:', getTest ? 'PASSED' : 'FAILED');
  console.log('- Auth Test:', email ? (authTest ? 'PASSED' : 'FAILED') : 'SKIPPED');
  console.log('- File Test:', fileRecordId ? (fileTest ? 'PASSED' : 'FAILED') : 'SKIPPED');

  return {
    getTest,
    authTest: email ? authTest : null,
    fileTest: fileRecordId ? fileTest : null,
    allPassed: getTest && (email ? authTest : true) && (fileRecordId ? fileTest : true),
  };
}

// Export test functions
export { testProxyGet, testProxyAuth, testProxyFileDownload };
