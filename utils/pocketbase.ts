import PocketBase from 'pocketbase';
import { logger } from './logger';

// Gunakan environment variable untuk URL PocketBase
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090';
const pocketbaseEmail = import.meta.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const pocketbasePassword = import.meta.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';
const authRequired = import.meta.env.VITE_AUTH_REQUIRED !== 'false'; // Defaultnya true

// Singleton pattern untuk mencegah multiple client instances
let pbInstance: PocketBase | null = null;

// Request throttling system
class RequestThrottler {
  private activeRequests = 0;
  private maxConcurrentRequests = 1; // Reduced to 1 concurrent request for extreme network instability
  private requestQueue: Array<() => void> = [];
  private circuitBreakerFailures = 0;
  private circuitBreakerThreshold = 25; // Increased threshold to 25 failures
  private circuitBreakerTimeout = 120000; // Increased to 120 seconds timeout
  private circuitBreakerLastFailure = 0;

  async throttle<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new Error('Circuit breaker is open - network is unstable, please wait before retrying');
    }

    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        this.activeRequests++;
        try {
          const result = await requestFn();
          this.onSuccess(); // Reset circuit breaker on success
          resolve(result);
        } catch (error) {
          this.onFailure(); // Track failures for circuit breaker
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrentRequests) {
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
      }
    });
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure;
      if (timeSinceLastFailure < this.circuitBreakerTimeout) {
        return true; // Circuit is open
      } else {
        // Reset circuit breaker after timeout
        this.circuitBreakerFailures = 0;
        logger.info('Circuit breaker reset - attempting requests again');

        // Check online status to avoid unnecessary requests when offline
        if (!navigator.onLine) {
          logger.warn('Browser is offline, keeping circuit breaker open');
          this.circuitBreakerFailures = this.circuitBreakerThreshold;
          this.circuitBreakerLastFailure = Date.now();
          return true;
        }
      }
    }
    return false;
  }

  private onSuccess() {
    if (this.circuitBreakerFailures > 0) {
      this.circuitBreakerFailures = Math.max(0, this.circuitBreakerFailures - 1);
    }
  }

  private onFailure() {
    this.circuitBreakerFailures++;
    this.circuitBreakerLastFailure = Date.now();

    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      logger.error(
        `Circuit breaker opened after ${this.circuitBreakerFailures} consecutive failures`
      );
    }
  }

  private processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }
}

const requestThrottler = new RequestThrottler();

