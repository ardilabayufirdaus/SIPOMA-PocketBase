import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  onMetricCollected?: (metric: PerformanceMetrics) => void;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const { enabled = true, onMetricCollected } = options;
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const activeOperations = useRef<Map<string, PerformanceMetrics>>(new Map());

  const startOperation = (operationName: string, metadata?: Record<string, any>) => {
    if (!enabled) return;

    const metric: PerformanceMetrics = {
      operationName,
      startTime: performance.now(),
      success: false,
      metadata,
    };

    activeOperations.current.set(operationName, metric);
  };

  const endOperation = (operationName: string, success: boolean = true, error?: string) => {
    if (!enabled) return;

    const metric = activeOperations.current.get(operationName);
    if (!metric) return;

    const endTime = performance.now();
    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration: endTime - metric.startTime,
      success,
      error,
    };

    activeOperations.current.delete(operationName);
    setMetrics((prev) => [...prev, completedMetric]);

    if (onMetricCollected) {
      onMetricCollected(completedMetric);
    }
  };

  const getMetrics = () => metrics;

  const getAverageDuration = (operationName?: string) => {
    const relevantMetrics = operationName
      ? metrics.filter((m) => m.operationName === operationName && m.duration)
      : metrics.filter((m) => m.duration);

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / relevantMetrics.length;
  };

  const getSuccessRate = (operationName?: string) => {
    const relevantMetrics = operationName
      ? metrics.filter((m) => m.operationName === operationName)
      : metrics;

    if (relevantMetrics.length === 0) return 0;

    const successes = relevantMetrics.filter((m) => m.success).length;
    return (successes / relevantMetrics.length) * 100;
  };

  const clearMetrics = () => {
    setMetrics([]);
    activeOperations.current.clear();
  };

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      activeOperations.current.clear();
    };
  }, []);

  return {
    startOperation,
    endOperation,
    getMetrics,
    getAverageDuration,
    getSuccessRate,
    clearMetrics,
    activeOperationsCount: activeOperations.current.size,
  };
};

// Hook for monitoring database operations specifically
export const useDatabasePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const monitor = usePerformanceMonitor(options);

  const monitorQuery = async <T>(
    operationName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    monitor.startOperation(operationName, metadata);

    try {
      const result = await queryFn();
      monitor.endOperation(operationName, true);
      return result;
    } catch (error) {
      monitor.endOperation(
        operationName,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  };

  return {
    ...monitor,
    monitorQuery,
  };
};

// Performance monitoring for user management operations
export const useUserManagementPerformance = () => {
  const monitor = useDatabasePerformanceMonitor({
    enabled:
      process.env.NODE_ENV === 'development' ||
      process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
    onMetricCollected: (metric) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${metric.operationName}: ${metric.duration?.toFixed(2)}ms`, {
          success: metric.success,
          error: metric.error,
          metadata: metric.metadata,
        });
      }

      // Could send to analytics service in production
      // analytics.track('performance_metric', metric);
    },
  });

  const monitorUserCreation = (userCount: number = 1) =>
    monitor.monitorQuery(
      'user_creation',
      async () => {
        // This will be called by the actual operation
      },
      { userCount }
    );

  const monitorBulkUserCreation = (userCount: number) =>
    monitor.monitorQuery(
      'bulk_user_creation',
      async () => {
        // This will be called by the actual operation
      },
      { userCount }
    );

  const monitorPermissionUpdate = (permissionCount: number) =>
    monitor.monitorQuery(
      'permission_update',
      async () => {
        // This will be called by the actual operation
      },
      { permissionCount }
    );

  return {
    ...monitor,
    monitorUserCreation,
    monitorBulkUserCreation,
    monitorPermissionUpdate,
  };
};
