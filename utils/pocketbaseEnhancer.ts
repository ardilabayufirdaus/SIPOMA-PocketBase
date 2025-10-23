// pocketbaseEnhancer.ts
// File ini akan meningkatkan instans PocketBase dengan fitur optimasi

import { pb } from './pocketbase';
import { logger } from './logger';
import { connectionPool } from './optimization/connectionPool';
import { dataCache } from './optimization/dataCache';

/**
 * Fungsi untuk meningkatkan fungsionalitas PocketBase dengan optimasi
 * Panggil fungsi ini saat aplikasi startup
 */
export function enhancePocketBase(): void {
  try {
    logger.info('Enhancing PocketBase with optimization features');

    // Pre-connect to server for faster initial requests
    connectionPool.preConnect().catch((error) => {
      logger.error('Error saat pre-connect ke server PocketBase:', error);
    });

    // Tambahkan event listeners untuk koneksi
    const setupConnectionListeners = () => {
      // Handle online/offline status
      window.addEventListener('online', () => {
        logger.info('Browser online status changed to online, checking server connection');
        connectionPool.preConnect();

        // Dispatch connection restored event if connection is successful
        if (connectionPool.isConnectionActive()) {
          window.dispatchEvent(new CustomEvent('pocketbase:connection:restored'));
        }
      });

      window.addEventListener('offline', () => {
        logger.warn('Browser offline, marking connection as inactive');
        window.dispatchEvent(new CustomEvent('pocketbase:connection:lost'));
      });

      // Setup custom event handlers for connection events
      window.addEventListener('pocketbase:connection:lost', () => {
        logger.warn('PocketBase connection lost');
        // Invalidate caches that depend on server state
        dataCache.removeByPattern(/^(realtime|subscription|auth)/);
      });

      window.addEventListener('pocketbase:connection:restored', () => {
        logger.info('PocketBase connection restored');
        // Re-authenticate if needed
        if (!pb.authStore.isValid) {
          logger.info('Auth token invalid after connection restored, re-authenticating...');
          // Trigger re-authentication by dispatching auth state change event
          window.dispatchEvent(new CustomEvent('authStateChanged'));
        }
      });
    };

    // Add event listener for auth errors
    const originalSubscribe = pb.realtime.subscribe;
    pb.realtime.subscribe = function (...args) {
      try {
        logger.debug(`Setting up realtime subscription to ${args[0]}`);
        return originalSubscribe.apply(this, args);
      } catch (error) {
        logger.error(`Error in realtime subscription to ${args[0]}:`, error);

        // Check for auth errors and try to re-auth
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          error.status === 403 &&
          'message' in error &&
          typeof error.message === 'string' &&
          error.message.includes("authorization don't match")
        ) {
          logger.warn('Detected auth token mismatch in realtime subscription, clearing auth store');
          pb.authStore.clear();

          // Trigger re-authentication
          window.dispatchEvent(new CustomEvent('authStateChanged'));
        }

        throw error;
      }
    };

    // Setup event listeners if we're in a browser environment
    if (typeof window !== 'undefined') {
      setupConnectionListeners();
      logger.info('PocketBase enhancement complete with connection monitoring');
    } else {
      logger.info('PocketBase enhancement complete (non-browser environment)');
    }
  } catch (error) {
    logger.error('Error enhancing PocketBase:', error);
  }
}
