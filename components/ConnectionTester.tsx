import React, { useState } from 'react';
import PocketBase from 'pocketbase';
import { getPocketbaseUrl } from '../utils/pocketbase';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';

/**
 * Komponen untuk menguji koneksi ke PocketBase melalui API proxy
 * Berguna untuk debugging masalah mixed content di production
 */
const ConnectionTester = () => {
  const [testingDirect, setTestingDirect] = useState(false);
  const [testingProxy, setTestingProxy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [directResult, setDirectResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proxyResult, setProxyResult] = useState<any>(null);
  const [directError, setDirectError] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);

  // Get current URL configuration
  const pocketbaseUrl = getPocketbaseUrl();
  const isUsingProxy = pocketbaseUrl.includes('/api/pb-proxy');
  const directUrl = 'http://141.11.25.69:8090';
  const apiProxyUrl = `${window.location.origin}/api/pb-proxy`;

  // Informasi protokol
  const currentProtocol = window.location.protocol;
  const isSecureContext = window.isSecureContext;

  // Test koneksi langsung ke PocketBase
  const testDirectConnection = async () => {
    setTestingDirect(true);
    setDirectError(null);
    setDirectResult(null);

    try {
      const pb = new PocketBase(directUrl);
      const health = await pb.health.check();
      setDirectResult(health);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Direct connection error:', error);
      setDirectError(error instanceof Error ? error.message : String(error));
    } finally {
      setTestingDirect(false);
    }
  };

  // Test koneksi melalui API proxy
  const testProxyConnection = async () => {
    setTestingProxy(true);
    setProxyError(null);
    setProxyResult(null);

    try {
      // Tes menggunakan PocketBase SDK melalui proxy
      const pb = new PocketBase(apiProxyUrl);
      const health = await pb.health.check();
      setProxyResult(health);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Proxy connection error:', error);
      setProxyError(error instanceof Error ? error.message : String(error));
    } finally {
      setTestingProxy(false);
    }
  };

  // Test endpoint API tester
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testApiResult, setTestApiResult] = useState<any>(null);
  const [testApiError, setTestApiError] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  const testApiEndpoint = async () => {
    setTestingApi(true);
    setTestApiError(null);
    setTestApiResult(null);

    try {
      const response = await fetch(`${window.location.origin}/api/test`);
      const data = await response.json();
      setTestApiResult(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('API test error:', error);
      setTestApiError(error instanceof Error ? error.message : String(error));
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Pengujian Koneksi PocketBase
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Informasi Koneksi</Typography>
          <Typography>
            <strong>URL PocketBase Aktif:</strong> {pocketbaseUrl}
          </Typography>
          <Typography>
            <strong>Menggunakan Proxy API:</strong> {isUsingProxy ? 'Ya' : 'Tidak'}
          </Typography>
          <Typography>
            <strong>Protokol Saat Ini:</strong> {currentProtocol}
          </Typography>
          <Typography>
            <strong>Secure Context:</strong> {isSecureContext ? 'Ya' : 'Tidak'}
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        {/* Test API Endpoint */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test API Endpoint
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={testApiEndpoint}
              disabled={testingApi}
              sx={{ mb: 2 }}
            >
              {testingApi ? <CircularProgress size={24} color="inherit" /> : 'Test API Endpoint'}
            </Button>

            {testApiError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {testApiError}
              </Alert>
            )}

            {testApiResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Hasil Test API:</Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                  {JSON.stringify(testApiResult, null, 2)}
                </pre>
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider />

        {/* Test Koneksi Langsung */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Koneksi Langsung ke PocketBase
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Menguji koneksi langsung ke {directUrl}
            </Typography>
            <Button
              variant="contained"
              onClick={testDirectConnection}
              disabled={testingDirect}
              sx={{ mb: 2 }}
            >
              {testingDirect ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Test Koneksi Langsung'
              )}
            </Button>

            {directError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {directError}
              </Alert>
            )}

            {directResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Hasil Test Koneksi Langsung:</Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                  {JSON.stringify(directResult, null, 2)}
                </pre>
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider />

        {/* Test Koneksi via Proxy */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Koneksi via API Proxy
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Menguji koneksi melalui {apiProxyUrl}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={testProxyConnection}
              disabled={testingProxy}
              sx={{ mb: 2 }}
            >
              {testingProxy ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Test Koneksi via Proxy'
              )}
            </Button>

            {proxyError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {proxyError}
              </Alert>
            )}

            {proxyResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Hasil Test Koneksi Proxy:</Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                  {JSON.stringify(proxyResult, null, 2)}
                </pre>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default ConnectionTester;
