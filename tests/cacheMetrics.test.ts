import { describe, it, expect, beforeEach } from '@jest/globals';
import { cacheMetrics, cacheMetricsUtils } from '../utils/cacheMetrics';

describe('Cache Metrics', () => {
  beforeEach(() => {
    cacheMetrics.reset();
  });

  describe('Basic Metrics Tracking', () => {
    it('should track cache hits', () => {
      cacheMetrics.recordHit();
      cacheMetrics.recordHit();

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.hitRate).toBe(1.0); // 2/2 = 100%
    });

    it('should track cache misses', () => {
      cacheMetrics.recordMiss();
      cacheMetrics.recordMiss();
      cacheMetrics.recordMiss();

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.misses).toBe(3);
      expect(metrics.missRate).toBe(1.0); // 3/3 = 100%
    });

    it('should calculate hit and miss rates correctly', () => {
      cacheMetrics.recordHit();
      cacheMetrics.recordHit();
      cacheMetrics.recordMiss();

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(2 / 3); // 66.67%
      expect(metrics.missRate).toBe(1 / 3); // 33.33%
    });

    it('should track cache sets and compression', () => {
      cacheMetrics.recordSet(1000, 600); // 1000 bytes original, 600 bytes compressed
      cacheMetrics.recordSet(2000, 1200); // 2000 bytes original, 1200 bytes compressed

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.sets).toBe(2);
      expect(metrics.totalDataSize).toBe(3000);
      expect(metrics.totalCompressedSize).toBe(1800);
      expect(metrics.compressionRatio).toBe(3000 / 1800); // 1.67x compression
    });

    it('should track evictions', () => {
      cacheMetrics.recordEviction();
      cacheMetrics.recordEviction();
      cacheMetrics.recordEviction();

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.evictions).toBe(3);
    });
  });

  describe('Metrics Utilities', () => {
    it('should calculate data size', () => {
      const data = { test: 'data', number: 123, array: [1, 2, 3] };
      const size = cacheMetricsUtils.calculateDataSize(data);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should calculate compressed size', () => {
      const compressed = 'SGVsbG8gV29ybGQ='; // Base64 encoded "Hello World"
      const size = cacheMetricsUtils.calculateCompressedSize(compressed);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should wrap functions with metrics', () => {
      let callCount = 0;
      const mockGetFn = () => {
        callCount++;
        return callCount === 1 ? 'data' : null;
      };

      // First call should be hit
      const result1 = cacheMetricsUtils.withMetrics.get(mockGetFn);
      expect(result1).toBe('data');

      // Second call should be miss
      const result2 = cacheMetricsUtils.withMetrics.get(mockGetFn);
      expect(result2).toBeNull();

      const metrics = cacheMetrics.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
    });
  });

  describe('Metrics Reporting', () => {
    it('should provide comprehensive metrics', () => {
      // Simulate some activity
      cacheMetrics.recordHit();
      cacheMetrics.recordMiss();
      cacheMetrics.recordSet(1000, 500);
      cacheMetrics.recordEviction();

      const metrics = cacheMetrics.getMetrics();

      expect(metrics).toHaveProperty('hits', 1);
      expect(metrics).toHaveProperty('misses', 1);
      expect(metrics).toHaveProperty('sets', 1);
      expect(metrics).toHaveProperty('evictions', 1);
      expect(metrics).toHaveProperty('hitRate', 0.5);
      expect(metrics).toHaveProperty('missRate', 0.5);
      expect(metrics).toHaveProperty('compressionRatio', 2);
      expect(metrics).toHaveProperty('uptime');
      expect(typeof metrics.uptime).toBe('number');
    });

    it('should reset metrics correctly', () => {
      cacheMetrics.recordHit();
      cacheMetrics.recordSet(1000, 500);

      let metrics = cacheMetrics.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.sets).toBe(1);

      cacheMetrics.reset();

      metrics = cacheMetrics.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.sets).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.evictions).toBe(0);
    });
  });
});

