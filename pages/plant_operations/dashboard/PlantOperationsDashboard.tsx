import React, { useState, useMemo, useEffect, memo } from "react";
import { useCcrParameterData } from "../../../hooks/useCcrParameterData";
import { useCopParametersSupabase } from "../../../hooks/useCopParametersSupabase";
import { useWorkInstructions } from "../../../hooks/useWorkInstructions";
import { useParameterSettings } from "../../../hooks/useParameterSettings";
import { usePlantUnits } from "../../../hooks/usePlantUnits";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { usePermissions } from "../../../utils/permissions";
import { PermissionLevel } from "../../../types";
import { useDashboardDataProcessor } from "../../../hooks/useDashboardDataProcessor";
import Modal from "../../../components/Modal";
import { formatDate, formatNumber } from "../../../utils/formatters";
import { CcrParameterData } from "../../../types";
import LazyChart from "../../../components/LazyChart";

interface DashboardData {
  timestamp: string;
  production: number;
  efficiency: number;
  quality: number;
  downtime: number;
  energy: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Memoized Chart Components for better performance
interface ProductionTrendChartProps {
  data: any[];
  parameters: any[];
  selectedProductionParameters: string[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

const ProductionTrendChart = memo<ProductionTrendChartProps>(
  ({
    data,
    parameters,
    selectedProductionParameters,
    selectedPlantCategory,
    selectedPlantUnit,
  }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10 days per page

    const filteredParameters = useMemo(() => {
      return parameters.filter((param) => {
        const categoryMatch =
          selectedPlantCategory === "all" ||
          param.category === selectedPlantCategory;
        const unitMatch =
          selectedPlantUnit === "all" || param.unit === selectedPlantUnit;
        return categoryMatch && unitMatch;
      });
    }, [parameters, selectedPlantCategory, selectedPlantUnit]);

    const displayParameters = useMemo(() => {
      return selectedProductionParameters.length === 0
        ? filteredParameters.slice(0, 5) // Limit to 5 parameters for readability
        : selectedProductionParameters
            .map((paramId) => {
              return parameters.find((p) => p.id === paramId);
            })
            .filter(Boolean);
    }, [selectedProductionParameters, filteredParameters, parameters]);

    // Calculate pagination
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Paginated data
    const paginatedData = useMemo(() => {
      return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    // Reset to first page when filters change
    useEffect(() => {
      setCurrentPage(1);
    }, [
      selectedPlantCategory,
      selectedPlantUnit,
      selectedProductionParameters,
    ]);

    const handlePageChange = (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Reset to first page
    };

    return (
      <div className="space-y-4">
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="items-per-page"
                className="text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                Show:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value={5}>5 days</option>
                <option value={10}>10 days</option>
                <option value={15}>15 days</option>
                <option value={20}>20 days</option>
                <option value={31}>31 days</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
              {totalItems} days
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paginatedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              }}
            />
            <Legend />
            {displayParameters.map((param, index) => (
              <Line
                key={param.id}
                type="monotone"
                dataKey={param.parameter}
                stroke={`hsl(${index * 60}, 70%, 50%)`}
                strokeWidth={2}
                name={`${param.parameter} (${param.unit})`}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

ProductionTrendChart.displayName = "ProductionTrendChart";

interface CopAnalysisChartProps {
  data: any[];
}

const CopAnalysisChart = memo<CopAnalysisChartProps>(({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#8884d8" name="Actual" />
      <Bar dataKey="target" fill="#82ca9d" name="Target" />
    </BarChart>
  </ResponsiveContainer>
));

CopAnalysisChart.displayName = "CopAnalysisChart";

interface WorkInstructionsChartProps {
  data: any[];
}

const WorkInstructionsChart = memo<WorkInstructionsChartProps>(({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));

WorkInstructionsChart.displayName = "WorkInstructionsChart";

const PlantOperationsDashboard: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);

  // Check permissions using the proper permission system
  const hasDashboardAccess = permissionChecker.hasPermission(
    "plant_operations",
    PermissionLevel.READ
  );

  // Move all hooks to the top before any conditional returns
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPlantCategory, setSelectedPlantCategory] =
    useState<string>("all");
  const [selectedPlantUnit, setSelectedPlantUnit] = useState<string>("all");

  // Production Trend Settings State
  const [showProductionTrendSettings, setShowProductionTrendSettings] =
    useState(false);
  const [selectedProductionParameters, setSelectedProductionParameters] =
    useState<string[]>([]);

  // Check if user is Super Admin
  const isSuperAdmin = currentUser?.role === "Super Admin";

  // Load saved parameter selections from localStorage
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = localStorage.getItem("productionTrendParameters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedProductionParameters(parsed);
        } catch (error) {
          console.error(
            "Error parsing saved production trend parameters:",
            error
          );
        }
      }
    }
  }, [isSuperAdmin]);

  // Save parameter selections to localStorage
  const saveProductionParameters = (parameters: string[]) => {
    if (isSuperAdmin) {
      localStorage.setItem(
        "productionTrendParameters",
        JSON.stringify(parameters)
      );
      setSelectedProductionParameters(parameters);
    }
  };

  // Data hooks
  const { getDataForDate, getDataForDateRange } = useCcrParameterData();
  const { copParameterIds } = useCopParametersSupabase();
  const { instructions: workInstructions } = useWorkInstructions();
  const { records: parameters } = useParameterSettings();
  const { records: plantUnits } = usePlantUnits();

  const [ccrData, setCcrData] = useState<CcrParameterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch CCR data for selected month/year
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get data for the entire selected month using batch query
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        // Single batch query for entire month - much more efficient!
        const allData = await getDataForDateRange(
          startDateStr,
          endDateStr,
          selectedPlantUnit
        );

        setCcrData(allData);
      } catch (err) {
        console.error("Error fetching CCR data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setCcrData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    selectedMonth,
    selectedYear,
    getDataForDateRange,
    selectedPlantCategory,
    selectedPlantUnit,
  ]);

  // Use custom hook for data processing - moved to top with other hooks
  const { chartData, keyMetrics, copAnalysisData, productionTrendData } =
    useDashboardDataProcessor(
      ccrData,
      parameters,
      copParameterIds,
      selectedPlantCategory,
      selectedPlantUnit,
      selectedProductionParameters,
      selectedMonth,
      selectedYear
    );

  // Work Instructions summary - moved to top with other hooks
  const workInstructionsSummary = useMemo(() => {
    const byActivity = workInstructions.reduce((acc, instruction) => {
      acc[instruction.activity] = (acc[instruction.activity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
        selectedPlantCategory === "all" ||
        param.category === selectedPlantCategory;
      const unitMatch =
        selectedPlantUnit === "all" || param.unit === selectedPlantUnit;

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
          ? (hourlyValues as number[]).reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            ) / hourlyValues.length
          : 0;
      const deviation = param?.max_value
        ? ((avgValue - param.max_value) / param.max_value) * 100
        : 0;

      return {
        id: item.id,
        parameter: param?.parameter || "Unknown",
        unit: param?.unit || "N/A",
        category: param?.category || "N/A",
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
    if (!selectedPlantCategory || selectedPlantCategory === "all")
      return [...new Set(plantUnits.map((unit) => unit.unit))].sort();
    return plantUnits
      .filter((unit) => unit.category === selectedPlantCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedPlantCategory]);

  // Reset unit selection when category changes
  useEffect(() => {
    if (selectedPlantCategory === "all") {
      setSelectedPlantUnit("all");
    } else if (
      unitsForCategory.length > 0 &&
      !unitsForCategory.includes(selectedPlantUnit) &&
      selectedPlantUnit !== "all"
    ) {
      setSelectedPlantUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedPlantUnit("all");
    }
  }, [unitsForCategory, selectedPlantUnit, selectedPlantCategory]);

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
          <div className="text-red-600 text-lg font-semibold mb-2">
            Access Denied
          </div>
          <div className="text-gray-600">
            You don't have permission to view this dashboard.
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
          <div className="text-red-600 text-lg font-semibold mb-2">
            Error Loading Dashboard
          </div>
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
    <div className="p-6 space-y-6">
      {/* Header with Standard Filter Layout */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Plant Operations Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Monitor performa pabrik dan analisis data operasional
            </p>
            {/* Filter Status Indicators */}
            {(selectedPlantCategory !== "all" ||
              selectedPlantUnit !== "all") && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  📊 Category:{" "}
                  {selectedPlantCategory === "all"
                    ? "All"
                    : selectedPlantCategory}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  🏭 Unit:{" "}
                  {selectedPlantUnit === "all" ? "All" : selectedPlantUnit}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  📅 Month: {selectedMonth}/{selectedYear}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="plant-category"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="plant-category"
                value={selectedPlantCategory}
                onChange={(e) => setSelectedPlantCategory(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                <option value="all">All Categories</option>
                {plantCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="plant-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="plant-unit"
                value={selectedPlantUnit}
                onChange={(e) => setSelectedPlantUnit(e.target.value)}
                disabled={
                  selectedPlantCategory !== "all" &&
                  unitsForCategory.length === 0
                }
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <option value="all">All Units</option>
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="select-month"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Select Month:
              </label>
              <select
                id="select-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="select-year"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Select Year:
              </label>
              <select
                id="select-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Production
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatNumber(keyMetrics.totalProduction)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">
            Average Efficiency
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatNumber(keyMetrics.averageEfficiency)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Parameters
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {keyMetrics.totalParameters}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">
            Active COP Parameters
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {keyMetrics.activeCopParameters}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Production Trend</h3>
            {isSuperAdmin && (
              <button
                onClick={() => setShowProductionTrendSettings(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Configure Production Trend Parameters"
              >
                <svg
                  className="w-4 h-4 mr-1"
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
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-lg font-medium">No Production Data</div>
                <div className="text-sm">
                  No data available for the selected filters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COP Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">COP Analysis</h3>
          {copAnalysisData.length > 0 ? (
            <LazyChart>
              <CopAnalysisChart data={copAnalysisData} />
            </LazyChart>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-lg font-medium">No COP Analysis Data</div>
                <div className="text-sm">
                  No COP parameters found for the selected filters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Work Instructions Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            Work Instructions by Activity
          </h3>
          {workInstructionsSummary.length > 0 ? (
            <LazyChart>
              <WorkInstructionsChart data={workInstructionsSummary} />
            </LazyChart>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-lg font-medium">No Work Instructions</div>
                <div className="text-sm">No work instructions available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CCR Parameters Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            CCR Parameters{" "}
            {selectedPlantCategory !== "all" || selectedPlantUnit !== "all" ? (
              <span className="text-sm font-normal text-gray-500">
                (
                {selectedPlantCategory !== "all"
                  ? selectedPlantCategory
                  : "All Categories"}
                {selectedPlantUnit !== "all" ? ` - ${selectedPlantUnit}` : ""})
              </span>
            ) : null}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Parameter</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Actual</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {ccrTableData.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.parameter}</td>
                    <td className="px-4 py-2">{item.unit}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{formatNumber(item.avgValue)}</td>
                    <td className="px-4 py-2">{formatNumber(item.target)}</td>
                    <td
                      className={`px-4 py-2 ${
                        item.deviation > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {item.deviation > 0 ? "+" : ""}
                      {formatNumber(item.deviation)}%
                    </td>
                  </tr>
                ))}
                {ccrTableData.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No CCR parameters found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Instructions Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            Recent Work Instructions{" "}
            {selectedPlantCategory !== "all" || selectedPlantUnit !== "all" ? (
              <span className="text-sm font-normal text-gray-500">
                (Viewing all instructions - filters apply to operational data
                only)
              </span>
            ) : null}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Activity</th>
                  <th className="px-4 py-2 text-left">Document Title</th>
                  <th className="px-4 py-2 text-left">Doc Code</th>
                </tr>
              </thead>
              <tbody>
                {workInstructions.slice(0, 10).map((instruction, index) => (
                  <tr key={instruction.id} className="border-t">
                    <td className="px-4 py-2">{instruction.activity}</td>
                    <td className="px-4 py-2">{instruction.doc_title}</td>
                    <td className="px-4 py-2">{instruction.doc_code}</td>
                  </tr>
                ))}
                {workInstructions.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No work instructions available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Production Trend Settings Modal */}
      {showProductionTrendSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Production Trend Settings
              </h3>
              <button
                onClick={() => setShowProductionTrendSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                Select which parameters to display in the Production Trend
                chart. Parameters are shown with their plant unit for easy
                identification.
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {parameters
                  .filter((param) => {
                    const categoryMatch =
                      selectedPlantCategory === "all" ||
                      param.category === selectedPlantCategory;
                    const unitMatch =
                      selectedPlantUnit === "all" ||
                      param.unit === selectedPlantUnit;
                    return categoryMatch && unitMatch;
                  })
                  .map((param) => (
                    <label
                      key={param.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductionParameters.includes(
                          param.id
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductionParameters([
                              ...selectedProductionParameters,
                              param.id,
                            ]);
                          } else {
                            setSelectedProductionParameters(
                              selectedProductionParameters.filter(
                                (id) => id !== param.id
                              )
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {param.parameter}{" "}
                        <span className="text-xs text-gray-500">
                          ({param.unit})
                        </span>
                      </span>
                    </label>
                  ))}
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
  );
};

export default PlantOperationsDashboard;
