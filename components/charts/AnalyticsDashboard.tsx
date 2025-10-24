import React from 'react';
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
  ComposedChart,
} from 'recharts';
import { EnhancedButton, useAccessibility } from '../ui/EnhancedComponents';

interface AnalyticsDashboardProps {
  data: Array<{
    timestamp: string;
    production: number;
    efficiency: number;
    quality: number;
    downtime: number;
    energy: number;
  }>;
  timeRange: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '24h' | '7d' | '30d') => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
  const { announceToScreenReader } = useAccessibility();

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'hours':
        return `${value.toFixed(1)}h`;
      case 'kwh':
        return `${value.toFixed(0)} kWh`;
      default:
        return value.toString();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {formatValue(
                entry.value,
                entry.dataKey === 'energy'
                  ? 'kwh'
                  : entry.dataKey === 'downtime'
                    ? 'hours'
                    : 'percentage'
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Production Analytics
        </h2>
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <EnhancedButton
              key={range}
              variant={timeRange === range ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                onTimeRangeChange(range);
                announceToScreenReader(`Time range changed to ${range}`);
              }}
              ariaLabel={`Select ${range} time range`}
            >
              {range}
            </EnhancedButton>
          ))}
        </div>
      </div>

      {/* Main Production Chart */}
      <div className="glass-card p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Production Overview
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="timestamp" fontSize={12} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="production"
                fill="#ef4444"
                fillOpacity={0.1}
                stroke="#ef4444"
                strokeWidth={2}
                name="Production Rate"
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Efficiency"
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#10b981"
                strokeWidth={2}
                name="Quality Score"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Analysis */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Downtime Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="downtime"
                  fill="#f59e0b"
                  name="Downtime Hours"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Energy Consumption
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Energy (kWh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.length > 0 &&
          (() => {
            const latest = data[data.length - 1];
            const avgProduction =
              data.reduce((sum, item) => sum + item.production, 0) / data.length;
            const avgEfficiency =
              data.reduce((sum, item) => sum + item.efficiency, 0) / data.length;
            const totalDowntime = data.reduce((sum, item) => sum + item.downtime, 0);
            const totalEnergy = data.reduce((sum, item) => sum + item.energy, 0);

            return (
              <>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {avgProduction.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Avg Production</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {avgEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Avg Efficiency</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {totalDowntime.toFixed(1)}h
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Downtime</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {totalEnergy.toFixed(0)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total Energy (kWh)
                  </div>
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
