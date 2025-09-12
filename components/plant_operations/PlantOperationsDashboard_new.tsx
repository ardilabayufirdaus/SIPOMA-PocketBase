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

interface PlantOperationsDashboardProps {
  t: any;
  plantData?: any;
}

const PlantOperationsDashboard: React.FC<PlantOperationsDashboardProps> = ({
  t,
  plantData,
}) => {
  const [timeRange, setTimeRange] = useState<"1h" | "4h" | "12h" | "24h">("4h");
  const [selectedMetric, setSelectedMetric] = useState<string>("efficiency");

  // Data hooks untuk Plant Operations modules
  const { getAllDowntime, loading: downtimeLoading } = useCcrDowntimeData();
  const { records: riskRecords, loading: riskLoading } =
    useAutonomousRiskData();
  const { records: plantUnits, loading: unitsLoading } = usePlantUnits();
  const { records: parameterSettings, loading: parametersLoading } =
    useParameterSettings();
  const { copParameterIds, loading: copLoading } = useCopParametersSupabase();
  const { getDataForDate } = useCcrParameterData();

  // Get real data dari Plant Operations modules
  const downtimeData = useMemo(() => getAllDowntime(), [getAllDowntime]);
  const currentTime = new Date();
  const today = currentTime.toISOString().split("T")[0];

  // Plant Operations statistics
  const plantOperationsStats = useMemo(() => {
    // Statistics from different modules
    const totalUnits = plantUnits.length;
    const totalCategories = [...new Set(plantUnits.map((u) => u.category))]
      .length;
    const totalParameters = parameterSettings.length;
    const totalCopParameters = copParameterIds.length;

    // Downtime statistics
    const totalDowntimeRecords = downtimeData.length;
    const todayDowntime = downtimeData.filter((d) => d.date === today).length;
    const openDowntime = downtimeData.filter((d) => d.status === "Open").length;

    // Risk statistics
    const totalRiskRecords = riskRecords.length;
    const inProgressRisks = riskRecords.filter(
      (r) => r.status === "In Progress"
    ).length;
    const identifiedRisks = riskRecords.filter(
      (r) => r.status === "Identified"
    ).length;

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
  }, [
    plantUnits,
    parameterSettings,
    copParameterIds,
    downtimeData,
    riskRecords,
    today,
  ]);

  // Simulated production data based on Plant Operations
  const realProductionData = useMemo(() => {
    // Generate data for last 24 hours based on Plant Operations
    return Array.from({ length: 24 }, (_, index) => {
      const time = new Date(
        currentTime.getTime() - (24 - index) * 60 * 60 * 1000
      );

      // Base values influenced by plant operations data
      const baseEfficiency = 85 - plantOperationsStats.openDowntime * 5;
      const efficiency = Math.max(
        60,
        Math.min(100, baseEfficiency + Math.random() * 10)
      );

      const quality = 95 + Math.random() * 5;
      const availability =
        90 - plantOperationsStats.inProgressRisks * 3 + Math.random() * 8;
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
  if (
    downtimeLoading ||
    riskLoading ||
    unitsLoading ||
    parametersLoading ||
    copLoading
  ) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">
          Loading Plant Operations data...
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
            Monitor dan analisis Plant Operations berdasarkan data CCR,
            Autonomous, COP, dan Master Data
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
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
              <div
                className={`flex items-center gap-1 text-sm ${
                  kpi.trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpi.trend.isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span>{formatNumber(kpi.trend.value)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(kpi.value)}
                {kpi.unit && (
                  <span className="text-lg text-slate-500 ml-1">
                    {kpi.unit}
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {kpi.title}
              </p>
              {kpi.target && (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Target: {formatNumber(kpi.target)} {kpi.unit}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Metrics Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Plant Operations Metrics
            </h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="efficiency">Efficiency (%)</option>
              <option value="availability">Availability (%)</option>
              <option value="quality">Quality (%)</option>
              <option value="throughput">Throughput</option>
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
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Risk Records
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                Status Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Open Downtime
                  </span>
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
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Identified Risks
                  </span>
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
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Source Overview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Data Source Overview
          </h3>

          <div className="space-y-4">
            {[
              {
                label: "CCR Parameter Data",
                value: plantOperationsStats.totalParameters,
                description: "Parameters configured for monitoring",
                color: "blue",
              },
              {
                label: "COP Analysis Parameters",
                value: plantOperationsStats.totalCopParameters,
                description: "Parameters used in COP analysis",
                color: "green",
              },
              {
                label: "Plant Master Data",
                value: plantOperationsStats.totalUnits,
                description: "Units defined in master data",
                color: "purple",
              },
              {
                label: "Work Instructions",
                value: plantOperationsStats.totalCategories,
                description: "Categories for work procedures",
                color: "orange",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.color === "blue"
                        ? "bg-blue-500"
                        : item.color === "green"
                        ? "bg-green-500"
                        : item.color === "purple"
                        ? "bg-purple-500"
                        : "bg-orange-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </div>
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

        {/* Module Integration Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Module Integration Status
          </h3>

          <div className="space-y-4">
            {[
              {
                module: "CCR Data Entry",
                status:
                  plantOperationsStats.totalParameters > 0
                    ? "active"
                    : "inactive",
                description: "Parameter data entry and monitoring",
                data: `${plantOperationsStats.totalParameters} parameters`,
              },
              {
                module: "Autonomous Data Entry",
                status:
                  plantOperationsStats.totalRiskRecords > 0
                    ? "active"
                    : "inactive",
                description: "Risk management and downtime tracking",
                data: `${plantOperationsStats.totalRiskRecords} risk records`,
              },
              {
                module: "COP Analysis",
                status:
                  plantOperationsStats.totalCopParameters > 0
                    ? "active"
                    : "inactive",
                description: "Cost of production analysis",
                data: `${plantOperationsStats.totalCopParameters} COP parameters`,
              },
              {
                module: "Master Data Management",
                status:
                  plantOperationsStats.totalUnits > 0 ? "active" : "inactive",
                description: "Plant units and categories",
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
                      item.status === "active" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.module}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      item.status === "active"
                        ? "text-green-600"
                        : "text-gray-500"
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
      </div>
    </div>
  );
};

export default PlantOperationsDashboard;
