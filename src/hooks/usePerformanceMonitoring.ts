import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useServiceWorker, useCacheStatus } from './useServiceWorker';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  lcp: number; // Largest Contentful Paint

  // Additional metrics
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;

  // Memory usage
  memoryUsage: number;
  memoryLimit: number;

  // Custom metrics
  apiResponseTime: number;
  renderTime: number;
  cacheHitRate: number;
}

// Memory leak detection
export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: 0,
    fid: 0,
    lcp: 0,
    fcp: 0,
    ttfb: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    apiResponseTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
  });

  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([]);
  const renderStartTime = useRef<number>(0);
  const apiStartTime = useRef<number>(0);

  // Monitor Core Web Vitals
  useEffect(() => {
    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      setMetrics((prev) => ({
        ...prev,
        lcp: lastEntry.startTime,
      }));
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observation not supported');
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics((prev) => ({
          ...prev,
          fid: entry.processingStart - entry.startTime,
        }));
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observation not supported');
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      setMetrics((prev) => ({
        ...prev,
        cls: clsValue,
      }));
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observation not supported');
    }

    return () => {
      observer.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // Monitor navigation timing
  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      setMetrics((prev) => ({
        ...prev,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      }));
    }
  }, []);

  // Monitor memory usage
  const takeMemorySnapshot = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.external,
        rss: memory.rss || 0,
      };

      setMemorySnapshots((prev) => {
        const newSnapshots = [...prev, snapshot];
        // Keep only last 50 snapshots
        return newSnapshots.slice(-50);
      });

      setMetrics((prev) => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize,
        memoryLimit: memory.jsHeapSizeLimit || 0,
      }));
    }
  }, []);

  // Monitor render performance
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics((prev) => ({
        ...prev,
        renderTime,
      }));
      renderStartTime.current = 0;
    }
  }, []);

  // Monitor API performance
  const startApiMeasurement = useCallback(() => {
    apiStartTime.current = performance.now();
  }, []);

  const endApiMeasurement = useCallback(() => {
    if (apiStartTime.current) {
      const apiTime = performance.now() - apiStartTime.current;
      setMetrics((prev) => ({
        ...prev,
        apiResponseTime: apiTime,
      }));
      apiStartTime.current = 0;
    }
  }, []);

  // Periodic memory monitoring
  useEffect(() => {
    const interval = setInterval(takeMemorySnapshot, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [takeMemorySnapshot]);

  // Detect memory leaks
  const detectMemoryLeaks = useCallback(() => {
    if (memorySnapshots.length < 10) return false;

    const recent = memorySnapshots.slice(-10);
    const older = memorySnapshots.slice(-20, -10);

    const recentAvg = recent.reduce((sum, snap) => sum + snap.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, snap) => sum + snap.heapUsed, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    // Alert if memory growth > 20% over last 10 snapshots
    return growthRate > 0.2;
  }, [memorySnapshots]);

  // Performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations = [];

    if (metrics.lcp > 2500) {
      recommendations.push(
        'Optimize Largest Contentful Paint (LCP) - consider lazy loading images'
      );
    }

    if (metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay (FID) - optimize JavaScript execution');
    }

    if (metrics.cls > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift (CLS) - ensure stable element positioning');
    }

    if (metrics.memoryUsage > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push('High memory usage detected - consider memory optimization');
    }

    if (detectMemoryLeaks()) {
      recommendations.push('Potential memory leak detected - review component cleanup');
    }

    return recommendations;
  }, [metrics, detectMemoryLeaks]);

  return {
    metrics,
    memorySnapshots,
    takeMemorySnapshot,
    startRenderMeasurement,
    endRenderMeasurement,
    startApiMeasurement,
    endApiMeasurement,
    detectMemoryLeaks,
    getPerformanceRecommendations,
  };
};

