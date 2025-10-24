import React from 'react';
import { useServiceWorker, useCacheStatus } from '../hooks/useServiceWorker';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { getColor, getSpacing, getBorderRadius } from '../../utils/designTokens';

// Performance dashboard component
export const PerformanceDashboard: React.FC = () => {
  const { metrics, memorySnapshots, detectMemoryLeaks, getPerformanceRecommendations } =
    usePerformanceMonitoring();
  const { isOnline } = useServiceWorker();
  const cacheStatus = useCacheStatus();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    return ms.toFixed(2) + 'ms';
  };

  const recommendations = getPerformanceRecommendations();
  const hasMemoryLeak = detectMemoryLeaks();

  return (
    <div className="performance-dashboard bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Performance Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          {hasMemoryLeak && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-medium">Memory Leak Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: getColor('primary', 50),
            borderRadius: getBorderRadius('lg'),
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: getColor('primary', 800) }}>
            LCP
          </h3>
          <p
            className={`text-2xl font-bold ${
              metrics.lcp > 2500 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatTime(metrics.lcp)}
          </p>
          <p className="text-sm text-gray-600">Largest Contentful Paint</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">FID</h3>
          <p
            className={`text-2xl font-bold ${
              metrics.fid > 100 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatTime(metrics.fid)}
          </p>
          <p className="text-sm text-gray-600">First Input Delay</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">CLS</h3>
          <p
            className={`text-2xl font-bold ${
              metrics.cls > 0.1 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {metrics.cls.toFixed(3)}
          </p>
          <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
        </div>
      </div>

      {/* Memory Usage */}
      <div
        className="p-4 rounded-lg mb-6"
        style={{
          backgroundColor: getColor('neutral', 50),
          borderRadius: getBorderRadius('lg'),
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: getColor('neutral', 800) }}>
          Memory Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Heap Used</p>
            <p className="text-xl font-bold" style={{ color: getColor('primary', 600) }}>
              {formatBytes(metrics.memoryUsage)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Heap Limit</p>
            <p className="text-xl font-bold text-gray-600">{formatBytes(metrics.memoryLimit)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div
            className="w-full rounded-full h-2"
            style={{ backgroundColor: getColor('neutral', 200) }}
          >
            <div
              className="h-2 rounded-full"
              style={{
                backgroundColor: getColor('primary', 600),
                width: `${
                  metrics.memoryLimit > 0 ? (metrics.memoryUsage / metrics.memoryLimit) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Cache Status */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Cache Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">API Cache</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatBytes(cacheStatus.apiCacheSize)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Static Cache</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatBytes(cacheStatus.staticCacheSize)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Cache</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatBytes(cacheStatus.totalCacheSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Performance Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
