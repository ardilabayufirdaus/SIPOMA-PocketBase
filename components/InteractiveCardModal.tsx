import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

    const commonProps = {
      data: data.chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (data.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15 23 42)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {Object.keys(data.chartData[0] || {})
              .filter((key) => key !== 'name')
              .map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15 23 42)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {Object.keys(data.chartData[0] || {})
              .filter((key) => key !== 'name')
              .map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15 23 42)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            {Object.keys(data.chartData[0] || {})
              .filter((key) => key !== 'name')
              .map((key, index) => (
                <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(1)}%`}
            >
              {data.chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
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
        <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.title}
                </h3>
                {data.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {data.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-slate-900 px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Metrics Grid */}
              {data.metrics && data.metrics.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Key Metrics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.metrics.map((metric, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {metric.label}
                        </div>
                        <div className="flex items-baseline space-x-1 mt-1">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {typeof metric.value === 'string' || typeof metric.value === 'number'
                              ? String(metric.value)
                              : '[Invalid Value]'}
                          </div>
                          {metric.unit && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {metric.unit}
                            </div>
                          )}
                        </div>
                        {metric.trend && (
                          <div className="flex items-center mt-1">
                            <span
                              className={`text-xs font-medium ${
                                metric.trend.isPositive
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
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
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Trend Analysis
                  </h4>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Details List */}
              {data.details && data.details.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Detailed Information
                  </h4>
                  <div className="space-y-2">
                    {data.details.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {detail.label}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
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
            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 flex flex-wrap gap-3">
              {data.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    action.variant === 'primary'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : action.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
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


