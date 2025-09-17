/**
 * Performance Monitoring Utility
 * Provides comprehensive performance tracking and error monitoring
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'measure' | 'mark' | 'navigation' | 'resource';
}

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorLog[] = [];
  private isEnabled = process.env.NODE_ENV === 'production';

  // Mark performance points
  mark(name: string): void {
    if (!this.isEnabled || !performance.mark) return;
    try {
      performance.mark(name);
    } catch (error) {
      console.warn('Performance mark failed:', error);
    }
  }

  // Measure time between marks
  measure(name: string, startMark: string, endMark: string): void {
    if (!this.isEnabled || !performance.measure) return;
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        this.metrics.push({
          name,
          value: measure.duration,
          timestamp: Date.now(),
          type: 'measure',
        });
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  // Track component render time
  trackRender(componentName: string, startTime: number): void {
    if (!this.isEnabled) return;
    const duration = performance.now() - startTime;
    this.metrics.push({
      name: `render-${componentName}`,
      value: duration,
      timestamp: Date.now(),
      type: 'measure',
    });
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return;
    this.metrics.push({
      name: `api-${endpoint}`,
      value: duration,
      timestamp: Date.now(),
      type: success ? 'measure' : 'mark',
    });
  }

  // Log errors
  logError(error: Error, context?: any): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.errors.push(errorLog);

    // Send to monitoring service in production
    if (this.isEnabled) {
      this.sendToMonitoringService('error', errorLog);
    }

    console.error('Logged error:', errorLog);
  }

  // Get navigation timing
  getNavigationTiming(): void {
    if (!this.isEnabled || !performance.timing) return;

    const timing = performance.timing;
    const navigationStart = timing.navigationStart;

    const metrics = [
      {
        name: 'dns-lookup',
        value: timing.domainLookupEnd - timing.domainLookupStart,
      },
      { name: 'tcp-connect', value: timing.connectEnd - timing.connectStart },
      {
        name: 'server-response',
        value: timing.responseStart - timing.requestStart,
      },
      {
        name: 'page-load',
        value: timing.loadEventEnd - timing.navigationStart,
      },
      {
        name: 'dom-ready',
        value: timing.domContentLoadedEventEnd - timing.navigationStart,
      },
    ];

    metrics.forEach((metric) => {
      if (metric.value > 0) {
        this.metrics.push({
          ...metric,
          timestamp: Date.now(),
          type: 'navigation',
        });
      }
    });
  }

  // Get resource timing
  getResourceTiming(): void {
    if (!this.isEnabled || !performance.getEntriesByType) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    resources.forEach((resource) => {
      this.metrics.push({
        name: `resource-${resource.name.split('/').pop()}`,
        value: resource.duration,
        timestamp: Date.now(),
        type: 'resource',
      });
    });
  }

  // Get current metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get current errors
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  // Clear old data
  clearOldData(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
    this.errors = this.errors.filter((e) => e.timestamp > cutoff);
  }

  // Send data to monitoring service
  private sendToMonitoringService(type: 'metric' | 'error', data: any): void {
    // In production, send to your monitoring service
    // Example: Sentry, DataDog, New Relic, etc.
    try {
      // Placeholder for monitoring service integration
      // console.log(`Sending ${type} to monitoring service:`, data); // removed for production
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }

  // Get current user ID from localStorage
  private getCurrentUserId(): string | undefined {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  // Initialize monitoring
  init(): void {
    if (!this.isEnabled) return;

    // Track navigation timing
    if (document.readyState === 'complete') {
      this.getNavigationTiming();
      this.getResourceTiming();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.getNavigationTiming();
          this.getResourceTiming();
        }, 0);
      });
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(new Error(`Unhandled promise rejection: ${event.reason}`));
    });

    // Periodic cleanup
    setInterval(
      () => {
        this.clearOldData();
      },
      60 * 60 * 1000
    ); // Clean every hour
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = performance.now();

  React.useEffect(() => {
    return () => {
      performanceMonitor.trackRender(componentName, startTime);
    };
  }, [componentName, startTime]);
};

// HOC for performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    usePerformanceTracking(componentName);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent;
};
