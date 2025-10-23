import PocketBase from 'pocketbase';
import { logger } from './logger';

// Variabel untuk menyimpan protokol yang berfungsi
type Protocol = 'https' | 'http';
let currentProtocol: Protocol = 'http'; // Default ke HTTP untuk lingkungan produksi
let protocolRetries = 0;

/**
 * Deteksi apakah aplikasi berjalan di lingkungan Vercel
 *
 * Criteria:
 * 1. Vercel environment variable is set
 * 2. Hostname includes 'vercel.app'
 * 3. Hostname includes 'sipoma.site' (our custom domain on Vercel)
 */
export const isVercelDeployment = (): boolean => {
  // Server-side detection
  if (typeof process !== 'undefined' && process.env && process.env.VERCEL === '1') {
    return true;
  }

  // Client-side detection
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    // Also check if we're on HTTPS protocol, which is required for Vercel
    const isHttps = protocol === 'https:';
    return (hostname.includes('vercel.app') || hostname.includes('sipoma.site')) && isHttps;
  }

  return false;
};

// Check if we're accessing from HTTPS in general
export const isHttpsProtocol = (): boolean => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.protocol === 'https:';
  }
  return false;
};

// Check if we're in a secure context (HTTPS or localhost)
export const isSecureContext = (): boolean => {
  if (typeof window !== 'undefined') {
    // Use the built-in isSecureContext if available
    if (typeof window.isSecureContext === 'boolean') {
      return window.isSecureContext;
    }
    // Fallback for older browsers: Check if HTTPS or localhost
    return (
      window.location.protocol === 'https:' ||
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    );
  }
  return false;
};

const vercelDeployment = isVercelDeployment();
const isHttps = isHttpsProtocol();
const isProduction = import.meta.env.PROD || vercelDeployment;
const forceHttp = import.meta.env.VITE_FORCE_HTTP === 'true';
const forceProxy = import.meta.env.VITE_FORCE_PROXY === 'true';

// Log environment detection
if (isProduction && !vercelDeployment) {
  currentProtocol = 'http';
  logger.info('Deteksi lingkungan production: menggunakan HTTP');
} else if (vercelDeployment) {
  // On Vercel, we'll use our API proxy to avoid mixed content
  logger.info('Deteksi lingkungan Vercel: menggunakan API proxy');
} else if (isHttps) {
  // If we're on HTTPS but not Vercel, we still need the API proxy (Cloudflare)
  logger.info('Deteksi HTTPS: menggunakan Cloudflare API proxy untuk menghindari mixed content');
}

// Gunakan environment variable untuk URL PocketBase
const pocketbaseUrlEnv = import.meta.env.VITE_POCKETBASE_URL;
const pocketbaseHost = '141.11.25.69:8090'; // Host default
const pocketbaseEmail = import.meta.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const pocketbasePassword = import.meta.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';
const authRequired = import.meta.env.VITE_AUTH_REQUIRED !== 'false'; // Defaultnya true

/**
 * Fungsi untuk mendapatkan URL PocketBase dengan protokol yang sesuai
 *
 * Priority order:
 * 1. API Proxy when forced or when server is HTTP but client is HTTPS (mixed content prevention)
 * 2. Environment variable (direct connection if HTTPS)
 * 3. Force HTTP on production (fallback)
 * 4. Detected working protocol
 */
export const getPocketbaseUrl = (): string => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  const origin = isBrowser ? window.location.origin : '';

  // In development, always use direct HTTP to avoid mixed content issues
  const isDevelopment = import.meta.env.DEV;
  if (isDevelopment) {
    logger.debug('Development environment: using direct HTTP connection to avoid mixed content');
    return `http://${pocketbaseHost}`;
  }

  // Force proxy usage if specified in environment or for sipoma.site domain (Cloudflare proxy)
  if (forceProxy || (isBrowser && window.location.hostname === 'www.sipoma.site')) {
    logger.debug(
      'Force proxy enabled for sipoma.site domain (Cloudflare proxy) or VITE_FORCE_PROXY=true'
    );
    return origin ? `${origin}/api` : '/api';
  }

  // Only use proxy if server is still HTTP and we're on HTTPS (mixed content prevention)
  if (
    isProduction &&
    isBrowser &&
    window.location.protocol === 'https:' &&
    pocketbaseUrlEnv &&
    pocketbaseUrlEnv.startsWith('http://')
  ) {
    logger.debug(
      'Server is HTTP but client is HTTPS: using Cloudflare API proxy to avoid mixed content'
    );
    return `${origin}/api`;
  }

  // Priority 2: Use environment variable if available
  if (pocketbaseUrlEnv) {
    // In production environment, ensure we use the right protocol to avoid mixed content
    if (isProduction && isBrowser && window.location.protocol === 'https:') {
      if (pocketbaseUrlEnv.startsWith('http://')) {
        logger.debug('Converting environment URL from HTTP to HTTPS proxy to avoid mixed content');
        return `${origin}/api`;
      }
    }
    logger.debug(`Using environment configured PocketBase URL: ${pocketbaseUrlEnv}`);
    return pocketbaseUrlEnv;
  }

  // Priority 3: Force HTTP on production or when flag is set
  if (isProduction || forceHttp) {
    logger.debug('Using HTTP protocol for PocketBase due to production mode or forceHttp flag');
    return `http://${pocketbaseHost}`;
  }

  // Priority 4: Use detected working protocol as fallback
  logger.debug(`Using detected protocol (${currentProtocol}) for PocketBase connection`);
  return `${currentProtocol}://${pocketbaseHost}`;
};

