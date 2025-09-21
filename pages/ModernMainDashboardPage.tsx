import React, { useState, useEffect, useMemo } from 'react';
import { Page } from '../App';
import {
  UsersIcon,
  FolderIcon,
  BarChart3Icon,
  TrendingUpIcon,
  RefreshCcwIcon,
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  PieChartIcon,
  SettingsIcon,
  ArrowRightIcon,
  FilterIcon,
  ExternalLinkIcon,
} from 'lucide-react';

// Import modern components
import {
  ModernMetricCard,
  ChartContainer,
  DashboardHeader,
  fadeInUp,
  staggerContainer,
  scaleOnHover,
  colors,
} from '../components/dashboard/ModernDashboard';

// Import chart components
import { StockDistributionChart } from '../components/charts/StockDistributionChart';
import { ProjectStatusChart } from '../components/charts/ProjectStatusChart';

// Import existing hooks
import { useProjects } from '../hooks/useProjects';
import { usePlantData } from '../hooks/usePlantData';
import { EnhancedButton } from '../components/ui/EnhancedComponents';
import { usePackingPlantStockData } from '../hooks/usePackingPlantStockData';
import { usePackingPlantMasterData } from '../hooks/usePackingPlantMasterData';
import { useCcrSiloData } from '../hooks/useCcrSiloData';
import { useTotalProduction } from '../hooks/useTotalProduction';
import { formatNumber, formatPercentage } from '../utils/formatters';

// Import Typography Components
import { H2, Body, UIText } from '../components/ui/Typography';

interface ModernMainDashboardPageProps {
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
}

// Enhanced Performance Chart Widget
const PerformanceOverview: React.FC<{ data: any[] }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'trends' | 'comparison'>(
    'performance'
  );

  const tabs = [
    { key: 'performance', label: 'Performance', icon: BarChart3Icon },
    { key: 'trends', label: 'Trends', icon: TrendingUpIcon },
    { key: 'comparison', label: 'Comparison', icon: PieChartIcon },
  ];

  return (
    <ChartContainer
      title="Performance Overview"
      subtitle="Real-time production and efficiency metrics"
      actions={
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-all
                  ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <tab.icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <EnhancedButton
            variant="ghost"
            size="sm"
            className="p-2"
            icon={<RefreshCcwIcon className="w-4 h-4" />}
            ariaLabel="Refresh data"
          >
            {'\u00A0'}
          </EnhancedButton>
        </div>
      }
      className="col-span-2"
    >
      <div className="h-80">
        <div className="flex items-center justify-center h-full text-slate-500">
          Chart will be implemented with Chart.js
        </div>
      </div>
    </ChartContainer>
  );
};

