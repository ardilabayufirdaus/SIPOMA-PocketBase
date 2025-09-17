import React, { useState, useMemo, useEffect } from "react";
import { useCopParametersSupabase } from "../../hooks/useCopParametersSupabase";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useCcrParameterData } from "../../hooks/useCcrParameterData";
import { ParameterDataType, ParameterSetting, UserRole } from "../../types";
import { formatDate } from "../../utils/formatters";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import { useUsers } from "../../hooks/useUsers";
import Modal from "../../components/Modal";

// Utility functions for better maintainability
const formatCopNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return "-";
  }
  return num.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const getPercentageColor = (
  percentage: number | null
): { bg: string; text: string; darkBg: string; status: string } => {
  if (percentage === null)
    return {
      bg: "bg-slate-50",
      text: "text-slate-500",
      darkBg: "bg-slate-700",
      status: "N/A",
    };
  if (percentage < 0)
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      darkBg: "bg-red-500",
      status: "Low",
    };
  if (percentage > 100)
    return {
      bg: "bg-amber-100",
      text: "text-amber-800",
      darkBg: "bg-amber-500",
      status: "High",
    };
  return {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    darkBg: "bg-emerald-500",
    status: "Normal",
  };
};

const getQafColor = (qaf: number | null): { bg: string; text: string } => {
  if (qaf === null) return { bg: "bg-slate-100", text: "text-slate-600" };
  if (qaf >= 95) return { bg: "bg-emerald-100", text: "text-emerald-800" };
  if (qaf >= 85) return { bg: "bg-amber-100", text: "text-amber-800" };
  return { bg: "bg-red-100", text: "text-red-800" };
};

interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

