import React from 'react';
import { PlantOperationsStats } from '../../hooks/usePlantOperationsDashboard';

interface ModuleStatusProps {
  plantOperationsStats: PlantOperationsStats;
}

const ModuleStatus: React.FC<ModuleStatusProps> = React.memo(({ plantOperationsStats }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Module Integration Status
      </h3>

      <div className="space-y-4">
        {[
          {
            module: 'CCR Data Entry',
            status: plantOperationsStats.totalParameters > 0 ? 'active' : 'inactive',
            description: 'Parameter data entry and monitoring',
            data: `${plantOperationsStats.totalParameters} parameters`,
          },
          {
            module: 'Autonomous Data Entry',
            status: plantOperationsStats.totalRiskRecords > 0 ? 'active' : 'inactive',
            description: 'Risk management and downtime tracking',
            data: `${plantOperationsStats.totalRiskRecords} risk records`,
          },
          {
            module: 'COP Analysis',
            status: plantOperationsStats.totalCopParameters > 0 ? 'active' : 'inactive',
            description: 'Cost of production analysis',
            data: `${plantOperationsStats.totalCopParameters} COP parameters`,
          },
          {
            module: 'Master Data Management',
            status: plantOperationsStats.totalUnits > 0 ? 'active' : 'inactive',
            description: 'Plant units and categories',
            data: `${plantOperationsStats.totalUnits} units, ${plantOperationsStats.totalCategories} categories`,
          },
        ].map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{item.module}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{item.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-medium ${
                  item.status === 'active' ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {item.status.toUpperCase()}
              </div>
              <div className="text-xs text-slate-500">{item.data}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ModuleStatus.displayName = 'ModuleStatus';

export default ModuleStatus;
