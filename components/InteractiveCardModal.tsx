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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
                {data.description && (
                  <p className="mt-1 text-sm text-gray-600">{data.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Metrics Grid */}
              {data.metrics && data.metrics.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.metrics.map((metric, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-gray-600">{metric.label}</div>
                        <div className="flex items-baseline space-x-1 mt-1">
                          <div className="text-lg font-semibold text-gray-900">
                            {typeof metric.value === 'string' || typeof metric.value === 'number'
                              ? String(metric.value)
                              : '[Invalid Value]'}
                          </div>
                          {metric.unit && (
                            <div className="text-xs text-gray-500">{metric.unit}</div>
                          )}
                        </div>
                        {metric.trend && (
                          <div className="flex items-center mt-1">
                            <span
                              className={`text-xs font-medium ${
                                metric.trend.isPositive ? 'text-green-600' : 'text-blue-600'
                              }`}
                            >
                              metric.trend.value
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
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Trend Analysis</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="h-64">{renderChart()}</div>
                  </div>
                </div>
              )}

              {/* Details List */}
              {data.details && data.details.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Information</h4>
                  <div className="space-y-2">
                    {data.details.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-600">{detail.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {typeof detail.value === 'string' || typeof detail.value === 'number'
                              ? String(detail.value)
                              : '[Invalid Value]'}
                          </span>
                          {detail.status && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                detail.status === 'good'
                                  ? 'bg-green-500'
                                  : detail.status === 'warning'
                                    ? 'bg-yellow-500'
                                    : detail.status === 'critical'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
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
          </div>

          {/* Actions */}
          {data.actions && data.actions.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-3">
              {data.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    action.variant === 'primary'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : action.variant === 'danger'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


