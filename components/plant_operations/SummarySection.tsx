import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { PlantOperationsStats } from '../../hooks/usePlantOperationsDashboard';

interface SummarySectionProps {
  plantOperationsStats: PlantOperationsStats;
}

const SummarySection: React.FC<SummarySectionProps> = React.memo(({ plantOperationsStats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Plant Operations Summary */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <DocumentIcon className="w-5 h-5 text-slate-600" />
          Plant Operations Summary
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {plantOperationsStats.totalDowntimeRecords}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Downtime Records
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {plantOperationsStats.totalRiskRecords}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Risk Records</div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
              Status Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Open Downtime</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {plantOperationsStats.openDowntime}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  In Progress Risks
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {plantOperationsStats.inProgressRisks}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Identified Risks</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {plantOperationsStats.identifiedRisks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Overview */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Data Source Overview
        </h3>

        <div className="space-y-4">
          {[
            {
              label: 'CCR Parameter Data',
              value: plantOperationsStats.totalParameters,
              description: 'Parameters configured for monitoring',
              color: 'blue',
            },
            {
              label: 'COP Analysis Parameters',
              value: plantOperationsStats.totalCopParameters,
              description: 'Parameters used in COP analysis',
              color: 'green',
            },
            {
              label: 'Plant Master Data',
              value: plantOperationsStats.totalUnits,
              description: 'Units defined in master data',
              color: 'purple',
            },
            {
              label: 'Work Instructions',
              value: plantOperationsStats.totalCategories,
              description: 'Categories for work procedures',
              color: 'orange',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    item.color === 'blue'
                      ? 'bg-blue-500'
                      : item.color === 'green'
                        ? 'bg-green-500'
                        : item.color === 'purple'
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                  }`}
                ></div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SummarySection.displayName = 'SummarySection';

export default SummarySection;
