import React, { useState, useEffect } from 'react';
import { connectionPool } from '../../utils/optimization/connectionPool';

interface SmartLoaderProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  timeoutMs?: number;
  showLoaderAfterMs?: number;
  retry?: boolean;
  onTimeout?: () => void;
}

/**
 * SmartLoader - Komponen loading yang cerdas dengan prioritas dan timeout
 *
 * Komponen ini akan:
 * 1. Menampilkan loading dengan delay sesuai prioritas
 * 2. Menampilkan konten utama setelah loading selesai
 * 3. Memberikan timeout dan retry jika diperlukan
 * 4. Mempertimbangkan kondisi koneksi
 */
const SmartLoader: React.FC<SmartLoaderProps> = ({
  children,
  fallback,
  priority = 'medium',
  timeoutMs,
  showLoaderAfterMs,
  retry = false,
  onTimeout,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Tentukan delay berdasarkan prioritas
  const getDelayForLoader = () => {
    switch (priority) {
      case 'high':
        return 200; // Tampilkan loader setelah 200ms
      case 'medium':
        return 500; // Tampilkan loader setelah 500ms
      case 'low':
        return 800; // Tampilkan loader setelah 800ms
      default:
        return 500;
    }
  };

  // Tentukan timeout berdasarkan prioritas
  const getTimeoutForPriority = () => {
    if (timeoutMs) return timeoutMs;

    switch (priority) {
      case 'high':
        return 10000; // 10 detik untuk high priority
      case 'medium':
        return 20000; // 20 detik untuk medium priority
      case 'low':
        return 30000; // 30 detik untuk low priority
      default:
        return 20000;
    }
  };

  useEffect(() => {
    // Simpan referensi ke timeout
    let loaderTimeoutId: NodeJS.Timeout | null = null;
    let contentTimeoutId: NodeJS.Timeout | null = null;

    // Tampilkan loader setelah delay
    const loaderDelay = showLoaderAfterMs || getDelayForLoader();
    loaderTimeoutId = setTimeout(() => {
      setShowLoader(true);
    }, loaderDelay);

    // Jika komponen children sudah ready sebelum loader ditampilkan,
    // kita akan mencegah loader tampil
    const finishLoading = () => {
      setIsLoading(false);
      if (loaderTimeoutId) {
        clearTimeout(loaderTimeoutId);
      }
    };

    // Cek apakah ada koneksi aktif ke server
    const isConnected = connectionPool.isConnectionActive();

    // Jika tidak terhubung dan retry diaktifkan, coba lagi
    if (!isConnected && retry) {
      const retryDelay = Math.min(2000 * (retryCount + 1), 10000); // exponential backoff

      contentTimeoutId = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, retryDelay);

      return () => {
        if (loaderTimeoutId) clearTimeout(loaderTimeoutId);
        if (contentTimeoutId) clearTimeout(contentTimeoutId);
      };
    }

    // Set timeout untuk konten
    const timeoutDuration = getTimeoutForPriority();
    contentTimeoutId = setTimeout(() => {
      if (isLoading) {
        setIsTimedOut(true);
        if (onTimeout) onTimeout();
      }
    }, timeoutDuration);

    // Tandai sebagai loaded setelah render berikutnya
    // (kita menggunakan setTimeout 0 untuk memungkinkan children untuk mounting)
    setTimeout(finishLoading, 0);

    // Cleanup
    return () => {
      if (loaderTimeoutId) clearTimeout(loaderTimeoutId);
      if (contentTimeoutId) clearTimeout(contentTimeoutId);
    };
  }, [priority, retryCount, retry, showLoaderAfterMs, onTimeout]);

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    setShowLoader(true);
    setIsTimedOut(false);
    setRetryCount((prev) => prev + 1);
  };

  // Jika timeout dan retry diaktifkan
  if (isTimedOut && retry) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-600 mb-4">
          Waktu muat data telah habis. Server mungkin sibuk atau koneksi lambat.
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Tampilkan loader atau children
  return isLoading && showLoader ? fallback : <>{children}</>;
};

export default SmartLoader;
