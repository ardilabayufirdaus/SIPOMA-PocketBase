import React, { useState, useMemo, useRef } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Brush,
} from "recharts";
import { PackingPlantStockRecord, PackingPlantMasterRecord } from "../../types";
import { formatDate, formatNumber } from "../../utils/formatters";
import ArchiveBoxIcon from "../../components/icons/ArchiveBoxIcon";
import ArrowTrendingDownIcon from "../../components/icons/ArrowTrendingDownIcon";
import ClockIcon from "../../components/icons/ClockIcon";
import ArrowTrendingUpIcon from "../../components/icons/ArrowTrendingUpIcon";
import ExclamationTriangleIcon from "../../components/icons/ExclamationTriangleIcon";
import {
  InteractiveCardModal,
  BreakdownData,
} from "../../components/InteractiveCardModal";

interface ForecastMetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  breakdownData?: BreakdownData;
  onClick?: () => void;
}

const ForecastMetricCard: React.FC<ForecastMetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  breakdownData,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (breakdownData) {
      setIsModalOpen(true);
    }
  };

  const isInteractive = breakdownData || onClick;

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all duration-200 ${
          isInteractive
            ? "cursor-pointer hover:shadow-md hover:scale-105"
            : "hover:shadow-md"
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 mr-4 flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 truncate">
                {title}
              </p>
              {isInteractive && (
                <div className="text-slate-400 dark:text-slate-500">
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
              )}
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-2xl font-bold text-slate-900 truncate">
                {value}
              </p>
              {unit && (
                <p className="text-sm font-medium text-slate-500 flex-shrink-0">
                  {unit}
                </p>
              )}
            </div>
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

interface PageProps {
  t: any;
  areas: string[];
  stockRecords: PackingPlantStockRecord[];
  masterData: PackingPlantMasterRecord[];
}

const PackingPlantStockForecast: React.FC<PageProps> = ({
  t,
  areas,
  stockRecords,
  masterData,
}) => {
  // State untuk filter dan chart
  const [filterArea, setFilterArea] = useState(areas[0] || "");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Opsi tahun dan bulan
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
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
  }));

  // Enhanced forecast logic with trend analysis
  const forecastData = useMemo(() => {
    // Filter stockRecords sesuai area, bulan, dan tahun
    const filteredRecords = stockRecords.filter((r) => {
      let yearSupabase = 0;
      let monthSupabase = 0;
      if (r.date && r.date.length >= 10) {
        yearSupabase = parseInt(r.date.substring(0, 4), 10);
        monthSupabase = parseInt(r.date.substring(5, 7), 10) - 1;
      }
      return (
        r.area === filterArea &&
        monthSupabase === filterMonth &&
        yearSupabase === filterYear
      );
    });

    const latestClosingStock =
      filteredRecords.length > 0
        ? Number(filteredRecords[filteredRecords.length - 1].closing_stock)
        : 0;

    const avgDailyStockOut =
      filteredRecords.length > 0
        ? Math.round(
            filteredRecords.reduce((sum, r) => sum + Number(r.stock_out), 0) /
              filteredRecords.length
          )
        : 0;

    const avgDailyStockReceived =
      filteredRecords.length > 0
        ? Math.round(
            filteredRecords.reduce(
              (sum, r) => sum + Number(r.stock_received),
              0
            ) / filteredRecords.length
          )
        : 0;

    const daysUntilEmpty =
      avgDailyStockOut > 0
        ? Math.floor(latestClosingStock / avgDailyStockOut)
        : 0;

    // Calculate trends
    const sortedRecords = [...filteredRecords].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const trendAnalysis = {
      stockOutTrend: 0,
      closingStockTrend: 0,
      efficiency: 0,
    };

    if (sortedRecords.length >= 2) {
      const firstHalf = sortedRecords.slice(
        0,
        Math.floor(sortedRecords.length / 2)
      );
      const secondHalf = sortedRecords.slice(
        Math.floor(sortedRecords.length / 2)
      );

      const firstHalfAvgOut =
        firstHalf.reduce((sum, r) => sum + Number(r.stock_out), 0) /
        firstHalf.length;
      const secondHalfAvgOut =
        secondHalf.reduce((sum, r) => sum + Number(r.stock_out), 0) /
        secondHalf.length;

      const firstHalfAvgStock =
        firstHalf.reduce((sum, r) => sum + Number(r.closing_stock), 0) /
        firstHalf.length;
      const secondHalfAvgStock =
        secondHalf.reduce((sum, r) => sum + Number(r.closing_stock), 0) /
        secondHalf.length;

      trendAnalysis.stockOutTrend =
        ((secondHalfAvgOut - firstHalfAvgOut) / firstHalfAvgOut) * 100;
      trendAnalysis.closingStockTrend =
        ((secondHalfAvgStock - firstHalfAvgStock) / firstHalfAvgStock) * 100;
      trendAnalysis.efficiency =
        avgDailyStockReceived > 0
          ? (avgDailyStockOut / avgDailyStockReceived) * 100
          : 0;
    }

    return {
      latestClosingStock,
      avgDailyStockOut,
      avgDailyStockReceived,
      daysUntilEmpty,
      historicalData: filteredRecords,
      trendAnalysis,
      notEnoughData: filteredRecords.length === 0,
    };
  }, [filterArea, filterMonth, filterYear, stockRecords, masterData]);

  // Enhanced chart data preparation
  const chartData = useMemo(() => {
    const processedData = forecastData.historicalData
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item, index) => {
        const date = new Date(item.date);
        const day = date.getDate();
        const stockOut = Number(item.stock_out);
        const stockReceived = Number(item.stock_received);
        const openingStock = Number(item.opening_stock);
        const closingStock = Number(item.closing_stock);

        // Calculate efficiency and safety metrics
        const turnoverRatio =
          openingStock > 0 ? (stockOut / openingStock) * 100 : 0;
        const safetyLevel =
          closingStock > 100
            ? "Normal"
            : closingStock > 50
            ? "Low"
            : "Critical";
        const stockVariance =
          index > 0
            ? closingStock -
              Number(forecastData.historicalData[index - 1].closing_stock)
            : 0;

        return {
          date: item.date,
          day: day,
          dateFormatted: formatDate(item.date),
          stockOut,
          stockReceived,
          openingStock,
          closingStock,
          projectedStockOut: (item as any).projected_stock_out
            ? Number((item as any).projected_stock_out)
            : stockOut,
          projectedClosingStock: (item as any).projected_closing_stock
            ? Number((item as any).projected_closing_stock)
            : closingStock,
          netFlow: stockReceived - stockOut,
          turnoverRatio: Math.round(turnoverRatio * 10) / 10,
          safetyLevel,
          stockVariance,
          efficiency:
            stockReceived > 0
              ? Math.round((stockOut / stockReceived) * 100)
              : 0,
        };
      });

    // Calculate moving averages for trend lines
    const movingAvgWindow = Math.min(5, processedData.length);
    return processedData.map((item, index) => {
      const start = Math.max(0, index - Math.floor(movingAvgWindow / 2));
      const end = Math.min(processedData.length, start + movingAvgWindow);
      const window = processedData.slice(start, end);

      const avgClosingStock =
        window.reduce((sum, d) => sum + d.closingStock, 0) / window.length;
      const avgStockOut =
        window.reduce((sum, d) => sum + d.stockOut, 0) / window.length;

      return {
        ...item,
        trendClosingStock: Math.round(avgClosingStock),
        trendStockOut: Math.round(avgStockOut),
      };
    });
  }, [forecastData]);

  // Critical thresholds for visual indicators
  const thresholds = {
    critical: 50,
    low: 100,
    normal: 200,
  };

  // Render
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t.forecast_packing_plant_stock}
          </h1>
          <p className="text-lg text-slate-600">
            <span className="text-lg text-slate-600 dark:text-slate-400">
              {t.forecast_packing_plant_stock_subtitle}
            </span>
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="forecast-filter-area"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                {t.filter_by_area}
              </label>
              <select
                id="forecast-filter-area"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="block w-full pl-3 pr-10 py-3 text-base bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="forecast-filter-month"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t.filter_by_month}
                </label>
                <select
                  id="forecast-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="block w-full pl-3 pr-10 py-3 text-base bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-32">
                <label
                  htmlFor="forecast-filter-year"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t.filter_by_year}
                </label>
                <select
                  id="forecast-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="block w-full pl-3 pr-10 py-3 text-base bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      {forecastData.notEnoughData ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <ArchiveBoxIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Data Available
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {t.forecast_no_data}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced Metrics Cards - Compact Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            <ForecastMetricCard
              title={t.forecast_current_stock}
              value={formatNumber(Math.round(forecastData.latestClosingStock))}
              unit="Ton"
              icon={<ArchiveBoxIcon className="w-6 h-6" />}
            />
            <ForecastMetricCard
              title={t.forecast_avg_daily_out}
              value={formatNumber(Math.round(forecastData.avgDailyStockOut))}
              unit="Ton/Day"
              icon={<ArrowTrendingDownIcon className="w-6 h-6" />}
            />
            <ForecastMetricCard
              title="Avg Daily Received"
              value={formatNumber(
                Math.round(forecastData.avgDailyStockReceived)
              )}
              unit="Ton/Day"
              icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
            />
            <ForecastMetricCard
              title={t.forecast_days_until_empty}
              value={
                isFinite(forecastData.daysUntilEmpty)
                  ? formatNumber(Math.floor(forecastData.daysUntilEmpty))
                  : "∞"
              }
              unit="Days"
              icon={
                forecastData.daysUntilEmpty <= 7 ? (
                  <ExclamationTriangleIcon className="w-6 h-6" />
                ) : (
                  <ClockIcon className="w-6 h-6" />
                )
              }
            />
          </div>

          {/* Main Content Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Trend Analysis Cards */}
            <div className="xl:col-span-1">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">
                        Stock Out Trend
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          forecastData.trendAnalysis.stockOutTrend > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {forecastData.trendAnalysis.stockOutTrend > 0
                          ? "+"
                          : ""}
                        {Math.round(
                          forecastData.trendAnalysis.stockOutTrend * 10
                        ) / 10}
                        %
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-full ${
                        forecastData.trendAnalysis.stockOutTrend > 0
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      {forecastData.trendAnalysis.stockOutTrend > 0 ? (
                        <ArrowTrendingUpIcon className="w-6 h-6 text-red-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Stock Level Trend
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          forecastData.trendAnalysis.closingStockTrend > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {forecastData.trendAnalysis.closingStockTrend > 0
                          ? "+"
                          : ""}
                        {Math.round(
                          forecastData.trendAnalysis.closingStockTrend * 10
                        ) / 10}
                        %
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-full ${
                        forecastData.trendAnalysis.closingStockTrend > 0
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {forecastData.trendAnalysis.closingStockTrend > 0 ? (
                        <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">
                        Efficiency Ratio
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          forecastData.trendAnalysis.efficiency > 100
                            ? "text-red-600"
                            : forecastData.trendAnalysis.efficiency > 80
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {Math.round(forecastData.trendAnalysis.efficiency)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100">
                      <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Charts and Table */}
            <div className="xl:col-span-2">
              <div className="space-y-6">
                {/* Enhanced Chart Section - Compact Layout */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {t.forecast_stock_projection_chart}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Interactive analysis of stock movements and trends
                      </p>
                    </div>
                  </div>

                  {chartData.length > 0 ? (
                    <div className="space-y-4">
                      {/* Main Composite Chart - Reduced Height */}
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={chartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="day"
                              tick={{ fontSize: 12, fill: "#64748b" }}
                              tickFormatter={(value) => `Day ${value}`}
                            />
                            <YAxis
                              yAxisId="stock"
                              orientation="left"
                              tick={{ fontSize: 12, fill: "#64748b" }}
                              label={{
                                value: "Stock (Ton)",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <YAxis
                              yAxisId="flow"
                              orientation="right"
                              tick={{ fontSize: 12, fill: "#64748b" }}
                              label={{
                                value: "Daily Flow (Ton)",
                                angle: 90,
                                position: "insideRight",
                              }}
                            />

                            {/* Critical thresholds */}
                            <ReferenceLine
                              y={thresholds.critical}
                              stroke="#ef4444"
                              strokeDasharray="8 8"
                              yAxisId="stock"
                              label={{
                                value: "Critical Level",
                                position: "insideTopRight",
                              }}
                            />
                            <ReferenceLine
                              y={thresholds.low}
                              stroke="#f59e0b"
                              strokeDasharray="5 5"
                              yAxisId="stock"
                              label={{
                                value: "Low Level",
                                position: "insideTopRight",
                              }}
                            />

                            {/* Stock levels as area charts */}
                            <Area
                              yAxisId="stock"
                              type="monotone"
                              dataKey="closingStock"
                              fill="url(#stockGradient)"
                              stroke="#0ea5e9"
                              strokeWidth={2}
                              fillOpacity={0.6}
                              name="Closing Stock"
                            />
                            <Area
                              yAxisId="stock"
                              type="monotone"
                              dataKey="projectedClosingStock"
                              fill="url(#projectedGradient)"
                              stroke="#6366f1"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              fillOpacity={0.3}
                              name="Projected Stock"
                            />

                            {/* Stock flow as bars */}
                            <Bar
                              yAxisId="flow"
                              dataKey="stockOut"
                              fill="#ef4444"
                              name="Stock Out"
                              radius={[2, 2, 0, 0]}
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-out-${index}`}
                                  fill={
                                    entry.stockOut >
                                    forecastData.avgDailyStockOut * 1.2
                                      ? "#dc2626"
                                      : "#ef4444"
                                  }
                                />
                              ))}
                            </Bar>
                            <Bar
                              yAxisId="flow"
                              dataKey="stockReceived"
                              fill="#10b981"
                              name="Stock Received"
                              radius={[2, 2, 0, 0]}
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-in-${index}`}
                                  fill={
                                    entry.stockReceived >
                                    forecastData.avgDailyStockReceived * 1.2
                                      ? "#059669"
                                      : "#10b981"
                                  }
                                />
                              ))}
                            </Bar>

                            {/* Trend lines */}
                            <Line
                              yAxisId="stock"
                              type="monotone"
                              dataKey="trendClosingStock"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={false}
                              strokeDasharray="10 5"
                              name="Stock Trend"
                            />

                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xl border border-slate-600 min-w-[280px]">
                                      <p className="font-semibold text-lg mb-3 text-center border-b border-slate-600 pb-2">
                                        {data.dateFormatted}
                                      </p>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-slate-300 mb-1">
                                            Stock Levels
                                          </p>
                                          <div className="space-y-1">
                                            <p className="flex justify-between">
                                              <span className="text-blue-300">
                                                Opening:
                                              </span>
                                              <span className="font-bold">
                                                {formatNumber(
                                                  data.openingStock
                                                )}{" "}
                                                T
                                              </span>
                                            </p>
                                            <p className="flex justify-between">
                                              <span className="text-blue-400">
                                                Closing:
                                              </span>
                                              <span className="font-bold">
                                                {formatNumber(
                                                  data.closingStock
                                                )}{" "}
                                                T
                                              </span>
                                            </p>
                                            <p className="flex justify-between">
                                              <span className="text-indigo-300">
                                                Projected:
                                              </span>
                                              <span className="font-bold">
                                                {formatNumber(
                                                  data.projectedClosingStock
                                                )}{" "}
                                                T
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-slate-300 mb-1">
                                            Daily Flow
                                          </p>
                                          <div className="space-y-1">
                                            <p className="flex justify-between">
                                              <span className="text-green-300">
                                                Received:
                                              </span>
                                              <span className="font-bold text-green-400">
                                                {formatNumber(
                                                  data.stockReceived
                                                )}{" "}
                                                T
                                              </span>
                                            </p>
                                            <p className="flex justify-between">
                                              <span className="text-red-300">
                                                Out:
                                              </span>
                                              <span className="font-bold text-red-400">
                                                {formatNumber(data.stockOut)} T
                                              </span>
                                            </p>
                                            <p className="flex justify-between">
                                              <span className="text-yellow-300">
                                                Net:
                                              </span>
                                              <span
                                                className={`font-bold ${
                                                  data.netFlow >= 0
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                                }`}
                                              >
                                                {data.netFlow >= 0 ? "+" : ""}
                                                {formatNumber(data.netFlow)} T
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-slate-600">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-300">
                                            Safety Level:
                                          </span>
                                          <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                                              data.safetyLevel === "Normal"
                                                ? "bg-green-600 text-green-100"
                                                : data.safetyLevel === "Low"
                                                ? "bg-yellow-600 text-yellow-100"
                                                : "bg-red-600 text-red-100"
                                            }`}
                                          >
                                            {data.safetyLevel}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                          <span className="text-slate-300">
                                            Turnover:
                                          </span>
                                          <span className="font-bold text-purple-300">
                                            {data.turnoverRatio}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                          <span className="text-slate-300">
                                            Efficiency:
                                          </span>
                                          <span className="font-bold text-cyan-300">
                                            {data.efficiency}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />

                            <Legend
                              wrapperStyle={{ paddingTop: "20px" }}
                              iconType="rect"
                            />

                            <Brush
                              dataKey="day"
                              height={30}
                              stroke="#6366f1"
                              fill="#f1f5f9"
                            />

                            {/* Gradients */}
                            <defs>
                              <linearGradient
                                id="stockGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#0ea5e9"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#0ea5e9"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="projectedGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#6366f1"
                                  stopOpacity={0.6}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#6366f1"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Compact Stock Analysis - Horizontal Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 mb-3">
                            Stock Level Distribution
                          </h4>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f1f5f9"
                                />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Area
                                  type="monotone"
                                  dataKey="closingStock"
                                  stackId="1"
                                  stroke="#3b82f6"
                                  fill="#3b82f6"
                                  fillOpacity={0.6}
                                />
                                <ReferenceLine
                                  y={thresholds.critical}
                                  stroke="#ef4444"
                                  strokeDasharray="5 5"
                                />
                                <ReferenceLine
                                  y={thresholds.low}
                                  stroke="#f59e0b"
                                  strokeDasharray="5 5"
                                />
                                <Tooltip
                                  formatter={(value) => [
                                    formatNumber(Number(value)),
                                    "Stock Level (Ton)",
                                  ]}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold text-slate-900 mb-3">
                            Daily Stock Flow
                          </h4>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f1f5f9"
                                />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Bar
                                  dataKey="stockReceived"
                                  fill="#10b981"
                                  name="Received"
                                />
                                <Bar
                                  dataKey="stockOut"
                                  fill="#ef4444"
                                  name="Out"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="netFlow"
                                  stroke="#6366f1"
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  name="Net Flow"
                                />
                                <ReferenceLine y={0} stroke="#64748b" />
                                <Tooltip
                                  formatter={(value, name) => [
                                    formatNumber(Number(value)),
                                    name === "netFlow"
                                      ? "Net Flow (Ton)"
                                      : `${name} (Ton)`,
                                  ]}
                                />
                                <Legend />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-500 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-base font-medium">
                          No Data Available
                        </p>
                        <p className="text-xs mt-1">
                          Please select a different date range or area
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Data Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t.forecast_this_month_projection_table}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Detailed breakdown of stock data for the selected period
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            {t.forecast_projected_date || "Date"}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Opening Stock (Ton)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Stock Received (Ton)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Stock Out (Ton)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Closing Stock (Ton)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Net Flow (Ton)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Efficiency (%)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {chartData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-12 text-center text-slate-500"
                            >
                              <div className="flex flex-col items-center">
                                <ArchiveBoxIcon className="w-12 h-12 text-slate-300 mb-3" />
                                <p className="text-sm">
                                  Tidak ada data untuk filter ini
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          chartData.map((item, index) => (
                            <tr
                              key={`${item.date}-${index}`}
                              className={`hover:bg-slate-50 transition-colors duration-150 ${
                                index % 2 === 0 ? "bg-white" : "bg-slate-25"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {item.dateFormatted}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {formatNumber(item.openingStock)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                {formatNumber(item.stockReceived)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-red-600 font-medium">
                                {formatNumber(item.stockOut)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-900 font-bold">
                                {formatNumber(item.closingStock)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                                <span
                                  className={`${
                                    item.netFlow >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {item.netFlow >= 0 ? "+" : ""}
                                  {formatNumber(item.netFlow)}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.efficiency <= 80
                                      ? "bg-green-100 text-green-800"
                                      : item.efficiency <= 100
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.efficiency}%
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.safetyLevel === "Normal"
                                      ? "bg-green-100 text-green-800"
                                      : item.safetyLevel === "Low"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.safetyLevel}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingPlantStockForecast;
