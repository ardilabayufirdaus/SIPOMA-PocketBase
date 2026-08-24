import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface BreakdownData {
  title: string;
  description?: string;
  metrics?: Array<{
    label: string;
    value: string | number;
    unit?: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }>;
  chartData?: Array<Record<string, any>>;
  chartType?: 'line' | 'area' | 'bar' | 'pie';
  details?: Array<{
    label: string;
    value: string | number;
    status?: 'good' | 'warning' | 'critical' | 'neutral';
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

interface InteractiveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BreakdownData;
}

const CHART_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const InteractiveCardModal: React.FC<InteractiveCardModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderChart = () => {
    if (!data.chartData || data.chartData.length === 0) return null;

    const labels = data.chartData.map((item) => item.name || item.label || item.x || item.key);
    const dataKeys = Object.keys(data.chartData[0] || {}).filter(
      (key) => key !== 'name' && key !== 'label' && key !== 'x' && key !== 'key'
    );

    const chartData = {
      labels,
      datasets: dataKeys.map((key, index) => ({
        label: key,
        data: data.chartData.map((item) => item[key]),
        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
        borderColor: CHART_COLORS[index % CHART_COLORS.length],
        borderWidth: 2,
        fill: data.chartType === 'area',
      })),
    };

    const commonOptions = {
      responsive: true,
      animation: false as const,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        tooltip: {
          backgroundColor: 'rgb(15 23 42)',
          borderColor: 'rgb(51 65 85)',
          borderWidth: 1,
          cornerRadius: 8,
          titleColor: 'white',
          bodyColor: 'white',
        },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            font: {
              size: 12,
            },
          },
        },
        y: {
          display: true,
          ticks: {
            font: {
              size: 12,
            },
          },
        },
      },
    };

    switch (data.chartType) {
      case 'line':
        return <Line data={chartData} options={commonOptions} />;

      case 'area':
        return (
          <Line
            data={{
              ...chartData,
              datasets: chartData.datasets.map((dataset) => ({
                ...dataset,
                fill: true,
                backgroundColor: dataset.backgroundColor + '40', // Add transparency
              })),
            }}
            options={commonOptions}
          />
        );

      case 'bar':
        return <Bar data={chartData} options={commonOptions} />;

      case 'pie':
        return (
          <Pie
            data={{
              labels: data.chartData.map((item) => item.name || item.label),
              datasets: [
                {
                  data: data.chartData.map((item) => item.value),
                  backgroundColor: CHART_COLORS,
                  borderColor: CHART_COLORS,
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              animation: false as const,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top' as const,
                },
                tooltip: {
                  backgroundColor: 'rgb(15 23 42)',
                  borderColor: 'rgb(51 65 85)',
                  borderWidth: 1,
                  cornerRadius: 8,
                  titleColor: 'white',
                  bodyColor: 'white',
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interactive-card-title"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all flex flex-col max-h-[90vh] z-10"
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div>
            <h3
              id="interactive-card-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {data.title}
            </h3>
            {data.description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
            aria-label="Tutup dialog"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 space-y-6">
          {/* Metrics Grid */}
          {data.metrics && data.metrics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Key Metrics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {metric.label}
                    </div>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {typeof metric.value === 'string' || typeof metric.value === 'number'
                          ? String(metric.value)
                          : '[Invalid Value]'}
                      </div>
                      {metric.unit && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {metric.unit}
                        </div>
                      )}
                    </div>
                    {metric.trend && (
                      <div className="flex items-center mt-1">
                        <span
                          className={`text-xs font-medium ${
                            metric.trend.isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {metric.trend.value > 0 ? `+${metric.trend.value}` : metric.trend.value}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {data.chartData && data.chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Trend Analysis
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="h-64">{renderChart()}</div>
              </div>
            </div>
          )}

          {/* Details List */}
          {data.details && data.details.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Detailed Information
              </h4>
              <div className="space-y-2">
                {data.details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {detail.label}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {typeof detail.value === 'string' || typeof detail.value === 'number'
                          ? String(detail.value)
                          : '[Invalid Value]'}
                      </span>
                      {detail.status && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            detail.status === 'good'
                              ? 'bg-emerald-500'
                              : detail.status === 'warning'
                                ? 'bg-amber-500'
                                : detail.status === 'critical'
                                  ? 'bg-red-500'
                                  : 'bg-slate-400'
                          }`}
                        ></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {data.actions && data.actions.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 shrink-0">
            {data.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  action.variant === 'primary'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20'
                    : action.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
                      : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
