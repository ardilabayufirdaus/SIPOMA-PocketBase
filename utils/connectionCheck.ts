/**
 * Utilitas untuk memeriksa koneksi jaringan dan ketersediaan PocketBase
 */

import { pb } from './pocketbase';
import { logger } from './logger';

// Status koneksi saat ini
let isConnected = navigator.onLine;
let isServerAvailable = true;
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 60000; // 60 detik - meningkatkan interval untuk mengurangi request
const SERVER_CHECK_TIMEOUT = 15000; // 15 detik - meningkatkan timeout

// Event listeners untuk status koneksi
window.addEventListener('online', () => {
  isConnected = true;
});
window.addEventListener('offline', () => {
  isConnected = false;
});

/**
 * Memeriksa apakah koneksi jaringan tersedia
 */
export const isNetworkConnected = (): boolean => {
  return isConnected && navigator.onLine;
};

/**
 * Fungsi untuk menunggu sampai koneksi jaringan tersedia kembali
 * @param timeout Waktu maksimum untuk menunggu dalam milidetik
 * @returns Promise yang selesai ketika koneksi tersedia atau timeout
 */
export const waitForNetworkConnection = async (timeout = 30000): Promise<boolean> => {
  // Jika sudah terhubung, return true langsung
  if (isNetworkConnected()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    // Handler untuk event online
    const onlineHandler = () => {
      window.removeEventListener('online', onlineHandler);
      // Tunggu sebentar setelah online event untuk memastikan koneksi stabil
      setTimeout(() => resolve(true), 1000);
    };

    // Set timeout untuk prevent infinite wait
    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeout);

    // Listen untuk event online
    window.addEventListener('online', onlineHandler);

    // Check lagi status karena bisa jadi sudah online saat fungsi ini dipanggil
    if (isNetworkConnected()) {
      window.removeEventListener('online', onlineHandler);
      clearTimeout(timeoutId);
      resolve(true);
    }
  });
};

/**
 * Memeriksa apakah server PocketBase tersedia
 * Menggunakan caching untuk menghindari terlalu banyak permintaan
 */
export const checkServerAvailability = async (): Promise<boolean> => {
  // Jika tidak terhubung ke jaringan, server pasti tidak tersedia
  if (!isNetworkConnected()) {
    isServerAvailable = false;
    return false;
  }

  // Gunakan hasil cache jika pemeriksaan terakhir cukup baru
  const now = Date.now();
  if (now - lastServerCheck < SERVER_CHECK_INTERVAL) {
    return isServerAvailable;
  }

  // Coba melakukan koneksi ke server dengan retry logic
  try {
    // Gunakan health check endpoint dengan timeout yang lebih lama
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_CHECK_TIMEOUT);

    // Implementasi retry logic dengan exponential backoff
    const maxRetries = 2;
    let retryCount = 0;
    let success = false;

    while (!success && retryCount <= maxRetries) {
      try {
        await pb.health.check({ signal: controller.signal });
        success = true;
        isServerAvailable = true;
      } catch (err) {
        // Jika autocancelled, retry dengan delay
        if (err.message?.includes('autocancelled') && retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff: 500ms, 1500ms
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(3, retryCount - 1)));
        } else {
          // Retry habis atau error lain, throw
          throw err;
        }
      }
    }

    clearTimeout(timeoutId);
  } catch (error) {
    isServerAvailable = false;
    // Gunakan logger untuk pesan error
    logger.warn('PocketBase server tidak tersedia:', error.message);
  }

  lastServerCheck = now;
  return isServerAvailable;
};

/**
 * Memeriksa apakah aman untuk melakukan permintaan ke server
 * Menggabungkan pengecekan koneksi jaringan dan status server
 * Dengan cache untuk mencegah terlalu banyak pengecekan
 */
export const isSafeToMakeRequests = async (): Promise<boolean> => {
  if (!isNetworkConnected()) {
    return false;
  }

  return await checkServerAvailability();
};

/**
 * Wrapper untuk fungsi API yang hanya dijalankan jika koneksi aman
 * Mengembalikan null jika koneksi tidak aman
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: { retries?: number; retryDelay?: number; handleNetworkChange?: boolean } = {}
): Promise<T | null> => {
  const { retries = 1, retryDelay = 2000, handleNetworkChange = true } = options; // Added network change handling option

  let attempts = 0;

  while (attempts <= retries) {
    try {
      // Periksa apakah aman untuk melakukan request
      if (!(await isSafeToMakeRequests())) {
        if (handleNetworkChange && !isNetworkConnected()) {
          // Wait for network to be available again before returning null
          logger.info('Network is disconnected, waiting for reconnection...');
          const networkRestored = await waitForNetworkConnection(30000);

          if (networkRestored) {
            logger.info('Network connection restored, retrying request');
            continue; // Skip incrementing attempts if network was restored
          }
        }
        return null;
      }

      // Jalankan API call
      return await apiCall();
    } catch (error) {
      attempts++;

      // Handle ERR_NETWORK_CHANGED errors specially
      if (error.message?.includes('ERR_NETWORK_CHANGED') && handleNetworkChange) {
        logger.warn('Network changed during request, waiting for stable connection...');

        // Wait longer for network to stabilize after a change
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Don't count network change errors against retry limit
        if (attempts <= retries + 1) {
          attempts--;
          continue;
        }
      }

      // Handle other connection-related errors
      else if (
        error.message?.includes('autocancelled') ||
        error.message?.includes('network') ||
        error.message?.includes('connection')
      ) {
        // Jika masih ada retry, tunggu sebentar dan coba lagi
        if (attempts <= retries) {
          // Gunakan exponential backoff untuk delay
          const delay = retryDelay * Math.pow(1.5, attempts - 1);
          logger.debug(
            `Retrying API call after network error, attempt ${attempts}/${retries}, delay ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Log last retry attempt failure
        logger.warn(`API call failed after ${retries} retries due to connection issues`);

        // Jika sudah mencapai batas retry, return null
        return null;
      }

      // Rethrow non-connection errors
      throw error;
    }
  }

  return null;
};
