import { useState, useMemo } from "react";
import {
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  BeakerIcon,
  BoltIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CogIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { formatNumber } from "../../utils/formatters";
import ComboChart from "../charts/ComboChart";
import useCcrDowntimeData from "../../hooks/useCcrDowntimeData";
import { useAutonomousRiskData } from "../../hooks/useAutonomousRiskData";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useCopParametersSupabase } from "../../hooks/useCopParametersSupabase";
import { useCcrParameterData } from "../../hooks/useCcrParameterData";

interface DashboardKPI {
  id: string;
  title: string;
  value: number;
  unit: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  status: "good" | "warning" | "critical";
  target?: number;
}

interface ProductionMetrics {
  efficiency: number;
  quality: number;
  availability: number;
  performance: number;
  oee: number;
  throughput: number;
  downtime: number;
  scrapRate: number;
}

interface ProductionMetrics {
  efficiency: number;
  quality: number;
  availability: number;
  performance: number;
  oee: number;
  throughput: number;
  downtime: number;
  scrapRate: number;
}

interface PlantOperationsDashboardProps {
  t: any;
  plantData?: any;
}

const PlantOperationsDashboard: React.FC<PlantOperationsDashboardProps> = ({
  t,
  plantData,
}) => {
  const [timeRange, setTimeRange] = useState<"1h" | "4h" | "12h" | "24h">("4h");
  const [selectedMetric, setSelectedMetric] = useState<string>("oee");

  // Data hooks untuk Plant Operations modules
  const { getAllDowntime, loading: downtimeLoading } = useCcrDowntimeData();
  const { records: riskRecords, loading: riskLoading } = useAutonomousRiskData();
  const { records: plantUnits, loading: unitsLoading } = usePlantUnits();
  const { records: parameterSettings, loading: parametersLoading } = useParameterSettings();
  const { copParameterIds, loading: copLoading } = useCopParametersSupabase();
  const { getDataForDate } = useCcrParameterData();

  // Get real data dari Plant Operations modules
  const downtimeData = useMemo(() => getAllDowntime(), [getAllDowntime]);
  const currentTime = new Date();
  const today = currentTime.toISOString().split('T')[0];

  // Plant Operations statistics
  const plantOperationsStats = useMemo(() => {
    // Statistics from different modules
    const totalUnits = plantUnits.length;
    const totalCategories = [...new Set(plantUnits.map(u => u.category))].length;
    const totalParameters = parameterSettings.length;
    const totalCopParameters = copParameterIds.length;
    
    // Downtime statistics
    const totalDowntimeRecords = downtimeData.length;
    const todayDowntime = downtimeData.filter(d => d.date === today).length;
    const openDowntime = downtimeData.filter(d => d.status === 'Open').length;
    
    // Risk statistics  
    const totalRiskRecords = riskRecords.length;
    const inProgressRisks = riskRecords.filter(r => r.status === 'In Progress').length;
    const identifiedRisks = riskRecords.filter(r => r.status === 'Identified').length;

    return {
      totalUnits,
      totalCategories,
      totalParameters,
      totalCopParameters,
      totalDowntimeRecords,
      todayDowntime,
      openDowntime,
      totalRiskRecords,
      inProgressRisks,
      identifiedRisks,
    };
  }, [plantUnits, parameterSettings, copParameterIds, downtimeData, riskRecords, today]);

  // Simulated production data based on Plant Operations
  const realProductionData = useMemo(() => {
    // Generate data for last 24 hours based on Plant Operations
    return Array.from({ length: 24 }, (_, index) => {
      const time = new Date(currentTime.getTime() - (24 - index) * 60 * 60 * 1000);
      
      // Base values influenced by plant operations data
      const baseEfficiency = 85 - (plantOperationsStats.openDowntime * 5);
      const efficiency = Math.max(60, Math.min(100, baseEfficiency + Math.random() * 10));
      
      const quality = 95 + Math.random() * 5;
      const availability = 90 - (plantOperationsStats.inProgressRisks * 3) + Math.random() * 8;
      const oee = (efficiency * quality * availability) / 10000;
      
      const production = efficiency * 1.5; // Simulated production based on efficiency
      
      return {
        timestamp: time.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        production,
        efficiency,
        quality,
        availability,
        oee,
        throughput: production,
        downtime: plantOperationsStats.todayDowntime * 0.5 + Math.random() * 2,
        temperature: 75 + Math.random() * 10,
        pressure: 2.5 + Math.random() * 0.5,
      };
    });
  }, [currentTime, plantOperationsStats]);

  const kpiCards: DashboardKPI[] = useMemo(
    () => [
      {
        id: "plant_units",
        title: "Total Plant Units",
        value: plantOperationsStats.totalUnits,
        unit: "units",
        trend: { value: 0, isPositive: true },
        icon: <CogIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalUnits > 0 ? "good" : "critical",
        target: 1,
      },
      {
        id: "parameters",
        title: "CCR Parameters",
        value: plantOperationsStats.totalParameters,
        unit: "params",
        trend: { value: plantOperationsStats.totalCopParameters, isPositive: true },
        icon: <ChartBarIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalParameters > 0 ? "good" : "warning",
        target: 10,
      },
      {
        id: "downtime_today",
        title: "Today's Downtime Records",
        value: plantOperationsStats.todayDowntime,
        unit: "records",
        trend: { value: plantOperationsStats.openDowntime, isPositive: false },
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
        trend: { value: plantOperationsStats.identifiedRisks, isPositive: false },
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
        trend: { value: 2.5, isPositive: true },
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
        trend: { value: 1.0, isPositive: true },
        icon: <BoltIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalCategories > 0 ? "good" : "critical",
        target: 1,
      },
    ],
    [plantOperationsStats]
  );

  const chartData = useMemo(() => {
    return realProductionData.map((item) => ({
      timestamp: item.timestamp,
      [selectedMetric]: item[selectedMetric as keyof typeof item],
    }));
  }, [realProductionData, selectedMetric]);
    () => [
      {
        id: "plant_units",
        title: "Total Plant Units",
        value: plantOperationsStats.totalUnits,
        unit: "units",
        trend: { value: 0, isPositive: true },
        icon: <CogIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalUnits > 0 ? "good" : "critical",
        target: 1,
      },
      {
        id: "parameters",
        title: "CCR Parameters",
        value: plantOperationsStats.totalParameters,
        unit: "params",
        trend: { value: plantOperationsStats.totalCopParameters, isPositive: true },
        icon: <ChartBarIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalParameters > 0 ? "good" : "warning",
        target: 10,
      },
      {
        id: "downtime_today",
        title: "Today's Downtime Records",
        value: plantOperationsStats.todayDowntime,
        unit: "records",
        trend: { value: plantOperationsStats.openDowntime, isPositive: false },
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
        trend: { value: plantOperationsStats.identifiedRisks, isPositive: false },
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
        trend: { value: 2.5, isPositive: true },
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
        trend: { value: 1.0, isPositive: true },
        icon: <BoltIcon className="w-5 h-5" />,
        status: plantOperationsStats.totalCategories > 0 ? "good" : "critical",
        target: 1,
      },
    ],
    [plantOperationsStats]
  );

  const chartData = useMemo(() => {
    return realProductionData.map((item) => ({
      timestamp: item.timestamp,
      [selectedMetric]: item[selectedMetric as keyof typeof item],
    }));
  }, [realProductionData, selectedMetric]);

  // Show loading state
  if (downtimeLoading || riskLoading || unitsLoading || parametersLoading || copLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">
          Loading dashboard data...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t.plant_operations_dashboard || "Plant Operations Dashboard"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor dan analisis performa operasi pabrik secara real-time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1h", "4h", "12h", "24h"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => setSelectedMetric(kpi.id)}
            className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105 ${
              kpi.status === "good"
                ? "border-green-200 dark:border-green-800 ring-1 ring-green-200 dark:ring-green-800"
                : kpi.status === "warning"
                ? "border-yellow-200 dark:border-yellow-800 ring-1 ring-yellow-200 dark:ring-yellow-800"
                : "border-red-200 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-lg ${
                  kpi.status === "good"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : kpi.status === "warning"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}
              >
                {kpi.icon}
              </div>
              {kpi.trend && (
                <div
                  className={`flex items-center text-sm font-medium ${
                    kpi.trend.isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {kpi.trend.isPositive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {kpi.trend.value}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                {kpi.title}
              </h3>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {typeof kpi.value === "number"
                    ? formatNumber(kpi.value)
                    : kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {kpi.unit}
                  </span>
                )}
              </div>
              {kpi.target && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Target: {kpi.target}
                  {kpi.unit}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Production Performance Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Production Performance Trends
            </h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="oee">OEE (%)</option>
              <option value="efficiency">Efficiency (%)</option>
              <option value="quality">Quality (%)</option>
              <option value="availability">Availability (%)</option>
              <option value="throughput">Throughput (units/h)</option>
              <option value="downtime">Downtime (hours)</option>
            </select>
          </div>

          <div className="h-80">
            <ComboChart
              data={chartData}
              lines={[
                {
                  dataKey: selectedMetric,
                  stroke: "#dc2626",
                  name:
                    selectedMetric.charAt(0).toUpperCase() +
                    selectedMetric.slice(1),
                },
              ]}
              xAxisConfig={{ dataKey: "timestamp", label: "Time" }}
              leftYAxisConfig={{
                label:
                  selectedMetric === "throughput"
                    ? "Units/Hour"
                    : selectedMetric === "downtime"
                    ? "Hours"
                    : "Percentage (%)",
              }}
              height={320}
            />
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OEE Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            OEE Breakdown Analysis
          </h3>

          <div className="space-y-4">
            {[
              {
                label: "Availability",
                value: currentMetrics.availability,
                target: 95,
                color: "blue",
              },
              {
                label: "Performance",
                value: currentMetrics.performance,
                target: 90,
                color: "green",
              },
              {
                label: "Quality",
                value: currentMetrics.quality,
                target: 95,
                color: "purple",
              },
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {metric.label}:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {metric.value.toFixed(1)}% / {metric.target}%
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-${metric.color}-600`}
                      style={{
                        width: `${Math.min(
                          100,
                          (metric.value / metric.target) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div
                    className="absolute top-0 w-0.5 h-2 bg-slate-400"
                    style={{ left: `${(metric.target / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {currentMetrics.oee.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Overall Equipment Effectiveness
              </div>
            </div>
          </div>
        </div>

        {/* Production Targets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Today's Production Targets
          </h3>

          <div className="space-y-6">
            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(Math.round(currentMetrics.throughput * 8))}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Units Produced Today
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Target: {formatNumber(1200)} units
              </div>
            </div>{" "}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(Math.round(currentMetrics.quality * 12))}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Quality Units
                </div>
              </div>

              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {currentMetrics.scrapRate.toFixed(1)}%
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  Scrap Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantOperationsDashboard;
