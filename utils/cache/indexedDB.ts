// IndexedDB Cache Utility for COP Analysis Data
// Provides fast local storage and retrieval of analysis data

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CopAnalysisCacheData {
  moistureData: Map<string, number>;
  feedData: Map<string, number>;
  parameterData: Record<string, unknown>[];
  lastUpdated: number;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'SipomaCopAnalysisCache';
  private readonly version = 1;
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('copAnalysis')) {
          const store = db.createObjectStore('copAnalysis', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('apiResponses')) {
          const store = db.createObjectStore('apiResponses', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.cacheExpiry),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['copAnalysis'], 'readwrite');
      const store = transaction.objectStore('copAnalysis');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['copAnalysis'], 'readonly');
      const store = transaction.objectStore('copAnalysis');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Delete expired entry
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['copAnalysis'], 'readwrite');
      const store = transaction.objectStore('copAnalysis');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['copAnalysis'], 'readwrite');
      const store = transaction.objectStore('copAnalysis');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['copAnalysis'], 'readwrite');
      const store = transaction.objectStore('copAnalysis');
      const index = store.index('expiresAt');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (Date.now() > cursor.value.expiresAt) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Specialized methods for COP Analysis
  getCacheKey(category: string, unit: string, year: number, month: number): string {
    return `cop_analysis_${category}_${unit}_${year}_${month}`;
  }

  async getCopAnalysisData(
    category: string,
    unit: string,
    year: number,
    month: number
  ): Promise<CopAnalysisCacheData | null> {
    const key = this.getCacheKey(category, unit, year, month);
    return this.get<CopAnalysisCacheData>(key);
  }

  async setCopAnalysisData(
    category: string,
    unit: string,
    year: number,
    month: number,
    data: CopAnalysisCacheData
  ): Promise<void> {
    const key = this.getCacheKey(category, unit, year, month);
    await this.set(key, data);
  }

  // API Response caching
  async cacheApiResponse(
    url: string,
    response: Record<string, unknown>,
    ttl?: number
  ): Promise<void> {
    const key = `api_${btoa(url)}`;
    await this.set(key, response, ttl);
  }

  async getCachedApiResponse(url: string): Promise<Record<string, unknown> | null> {
    const key = `api_${btoa(url)}`;
    return this.get(key);
  }
}

// Singleton instance
export const indexedDBCache = new IndexedDBCache();

// Initialize on module load
indexedDBCache.init().catch(() => {
  // Silently fail if IndexedDB is not available
});

// Utility functions for COP Analysis
export const getCopAnalysisCacheKey = (
  category: string,
  unit: string,
  year: number,
  month: number
) => `cop_analysis_${category}_${unit}_${year}_${month}`;

export const isCacheValid = (timestamp: number, maxAge: number = 24 * 60 * 60 * 1000): boolean => {
  return Date.now() - timestamp < maxAge;
};

export default indexedDBCache;
