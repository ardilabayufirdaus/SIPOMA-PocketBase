import React from "react";
import {
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { formatNumber } from "../../utils/formatters";
import {
  PlantOperationsStats,
  DashboardKPI,
} from "../../hooks/usePlantOperationsDashboard";

interface KPIGridProps {
  plantOperationsStats: PlantOperationsStats;
  formatNumber: (num: number) => string;
}

// KPI Card Component dengan React.memo untuk optimasi performa
const KPICard = React.memo<
  DashboardKPI & { formatNumber: (num: number) => string }
>(({ id, title, value, unit, trend, icon, status, target, formatNumber }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`p-2 rounded-lg ${
          status === "good"
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : status === "warning"
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        }`}
      >
        {icon}
      </div>
      <div
        className={`flex items-center gap-1 text-sm ${
          trend.isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {trend.isPositive ? (
          <ArrowTrendingUpIcon className="w-4 h-4" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4" />
        )}
        <span>{formatNumber(trend.value)}</span>
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {formatNumber(value)}
        {unit && <span className="text-lg text-slate-500 ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
        {title}
      </p>
      {target && (
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Target: {formatNumber(target)} {unit}
        </p>
      )}
    </div>
  </div>
));

KPICard.displayName = "KPICard";

const KPIGrid: React.FC<KPIGridProps> = React.memo(
  ({ plantOperationsStats, formatNumber }) => {
    const kpiCards: DashboardKPI[] = React.useMemo(
      () => [
        {
          id: "plant_units",
          title: "Total Plant Units",
          value: plantOperationsStats.totalUnits,
          unit: "units",
          trend: {
            value: plantOperationsStats.totalCategories,
            isPositive: true,
          },
          icon: <CogIcon className="w-5 h-5" />,
          status: plantOperationsStats.totalUnits > 0 ? "good" : "critical",
          target: 1,
        },
        {
          id: "parameters",
          title: "CCR Parameters",
          value: plantOperationsStats.totalParameters,
          unit: "params",
          trend: {
            value: plantOperationsStats.totalCopParameters,
            isPositive: true,
          },
          icon: <ChartBarIcon className="w-5 h-5" />,
          status: plantOperationsStats.totalParameters > 0 ? "good" : "warning",
          target: 10,
        },
        {
          id: "downtime_today",
          title: "Today's Downtime Records",
          value: plantOperationsStats.todayDowntime,
          unit: "records",
          trend: {
            value: plantOperationsStats.openDowntime,
            isPositive: false,
          },
          icon: <ClockIcon className="w-5 h-5" />,
          status:
            plantOperationsStats.todayDowntime === 0
              ? "good"
              : plantOperationsStats.todayDowntime <= 2
              ? "warning"
              : "critical",
          target: 0,
        },
        {
          id: "risk_management",
          title: "Active Risk Records",
          value: plantOperationsStats.inProgressRisks,
          unit: "risks",
          trend: {
            value: plantOperationsStats.identifiedRisks,
            isPositive: false,
          },
          icon: <ShieldCheckIcon className="w-5 h-5" />,
          status:
            plantOperationsStats.inProgressRisks === 0
              ? "good"
              : plantOperationsStats.inProgressRisks <= 2
              ? "warning"
              : "critical",
          target: 0,
        },
        {
          id: "cop_parameters",
          title: "COP Parameters Configured",
          value: plantOperationsStats.totalCopParameters,
          unit: "params",
          trend: {
            value: plantOperationsStats.totalParameters,
            isPositive: true,
          },
          icon: <BeakerIcon className="w-5 h-5" />,
          status:
            plantOperationsStats.totalCopParameters >= 5
              ? "good"
              : plantOperationsStats.totalCopParameters >= 2
              ? "warning"
              : "critical",
          target: 5,
        },
        {
          id: "plant_categories",
          title: "Plant Categories",
          value: plantOperationsStats.totalCategories,
          unit: "categories",
          trend: { value: plantOperationsStats.totalUnits, isPositive: true },
          icon: <BoltIcon className="w-5 h-5" />,
          status:
            plantOperationsStats.totalCategories > 0 ? "good" : "critical",
          target: 1,
        },
      ],
      [plantOperationsStats]
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.id} {...kpi} formatNumber={formatNumber} />
        ))}
      </div>
    );
  }
);

KPIGrid.displayName = "KPIGrid";

export default KPIGrid;
