import React from "react";

const DashboardLoadingSkeleton: React.FC = React.memo(() => {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-96 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-80 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          {["1h", "4h", "12h", "24h"].map((range) => (
            <div
              key={range}
              className="h-10 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
              </div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Status Skeleton */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">
          Loading Plant Operations data...
        </span>
      </div>
    </div>
  );
});

DashboardLoadingSkeleton.displayName = "DashboardLoadingSkeleton";

export default DashboardLoadingSkeleton;
