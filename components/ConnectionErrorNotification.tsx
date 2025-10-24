import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button, Snackbar } from '@mui/material';
import { translations } from '../translations';

// Use English translations
const enTranslations = translations.en;

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

  // Protocol switching is now handled automatically via API proxy on Vercel
  const handleRetryConnection = () => {
    // Trigger a retry event instead
    window.dispatchEvent(new CustomEvent('pocketbase:connection:retry', {}));

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
            <Button color="inherit" size="small" onClick={handleRetryConnection} sx={{ mr: 1 }}>
              {enTranslations.common.retry}
            </Button>
            <Button color="inherit" size="small" onClick={handleReload}>
              {enTranslations.common.reload}
            </Button>
          </>
        }
        onClose={handleClose}
      >
        <AlertTitle>{enTranslations.errors.connectionError}</AlertTitle>
        {errorMessage}
        {errorCount > 1 && (
          <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            {enTranslations.errors.multipleErrors.replace('{count}', errorCount.toString())}
          </div>
        )}
      </Alert>
    </Snackbar>
  );
};

export default ConnectionErrorNotification;
