import React, { useState, useMemo, useRef } from 'react';
import {
  ComposedChart,
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
} from 'recharts';
import { PackingPlantStockRecord, PackingPlantMasterRecord } from '../../types';
import { formatDate, formatNumber, formatPercentage } from '../../utils/formatters';
import ArchiveBoxIcon from '../../components/icons/ArchiveBoxIcon';
import ArrowTrendingDownIcon from '../../components/icons/ArrowTrendingDownIcon';
import ClockIcon from '../../components/icons/ClockIcon';
import ArrowTrendingUpIcon from '../../components/icons/ArrowTrendingUpIcon';
import ExclamationTriangleIcon from '../../components/icons/ExclamationTriangleIcon';
import ChartErrorBoundary from '../../components/ChartErrorBoundary';
import { InteractiveCardModal, BreakdownData } from '../../components/InteractiveCardModal';
import {
  calculateStockPrediction,
  convertExistingDataToHistoricalStock,
  convertMasterDataToPlantParameters,
  generatePlannedDeliveries,
  calculatePredictionMetrics,
  PredictionResult,
  DailyProjectionData,
} from '../../utils/stockPrediction';

/**
 * Helper function untuk menghitung 7 days moving average
 * Prioritas data aktual stok keluar, jika belum ada gunakan prediksi stok keluar
 */
