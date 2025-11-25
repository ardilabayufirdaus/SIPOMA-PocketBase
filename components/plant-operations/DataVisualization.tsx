import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3Icon, DatabaseIcon, AlertTriangleIcon } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RiskDataEntry {
  id: string;
  risk_description: string;
  status: string;
  created_at: string;
  unit: string;
  category: string;
}

interface AvailabilityData {
  unit: string;
  category: string;
  runningHours: number;
  downtimeHours: number;
}

interface DataVisualizationProps {
  riskData: RiskDataEntry[];
  ccrDataLength: number;
  siloCapacitiesLength: number;
  availabilityData: AvailabilityData[];
  timeRange: 'daily' | 'monthly';
  month?: number;
  year?: number;
  date?: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  riskData,
  ccrDataLength,
  siloCapacitiesLength,
  availabilityData,
  timeRange,
  month,
  year,
  date,
}) => {
  // Prepare chart data
  const chartData = availabilityData.map((item) => {
    const totalHours =
      timeRange === 'daily'
        ? 24
        : new Date(
            year || new Date().getFullYear(),
            month || new Date().getMonth() + 1,
            0
          ).getDate() * 24;
    const availability = ((item.runningHours - item.downtimeHours) / totalHours) * 100;
    return {
      unit: item.unit,
      availability: Math.max(0, Math.min(100, availability)), // Clamp between 0-100
      runningHours: item.runningHours,
      downtimeHours: item.downtimeHours,
      totalHours: totalHours,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Risk Data Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangleIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Risk Management</h3>
            <p className="text-sm text-slate-600">Active risk monitoring and mitigation</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total Risks</span>
            <span className="font-semibold text-slate-900">{riskData.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">In Progress</span>
            <span className="font-semibold text-slate-900">
              {riskData.filter((r) => r.status === 'in_progress').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Identified</span>
            <span className="font-semibold text-slate-900">
              {riskData.filter((r) => r.status === 'identified').length}
            </span>
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <DatabaseIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Data Overview</h3>
            <p className="text-sm text-slate-600">Current data status across modules</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">CCR Entries</span>
            <span className="font-semibold text-slate-900">{ccrDataLength}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Silo Capacities</span>
            <span className="font-semibold text-slate-900">{siloCapacitiesLength}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Work Instructions</span>
            <span className="font-semibold text-slate-900">0</span>
          </div>
        </div>
      </div>

      {/* Availability Chart */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <BarChart3Icon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Plant Availability Chart</h3>
            <p className="text-sm text-slate-600">
              {timeRange === 'daily'
                ? `Daily availability by unit (${date || 'today'})`
                : `Monthly running hours by unit (${new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})`}
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80">
            <Bar
              data={{
                labels: chartData.map((item) => item.unit),
                datasets: [
                  {
                    label: timeRange === 'daily' ? 'Availability (%)' : 'Running Hours (jam)',
                    data: chartData.map((item) =>
                      timeRange === 'daily' ? item.availability : item.runningHours
                    ),
                    backgroundColor: chartData.map((item) => {
                      if (timeRange === 'daily') {
                        return item.availability >= 95
                          ? '#10b981'
                          : item.availability >= 90
                            ? '#f59e0b'
                            : '#ef4444';
                      } else {
                        return item.runningHours >= item.totalHours * 0.95
                          ? '#10b981'
                          : item.runningHours >= item.totalHours * 0.9
                            ? '#f59e0b'
                            : '#ef4444';
                      }
                    }),
                    borderColor: chartData.map((item) => {
                      if (timeRange === 'daily') {
                        return item.availability >= 95
                          ? '#10b981'
                          : item.availability >= 90
                            ? '#f59e0b'
                            : '#ef4444';
                      } else {
                        return item.runningHours >= item.totalHours * 0.95
                          ? '#10b981'
                          : item.runningHours >= item.totalHours * 0.9
                            ? '#f59e0b'
                            : '#ef4444';
                      }
                    }),
                    borderWidth: 1,
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
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed.y;
                        if (timeRange === 'daily') {
                          return `Availability: ${value.toFixed(1)}%`;
                        } else {
                          return `Running Hours: ${value.toFixed(1)}h`;
                        }
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: false,
                    },
                    ticks: {
                      maxRotation: 0,
                      minRotation: 0,
                    },
                  },
                  y: {
                    display: true,
                    title: {
                      display: true,
                      text: timeRange === 'daily' ? 'Availability (%)' : 'Running Hours (jam)',
                    },
                    beginAtZero: true,
                    max: timeRange === 'daily' ? 100 : undefined,
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg">
            <div className="text-center text-slate-500">
              <BarChart3Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No availability data available</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DataVisualization;


