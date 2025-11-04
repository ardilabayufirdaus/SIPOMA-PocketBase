/**
 * ConnectionMonitor - Utility untuk memantau dan meningkatkan koneksi PocketBase
 *
 * - Memantau kegagalan koneksi dan timeouts
 * - Mencoba memulihkan koneksi secara otomatis
 * - Menampilkan indikator status koneksi
 */

import { pb } from './pocketbase-simple';
import { logger } from './logger';

// Extend Window interface for debugging
declare global {
  interface Window {
    PB_CONNECTION_MONITOR?: {
      check: () => Promise<boolean>;
      checkWithRetry: () => Promise<boolean>;
      getMetrics: () => Record<string, unknown>;
      reset: () => void;
      getWebSocketStatus: () => Record<string, unknown>;
      monitorWebSocketConnection: () => void;
      getCircuitBreakerState: () => Record<string, unknown>;
      resetCircuitBreaker: () => void;
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
  consecutiveFailures: 0,
  connectionQuality: 'unknown' as 'excellent' | 'good' | 'poor' | 'critical' | 'unknown',
  lastQualityCheck: 0,
};

// Connection quality thresholds (ms)
const QUALITY_THRESHOLDS = {
  excellent: 100,
  good: 300,
  poor: 1000,
  critical: 3000,
};

// Adaptive interval settings
const INTERVAL_SETTINGS = {
  excellent: 120000, // 2 minutes
  good: 90000, // 1.5 minutes
  poor: 60000, // 1 minute
  critical: 30000, // 30 seconds
  unknown: 60000, // 1 minute
};

// Fungsi untuk menentukan kualitas koneksi berdasarkan response time
const determineConnectionQuality = (
  responseTime: number
): 'excellent' | 'good' | 'poor' | 'critical' => {
  if (responseTime <= QUALITY_THRESHOLDS.excellent) return 'excellent';
  if (responseTime <= QUALITY_THRESHOLDS.good) return 'good';
  if (responseTime <= QUALITY_THRESHOLDS.poor) return 'poor';
  return 'critical';
};

// Fungsi untuk mendapatkan interval yang disarankan berdasarkan kualitas koneksi
const getAdaptiveInterval = (
  quality: 'excellent' | 'good' | 'poor' | 'critical' | 'unknown'
): number => {
  return INTERVAL_SETTINGS[quality];
};

// Fungsi untuk multiple endpoint checking
const checkMultipleEndpoints = async (): Promise<{
  success: boolean;
  responseTime: number;
  quality: string;
}> => {
  const endpoints = [
    () => pb.health.check(),
    () => pb.collection('users').getList(1, 1), // Quick auth check
  ];

  const results = [];
  let totalResponseTime = 0;
  let successCount = 0;

  for (const endpoint of endpoints) {
    const startTime = performance.now();
    try {
      await endpoint();
      const responseTime = performance.now() - startTime;
      results.push({ success: true, responseTime });
      totalResponseTime += responseTime;
      successCount++;
    } catch {
      const responseTime = performance.now() - startTime;
      results.push({ success: false, responseTime });
      totalResponseTime += responseTime;
    }
  }

  const avgResponseTime = totalResponseTime / endpoints.length;
  const overallSuccess = successCount > 0;

  return {
    success: overallSuccess,
    responseTime: avgResponseTime,
    quality: overallSuccess ? determineConnectionQuality(avgResponseTime) : 'critical',
  };
};

// Fungsi untuk memeriksa koneksi dengan server
export const checkConnection = async (timeout = 5000): Promise<boolean> => {
  try {
    const result = await circuitBreaker.execute(async () => {
      const startTime = performance.now();
      connectionMetrics.attempts++;
      connectionMetrics.lastConnectTime = Date.now();

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

        // Update connection quality
        connectionMetrics.connectionQuality = determineConnectionQuality(responseTimeMs);
        connectionMetrics.consecutiveFailures = 0;
        connectionMetrics.lastQualityCheck = Date.now();

        // Hanya simpan 10 responseTime terakhir
        if (connectionMetrics.serverResponseTimes.length > 10) {
          connectionMetrics.serverResponseTimes.shift();
        }

        logger.debug('PocketBase connection check successful', {
          responseTime: `${responseTimeMs.toFixed(2)}ms`,
          quality: connectionMetrics.connectionQuality,
        });
        return true;
      } catch (healthError: unknown) {
        clearTimeout(timeoutId);
        connectionMetrics.failures++;
        connectionMetrics.consecutiveFailures++;

        // Update connection quality to critical on failure
        connectionMetrics.connectionQuality = 'critical';

        // Deteksi SSL protocol error dan coba dengan protokol alternatif
        const isSSLError =
          healthError instanceof Error &&
          (healthError.message?.includes('SSL') ||
            healthError.message?.includes('ERR_SSL_PROTOCOL_ERROR') ||
            healthError.message?.includes('certificate'));

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
            connectionMetrics.connectionQuality = determineConnectionQuality(finalResponseTime);
            connectionMetrics.consecutiveFailures = 0;

            logger.info('Koneksi berhasil setelah switch protokol');
            return true;
          } catch (finalError: unknown) {
            connectionMetrics.failures++;
            logger.error('Koneksi gagal bahkan setelah switch protokol:', finalError);
            throw finalError; // Re-throw untuk circuit breaker
          }
        }

        logger.warn('PocketBase connection check failed:', healthError);
        throw healthError; // Re-throw untuk circuit breaker
      }
    });

    return result;
  } catch (error: unknown) {
    // Circuit breaker akan handle failure counting
    logger.error('Connection check failed with circuit breaker:', error);
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
    currentInterval,
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

// Start background health check with adaptive interval
let healthCheckInterval: NodeJS.Timeout | null = null;
let currentInterval = INTERVAL_SETTINGS.unknown;

export const startBackgroundHealthCheck = (initialIntervalMs = 60000) => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  currentInterval = initialIntervalMs;

  const runHealthCheck = async () => {
    await checkConnection();

    // Adjust interval based on connection quality
    const newInterval = getAdaptiveInterval(connectionMetrics.connectionQuality);

    // If interval changed significantly, restart the interval
    if (Math.abs(newInterval - currentInterval) > 10000) {
      // 10 second difference
      logger.debug(
        `Adjusting health check interval from ${currentInterval}ms to ${newInterval}ms based on connection quality: ${connectionMetrics.connectionQuality}`
      );
      currentInterval = newInterval;

      // Restart with new interval
      if (healthCheckInterval) clearInterval(healthCheckInterval);
      healthCheckInterval = setInterval(runHealthCheck, currentInterval);
    }

    const metrics = getConnectionMetrics();

    // Log jika success rate rendah atau consecutive failures tinggi
    if (
      metrics.attempts > 5 &&
      (metrics.successRate < 70 || connectionMetrics.consecutiveFailures > 3)
    ) {
      logger.warn('Connection issues detected', {
        successRate: `${metrics.successRate.toFixed(1)}%`,
        consecutiveFailures: connectionMetrics.consecutiveFailures,
        quality: connectionMetrics.connectionQuality,
        interval: currentInterval,
      });

      // Trigger recovery mechanisms jika koneksi critical
      if (
        connectionMetrics.connectionQuality === 'critical' &&
        connectionMetrics.consecutiveFailures > 5
      ) {
        triggerConnectionRecovery();
      }
    }
  };

  // Start initial check
  runHealthCheck();

  // Set up interval
  healthCheckInterval = setInterval(runHealthCheck, currentInterval);

  return () => {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  };
};

