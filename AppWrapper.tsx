import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import DataPreloader from './components/optimization/DataPreloader';
import { connectionPool } from './utils/optimization/connectionPool';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Konfigurasi React Query dengan optimasi untuk koneksi lambat
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Konfigurasi retry yang cerdas
      retry: (failureCount, error: any) => {
        // Jangan retry jika error 404 atau 401
        if (error?.status === 404 || error?.status === 401) {
          return false;
        }

        // Retry maksimal 3 kali
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // 5 menit
      cacheTime: 15 * 60 * 1000, // 15 menit
      refetchOnWindowFocus: false, // Tidak refetch saat window focus
      refetchOnMount: true, // Refetch saat komponen di-mount
    },
  },
});

const AppWrapper: React.FC = () => {
  useEffect(() => {
    // Inisialisasi connection pool
    connectionPool.preConnect().catch((err) => {
      console.error('Error saat pre-connect ke server:', err);
    });

    // Setup listeners untuk status koneksi
    const onConnectionLost = () => {
      toast.error('Koneksi ke server terputus. Mencoba menghubungkan kembali...', {
        autoClose: false,
        toastId: 'connection-lost',
      });
    };

    const onConnectionRestored = () => {
      toast.dismiss('connection-lost');
      toast.success('Koneksi ke server berhasil dipulihkan!', {
        autoClose: 3000,
        toastId: 'connection-restored',
      });

      // Invalidate queries untuk memperbarui data
      queryClient.invalidateQueries();
    };

    window.addEventListener('pocketbase:connection:lost', onConnectionLost);
    window.addEventListener('pocketbase:connection:restored', onConnectionRestored);

    return () => {
      connectionPool.cleanup();
      window.removeEventListener('pocketbase:connection:lost', onConnectionLost);
      window.removeEventListener('pocketbase:connection:restored', onConnectionRestored);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <DataPreloader>
            <App />
          </DataPreloader>
        </BrowserRouter>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default AppWrapper;
