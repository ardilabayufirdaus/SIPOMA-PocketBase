/**
 * Browser Cache & Site Data Utility Functions
 * Auto-clear cache, storage, dan site data untuk keamanan logout
 */

import { logger } from './logger';

/**
 * Clear cookies & site data hanya untuk SIPOMA domains (localhost & sipoma.site)
 */
const clearSipomaDomainData = async (): Promise<void> => {
  try {
    const currentDomain = window.location.hostname;
    const targetDomains = ['localhost', 'sipoma.site'];

    // Check if current domain is one of our target domains
    const isTargetDomain = targetDomains.some(
      (domain) => currentDomain === domain || currentDomain.includes(domain)
    );

    if (!isTargetDomain) {
      logger.info(`Current domain ${currentDomain} is not SIPOMA domain, skipping clear`);
      return;
    }

    logger.info(`Clearing data for SIPOMA domain: ${currentDomain}`);

    // 1. Clear localStorage - hanya SIPOMA keys
    if (typeof localStorage !== 'undefined') {
      const sipomaKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('sipoma') ||
            key.startsWith('pb_') ||
            key.startsWith('pocketbase') ||
            key.includes('currentUser') ||
            key.includes('auth') ||
            key.includes('session'))
        ) {
          sipomaKeys.push(key);
        }
      }

      sipomaKeys.forEach((key) => {
        localStorage.removeItem(key);
        logger.info(`localStorage key '${key}' cleared`);
      });
    }

    // 2. Clear sessionStorage - hanya SIPOMA keys
    if (typeof sessionStorage !== 'undefined') {
      const sipomaSessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (
          key &&
          (key.startsWith('sipoma') ||
            key.startsWith('pb_') ||
            key.startsWith('pocketbase') ||
            key.includes('currentUser') ||
            key.includes('auth') ||
            key.includes('session'))
        ) {
          sipomaSessionKeys.push(key);
        }
      }

      sipomaSessionKeys.forEach((key) => {
        sessionStorage.removeItem(key);
        logger.info(`sessionStorage key '${key}' cleared`);
      });
    }

    // 3. Clear cookies untuk current domain
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Clear cookie untuk current domain dengan berbagai path combinations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${currentDomain}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${currentDomain}`;
      }
    });

    // 4. Clear IndexedDB - hanya SIPOMA related databases
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        const sipomaDBs = databases.filter(
          (db) =>
            db.name &&
            (db.name.includes('sipoma') ||
              db.name.includes('pocketbase') ||
              db.name.includes('pb_') ||
              db.name.includes('auth'))
        );

        await Promise.all(
          sipomaDBs.map(async (db) => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              return new Promise<void>((resolve, reject) => {
                deleteReq.onsuccess = () => {
                  logger.info(`IndexedDB '${db.name}' cleared`);
                  resolve();
                };
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (error) {
        logger.warn('IndexedDB clearing failed:', error);
      }
    }

    // 5. Clear service worker caches - hanya untuk current domain
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const currentOrigin = window.location.origin;

        const sipomaCaches = cacheNames.filter(
          (cacheName) =>
            cacheName.includes(currentOrigin) ||
            cacheName.includes('sipoma') ||
            cacheName.includes('workbox') ||
            cacheName.includes('runtime') ||
            cacheName.includes('precache')
        );

        await Promise.all(
          sipomaCaches.map(async (cacheName) => {
            await caches.delete(cacheName);
            logger.info(`SIPOMA cache '${cacheName}' cleared`);
          })
        );
      } catch (error) {
        logger.warn('Cache clearing failed:', error);
      }
    }

    logger.info(`SIPOMA domain data cleared successfully for: ${currentDomain}`);
  } catch (error) {
    logger.error('SIPOMA domain data clearing failed:', error);
    throw error;
  }
};

/**
 * Clear domain-specific service worker caches (hanya cache yang related ke current domain)
 */
const clearDomainCaches = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const currentOrigin = window.location.origin;

      // Filter caches yang related ke current domain atau SIPOMA
      const domainCaches = cacheNames.filter(
        (cacheName) =>
          cacheName.includes(currentOrigin) ||
          cacheName.includes('sipoma') ||
          cacheName.includes('workbox') ||
          cacheName.includes('runtime') ||
          cacheName.includes('precache')
      );

      await Promise.all(
        domainCaches.map(async (cacheName) => {
          await caches.delete(cacheName);
          logger.info(`Domain cache '${cacheName}' cleared`);
        })
      );

      logger.info(
        `Cleared ${domainCaches.length} domain-specific caches (total: ${cacheNames.length})`
      );
    }
  } catch (error) {
    logger.warn('Domain cache clearing failed:', error);
  }
};

/**
 * Clear cookies hanya untuk current domain (bukan semua cookies browser)
 */
const clearDomainCookies = (): void => {
  try {
    const currentDomain = window.location.hostname;
    const cookies = document.cookie.split(';');

    // Clear each cookie untuk current domain saja
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Clear cookie untuk current domain dengan berbagai path combinations
        const clearCookie = (domain?: string, path?: string) => {
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          if (path) cookieString += ` path=${path};`;
          if (domain) cookieString += ` domain=${domain};`;
          document.cookie = cookieString;
        };

        // Clear untuk current domain saja (tidak semua domain)
        clearCookie();
        clearCookie('/', '/');
        clearCookie(currentDomain, '/');
        clearCookie(`.${currentDomain}`, '/');
      }
    });

    logger.info(`Cookies cleared for domain: ${currentDomain}`);
  } catch (error) {
    logger.warn('Domain cookie clearing failed:', error);
  }
};

/**
 * Clear browser history jika memungkinkan
 */
const clearBrowserHistory = (): void => {
  try {
    // Replace current state untuk menghindari back button ke halaman authenticated
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/login');
      logger.info('Browser history state replaced');
    }
  } catch (error) {
    logger.warn('History clearing failed:', error);
  }
};

/**
 * Force reload halaman untuk memastikan pembersihan complete
 */
const forcePageReload = (): void => {
  try {
    // Set flag untuk mencegah infinite reload loop
    const reloadFlag = 'sipoma_logout_reload';
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, 'true');

      // Delay reload untuk memastikan storage clearing selesai
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  } catch (error) {
    logger.warn('Force reload failed:', error);
    // Fallback navigation
    window.location.href = '/login';
  }
};

/**
 * Fast logout - minimal clearing untuk performance
 * Hanya clear data authentication yang essential
 */
export const clearAuthDataOnly = async (): Promise<void> => {
  logger.info('Starting fast logout - clearing auth data only...');

  try {
    // Clear only essential auth data
    if (typeof localStorage !== 'undefined') {
      const authKeys = ['currentUser', 'pb_auth', 'pocketbase_auth', 'sipoma_auth'];
      authKeys.forEach((key) => {
        localStorage.removeItem(key);
        logger.info(`Auth key '${key}' cleared`);
      });
    }

    if (typeof sessionStorage !== 'undefined') {
      const authSessionKeys = ['currentUser', 'pb_auth', 'pocketbase_auth', 'sipoma_auth'];
      authSessionKeys.forEach((key) => {
        sessionStorage.removeItem(key);
      });
    }

    // Clear auth cookies saja
    const authCookies = ['pb_auth', 'sipoma_session', 'auth_token'];
    authCookies.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

    logger.info('Fast logout completed - auth data cleared');
  } catch (error) {
    logger.error('Fast logout failed:', error);
  }
};

/**
 * Configuration untuk clearing behavior
 */
export interface ClearingOptions {
  mode: 'fast' | 'secure' | 'comprehensive';
  includeCache?: boolean;
  includeIndexedDB?: boolean;
  forceReload?: boolean;
}

/**
 * Configurable browser data clearing
 */
export const clearBrowserDataConfigurable = async (
  options: ClearingOptions = { mode: 'secure' }
): Promise<void> => {
  logger.info(`Starting ${options.mode} logout clearing...`);

  switch (options.mode) {
    case 'fast':
      await clearAuthDataOnly();
      if (options.forceReload !== false) {
        // Minimal reload - just navigate
        window.location.href = '/login';
      }
      break;

    case 'secure':
      // Default behavior - domain specific clearing
      await clearBrowserData();
      break;

    case 'comprehensive':
      // Full clearing (original implementation) - hanya jika explicitly requested
      await clearComprehensiveBrowserData();
      break;

    default:
      await clearBrowserData();
  }
};

/**
 * Comprehensive clearing (original implementation) - untuk compatibility
 */
const clearComprehensiveBrowserData = async (): Promise<void> => {
  logger.info('Starting comprehensive browser data clearing...');

  try {
    // Clear ALL storage (original behavior)
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
      logger.info('All localStorage cleared');
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      logger.info('All sessionStorage cleared');
    }

    // Clear ALL IndexedDB databases
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(async (db) => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              return new Promise<void>((resolve, reject) => {
                deleteReq.onsuccess = () => {
                  logger.info(`All IndexedDB '${db.name}' cleared`);
                  resolve();
                };
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (error) {
        logger.warn('All IndexedDB clearing failed:', error);
      }
    }

    // Clear ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          logger.info(`All cache '${cacheName}' cleared`);
        })
      );
    }

    clearDomainCookies();
    clearBrowserHistory();
    forcePageReload();
  } catch (error) {
    logger.error('Comprehensive browser data clearing failed:', error);
    forcePageReload();
  }
};

/**
 * Main function untuk clear domain-specific browser data (OPTIMIZED)
 * Hanya membersihkan data yang related ke SIPOMA, bukan semua browser data
 */
/**
 * Main function untuk logout - clear SIPOMA domain data saja (SIMPLIFIED)
 */
export const clearBrowserData = async (): Promise<void> => {
  logger.info('Starting SIPOMA domain data clearing (localhost & sipoma.site)...');

  try {
    // Clear data untuk SIPOMA domains saja
    await clearSipomaDomainData();

    logger.info('SIPOMA domain data clearing completed successfully');

    // Simple navigation tanpa force reload untuk speed
    window.location.href = '/login';
  } catch (error) {
    logger.error('SIPOMA domain data clearing failed:', error);

    // Fallback - basic auth clearing
    try {
      const authKeys = ['currentUser', 'pb_auth', 'pocketbase_auth', 'sipoma_auth'];
      authKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear basic auth cookies
      document.cookie = 'pb_auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'sipoma_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

      logger.info('Fallback auth clearing completed');
    } catch (fallbackError) {
      logger.error('Fallback clearing also failed:', fallbackError);
    }

    // Navigate anyway
    window.location.href = '/login';
  }
};

/**
 * Utility function untuk check apakah browser supports clearing features
 */
export const getBrowserClearingSupport = () => {
  return {
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    indexedDB: 'indexedDB' in window,
    caches: 'caches' in window,
    cookies: typeof document !== 'undefined' && 'cookie' in document,
    history: window.history && 'replaceState' in window.history,
  };
};

/**
 * Development helper untuk test clearing functionality
 */
export const testBrowserClearing = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    logger.info('Testing browser clearing support:');
    const support = getBrowserClearingSupport();

    Object.entries(support).forEach(([feature, supported]) => {
      logger.info(`${feature}: ${supported ? '✅' : '❌'}`);
    });

    // Test clearing (hanya di development)
    await clearBrowserData();
  }
};