const calculate7DayMovingAverage = (
  stockRecords: PackingPlantStockRecord[],
  chartDataSoFar: any[],
  currentDate: Date,
  area: string,
  fallbackValue: number = 100
): number => {
  const sevenDaysAgo = new Date(currentDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Ambil data aktual dari stockRecords dalam 7 hari terakhir
  const recentActualRecords = stockRecords.filter((record) => {
    if (!record.date || record.area !== area) return false;

    const recordDate = new Date(record.date);
    return recordDate >= sevenDaysAgo && recordDate <= currentDate;
  });

  // Prioritaskan data aktual stok keluar
  const actualStockOutData = recentActualRecords
    .map((record) => Number(record.stock_out) || 0)
    .filter((value) => value > 0); // Only consider valid actual data

  // Jika ada data aktual yang cukup (minimal 3 hari dari 7 hari)
  if (actualStockOutData.length >= 3) {
    const sum = actualStockOutData.reduce((acc, value) => acc + value, 0);
    const average = sum / actualStockOutData.length;
    return Math.round(average);
  }

  // Jika tidak ada data aktual yang cukup, gunakan data yang sudah dihitung sebelumnya
  // dari chart data yang sudah diproses
  const recentChartData = chartDataSoFar
    .filter((item) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return (
        itemDate >= sevenDaysAgo &&
        itemDate < currentDate &&
        typeof item.predictedStockOut === 'number' &&
        !isNaN(item.predictedStockOut)
      );
    })
    .slice(-7); // Ambil maksimal 7 hari terakhir

  if (recentChartData.length >= 3) {
    const sum = recentChartData.reduce(
      (acc, item) => acc + (Number(item.predictedStockOut) || 0),
      0
    );
    const average = sum / recentChartData.length;
    return Math.round(average);
  }

  // Fallback ke nilai default
  return Math.max(0, fallbackValue);
};

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
          isInteractive ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'hover:shadow-md'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 mr-4 flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 truncate">{title}</p>
              {isInteractive && (
                <div className="text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
              {unit && <p className="text-sm font-medium text-slate-500 flex-shrink-0">{unit}</p>}
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

const PackingPlantStockForecast: React.FC<PageProps> = ({ t, areas, stockRecords, masterData }) => {
  // State untuk filter dan chart
  const [filterArea, setFilterArea] = useState(areas[0] || '');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Opsi tahun dan bulan
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][i]
        }`
      ],
  }));

  // Enhanced forecast logic with new stock prediction algorithm
  const forecastData = useMemo(() => {
    // Filter stockRecords sesuai area, bulan, dan tahun
    const filteredRecords = stockRecords.filter((r) => {
      let yearSupabase = 0;
      let monthSupabase = 0;
      if (r.date && r.date.length >= 10) {
        yearSupabase = parseInt(r.date.substring(0, 4), 10);
        monthSupabase = parseInt(r.date.substring(5, 7), 10) - 1;
      }
      const matches =
        r.area === filterArea && monthSupabase === filterMonth && yearSupabase === filterYear;
      return matches;
    });

    // Jika tidak ada data, return empty state
    if (filteredRecords.length === 0) {
      return {
        latestClosingStock: 0,
        avgDailyStockOut: 0,
        avgDailyStockReceived: 0,
        daysUntilEmpty: 0,
        historicalData: [],
        trendAnalysis: {
          stockOutTrend: 0,
          closingStockTrend: 0,
          efficiency: 0,
        },
        notEnoughData: true,
        predictionResult: null,
        predictionMetrics: null,
      };
    }

    try {
      // Konversi data existing ke format yang diperlukan untuk prediksi
      const historicalStock = convertExistingDataToHistoricalStock(filteredRecords);
      const plantParameters = convertMasterDataToPlantParameters(masterData, filterArea);

      // Validasi plant parameters dengan better fallback
      if (
        !plantParameters ||
        typeof plantParameters.currentStock !== 'number' ||
        isNaN(plantParameters.currentStock) ||
        plantParameters.currentStock <= 0
      ) {
        console.warn('Invalid plant parameters, using fallback values');

        // Calculate better fallback from actual data
        const lastValidStock =
          filteredRecords.length > 0
            ? Number(filteredRecords[filteredRecords.length - 1]?.closing_stock)
            : 0;

        const avgClosingStock =
          filteredRecords.length > 0
            ? filteredRecords.reduce((sum, r) => sum + (Number(r.closing_stock) || 0), 0) /
              filteredRecords.length
            : 1000;

        plantParameters.currentStock =
          !isNaN(lastValidStock) && lastValidStock > 0
            ? lastValidStock
            : !isNaN(avgClosingStock) && avgClosingStock > 0
              ? avgClosingStock
              : 1000;

        plantParameters.avgDailyConsumption =
          filteredRecords.length > 0
            ? Math.max(
                1,
                Math.round(
                  filteredRecords.reduce((sum, r) => sum + Number(r.stock_out || 0), 0) /
                    filteredRecords.length
                )
              )
            : 100;

        plantParameters.safetyStock = Math.max(50, plantParameters.currentStock * 0.1);
      }

      // Set parameter prediksi
      const projectionPeriodDays = 90; // 3 bulan ke depan
      const historyPeriodDays = 7; // 7 hari ke belakang

      // Generate planned deliveries (ini bisa disesuaikan dengan data real planned deliveries)
      const today = new Date();
      const plannedDeliveries = generatePlannedDeliveries(
        today,
        projectionPeriodDays,
        plantParameters.avgDailyConsumption * 7, // Delivery seminggu sekali
        7 // Setiap 7 hari
      );

      // Hitung prediksi stok
      const predictionResult = calculateStockPrediction(
        historicalStock,
        plannedDeliveries,
        plantParameters,
        projectionPeriodDays,
        historyPeriodDays
      );

      // Hitung metrik tambahan
      const predictionMetrics = calculatePredictionMetrics(predictionResult, plantParameters);

      // Hitung data legacy untuk kompatibilitas dengan chart yang ada
      const latestClosingStock = plantParameters.currentStock;
      const avgDailyStockOut = plantParameters.avgDailyConsumption;
      const avgDailyStockReceived =
        filteredRecords.length > 0
          ? Math.round(
              filteredRecords.reduce((sum, r) => sum + Number(r.stock_received || 0), 0) /
                filteredRecords.length
            )
          : 0;

      // Calculate trends dari data historis
      const sortedRecords = [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));
      const trendAnalysis = {
        stockOutTrend: 0,
        closingStockTrend: 0,
        efficiency: 0,
      };

      if (sortedRecords.length >= 2) {
        const firstHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2));
        const secondHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2));

        const firstHalfAvgOut =
          firstHalf.reduce((sum, r) => sum + Number(r.stock_out || 0), 0) / firstHalf.length;
        const secondHalfAvgOut =
          secondHalf.reduce((sum, r) => sum + Number(r.stock_out || 0), 0) / secondHalf.length;

        const firstHalfAvgStock =
          firstHalf.reduce((sum, r) => sum + Number(r.closing_stock || 0), 0) / firstHalf.length;
        const secondHalfAvgStock =
          secondHalf.reduce((sum, r) => sum + Number(r.closing_stock || 0), 0) / secondHalf.length;

        trendAnalysis.stockOutTrend =
          firstHalfAvgOut > 0 ? ((secondHalfAvgOut - firstHalfAvgOut) / firstHalfAvgOut) * 100 : 0;
        trendAnalysis.closingStockTrend =
          firstHalfAvgStock > 0
            ? ((secondHalfAvgStock - firstHalfAvgStock) / firstHalfAvgStock) * 100
            : 0;
        trendAnalysis.efficiency =
          avgDailyStockReceived > 0 ? (avgDailyStockOut / avgDailyStockReceived) * 100 : 0;
      }

      return {
        latestClosingStock,
        avgDailyStockOut,
        avgDailyStockReceived,
        daysUntilEmpty: predictionMetrics?.daysUntilEmpty || 0,
        historicalData: filteredRecords,
        trendAnalysis,
        notEnoughData: false,
        predictionResult,
        predictionMetrics,
      };
    } catch (error) {
      console.error('Error in stock prediction calculation:', error);
      // Return safe fallback data
      return {
        latestClosingStock: 0,
        avgDailyStockOut: 0,
        avgDailyStockReceived: 0,
        daysUntilEmpty: 0,
        historicalData: filteredRecords,
        trendAnalysis: {
          stockOutTrend: 0,
          closingStockTrend: 0,
          efficiency: 0,
        },
        notEnoughData: true,
        predictionResult: null,
        predictionMetrics: null,
      };
    }
  }, [filterArea, filterMonth, filterYear, stockRecords, masterData]);

  // Memoized filter keys for better performance
  const filterKey = useMemo(
    () => `${filterArea}-${filterMonth}-${filterYear}`,
    [filterArea, filterMonth, filterYear]
  );

  // Enhanced chart data preparation with prediction data
  const chartData = useMemo(() => {
    // Early return if no forecast data
    if (forecastData.notEnoughData || !forecastData.historicalData) {
      return [];
    }

    // Create a map of actual data from stock records for faster lookup
    const actualDataMap = new Map();

    // Process filtered stock records untuk mendapatkan data aktual
    const filteredActualRecords = stockRecords.filter((r) => {
      let yearSupabase = 0;
      let monthSupabase = 0;
      if (r.date && r.date.length >= 10) {
        yearSupabase = parseInt(r.date.substring(0, 4), 10);
        monthSupabase = parseInt(r.date.substring(5, 7), 10) - 1;
      }
      return r.area === filterArea && monthSupabase === filterMonth && yearSupabase === filterYear;
    });

    // Build map dengan key tanggal untuk data aktual
    filteredActualRecords.forEach((record) => {
      const dateKey = record.date.split('T')[0]; // Get YYYY-MM-DD format
      actualDataMap.set(dateKey, {
        stockOut: Number(record.stock_out) || 0,
        stockReceived: Number(record.stock_received) || 0,
        openingStock: Number(record.opening_stock) || 0,
        closingStock: Number(record.closing_stock) || 0,
        isActual: true,
      });
    });

    // Generate data untuk seluruh hari dalam bulan yang dipilih
    const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    const monthData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(filterYear, filterMonth, day);
      const dateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if we have actual data for this date
      const actualData = actualDataMap.get(dateKey);

      let stockOut, stockReceived, openingStock, closingStock, isActual;

      if (actualData) {
        // Use actual data from Stock Data Entry
        stockOut = actualData.stockOut;
        stockReceived = actualData.stockReceived;
        openingStock = actualData.openingStock;
        closingStock = actualData.closingStock;
        isActual = true;
      } else {
        // Generate prediction data for missing dates
        // Get baseline values from historical data or use defaults
        const avgStockOut =
          filteredActualRecords.length > 0
            ? filteredActualRecords.reduce((sum, r) => sum + (Number(r.stock_out) || 0), 0) /
              filteredActualRecords.length
            : forecastData.avgDailyStockOut || 100;

        const avgStockReceived =
          filteredActualRecords.length > 0
            ? filteredActualRecords.reduce((sum, r) => sum + (Number(r.stock_received) || 0), 0) /
              filteredActualRecords.length
            : forecastData.avgDailyStockReceived || 120;

        // Use prediction logic with deterministic variation based on day
        const previousClosing =
          day > 1 && monthData[day - 2]
            ? monthData[day - 2].closingStock
            : forecastData.latestClosingStock || 1000;

        // Create deterministic seed based on date for consistent predictions
        const seed = (filterYear * 10000 + filterMonth * 100 + day) % 1000;
        const deterministicFactor1 = (Math.sin(seed * 0.01) + 1) * 0.2; // Range: 0 to 0.4
        const deterministicFactor2 = (Math.cos(seed * 0.02) + 1) * 0.2; // Range: 0 to 0.4

        stockOut = Math.round(avgStockOut * (0.8 + deterministicFactor1)); // ±20% variation
        stockReceived = Math.round(avgStockReceived * (0.8 + deterministicFactor2)); // ±20% variation
        openingStock = previousClosing;
        closingStock = Math.max(0, openingStock + stockReceived - stockOut);
        isActual = false;
      }

      // Calculate predicted values using 7 days moving average
      // Prioritas data aktual stok keluar, jika belum ada gunakan prediksi stok keluar
      const avgStockOut =
        filteredActualRecords.length > 0
          ? filteredActualRecords.reduce((sum, r) => sum + (Number(r.stock_out) || 0), 0) /
            filteredActualRecords.length
          : forecastData.avgDailyStockOut || 100;

      // Gunakan 7 days moving average untuk prediksi stok keluar
      const predictedStockOut = calculate7DayMovingAverage(
        stockRecords,
        monthData, // Data yang sudah diproses sebelumnya
        currentDate,
        filterArea,
        avgStockOut
      );

      // Calculate deviation and achievement percentage
      const deviation = isActual ? stockOut - predictedStockOut : 0;
      const achievementPercentage =
        isActual && predictedStockOut > 0 ? Math.round((stockOut / predictedStockOut) * 100) : 0;

      // Calculate efficiency and safety metrics
      const turnoverRatio = openingStock > 0 ? (stockOut / openingStock) * 100 : 0;
      const safetyLevel = closingStock > 100 ? 'Normal' : closingStock > 50 ? 'Low' : 'Critical';
      const stockVariance =
        day > 1 && monthData[day - 2] ? closingStock - monthData[day - 2].closingStock : 0;

      monthData.push({
        date: currentDate.toISOString(),
        day: day,
        dateFormatted: formatDate(currentDate.toISOString()),
        stockOut, // Actual value (from data entry) or predicted value
        stockReceived,
        openingStock,
        closingStock,
        projectedStockOut: predictedStockOut, // Always the predicted value for comparison
        actualStockOut: isActual ? stockOut : null, // Only populated for actual data
        predictedStockOut: predictedStockOut, // Predicted value for all rows
        deviation: deviation, // Difference between actual and predicted
        achievementPercentage: achievementPercentage, // Performance percentage
        projectedClosingStock: closingStock,
        netFlow: stockReceived - stockOut,
        turnoverRatio: Math.round(turnoverRatio * 10) / 10,
        safetyLevel,
        stockVariance,
        efficiency: stockReceived > 0 ? Math.round((stockOut / stockReceived) * 100) : 0,
        isActual,
        trendClosingStock: closingStock,
        trendStockOut: stockOut,
      });
    }

    return monthData;
  }, [forecastData, stockRecords, filterKey]);

  // Enhanced chart data with moving averages - optimized for performance
  const processedChartData = useMemo(() => {
    // Early return for empty data
    if (!chartData || chartData.length === 0) {
      return [];
    }

    try {
      // Calculate moving averages for trend lines
      const movingAvgWindow = Math.min(5, chartData.length);

      // Optimized processing with pre-allocated array
      const processed = chartData.map((item, index) => {
        // Ensure all required properties exist and are valid numbers with single conversion
        const baseItem = {
          ...item,
          closingStock: Number(item.closingStock) || 0,
          projectedClosingStock: Number(item.projectedClosingStock) || 0,
          stockOut: Number(item.stockOut) || 0,
          stockReceived: Number(item.stockReceived) || 0,
          openingStock: Number(item.openingStock) || 0,
          netFlow: Number(item.netFlow) || 0,
          day: Number(item.day) || 1,
          predictedStockOut: Number(item.predictedStockOut) || 0,
          actualStockOut: item.actualStockOut ? Number(item.actualStockOut) : null,
          deviation: Number(item.deviation) || 0,
          achievementPercentage: Number(item.achievementPercentage) || 0,
        };

        // Optimized moving average calculation
        const start = Math.max(0, index - Math.floor(movingAvgWindow / 2));
        const end = Math.min(chartData.length, start + movingAvgWindow);
        const windowData = chartData.slice(start, end);

        const avgClosingStock =
          windowData.reduce((sum, d) => sum + (Number(d.closingStock) || 0), 0) / windowData.length;
        const avgStockOut =
          windowData.reduce((sum, d) => sum + (Number(d.stockOut) || 0), 0) / windowData.length;

        return {
          ...baseItem,
          trendClosingStock: Math.round(avgClosingStock) || 0,
          trendStockOut: Math.round(avgStockOut) || 0,
        };
      });

      // Enhanced validation - ensure all data points are valid and safe
      const validatedData = processed.filter((item) => {
        // Check all required numeric properties
        const numericProps = [
          'closingStock',
          'projectedClosingStock',
          'day',
          'stockOut',
          'stockReceived',
          'openingStock',
          'netFlow',
          'predictedStockOut',
          'deviation',
          'achievementPercentage',
          'trendClosingStock',
          'trendStockOut',
        ];

        const hasValidNumbers = numericProps.every((prop) => {
          const value = item[prop];
          return typeof value === 'number' && !isNaN(value) && isFinite(value);
        });

        // Check required string properties
        const hasValidStrings =
          typeof item.date === 'string' &&
          item.date.length > 0 &&
          typeof item.dateFormatted === 'string' &&
          item.dateFormatted.length > 0;

        // Check boolean properties
        const hasValidBooleans = typeof item.isActual === 'boolean';

        // Additional safety checks
        const hasSafeValues =
          item.closingStock >= 0 &&
          item.stockOut >= 0 &&
          item.stockReceived >= 0 &&
          item.openingStock >= 0 &&
          item.day >= 1 &&
          item.day <= 31;

        const isValid = hasValidNumbers && hasValidStrings && hasValidBooleans && hasSafeValues;

        if (!isValid) {
          console.warn('Invalid data point filtered out:', {
            item,
            hasValidNumbers,
            hasValidStrings,
            hasValidBooleans,
            hasSafeValues,
          });
        }

        return isValid;
      });

      console.log('Processed chart data sample:', validatedData.slice(0, 3));
      console.log('Total data points:', validatedData.length);

      return validatedData;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [chartData]);

  // Table data with complete month coverage - ensures ALL days of the month are shown
  const tableData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [];
    }

    // Create a complete dataset for the table that shows all days of the month
    const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    const completeTableData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(filterYear, filterMonth, day);
      const dateKey = currentDate.toISOString().split('T')[0];

      // Find matching data from chartData
      const matchingData = chartData.find((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getDate() === day &&
          itemDate.getMonth() === filterMonth &&
          itemDate.getFullYear() === filterYear
        );
      });

      if (matchingData) {
        // Use the existing data with safety checks
        completeTableData.push({
          ...matchingData,
          // Ensure all numeric values are safe
          closingStock: Number(matchingData.closingStock) || 0,
          stockOut: Number(matchingData.stockOut) || 0,
          stockReceived: Number(matchingData.stockReceived) || 0,
          openingStock: Number(matchingData.openingStock) || 0,
          netFlow: Number(matchingData.netFlow) || 0,
          predictedStockOut: Number(matchingData.predictedStockOut) || 0,
          deviation: Number(matchingData.deviation) || 0,
          achievementPercentage: Number(matchingData.achievementPercentage) || 0,
          efficiency: Number(matchingData.efficiency) || 0,
          turnoverRatio: Number(matchingData.turnoverRatio) || 0,
          day: day,
          dateFormatted: formatDate(currentDate.toISOString()),
        });
      } else {
        // Create placeholder data for missing days
        completeTableData.push({
          date: currentDate.toISOString(),
          day: day,
          dateFormatted: formatDate(currentDate.toISOString()),
          stockOut: 0,
          stockReceived: 0,
          openingStock: 0,
          closingStock: 0,
          predictedStockOut: 0,
          deviation: 0,
          achievementPercentage: 0,
          netFlow: 0,
          turnoverRatio: 0,
          efficiency: 0,
          safetyLevel: 'Normal',
          stockVariance: 0,
          isActual: false,
          actualStockOut: null,
          projectedClosingStock: 0,
          trendClosingStock: 0,
          trendStockOut: 0,
        });
      }
    }

    return completeTableData;
  }, [chartData, filterYear, filterMonth]);

  // Helper function to calculate trend (simple slope)
  const calculateTrend = (values: number[]): number => {
    if (values.length < 2) return 0;

    const n = values.length;
    const xSum = (n * (n + 1)) / 2; // Sum of 1, 2, 3, ..., n
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6; // Sum of 1², 2², ..., n²

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    return slope || 0;
  };

  // Calculate statistics from table data for cardboard metrics
  const tableMetrics = useMemo(() => {
    if (tableData.length === 0) {
      return {
        latestClosingStock: 0,
        avgDailyStockOut: 0,
        avgDailyStockReceived: 0,
        daysUntilEmpty: 0,
        criticalDate: 'N/A',
        stockOutTrend: 0,
        closingStockTrend: 0,
        efficiency: 0,
      };
    }

    // Calculate latest closing stock (from the most recent entry)
    const latestClosingStock = tableData[tableData.length - 1]?.closingStock || 0;

    // Calculate averages from actual data only
    const actualData = tableData.filter((item) => item.isActual);

    let avgDailyStockOut = 0;
    let avgDailyStockReceived = 0;
    let totalStockOut = 0;
    let totalStockReceived = 0;

    if (actualData.length > 0) {
      totalStockOut = actualData.reduce((sum, item) => sum + item.stockOut, 0);
      totalStockReceived = actualData.reduce((sum, item) => sum + item.stockReceived, 0);
      avgDailyStockOut = totalStockOut / actualData.length;
      avgDailyStockReceived = totalStockReceived / actualData.length;
    }

    // Calculate days until empty
    const daysUntilEmpty = avgDailyStockOut > 0 ? latestClosingStock / avgDailyStockOut : Infinity;

    // Calculate critical date
    const today = new Date();
    const criticalDate = new Date(today.getTime() + daysUntilEmpty * 24 * 60 * 60 * 1000);
    const criticalDateStr = isFinite(daysUntilEmpty)
      ? formatDate(criticalDate.toISOString())
      : 'N/A';

    // Calculate trends (simple linear regression slope)
    const stockOutTrend =
      actualData.length > 1 ? calculateTrend(actualData.map((item) => item.stockOut)) : 0;
    const closingStockTrend =
      tableData.length > 1 ? calculateTrend(tableData.map((item) => item.closingStock)) : 0;

    // Calculate overall efficiency
    const efficiency = totalStockReceived > 0 ? (totalStockOut / totalStockReceived) * 100 : 0;

    return {
      latestClosingStock,
      avgDailyStockOut,
      avgDailyStockReceived,
      daysUntilEmpty,
      criticalDate: criticalDateStr,
      stockOutTrend,
      closingStockTrend,
      efficiency,
    };
  }, [tableData]);

  // Calculate table statistics for footer
  const tableStats = useMemo(() => {
    if (tableData.length === 0) {
      return {
        openingStock: { avg: 0, min: 0, max: 0, total: 0 },
        stockReceived: { avg: 0, min: 0, max: 0, total: 0 },
        stockOut: { avg: 0, min: 0, max: 0, total: 0 },
        predictedStockOut: { avg: 0, min: 0, max: 0, total: 0 },
        deviation: { avg: 0, min: 0, max: 0, total: 0 },
        achievementPercentage: { avg: 0, min: 0, max: 0, total: 0 },
        closingStock: { avg: 0, min: 0, max: 0, total: 0 },
        netFlow: { avg: 0, min: 0, max: 0, total: 0 },
        efficiency: { avg: 0, min: 0, max: 0, total: 0 },
        actualData: {
          openingStock: { avg: 0, min: 0, max: 0, total: 0 },
          stockReceived: { avg: 0, min: 0, max: 0, total: 0 },
          stockOut: { avg: 0, min: 0, max: 0, total: 0 },
          predictedStockOut: { avg: 0, min: 0, max: 0, total: 0 },
          deviation: { avg: 0, min: 0, max: 0, total: 0 },
          achievementPercentage: { avg: 0, min: 0, max: 0, total: 0 },
          closingStock: { avg: 0, min: 0, max: 0, total: 0 },
          netFlow: { avg: 0, min: 0, max: 0, total: 0 },
          efficiency: { avg: 0, min: 0, max: 0, total: 0 },
        },
        predictedData: {
          openingStock: { avg: 0, min: 0, max: 0, total: 0 },
          stockReceived: { avg: 0, min: 0, max: 0, total: 0 },
          stockOut: { avg: 0, min: 0, max: 0, total: 0 },
          predictedStockOut: { avg: 0, min: 0, max: 0, total: 0 },
          deviation: { avg: 0, min: 0, max: 0, total: 0 },
          achievementPercentage: { avg: 0, min: 0, max: 0, total: 0 },
          closingStock: { avg: 0, min: 0, max: 0, total: 0 },
          netFlow: { avg: 0, min: 0, max: 0, total: 0 },
          efficiency: { avg: 0, min: 0, max: 0, total: 0 },
        },
      };
    }

    const calculateStats = (values: number[]) => {
      // Enhanced filtering for valid numeric values
      const validValues = values.filter(
        (v) => typeof v === 'number' && !isNaN(v) && isFinite(v) && v !== null && v !== undefined
      );

      if (validValues.length === 0) {
        return { avg: 0, min: 0, max: 0, total: 0 };
      }

      // Use reduce with proper initial values for safer calculation
      const total = validValues.reduce((sum, val) => {
        const safeVal = Number(val) || 0;
        return sum + safeVal;
      }, 0);

      const avg = validValues.length > 0 ? total / validValues.length : 0;
      const min = validValues.length > 0 ? Math.min(...validValues) : 0;
      const max = validValues.length > 0 ? Math.max(...validValues) : 0;

      // Round to 2 decimal places and ensure finite numbers
      return {
        avg: Number(Math.round(avg * 100) / 100) || 0,
        min: Number(Math.round(min * 100) / 100) || 0,
        max: Number(Math.round(max * 100) / 100) || 0,
        total: Number(Math.round(total * 100) / 100) || 0,
      };
    };

    return {
      openingStock: calculateStats(tableData.map((item) => item.openingStock)),
      stockReceived: calculateStats(tableData.map((item) => item.stockReceived)),
      stockOut: calculateStats(tableData.map((item) => item.stockOut)),
      predictedStockOut: calculateStats(tableData.map((item) => item.predictedStockOut)),
      deviation: calculateStats(tableData.map((item) => item.deviation)),
      achievementPercentage: calculateStats(tableData.map((item) => item.achievementPercentage)),
      closingStock: calculateStats(tableData.map((item) => item.closingStock)),
      netFlow: calculateStats(tableData.map((item) => item.netFlow)),
      efficiency: calculateStats(tableData.map((item) => item.efficiency)),
      // Separate calculations for actual and predicted data
      actualData: {
        openingStock: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.openingStock)
        ),
        stockReceived: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.stockReceived)
        ),
        stockOut: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.stockOut)
        ),
        predictedStockOut: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.predictedStockOut)
        ),
        deviation: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.deviation)
        ),
        achievementPercentage: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.achievementPercentage)
        ),
        closingStock: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.closingStock)
        ),
        netFlow: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.netFlow)
        ),
        efficiency: calculateStats(
          tableData.filter((item) => item.isActual).map((item) => item.efficiency)
        ),
      },
      predictedData: {
        openingStock: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.openingStock)
        ),
        stockReceived: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.stockReceived)
        ),
        stockOut: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.stockOut)
        ),
        predictedStockOut: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.predictedStockOut)
        ),
        deviation: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.deviation)
        ),
        achievementPercentage: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.achievementPercentage)
        ),
        closingStock: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.closingStock)
        ),
        netFlow: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.netFlow)
        ),
        efficiency: calculateStats(
          tableData.filter((item) => !item.isActual).map((item) => item.efficiency)
        ),
      },
    };
  }, [tableData]);

  // Critical thresholds for visual indicators
  const thresholds = {
    critical: 50,
    low: 100,
    normal: 200,
  };

  // Calculate today's day in the selected month for vertical line
  const today = new Date();
  const todayDay = today.getDate();
  const isCurrentMonth = today.getMonth() === filterMonth && today.getFullYear() === filterYear;
  const todayLinePosition = isCurrentMonth ? todayDay : null;

  // Render
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 sm:p-4 lg:p-6">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t.forecast_packing_plant_stock}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400">
            {t.forecast_packing_plant_stock_subtitle}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="forecast-filter-area"
                className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2"
              >
                {t.filter_by_area}
              </label>
              <select
                id="forecast-filter-area"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="forecast-filter-month"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2"
                >
                  {t.filter_by_month}
                </label>
                <select
                  id="forecast-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="block w-full px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-28">
                <label
                  htmlFor="forecast-filter-year"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2"
                >
                  {t.filter_by_year}
                </label>
                <select
                  id="forecast-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="block w-full px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
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
          <p className="text-slate-500 dark:text-slate-400 mb-4">{t.forecast_no_data}</p>
          <div className="text-sm text-slate-400 dark:text-slate-500">
            <p>
              Filter aktif: {filterArea} - {monthOptions[filterMonth]?.label} {filterYear}
            </p>
            <p>Silakan pilih periode yang berbeda atau pastikan data tersedia</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Status Indicator */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Prediksi untuk: {filterArea} - {monthOptions[filterMonth]?.label} {filterYear}
                </span>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">
                {forecastData.historicalData.length} hari data historis
              </span>
            </div>
          </div>

          {/* Enhanced Metrics Cards - Ultra Compact Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2">
            <ForecastMetricCard
              title={t.forecast_current_stock}
              value={formatNumber(Math.round(tableMetrics.latestClosingStock))}
              unit="Ton"
              icon={<ArchiveBoxIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
            <ForecastMetricCard
              title={t.forecast_avg_daily_out}
              value={formatNumber(Math.round(tableMetrics.avgDailyStockOut))}
              unit="Ton/Day"
              icon={<ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
            <ForecastMetricCard
              title="Avg Daily Received"
              value={formatNumber(Math.round(tableMetrics.avgDailyStockReceived))}
              unit="Ton/Day"
              icon={<ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
            <ForecastMetricCard
              title={t.forecast_days_until_empty}
              value={
                isFinite(tableMetrics.daysUntilEmpty)
                  ? formatNumber(Math.floor(tableMetrics.daysUntilEmpty))
                  : '∞'
              }
              unit="Days"
              icon={
                tableMetrics.daysUntilEmpty <= 7 ? (
                  <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                ) : (
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                )
              }
            />
            <ForecastMetricCard
              title="Critical Stock Date"
              value={tableMetrics.criticalDate}
              unit=""
              icon={
                tableMetrics.daysUntilEmpty <= 7 ? (
                  <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                ) : (
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                )
              }
            />
          </div>

          {/* Main Content Grid Layout - More Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
            {/* Left Column: Trend Analysis Cards */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 truncate">
                        Stock Out Trend
                      </p>
                      <p
                        className={`text-lg sm:text-xl font-bold ${
                          tableMetrics.stockOutTrend > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {tableMetrics.stockOutTrend > 0 ? '+' : ''}
                        {formatPercentage(Math.abs(tableMetrics.stockOutTrend) * 10)}%
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        tableMetrics.stockOutTrend > 0
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}
                    >
                      {tableMetrics.stockOutTrend > 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow-sm border border-green-200 dark:border-green-800 p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 mb-1 truncate">
                        Stock Level Trend
                      </p>
                      <p
                        className={`text-lg sm:text-xl font-bold ${
                          tableMetrics.closingStockTrend > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {tableMetrics.closingStockTrend > 0 ? '+' : ''}
                        {formatPercentage(Math.abs(tableMetrics.closingStockTrend) * 10)}%
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        tableMetrics.closingStockTrend > 0
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      {tableMetrics.closingStockTrend > 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 mb-1 truncate">
                        Efficiency Ratio
                      </p>
                      <p
                        className={`text-lg sm:text-xl font-bold ${
                          tableMetrics.efficiency > 100
                            ? 'text-red-600 dark:text-red-400'
                            : tableMetrics.efficiency > 80
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {formatPercentage(tableMetrics.efficiency)}%
                      </p>
                    </div>
                    <div className="p-2 rounded-full flex-shrink-0 bg-purple-100 dark:bg-purple-900/30">
                      <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Charts and Table */}
            <div className="lg:col-span-2">
              <div className="space-y-4 sm:space-y-6">
                {/* Enhanced Chart Section - Compact Layout */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {t.forecast_stock_projection_chart}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {filterArea} - {monthOptions[filterMonth]?.label} {filterYear} |{' '}
                        {tableData.length} data points
                      </p>
                    </div>
                  </div>

                  {tableData.length > 0 ? (
                    <div className="space-y-4">
                      {/* Main Composite Chart - Responsive Height */}
                      <div className="h-64 sm:h-80 lg:h-96">
                        <ChartErrorBoundary>
                          <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={tableData}
                                margin={{
                                  top: 15,
                                  right: 20,
                                  left: 15,
                                  bottom: 15,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                  dataKey="day"
                                  tick={{ fontSize: 12, fill: '#64748b' }}
                                  tickFormatter={(value) => `Day ${value}`}
                                  domain={['dataMin', 'dataMax']}
                                />
                                <YAxis
                                  yAxisId="stock"
                                  orientation="left"
                                  tick={{ fontSize: 12, fill: '#64748b' }}
                                  label={{
                                    value: 'Stock (Ton)',
                                    angle: -90,
                                    position: 'insideLeft',
                                  }}
                                  domain={[0, 'dataMax + 50']}
                                />
                                <YAxis
                                  yAxisId="flow"
                                  orientation="right"
                                  tick={{ fontSize: 12, fill: '#64748b' }}
                                  label={{
                                    value: 'Daily Flow (Ton)',
                                    angle: 90,
                                    position: 'insideRight',
                                  }}
                                />

                                {/* Critical thresholds */}
                                <ReferenceLine
                                  y={thresholds.critical}
                                  stroke="#ef4444"
                                  strokeDasharray="8 8"
                                  yAxisId="stock"
                                  label={{
                                    value: 'Critical Level',
                                    position: 'insideTopRight',
                                  }}
                                />
                                <ReferenceLine
                                  y={thresholds.low}
                                  stroke="#f59e0b"
                                  strokeDasharray="5 5"
                                  yAxisId="stock"
                                  label={{
                                    value: 'Low Level',
                                    position: 'insideTopRight',
                                  }}
                                />

                                {/* Today vertical line */}
                                {todayLinePosition && (
                                  <ReferenceLine
                                    x={todayLinePosition}
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    label={{
                                      value: 'Today',
                                      position: 'top',
                                      fill: '#10b981',
                                      fontSize: 12,
                                      fontWeight: 'bold',
                                    }}
                                  />
                                )}

                                {/* Simplified Area chart - Use Line instead if Area causes issues */}
                                <Line
                                  yAxisId="stock"
                                  type="monotone"
                                  dataKey="closingStock"
                                  stroke="#0ea5e9"
                                  strokeWidth={3}
                                  dot={{ r: 3, fill: '#0ea5e9' }}
                                  name="Closing Stock"
                                />
                                <Line
                                  yAxisId="stock"
                                  type="monotone"
                                  dataKey="projectedClosingStock"
                                  stroke="#6366f1"
                                  strokeWidth={2}
                                  strokeDasharray="8 4"
                                  dot={{ r: 2, fill: '#6366f1' }}
                                  name="Projected Stock"
                                />

                                {/* Stock flow as bars - Actual vs Predicted */}
                                <Bar
                                  yAxisId="flow"
                                  dataKey="actualStockOut"
                                  fill="#ef4444"
                                  name="Actual Stock Out"
                                  radius={[2, 2, 0, 0]}
                                >
                                  {tableData.map((entry, index) => (
                                    <Cell
                                      key={`cell-actual-out-${index}`}
                                      fill={
                                        entry.actualStockOut &&
                                        entry.actualStockOut > forecastData.avgDailyStockOut * 1.2
                                          ? '#dc2626'
                                          : '#ef4444'
                                      }
                                    />
                                  ))}
                                </Bar>
                                <Bar
                                  yAxisId="flow"
                                  dataKey="predictedStockOut"
                                  fill="#f97316"
                                  fillOpacity={0.6}
                                  name="Predicted Stock Out"
                                  radius={[2, 2, 0, 0]}
                                >
                                  {tableData.map((entry, index) => (
                                    <Cell
                                      key={`cell-predicted-out-${index}`}
                                      fill={
                                        entry.predictedStockOut >
                                        forecastData.avgDailyStockOut * 1.2
                                          ? '#ea580c'
                                          : '#f97316'
                                      }
                                      fillOpacity={entry.actualStockOut ? 0.4 : 0.8}
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
                                  {tableData.map((entry, index) => (
                                    <Cell
                                      key={`cell-in-${index}`}
                                      fill={
                                        entry.stockReceived >
                                        forecastData.avgDailyStockReceived * 1.2
                                          ? '#059669'
                                          : '#10b981'
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

                                {/* Predicted Stock Out Line (7-day Moving Average) */}
                                <Line
                                  yAxisId="flow"
                                  type="monotone"
                                  dataKey="predictedStockOut"
                                  stroke="#f59e0b"
                                  strokeWidth={3}
                                  strokeDasharray="8 8"
                                  dot={{ r: 3, fill: '#f59e0b' }}
                                  name="Predicted Stock Out (7-day MA)"
                                />

                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xl border border-slate-600 min-w-[280px]">
                                          <div className="flex items-center justify-between mb-3 border-b border-slate-600 pb-2">
                                            <p className="font-semibold text-lg">
                                              {data.dateFormatted}
                                            </p>
                                            <span
                                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                data.isActual
                                                  ? 'bg-green-600 text-green-100'
                                                  : 'bg-blue-600 text-blue-100'
                                              }`}
                                            >
                                              {data.isActual ? 'Actual' : 'Predicted'}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <p className="text-slate-300 mb-1">Stock Levels</p>
                                              <div className="space-y-1">
                                                <p className="flex justify-between">
                                                  <span className="text-blue-300">Opening:</span>
                                                  <span className="font-bold">
                                                    {formatNumber(data.openingStock)} T
                                                  </span>
                                                </p>
                                                <p className="flex justify-between">
                                                  <span className="text-blue-400">Closing:</span>
                                                  <span className="font-bold">
                                                    {formatNumber(data.closingStock)} T
                                                  </span>
                                                </p>
                                                <p className="flex justify-between">
                                                  <span className="text-indigo-300">
                                                    Projected:
                                                  </span>
                                                  <span className="font-bold">
                                                    {formatNumber(data.projectedClosingStock)} T
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                            <div>
                                              <p className="text-slate-300 mb-1">Daily Flow</p>
                                              <div className="space-y-1">
                                                <p className="flex justify-between">
                                                  <span className="text-green-300">Received:</span>
                                                  <span className="font-bold text-green-400">
                                                    {formatNumber(data.stockReceived)} T
                                                  </span>
                                                </p>
                                                {data.actualStockOut && (
                                                  <p className="flex justify-between">
                                                    <span className="text-red-300">
                                                      Actual Out:
                                                    </span>
                                                    <span className="font-bold text-red-400">
                                                      {formatNumber(data.actualStockOut)} T
                                                    </span>
                                                  </p>
                                                )}
                                                <p className="flex justify-between">
                                                  <span className="text-orange-300">
                                                    Predicted Out:
                                                  </span>
                                                  <span className="font-bold text-orange-400">
                                                    {formatNumber(data.predictedStockOut)} T
                                                  </span>
                                                </p>
                                                <p className="flex justify-between">
                                                  <span className="text-yellow-300">Net:</span>
                                                  <span
                                                    className={`font-bold ${
                                                      data.netFlow >= 0
                                                        ? 'text-green-400'
                                                        : 'text-red-400'
                                                    }`}
                                                  >
                                                    {data.netFlow >= 0 ? '+' : ''}
                                                    {formatNumber(data.netFlow)} T
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="mt-3 pt-3 border-t border-slate-600">
                                            <div className="flex justify-between items-center">
                                              <span className="text-slate-300">Safety Level:</span>
                                              <span
                                                className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                  data.safetyLevel === 'Normal'
                                                    ? 'bg-green-600 text-green-100'
                                                    : data.safetyLevel === 'Low'
                                                      ? 'bg-yellow-600 text-yellow-100'
                                                      : 'bg-red-600 text-red-100'
                                                }`}
                                              >
                                                {data.safetyLevel}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                              <span className="text-slate-300">Turnover:</span>
                                              <span className="font-bold text-purple-300">
                                                {formatPercentage(data.turnoverRatio)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                              <span className="text-slate-300">Efficiency:</span>
                                              <span className="font-bold text-cyan-300">
                                                {formatPercentage(data.efficiency)}%
                                              </span>
                                            </div>
                                            {/* 7-day Moving Average Prediction Info */}
                                            <div className="flex justify-between items-center mt-1">
                                              <span className="text-slate-300">
                                                Predicted Out (7-day MA):
                                              </span>
                                              <span className="font-bold text-yellow-300">
                                                {formatNumber(data.predictedStockOut)} T
                                              </span>
                                            </div>
                                            {data.isActual && (
                                              <div className="flex justify-between items-center mt-1">
                                                <span className="text-slate-300">Deviation:</span>
                                                <span
                                                  className={`font-bold ${
                                                    data.deviation >= 0
                                                      ? 'text-red-300'
                                                      : 'text-green-300'
                                                  }`}
                                                >
                                                  {data.deviation >= 0 ? '+' : ''}
                                                  {formatNumber(data.deviation)} T
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />

                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />

                                <Brush dataKey="day" height={30} stroke="#6366f1" fill="#f1f5f9" />

                                {/* Gradients */}
                                <defs>
                                  <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                  </linearGradient>
                                  <linearGradient
                                    id="projectedGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartErrorBoundary>
                      </div>

                      {/* Compact Stock Analysis - Responsive Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2">
                            Stock Level Distribution
                          </h4>
                          <div className="h-24 sm:h-28 lg:h-32">
                            <ChartErrorBoundary>
                              <div className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={tableData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    {/* Actual closing stock line */}
                                    <Line
                                      type="monotone"
                                      dataKey="closingStock"
                                      stroke="#3b82f6"
                                      strokeWidth={2}
                                      dot={{ r: 2, fill: '#3b82f6' }}
                                      name="Actual/Projected Stock"
                                    />
                                    {/* Predicted stock out line for comparison */}
                                    <Line
                                      type="monotone"
                                      dataKey="predictedStockOut"
                                      stroke="#8b5cf6"
                                      strokeWidth={2}
                                      strokeDasharray="5 5"
                                      dot={{ r: 2, fill: '#8b5cf6' }}
                                      name="Predicted Stock Out (7-day MA)"
                                    />
                                    <ReferenceLine
                                      y={thresholds.critical}
                                      stroke="#ef4444"
                                      strokeDasharray="5 5"
                                      label={{
                                        value: 'Critical',
                                        position: 'insideTopRight',
                                      }}
                                    />
                                    <ReferenceLine
                                      y={thresholds.low}
                                      stroke="#f59e0b"
                                      strokeDasharray="5 5"
                                      label={{
                                        value: 'Low',
                                        position: 'insideTopRight',
                                      }}
                                    />

                                    {/* Today vertical line */}
                                    {todayLinePosition && (
                                      <ReferenceLine
                                        x={todayLinePosition}
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        label={{
                                          value: 'Today',
                                          position: 'top',
                                          fill: '#10b981',
                                          fontSize: 10,
                                          fontWeight: 'bold',
                                        }}
                                      />
                                    )}
                                    <Tooltip
                                      formatter={(value, name) => [
                                        formatNumber(Number(value)),
                                        name === 'predictedStockOut'
                                          ? 'Predicted Stock Out (7-day MA)'
                                          : 'Stock Level (Ton)',
                                      ]}
                                    />
                                    <Legend fontSize={9} />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </ChartErrorBoundary>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2">
                            Daily Stock Flow
                          </h4>
                          <div className="h-24 sm:h-28 lg:h-32">
                            <ChartErrorBoundary>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={tableData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} />
                                  {/* Stock received bars */}
                                  <Bar
                                    dataKey="stockReceived"
                                    fill="#10b981"
                                    name="Stock Received"
                                    radius={[2, 2, 0, 0]}
                                  />
                                  {/* Actual stock out bars - only shows for actual data */}
                                  <Bar
                                    dataKey="actualStockOut"
                                    fill="#ef4444"
                                    name="Actual Stock Out"
                                    radius={[2, 2, 0, 0]}
                                  />
                                  {/* Predicted stock out line (7-day moving average) */}
                                  <Line
                                    type="monotone"
                                    dataKey="predictedStockOut"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 2, fill: '#8b5cf6' }}
                                    name="Predicted Stock Out (7-day MA)"
                                  />
                                  {/* Net flow line */}
                                  <Line
                                    type="monotone"
                                    dataKey="netFlow"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    name="Net Flow"
                                  />
                                  <ReferenceLine y={0} stroke="#64748b" />

                                  {/* Today vertical line */}
                                  {todayLinePosition && (
                                    <ReferenceLine
                                      x={todayLinePosition}
                                      stroke="#10b981"
                                      strokeWidth={2}
                                      strokeDasharray="5 5"
                                      label={{
                                        value: 'Today',
                                        position: 'top',
                                        fill: '#10b981',
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                      }}
                                    />
                                  )}
                                  <Tooltip
                                    formatter={(value, name) => [
                                      formatNumber(Number(value)),
                                      name === 'predictedStockOut'
                                        ? 'Predicted Stock Out (7-day MA)'
                                        : name === 'netFlow'
                                          ? 'Net Flow (Ton)'
                                          : `${name} (Ton)`,
                                    ]}
                                  />
                                  <Legend fontSize={9} />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </ChartErrorBoundary>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-500 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-base font-medium">No Data Available</p>
                        <p className="text-xs mt-1">Please select a different date range or area</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Data Table Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t.forecast_this_month_projection_table}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {filterArea} - {monthOptions[filterMonth]?.label} {filterYear} |{' '}
                      {tableData.length} entri
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            {t.forecast_projected_date || 'Date'}
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Opening Stock (Ton)
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Stock Received (Ton)
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Stock Out (Ton)
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Predicted Out (Ton)
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Deviation (Ton)
                          </th>
                          <th className="px-2 py-1 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Achievement (%)
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Closing Stock (Ton)
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Net Flow (Ton)
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Efficiency (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {tableData.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                              <div className="flex flex-col items-center">
                                <ArchiveBoxIcon className="w-12 h-12 text-slate-300 mb-3" />
                                <p className="text-sm">Tidak ada data untuk filter ini</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          tableData.map((item, index) => (
                            <tr
                              key={`${item.date}-${index}`}
                              className={`hover:bg-slate-50 transition-colors duration-150 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                              } ${
                                item.isActual
                                  ? 'border-l-4 border-green-500'
                                  : 'border-l-4 border-blue-500'
                              }`}
                            >
                              <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-slate-900">
                                {item.dateFormatted}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-600">
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    {formatNumber(item.openingStock)}
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs text-green-600 font-medium">
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    {formatNumber(item.stockReceived)}
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td
                                className={`px-2 py-1 whitespace-nowrap text-xs font-medium ${
                                  item.isActual ? 'text-red-700 bg-red-50' : 'text-slate-400'
                                }`}
                              >
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    {formatNumber(item.stockOut)}
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs text-blue-600 font-medium">
                                {formatNumber(item.predictedStockOut)}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                                {item.isActual ? (
                                  <span
                                    className={`${
                                      item.deviation >= 0 ? 'text-red-600' : 'text-green-600'
                                    }`}
                                  >
                                    {item.deviation >= 0 ? '+' : ''}
                                    {formatNumber(item.deviation)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                                {item.isActual ? (
                                  <span
                                    className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold ${
                                      item.achievementPercentage >= 90 &&
                                      item.achievementPercentage <= 110
                                        ? 'bg-green-100 text-green-800'
                                        : item.achievementPercentage >= 80 &&
                                            item.achievementPercentage <= 120
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {formatPercentage(item.achievementPercentage)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td
                                className={`px-3 py-2 whitespace-nowrap text-xs font-bold ${
                                  item.isActual ? 'text-slate-900 bg-green-50' : 'text-slate-400'
                                }`}
                              >
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    {formatNumber(item.closingStock)}
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`${
                                        item.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}
                                    >
                                      {item.netFlow >= 0 ? '+' : ''}
                                      {formatNumber(item.netFlow)}
                                    </span>
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">
                                {item.isActual ? (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.efficiency <= 80
                                          ? 'bg-green-100 text-green-800'
                                          : item.efficiency <= 100
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {formatPercentage(item.efficiency)}%
                                    </span>
                                    <span className="text-xs text-green-600">●</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        {/* Average Row */}
                        <tr className="font-semibold text-slate-700">
                          <td className="px-3 py-2 text-xs font-bold">Average</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.openingStock.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockReceived.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockOut.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedStockOut.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.deviation.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.achievementPercentage.avg)}%
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.closingStock.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.netFlow.avg)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.efficiency.avg)}%
                          </td>
                        </tr>
                        {/* Min Row */}
                        <tr className="font-medium text-slate-600">
                          <td className="px-2 py-1 text-xs font-bold">Min</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.openingStock.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockReceived.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockOut.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedStockOut.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.deviation.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.achievementPercentage.min)}%
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.closingStock.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.netFlow.min)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.efficiency.min)}%
                          </td>
                        </tr>
                        {/* Max Row */}
                        <tr className="font-medium text-slate-600">
                          <td className="px-2 py-1 text-xs font-bold">Max</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.openingStock.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockReceived.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.stockOut.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedStockOut.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.deviation.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.achievementPercentage.max)}%
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.closingStock.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.netFlow.max)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatPercentage(tableStats.efficiency.max)}%
                          </td>
                        </tr>
                        {/* Predicted Total Row */}
                        <tr className="font-bold text-blue-800 border-t border-slate-300">
                          <td className="px-3 py-2 text-xs font-bold">Predicted Total</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.openingStock.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.stockReceived.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.stockOut.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.predictedStockOut.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.deviation.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">-</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.closingStock.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.predictedData.netFlow.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">-</td>
                        </tr>
                        {/* Actual Total Row */}
                        <tr className="font-bold text-green-800 border-t border-slate-300">
                          <td className="px-3 py-2 text-xs font-bold">Actual Total</td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.openingStock.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.stockReceived.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.stockOut.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.predictedStockOut.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.deviation.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {tableStats.actualData.achievementPercentage.total > 0
                              ? formatPercentage(tableStats.actualData.achievementPercentage.avg) +
                                '%'
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.closingStock.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {formatNumber(tableStats.actualData.netFlow.total)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {tableStats.actualData.efficiency.total > 0
                              ? formatPercentage(tableStats.actualData.efficiency.avg) + '%'
                              : '-'}
                          </td>
                        </tr>
                      </tfoot>
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
