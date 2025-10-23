import { pb } from '../pocketbase';
import { logger } from '../logger';

/**
 * Class untuk mengelola koneksi ke PocketBase server
 */
class ConnectionPool {
  private static instance: ConnectionPool;
  private isInitializing: boolean = false;
  private connectionReadyPromise: Promise<boolean> | null = null;
  private isConnected: boolean = false;
  private serverUrl: string;
  private lastSuccessfulConnection: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;
  private maxAttempts: number = 5;

  private constructor() {
    this.serverUrl = pb.baseUrl;
    this.setupHealthCheck();
  }

  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  /**
   * Pre-connect sebelum user membutuhkan data
   */
  public async preConnect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    if (this.isInitializing) {
      return this.connectionReadyPromise || Promise.resolve(false);
    }

    this.isInitializing = true;
    this.connectionReadyPromise = this.initializeConnection();
    return this.connectionReadyPromise;
  }

  /**
   * Inisialisasi koneksi ke server
   */
  private async initializeConnection(): Promise<boolean> {
    try {
      logger.info('Inisialisasi koneksi ke PocketBase...');

      // Coba ping server untuk memverifikasi koneksi
      const response = await fetch(`${this.serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000), // Timeout 3 detik
      });

      this.isConnected = response.ok;

      if (response.ok) {
        this.lastSuccessfulConnection = Date.now();
        this.connectionAttempts = 0; // Reset attempts on success
        logger.info('Koneksi ke PocketBase berhasil');

        // Dispatch event untuk komponen yang menunggu koneksi
        try {
          window.dispatchEvent(new CustomEvent('pocketbase:connection:established'));
        } catch (e) {
          // Ignore errors if we're not in a browser environment
        }
      } else {
        this.connectionAttempts++;
        logger.warn(`Koneksi ke PocketBase gagal: ${response.status} ${response.statusText}`);
      }

      return this.isConnected;
    } catch (error) {
      this.connectionAttempts++;
      logger.error('Gagal terhubung ke PocketBase:', error);
      this.isConnected = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Setup health check berkala untuk memastikan koneksi tetap aktif
   */
  private setupHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Periksa koneksi setiap 30 detik
    this.healthCheckInterval = setInterval(async () => {
      // Skip health check if we've reached max attempts
      if (this.connectionAttempts >= this.maxAttempts) {
        logger.warn(`Skipping health check after ${this.maxAttempts} consecutive failures`);
        return;
      }

      try {
        const response = await fetch(`${this.serverUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(3000), // Timeout 3 detik
        });

        const wasConnected = this.isConnected;
        this.isConnected = response.ok;

        if (response.ok) {
          this.lastSuccessfulConnection = Date.now();
          this.connectionAttempts = 0; // Reset attempts on success

          if (!wasConnected) {
            logger.info('Koneksi ke PocketBase dipulihkan');
            try {
              // Trigger event untuk memberitahu komponen bahwa koneksi telah dipulihkan
              window.dispatchEvent(new CustomEvent('pocketbase:connection:restored'));
            } catch (e) {
              // Ignore errors if we're not in a browser environment
            }
          }
        } else if (wasConnected) {
          this.connectionAttempts++;
          logger.warn(`Koneksi ke PocketBase terputus: ${response.status} ${response.statusText}`);
          try {
            // Trigger event untuk memberitahu komponen bahwa koneksi terputus
            window.dispatchEvent(new CustomEvent('pocketbase:connection:lost'));
          } catch (e) {
            // Ignore errors if we're not in a browser environment
          }
        }
      } catch (error) {
        const wasConnected = this.isConnected;
        this.connectionAttempts++;
        this.isConnected = false;

        if (wasConnected) {
          logger.warn('Koneksi ke PocketBase terputus:', error);
          try {
            // Trigger event untuk memberitahu komponen bahwa koneksi terputus
            window.dispatchEvent(new CustomEvent('pocketbase:connection:lost'));
          } catch (e) {
            // Ignore errors if we're not in a browser environment
          }
        }
      }
    }, 30000); // 30 detik
  }

  /**
   * Mendapatkan status koneksi saat ini
   */
  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Mendapatkan timestamp koneksi terakhir yang berhasil
   */
  public getLastSuccessfulConnection(): number {
    return this.lastSuccessfulConnection;
  }

  /**
   * Clean up saat aplikasi di-unmount
   */
  public cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Ekspor singleton instance
export const connectionPool = ConnectionPool.getInstance();

/**
 * Hook untuk menginisialisasi koneksi ke PocketBase server
 * Panggil hook ini di komponen root aplikasi
 */
export function initializeConnection(): void {
  connectionPool.preConnect().catch((err) => {
    logger.error('Error saat inisialisasi koneksi:', err);
  });
}
