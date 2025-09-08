import React, { useEffect, useRef, useState, useCallback } from "react";

interface PerformanceMetrics {
  renderTime: number;
  dataSize: number;
  memoryUsage?: number;
  timestamp: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  sampleSize?: number;
  logToConsole?: boolean;
}

/**
 * Performance monitoring hook for tracking component render performance
 *
 * Usage:
 * const { metrics, startMeasure, endMeasure } = usePerformanceMonitor({
 *   enabled: process.env.NODE_ENV === 'development',
 *   logToConsole: true
 * });
 *
 * // In component:
 * useEffect(() => {
 *   startMeasure('data-processing');
 *   // ... heavy data processing
 *   endMeasure('data-processing', data.length);
 * }, [data]);
 */
export const usePerformanceMonitor = (
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === "development",
    sampleSize = 10,
    logToConsole = false,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const measureStartTimes = useRef<Map<string, number>>(new Map());
  const frameId = useRef<number>();

  // Start performance measurement
  const startMeasure = useCallback(
    (label: string) => {
      if (!enabled) return;

      measureStartTimes.current.set(label, performance.now());

      if (logToConsole) {
        console.time(`🔍 Performance: ${label}`);
      }
    },
    [enabled, logToConsole]
  );

  // End performance measurement
  const endMeasure = useCallback(
    (label: string, dataSize: number = 0) => {
      if (!enabled) return;

      const startTime = measureStartTimes.current.get(label);
      if (!startTime) return;

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Get memory usage if available
      let memoryUsage: number | undefined;
      if ("memory" in performance) {
        memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      const metric: PerformanceMetrics = {
        renderTime,
        dataSize,
        memoryUsage,
        timestamp: Date.now(),
      };

      setMetrics((prev) => {
        const updated = [...prev, metric];
        // Keep only the latest samples
        return updated.slice(-sampleSize);
      });

      if (logToConsole) {
        console.timeEnd(`🔍 Performance: ${label}`);
        console.log(`📊 ${label} Metrics:`, {
          "Render Time": `${renderTime.toFixed(2)}ms`,
          "Data Size": dataSize.toLocaleString(),
          "Memory Usage": memoryUsage ? `${memoryUsage.toFixed(2)}MB` : "N/A",
          "Performance Rating":
            renderTime < 16
              ? "🟢 Excellent"
              : renderTime < 50
              ? "🟡 Good"
              : renderTime < 100
              ? "🟠 Fair"
              : "🔴 Poor",
        });
      }

      measureStartTimes.current.delete(label);
    },
    [enabled, sampleSize, logToConsole]
  );

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (metrics.length === 0) return null;

    const recentMetrics = metrics.slice(-5); // Last 5 measurements
    const avgRenderTime =
      recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) /
      recentMetrics.length;
    const maxRenderTime = Math.max(...recentMetrics.map((m) => m.renderTime));
    const avgDataSize =
      recentMetrics.reduce((sum, m) => sum + m.dataSize, 0) /
      recentMetrics.length;
    const lastMemoryUsage =
      recentMetrics[recentMetrics.length - 1]?.memoryUsage;

    return {
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      avgDataSize: Math.round(avgDataSize),
      memoryUsage: lastMemoryUsage
        ? Number(lastMemoryUsage.toFixed(2))
        : undefined,
      sampleCount: recentMetrics.length,
      performanceRating:
        avgRenderTime < 16
          ? "excellent"
          : avgRenderTime < 50
          ? "good"
          : avgRenderTime < 100
          ? "fair"
          : "poor",
    };
  }, [metrics]);

  // Detect performance issues
  const detectPerformanceIssues = useCallback(() => {
    const summary = getPerformanceSummary();
    if (!summary) return [];

    const issues: string[] = [];

    if (summary.avgRenderTime > 100) {
      issues.push("High average render time detected");
    }

    if (summary.maxRenderTime > 200) {
      issues.push("Very slow render detected");
    }

    if (summary.memoryUsage && summary.memoryUsage > 100) {
      issues.push("High memory usage detected");
    }

    if (summary.avgDataSize > 1000) {
      issues.push("Large dataset may impact performance");
    }

    return issues;
  }, [getPerformanceSummary]);

  // Monitor frame rate
  const [frameRate, setFrameRate] = useState<number>(60);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        // Every second
        setFrameRate(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      frameId.current = requestAnimationFrame(measureFrameRate);
    };

    frameId.current = requestAnimationFrame(measureFrameRate);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
    getPerformanceSummary,
    detectPerformanceIssues,
    frameRate,
    enabled,
  };
};

/**
 * Performance monitoring component for debugging
 */
export const PerformanceMonitor: React.FC<{
  metrics: PerformanceMetrics[];
  summary: ReturnType<typeof usePerformanceMonitor>["getPerformanceSummary"];
  frameRate: number;
  issues: string[];
}> = ({ metrics, summary, frameRate, issues }) => {
  if (!summary) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2 z-50 max-w-xs">
      <div className="font-bold">⚡ Performance Monitor</div>

      <div className="space-y-1">
        <div>Avg Render: {summary.avgRenderTime}ms</div>
        <div>Max Render: {summary.maxRenderTime}ms</div>
        <div>Frame Rate: {frameRate}fps</div>
        {summary.memoryUsage && <div>Memory: {summary.memoryUsage}MB</div>}
        <div>Data Size: {summary.avgDataSize.toLocaleString()}</div>
      </div>

      <div
        className={`px-2 py-1 rounded text-center ${
          summary.performanceRating === "excellent"
            ? "bg-green-600"
            : summary.performanceRating === "good"
            ? "bg-yellow-600"
            : summary.performanceRating === "fair"
            ? "bg-orange-600"
            : "bg-red-600"
        }`}
      >
        {summary.performanceRating.toUpperCase()}
      </div>

      {issues.length > 0 && (
        <div className="space-y-1">
          <div className="font-bold text-red-400">⚠️ Issues:</div>
          {issues.map((issue, i) => (
            <div key={i} className="text-red-300 text-xs">
              {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
