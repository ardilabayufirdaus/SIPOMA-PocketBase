import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { GroupReport } from '../../domain/entities/whatsapp';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WhatsAppGroupReportProps {
  groupId: string;
  onGenerateReport: (groupId: string, type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  reports: GroupReport[];
  isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const WhatsAppGroupReport: React.FC<WhatsAppGroupReportProps> = ({
  groupId,
  onGenerateReport,
  reports,
  isLoading = false,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'weekly' | 'monthly'>(
    'weekly'
  );

  const handleGenerateReport = async () => {
    await onGenerateReport(groupId, selectedReportType);
  };

  const latestReport = reports[0]; // Assuming reports are sorted by date desc

  return (
    <div className="w-full space-y-6">
      {/* Report Generation Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
        <div className="flex gap-4 items-center">
          <select
            value={selectedReportType}
            onChange={(e) =>
              setSelectedReportType(e.target.value as 'daily' | 'weekly' | 'monthly')
            }
            className="px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Display */}
      {latestReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-500">Total Messages</h4>
              <p className="text-2xl font-bold text-blue-600">
                {latestReport.metrics.totalMessages}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-500">Active Members</h4>
              <p className="text-2xl font-bold text-green-600">
                {latestReport.metrics.activeMembers}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-500">Engagement Rate</h4>
              <p className="text-2xl font-bold text-primary-600">
                {(latestReport.metrics.engagementRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-500">Report Period</h4>
              <p className="text-sm font-medium text-gray-700">
                {latestReport.period.startDate.toLocaleDateString()} -{' '}
                {latestReport.period.endDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Message Types Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Message Types Distribution</h3>
            <div style={{ height: '300px' }}>
              <Pie
                data={{
                  labels: Object.keys(latestReport.metrics.messageTypes),
                  datasets: [
                    {
                      data: Object.values(latestReport.metrics.messageTypes),
                      backgroundColor: COLORS,
                      borderColor: COLORS,
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
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.parsed;
                          const total = context.dataset.data.reduce(
                            (a: number, b: number) => a + b,
                            0
                          );
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
            <div className="space-y-3">
              {latestReport.metrics.topContributors.slice(0, 10).map((contributor, index) => (
                <div
                  key={contributor.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{contributor.name}</span>
                  </div>
                  <span className="text-gray-600">{contributor.messageCount} messages</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report History */}
      {reports.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Report History</h3>
          <div className="space-y-2">
            {reports.slice(1).map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <span className="font-medium capitalize">{report.reportType} Report</span>
                  <span className="text-gray-500 ml-2">
                    {report.period.startDate.toLocaleDateString()} -{' '}
                    {report.period.endDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{report.metrics.totalMessages} messages</p>
                  <p className="text-xs text-gray-500">
                    Generated: {report.generatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
