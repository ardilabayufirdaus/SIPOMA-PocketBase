import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon,
  BarChart3Icon,
  GaugeIcon,
  ClockIcon,
  FileTextIcon,
  SettingsIcon,
} from 'lucide-react';

// Import the new aggregated hook
import { useDashboardDataAggregator, type DashboardFilters, type RiskDataEntry } from '../../hooks/useDashboardDataAggregator';

// Import optimized components
import KPICards from '../../components/plant-operations/KPICards';
import FilterSection from '../../components/plant-operations/FilterSection';
import DataVisualization from '../../components/plant-operations/DataVisualization';

// Import components
import ErrorBoundary from '../../components/ErrorBoundary';
import LoadingSkeleton from '../../components/LoadingSkeleton';

// Types
interface TranslationFunction {
  [key: string]: string;
}

interface DashboardKPI {
  id: string;
  title: string;
  value: number | string;
  unit: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'critical';
  target?: number;
}

const PlantOperationsDashboard: React.FC<{ t: TranslationFunction }> = () => {
  // State for filters
  const [filters, setFilters] = useState<DashboardFilters>({
    plantCategory: 'all',
    plantUnit: 'all',
    timeRange: '24h',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Use the new aggregated hook
  const { 
    data,
    stats,
    filteredData,
    isLoading
  } = useDashboardDataAggregator(filters);

  // Destructure only used data for easier access
  const {
    riskData
  } = data;

  // Handle filter changes with useCallback
  const handleFilterChange = useCallback((key: keyof DashboardFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Memoized KPI data to prevent recalculation on every render
  const kpis: DashboardKPI[] = useMemo(() => [
    {
      id: 'total-units',
      title: 'Total Plant Units',
      value: stats.totalUnits,
      unit: 'units',
      trend: { value: 0, isPositive: true },
      icon: <SettingsIcon className="w-6 h-6" />,
      status: 'normal',
    },
    {
      id: 'active-parameters',
      title: 'Active Parameters',
      value: stats.totalParameters,
      unit: 'parameters',
      trend: { value: 5.2, isPositive: true },
      icon: <GaugeIcon className="w-6 h-6" />,
      status: 'normal',
      target: stats.totalParameters,
    },
    {
      id: 'ccr-entries',
      title: "Today's CCR Entries",
      value: stats.todaysCcrEntries,
      unit: 'entries',
      trend: { value: 12.5, isPositive: true },
      icon: <BarChart3Icon className="w-6 h-6" />,
      status: 'normal',
    },
    {
      id: 'active-risks',
      title: 'Active Risks',
      value: stats.activeRisks,
      unit: 'risks',
      trend: { value: -8.3, isPositive: false },
      icon: <AlertTriangleIcon className="w-6 h-6" />,
      status: stats.activeRisks > 5 ? 'warning' : 'normal',
    },
    {
      id: 'silo-utilization',
      title: 'Avg Silo Utilization',
      value: stats.avgSiloUtilization,
      unit: '%',
      trend: { value: 3.2, isPositive: true },
      icon: <ActivityIcon className="w-6 h-6" />,
      status: 'normal',
      target: 85,
    },
    {
      id: 'work-instructions',
      title: 'Work Instructions',
      value: stats.workInstructionsCount,
      unit: 'docs',
      trend: { value: 2.1, isPositive: true },
      icon: <FileTextIcon className="w-6 h-6" />,
      status: 'normal',
    },
    {
      id: 'cop-analysis',
      title: 'COP Analysis Records',
      value: stats.copAnalysisCount,
      unit: 'records',
      trend: { value: 15.4, isPositive: true },
      icon: <TrendingUpIcon className="w-6 h-6" />,
      status: 'normal',
    },
    {
      id: 'system-uptime',
      title: 'System Uptime',
      value: stats.systemUptime,
      unit: '%',
      trend: { value: 0.2, isPositive: true },
      icon: <CheckCircleIcon className="w-6 h-6" />,
      status: 'normal',
      target: 99.5,
    },
  ], [stats]); // Add stats as dependency

  // Memoized filter options to prevent unnecessary recalculations
  const filterOptions = useMemo(() => ({
    uniqueCategories: filteredData.uniqueCategories,
    availableUnits: filteredData.availableUnits,
  }), [filteredData]);

  // Get unique categories for filter (using filteredData from hook)
  const uniqueCategories = filterOptions.uniqueCategories;

  // Get units for selected category (using filteredData from hook)
  const availableUnits = filterOptions.availableUnits;

  // Memoized filtered risk data for display optimization
  const displayRiskData = useMemo(() => 
    riskData.slice(0, 5), [riskData]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Plant Operations Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Real-time monitoring and analytics for plant operations
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Real-time monitoring
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Filters Section */}
              <FilterSection
                filters={filters}
                uniqueCategories={uniqueCategories}
                availableUnits={availableUnits}
                onFilterChange={handleFilterChange}
              />

              {/* KPI Cards */}
              <KPICards kpis={kpis} isLoading={isLoading} />

              {/* Data Visualization */}
              <DataVisualization
                riskData={displayRiskData as RiskDataEntry[]}
                ccrDataLength={data.ccrData.length}
                siloCapacitiesLength={data.siloCapacities.length}
              />
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PlantOperationsDashboard;