// Connection recovery mechanisms
const triggerConnectionRecovery = async () => {
  logger.info('Triggering connection recovery mechanisms');

  try {
    // Try multiple endpoint check for comprehensive diagnosis
    const multiCheck = await checkMultipleEndpoints();

    if (multiCheck.success) {
      logger.info('Connection recovery successful via multiple endpoints');
      connectionMetrics.consecutiveFailures = 0;
      return;
    }

    // If still failing, try protocol switch
    window.dispatchEvent(
      new CustomEvent('pocketbase:protocol:recovery', {
        detail: {
          quality: multiCheck.quality,
          responseTime: multiCheck.responseTime,
        },
      })
    );
  } catch (error) {
    logger.error('Connection recovery failed:', error);
  }
};

// Circuit Breaker implementation
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private monitoringPeriod = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
      // Move to half-open
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.warn(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime,
      timeUntilRetry: Math.max(0, this.nextAttemptTime - Date.now()),
    };
  }

  // Force reset (for manual recovery)
  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.nextAttemptTime = 0;
    logger.info('Circuit breaker manually reset');
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

// WebSocket connection monitoring
let websocketConnected = false;
let websocketLastConnected = 0;
let websocketReconnectAttempts = 0;
const MAX_WEBSOCKET_RECONNECT_ATTEMPTS = 5;

