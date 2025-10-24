import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // Waktu kedaluwarsa dalam milidetik
}

class DataCache {
  private static instance: DataCache;
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxCacheSize: number = 100; // Jumlah maksimum item dalam cache
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Setup pembersihan cache otomatis setiap 5 menit
    this.cleanupInterval = setInterval(() => this.cleanupExpiredItems(), 300000);
  }

  public static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  /**
   * Menyimpan data dalam cache dengan kunci dan waktu kedaluwarsa tertentu
   * @param key Kunci untuk mengidentifikasi data
   * @param data Data yang akan disimpan
   * @param expiryMs Waktu kedaluwarsa dalam milidetik (default: 5 menit)
   */
  public set<T>(key: string, data: T, expiryMs: number = 300000): void {
    // Jika cache sudah penuh, hapus item tertua
    if (this.cache.size >= this.maxCacheSize) {
      this.removeOldestItem();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    });

    logger.debug(
      `Cache: Item disimpan dengan kunci "${key}", kadaluwarsa dalam ${expiryMs / 1000}s`
    );
  }

  /**
   * Mengambil data dari cache jika tersedia dan belum kedaluwarsa
   * @param key Kunci untuk mengidentifikasi data
   * @returns Data atau null jika tidak ditemukan atau sudah kedaluwarsa
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiry;

    if (isExpired) {
      this.cache.delete(key);
      logger.debug(`Cache: Item dengan kunci "${key}" telah kadaluwarsa dan dihapus`);
      return null;
    }

    logger.debug(
      `Cache: Item dengan kunci "${key}" ditemukan, usia ${(now - item.timestamp) / 1000}s`
    );
    return item.data as T;
  }

  /**
   * Menghapus semua item yang sudah kedaluwarsa
   */
  public cleanupExpiredItems(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache: ${expiredCount} item kadaluwarsa telah dihapus`);
    }
  }

  /**
   * Menghapus item tertua dari cache
   */
  private removeOldestItem(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache: Item tertua dengan kunci "${oldestKey}" dihapus untuk menghemat ruang`);
    }
  }

  /**
   * Menghapus item dari cache berdasarkan kunci
   * @param key Kunci untuk mengidentifikasi data
   */
  public remove(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache: Item dengan kunci "${key}" dihapus dari cache`);
  }

  /**
   * Menghapus item dari cache yang cocok dengan pattern tertentu
   * @param pattern Pattern string atau RegExp untuk pencocokan kunci
   */
  public removeByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let removedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cache: ${removedCount} item dihapus berdasarkan pattern "${pattern}"`);
    }
  }

  /**
   * Membersihkan seluruh cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug(`Cache: ${size} item dihapus dalam clear cache`);
  }

  /**
   * Mendapatkan jumlah item dalam cache
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Pembersihan saat aplikasi shutdown
   */
  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Ekspor singleton instance
export const dataCache = DataCache.getInstance();

/**
 * Hook untuk mengakses data dengan cache
 * @param fetcher Fungsi untuk mengambil data jika tidak ada di cache
 * @param cacheKey Kunci cache
 * @param expiryMs Waktu kedaluwarsa dalam milidetik
 */
export const useCachedData = async <T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  expiryMs: number = 300000 // 5 menit default
): Promise<T> => {
  const cachedData = dataCache.get<T>(cacheKey);

  if (cachedData !== null) {
    return cachedData;
  }

  try {
    const freshData = await fetcher();
    dataCache.set(cacheKey, freshData, expiryMs);
    return freshData;
  } catch (error) {
    logger.error(`Error mengambil data untuk cache "${cacheKey}":`, error);
    throw error;
  }
};