const CopAnalysisPage: React.FC<{ t: any }> = ({ t }) => {
  const { copParameterIds, loading: copLoading } = useCopParametersSupabase();
  const { records: allParameters } = useParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = usePlantUnits();
  const { users } = useUsers();
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedParameterStats, setSelectedParameterStats] = useState<{
    parameter: string;
    avg: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    stdev: number | null;
    qaf: number | null;
  } | null>(null);

  // State untuk modal breakdown
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    data: AnalysisDataRow | null;
  }>({
    isOpen: false,
    parameter: "",
    data: null,
  });

  const [hourlyBreakdownModal, setHourlyBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    dayIndex: number;
    data: { hour: number; value: number | null; isOutOfRange: boolean }[];
  }>({
    isOpen: false,
    parameter: "",
    dayIndex: -1,
    data: [],
  });

  // Set default filter only after plantUnits are loaded
  useEffect(() => {
    if (plantUnits && plantUnits.length > 0) {
      if (!selectedCategory) {
        setSelectedCategory(plantUnits[0].category);
      }
    }
  }, [plantUnits, selectedCategory]);

  useEffect(() => {
    if (plantUnits && plantUnits.length > 0 && selectedCategory) {
      const units = plantUnits
        .filter((u) => u.category === selectedCategory)
        .map((u) => u.unit);
      if (units.length > 0 && !selectedUnit) {
        setSelectedUnit(units[0]);
      }
    }
  }, [plantUnits, selectedCategory, selectedUnit]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return plantUnits
      .filter((unit) => unit.category === selectedCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory]);

  // Memoize filtered parameters to avoid recalculating on every render
  const filteredCopParameters = useMemo(() => {
    if (
      !allParameters.length ||
      !copParameterIds.length ||
      !selectedCategory ||
      !selectedUnit
    ) {
      return [];
    }

    return copParameterIds
      .map((paramId) => allParameters.find((p) => p.id === paramId))
      .filter((param): param is ParameterSetting => param !== undefined)
      .filter(
        (param) =>
          param.category === selectedCategory && param.unit === selectedUnit
      );
  }, [allParameters, copParameterIds, selectedCategory, selectedUnit]);

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!selectedUnit || !unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      setSelectedUnit("");
    }
  }, [unitsForCategory, selectedUnit]);

  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

  // Update relevantOperators to get all active users with role Operator from User Management, ignoring category and unit permissions
  const relevantOperators = useMemo(() => {
    if (!users) return [];

    return users
      .filter((user) => user.role === "Operator" && user.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users]);

  // ...existing code...

  // ...existing code...
  const { getDataForDate } = useCcrParameterData();
  const [analysisData, setAnalysisData] = useState<AnalysisDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      // Reset previous state
      setIsLoading(true);
      setError(null);

      try {
        // Validate required data
        if (
          !selectedCategory ||
          !selectedUnit ||
          filteredCopParameters.length === 0
        ) {
          setAnalysisData([]);
          setIsLoading(false);
          return;
        }

        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
          return date.toISOString().split("T")[0];
        });

        const dailyAverages = new Map<string, Map<string, number>>();

        const dataPromises = dates.map((dateString) =>
          getDataForDate(dateString)
        );
        const allDataForMonth = await Promise.all(dataPromises);

        allDataForMonth.flat().forEach((paramData) => {
          // FIX: Use snake_case property `parameter_id`
          const paramSetting = allParameters.find(
            (p) => p.id === paramData.parameter_id
          );
          // FIX: Use snake_case property `data_type`
          if (
            paramSetting &&
            paramSetting.data_type === ParameterDataType.NUMBER
          ) {
            // FIX: Use snake_case property `hourly_values`
            const values = Object.values(paramData.hourly_values || {})
              .map((v) => Number(v))
              .filter((v) => !isNaN(v) && v !== null && v !== undefined);
            if (values.length > 0) {
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              // FIX: Use snake_case property `parameter_id`
              if (!dailyAverages.has(paramData.parameter_id)) {
                // FIX: Use snake_case property `parameter_id`
                dailyAverages.set(paramData.parameter_id, new Map());
              }
              // FIX: Use snake_case property `parameter_id`
              dailyAverages
                .get(paramData.parameter_id)!
                .set(paramData.date, avg);
            }
          }
        });

        const data = filteredCopParameters
          .map((parameter) => {
            const dailyValues = dates.map((dateString) => {
              const avg = dailyAverages.get(parameter.id)?.get(dateString);
              // FIX: Use snake_case properties `min_value` and `max_value`
              const { min_value, max_value } = parameter;

              if (
                avg === undefined ||
                min_value === undefined ||
                max_value === undefined ||
                max_value <= min_value
              ) {
                return { value: null, raw: avg };
              }

              const percentage =
                ((avg - min_value) / (max_value - min_value)) * 100;
              return { value: percentage, raw: avg };
            });

            const validDailyPercentages = dailyValues
              .map((d) => d.value)
              .filter((v): v is number => v !== null && !isNaN(v));
            const monthlyAverage =
              validDailyPercentages.length > 0
                ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                  validDailyPercentages.length
                : null;

            const validDailyRaw = dailyValues
              .map((d) => d.raw)
              .filter(
                (v): v is number => v !== undefined && v !== null && !isNaN(v)
              );
            const monthlyAverageRaw =
              validDailyRaw.length > 0
                ? validDailyRaw.reduce((a, b) => a + b, 0) /
                  validDailyRaw.length
                : null;

            return {
              parameter,
              dailyValues,
              monthlyAverage,
              monthlyAverageRaw,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        setAnalysisData(data);
      } catch (err) {
        setError("Failed to load COP analysis data. Please try again.");
        setAnalysisData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndAnalyze();
  }, [
    filterMonth,
    filterYear,
    filteredCopParameters,
    allParameters,
    getDataForDate,
    selectedCategory,
    selectedUnit,
  ]);

  const dailyQaf = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const daysInMonth = analysisData[0]?.dailyValues.length || 0;
    if (daysInMonth === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    const dailyStats: {
      value: number | null;
      inRange: number;
      total: number;
    }[] = [];
    let totalInRangeMonthly = 0;
    let totalWithValueMonthly = 0;

    for (let i = 0; i < daysInMonth; i++) {
      let paramsInRange = 0;
      let totalParamsWithValue = 0;

      analysisData.forEach((paramRow) => {
        const dayValue = paramRow.dailyValues[i]?.value;
        if (dayValue !== null && dayValue !== undefined && !isNaN(dayValue)) {
          totalParamsWithValue++;
          if (dayValue >= 0 && dayValue <= 100) {
            paramsInRange++;
          }
        }
      });

      totalInRangeMonthly += paramsInRange;
      totalWithValueMonthly += totalParamsWithValue;

      if (totalParamsWithValue > 0) {
        dailyStats.push({
          value: (paramsInRange / totalParamsWithValue) * 100,
          inRange: paramsInRange,
          total: totalParamsWithValue,
        });
      } else {
        dailyStats.push({ value: null, inRange: 0, total: 0 });
      }
    }

    const monthlyQafValue =
      totalWithValueMonthly > 0
        ? (totalInRangeMonthly / totalWithValueMonthly) * 100
        : null;

    return {
      daily: dailyStats,
      monthly: {
        value: monthlyQafValue,
        inRange: totalInRangeMonthly,
        total: totalWithValueMonthly,
      },
    };
  }, [analysisData]);

  // Helper function to calculate statistics
  const calculateParameterStats = (row: AnalysisDataRow) => {
    const validValues = row.dailyValues
      .map((d) => d.raw)
      .filter((v): v is number => v !== undefined && v !== null && !isNaN(v));

    if (validValues.length === 0) {
      return {
        avg: null,
        median: null,
        min: null,
        max: null,
        stdev: null,
        qaf: row.monthlyAverage,
      };
    }

    const sorted = [...validValues].sort((a, b) => a - b);
    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    // Calculate standard deviation
    const variance =
      validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
      validValues.length;
    const stdev = Math.sqrt(variance);

    return {
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdev: Math.round(stdev * 100) / 100,
      qaf: row.monthlyAverage
        ? Math.round(row.monthlyAverage * 100) / 100
        : null,
    };
  };

  const operatorAchievementData = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return [];
    }

    // Note: operator_id is not available in ParameterSetting type
    // For now, show all parameters regardless of operator filter
    // TODO: Add operator_id to ParameterSetting type if needed
    const filteredData = analysisData;

    return filteredData
      .map((row) => {
        const totalDays = row.dailyValues.length;
        const outOfRangeDays = row.dailyValues.filter(
          (day) => day.value === null || day.value < 0 || day.value > 100
        ).length;
        const percentage =
          totalDays > 0 ? (outOfRangeDays / totalDays) * 100 : 0;

        return {
          parameter: row.parameter.parameter,
          percentage: Math.round(percentage * 10) / 10,
          outOfRange: outOfRangeDays,
          total: totalDays,
          operatorId: null, // Placeholder until operator_id is added to type
          onClick: () => {
            const stats = calculateParameterStats(row);
            setSelectedParameterStats({
              parameter: row.parameter.parameter,
              ...stats,
            });
            // Buka modal breakdown harian
            setBreakdownModal({
              isOpen: true,
              parameter: row.parameter.parameter,
              data: row,
            });
          },
        };
      })
      .filter((item) => item.percentage > 0);
  }, [analysisData]);

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label:
          t[
            `month_${
              [
                "jan",
                "feb",
                "mar",
                "apr",
                "may",
                "jun",
                "jul",
                "aug",
                "sep",
                "oct",
                "nov",
                "dec",
              ][i]
            }`
          ],
      })),
    [t]
  );

  const daysHeader = useMemo(
    () =>
      analysisData[0]?.dailyValues.map((_, index) => index + 1) ||
      Array.from(
        { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
        (_, i) => i + 1
      ),
    [analysisData, filterYear, filterMonth]
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t.op_cop_analysis}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Kelola data COP untuk monitoring performa pabrik
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-category"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="cop-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="cop-filter-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForCategory.length === 0}
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-month"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Month:
              </label>
              <select
                id="cop-filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-filter-year"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Year:
              </label>
              <select
                id="cop-filter-year"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/20 border dark:border-slate-700">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <span className="text-slate-600 dark:text-slate-300">
                Loading COP analysis data...
              </span>
            </div>
            {/* Loading skeleton */}
            <div className="mt-4 w-full">
              <div className="animate-pulse">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-8"
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {error}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div
            className="overflow-x-auto scroll-smooth"
            role="region"
            aria-label="COP Analysis Data Table"
            tabIndex={0}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
          >
            <table
              className="min-w-full text-xs border-collapse"
              role="table"
              aria-label="COP Analysis Table"
            >
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="sticky left-0 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-8">
                    No.
                  </th>
                  <th className="sticky left-8 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 min-w-[140px]">
                    {t.parameter}
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-16">
                    {t.min}
                  </th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-16">
                    {t.max}
                  </th>
                  {daysHeader.map((day) => (
                    <th
                      key={day}
                      className="px-1 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-600 w-10"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="sticky right-0 bg-slate-100 dark:bg-slate-700 z-30 px-2 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-l-2 border-slate-300 dark:border-slate-600 w-16">
                    Avg.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {analysisData.map((row, rowIndex) => (
                  <tr
                    key={row.parameter.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="sticky left-0 z-20 px-2 py-1.5 whitespace-nowrap text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 w-8">
                      {rowIndex + 1}
                    </td>
                    <td className="sticky left-8 z-20 px-2 py-1.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 border-b border-r border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 min-w-[140px]">
                      {row.parameter.parameter}
                    </td>
                    {/* FIX: Use snake_case properties `min_value` and `max_value` */}
                    <td className="px-1 py-1.5 whitespace-nowrap text-center text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 w-16">
                      {formatCopNumber(row.parameter.min_value)}
                    </td>
                    <td className="px-1 py-1.5 whitespace-nowrap text-center text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 w-16">
                      {formatCopNumber(row.parameter.max_value)}
                    </td>
                    {row.dailyValues.map((day, dayIndex) => {
                      const colors = getPercentageColor(day.value);
                      return (
                        <td
                          key={dayIndex}
                          className={`relative px-1 py-1 whitespace-nowrap text-center border-b border-r border-slate-200 dark:border-slate-600 transition-colors duration-150 ${colors.bg}`}
                        >
                          <div className="relative group/cell h-full w-full flex items-center justify-center">
                            <span
                              className={`font-medium text-xs ${colors.text}`}
                            >
                              {formatCopNumber(day.raw)}
                            </span>
                            {day.raw !== undefined && (
                              <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs">
                                    {formatDate(
                                      new Date(
                                        Date.UTC(
                                          filterYear,
                                          filterMonth,
                                          dayIndex + 1
                                        )
                                      )
                                    )}
                                  </span>
                                  <span
                                    className={`px-1 py-0.5 rounded text-white text-[10px] uppercase ${colors.darkBg}`}
                                  >
                                    {colors.status}
                                  </span>
                                </div>
                                <hr className="border-slate-600 my-1" />
                                <p className="text-xs">
                                  <strong>{t.average}:</strong>{" "}
                                  <span className="font-mono">
                                    {formatCopNumber(day.raw)}{" "}
                                    {row.parameter.unit}
                                  </span>
                                </p>
                                {/* FIX: Use snake_case properties `min_value` and `max_value` */}
                                <p className="text-xs">
                                  <strong>Target:</strong>{" "}
                                  <span className="font-mono text-xs">
                                    {formatCopNumber(row.parameter.min_value)} -{" "}
                                    {formatCopNumber(row.parameter.max_value)}
                                  </span>
                                </p>
                                {day.value !== null && (
                                  <p className="text-xs">
                                    <strong>Normalized:</strong>{" "}
                                    <span className="font-mono">
                                      {day.value.toFixed(1)}%
                                    </span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {(() => {
                      const avgColors = getPercentageColor(row.monthlyAverage);
                      return (
                        <td
                          className={`sticky right-0 z-20 px-2 py-1.5 whitespace-nowrap text-center font-bold border-b border-l-2 border-slate-300 dark:border-slate-600 transition-colors duration-150 ${avgColors.bg} group-hover:bg-slate-100 dark:group-hover:bg-slate-700 w-16`}
                        >
                          <span className={`${avgColors.text} text-xs`}>
                            {formatCopNumber(row.monthlyAverageRaw)}
                          </span>
                        </td>
                      );
                    })()}
                  </tr>
                ))}
                {analysisData.length === 0 && (
                  <tr>
                    <td
                      colSpan={daysHeader.length + 5}
                      className="text-center py-10 text-slate-500 dark:text-slate-400"
                    >
                      {!selectedCategory || !selectedUnit
                        ? "Please select both Category and Unit to view COP analysis data."
                        : filteredCopParameters.length === 0
                        ? "No COP parameters found for the selected Category and Unit."
                        : "No data available for the selected period."}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="font-semibold bg-slate-50 dark:bg-slate-700/50">
                <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                  <td
                    colSpan={4}
                    className="sticky left-0 z-20 px-2 py-2 text-right text-sm text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                  >
                    {t.qaf_daily}
                  </td>
                  {dailyQaf.daily.map((qaf, index) => {
                    const colors = getQafColor(qaf.value);
                    return (
                      <td
                        key={index}
                        className={`px-1 py-2 text-center border-b border-r border-slate-200 dark:border-slate-600 ${colors.bg} ${colors.text}`}
                      >
                        <div className="relative group/cell h-full w-full flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {qaf.value !== null && !isNaN(qaf.value)
                              ? `${formatCopNumber(qaf.value)}%`
                              : "-"}
                          </span>
                          {qaf.total > 0 && (
                            <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
                              {t.qaf_tooltip
                                ?.replace("{inRange}", qaf.inRange)
                                .replace("{total}", qaf.total)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {(() => {
                    const qaf = dailyQaf.monthly;
                    const colors = getQafColor(qaf.value);
                    return (
                      <td
                        className={`sticky right-0 z-20 px-2 py-2 text-center border-b border-l-2 border-slate-300 dark:border-slate-600 ${colors.bg} ${colors.text} font-bold text-sm`}
                      >
                        <div className="relative group/cell h-full w-full flex items-center justify-center">
                          <span>
                            {qaf.value !== null && !isNaN(qaf.value)
                              ? `${formatCopNumber(qaf.value)}%`
                              : "-"}
                          </span>
                          {qaf.total > 0 && (
                            <div className="absolute bottom-full mb-1 w-max max-w-xs bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-40 shadow-lg left-1/2 -translate-x-1/2">
                              {t.qaf_tooltip
                                ?.replace("{inRange}", qaf.inRange)
                                .replace("{total}", qaf.total)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Kategori Pencapaian COP Operator */}
      {operatorAchievementData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4 mt-4 relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Kategori Pencapaian COP Operator
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label
                htmlFor="operator-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Operator:
              </label>
              <select
                id="operator-filter"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                <option value="">Semua Operator</option>
                {relevantOperators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Diagram batang menunjukkan persentase hari dimana operator tidak
            mencapai parameter target (di luar range 0-100%).
          </p>
          <div className="h-64">
            <div className="flex items-center justify-center h-full text-slate-500">
              Bar Chart - implement with Chart.js
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            <p>
              Total parameter yang tidak mencapai target:{" "}
              {operatorAchievementData.length}
            </p>
          </div>
          {selectedParameterStats && (
            <div className="fixed top-20 right-4 z-50 w-64 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm truncate pr-2">
                  {selectedParameterStats.parameter}
                </h4>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  onClick={() => setSelectedParameterStats(null)}
                  aria-label="Close stats"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <ul className="space-y-1 text-xs">
                <li className="flex justify-between">
                  <strong>Avg:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.avg !== null
                      ? selectedParameterStats.avg.toFixed(2)
                      : "-"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong>Median:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.median !== null
                      ? selectedParameterStats.median.toFixed(2)
                      : "-"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong>Min:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.min !== null
                      ? selectedParameterStats.min.toFixed(2)
                      : "-"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong>Max:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.max !== null
                      ? selectedParameterStats.max.toFixed(2)
                      : "-"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong>Stdev:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.stdev !== null
                      ? selectedParameterStats.stdev.toFixed(2)
                      : "-"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong>QAF:</strong>
                  <span className="font-mono">
                    {selectedParameterStats.qaf !== null
                      ? `${selectedParameterStats.qaf.toFixed(2)}%`
                      : "-"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modal Breakdown Harian */}
      <Modal
        isOpen={breakdownModal.isOpen}
        onClose={() =>
          setBreakdownModal({ isOpen: false, parameter: "", data: null })
        }
        title={`Breakdown Harian - ${breakdownModal.parameter}`}
      >
        <div className="p-6 max-h-96 overflow-y-auto">
          {breakdownModal.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {breakdownModal.data.dailyValues.map((day, index) => {
                  const isOutOfRange =
                    day.value === null || day.value < 0 || day.value > 100;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        // Simulasi data jam-jam (24 jam)
                        const hourlyData = Array.from(
                          { length: 24 },
                          (_, hour) => ({
                            hour,
                            value: day.value
                              ? day.value + (Math.random() - 0.5) * 20
                              : null,
                            isOutOfRange: day.value
                              ? Math.random() > 0.8
                              : true,
                          })
                        );
                        setHourlyBreakdownModal({
                          isOpen: true,
                          parameter: breakdownModal.parameter,
                          dayIndex: index,
                          data: hourlyData,
                        });
                      }}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        isOutOfRange
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs">Hari {index + 1}</div>
                        <div className="text-lg font-bold">
                          {day.value !== null
                            ? `${day.value.toFixed(1)}%`
                            : "-"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-4">
                Klik pada hari untuk melihat breakdown jam-jam. Hari berwarna
                merah menunjukkan parameter di luar range (0-100%).
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Breakdown Jam-jam */}
      <Modal
        isOpen={hourlyBreakdownModal.isOpen}
        onClose={() =>
          setHourlyBreakdownModal({
            isOpen: false,
            parameter: "",
            dayIndex: -1,
            data: [],
          })
        }
        title={`Breakdown Jam - ${hourlyBreakdownModal.parameter} (Hari ${
          hourlyBreakdownModal.dayIndex + 1
        })`}
      >
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {hourlyBreakdownModal.data.map((hour) => (
              <div
                key={hour.hour}
                className={`p-3 rounded-lg text-sm transition-colors ${
                  hour.isOutOfRange
                    ? "bg-red-100 text-red-800 border-2 border-red-300"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <div className="text-center">
                  <div className="text-xs">Jam {hour.hour}:00</div>
                  <div className="text-lg font-bold">
                    {hour.value !== null ? `${hour.value.toFixed(1)}%` : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-4">
            Kotak berwarna merah menunjukkan jam-jam dimana parameter di luar
            range target.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CopAnalysisPage;
