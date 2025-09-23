import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3Icon, DatabaseIcon, AlertTriangleIcon } from 'lucide-react';

interface RiskDataEntry {
  id: string;
  risk_description: string;
  status: string;
  created_at: string;
  unit: string;
  category: string;
}

interface DataVisualizationProps {
  riskData: RiskDataEntry[];
  ccrDataLength: number;
  siloCapacitiesLength: number;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  riskData,
  ccrDataLength,
  siloCapacitiesLength,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Risk Data Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Risk Management
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Active risk monitoring and mitigation
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Risks</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {riskData.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {riskData.filter((r) => r.status === 'in_progress').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Identified</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {riskData.filter((r) => r.status === 'identified').length}
            </span>
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <DatabaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Data Overview
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current data status across modules
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">CCR Entries</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {ccrDataLength}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Silo Capacities</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {siloCapacitiesLength}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Work Instructions</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">0</span>
          </div>
        </div>
      </div>

      {/* Placeholder for Charts */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <BarChart3Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Performance Analytics
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Charts and visualizations will be displayed here
            </p>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <BarChart3Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataVisualization;