// Stock Overview Widget
const StockInsights: React.FC<{ stockData: any[] }> = ({ stockData }) => {
  const totalCapacity = stockData.reduce((acc, item) => acc + item.capacity, 0);
  const totalStock = stockData.reduce((acc, item) => acc + item.currentStock, 0);
  const utilizationRate = (totalStock / totalCapacity) * 100;

  const pieData = stockData.map((item, index) => ({
    name: item.area,
    value: item.currentStock,
    fill: `hsl(${(index * 60) % 360}, 70%, 60%)`,
  }));

  return (
    <ChartContainer
      title="Stock Distribution"
      subtitle={`${utilizationRate.toFixed(1)}% capacity utilized`}
      actions={
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64">
          <StockDistributionChart stockData={stockData} />
        </div>
        <div className="space-y-3">
          {stockData.slice(0, 5).map((item, index) => (
            <div
              key={item.area}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pieData[index]?.fill }}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.area}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatNumber(item.currentStock)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {((item.currentStock / item.capacity) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
};

// Project Progress Widget
const ProjectInsights: React.FC<{ projects: any[] }> = ({ projects }) => {
  const statusCounts = {
    on_track: projects.filter((p) => p.status === 'on_track').length,
    at_risk: projects.filter((p) => p.status === 'at_risk').length,
    delayed: projects.filter((p) => p.status === 'delayed').length,
  };

  const chartData = [
    { name: 'On Track', value: statusCounts.on_track, fill: colors.success },
    { name: 'At Risk', value: statusCounts.at_risk, fill: colors.warning },
    { name: 'Delayed', value: statusCounts.delayed, fill: colors.danger },
  ];

  return (
    <ChartContainer
      title="Project Status"
      subtitle={`${projects.length} active projects`}
      actions={
        <EnhancedButton
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          icon={<ArrowRightIcon className="w-3 h-3" />}
          iconPosition="right"
        >
          View All
        </EnhancedButton>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48">
          <ProjectStatusChart projects={projects} />
        </div>
        <div className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <div key={project.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {project.name}
                </span>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      project.status === 'on_track'
                        ? 'bg-green-500'
                        : project.status === 'at_risk'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {project.progress}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    project.status === 'on_track'
                      ? 'bg-green-500'
                      : project.status === 'at_risk'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
};

// Main Dashboard Component
const ModernMainDashboardPage: React.FC<ModernMainDashboardPageProps> = ({
  language,
  onNavigate,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Hooks for data
  const { projects, tasks, loading: projectsLoading } = useProjects();
  const {
    machines,
    kpis,
    alerts,
    productionData,
    loading: plantLoading,
    toggleMachineStatus,
    markAllAlertsAsRead,
  } = usePlantData();
  const { records: stockRecords, loading: stockLoading } = usePackingPlantStockData();
  const { records: packingPlantMasterRecords } = usePackingPlantMasterData();
  const { totalProduction, loading: totalProductionLoading } = useTotalProduction();

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Transform data for charts
  const performanceData = useMemo(() => {
    if (!productionData || productionData.length === 0) return [];

    return productionData.slice(-12).map((item, index) => {
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() - (12 - index) * 2);

      return {
        time: baseTime.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        production: item.output || 0,
        efficiency: Math.min(100, Math.max(0, (item.output / 100) * 95)),
        quality: Math.min(100, Math.max(85, 100 - Math.random() * 5)),
      };
    });
  }, [productionData, refreshKey]);

  // Transform project data
  const transformedProjects = useMemo(() => {
    return projects.slice(0, 5).map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter((task) => task.percent_complete === 100).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      let status: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
      if (progress < 50) status = 'at_risk';
      if (progress < 25) status = 'delayed';

      return {
        id: project.id,
        name: project.title,
        progress,
        status,
        dueDate: project.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  }, [projects, tasks]);

  // Transform stock data
  const transformedStockData = useMemo(() => {
    const uniqueAreas = Array.from(new Set(stockRecords.map((record) => record.area)));

    return uniqueAreas.slice(0, 5).map((area) => {
      const latestRecord = stockRecords
        .filter((record) => record.area === area)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const masterDataForArea = packingPlantMasterRecords.find((master) => master.area === area);

      return {
        area: area,
        currentStock: latestRecord?.closing_stock || 0,
        capacity: masterDataForArea?.silo_capacity || 1000,
        trend: Math.random() > 0.5 ? 'up' : 'down',
      };
    });
  }, [stockRecords, packingPlantMasterRecords, refreshKey]);

  // Calculate metrics
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const totalCapacity = transformedStockData.reduce((acc, item) => acc + item.capacity, 0);
  const totalStock = transformedStockData.reduce((acc, item) => acc + item.currentStock, 0);
  const utilizationRate = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-screen-xl mx-auto p-2 space-y-4">
        {/* Header */}
        <DashboardHeader
          currentUser={{
            name: 'Admin User',
            role: 'Super Administrator',
          }}
          onSearch={(query) => {}} // TODO: Implement search functionality
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ModernMetricCard
            title="Active Projects"
            value={activeProjects}
            icon={<FolderIcon className="w-6 h-6" />}
            variant="default"
            trend={{
              value: 5.7,
              direction: 'up',
              period: 'vs last week',
            }}
            onClick={() => onNavigate('projects')}
          />

          <ModernMetricCard
            title="Stock Utilization"
            value={utilizationRate.toFixed(1)}
            unit="%"
            icon={<PieChartIcon className="w-6 h-6" />}
            variant={utilizationRate > 80 ? 'warning' : 'default'}
            trend={{
              value: 3.2,
              direction: utilizationRate > 75 ? 'up' : 'down',
              period: 'vs last month',
            }}
            onClick={() => onNavigate('packing')}
          />

          <ModernMetricCard
            title="Total Production"
            value={totalProduction ? formatNumber(totalProduction) : 'Loading...'}
            unit="tons"
            icon={<BarChart3Icon className="w-6 h-6" />}
            variant="success"
            isLoading={totalProductionLoading}
            trend={{
              value: 2.1,
              direction: 'up',
              period: 'vs last month',
            }}
            onClick={() => onNavigate('operations')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Performance Chart - takes 2/3 width */}
          {performanceData.length > 0 && <PerformanceOverview data={performanceData} />}

          {/* Stock Insights */}
          <StockInsights stockData={transformedStockData} />
        </div>

        {/* Secondary Widgets */}
        <div className="grid grid-cols-1 gap-3">
          <ProjectInsights projects={transformedProjects} />
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  System Status: Operational
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last Updated: {new Date().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">SIPOMA</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernMainDashboardPage;
