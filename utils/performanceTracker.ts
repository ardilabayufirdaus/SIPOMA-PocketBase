/**
 * Performance monitoring utilities untuk production optimization
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  memoryUsage?: number;
  bundleSize?: number;
  route?: string;
  timestamp: number;
}

interface WebVital {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private vitals: WebVital[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureInitialLoad();
  }

  private initializeObservers() {
    // Measure Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lcp = entry as PerformanceEntry & { startTime: number };
          this.recordVital('LCP', lcp.startTime);
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch {
        // LCP not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry as PerformanceEntry & { processingStart: number; startTime: number };
          this.recordVital('FID', fid.processingStart - fid.startTime);
        }
      });

      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch {
        // FID not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const cls = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!cls.hadRecentInput) {
            clsValue += cls.value;
          }
        }
        this.recordVital('CLS', clsValue);
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch {
        // CLS not supported
      }
    }
  }

  private measureInitialLoad() {
    if ('performance' in window && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const renderTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      const interactiveTime = timing.domInteractive - timing.navigationStart;

      this.recordMetric({
        loadTime,
        renderTime,
        interactiveTime,
        memoryUsage: this.getMemoryUsage(),
        route: window.location.pathname,
        timestamp: Date.now(),
      });
    }
  }

  private recordVital(name: string, value: number) {
    const rating = this.getVitalRating(name, value);

    this.vitals.push({
      name,
      value,
      delta: value,
      id: `${name}-${Date.now()}`,
      rating,
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendVitalToAnalytics(name, value, rating);
    }
  }

  private getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as Record<string, { usedJSHeapSize: number }>).memory;
      return memory.usedJSHeapSize;
    }
    return undefined;
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private sendVitalToAnalytics(name: string, value: number, rating: string) {
    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        rating,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail in production
    });
  }

  // Public methods
  public measurePageLoad(route: string) {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      this.recordMetric({
        loadTime,
        renderTime: loadTime, // Approximation
        interactiveTime: loadTime,
        memoryUsage: this.getMemoryUsage(),
        route,
        timestamp: Date.now(),
      });
    };
  }

  public measureComponent(componentName: string) {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`Component ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }

      return renderTime;
    };
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getVitals(): WebVital[] {
    return [...this.vitals];
  }

  public getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.metrics.length;
  }

  public cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const useComponentPerformance = (componentName: string) => {
  return {
    startMeasure: () => performanceMonitor.measureComponent(componentName),
    measurePageLoad: (route: string) => performanceMonitor.measurePageLoad(route),
  };
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const metrics = performanceMonitor.getMetrics();
  const vitals = performanceMonitor.getVitals();

  const budget = {
    loadTime: 3000, // 3 seconds
    renderTime: 1000, // 1 second
    bundleSize: 500000, // 500KB
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms
    cls: 0.1, // 0.1
  };

  const violations: string[] = [];

  if (metrics.length > 0) {
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    if (avgLoadTime > budget.loadTime) {
      violations.push(`Load time: ${avgLoadTime.toFixed(0)}ms > ${budget.loadTime}ms`);
    }
  }

  vitals.forEach((vital) => {
    const budgetValue = budget[vital.name.toLowerCase() as keyof typeof budget];
    if (budgetValue && vital.value > budgetValue) {
      violations.push(`${vital.name}: ${vital.value.toFixed(0)} > ${budgetValue}`);
    }
  });

  return {
    passed: violations.length === 0,
    violations,
    metrics: {
      averageLoadTime:
        metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length : 0,
      vitals: vitals.reduce(
        (acc, vital) => {
          acc[vital.name] = vital.value;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
};

export default performanceMonitor;
