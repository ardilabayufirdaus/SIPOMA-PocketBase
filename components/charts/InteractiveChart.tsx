import React, { useState, useCallback, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Cell,
} from 'recharts';

export interface ChartDataPoint {
  [key: string]: string | number | Date;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: Array<{
    key: string;
    title: string;
    dataKey: string;
  }>;
}

export interface ExportConfig {
  enabled: boolean;
  formats: Array<'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'excel' | 'json'>;
  filename?: string;
}

export interface RealTimeConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxDataPoints: number;
  onDataUpdate?: (newData: ChartDataPoint[]) => void;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'combo';
  title?: string;
  subtitle?: string;
  height?: number;

  // Interactive features
  drillDown?: DrillDownConfig;
  export?: ExportConfig;
  realTime?: RealTimeConfig;

  // Chart configuration
  xAxisKey: string;
  series: Array<{
    key: string;
    name: string;
    type: 'line' | 'bar' | 'area';
    color: string;
    yAxis?: 'left' | 'right';
  }>;

  // Styling
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showBrush?: boolean;

  // Events
  onDataPointClick?: (data: ChartDataPoint, seriesKey: string) => void;
  onChartClick?: (event: React.MouseEvent) => void;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  drillDown,
  export: exportConfig,
  realTime,
  xAxisKey,
  series,
  colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
  showGrid = true,
  showLegend = true,
  showBrush = false,
  onDataPointClick,
  onChartClick,
}) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedData, setSelectedData] = useState<ChartDataPoint | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Real-time data updates
  React.useEffect(() => {
    if (!realTime?.enabled) return;

    const interval = setInterval(() => {
      // Simulate real-time data update
      if (realTime.onDataUpdate) {
        realTime.onDataUpdate(data);
      }
    }, realTime.interval);

    return () => clearInterval(interval);
  }, [realTime, data]);

  // Handle drill down
  const handleDrillDown = useCallback(
    (dataPoint: ChartDataPoint) => {
      if (!drillDown?.enabled || currentLevel >= drillDown.levels.length - 1) return;

      setCurrentLevel((prev) => prev + 1);
      setSelectedData(dataPoint);

      if (onDataPointClick) {
        onDataPointClick(dataPoint, drillDown.levels[currentLevel].key);
      }
    },
    [drillDown, currentLevel, onDataPointClick]
  );

  // Handle drill up
  const handleDrillUp = useCallback(() => {
    if (currentLevel > 0) {
      setCurrentLevel((prev) => prev - 1);
      setSelectedData(null);
    }
  }, [currentLevel]);

  // Export functionality
  const handleExport = useCallback(
    async (format: string) => {
      if (!exportConfig?.enabled) return;

      setIsExporting(true);

      try {
        const filename = exportConfig.filename || `chart_${Date.now()}`;

        switch (format) {
          case 'csv':
            exportToCSV(data, filename);
            break;
          case 'excel':
            await exportToExcel(data, filename);
            break;
          case 'json':
            await exportToJSON(data, filename);
            break;
          case 'png':
          case 'jpg':
          case 'svg':
            exportToImage(format, filename);
            break;
          case 'pdf':
            exportToPDF(filename);
            break;
        }
      } catch (error) {
        // Error handling for export failures
        void error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportConfig, data]
  );

  // Custom tooltip
  const CustomTooltip = useMemo(() => {
    const TooltipComponent = ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{
        name: string;
        value: string | number;
        color: string;
      }>;
      label?: string | number;
    }) => {
      if (!active || !payload || !payload.length) return null;

      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 dark:text-slate-100">{`${xAxisKey}: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}`}
            </p>
          ))}
          {drillDown?.enabled && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click to drill down</p>
          )}
        </div>
      );
    };
    TooltipComponent.displayName = 'CustomTooltip';
    return TooltipComponent;
  }, [xAxisKey, drillDown]);

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    return (
      <ComposedChart {...commonProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} />
        <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={formatNumber} />
        {series.some((s) => s.yAxis === 'right') && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={formatNumber}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}

        {series.map((serie, index) => {
          const color = colors[index % colors.length];
          const yAxisId = serie.yAxis || 'left';

          switch (serie.type) {
            case 'area':
              return (
                <Area
                  key={serie.key}
                  type="monotone"
                  dataKey={serie.key}
                  name={serie.name}
                  stroke={serie.color || color}
                  fill={serie.color || color}
                  fillOpacity={0.3}
                  yAxisId={yAxisId}
                />
              );
            case 'line':
              return (
                <Line
                  key={serie.key}
                  type="monotone"
                  dataKey={serie.key}
                  name={serie.name}
                  stroke={serie.color || color}
                  strokeWidth={2}
                  dot={{ fill: serie.color || color, strokeWidth: 2, r: 4 }}
                  yAxisId={yAxisId}
                />
              );
            case 'bar':
              return (
                <Bar
                  key={serie.key}
                  dataKey={serie.key}
                  name={serie.name}
                  fill={serie.color || color}
                  yAxisId={yAxisId}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={serie.color || colors[idx % colors.length]} />
                  ))}
                </Bar>
              );
            default:
              return null;
          }
        })}

        {showBrush && <Brush dataKey={xAxisKey} height={30} stroke={colors[0]} />}
      </ComposedChart>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Drill down navigation */}
          {drillDown?.enabled && currentLevel > 0 && (
            <button
              onClick={handleDrillUp}
              className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              ← Back
            </button>
          )}

          {/* Real-time indicator */}
          {realTime?.enabled && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Live</span>
            </div>
          )}

          {/* Export dropdown */}
          {exportConfig?.enabled && (
            <div className="relative">
              <select
                onChange={(e) => e.target.value && handleExport(e.target.value)}
                className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md px-3 py-1 border-0"
                disabled={isExporting}
              >
                <option value="">Export...</option>
                {exportConfig.formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Current level indicator */}
      {drillDown?.enabled && (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Level: {drillDown.levels[currentLevel]?.title || 'Overview'}
          {selectedData && (
            <span className="ml-2">
              → {String(selectedData[drillDown.levels[currentLevel - 1]?.dataKey] || '')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function exportToCSV(data: ChartDataPoint[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => row[header]).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

async function exportToExcel(data: ChartDataPoint[], filename: string) {
  const { chartExportService } = await import('../../utils/simplifiedChartExport');
  const headers = Object.keys(data[0] || {});
  return chartExportService.exportAsExcel(data, headers, { filename, format: 'excel' });
}

async function exportToJSON(data: ChartDataPoint[], filename: string) {
  const { chartExportService } = await import('../../utils/simplifiedChartExport');
  return chartExportService.exportAsJSON(data, { filename, format: 'json' });
}

// Image and PDF export would require additional dependencies
// These are placeholder implementations
function exportToImage(format: string, filename: string) {
  // Would require html2canvas or similar
  void format;
  void filename;
}

function exportToPDF(filename: string) {
  // Would require jsPDF or similar
  void filename;
}

export default InteractiveChart;
