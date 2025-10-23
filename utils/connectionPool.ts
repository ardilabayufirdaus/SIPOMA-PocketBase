import { pb } from './pocketbase';
import { logger } from './logger';

// Class untuk mengelola koneksi pool ke PocketBase
class ConnectionPool {
  private static instance: ConnectionPool;
  private isInitializing: boolean = false;
  private connectionReadyPromise: Promise<boolean> | null = null;
  private isConnected: boolean = false;
  private serverUrl: string;
  private lastSuccessfulConnection: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

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

  // Pre-connect sebelum user membutuhkan data
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

  // Inisialisasi koneksi ke server
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
        logger.info('Koneksi ke PocketBase berhasil');
      } else {
        logger.warn(`Koneksi ke PocketBase gagal: ${response.status} ${response.statusText}`);
      }

      return this.isConnected;
    } catch (error) {
      logger.error('Gagal terhubung ke PocketBase:', error);
      this.isConnected = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  // Setup health check berkala untuk memastikan koneksi tetap aktif
  private setupHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Periksa koneksi setiap 30 detik
    this.healthCheckInterval = setInterval(async () => {
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

          if (!wasConnected) {
            logger.info('Koneksi ke PocketBase dipulihkan');
            // Trigger event untuk memberitahu komponen bahwa koneksi telah dipulihkan
            window.dispatchEvent(new CustomEvent('pocketbase:connection:restored'));
          }
        } else if (wasConnected) {
          logger.warn(`Koneksi ke PocketBase terputus: ${response.status} ${response.statusText}`);
          // Trigger event untuk memberitahu komponen bahwa koneksi terputus
          window.dispatchEvent(new CustomEvent('pocketbase:connection:lost'));
        }
      } catch (error) {
        const wasConnected = this.isConnected;
        this.isConnected = false;

        if (wasConnected) {
          logger.warn('Koneksi ke PocketBase terputus:', error);
          // Trigger event untuk memberitahu komponen bahwa koneksi terputus
          window.dispatchEvent(new CustomEvent('pocketbase:connection:lost'));
        }
      }
    }, 30000); // 30 detik
  }

  // Mendapatkan status koneksi saat ini
  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  // Mendapatkan timestamp koneksi terakhir yang berhasil
  public getLastSuccessfulConnection(): number {
    return this.lastSuccessfulConnection;
  }

  // Clean up saat aplikasi di-unmount
  public cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Ekspor singleton instance
export const connectionPool = ConnectionPool.getInstance();

// Hook ini dapat digunakan untuk pre-connect ke server saat aplikasi dimulai
export const useConnectionPreparation = () => {
  connectionPool.preConnect().catch((err) => {
    logger.error('Error saat pre-connect:', err);
  });
};