// Monitor WebSocket connection status
export const monitorWebSocketConnection = () => {
  // Listen for PocketBase real-time connection events
  pb.realtime.subscribe(
    '*',
    () => {
      // This will trigger when WebSocket connects
      if (!websocketConnected) {
        websocketConnected = true;
        websocketLastConnected = Date.now();
        websocketReconnectAttempts = 0;
        logger.debug('WebSocket connection established');

        window.dispatchEvent(new CustomEvent('websocket:connected'));
      }
    },
    {
      onError: (error) => {
        websocketConnected = false;
        logger.warn('WebSocket connection error:', error);

        window.dispatchEvent(new CustomEvent('websocket:error', { detail: error }));

        // Attempt to reconnect
        if (websocketReconnectAttempts < MAX_WEBSOCKET_RECONNECT_ATTEMPTS) {
          websocketReconnectAttempts++;
          setTimeout(
            () => {
              logger.debug(
                `Attempting WebSocket reconnection (${websocketReconnectAttempts}/${MAX_WEBSOCKET_RECONNECT_ATTEMPTS})`
              );
              // WebSocket will auto-reconnect through PocketBase's internal mechanisms
            },
            Math.min(1000 * Math.pow(2, websocketReconnectAttempts), 30000)
          ); // Exponential backoff
        }
      },
      onDisconnect: () => {
        websocketConnected = false;
        logger.warn('WebSocket connection lost');

        window.dispatchEvent(new CustomEvent('websocket:disconnected'));

        // Trigger reconnection by subscribing again
        if (websocketReconnectAttempts < MAX_WEBSOCKET_RECONNECT_ATTEMPTS) {
          websocketReconnectAttempts++;
          setTimeout(
            () => {
              logger.debug(
                `Attempting WebSocket reconnection (${websocketReconnectAttempts}/${MAX_WEBSOCKET_RECONNECT_ATTEMPTS})`
              );
              // Force reconnection by creating a new subscription
              pb.realtime.subscribe('health', () => {}, {
                onConnect: () => {
                  websocketConnected = true;
                  websocketLastConnected = Date.now();
                  websocketReconnectAttempts = 0;
                  logger.debug('WebSocket reconnected successfully');
                },
              });
            },
            Math.min(1000 * Math.pow(2, websocketReconnectAttempts), 30000)
          );
        }
      },
    }
  );
};

// Get WebSocket connection status
export const getWebSocketStatus = () => {
  return {
    connected: websocketConnected,
    lastConnected: websocketLastConnected,
    timeSinceLastConnection: Date.now() - websocketLastConnected,
    reconnectAttempts: websocketReconnectAttempts,
  };
};

// Intelligent retry utility with exponential backoff and jitter
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
    retryCondition = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or condition not met
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5); // ±50% jitter
      }

      logger.debug(
        `Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay.toFixed(0)}ms delay`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Enhanced connection check with intelligent retry
export const checkConnectionWithRetry = async (
  timeout = 5000,
  retryOptions: Partial<RetryOptions> = {}
): Promise<boolean> => {
  return retryWithBackoff(() => checkConnection(timeout), {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000,
    retryCondition: (error) => {
      // Only retry on network-related errors, not auth errors
      if (error instanceof Error) {
        return !error.message.includes('auth') && !error.message.includes('permission');
      }
      return true;
    },
    ...retryOptions,
  });
};

// Export circuit breaker functions
export const getCircuitBreakerState = () => circuitBreaker.getState();
export const resetCircuitBreaker = () => circuitBreaker.reset();

// Export untuk debugging
window.PB_CONNECTION_MONITOR = {
  check: checkConnection,
  checkWithRetry: checkConnectionWithRetry,
  getMetrics: getConnectionMetrics,
  reset: resetMetrics,
  getWebSocketStatus,
  monitorWebSocketConnection,
  getCircuitBreakerState,
  resetCircuitBreaker,
};
