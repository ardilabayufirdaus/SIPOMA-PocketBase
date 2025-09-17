import React, { useState, useMemo, useEffect, memo } from 'react';
import { useCcrParameterData } from '../../../hooks/useCcrParameterData';
import { useCopParametersSupabase } from '../../../hooks/useCopParametersSupabase';
import { useWorkInstructions } from '../../../hooks/useWorkInstructions';
import { useParameterSettings } from '../../../hooks/useParameterSettings';
import { usePlantUnits } from '../../../hooks/usePlantUnits';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { usePermissions } from '../../../utils/permissions';
import { PermissionLevel } from '../../../types';
import { useDashboardDataProcessor } from '../../../hooks/useDashboardDataProcessor';
import { useCcrFooterData } from '../../../hooks/useCcrFooterData';
import { useProductionTrendData } from '../../../hooks/useProductionTrendData';
import Modal from '../../../components/Modal';
import { formatDate, formatNumber, formatDateForDB } from '../../../utils/formatters';
import { CcrParameterData } from '../../../types';
import LazyChart from '../../../components/LazyChart';

// Import chart components
import { ProductionTrendChart } from '../../../components/charts/ProductionTrendChart';
import { COPAnalysisChart } from '../../../components/charts/COPAnalysisChart';

interface DashboardData {
  timestamp: string;
  production: number;
  efficiency: number;
  quality: number;
  downtime: number;
  energy: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface WorkInstructionsChartProps {
  data: any[];
}

const WorkInstructionsChart = memo<WorkInstructionsChartProps>(({ data }) => (
  <div className="flex items-center justify-center h-80 text-slate-500">
    Pie Chart - implement with Chart.js
  </div>
));

WorkInstructionsChart.displayName = 'WorkInstructionsChart';

const PlantOperationsDashboard: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);

  // Check permissions using the proper permission system
  const hasDashboardAccess = permissionChecker.hasPermission('plant_operations', 'READ');

  // Move all hooks to the top before any conditional returns
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPlantCategory, setSelectedPlantCategory] = useState<string>('all');
  const [selectedPlantUnit, setSelectedPlantUnit] = useState<string>('all');

  // Production Trend Settings State
  const [showProductionTrendSettings, setShowProductionTrendSettings] = useState(false);
  const [selectedProductionParameters, setSelectedProductionParameters] = useState<string[]>([]);

  // Check if user is Super Admin
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  // Load saved parameter selections from localStorage
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = localStorage.getItem('productionTrendParameters');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedProductionParameters(parsed);
        } catch (error) {
          console.error('Error parsing saved production trend parameters:', error);
        }
      }
    }
  }, [isSuperAdmin]);

  // Save parameter selections to localStorage
  const saveProductionParameters = (parameters: string[]) => {
    if (isSuperAdmin) {
      localStorage.setItem('productionTrendParameters', JSON.stringify(parameters));
      setSelectedProductionParameters(parameters);
    }
  };

  // Data hooks
  const { getDataForDate, getDataForDateRange } = useCcrParameterData();
  const { getFooterDataForDate } = useCcrFooterData();
  const { copParameterIds } = useCopParametersSupabase();
  const { instructions: workInstructions } = useWorkInstructions();
  const { records: parameters } = useParameterSettings();
  const { records: plantUnits } = usePlantUnits();

  const [ccrData, setCcrData] = useState<CcrParameterData[]>([]);
  const [footerData, setFooterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch CCR data for selected month/year
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get data for the entire selected month using individual date queries
        // This matches how CCR Data Entry fetches data
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        console.log('🔍 Dashboard: Fetching data with filters:', {
          selectedMonth,
          selectedYear,
          selectedPlantCategory,
          selectedPlantUnit,
          startDate: startDateStr,
          endDate: endDateStr,
        });

        const allData: CcrParameterData[] = [];
        const allFooterData: any[] = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDate(d);
          const dbDateStr = formatDateForDB(d); // Use YYYY-MM-DD format for database queries
          const dateData = await getDataForDate(dbDateStr);
          const footerDateData = await getFooterDataForDate(dbDateStr, selectedPlantUnit);
          allData.push(...dateData);
          allFooterData.push(...footerDateData);
        }

        console.log('🔍 Dashboard: Fetched CCR data:', {
          count: allData.length,
          footerCount: allFooterData.length,
          selectedPlantCategory,
          selectedPlantUnit,
          dateRange: `${startDateStr} to ${endDateStr}`,
          sampleData: allData.slice(0, 3),
          sampleFooterData: allFooterData.slice(0, 3),
          uniqueParameterIds: [...new Set(allData.map((d) => d.parameter_id))],
          uniqueFooterParameterIds: [...new Set(allFooterData.map((d) => d.parameter_id))],
        });

        // Set the fetched data to state
        setCcrData(allData);
        setFooterData(allFooterData);
      } catch (err) {
        console.error('Error fetching CCR data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setCcrData([]);
        setFooterData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, selectedPlantCategory, selectedPlantUnit]);

  // Use custom hook for data processing - moved to top with other hooks
  const {
    chartData,
    keyMetrics,
    copAnalysisData,
    productionTrendData: originalProductionTrendData,
  } = useDashboardDataProcessor(
    ccrData,
    parameters,
    copParameterIds,
    selectedPlantCategory,
    selectedPlantUnit,
    selectedProductionParameters,
    selectedMonth,
    selectedYear
  );

  // Use production trend data from footer
  const { productionTrendData } = useProductionTrendData(
    footerData,
    parameters,
    selectedProductionParameters,
    selectedMonth,
    selectedYear,
    selectedPlantUnit,
    selectedPlantCategory
  );

  // Work Instructions summary - moved to top with other hooks
  const workInstructionsSummary = useMemo(() => {
    const byActivity = workInstructions.reduce(
      (acc, instruction) => {
        acc[instruction.activity] = (acc[instruction.activity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(byActivity).map(([activity, count]) => ({
      name: activity,
      value: count,
    }));
  }, [workInstructions]);

  // Memoized CCR data filtering for tables
  const filteredCcrData = useMemo(() => {
    return ccrData.filter((item) => {
      const param = parameters.find((p) => p.id === item.parameter_id);
      if (!param) return false;

      const categoryMatch =
        selectedPlantCategory === 'all' || param.category === selectedPlantCategory;
      const unitMatch = selectedPlantUnit === 'all' || param.unit === selectedPlantUnit;

      return categoryMatch && unitMatch;
    });
  }, [ccrData, parameters, selectedPlantCategory, selectedPlantUnit]);

  // Memoized CCR table data with calculations
  const ccrTableData = useMemo(() => {
    return filteredCcrData.slice(0, 10).map((item) => {
      const param = parameters.find((p) => p.id === item.parameter_id);
      const hourlyValues = Object.values(item.hourly_values);
      const avgValue =
        hourlyValues.length > 0
          ? (hourlyValues as number[]).reduce((sum, val) => sum + (Number(val) || 0), 0) /
            hourlyValues.length
          : 0;
      const deviation = param?.max_value
        ? ((avgValue - param.max_value) / param.max_value) * 100
        : 0;

      return {
        id: item.id,
        parameter: param?.parameter || 'Unknown',
        unit: param?.unit || 'N/A',
        category: param?.category || 'N/A',
        avgValue,
        target: param?.max_value || 0,
        deviation,
      };
    });
  }, [filteredCcrData, parameters]);

  // Get unique plant categories and units for filters
  const plantCategories = useMemo(() => {
    const categories = [...new Set(plantUnits.map((unit) => unit.category))];
    return categories.sort();
  }, [plantUnits]);

  const unitsForCategory = useMemo(() => {
    if (!selectedPlantCategory || selectedPlantCategory === 'all')
      return [...new Set(plantUnits.map((unit) => unit.unit))].sort();
    return plantUnits
      .filter((unit) => unit.category === selectedPlantCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedPlantCategory]);

  // Reset unit selection when category changes
  useEffect(() => {
    if (selectedPlantCategory === 'all') {
      setSelectedPlantUnit('all');
    } else if (
      unitsForCategory.length > 0 &&
      !unitsForCategory.includes(selectedPlantUnit) &&
      selectedPlantUnit !== 'all'
    ) {
      setSelectedPlantUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedPlantUnit('all');
    }
  }, [unitsForCategory, selectedPlantCategory]); // Removed selectedPlantUnit to prevent infinite loop

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || !hasDashboardAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Access Denied</div>
          <div className="text-gray-600">
            You don&apos;t have permission to view this dashboard.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Modern Plant Operations Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-green-700 to-green-800 dark:from-green-800 dark:via-green-900 dark:to-green-900 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                      Plant Operations Dashboard
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-8 bg-white/60 rounded-full"></div>
                      <p className="text-white/80 text-sm lg:text-base">
                        Monitor performa pabrik dan analisis data operasional
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats in Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          Total Production
                        </p>
                        <p className="text-white text-xl font-bold">
                          {formatNumber(keyMetrics.totalProduction)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <svg
                          className="w-5 h-5 text-red-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          Total Parameters
                        </p>
                        <p className="text-white text-xl font-bold">{keyMetrics.totalParameters}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <svg
                          className="w-5 h-5 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          Active COP
                        </p>
                        <p className="text-white text-xl font-bold">
                          {keyMetrics.activeCopParameters}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col gap-4 lg:flex-shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-white/90 whitespace-nowrap">
                      Category:
                    </label>
                    <select
                      value={selectedPlantCategory}
                      onChange={(e) => setSelectedPlantCategory(e.target.value)}
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    >
                      <option value="all" className="text-slate-900">
                        All Categories
                      </option>
                      {plantCategories.map((category) => (
                        <option key={category} value={category} className="text-slate-900">
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-white/90 whitespace-nowrap">
                      Unit:
                    </label>
                    <select
                      value={selectedPlantUnit}
                      onChange={(e) => setSelectedPlantUnit(e.target.value)}
                      disabled={selectedPlantCategory !== 'all' && unitsForCategory.length === 0}
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 disabled:bg-white/5 disabled:cursor-not-allowed text-sm"
                    >
                      <option value="all" className="text-slate-900">
                        All Units
                      </option>
                      {unitsForCategory.map((unit) => (
                        <option key={unit} value={unit} className="text-slate-900">
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-white/90 whitespace-nowrap">
                      Month:
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1} className="text-slate-900">
                          {new Date(0, i).toLocaleString('default', {
                            month: 'long',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-white/90 whitespace-nowrap">
                      Year:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year} className="text-slate-900">
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Filter Status Indicators */}
                {(selectedPlantCategory !== 'all' || selectedPlantUnit !== 'all') && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      📊{' '}
                      {selectedPlantCategory === 'all' ? 'All Categories' : selectedPlantCategory}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      🏭 {selectedPlantUnit === 'all' ? 'All Units' : selectedPlantUnit}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      📅 {selectedMonth}/{selectedYear}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Trend */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Production Trend
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Monitor produksi harian
                    </p>
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowProductionTrendSettings(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Configure Production Trend Parameters"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>
                )}
              </div>
              {productionTrendData.length > 0 ? (
                <LazyChart>
                  <ProductionTrendChart
                    data={productionTrendData}
                    parameters={parameters}
                    selectedProductionParameters={selectedProductionParameters}
                    selectedPlantCategory={selectedPlantCategory}
                    selectedPlantUnit={selectedPlantUnit}
                  />
                </LazyChart>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">📊</div>
                    <div className="text-lg font-semibold mb-2">No Production Data</div>
                    <div className="text-sm">No data available for the selected filters</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COP Analysis */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    COP Analysis
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Analisis parameter kontrol operasional
                  </p>
                </div>
              </div>
              {copAnalysisData.length > 0 ? (
                <LazyChart>
                  <COPAnalysisChart data={copAnalysisData} />
                </LazyChart>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">🎯</div>
                    <div className="text-lg font-semibold mb-2">No COP Analysis Data</div>
                    <div className="text-sm">No COP parameters found for the selected filters</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Instructions Distribution */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Work Instructions
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Distribusi instruksi kerja berdasarkan aktivitas
                  </p>
                </div>
              </div>
              {workInstructionsSummary.length > 0 ? (
                <LazyChart>
                  <WorkInstructionsChart data={workInstructionsSummary} />
                </LazyChart>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">📋</div>
                    <div className="text-lg font-semibold mb-2">No Work Instructions</div>
                    <div className="text-sm">No work instructions available</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CCR Parameters Table */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    CCR Parameters
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Parameter kontrol dan monitoring
                  </p>
                  {selectedPlantCategory !== 'all' || selectedPlantUnit !== 'all' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mt-2">
                      {selectedPlantCategory !== 'all' ? selectedPlantCategory : 'All Categories'}
                      {selectedPlantUnit !== 'all' ? ` - ${selectedPlantUnit}` : ''}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Parameter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Actual
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Deviation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {ccrTableData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.parameter}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatNumber(item.avgValue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatNumber(item.target)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold ${
                            item.deviation > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {item.deviation > 0 ? '+' : ''}
                          {formatNumber(item.deviation)}%
                        </td>
                      </tr>
                    ))}
                    {ccrTableData.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                        >
                          <div className="text-4xl mb-2 opacity-50">📊</div>
                          <div className="text-sm font-medium">No CCR parameters found</div>
                          <div className="text-xs">for the selected filters</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Work Instructions Table */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/10 dark:to-blue-900/10"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Work Instructions
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Instruksi kerja terbaru
                  </p>
                  {selectedPlantCategory !== 'all' || selectedPlantUnit !== 'all' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mt-2">
                      Viewing all instructions - filters apply to operational data only
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Document Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Doc Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {workInstructions.slice(0, 10).map((instruction, index) => (
                      <tr
                        key={instruction.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {instruction.activity}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {instruction.doc_title}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                          {instruction.doc_code}
                        </td>
                      </tr>
                    ))}
                    {workInstructions.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                        >
                          <div className="text-4xl mb-2 opacity-50">📋</div>
                          <div className="text-sm font-medium">No work instructions available</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Production Trend Settings Modal */}
        {showProductionTrendSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Production Trend Settings</h3>
                <button
                  onClick={() => setShowProductionTrendSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Select which parameters to display in the Production Trend chart. Parameters are
                  shown with their plant unit for easy identification.
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {parameters.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No parameters available</div>
                  ) : (
                    parameters.map((param) => (
                      <label key={param.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedProductionParameters.includes(param.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductionParameters([
                                ...selectedProductionParameters,
                                param.id,
                              ]);
                            } else {
                              setSelectedProductionParameters(
                                selectedProductionParameters.filter((id) => id !== param.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {param.parameter}{' '}
                          <span className="text-xs text-gray-500">
                            ({param.unit} - {param.category})
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedProductionParameters([]);
                    setShowProductionTrendSettings(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowProductionTrendSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    saveProductionParameters(selectedProductionParameters);
                    setShowProductionTrendSettings(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantOperationsDashboard;