// Fungsi untuk mendeteksi protokol yang berfungsi
export const detectWorkingProtocol = async (): Promise<Protocol> => {
  // Jika di Vercel atau production dengan force HTTP, langsung gunakan HTTP
  if (isVercelDeployment || forceHttp) {
    logger.info('Mode production/Vercel terdeteksi, menggunakan HTTP secara default');
    return 'http';
  }

  // Jika protokol sudah ditentukan oleh environment, gunakan itu
  if (pocketbaseUrlEnv) {
    // Di production environment, paksa HTTP meskipun env menggunakan HTTPS
    if (isProduction && pocketbaseUrlEnv.startsWith('https')) {
      return 'http';
    }
    return pocketbaseUrlEnv.startsWith('https') ? 'https' : 'http';
  }

  // Pertama coba HTTPS
  try {
    logger.info('Mencoba koneksi HTTPS ke PocketBase...');
    await fetch(`https://${pocketbaseHost}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // Timeout lebih singkat untuk HTTPS
    });
    logger.info('Koneksi HTTPS berhasil');
    return 'https';
  } catch (error) {
    if (
      error.message?.includes('SSL') ||
      error.message?.includes('certificate') ||
      error.message?.includes('ERR_SSL_PROTOCOL_ERROR')
    ) {
      logger.warn('Koneksi HTTPS gagal karena masalah SSL:', error.message);
    } else {
      logger.warn('Koneksi HTTPS gagal:', error.message);
    }

    // Coba dengan HTTP sebagai fallback
    try {
      logger.info('Mencoba koneksi HTTP ke PocketBase...');
      await fetch(`http://${pocketbaseHost}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      logger.info('Koneksi HTTP berhasil');
      return 'http';
    } catch (secondError) {
      logger.error('Koneksi HTTP juga gagal:', secondError.message);
      // Default kembali ke HTTPS meskipun keduanya gagal
      return 'https';
    }
  }
};

// Fungsi untuk mengatur kembali koneksi jika protokol perlu diganti
export const resetConnection = async (): Promise<void> => {
  // Hapus instance PocketBase yang ada
  if (pbInstance) {
    pbInstance.authStore.clear();
    pbInstance = null;
  }

  // Deteksi protokol yang berfungsi
  currentProtocol = await detectWorkingProtocol();
  logger.info(`Menggunakan protokol ${currentProtocol.toUpperCase()} untuk koneksi PocketBase`);

  // Reset counter
  protocolRetries = 0;
};

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

// Inisialisasi PocketBase dengan deteksi protokol otomatis
const initializePocketBase = async (): Promise<PocketBase> => {
  try {
    // Deteksi protokol yang berfungsi jika belum pernah dicoba
    if (protocolRetries === 0) {
      currentProtocol = await detectWorkingProtocol();
      logger.info(`Inisialisasi PocketBase dengan protokol ${currentProtocol.toUpperCase()}`);
    }

    // Buat instance baru
    const instance = new PocketBase(getPocketbaseUrl());

    // Mengatur global fetch timeout dengan lebih panjang
    instance.autoCancellation(false); // Matikan auto cancellation built-in

    return instance;
  } catch (error) {
    logger.error('Gagal inisialisasi PocketBase:', error);
    // Fallback ke protokol HTTP jika terjadi kegagalan dan protokol saat ini adalah HTTPS
    if (currentProtocol === 'https' && protocolRetries < 2) {
      protocolRetries++;
      currentProtocol = 'http';
      logger.info(`Mencoba ulang dengan protokol HTTP (percobaan ke-${protocolRetries})`);
      return initializePocketBase();
    }

    // Jika semua gagal, kembalikan instance dengan protokol default
    const defaultInstance = new PocketBase(getPocketbaseUrl());
    defaultInstance.autoCancellation(false);
    return defaultInstance;
  }
};

