/**
 * ConnectionMonitor - Utility untuk memantau dan meningkatkan koneksi PocketBase
 *
 * - Memantau kegagalan koneksi dan timeouts
 * - Mencoba memulihkan koneksi secara otomatis
 * - Menampilkan indikator status koneksi
 */

import { pb } from './pocketbase';
import { logger } from './logger';

// Extend Window interface for debugging
declare global {
  interface Window {
    PB_CONNECTION_MONITOR?: {
      check: () => Promise<boolean>;
      getMetrics: () => Record<string, unknown>;
      reset: () => void;
    };
  }
}

// Metrics untuk statistik koneksi
const connectionMetrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  autoCancellations: 0,
  lastConnectTime: 0,
  lastSuccessfulConnect: 0,
  serverResponseTimes: [] as number[],
};

// Fungsi untuk memeriksa koneksi dengan server
export const checkConnection = async (timeout = 5000): Promise<boolean> => {
  const startTime = performance.now();
  connectionMetrics.attempts++;
  connectionMetrics.lastConnectTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      await pb.health.check({ signal: controller.signal });
      clearTimeout(timeoutId);

      // Update metrics
      connectionMetrics.successes++;
      connectionMetrics.lastSuccessfulConnect = Date.now();
      const responseTimeMs = performance.now() - startTime;
      connectionMetrics.serverResponseTimes.push(responseTimeMs);

      // Hanya simpan 10 responseTime terakhir
      if (connectionMetrics.serverResponseTimes.length > 10) {
        connectionMetrics.serverResponseTimes.shift();
      }

      logger.debug('PocketBase connection check successful', {
        responseTime: `${responseTimeMs.toFixed(2)}ms`,
      });
      return true;
    } catch (healthError: any) {
      clearTimeout(timeoutId);

      // Deteksi SSL protocol error dan coba dengan protokol alternatif
      const isSSLError =
        healthError.message?.includes('SSL') ||
        healthError.message?.includes('ERR_SSL_PROTOCOL_ERROR') ||
        healthError.message?.includes('certificate');

      if (isSSLError) {
        logger.warn(
          'SSL Protocol error terdeteksi dalam health check, mencoba protocol alternatif...'
        );

        // Trigger protocol change event
        window.dispatchEvent(
          new CustomEvent('pocketbase:protocol:changed', {
            detail: { protocol: 'http' },
          })
        );

        // Tunggu reinisialisasi
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
          // Coba lagi dengan protokol baru
          await pb.health.check({
            signal: AbortSignal.timeout(timeout),
          });

          // Update metrics jika berhasil
          connectionMetrics.successes++;
          connectionMetrics.lastSuccessfulConnect = Date.now();
          const finalResponseTime = performance.now() - startTime;
          connectionMetrics.serverResponseTimes.push(finalResponseTime);

          logger.info('Koneksi berhasil setelah switch protokol');
          return true;
        } catch (retryError) {
          logger.error('Koneksi tetap gagal setelah switch protokol:', retryError);
          connectionMetrics.failures++;
          return false;
        }
      } else {
        connectionMetrics.failures++;
        throw healthError;
      }
    }
  } catch (error: any) {
    connectionMetrics.failures++;

    // Kategorikan jenis kegagalan
    if (error.message?.includes('autocancelled')) {
      connectionMetrics.autoCancellations++;
      logger.warn('PocketBase connection autocancelled');
    } else if (error.name === 'AbortError') {
      logger.warn('PocketBase connection timed out');
    } else {
      logger.error('PocketBase connection failed', error);
    }

    return false;
  }
};

// Helper untuk mendapatkan rata-rata waktu respons
export const getAverageResponseTime = (): number => {
  if (connectionMetrics.serverResponseTimes.length === 0) return 0;

  const sum = connectionMetrics.serverResponseTimes.reduce((acc, time) => acc + time, 0);
  return sum / connectionMetrics.serverResponseTimes.length;
};

// Mendapatkan ringkasan metrics koneksi
export const getConnectionMetrics = () => {
  const now = Date.now();
  return {
    ...connectionMetrics,
    timeSinceLastCheck: now - connectionMetrics.lastConnectTime,
    timeSinceLastSuccess: now - connectionMetrics.lastSuccessfulConnect,
    successRate:
      connectionMetrics.attempts > 0
        ? (connectionMetrics.successes / connectionMetrics.attempts) * 100
        : 0,
    averageResponseTime: getAverageResponseTime(),
  };
};

// Reset metrics untuk pengujian
export const resetMetrics = () => {
  connectionMetrics.attempts = 0;
  connectionMetrics.successes = 0;
  connectionMetrics.failures = 0;
  connectionMetrics.autoCancellations = 0;
  connectionMetrics.serverResponseTimes = [];
};

// Start background health check
let healthCheckInterval: NodeJS.Timeout | null = null;

export const startBackgroundHealthCheck = (intervalMs = 60000) => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  healthCheckInterval = setInterval(async () => {
    await checkConnection();

    const metrics = getConnectionMetrics();

    // Log jika success rate rendah
    if (metrics.attempts > 5 && metrics.successRate < 70) {
      logger.warn('Low PocketBase connection success rate', {
        successRate: `${metrics.successRate.toFixed(1)}%`,
        autoCancellations: metrics.autoCancellations,
      });
    }
  }, intervalMs);

  return () => {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  };
};

// Export untuk debugging
window.PB_CONNECTION_MONITOR = {
  check: checkConnection,
  getMetrics: getConnectionMetrics,
  reset: resetMetrics,
};
