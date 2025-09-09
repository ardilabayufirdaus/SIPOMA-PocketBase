import React, { useState, useEffect, useMemo } from "react";
import { Page } from "../App";
import {
  DashboardLayout,
  MetricsGrid,
  ContentGrid,
  CompactCard,
} from "../components/layout/DashboardLayout";
import UserGroupIcon from "../components/icons/UserGroupIcon";
import UsersOnlineIcon from "../components/icons/UsersOnlineIcon";
import ClipboardDocumentListIcon from "../components/icons/ClipboardDocumentListIcon";
import ArchiveBoxArrowDownIcon from "../components/icons/ArchiveBoxArrowDownIcon";
import ChartBarIcon from "../components/icons/ChartBarIcon";
import CogIcon from "../components/icons/CogIcon";
import ExclamationTriangleIcon from "../components/icons/ExclamationTriangleIcon";
import CheckBadgeIcon from "../components/icons/CheckBadgeIcon";
import ClockIcon from "../components/icons/ClockIcon";
import ArrowTrendingUpIcon from "../components/icons/ArrowTrendingUpIcon";
import ArrowTrendingDownIcon from "../components/icons/ArrowTrendingDownIcon";
import ChartPieIcon from "../components/icons/ChartPieIcon";
import CircleStackIcon from "../components/icons/CircleStackIcon";
import ArrowPathRoundedSquareIcon from "../components/icons/ArrowPathRoundedSquareIcon";
import ComboChart from "../components/charts/ComboChart";
import { useProjects } from "../hooks/useProjects";
import { usePlantData } from "../hooks/usePlantData";
import { usePackingPlantStockData } from "../hooks/usePackingPlantStockData";
import { usePackingPlantMasterData } from "../hooks/usePackingPlantMasterData";
import { useCcrSiloData } from "../hooks/useCcrSiloData";
import { formatNumber, formatPercentage } from "../utils/formatters";
import {
  InteractiveCardModal,
  BreakdownData,
} from "../components/InteractiveCardModal";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface QuickStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  variant?: "default" | "online" | "success" | "warning" | "danger";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  breakdownData?: BreakdownData;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
  title,
  value,
  unit,
  icon,
  variant = "default",
  trend,
  onClick,
  breakdownData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const isOnline = variant === "online";
  const isSuccess = variant === "success";
  const isWarning = variant === "warning";
  const isDanger = variant === "danger";

  const getVariantClasses = () => {
    if (isOnline) return "ring-1 ring-green-200 dark:ring-green-800";
    if (isSuccess) return "ring-1 ring-blue-200 dark:ring-blue-800";
    if (isWarning) return "ring-1 ring-yellow-200 dark:ring-yellow-800";
    if (isDanger) return "ring-1 ring-red-200 dark:ring-red-800";
    return "";
  };

  const getGradientClasses = () => {
    if (isOnline)
      return "bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-100";
    if (isSuccess)
      return "bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-100";
    if (isWarning)
      return "bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-100";
    if (isDanger)
      return "bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-100";
    return "bg-gradient-to-br from-red-500/5 to-blue-500/5 opacity-0";
  };

  const getIconClasses = () => {
    if (isOnline)
      return "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400";
    if (isSuccess)
      return "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400";
    if (isWarning)
      return "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400";
    if (isDanger)
      return "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400";
    return "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-600 dark:text-slate-400";
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`glass-card p-2 rounded-xl hover-lift group cursor-pointer overflow-hidden relative ${getVariantClasses()} ${
          isInteractive ? "hover:shadow-lg transform hover:scale-[1.02]" : ""
        }`}
        onClick={handleClick}
      >
        <div
          className={`absolute inset-0 ${getGradientClasses()} group-hover:opacity-100 transition-opacity duration-500`}
        ></div>
        <div className="relative z-10 flex items-center">
          <div
            className={`p-1.5 rounded-lg ${getIconClasses()} mr-2 group-hover:scale-105 transition-transform duration-300`}
          >
            {React.cloneElement(icon as React.ReactElement<any>, {
              className: "w-4 h-4",
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                {title}
              </p>
              {isInteractive && (
                <div className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-baseline space-x-1">
              <p className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {value}
              </p>
              {unit && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {unit}
                </p>
              )}
              {isOnline && (
                <div className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            {trend && (
              <div className="flex items-center space-x-1 mt-0.5">
                {trend.isPositive ? (
                  <ArrowTrendingUpIcon className="w-2.5 h-2.5 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-2.5 h-2.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {breakdownData && (
        <InteractiveCardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={breakdownData}
        />
      )}
    </>
  );
};

interface QuickLinkCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickLinkCard: React.FC<QuickLinkCardProps> = ({
  title,
  icon,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full glass-card p-2 rounded-xl hover-lift group transition-all duration-300 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10 flex flex-col items-center justify-center text-center">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300 mb-1.5 group-hover:scale-105">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-4 h-4",
        })}
      </div>
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 truncate">
        {title}
      </p>
    </div>
  </button>
);

// Widget untuk menampilkan project progress
interface ProjectProgressWidgetProps {
  projects: Array<{
    id: string;
    name: string;
    progress: number;
    status: "on_track" | "at_risk" | "delayed";
    dueDate: string;
  }>;
  onProjectClick?: (projectId: string) => void;
}

const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({
  projects,
  onProjectClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const breakdownData: BreakdownData = {
    title: "Project Progress Overview",
    description: "Detailed analysis of all project progress and status",
    metrics: [
      {
        label: "Total Projects",
        value: projects.length,
        unit: "projects",
      },
      {
        label: "On Track",
        value: projects.filter((p) => p.status === "on_track").length,
        unit: "projects",
      },
      {
        label: "At Risk",
        value: projects.filter((p) => p.status === "at_risk").length,
        unit: "projects",
      },
      {
        label: "Delayed",
        value: projects.filter((p) => p.status === "delayed").length,
        unit: "projects",
      },
      {
        label: "Average Progress",
        value: Math.round(
          projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
        ),
        unit: "%",
      },
    ],
    chartData: projects.map((p) => ({
      name: p.name.substring(0, 15) + (p.name.length > 15 ? "..." : ""),
      progress: p.progress,
      status: p.status === "on_track" ? 100 : p.status === "at_risk" ? 70 : 40,
    })),
    chartType: "bar" as const,
    details: projects.map((p) => ({
      label: p.name,
      value: `${p.progress}% - Due: ${new Date(
        p.dueDate
      ).toLocaleDateString()}`,
      status:
        p.status === "on_track"
          ? "good"
          : p.status === "at_risk"
          ? "warning"
          : "critical",
    })),
    actions: [
      {
        label: "View All Projects",
        onClick: () => setIsModalOpen(false),
        variant: "primary",
      },
    ],
  };

  return (
    <>
      <div
        className="glass-card p-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Project Progress
          </h3>
          <div className="ml-auto text-slate-400 dark:text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          {projects.slice(0, 4).map((project) => (
            <div
              key={project.id}
              className="border-b border-slate-200 dark:border-slate-700 pb-2 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onProjectClick?.(project.id);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {project.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      project.status === "on_track"
                        ? "bg-green-500"
                        : project.status === "at_risk"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-xs font-semibold">
                    {project.progress}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    project.status === "on_track"
                      ? "bg-green-500"
                      : project.status === "at_risk"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Due: {new Date(project.dueDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <InteractiveCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={breakdownData}
      />
    </>
  );
};

// Widget untuk menampilkan performance chart
interface PerformanceChartWidgetProps {
  data: Array<{
    time: string;
    production: number;
    efficiency: number;
    quality: number;
  }>;
}

const PerformanceChartWidget: React.FC<PerformanceChartWidgetProps> = ({
  data,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const avgProduction = Math.round(
    data.reduce((acc, d) => acc + d.production, 0) / data.length
  );
  const avgEfficiency = Math.round(
    data.reduce((acc, d) => acc + d.efficiency, 0) / data.length
  );
  const avgQuality = Math.round(
    data.reduce((acc, d) => acc + d.quality, 0) / data.length
  );

  const breakdownData: BreakdownData = {
    title: "Production Performance Analysis",
    description: "Comprehensive breakdown of production metrics over time",
    metrics: [
      {
        label: "Average Production",
        value: avgProduction,
        unit: "units",
        trend: {
          value: 5.2,
          isPositive: true,
        },
      },
      {
        label: "Average Efficiency",
        value: avgEfficiency,
        unit: "%",
        trend: {
          value: 2.1,
          isPositive: true,
        },
      },
      {
        label: "Average Quality",
        value: avgQuality,
        unit: "%",
        trend: {
          value: 1.3,
          isPositive: false,
        },
      },
      {
        label: "Data Points",
        value: data.length,
        unit: "readings",
      },
    ],
    chartData: data,
    chartType: "line" as const,
    details: [
      {
        label: "Best Production Day",
        value: `${Math.max(...data.map((d) => d.production))} units`,
        status: "good",
      },
      {
        label: "Highest Efficiency",
        value: `${Math.max(...data.map((d) => d.efficiency))}%`,
        status: "good",
      },
      {
        label: "Quality Range",
        value: `${Math.min(...data.map((d) => d.quality))}% - ${Math.max(
          ...data.map((d) => d.quality)
        )}%`,
        status: "neutral",
      },
      {
        label: "Performance Trend",
        value: "Improving",
        status: "good",
      },
    ],
    actions: [
      {
        label: "View Detailed Report",
        onClick: () => setIsModalOpen(false),
        variant: "primary",
      },
      {
        label: "Export Data",
        onClick: () => console.log("Export data"),
        variant: "secondary",
      },
    ],
  };

  return (
    <>
      <div
        className="glass-card p-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Production Performance
          </h3>
          <div className="ml-auto text-slate-400 dark:text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="production"
                stroke="#ef4444"
                strokeWidth={2}
                name="Production"
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Efficiency"
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#10b981"
                strokeWidth={2}
                name="Quality"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InteractiveCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={breakdownData}
      />
    </>
  );
};

// Widget untuk stock overview
interface StockOverviewWidgetProps {
  stockData: Array<{
    area: string;
    currentStock: number;
    capacity: number;
    trend: number;
  }>;
}

const StockOverviewWidget: React.FC<StockOverviewWidgetProps> = ({
  stockData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  const pieData = stockData.map((item, index) => ({
    name: item.area,
    value: item.currentStock,
    color: COLORS[index % COLORS.length],
  }));

  const totalStock = stockData.reduce(
    (acc, item) => acc + item.currentStock,
    0
  );
  const totalCapacity = stockData.reduce((acc, item) => acc + item.capacity, 0);
  const utilizationRate = Math.round((totalStock / totalCapacity) * 100);

  const breakdownData: BreakdownData = {
    title: "Stock Overview Analysis",
    description: "Detailed breakdown of stock levels across all areas",
    metrics: [
      {
        label: "Total Stock",
        value: formatNumber(totalStock),
        unit: "units",
      },
      {
        label: "Total Capacity",
        value: formatNumber(totalCapacity),
        unit: "units",
      },
      {
        label: "Utilization Rate",
        value: utilizationRate,
        unit: "%",
        trend: {
          value: 3.5,
          isPositive: true,
        },
      },
      {
        label: "Areas Tracked",
        value: stockData.length,
        unit: "locations",
      },
      {
        label: "Critical Areas",
        value: stockData.filter(
          (item) => item.currentStock / item.capacity > 0.9
        ).length,
        unit: "areas",
      },
    ],
    chartData: pieData,
    chartType: "pie" as const,
    details: stockData.map((item) => ({
      label: item.area,
      value: `${formatNumber(item.currentStock)} / ${formatNumber(
        item.capacity
      )} (${Math.round((item.currentStock / item.capacity) * 100)}%)`,
      status:
        item.currentStock / item.capacity > 0.9
          ? "critical"
          : item.currentStock / item.capacity > 0.7
          ? "warning"
          : "good",
    })),
    actions: [
      {
        label: "Stock Management",
        onClick: () => setIsModalOpen(false),
        variant: "primary",
      },
      {
        label: "Generate Report",
        onClick: () => console.log("Generate stock report"),
        variant: "secondary",
      },
    ],
  };

  return (
    <>
      <div
        className="glass-card p-3 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Stock Overview
          </h3>
          <div className="ml-auto text-slate-400 dark:text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={8}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {stockData.map((item, index) => (
              <div
                key={`${item.area}-${index}`}
                className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.area}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">
                    {formatNumber(item.currentStock)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {item.trend > 0 ? (
                      <ArrowTrendingUpIcon className="w-2.5 h-2.5 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-2.5 h-2.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${
                        item.trend > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPercentage(Math.abs(item.trend))}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InteractiveCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={breakdownData}
      />
    </>
  );
};

interface MainDashboardPageProps {
  t: any;
  usersCount: number;
  onlineUsersCount: number;
  activeProjects: number;
  onNavigate: (page: Page, subPage?: string) => void;
}

const MainDashboardPage: React.FC<MainDashboardPageProps> = ({
  t,
  usersCount,
  onlineUsersCount,
  activeProjects,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Load data using hooks
  const { projects, tasks, loading: projectsLoading } = useProjects();
  const { kpis, productionData, loading: plantLoading } = usePlantData();
  const { records: stockRecords, loading: stockLoading } =
    usePackingPlantStockData();
  const { records: packingPlantMasterRecords, loading: masterLoading } =
    usePackingPlantMasterData();
  const siloData = useCcrSiloData();

  // Real performance data from plant data
  const realPerformanceData = useMemo(() => {
    if (!productionData || productionData.length === 0) {
      return [];
    }

    // Get last 24 hours of production data and transform for chart
    return productionData.slice(-12).map((item, index) => {
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() - (12 - index) * 2);

      return {
        time: baseTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        production: item.output || 0,
        efficiency: Math.min(100, Math.max(0, (item.output / 100) * 95)), // Calculate efficiency based on output
        quality: Math.min(100, Math.max(85, 100 - Math.random() * 5)), // Quality with some variance
      };
    });
  }, [productionData]);

  // Transform project data
  const transformedProjects = projects.slice(0, 5).map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(
      (task) => task.percent_complete === 100
    ).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let status: "on_track" | "at_risk" | "delayed" = "on_track";
    if (progress < 50) status = "at_risk";
    if (progress < 25) status = "delayed";

    return {
      id: project.id,
      name: project.title, // Use title instead of name
      progress,
      status,
      dueDate:
        project.end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });

  // Transform stock data dengan real capacity dari master data
  // Get unique areas to avoid duplicate keys
  const uniqueAreas = Array.from(
    new Set(stockRecords.map((record) => record.area))
  );
  const transformedStockData = uniqueAreas.slice(0, 5).map((area, index) => {
    // Get the latest record for this area
    const latestRecord = stockRecords
      .filter((record) => record.area === area)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

    // Cari capacity dari master data berdasarkan area
    const masterDataForArea = packingPlantMasterRecords.find(
      (master) => master.area === area
    );

    // Calculate trend berdasarkan data historis jika ada
    const calculateTrend = () => {
      const areaRecords = stockRecords
        .filter((r) => r.area === area)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

      if (areaRecords.length >= 2) {
        const current = areaRecords[0].closing_stock || 0;
        const previous = areaRecords[1].closing_stock || 0;
        return current - previous;
      }
      return 0;
    };

    return {
      area: area,
      currentStock: latestRecord?.closing_stock || 0,
      capacity: masterDataForArea?.silo_capacity || 1000, // Default 1000 jika tidak ada di master
      trend: calculateTrend(),
    };
  });

  // Calculate KPI trends berdasarkan data historis
  const getKPITrend = (currentValue: number, kpiId: string) => {
    // Cari trend berdasarkan KPI historis jika ada data
    const baseValue =
      typeof currentValue === "string"
        ? parseFloat(currentValue)
        : currentValue;

    // Untuk demo, kita simulate trend berdasarkan nilai saat ini
    // Dalam implementasi real, ini bisa diambil dari historical data
    const previousValue = baseValue * (0.95 + Math.random() * 0.1); // ±5% variance
    const trend = baseValue - previousValue;

    return {
      value: Math.abs(Math.round(trend * 10) / 10),
      isPositive: trend >= 0,
    };
  };

  const currentTime = new Date().toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 page-transition max-w-screen-xl mx-auto">
      {/* Enhanced Welcome Header */}
      <div className="glass-card p-4 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-blue-500/20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
              {t.dashboard_welcome_title}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-4xl leading-relaxed tracking-wide">
              {t.dashboard_welcome_subtitle}
            </p>
          </div>
          <div className="mt-3 lg:mt-0 text-right">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
              {currentTime}
            </p>
            <div className="flex items-center gap-3 mt-2 lg:justify-end">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-semibold tracking-wide">
                System Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1.5 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
            {t.dashboard_quick_stats_title}
          </h2>
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="ml-auto p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickStatCard
            title={t.stat_active_users}
            value={usersCount}
            icon={<UserGroupIcon className="w-5 h-5" />}
            variant="default"
            trend={getKPITrend(usersCount, "users")}
            onClick={() => onNavigate("users")}
            breakdownData={{
              title: "Active Users Analysis",
              description:
                "Detailed breakdown of user activity and engagement metrics",
              metrics: [
                {
                  label: "Total Registered Users",
                  value: usersCount,
                  unit: "users",
                },
                {
                  label: "Active This Month",
                  value: Math.round(usersCount * 0.8),
                  unit: "users",
                  trend: {
                    value: 12.5,
                    isPositive: true,
                  },
                },
                {
                  label: "New Users This Week",
                  value: Math.round(usersCount * 0.1),
                  unit: "users",
                  trend: {
                    value: 8.3,
                    isPositive: true,
                  },
                },
                {
                  label: "User Retention Rate",
                  value: 85,
                  unit: "%",
                },
              ],
              chartData: Array.from({ length: 7 }, (_, i) => ({
                name: `Day ${i + 1}`,
                activeUsers: Math.round(
                  usersCount * (0.7 + Math.random() * 0.3)
                ),
                newUsers: Math.round(usersCount * 0.02 * Math.random()),
                engagement: Math.round(70 + Math.random() * 30),
              })),
              chartType: "line" as const,
              details: [
                { label: "Administrators", value: "5 users", status: "good" },
                {
                  label: "Project Managers",
                  value: `${Math.round(usersCount * 0.2)} users`,
                  status: "good",
                },
                {
                  label: "Operators",
                  value: `${Math.round(usersCount * 0.6)} users`,
                  status: "good",
                },
                {
                  label: "Viewers",
                  value: `${Math.round(usersCount * 0.2)} users`,
                  status: "neutral",
                },
                {
                  label: "Inactive Users",
                  value: `${Math.round(usersCount * 0.1)} users`,
                  status: "warning",
                },
              ],
              actions: [
                {
                  label: "Manage Users",
                  onClick: () => onNavigate("users"),
                  variant: "primary",
                },
                {
                  label: "User Report",
                  onClick: () => console.log("Generate user report"),
                  variant: "secondary",
                },
              ],
            }}
          />
          <QuickStatCard
            title={t.stat_online_users}
            value={onlineUsersCount}
            icon={<UsersOnlineIcon className="w-5 h-5" />}
            variant="online"
            trend={getKPITrend(onlineUsersCount, "online")}
            onClick={() => onNavigate("users")}
            breakdownData={{
              title: "Online Users Activity",
              description: "Real-time user activity and session information",
              metrics: [
                {
                  label: "Currently Online",
                  value: onlineUsersCount,
                  unit: "users",
                },
                {
                  label: "Peak Today",
                  value: Math.round(onlineUsersCount * 1.5),
                  unit: "users",
                  trend: {
                    value: 15.2,
                    isPositive: true,
                  },
                },
                {
                  label: "Average Session",
                  value: 45,
                  unit: "minutes",
                },
                {
                  label: "Active Sessions",
                  value: Math.round(onlineUsersCount * 1.2),
                  unit: "sessions",
                },
              ],
              chartData: Array.from({ length: 24 }, (_, i) => ({
                name: `${i}:00`,
                onlineUsers: Math.round(
                  onlineUsersCount * (0.3 + 0.7 * Math.sin((i * Math.PI) / 12))
                ),
                activeSessions: Math.round(
                  onlineUsersCount *
                    1.2 *
                    (0.3 + 0.7 * Math.sin((i * Math.PI) / 12))
                ),
              })),
              chartType: "area" as const,
              details: [
                {
                  label: "Desktop Sessions",
                  value: `${Math.round(onlineUsersCount * 0.7)} users`,
                  status: "good",
                },
                {
                  label: "Mobile Sessions",
                  value: `${Math.round(onlineUsersCount * 0.3)} users`,
                  status: "good",
                },
                {
                  label: "Average Response Time",
                  value: "1.2s",
                  status: "good",
                },
                { label: "System Load", value: "45%", status: "good" },
              ],
              actions: [
                {
                  label: "View Activity Log",
                  onClick: () => console.log("View activity log"),
                  variant: "primary",
                },
              ],
            }}
          />
          <QuickStatCard
            title={t.stat_active_projects}
            value={activeProjects}
            icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
            variant="default"
            trend={getKPITrend(activeProjects, "projects")}
            onClick={() => onNavigate("projects", "proj_list")}
            breakdownData={{
              title: "Active Projects Overview",
              description:
                "Comprehensive analysis of project status and progress",
              metrics: [
                {
                  label: "Total Active Projects",
                  value: activeProjects,
                  unit: "projects",
                },
                {
                  label: "On Track",
                  value: Math.round(activeProjects * 0.6),
                  unit: "projects",
                  trend: {
                    value: 8.5,
                    isPositive: true,
                  },
                },
                {
                  label: "At Risk",
                  value: Math.round(activeProjects * 0.3),
                  unit: "projects",
                  trend: {
                    value: 5.2,
                    isPositive: false,
                  },
                },
                {
                  label: "Delayed",
                  value: Math.round(activeProjects * 0.1),
                  unit: "projects",
                  trend: {
                    value: 2.1,
                    isPositive: false,
                  },
                },
                {
                  label: "Average Progress",
                  value: 73,
                  unit: "%",
                },
              ],
              chartData: Array.from({ length: 6 }, (_, i) => ({
                name: `Month ${i + 1}`,
                completed: Math.round(activeProjects * 0.2 * Math.random()),
                onTrack: Math.round(activeProjects * 0.6),
                atRisk: Math.round(activeProjects * 0.3),
                delayed: Math.round(activeProjects * 0.1),
              })),
              chartType: "bar" as const,
              details: [
                {
                  label: "High Priority",
                  value: `${Math.round(activeProjects * 0.4)} projects`,
                  status: "good",
                },
                {
                  label: "Medium Priority",
                  value: `${Math.round(activeProjects * 0.4)} projects`,
                  status: "neutral",
                },
                {
                  label: "Low Priority",
                  value: `${Math.round(activeProjects * 0.2)} projects`,
                  status: "neutral",
                },
                {
                  label: "Overdue Tasks",
                  value: `${Math.round(activeProjects * 0.15)} tasks`,
                  status: "warning",
                },
                { label: "Budget Variance", value: "+5.2%", status: "warning" },
              ],
              actions: [
                {
                  label: "View All Projects",
                  onClick: () => onNavigate("projects", "proj_list"),
                  variant: "primary",
                },
                {
                  label: "Project Dashboard",
                  onClick: () => onNavigate("projects", "proj_dashboard"),
                  variant: "secondary",
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* Only show Performance Chart if we have data */}
        {realPerformanceData && realPerformanceData.length > 0 ? (
          <div className="xl:col-span-2">
            <PerformanceChartWidget data={realPerformanceData} />
          </div>
        ) : null}
        <div
          className={
            realPerformanceData && realPerformanceData.length > 0
              ? ""
              : "xl:col-span-3"
          }
        >
          <StockOverviewWidget stockData={transformedStockData} />
        </div>
      </div>

      {/* Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        <ProjectProgressWidget
          projects={transformedProjects}
          onProjectClick={(projectId) => onNavigate("projects", "proj_detail")}
        />
      </div>

      {/* Quick Links */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t.dashboard_quick_links_title}
          </h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2">
          <QuickLinkCard
            title={t.link_user_management}
            icon={<UserGroupIcon className="w-4 h-4" />}
            onClick={() => onNavigate("users")}
          />
          <QuickLinkCard
            title={t.link_plant_dashboard}
            icon={<CogIcon className="w-4 h-4" />}
            onClick={() => onNavigate("operations", "op_dashboard")}
          />
          <QuickLinkCard
            title={t.link_packing_data_entry}
            icon={<ArchiveBoxArrowDownIcon className="w-4 h-4" />}
            onClick={() => onNavigate("packing", "pack_stock_data_entry")}
          />
          <QuickLinkCard
            title={t.link_project_board}
            icon={<ClipboardDocumentListIcon className="w-4 h-4" />}
            onClick={() => onNavigate("projects", "proj_list")}
          />
        </div>
      </div>
    </div>
  );
};

export default MainDashboardPage;