export const pb = (() => {
  if (!pbInstance) {
    // Di Vercel/production, paksa gunakan HTTP untuk mengatasi masalah mixed content
    if (isVercelDeployment || forceHttp) {
      logger.info('Mode production/Vercel terdeteksi, koneksi PocketBase dipaksa menggunakan HTTP');
      currentProtocol = 'http';
    }

    // Inisialisasi PocketBase dengan protokol
    // Karena kita tidak bisa menggunakan async di IIFE, kita inisialisasi dengan sync
    // dan nanti akan melakukan "reinit" jika perlu
    pbInstance = new PocketBase(getPocketbaseUrl());
    pbInstance.autoCancellation(false); // Matikan auto cancellation built-in

    // Lakukan deteksi protokol secara asinkron dan reinit jika perlu
    (async () => {
      try {
        // Untuk Vercel, langsung aktifkan mode HTTP tanpa perlu deteksi
        if (isVercelDeployment || forceHttp) {
          logger.info('Vercel/Production mode: Menggunakan HTTP untuk semua koneksi PocketBase');
          currentProtocol = 'http';

          // Jika URL asli menggunakan HTTPS, ganti dengan HTTP
          if (pbInstance.baseUrl.startsWith('https://')) {
            const newBaseUrl = pbInstance.baseUrl.replace('https://', 'http://');
            logger.info(`Mengubah base URL dari ${pbInstance.baseUrl} ke ${newBaseUrl}`);
            pbInstance = new PocketBase(newBaseUrl);
            pbInstance.autoCancellation(false);
          }
        } else {
          // Mode development: deteksi protokol yang optimal
          const detectedProtocol = await detectWorkingProtocol();
          if (detectedProtocol !== currentProtocol) {
            currentProtocol = detectedProtocol;
            logger.info(
              `Mengganti protokol ke ${currentProtocol.toUpperCase()} dan melakukan reinit PocketBase`
            );
            pbInstance = await initializePocketBase();
          }
        }
      } catch (error) {
        logger.error('Gagal mendeteksi protokol yang optimal:', error);
      }
    })();

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
            // Detect SSL protocol errors dan coba switch protokol
            const isSSLError =
              error.message?.includes('SSL') ||
              error.message?.includes('ERR_SSL_PROTOCOL_ERROR') ||
              error.message?.includes('certificate') ||
              error.message?.includes('Failed to fetch'); // Tambahkan deteksi generic error yang mungkin karena SSL

            // Jika di Vercel atau forced HTTP, selalu ganti HTTPS ke HTTP
            if (
              (isSSLError || isVercelDeployment || forceHttp) &&
              (currentProtocol === 'https' ||
                (args[0] && typeof args[0] === 'string' && args[0].startsWith('https://')))
            ) {
              logger.warn(
                'SSL Protocol error terdeteksi atau mode Vercel/Production aktif, menggunakan HTTP'
              );

              // Switch ke HTTP
              currentProtocol = 'http';

              // Trigger protokol change event
              window.dispatchEvent(
                new CustomEvent('pocketbase:protocol:changed', {
                  detail: { protocol: 'http' },
                })
              );

              // Pastikan URL yang digunakan adalah HTTP
              if (args[0] && typeof args[0] === 'string') {
                // Ganti semua URL HTTPS ke HTTP
                if (args[0].startsWith('https://')) {
                  args[0] = args[0].replace('https://', 'http://');
                  logger.info(`URL request diubah: ${args[0]}`);
                }
              }

              logger.info(`Mencoba ulang request dengan protokol HTTP`);

              // Retry dengan protokol HTTP
              try {
                window.dispatchEvent(
                  new CustomEvent('pocketbase:protocol:changed', {
                    detail: { protocol: 'http', forced: true },
                  })
                );

                return await originalFetch.apply(this, args);
              } catch (httpError) {
                logger.error('Request dengan HTTP juga gagal:', httpError);

                // Jika di Vercel dan tetap gagal, coba lagi dengan URL yang dikonfigurasi manual
                if (isVercelDeployment || forceHttp) {
                  try {
                    // Pastikan baseUrl juga menggunakan HTTP
                    if (pbInstance?.baseUrl?.startsWith('https://')) {
                      const httpBaseUrl = pbInstance.baseUrl.replace('https://', 'http://');
                      logger.info(
                        `Mengubah base URL PocketBase dari ${pbInstance.baseUrl} ke ${httpBaseUrl}`
                      );
                      pbInstance = new PocketBase(httpBaseUrl);
                      pbInstance.autoCancellation(false);
                    }

                    // Coba kirim request lagi dengan instance yang baru
                    logger.info('Mencoba ulang request dengan instance PocketBase yang baru...');
                    return await originalFetch.apply(pbInstance, args);
                  } catch (finalError) {
                    logger.error('Semua upaya koneksi gagal, menyerah:', finalError);
                    throw finalError;
                  }
                }

                // Jika gagal juga, reinisialisasi dengan protokol yang baru terdeteksi
                logger.info('Melakukan reinisialisasi PocketBase...');
                await resetConnection();

                // Throw error untuk dihandle di retry berikutnya
                throw httpError;
              }
            }

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

    // Mendengarkan perubahan protokol untuk reinisialisasi PocketBase
    window.addEventListener('pocketbase:protocol:changed', async (event) => {
      const protocol = (event as CustomEvent).detail?.protocol;
      if (protocol) {
        logger.info(`Mendeteksi perubahan protokol ke ${protocol}, melakukan reinisialisasi...`);

        // Tunggu sebentar untuk memastikan semua request selesai
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Reinisialisasi PocketBase dengan protokol baru
        await resetConnection();
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

      // Force HTTP protocol for all Vercel production requests
      if (isVercelDeployment || forceHttp) {
        if (typeof url === 'string' && url.startsWith('https://')) {
          url = url.replace('https://', 'http://');
          logger.debug(`Vercel prod: URL dikonversi ke HTTP: ${url}`);
        }
      }

      // Add response handler to check for auth errors
      const originalFetch = window.fetch;

      // Replace fetch temporarily to intercept response
      window.fetch = async (...args) => {
        try {
          // Ganti URL HTTPS ke HTTP untuk semua request di Vercel atau jika force HTTP diaktifkan
          if (args[0] && typeof args[0] === 'string' && args[0].startsWith('https://')) {
            // Untuk Vercel production atau jika force HTTP diaktifkan, selalu gunakan HTTP
            if (isVercelDeployment || forceHttp) {
              args[0] = args[0].replace('https://', 'http://');
              logger.debug(`Vercel prod: URL dikonversi ke HTTP: ${args[0]}`);
            }
            // Untuk kasus lain, gunakan protokol yang telah ditentukan
            else if (currentProtocol === 'http') {
              args[0] = args[0].replace('https://', 'http://');
              logger.debug(`URL dikonversi ke HTTP: ${args[0]}`);
            }
          }

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

          // Handle SSL protocol errors and connection issues
          const isSSLError =
            error.message?.includes('SSL') ||
            error.message?.includes('ERR_SSL_PROTOCOL_ERROR') ||
            error.message?.includes('certificate') ||
            error.message?.includes('Failed to fetch');

          if (isSSLError || isVercelDeployment || forceHttp) {
            logger.warn(`Koneksi error terdeteksi: ${error.message}`);

            // Jika URL menggunakan HTTPS, coba dengan HTTP
            if (args[0] && typeof args[0] === 'string' && args[0].startsWith('https://')) {
              const httpUrl = args[0].replace('https://', 'http://');
              logger.info(`Mencoba ulang dengan HTTP: ${httpUrl}`);

              // Selalu update protokol global ke HTTP untuk Vercel/Production
              currentProtocol = 'http';
              logger.info('Protokol koneksi diganti ke HTTP untuk semua request');

              // Trigger reinit
              window.dispatchEvent(
                new CustomEvent('pocketbase:protocol:changed', {
                  detail: { protocol: 'http' },
                })
              );

              // Try with HTTP
              try {
                args[0] = httpUrl;
                return await originalFetch(...args);
              } catch (httpError) {
                logger.error('Retry dengan HTTP juga gagal:', httpError);

                // Notify UI about connection issues
                window.dispatchEvent(
                  new CustomEvent('pocketbase:connection:failed', {
                    detail: { error: httpError },
                  })
                );

                throw httpError;
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
    const response = await fetch(`${getPocketbaseUrl()}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // Timeout 5 detik
    });

    if (response.ok) {
      return true;
    }

    throw new Error(`Health check failed with status: ${response.status}`);
  } catch (error) {
    logger.warn('PocketBase connection check failed:', error.message);

    // Jika masalah SSL/HTTPS, coba switch protokol
    if (
      error.message?.includes('SSL') ||
      error.message?.includes('ERR_SSL_PROTOCOL_ERROR') ||
      error.message?.includes('certificate')
    ) {
      logger.info('Terdeteksi masalah protokol SSL, mencoba mengganti protokol...');

      try {
        // Reset dan reinisialisasi koneksi dengan protokol yang berbeda
        await resetConnection();

        // Coba lagi dengan protokol baru
        const retryResponse = await fetch(`${getPocketbaseUrl()}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });

        return retryResponse.ok;
      } catch (retryError) {
        logger.error('Koneksi dengan protokol alternatif juga gagal:', retryError.message);
        return false;
      }
    }

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
