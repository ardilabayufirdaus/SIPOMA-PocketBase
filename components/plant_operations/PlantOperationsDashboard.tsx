import React, { lazy, Suspense } from 'react';
import { formatNumber } from '../../utils/formatters';
// import { usePlantOperationsDashboard } from "../../hooks/usePlantOperationsDashboard";
import { useCopAnalysisData } from '../../hooks/useCopAnalysisData';
import KPIGrid from './KPIGrid';
import ChartSection from './ChartSection';
import SummarySection from './SummarySection';
import ModuleStatus from './ModuleStatus';
import DashboardLoadingSkeleton from './DashboardLoadingSkeleton';

interface PlantOperationsDashboardProps {
  t: any;
  plantData?: any;
}

const PlantOperationsDashboard: React.FC<PlantOperationsDashboardProps> = React.memo(
  ({ t, plantData }) => {
    // Mock data for now
    const stats = {
      totalUnits: 5,
      totalCategories: 3,
      totalParameters: 25,
      totalCopParameters: 5,
      totalDowntimeRecords: 12,
      todayDowntime: 2,
      openDowntime: 1,
      totalRiskRecords: 8,
      inProgressRisks: 3,
      identifiedRisks: 5,
      totalCopAnalysisRecords: 15,
      averageCopValue: 85.5,
    };

    const kpis = [
      {
        id: 'efficiency',
        title: 'Efficiency',
        value: 85,
        unit: '%',
        trend: { direction: 'up' as const, percentage: 5 },
      },
    ];

    const alerts = [];
    const machines = [];
    const isLoading = false;

    const timeRange = '24h';
    const selectedMetric = 'efficiency';
    const plantOperationsStats = stats;
    const realPlantOperationsData = [];

    const handleTimeRangeChange = (range: string) => {};
    const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {};

    const { data: copAnalysisData } = useCopAnalysisData();

    // Show loading state with skeleton
    if (isLoading) {
      return <DashboardLoadingSkeleton />;
    }

    return (
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t.plant_operations_dashboard || 'Plant Operations Dashboard'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Monitor dan analisis Plant Operations berdasarkan data CCR, Autonomous, COP, dan
              Master Data
            </p>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <KPIGrid plantOperationsStats={plantOperationsStats} formatNumber={formatNumber} />

        {/* Main Chart Section */}
        <ChartSection
          realPlantOperationsData={realPlantOperationsData}
          selectedMetric={selectedMetric}
          timeRange={timeRange}
          onMetricChange={handleMetricChange}
          onTimeRangeChange={handleTimeRangeChange}
          copAnalysisData={copAnalysisData}
        />

        {/* Performance Summary */}
        <SummarySection plantOperationsStats={plantOperationsStats} />

        {/* Module Integration Status */}
        <ModuleStatus plantOperationsStats={plantOperationsStats} />
      </div>
    );
  }
);

PlantOperationsDashboard.displayName = 'PlantOperationsDashboard';

export default PlantOperationsDashboard;
