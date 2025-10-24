interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  compressionRatio: number;
  totalDataSize: number;
  totalCompressedSize: number;
}

class CacheMetricsTracker {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    compressionRatio: 0,
    totalDataSize: 0,
    totalCompressedSize: 0,
  };

  private startTime: number = Date.now();

  // Track cache hits
  recordHit(): void {
    this.metrics.hits++;
  }

  // Track cache misses
  recordMiss(): void {
    this.metrics.misses++;
  }

  // Track cache sets
  recordSet(dataSize: number, compressedSize: number): void {
    this.metrics.sets++;
    this.metrics.totalDataSize += dataSize;
    this.metrics.totalCompressedSize += compressedSize;
    this.updateCompressionRatio();
  }

  // Track cache evictions
  recordEviction(): void {
    this.metrics.evictions++;
  }

  // Calculate hit rate
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  // Calculate miss rate
  getMissRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.misses / total : 0;
  }

  // Get compression ratio (original size / compressed size)
  getCompressionRatio(): number {
    return this.metrics.compressionRatio;
  }

  // Get all metrics
  getMetrics(): CacheMetrics & {
    hitRate: number;
    missRate: number;
    uptime: number;
  } {
    return {
      ...this.metrics,
      hitRate: this.getHitRate(),
      missRate: this.getMissRate(),
      uptime: Date.now() - this.startTime,
    };
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      compressionRatio: 0,
      totalDataSize: 0,
      totalCompressedSize: 0,
    };
    this.startTime = Date.now();
  }

  // Log metrics to console (for debugging)
  logMetrics(): void {
    // Cache metrics logging - can be enabled for debugging
    // console.log('Cache Metrics:', {
    //   'Hit Rate': `${(this.getHitRate() * 100).toFixed(2)}%`,
    //   'Miss Rate': `${(this.getMissRate() * 100).toFixed(2)}%`,
    //   'Total Requests': this.metrics.hits + this.metrics.misses,
    //   'Cache Sets': this.metrics.sets,
    //   'Evictions': this.metrics.evictions,
    //   'Compression Ratio': `${this.metrics.compressionRatio.toFixed(2)}x`,
    //   'Data Saved': `${((1 - 1/this.metrics.compressionRatio) * 100).toFixed(2)}%`,
    //   'Uptime': `${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes`,
    // });
  }

  private updateCompressionRatio(): void {
    if (this.metrics.totalCompressedSize > 0) {
      this.metrics.compressionRatio = this.metrics.totalDataSize / this.metrics.totalCompressedSize;
    }
  }
}

// Singleton instance
export const cacheMetrics = new CacheMetricsTracker();

// Utility functions for easy integration
export const cacheMetricsUtils = {
  // Wrap cache get operation with metrics
  withMetrics: {
    get: <T>(getFn: () => T | null): T | null => {
      const result = getFn();
      if (result !== null) {
        cacheMetrics.recordHit();
      } else {
        cacheMetrics.recordMiss();
      }
      return result;
    },

    set: (setFn: () => void, dataSize: number, compressedSize: number): void => {
      setFn();
      cacheMetrics.recordSet(dataSize, compressedSize);
    },
  },

  // Calculate data size in bytes
  calculateDataSize: (data: unknown): number => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  },

  // Calculate compressed size in bytes
  calculateCompressedSize: (compressed: string): number => {
    try {
      return new Blob([compressed]).size;
    } catch {
      return 0;
    }
  },
};