export const pb = (() => {
  if (!pbInstance) {
    // Inisialisasi PocketBase dengan konfigurasi default
    pbInstance = new PocketBase(pocketbaseUrl);

    // Mengatur global fetch timeout dengan lebih panjang
    pbInstance.autoCancellation(false); // Matikan auto cancellation built-in

    // Override fetch method untuk throttling request
    const originalFetch = pbInstance.send;
    pbInstance.send = async function (...args) {
      return requestThrottler.throttle(async () => {
        // Delay antar request untuk menghindari terlalu banyak request sekaligus
        let lastRequestTime = 0;
        const minRequestInterval = 1000; // Increased to 1000ms antar request

        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        // Jika request terlalu dekat dengan request sebelumnya, tunggu sebentar
        if (timeSinceLastRequest < minRequestInterval) {
          await new Promise((resolve) =>
            setTimeout(resolve, minRequestInterval - timeSinceLastRequest)
          );
        }

        // Update waktu request terakhir
        lastRequestTime = Date.now();

        // Retry logic untuk network errors
        const retrySend = async (retries = 3, delay = 5000) => {
          // Reduced retries to 3, increased initial delay to 5s
          try {
            return await originalFetch.apply(this, args);
          } catch (error) {
            // Detect specific network error types to handle them differently
            const isNetworkError =
              error instanceof TypeError ||
              (error instanceof Error &&
                (error.message.includes('network') ||
                  error.message.includes('ERR_NETWORK') ||
                  error.message.includes('ERR_NETWORK_CHANGED') ||
                  error.message.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
                  error.message.includes('Failed to fetch') ||
                  error.message.includes('connection') ||
                  error.message.includes('timeout')));

            // Handle ERR_NETWORK_CHANGED specifically
            const isNetworkChangeError =
              error instanceof Error && error.message.includes('ERR_NETWORK_CHANGED');

            if (retries > 0 && isNetworkError) {
              // Use a longer delay for network change errors
              const actualDelay = isNetworkChangeError ? Math.max(delay, 8000) : delay;

              logger.warn(
                `Network error detected (${error.message}), retrying in ${actualDelay}ms... (${retries} retries left)`
              );

              // If network changed, check network status before retrying
              if (isNetworkChangeError) {
                // Add event listener to detect when online status changes
                await new Promise((resolve) => {
                  const offlineHandler = () => {
                    window.removeEventListener('online', onlineHandler);
                    setTimeout(resolve, 1000); // Small delay after coming back online
                  };

                  const onlineHandler = () => {
                    window.removeEventListener('offline', offlineHandler);
                    setTimeout(resolve, 1000); // Small delay after coming back online
                  };

                  // If already online, just wait a bit
                  if (navigator.onLine) {
                    setTimeout(resolve, actualDelay);
                  } else {
                    // Wait for online event or timeout
                    window.addEventListener('online', onlineHandler, { once: true });
                    window.addEventListener('offline', offlineHandler, { once: true });
                    setTimeout(resolve, actualDelay * 2); // Longer timeout while offline
                  }
                });
              } else {
                // Regular delay for other network errors
                await new Promise((resolve) => setTimeout(resolve, actualDelay));
              }

              // Cap the delay growth for subsequent retries
              return retrySend(retries - 1, Math.min(delay * 1.5, 30000));
            }
            throw error;
          }
        };

        return retrySend();
      });
    };

    // Set up automatic auth state detection
    pbInstance.authStore.onChange(() => {
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    });

    // Auto-authenticate if credentials are provided and authentication is required
    const authenticateAdmin = async () => {
      if (authRequired && pocketbaseEmail && pocketbasePassword) {
        try {
          // Check if we're already authenticated
          if (!pbInstance!.authStore.isValid) {
            logger.info('Melakukan autentikasi dengan PocketBase...');
            await pbInstance!.admins.authWithPassword(pocketbaseEmail, pocketbasePassword);
            logger.info('Autentikasi berhasil.');
          }
        } catch (error) {
          logger.error('Autentikasi otomatis gagal:', error); // Retry logic - 3 attempts with exponential backoff
          let retries = 0;
          const maxRetries = 3;

          const retryAuth = async () => {
            if (retries < maxRetries) {
              retries++;
              const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s

              logger.info(`Mencoba ulang autentikasi dalam ${delay / 1000}s...`);

              await new Promise((resolve) => setTimeout(resolve, delay));

              try {
                await pbInstance!.admins.authWithPassword(pocketbaseEmail, pocketbasePassword);
                logger.info('Autentikasi ulang berhasil.');
              } catch (err) {
                logger.error(`Percobaan autentikasi ke-${retries} gagal:`, err);
                await retryAuth();
              }
            }
          };

          await retryAuth();
        }
      }
    };

    // Run authentication immediately
    authenticateAdmin();

    // Re-authenticate when token expires or is invalidated
    window.addEventListener('authStateChanged', () => {
      if (!pbInstance!.authStore.isValid && authRequired) {
        authenticateAdmin();
      }
    });

    // Add event listener for client-side auth state changes to sync between tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'pocketbase_auth') {
        if (event.newValue !== event.oldValue) {
          try {
            // Try to refresh auth state from storage
            const storedAuth = JSON.parse(event.newValue || '{}');
            if (storedAuth?.token && storedAuth?.model) {
              pbInstance?.authStore.save(storedAuth.token, storedAuth.model);
            } else {
              pbInstance?.authStore.clear();
            }
          } catch (e) {
            logger.error('Error syncing auth state between tabs:', e);
          }
        }
      }
    });

    // Add automatic re-authentication for 403 errors
    const originalOnResponse = pbInstance.beforeSend;
    pbInstance.beforeSend = function (url, options) {
      // Call original beforeSend if it exists
      if (originalOnResponse) {
        originalOnResponse.call(this, url, options);
      }

      // Add response handler to check for auth errors
      const originalFetch = window.fetch;

      // Replace fetch temporarily to intercept response
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);

          // Clone the response to read it
          const clonedResponse = response.clone();

          // Check if it's a 403 auth error
          if (response.status === 403) {
            try {
              const data = await clonedResponse.json();

              if (data?.message?.includes("authorization don't match")) {
                logger.warn('Auth token mismatch detected, re-authenticating...');

                // Re-authenticate
                pbInstance?.authStore.clear();
                authenticateAdmin();

                // Dispatch auth state change
                window.dispatchEvent(new CustomEvent('authStateChanged'));
              }
            } catch {
              // Ignore JSON parsing errors
            }
          }

          return response;
        } catch (error) {
          // Handle network-related errors more gracefully
          if (
            error.name === 'TypeError' ||
            error.message?.includes('ERR_NETWORK_CHANGED') ||
            error.message?.includes('Failed to fetch')
          ) {
            logger.warn(`Network error detected: ${error.message}`);

            // Dispatch network error event
            window.dispatchEvent(
              new CustomEvent('pocketbase:connection:error', {
                detail: { error, url: args[0] },
              })
            );

            // For ERR_NETWORK_CHANGED, wait briefly and retry once
            if (error.message?.includes('ERR_NETWORK_CHANGED')) {
              logger.info('Network changed, attempting to reconnect...');

              // Wait for network to stabilize
              await new Promise((resolve) => setTimeout(resolve, 2000));

              try {
                // Try the fetch again after waiting
                return await originalFetch(...args);
              } catch (retryError) {
                logger.error('Retry failed after network change:', retryError);
                throw retryError;
              }
            }
          }

          throw error;
        }
      };

      // Fix deprecated format: return { url, options } instead of just options
      return { url, options };
    };
  }
  return pbInstance;
})();

// Helper function untuk verifikasi lingkungan
export const isDevEnvironment = () => {
  return import.meta.env.DEV === true;
};

/**
 * Utility untuk mengecek koneksi ke PocketBase server
 * @returns Promise<boolean> true jika terhubung, false jika tidak
 */
export const checkPocketBaseConnection = async (): Promise<boolean> => {
  try {
    // Coba ping dengan request sederhana ke health check endpoint
    const response = await fetch(`${pocketbaseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // Timeout 5 detik
    });
    return response.ok;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('PocketBase connection check failed:', error);
    return false;
  }
};

/**
 * Utility untuk menunggu koneksi PocketBase tersedia
 * @param maxRetries Jumlah maksimal percobaan
 * @param delayMs Delay antar percobaan dalam ms
 * @returns Promise<boolean> true jika berhasil connect, false jika gagal
 */
export const waitForPocketBaseConnection = async (
  maxRetries = 10,
  delayMs = 2000
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkPocketBaseConnection()) {
      return true;
    }
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
};

// Helper untuk cek status otentikasi dan melakukan otentikasi jika diperlukan
export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!pb.authStore.isValid) {
    try {
      await pb.admins.authWithPassword(pocketbaseEmail, pocketbasePassword);
      return true;
    } catch (err) {
      logger.error('Gagal otentikasi:', err);
      return false;
    }
  }
  return true;
};
