import React, { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface VirtualizedChartProps {
  data: any[];
  height?: number;
  windowSize?: number;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
  }>;
  xAxisKey: string;
}

/**
 * Virtualized Chart Component for Large Datasets
 *
 * Performance optimizations:
 * - Only renders visible data points to reduce DOM nodes
 * - Implements data windowing for massive datasets
 * - Reduces memory footprint and improves rendering speed
 * - Maintains smooth scrolling and interaction
 */
const VirtualizedChart: React.FC<VirtualizedChartProps> = ({
  data,
  height = 300,
  windowSize = 100,
  lines,
  xAxisKey,
}) => {
  const [currentWindow, setCurrentWindow] = useState(0);

  // Calculate total windows needed
  const totalWindows = Math.ceil(data.length / windowSize);

  // Get current window data - only process what's visible
  const windowData = useMemo(() => {
    const start = currentWindow * windowSize;
    const end = Math.min(start + windowSize, data.length);
    return data.slice(start, end);
  }, [data, currentWindow, windowSize]);

  // Navigation handlers
  const handlePrevWindow = useCallback(() => {
    setCurrentWindow((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextWindow = useCallback(() => {
    setCurrentWindow((prev) => Math.min(totalWindows - 1, prev + 1));
  }, [totalWindows]);

  const handleWindowChange = useCallback(
    (windowIndex: number) => {
      setCurrentWindow(Math.max(0, Math.min(totalWindows - 1, windowIndex)));
    },
    [totalWindows]
  );

  // Performance metrics
  const startIndex = currentWindow * windowSize;
  const endIndex = Math.min(startIndex + windowSize, data.length);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // For small datasets, render normally without virtualization
  if (data.length <= windowSize) {
    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip />
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                name={line.name || line.dataKey}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={windowData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name || line.dataKey}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWindow}
            disabled={currentWindow === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          <button
            onClick={handleNextWindow}
            disabled={currentWindow === totalWindows - 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-{endIndex} of {data.length} points
          </span>
          <span>|</span>
          <span>
            Window {currentWindow + 1} of {totalWindows}
          </span>
        </div>

        {/* Window selector for quick navigation */}
        <select
          value={currentWindow}
          onChange={(e) => handleWindowChange(parseInt(e.target.value))}
          className="px-2 py-1 border rounded text-sm"
        >
          {Array.from({ length: totalWindows }, (_, i) => (
            <option key={i} value={i}>
              Window {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Performance indicator */}
      <div className="text-xs text-gray-500 text-center">
        🚀 Virtualized rendering for optimal performance with{" "}
        {data.length.toLocaleString()} data points
      </div>
    </div>
  );
};

export default VirtualizedChart;
