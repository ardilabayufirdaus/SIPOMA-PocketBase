import React from 'react';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { EnhancedButton, useAccessibility } from '../ui/EnhancedComponents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-800 mb-2">{label}</p>
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
        <h2 className="text-xl font-bold text-slate-800">Production Analytics</h2>
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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Production Overview</h3>
        <div className="h-80">
          <Line
            data={{
              labels: data.map((item) => item.timestamp),
              datasets: [
                {
                  label: 'Production Rate',
                  data: data.map((item) => item.production),
                  borderColor: '#ef4444',
                  backgroundColor: '#ef444420',
                  fill: true,
                  tension: 0.1,
                },
                {
                  label: 'Efficiency',
                  data: data.map((item) => item.efficiency),
                  borderColor: '#3b82f6',
                  backgroundColor: '#3b82f620',
                  tension: 0.1,
                },
                {
                  label: 'Quality Score',
                  data: data.map((item) => item.quality),
                  borderColor: '#10b981',
                  backgroundColor: '#10b98120',
                  tension: 0.1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  titleColor: '#1f2937',
                  bodyColor: '#374151',
                  borderColor: '#d1d5db',
                  borderWidth: 1,
                  cornerRadius: 8,
                  callbacks: {
                    label: (context) => {
                      const value = context.parsed.y;
                      const label = context.dataset.label;
                      if (label === 'Production Rate') {
                        return `${label}: ${value.toFixed(1)}%`;
                      } else if (label === 'Efficiency') {
                        return `${label}: ${value.toFixed(1)}%`;
                      } else {
                        return `${label}: ${value.toFixed(1)}%`;
                      }
                    },
                  },
                },
              },
              scales: {
                x: {
                  display: true,
                  ticks: {
                    font: {
                      size: 12,
                    },
                    color: '#64748b',
                  },
                },
                y: {
                  display: true,
                  ticks: {
                    font: {
                      size: 12,
                    },
                    color: '#64748b',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Analysis */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Downtime Analysis</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: data.map((item) => item.timestamp),
                datasets: [
                  {
                    label: 'Downtime Hours',
                    data: data.map((item) => item.downtime),
                    backgroundColor: '#f59e0b',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#374151',
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                      label: (context) => `Downtime Hours: ${context.parsed.y.toFixed(1)}h`,
                    },
                  },
                },
                scales: {
                  x: {
                    display: true,
                    ticks: {
                      font: {
                        size: 12,
                      },
                      color: '#64748b',
                    },
                  },
                  y: {
                    display: true,
                    ticks: {
                      font: {
                        size: 12,
                      },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Energy Consumption */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Energy Consumption</h3>
          <div className="h-64">
            <Line
              data={{
                labels: data.map((item) => item.timestamp),
                datasets: [
                  {
                    label: 'Energy (kWh)',
                    data: data.map((item) => item.energy),
                    borderColor: '#8b5cf6',
                    backgroundColor: '#8b5cf630',
                    fill: true,
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#374151',
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                      label: (context) => `Energy: ${context.parsed.y.toFixed(0)} kWh`,
                    },
                  },
                },
                scales: {
                  x: {
                    display: true,
                    ticks: {
                      font: {
                        size: 12,
                      },
                      color: '#64748b',
                    },
                  },
                  y: {
                    display: true,
                    ticks: {
                      font: {
                        size: 12,
                      },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
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
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {avgProduction.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600">Avg Production</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {avgEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600">Avg Efficiency</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {totalDowntime.toFixed(1)}h
                  </div>
                  <div className="text-sm text-slate-600">Total Downtime</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {totalEnergy.toFixed(0)}
                  </div>
                  <div className="text-sm text-slate-600">Total Energy (kWh)</div>
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;


