import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button, Snackbar } from '@mui/material';
import { translations } from '../translations';

/**
 * Komponen untuk menampilkan notifikasi error koneksi PocketBase
 * dan menyediakan opsi untuk reload atau mengganti protokol
 */
const ConnectionErrorNotification: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Listen for connection errors
    const handleConnectionError = (event: CustomEvent) => {
      const error = event.detail?.error;
      if (error) {
        setErrorCount((prev) => prev + 1);
        setErrorMessage(error.message || 'Koneksi ke server gagal');
        setOpen(true);
      }
    };

    // Listen for connection failures
    const handleConnectionFailed = (event: CustomEvent) => {
      setErrorCount((prev) => prev + 1);
      setErrorMessage(
        event.detail?.error?.message || 'Koneksi ke server gagal setelah beberapa percobaan'
      );
      setOpen(true);
    };

    // Add event listeners
    window.addEventListener('pocketbase:connection:error', handleConnectionError as EventListener);

    window.addEventListener(
      'pocketbase:connection:failed',
      handleConnectionFailed as EventListener
    );

    // Clean up
    return () => {
      window.removeEventListener(
        'pocketbase:connection:error',
        handleConnectionError as EventListener
      );

      window.removeEventListener(
        'pocketbase:connection:failed',
        handleConnectionFailed as EventListener
      );
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const switchToHttp = () => {
    // Trigger protocol change event
    window.dispatchEvent(
      new CustomEvent('pocketbase:protocol:changed', {
        detail: { protocol: 'http' },
      })
    );

    // Close the notification
    setOpen(false);

    // Reset error count
    setErrorCount(0);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ width: '100%', maxWidth: '500px', mt: 2 }}
    >
      <Alert
        severity="error"
        variant="filled"
        action={
          <>
            <Button color="inherit" size="small" onClick={switchToHttp} sx={{ mr: 1 }}>
              {translations.common.switchToHttp}
            </Button>
            <Button color="inherit" size="small" onClick={handleReload}>
              {translations.common.reload}
            </Button>
          </>
        }
        onClose={handleClose}
      >
        <AlertTitle>{translations.errors.connectionError}</AlertTitle>
        {errorMessage}
        {errorCount > 1 && (
          <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            {translations.errors.multipleErrors.replace('{count}', errorCount.toString())}
          </div>
        )}
      </Alert>
    </Snackbar>
  );
};

export default ConnectionErrorNotification;
