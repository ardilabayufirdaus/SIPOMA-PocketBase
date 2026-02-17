/// <reference types="node" />

import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronDown, TrendingUp, Layers, Building2, Calendar, CalendarDays } from 'lucide-react';
import { ParameterSetting, CcrFooterData } from '../../types';
import { formatDate, formatNumberIndonesian } from '../../utils/formatters';
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';

import { useRkcParameterSettings } from '../../hooks/useRkcParameterSettings';
import { useRkcCopParameters } from '../../hooks/useRkcCopParameters';
import { useRkcCopFooterParameters } from '../../hooks/useRkcCopFooterParameters';
import { useRkcCcrFooterData } from '../../hooks/useRkcCcrFooterData';

import { pb } from '../../utils/pocketbase-simple';
import { indexedDBCache } from '../../utils/cache/indexedDB';
import Modal from '../../components/Modal';
import { Card } from '../../components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ExcelJS from 'exceljs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import permissions
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import drag and drop
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Import AI Assistant
import { AiOperationsAssistant } from '../../components/ai/AiOperationsAssistant';

// Utility functions for better maintainability

const formatCopNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  return formatNumberIndonesian(num, 1);
};

// Helper function to get performance status based on failure percentage
const getPerformanceStatus = (percentage: number) => {
  if (percentage <= 15)
    return {
      status: 'Excellent',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    };
  if (percentage <= 30)
    return {
      status: 'Good',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    };
  if (percentage <= 45)
    return {
      status: 'Fair',
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    };
  return {
    status: 'Needs Improvement',
    color: 'text-red-600',
    bg: 'bg-red-100',
  };
};

const getPercentageColor = (
  percentage: number | null
): { bg: string; text: string; status: string; darkBg?: string } => {
  if (percentage === null)
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      status: 'N/A',
    };
  if (percentage < 0)
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      status: 'Low',
    };
  if (percentage > 100)
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      status: 'High',
    };
  return {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    darkBg: 'bg-emerald-500',
    status: 'Normal',
  };
};

const getQafColor = (qaf: number | null): { bg: string; text: string } => {
  if (qaf === null) return { bg: 'bg-slate-100', text: 'text-slate-600' };
  if (qaf >= 95) return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (qaf >= 85) return { bg: 'bg-amber-100', text: 'text-amber-800' };
  return { bg: 'bg-red-100', text: 'text-red-800' };
};

interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

// Statistical utility functions
const calculateStats = (
  values: (number | null | undefined)[]
): {
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
  count: number;
  completeness: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient';
} => {
  const validValues = values.filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

  if (validValues.length === 0) {
    return {
      mean: null,
      median: null,
      stdDev: null,
      min: null,
      max: null,
      count: 0,
      completeness: 0,
      trend: 'insufficient',
    };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  // Calculate trend using linear regression slope
  let trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient' = 'insufficient';
  if (validValues.length >= 3) {
    const n = validValues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = validValues.reduce((a, b) => a + b, 0);
    const sumXY = validValues.reduce((acc, val, idx) => acc + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) trend = 'stable';
    else if (slope > 0) trend = 'increasing';
    else trend = 'decreasing';
  }

  return {
    mean,
    median,
    stdDev,
    min: Math.min(...validValues),
    max: Math.max(...validValues),
    count: validValues.length,
    completeness: (validValues.length / values.length) * 100,
    trend,
  };
};

const detectAnomalies = (
  values: (number | null | undefined)[],
  mean: number,
  stdDev: number
): {
  outliers: number[];
  outlierIndices: number[];
  severity: 'low' | 'medium' | 'high';
} => {
  const validValues = values
    .map((v, idx) => ({ value: v, index: idx }))
    .filter((item) => item.value !== null && item.value !== undefined && !isNaN(item.value));

  if (validValues.length < 3 || stdDev === 0) {
    return { outliers: [], outlierIndices: [], severity: 'low' };
  }

  const outliers = validValues.filter((item) => Math.abs(item.value! - mean) > 3 * stdDev);
  const severity = outliers.length === 0 ? 'low' : outliers.length <= 2 ? 'medium' : 'high';

  return {
    outliers: outliers.map((item) => item.value!),
    outlierIndices: outliers.map((item) => item.index),
    severity,
  };
};

const calculateCorrelation = (
  data1: (number | null | undefined)[],
  data2: (number | null | undefined)[]
): number | null => {
  const validPairs = data1
    .map((v1, idx) => ({ v1, v2: data2[idx] }))
    .filter(
      (pair) =>
        pair.v1 !== null &&
        pair.v1 !== undefined &&
        pair.v2 !== null &&
        pair.v2 !== undefined &&
        !isNaN(pair.v1) &&
        !isNaN(pair.v2)
    );

  if (validPairs.length < 3) return null;

  const mean1 = validPairs.reduce((sum, pair) => sum + pair.v1!, 0) / validPairs.length;
  const mean2 = validPairs.reduce((sum, pair) => sum + pair.v2!, 0) / validPairs.length;

  const numerator = validPairs.reduce(
    (sum, pair) => sum + (pair.v1! - mean1) * (pair.v2! - mean2),
    0
  );

  const stdDev1 = Math.sqrt(
    validPairs.reduce((sum, pair) => sum + Math.pow(pair.v1! - mean1, 2), 0) / validPairs.length
  );

  const stdDev2 = Math.sqrt(
    validPairs.reduce((sum, pair) => sum + Math.pow(pair.v2! - mean2, 2), 0) / validPairs.length
  );

  if (stdDev1 === 0 || stdDev2 === 0) return null;

  return numerator / (validPairs.length * stdDev1 * stdDev2);
};

// Custom hook for safe chart rendering
const useSafeChartRendering = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to defer dimension measurement until after layout
      const measureDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newDimensions = {
            width: rect.width > 0 ? rect.width : 400, // fallback width
            height: rect.height > 0 ? rect.height : 256, // fallback height
          };

          // Only update if dimensions actually changed to prevent unnecessary re-renders
          if (
            newDimensions.width !== dimensions.width ||
            newDimensions.height !== dimensions.height
          ) {
            setDimensions(newDimensions);
          }

          // Mark as ready only if we have valid dimensions
          if (newDimensions.width > 0 && newDimensions.height > 0 && !isContainerReady) {
            setIsContainerReady(true);
          }
        }
      };

      // Defer measurement to next animation frame to ensure layout is complete
      requestAnimationFrame(measureDimensions);
    }
  });

  // Use ResizeObserver for more reliable dimension tracking if available
  useEffect(() => {
    if (!containerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;

    const updateDimensions = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          if (!isContainerReady) {
            setIsContainerReady(true);
          }
          // Clear timeout since we got valid dimensions
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
          }
        }
      }
    };

    // Try to use ResizeObserver first (more reliable)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback to window resize listener
      const handleResize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newDimensions = {
            width: rect.width > 0 ? rect.width : 400,
            height: rect.height > 0 ? rect.height : 256,
          };
          setDimensions(newDimensions);
          if (newDimensions.width > 0 && newDimensions.height > 0 && !isContainerReady) {
            setIsContainerReady(true);
          }
        }
      };

      window.addEventListener('resize', handleResize);
      // Also listen for orientation change on mobile
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    // Fallback timeout: if dimensions aren't available after 2 seconds, force render with defaults
    timeoutRef.current = setTimeout(() => {
      if (!isContainerReady) {
        setDimensions({ width: 400, height: 256 });
        setIsContainerReady(true);
      }
    }, 2000);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isContainerReady]);

  return {
    containerRef,
    isContainerReady,
    dimensions,
    containerStyle: {
      width: '100%',
      height: dimensions.height > 0 ? `${dimensions.height}px` : '256px',
      minHeight: '256px',
    },
  };
};

// Safe Chart Container Component
interface ChartDataItem {
  day: number;
  value: number | null;
  date: Date;
}

const ChartContainer: React.FC<{
  chartData: ChartDataItem[];
  parameter: ParameterSetting;
  min?: number;
  max?: number;
}> = ({ chartData, parameter, min, max }) => {
  const { containerRef, isContainerReady, containerStyle } = useSafeChartRendering();

  // Memoize chart data to prevent unnecessary recalculations
  const chartDataFormatted = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    return {
      labels: chartData.map((item) => item.day.toString().padStart(2, '0')),
      datasets: [
        // Max line (drawn first, no fill)
        ...(max !== undefined
          ? [
              {
                label: `Max (${formatCopNumber(max)})`,
                data: chartData.map(() => max),
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                borderWidth: 3,
                borderDash: [8, 4],
                fill: false,
                pointRadius: 0,
                type: 'line' as const,
                order: 2,
              },
            ]
          : []),
        // Min line with fill to max
        ...(min !== undefined
          ? [
              {
                label: `Min (${formatCopNumber(min)})`,
                data: chartData.map(() => min),
                borderColor: '#10b981',
                backgroundColor: max !== undefined ? 'rgba(34, 197, 94, 0.1)' : '#10b981',
                borderWidth: 3,
                borderDash: [8, 4],
                fill: max !== undefined ? 0 : false, // Fill to the first dataset (max line)
                pointRadius: 0,
                type: 'line' as const,
                order: 1,
              },
            ]
          : []),
        // Actual parameter line
        {
          label: parameter.parameter,
          data: chartData.map((item) => item.value),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          spanGaps: false,
          order: 0,
        },
      ],
    };
  }, [chartData, parameter, min, max]);

  // Memoize y-axis calculations
  const { yAxisMin, yAxisMax } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { yAxisMin: 0, yAxisMax: 100 };
    }

    const allValues = chartData
      .map((item) => item.value)
      .filter((val) => val !== null && val !== undefined);
    const yMin = min !== undefined ? Math.min(min, ...allValues) : Math.min(...allValues);
    const yMax = max !== undefined ? Math.max(max, ...allValues) : Math.max(...allValues);

    // Add padding (10% of range)
    const range = yMax - yMin;
    const padding = range * 0.1;
    return {
      yAxisMin: yMin - padding,
      yAxisMax: yMax + padding,
    };
  }, [chartData, min, max]);

  const options: ChartOptions<'line'> = useMemo(() => {
    if (!chartDataFormatted) {
      return {};
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            font: {
              size: 10, // ✅ Legend labels: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          titleFont: {
            size: 10, // ✅ Tooltip title & body: text-xs 10px
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal',
          },
          bodyFont: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal',
          },
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === chartDataFormatted.datasets.length - 1) {
                // Main data line
                const value = context.parsed.y;
                return `${parameter.parameter}: ${formatNumberIndonesian(value, 2)} ${parameter.unit}`;
              }
              return context.dataset.label || '';
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Tanggal',
            font: {
              size: 10, // ✅ X-axis title & ticks: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          ticks: {
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: parameter.unit,
            font: {
              size: 10, // ✅ Y-axis title & ticks: text-xs 10px
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          ticks: {
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif',
              weight: 'normal',
            },
          },
          min: yAxisMin,
          max: yAxisMax,
          beginAtZero: false, // Don't force start at zero for better data visibility
        },
      },
      elements: {
        point: {
          hoverRadius: 8,
        },
      },
    };
  }, [chartDataFormatted, parameter, yAxisMin, yAxisMax]);

  // Don't render chart until container is ready
  if (!isContainerReady || !chartDataFormatted) {
    return (
      <div ref={containerRef} style={containerStyle}>
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500 mx-auto mb-2"></div>
            Memuat chart...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <Line data={chartDataFormatted} options={options} />
    </div>
  );
};

const RkcCopAnalysisPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  // Sync Global Data Hook

  // const isSyncing = false;
  // const syncProgress = 0;
  // const syncStatus = "";
  // const error = null;
  // const syncAllData = () => {};

  const { records: allParameters } = useRkcParameterSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { records: plantUnits } = useRkcPlantUnits();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  // Set default filter so not all parameters are shown for all categories/units
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Moisture data for footer - fetch for entire month
  const [monthlyMoistureData, setMonthlyMoistureData] = useState<Map<string, number>>(new Map());

  // Feed data for capacity calculation - fetch for entire month
  const [monthlyFeedData, setMonthlyFeedData] = useState<Map<string, number>>(new Map());

  // State defined early to avoid scope issues
  // const [isSyncing, setIsSyncing] = useState(false);  // Removed in favor of hook

  // Fetch moisture data for the entire month
  useEffect(() => {
    const fetchMonthlyMoistureData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-moisture-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 60 * 60 * 1000; // 1 hour

      const moistureMap = new Map<string, number>();

      try {
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyMoistureData(cachedData);
          if (cachedData.size >= new Date(filterYear, filterMonth + 1, 0).getDate()) {
            console.log('[Moisture] Client cache loaded (Validating with server...)');
            // return; // REMOVED: Continue to server fetch to ensure freshness
          }
        }
      } catch (error) {
        /* ignore */
      }

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

      // 1. Try fetching from moisture_monitoring (Server-Side Cache)
      // This is the new centralized collection
      try {
        // Approximate filter by date range
        const aggregates = await pb.collection('rkc_moisture_monitoring').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate} 00:00:00" && date <= "${endDate} 23:59:59"`,
        });

        if (aggregates.length > 0) {
          console.log(
            `[Moisture] Found ${aggregates.length} server records (moisture_monitoring).`
          );
          aggregates.forEach((rec) => {
            const d = rec.date.split('T')[0];
            // Access stats.avg_total
            const val = rec.stats?.avg_total;
            if (val !== null && val !== undefined) {
              moistureMap.set(d, val);
            }
          });
          setMonthlyMoistureData(new Map(moistureMap));

          if (aggregates.length >= daysInMonth) {
            console.log('[Moisture] Server data complete. Skipping raw calc.');
            await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
            return;
          }
        }
      } catch (e) {
        console.warn('Moisture aggregate read fail', e);
      }

      // --- FALLBACK: RAW CALCULATION ---
      try {
        // (Keep existing Raw Calculation Logic - it is robust)
        // ... (Parameter fetching logic) ...
        const paramSettings = (await pb.collection('parameter_settings').getFullList({
          filter: `unit="${selectedUnit}" && (parameter~"H2O" || parameter~"Set. Feeder")`,
        })) as unknown as ParameterSetting[];

        const paramMap = new Map<string, string>();
        paramSettings.forEach((s: ParameterSetting) => paramMap.set(s.parameter, s.id!));

        const h2oGypsumId = paramMap.get('H2O Gypsum (%)');
        const setGypsumId = paramMap.get('Set. Feeder Gypsum (%)');
        const h2oTrassId = paramMap.get('H2O Trass (%)');
        const setTrassId = paramMap.get('Set. Feeder Trass (%)');
        const h2oLimestoneId = paramMap.get('H2O Limestone (%)');
        const setLimestoneId = paramMap.get('Set. Feeder Limestone (%)');

        const parameterIds = [
          h2oGypsumId,
          setGypsumId,
          h2oTrassId,
          setTrassId,
          h2oLimestoneId,
          setLimestoneId,
        ].filter(Boolean);

        if (parameterIds.length > 0) {
          const filterConditions = parameterIds.map((id) => `parameter_id="${id}"`).join(' || ');
          // Single Request for entire month
          const monthlyRecords = await pb.collection('rkc_ccr_parameter_data').getFullList({
            filter: `date >= "${startDate}" && date <= "${endDate}" && (${filterConditions})`,
          });

          const recordsByDate = new Map<string, any[]>();
          monthlyRecords.forEach((rec) => {
            const dateKey = rec.date.split('T')[0];
            if (!recordsByDate.has(dateKey)) recordsByDate.set(dateKey, []);
            recordsByDate.get(dateKey)?.push(rec);
          });

          // Process each day
          for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayRecords = recordsByDate.get(dateString) || [];
            if (dayRecords.length === 0) continue;

            const dataMap = new Map<string, any>();
            dayRecords.forEach((r) => dataMap.set(r.parameter_id, r));

            const hours = [];
            for (let hour = 1; hour <= 24; hour++) {
              const hourKey = `hour${hour}`;
              const getVal = (id: string | undefined) =>
                id ? (dataMap.get(id)?.[hourKey] as number | null) : null;

              const h2oGypsum = getVal(h2oGypsumId);
              const setGypsum = getVal(setGypsumId);

              const h2oTrass = getVal(h2oTrassId);
              const setTrass = getVal(setTrassId);

              const h2oLimestone = getVal(h2oLimestoneId);
              const setLimestone = getVal(setLimestoneId);

              const gypsum = h2oGypsum && setGypsum ? (setGypsum * h2oGypsum) / 100 : null;
              const trass = h2oTrass && setTrass ? (setTrass * h2oTrass) / 100 : null;
              const limestone =
                h2oLimestone && setLimestone ? (setLimestone * h2oLimestone) / 100 : null;

              // Helper for stats only (we don't persist hourly here yet, wait, we DOES need to persist hourly for compliance)
              // But logic here was simple avg of totals.
              // Actually, Monitoring Page logic is: sum(component) / sum(set) ? No, sum(hourly_total) / 24 ?
              // Monitoring Page Avg Logic: sum(column) / count.
              // Let's replicate strict Monitoring Page structure here so we can save it compatible.

              const vals = [gypsum, trass, limestone].filter((v) => v !== null && !isNaN(v));
              const total = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;

              hours.push({
                hour,
                gypsum,
                trass,
                limestone,
                total,
              });
            }

            // Calculate daily average (Footer Stat logic)
            const validTotal = hours.filter((d) => d.total !== null).map((d) => d.total!);
            const dayAvg =
              validTotal.length > 0
                ? validTotal.reduce((a, b) => a + b, 0) / validTotal.length
                : null;

            if (dayAvg !== null) {
              moistureMap.set(dateString, dayAvg);

              // --- AUTO SYNC TO MOISTURE_MONITORING ---
              // We have the full hourly data calculated. Let's save it!
              // This populates the Monitoring Page for this day too.
              if (selectedUnit) {
                (async () => {
                  try {
                    // Calc full stats
                    const validGypsum = hours
                      .filter((d) => d.gypsum !== null)
                      .map((d) => d.gypsum!);
                    const validTrass = hours.filter((d) => d.trass !== null).map((d) => d.trass!);
                    const validLimestone = hours
                      .filter((d) => d.limestone !== null)
                      .map((d) => d.limestone!);

                    const stats = {
                      avg_gypsum: validGypsum.length
                        ? validGypsum.reduce((a, b) => a + b, 0) / validGypsum.length
                        : null,
                      avg_trass: validTrass.length
                        ? validTrass.reduce((a, b) => a + b, 0) / validTrass.length
                        : null,
                      avg_limestone: validLimestone.length
                        ? validLimestone.reduce((a, b) => a + b, 0) / validLimestone.length
                        : null,
                      avg_total: dayAvg,
                    };

                    const isoDate = `${dateString} 12:00:00.000Z`;
                    const dStart = `${dateString} 00:00:00`;
                    const dEnd = `${dateString} 23:59:59`;

                    try {
                      const existing = await pb
                        .collection('rkc_moisture_monitoring')
                        .getFirstListItem(
                          `unit="${selectedUnit}" && date >= "${dStart}" && date <= "${dEnd}"`,
                          { requestKey: null }
                        );
                      // Only update if explicit diff? Or just upsert to be safe?
                      // Just upsert.
                      await pb.collection('rkc_moisture_monitoring').update(
                        existing.id,
                        {
                          hourly_data: hours,
                          stats,
                        },
                        { requestKey: null }
                      );
                    } catch {
                      await pb.collection('rkc_moisture_monitoring').create(
                        {
                          date: isoDate,
                          unit: selectedUnit,
                          hourly_data: hours,
                          stats,
                        },
                        { requestKey: null }
                      );
                    }
                  } catch (e) {
                    console.warn('Auto-sync to moisture_monitoring failed', e);
                  }
                })();
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching moisture data', err);
      }

      setMonthlyMoistureData(moistureMap);
      await indexedDBCache.set(cacheKey, moistureMap, cacheExpiry);
    };

    fetchMonthlyMoistureData();
  }, [filterYear, filterMonth, selectedCategory, selectedUnit]);

  // Fetch feed data for the entire month for capacity calculation
  useEffect(() => {
    const fetchMonthlyFeedData = async () => {
      if (!selectedCategory || !selectedUnit) return;

      const cacheKey = `monthly-feed-${selectedCategory}-${selectedUnit}-${filterYear}-${filterMonth}`;
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

      const feedMap = new Map<string, number>(); // Initialize feedMap here

      try {
        // Try to get from cache first
        const cachedData = (await indexedDBCache.get(cacheKey)) as Map<string, number> | null;
        if (cachedData) {
          setMonthlyFeedData(cachedData);
          // If cached data is complete, we can return early.
          // Otherwise, we still need to check server aggregates and potentially calculate raw.
          const daysInMonthV = new Date(filterYear, filterMonth + 1, 0).getDate();
          if (cachedData.size >= daysInMonthV) {
            console.log('[Feed] Client cache loaded (Validating with server...)');
            // return; // REMOVED: Continue to server fetch to ensure freshness
          }
          console.log('[Feed] Client cache partial. Proceeding to server check/raw calc...');
          // If partial, populate feedMap with cached data to avoid re-fetching
          cachedData.forEach((value, key) => feedMap.set(key, value));
        }
      } catch (error) {
        // console.warn('Error reading feed cache:', error);
      }

      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

      // 1. Try fetching from cop_aggregates (Server-Side Cache)
      try {
        const aggregates = await pb.collection('rkc_cop_aggregates').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        if (aggregates.length > 0) {
          console.log(`[Feed] Found ${aggregates.length} server records from cop_aggregates.`);
          aggregates.forEach((rec) => {
            const d = rec.date.split('T')[0];
            if (rec.total_feed_ton !== null && rec.total_feed_ton !== undefined) {
              feedMap.set(d, rec.total_feed_ton);
            }
          });
          // Display what we have so far
          setMonthlyFeedData(new Map(feedMap));

          const daysInMonthV = new Date(filterYear, filterMonth + 1, 0).getDate();
          if (aggregates.length >= daysInMonthV) {
            console.log('[Feed] Server data complete. Skipping raw calc.');
            await indexedDBCache.set(cacheKey, feedMap, cacheExpiry); // Re-cache if server data was complete
            return;
          }
          console.log('[Feed] Server data partial. Proceeding to raw calc...');
        } else {
          console.log('[Feed] No server data found. Calculating raw...');
        }
      } catch (e) {
        console.warn('Feed aggregate read fail', e);
      }

      // Fetch total production from ccr_material_usage for each day (Source: Capacity (ton))
      try {
        // We fetch strictly from ccr_material_usage as the source of truth for Production/Feed
        // ignoring ccr_parameter_data counters.
        const materialUsageRecords = await pb.collection('rkc_ccr_material_usage').getFullList({
          filter: `plant_unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        // Also fetch moisture for calculation
        const moistureForCalc = await pb.collection('rkc_moisture_monitoring').getFullList({
          filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
        });

        const moistMap = new Map();
        moistureForCalc.forEach((m) => {
          if (m.stats?.avg_total) moistMap.set(m.date.split('T')[0], m.stats.avg_total);
        });

        const productionByDate = new Map<string, number>();

        materialUsageRecords.forEach((rec) => {
          const dateKey = rec.date.split('T')[0];
          const currentTotal = productionByDate.get(dateKey) || 0;
          // 'total_production' is the sum of materials for that shift record
          const shiftTotal = rec.total_production || 0;
          productionByDate.set(dateKey, currentTotal + shiftTotal);
        });

        // Merge into feedMap as CAPACITY
        for (const [date, rawFeed] of productionByDate.entries()) {
          if (!feedMap.has(date) && rawFeed > 0) {
            const moisture = moistMap.get(date) ?? 0;
            const capacity = rawFeed - (moisture * rawFeed) / 100;
            feedMap.set(date, capacity);
          }
        }
        console.log('[Feed] Final Feed Map Size:', feedMap.size);
      } catch (err) {
        console.error('Error fetching material usage for capacity', err);
      }

      // Cache the computed data
      try {
        await indexedDBCache.set(cacheKey, feedMap, cacheExpiry);
      } catch (error) {
        // console.warn('Error caching feed data:', error);
      }

      setMonthlyFeedData(feedMap);

      // --- AUTO SYNC / BACKFILL TO SERVER ---
      // If we calculated new data (fallback path), save it to cop_aggregates in background
      if (feedMap.size > 0 && selectedUnit) {
        const startDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`;
        const endDate = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${daysInMonth}`;

        (async () => {
          try {
            // Get existing records for this month
            const existing = await pb.collection('rkc_cop_aggregates').getFullList({
              filter: `unit="${selectedUnit}" && date >= "${startDate}" && date <= "${endDate}"`,
            });
            const existingMap = new Map();
            existing.forEach((rec) => existingMap.set(rec.date.split('T')[0], rec));

            for (const [date, feed] of feedMap.entries()) {
              const existRec = existingMap.get(date);
              if (existRec) {
                if (existRec.total_feed_ton !== feed) {
                  await pb
                    .collection('rkc_cop_aggregates')
                    .update(existRec.id, { total_feed_ton: feed });
                }
              } else {
                // Creating solely for feed if moisture isn't there yet
                try {
                  const isoDate = `${date} 12:00:00.000Z`; // Noon UTC
                  await pb.collection('rkc_cop_aggregates').create({
                    date: isoDate,
                    unit: selectedUnit,
                    total_feed_ton: feed,
                  });
                } catch (e) {
                  /* ignore */
                }
              }
            }
          } catch (err) {
            console.warn('Auto-sync feed failed', err);
          }
        })();
      }
    };

    fetchMonthlyFeedData();
  }, [filterYear, filterMonth, selectedCategory, selectedUnit]);
  const [selectedParameterStats, setSelectedParameterStats] = useState<{
    parameter: string;
    avg: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    stdev: number | null;
    qaf: number | null;
  } | null>(null);

  const { copParameterIds } = useRkcCopParameters(selectedCategory, selectedUnit);

  // Hook untuk COP Footer Parameters
  const { copFooterParameterIds } = useRkcCopFooterParameters(selectedCategory, selectedUnit);

  // State untuk urutan parameter per user
  const [parameterOrder, setParameterOrder] = useState<string[]>([]);

  // State untuk modal breakdown
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    data: AnalysisDataRow | null;
  }>({
    isOpen: false,
    parameter: '',
    data: null,
  });

  const [hourlyBreakdownModal, setHourlyBreakdownModal] = useState<{
    isOpen: boolean;
    parameter: string;
    dayIndex: number;
    data: { hour: number; value: number | null; isOutOfRange: boolean }[];
  }>({
    isOpen: false,
    parameter: '',
    dayIndex: -1,
    data: [],
  });

  // Analysis features state
  const [showStatisticalSummary, setShowStatisticalSummary] = useState(false);
  const [showPeriodComparison, setShowPeriodComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear() - 1, // Previous year by default
  });
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState(false);
  const [showAnomalyDetection, setShowAnomalyDetection] = useState(false);
  const [showPredictiveInsights, setShowPredictiveInsights] = useState(false);

  const [showQualityMetrics, setShowQualityMetrics] = useState(false);

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
      const units = plantUnits.filter((u) => u.category === selectedCategory).map((u) => u.unit);
      if (units.length > 0 && !selectedUnit) {
        setSelectedUnit(units[0]);
      }
    }
  }, [plantUnits, selectedCategory, selectedUnit]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return plantUnits
      .filter(
        (unit) =>
          unit.category === selectedCategory &&
          permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory, permissionChecker]);

  // Memoize filtered parameters to avoid recalculating on every render
  const filteredCopParameters = useMemo(() => {
    if (!allParameters.length || !copParameterIds.length || !selectedCategory || !selectedUnit) {
      return [];
    }

    const filtered = copParameterIds
      .map((paramId) => allParameters.find((p) => p.id === paramId))
      .filter((param): param is ParameterSetting => param !== undefined)
      .filter((param) => param.category === selectedCategory && param.unit === selectedUnit);

    // Sort based on parameterOrder if available
    if (parameterOrder.length > 0) {
      return filtered.sort((a, b) => {
        const indexA = parameterOrder.indexOf(a.id);
        const indexB = parameterOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return filtered;
  }, [allParameters, copParameterIds, selectedCategory, selectedUnit, parameterOrder]);

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!selectedUnit || !unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      setSelectedUnit('');
    }
  }, [unitsForCategory, selectedUnit]);

  // Load parameter order from localStorage when user or category/unit changes
  useEffect(() => {
    if (loggedInUser && selectedCategory && selectedUnit) {
      const storageKey = `cop-analysis-order-${loggedInUser.id}-${selectedCategory}-${selectedUnit}`;
      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder);
          setParameterOrder(order);
        } catch {
          // Failed to parse saved parameter order, use default
          setParameterOrder([]);
        }
      } else {
        setParameterOrder([]);
      }
    }
  }, [loggedInUser, selectedCategory, selectedUnit]);

  // Save parameter order to localStorage when it changes
  useEffect(() => {
    if (loggedInUser && selectedCategory && selectedUnit && parameterOrder.length > 0) {
      const storageKey = `cop-analysis-order-${loggedInUser.id}-${selectedCategory}-${selectedUnit}`;
      localStorage.setItem(storageKey, JSON.stringify(parameterOrder));
    }
  }, [parameterOrder, loggedInUser, selectedCategory, selectedUnit]);

  const plantCategories = useMemo(() => {
    // Filter categories based on user permissions - only show categories where user has access to at least one unit
    const allowedCategories = plantUnits
      .filter((unit) =>
        permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.category);

    // Remove duplicates and sort
    return [...new Set(allowedCategories)].sort();
  }, [plantUnits, permissionChecker]);

  const { getFooterDataForDate } = useRkcCcrFooterData();

  // State variables for analysis data
  const [analysisData, setAnalysisData] = useState<AnalysisDataRow[]>([]);
  const [footerData, setFooterData] = useState<AnalysisDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    // Reset previous state
    setIsLoading(true);
    setError(null);

    try {
      // Validate required data
      if (!selectedCategory || !selectedUnit) {
        setAnalysisData([]);
        setFooterData([]);
        setIsLoading(false);
        return;
      }

      // Get footer parameters from allParameters based on copFooterParameterIds
      const footerParameters = allParameters.filter((param) =>
        copFooterParameterIds.includes(param.id)
      );

      // Clear cache for fresh data
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
        return date.toISOString().split('T')[0];
      });

      // Clear existing cache for this month
      const clearCachePromises = dates.map(async (dateString) => {
        const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
        await indexedDBCache.delete(cacheKey);
      });
      await Promise.all(clearCachePromises);

      const dailyAverages = new Map<string, Map<string, number>>();

      // Get footer data for all dates in the month with caching
      const footerDataPromises = dates.map(async (dateString) => {
        const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
        let footerData = (await indexedDBCache.get(cacheKey)) as CcrFooterData[] | null;

        if (!footerData) {
          // Fetch from API if not in cache
          footerData = (await getFooterDataForDate(dateString)) as unknown as CcrFooterData[];
          // Cache the data with TTL (24 hours)
          await indexedDBCache.set(cacheKey, footerData, 24 * 60 * 60 * 1000);
        }

        return footerData;
      });

      const allFooterDataForMonth: CcrFooterData[][] = await Promise.all(footerDataPromises);

      allFooterDataForMonth.flat().forEach((footerData) => {
        // Use footer average data instead of calculating from hourly values
        if (
          footerData.average !== null &&
          footerData.average !== undefined &&
          !isNaN(footerData.average)
        ) {
          if (!dailyAverages.has(footerData.parameter_id)) {
            dailyAverages.set(footerData.parameter_id, new Map());
          }
          dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
        }
      });

      // Process main parameters data
      const mainData = await new Promise<AnalysisDataRow[]>((resolve) => {
        setTimeout(() => {
          const result = filteredCopParameters
            .map((parameter) => {
              try {
                // Validate parameter has required fields
                if (!parameter || !parameter.id || !parameter.parameter) {
                  return null;
                }

                const dailyValues = dates.map((dateString) => {
                  const avg = dailyAverages.get(parameter.id)?.get(dateString);

                  // Validate average value
                  if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                    return { value: null, raw: undefined };
                  }

                  // Use helper function for consistent min/max calculation
                  const min_value = parameter.min_value;
                  const max_value = parameter.max_value;

                  // Validate min/max values
                  if (min_value === undefined || max_value === undefined) {
                    return { value: null, raw: avg };
                  }

                  if (max_value <= min_value) {
                    return { value: null, raw: avg };
                  }

                  if (avg === undefined) {
                    return { value: null, raw: avg };
                  }

                  const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                  // Validate percentage calculation
                  if (isNaN(percentage) || !isFinite(percentage)) {
                    return { value: null, raw: avg };
                  }

                  return { value: percentage, raw: avg };
                });

                const validDailyPercentages = dailyValues
                  .map((d) => d.value)
                  .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                const monthlyAverage =
                  validDailyPercentages.length > 0
                    ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                      validDailyPercentages.length
                    : null;

                const validDailyRaw = dailyValues
                  .map((d) => d.raw)
                  .filter(
                    (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                  );
                const monthlyAverageRaw =
                  validDailyRaw.length > 0
                    ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                    : null;

                return {
                  parameter,
                  dailyValues,
                  monthlyAverage,
                  monthlyAverageRaw,
                };
              } catch {
                return null;
              }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

          resolve(result);
        }, 0);
      });

      // Process footer parameters data independently
      const footerResult = await new Promise<AnalysisDataRow[]>((resolve) => {
        setTimeout(() => {
          const result = footerParameters
            .map((parameter) => {
              try {
                // Validate parameter has required fields
                if (!parameter || !parameter.id || !parameter.parameter) {
                  return null;
                }

                const dailyValues = dates.map((dateString) => {
                  const avg = dailyAverages.get(parameter.id)?.get(dateString);

                  // Validate average value
                  if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                    return { value: null, raw: undefined };
                  }

                  // Use helper function for consistent min/max calculation
                  const min_value = parameter.min_value;
                  const max_value = parameter.max_value;

                  // Validate min/max values
                  if (min_value === undefined || max_value === undefined) {
                    return { value: null, raw: avg };
                  }

                  if (max_value <= min_value) {
                    return { value: null, raw: avg };
                  }

                  if (avg === undefined) {
                    return { value: null, raw: avg };
                  }

                  const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                  // Validate percentage calculation
                  if (isNaN(percentage) || !isFinite(percentage)) {
                    return { value: null, raw: avg };
                  }

                  return { value: percentage, raw: avg };
                });

                const validDailyPercentages = dailyValues
                  .map((d) => d.value)
                  .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                const monthlyAverage =
                  validDailyPercentages.length > 0
                    ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                      validDailyPercentages.length
                    : null;

                const validDailyRaw = dailyValues
                  .map((d) => d.raw)
                  .filter(
                    (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                  );
                const monthlyAverageRaw =
                  validDailyRaw.length > 0
                    ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                    : null;

                return {
                  parameter,
                  dailyValues,
                  monthlyAverage,
                  monthlyAverageRaw,
                };
              } catch {
                return null;
              }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

          resolve(result);
        }, 0);
      });

      setAnalysisData(mainData);
      setFooterData(footerResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(
        `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
      );
      setAnalysisData([]);
      setFooterData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      // Reset previous state
      setIsLoading(true);
      setError(null);

      try {
        // Validate required data
        if (!selectedCategory || !selectedUnit) {
          setAnalysisData([]);
          setFooterData([]);
          setIsLoading(false);
          return;
        }

        if (filteredCopParameters.length === 0) {
          setAnalysisData([]);
          setFooterData([]);
          setIsLoading(false);
          return;
        }

        // Get footer parameters from allParameters based on copFooterParameterIds
        const footerParameters = allParameters.filter((param) =>
          copFooterParameterIds.includes(param.id)
        );

        // Check cache first
        // Temporarily disabled due to authentication issues
        // const cachedAnalysis = await getCachedAnalysis(
        //   selectedCategory,
        //   selectedUnit,
        //   filterYear,
        //   filterMonth,
        //   selectedCementType
        // );

        // if (cachedAnalysis) {
        //   setAnalysisData(cachedAnalysis);
        //   setIsLoading(false);
        //   return;
        // }

        // Cache miss - perform full calculation
        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(filterYear, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        const dailyAverages = new Map<string, Map<string, number>>();

        // Get footer data for all dates in the month with caching
        const footerDataPromises = dates.map(async (dateString) => {
          const cacheKey = `footer-data-${dateString}-${selectedCategory}-${selectedUnit}`;
          let footerData = (await indexedDBCache.get(cacheKey)) as CcrFooterData[] | null;

          if (!footerData) {
            // Fetch from API if not in cache
            footerData = (await getFooterDataForDate(dateString)) as unknown as CcrFooterData[];
            // Cache the data with TTL (24 hours)
            await indexedDBCache.set(cacheKey, footerData, 24 * 60 * 60 * 1000);
          }

          return footerData;
        });

        const allFooterDataForMonth: CcrFooterData[][] = await Promise.all(footerDataPromises);

        allFooterDataForMonth.flat().forEach((footerData) => {
          // Use footer average data instead of calculating from hourly values
          if (
            footerData.average !== null &&
            footerData.average !== undefined &&
            !isNaN(footerData.average)
          ) {
            if (!dailyAverages.has(footerData.parameter_id)) {
              dailyAverages.set(footerData.parameter_id, new Map());
            }
            dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
          }
        });

        // Process data asynchronously to avoid blocking UI
        const data = await new Promise<AnalysisDataRow[]>((resolve) => {
          setTimeout(() => {
            const result = filteredCopParameters
              .map((parameter) => {
                try {
                  // Validate parameter has required fields
                  if (!parameter || !parameter.id || !parameter.parameter) {
                    return null;
                  }

                  const dailyValues = dates.map((dateString) => {
                    const avg = dailyAverages.get(parameter.id)?.get(dateString);

                    // Validate average value
                    if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                      return { value: null, raw: undefined };
                    }

                    // Use helper function for consistent min/max calculation
                    const min_value = parameter.min_value;
                    const max_value = parameter.max_value;

                    // Validate min/max values
                    if (min_value === undefined || max_value === undefined) {
                      return { value: null, raw: avg };
                    }

                    if (max_value <= min_value) {
                      return { value: null, raw: avg };
                    }

                    if (avg === undefined) {
                      return { value: null, raw: avg };
                    }

                    const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                    // Validate percentage calculation
                    if (isNaN(percentage) || !isFinite(percentage)) {
                      return { value: null, raw: avg };
                    }

                    return { value: percentage, raw: avg };
                  });

                  const validDailyPercentages = dailyValues
                    .map((d) => d.value)
                    .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                  const monthlyAverage =
                    validDailyPercentages.length > 0
                      ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                        validDailyPercentages.length
                      : null;

                  const validDailyRaw = dailyValues
                    .map((d) => d.raw)
                    .filter(
                      (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                    );
                  const monthlyAverageRaw =
                    validDailyRaw.length > 0
                      ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                      : null;

                  return {
                    parameter,
                    dailyValues,
                    monthlyAverage,
                    monthlyAverageRaw,
                  };
                } catch {
                  return null;
                }
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);

            resolve(result);
          }, 0); // Use setTimeout to move to next tick, preventing UI blocking
        });

        setAnalysisData(data);

        // Process footer parameters data independently
        const footerResult = await new Promise<AnalysisDataRow[]>((resolve) => {
          setTimeout(() => {
            const result = footerParameters
              .map((parameter) => {
                try {
                  // Validate parameter has required fields
                  if (!parameter || !parameter.id || !parameter.parameter) {
                    return null;
                  }

                  const dailyValues = dates.map((dateString) => {
                    const avg = dailyAverages.get(parameter.id)?.get(dateString);

                    // Validate average value
                    if (avg !== undefined && (isNaN(avg) || !isFinite(avg))) {
                      return { value: null, raw: undefined };
                    }

                    // Use helper function for consistent min/max calculation
                    const min_value = parameter.min_value;
                    const max_value = parameter.max_value;

                    // Validate min/max values
                    if (min_value === undefined || max_value === undefined) {
                      return { value: null, raw: avg };
                    }

                    if (max_value <= min_value) {
                      return { value: null, raw: avg };
                    }

                    if (avg === undefined) {
                      return { value: null, raw: avg };
                    }

                    const percentage = ((avg - min_value) / (max_value - min_value)) * 100;

                    // Validate percentage calculation
                    if (isNaN(percentage) || !isFinite(percentage)) {
                      return { value: null, raw: avg };
                    }

                    return { value: percentage, raw: avg };
                  });

                  const validDailyPercentages = dailyValues
                    .map((d) => d.value)
                    .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v));
                  const monthlyAverage =
                    validDailyPercentages.length > 0
                      ? validDailyPercentages.reduce((a, b) => a + b, 0) /
                        validDailyPercentages.length
                      : null;

                  const validDailyRaw = dailyValues
                    .map((d) => d.raw)
                    .filter(
                      (v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v)
                    );
                  const monthlyAverageRaw =
                    validDailyRaw.length > 0
                      ? validDailyRaw.reduce((a, b) => a + b, 0) / validDailyRaw.length
                      : null;

                  return {
                    parameter,
                    dailyValues,
                    monthlyAverage,
                    monthlyAverageRaw,
                  };
                } catch {
                  return null;
                }
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);

            resolve(result);
          }, 0);
        });

        setFooterData(footerResult);

        // Save to cache for future use
        // Temporarily disabled due to authentication issues
        // await saveAnalysisToCache(
        //   selectedCategory,
        //   selectedUnit,
        //   filterMonth,
        //   data
        // );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(
          `Failed to load COP analysis data: ${errorMessage}. Please check your filters and try again.`
        );
        setAnalysisData([]);
        setFooterData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndAnalyze();
  }, [filterMonth, filterYear, filteredCopParameters, comparisonPeriod, monthlyMoistureData]);
  const dailyQaf = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { daily: [], monthly: { value: null, inRange: 0, total: 0 } };
    }

    // Use all parameters from analysisData for QAF calculation
    const mainParameters = analysisData;

    const daysInMonth = mainParameters[0]?.dailyValues.length || 0;
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

      mainParameters.forEach((paramRow) => {
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
      totalWithValueMonthly > 0 ? (totalInRangeMonthly / totalWithValueMonthly) * 100 : null;

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
      validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validValues.length;
    const stdev = Math.sqrt(variance);

    return {
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdev: Math.round(stdev * 100) / 100,
      qaf: row.monthlyAverage ? Math.round(row.monthlyAverage * 100) / 100 : null,
    };
  };

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  // Get available years with COP data for the selected category/unit
  const [availableYears, setAvailableYears] = useState<number[]>(yearOptions);

  const availableYearsWithData = useMemo(() => availableYears, [availableYears]);

  // Fetch available years with data when category/unit changes
  useEffect(() => {
    const fetchAvailableYears = async () => {
      if (!selectedCategory || !selectedUnit || !filteredCopParameters.length) {
        setAvailableYears(yearOptions);
        return;
      }

      try {
        // Optimization: Use cop_aggregates instead of ccr_footer_data
        // cop_aggregates is much smaller (1 record per day) vs footer_data (many per day)
        const records = await pb.collection('rkc_cop_aggregates').getFullList({
          filter: `unit="${selectedUnit}"`,
          fields: 'date',
          sort: '-date',
        });

        // Extract unique years
        const yearsSet = new Set<number>();
        records.forEach((record) => {
          if (record.date) {
            const year = new Date(record.date).getFullYear();
            yearsSet.add(year);
          }
        });

        const availableYearsList = Array.from(yearsSet).sort((a, b) => b - a);

        if (availableYearsList.length === 0) {
          setAvailableYears(yearOptions);
        } else {
          setAvailableYears(availableYearsList);
        }
      } catch (err) {
        console.warn('Failed to fetch available years, defaulting', err);
        setAvailableYears(yearOptions);
      }
    };

    fetchAvailableYears();
  }, [selectedCategory, selectedUnit, filteredCopParameters, yearOptions]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: [
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember',
        ][i],
      })),
    []
  );

  const daysHeader = useMemo(
    () =>
      analysisData[0]?.dailyValues.map((_, index) => index + 1) ||
      Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => i + 1),
    [analysisData, filterYear, filterMonth]
  );

  // Statistical Analysis Computations
  const statisticalSummary = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);
      const min = paramData.parameter.min_value;
      const max = paramData.parameter.max_value;

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        ...stats,
        targetMin: min,
        targetMax: max,
        unit: paramData.parameter.unit,
      };
    });
  }, [analysisData]);

  const anomalyDetection = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);

      if (!stats.mean || !stats.stdDev) {
        return {
          parameter: paramData.parameter.parameter,
          parameterId: paramData.parameter.id,
          outliers: [],
          outlierIndices: [],
          severity: 'low' as const,
          totalDays: rawValues.length,
        };
      }

      const anomalies = detectAnomalies(rawValues, stats.mean, stats.stdDev);

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        ...anomalies,
        totalDays: rawValues.length,
      };
    });
  }, [analysisData]);

  const correlationMatrix = useMemo(() => {
    if (!analysisData || analysisData.length < 2) return [];

    const correlations: Array<{
      param1: string;
      param2: string;
      correlation: number | null;
      strength: 'weak' | 'moderate' | 'strong' | 'none';
    }> = [];

    for (let i = 0; i < analysisData.length; i++) {
      for (let j = i + 1; j < analysisData.length; j++) {
        const data1 = analysisData[i].dailyValues.map((d) => d.raw);
        const data2 = analysisData[j].dailyValues.map((d) => d.raw);
        const correlation = calculateCorrelation(data1, data2);

        let strength: 'weak' | 'moderate' | 'strong' | 'none' = 'none';
        if (correlation !== null) {
          const absCorr = Math.abs(correlation);
          if (absCorr >= 0.8) strength = 'strong';
          else if (absCorr >= 0.5) strength = 'moderate';
          else if (absCorr >= 0.3) strength = 'weak';
        }

        correlations.push({
          param1: analysisData[i].parameter.parameter,
          param2: analysisData[j].parameter.parameter,
          correlation,
          strength,
        });
      }
    }

    return correlations.sort((a, b) => {
      if (a.correlation === null && b.correlation === null) return 0;
      if (a.correlation === null) return 1;
      if (b.correlation === null) return -1;
      return Math.abs(b.correlation) - Math.abs(a.correlation);
    });
  }, [analysisData]);

  const qualityMetrics = useMemo(() => {
    if (!analysisData || analysisData.length === 0)
      return {
        overallStability: 0,
        averageCompleteness: 0,
        parameterCount: 0,
        totalDataPoints: 0,
        validDataPoints: 0,
      };

    let totalStability = 0;
    let totalCompleteness = 0;
    let totalDataPoints = 0;
    let validDataPoints = 0;

    analysisData.forEach((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);

      // Stability score based on coefficient of variation (lower is better)
      const stability =
        stats.stdDev && stats.mean ? (stats.stdDev / Math.abs(stats.mean)) * 100 : 100;
      totalStability += Math.max(0, 100 - stability); // Invert so higher is better

      totalCompleteness += stats.completeness;
      totalDataPoints += rawValues.length;
      validDataPoints += stats.count;
    });

    return {
      overallStability: totalStability / analysisData.length,
      averageCompleteness: totalCompleteness / analysisData.length,
      parameterCount: analysisData.length,
      totalDataPoints,
      validDataPoints,
    };
  }, [analysisData]);

  // Period Comparison Data
  const [comparisonData, setComparisonData] = useState<AnalysisDataRow[]>([]);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Fetch comparison data when comparison period changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (
        !selectedCategory ||
        !selectedUnit ||
        !filteredCopParameters.length ||
        comparisonPeriod.year === filterYear
      ) {
        setComparisonData([]);
        return;
      }

      setIsLoadingComparison(true);
      try {
        // Fetch data for the comparison year and same month
        const daysInMonth = new Date(comparisonPeriod.year, filterMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(Date.UTC(comparisonPeriod.year, filterMonth, i + 1));
          return date.toISOString().split('T')[0];
        });

        // Get footer data for all dates in the comparison month
        const footerDataPromises = dates.map((dateString) => getFooterDataForDate(dateString));
        const allFooterDataForMonth = await Promise.all(footerDataPromises);

        // Process the data similar to current analysis
        const dailyAverages = new Map<string, Map<string, number>>();

        allFooterDataForMonth.flat().forEach((footerData) => {
          if (
            footerData.average !== null &&
            footerData.average !== undefined &&
            !isNaN(footerData.average)
          ) {
            if (!dailyAverages.has(footerData.parameter_id)) {
              dailyAverages.set(footerData.parameter_id, new Map());
            }
            dailyAverages.get(footerData.parameter_id)!.set(footerData.date, footerData.average);
          }
        });

        // Build comparison analysis data
        const comparisonAnalysisData = filteredCopParameters
          .map((parameter) => {
            const dailyValues: ChartDataItem[] = dates.map((dateString, dayIndex) => {
              const day = dayIndex + 1;
              const date = new Date(comparisonPeriod.year, filterMonth, day);
              const avg = dailyAverages.get(parameter.id)?.get(dateString) || null;

              return {
                day,
                value: avg,
                date,
              };
            });

            return {
              parameter,
              dailyValues: dailyValues.map((item) => ({ value: item.value, raw: item.value })),
              monthlyAverage: null, // Will be calculated if needed
              monthlyAverageRaw: null,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        setComparisonData(comparisonAnalysisData);
      } catch {
        setComparisonData([]);
      } finally {
        setIsLoadingComparison(false);
      }
    };

    fetchComparisonData();
  }, [
    comparisonPeriod,
    filterMonth,
    selectedCategory,
    selectedUnit,
    filteredCopParameters,
    getFooterDataForDate,
  ]);

  const periodComparison = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const currentStats = calculateStats(paramData.dailyValues.map((d) => d.raw));

      // Find comparison data for this parameter
      const comparisonParamData = comparisonData.find(
        (comp) => comp.parameter.id === paramData.parameter.id
      );

      let previousMean = null;
      let previousCompleteness = 0;

      if (comparisonParamData) {
        const comparisonStats = calculateStats(comparisonParamData.dailyValues.map((d) => d.raw));
        previousMean = comparisonStats.mean;
        previousCompleteness = comparisonStats.completeness;
      }

      const delta =
        currentStats.mean && previousMean
          ? ((currentStats.mean - previousMean) / previousMean) * 100
          : null;

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        current: {
          mean: currentStats.mean,
          completeness: currentStats.completeness,
        },
        previous: {
          mean: previousMean,
          completeness: previousCompleteness,
        },
        delta,
        trend:
          delta !== null
            ? delta > 0
              ? 'increased'
              : delta < 0
                ? 'decreased'
                : 'stable'
            : 'unknown',
      };
    });
  }, [analysisData, comparisonData]);

  // Predictive Insights
  const predictiveInsights = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData.map((paramData) => {
      const rawValues = paramData.dailyValues.map((d) => d.raw);
      const stats = calculateStats(rawValues);
      const targetMin = paramData.parameter.min_value;
      const targetMax = paramData.parameter.max_value;

      // Simple linear forecasting
      const validValues = rawValues.filter(
        (v) => v !== null && v !== undefined && !isNaN(v)
      ) as number[];
      let forecast = null;
      let risk = 'low';

      if (validValues.length >= 3) {
        // Calculate trend slope
        const n = validValues.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = validValues.reduce((a, b) => a + b, 0);
        const sumXY = validValues.reduce((acc, val, idx) => acc + val * idx, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const lastValue = validValues[validValues.length - 1];

        // Forecast for next 7 days
        forecast = lastValue + slope * 7;

        // Determine risk level
        if (targetMin !== undefined && targetMax !== undefined) {
          if (forecast < targetMin || forecast > targetMax) {
            risk = 'high';
          } else if (forecast < targetMin * 1.05 || forecast > targetMax * 0.95) {
            risk = 'medium';
          }
        }
      }

      return {
        parameter: paramData.parameter.parameter,
        parameterId: paramData.parameter.id,
        currentValue: stats.mean,
        forecast,
        targetMin,
        targetMax,
        risk,
        trend: stats.trend,
        unit: paramData.parameter.unit,
      };
    });
  }, [analysisData]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(analysisData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update analysisData
    setAnalysisData(items);

    // Update parameterOrder
    const newOrder = items.map((item) => item.parameter.id);
    setParameterOrder(newOrder);
  };

  // Export to Excel function
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('COP Analysis');

    // Set column widths
    worksheet.columns = [
      { width: 5 }, // No
      { width: 25 }, // Parameter
      { width: 8 }, // Min
      { width: 8 }, // Max
      ...daysHeader.map(() => ({ width: 8 })), // Days
      { width: 10 }, // Avg
    ];

    // Header row
    const headerRow = worksheet.addRow(['No.', 'Parameter', 'Min', 'Max', ...daysHeader, 'Avg.']);

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows
    analysisData.forEach((row, rowIndex) => {
      const dataRow = [
        rowIndex + 1,
        row.parameter.parameter,
        formatCopNumber(row.parameter.min_value),
        formatCopNumber(row.parameter.max_value),
        ...row.dailyValues.map((day) => formatCopNumber(day.raw)),
        formatCopNumber(row.monthlyAverageRaw),
      ];

      const excelRow = worksheet.addRow(dataRow);

      // Style data cells
      excelRow.eachCell((cell, colNumber) => {
        cell.font = { size: 9 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (colNumber === 1) {
          // No column - left align
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colNumber === 2) {
          // Parameter column - left align
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          // Other columns - center align
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Color coding for daily values
        if (colNumber >= 5 && colNumber <= 4 + daysHeader.length) {
          const dayIndex = colNumber - 5;
          const dayData = row.dailyValues[dayIndex];
          if (dayData && dayData.value !== null) {
            const colors = getPercentageColor(dayData.value);
            let bgColor = 'FFFFFFFF'; // default white

            if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
            else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
            else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor },
            };
          }
        }

        // Monthly average column
        if (colNumber === 4 + daysHeader.length + 1) {
          const colors = getPercentageColor(row.monthlyAverage);
          let bgColor = 'FFFFFFFF'; // default white

          if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
          else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
          else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor },
          };
          cell.font = { bold: true, size: 9 };
        }
      });
    });

    // Footer rows - QAF Daily
    const qafRow = worksheet.addRow([
      '',
      '',
      '',
      'QAF Daily',
      ...dailyQaf.daily.map((qaf) =>
        qaf.value !== null && !isNaN(qaf.value) ? `${formatCopNumber(qaf.value)}%` : '-'
      ),
      dailyQaf.monthly.value !== null && !isNaN(dailyQaf.monthly.value)
        ? `${formatCopNumber(dailyQaf.monthly.value)}%`
        : '-',
    ]);

    qafRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 9 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (colNumber >= 5 && colNumber <= 4 + daysHeader.length) {
        const qaf = dailyQaf.daily[colNumber - 5];
        const colors = getQafColor(qaf.value);
        let bgColor = 'FFFFFFFF';

        if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
        else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
        else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
      }

      if (colNumber === 4 + daysHeader.length + 1) {
        const colors = getQafColor(dailyQaf.monthly.value);
        let bgColor = 'FFFFFFFF';

        if (colors.bg.includes('bg-red-')) bgColor = 'FFFFE5E5';
        else if (colors.bg.includes('bg-yellow-')) bgColor = 'FFFFF3CD';
        else if (colors.bg.includes('bg-green-')) bgColor = 'FFD1ECF1';

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
      }
    });

    // Moisture Content row
    const moistureRow = worksheet.addRow([
      '',
      '',
      '',
      '% Moisture Content',
      ...Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
        const day = i + 1;
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyAverage = monthlyMoistureData.get(dateString);
        return dailyAverage !== undefined && !isNaN(dailyAverage)
          ? `${formatCopNumber(dailyAverage)}%`
          : '-';
      }),
      (() => {
        const validValues = Array.from(monthlyMoistureData.values()).filter(
          (v) => v !== null && v !== undefined && !isNaN(v)
        );
        if (validValues.length === 0) return '-';
        const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        return `${formatCopNumber(average)}%`;
      })(),
    ]);

    moistureRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Capacity row
    const capacityRow = worksheet.addRow([
      '',
      '',
      '',
      'Capacity (ton)',
      ...Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
        const day = i + 1;
        const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyFeed = monthlyFeedData.get(dateString);
        const dailyMoisture = monthlyMoistureData.get(dateString);
        const capacity =
          dailyFeed && dailyMoisture !== undefined
            ? dailyFeed - (dailyMoisture * dailyFeed) / 100
            : null;
        return capacity !== null && !isNaN(capacity) ? formatCopNumber(capacity) : '-';
      }),
      (() => {
        const validCapacities: number[] = [];
        Array.from({ length: new Date(filterYear, filterMonth + 1, 0).getDate() }, (_, i) => {
          const day = i + 1;
          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const feed = monthlyFeedData.get(dateString); // Now that total_feed_ton stores Calculated Capacity (synced), we use it directly.
          if (feed !== undefined && feed !== null) {
            // feed is now Capacity from cop_aggregates
            validCapacities.push(feed);
          }
        });
        if (validCapacities.length === 0) return '-';
        const average = validCapacities.reduce((sum, val) => sum + val, 0) / validCapacities.length;
        return formatCopNumber(average);
      })(),
    ]);

    capacityRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F7E6' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Generate filename
    const monthName = new Date(filterYear, filterMonth).toLocaleString('id-ID', { month: 'long' });
    const filename = `COP_Analysis_${selectedCategory}_${selectedUnit}_${monthName}_${filterYear}.xlsx`;

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-ubuntu-aubergine text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-12">
        {/* Premium Ubuntu Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-ubuntu-aubergine via-ubuntu-darkAubergine to-ubuntu-aubergine p-4 sm:p-6 lg:p-8 shadow-2xl rounded-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ubuntu-orange opacity-10 rounded-full -mr-20 -mt-20 blur-3xl shadow-glow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-ubuntu-midAubergine opacity-20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="animate-fade-in group">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 bg-ubuntu-orange rounded-xl shadow-lg shadow-ubuntu-orange/30 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
                  {t.op_cop_analysis} (RKC)
                </h1>
              </div>
              <p className="text-ubuntu-warmGrey text-sm sm:text-base lg:text-lg max-w-2xl font-medium opacity-90">
                RKC Comprehensive parameter performance monitoring and analytics.
              </p>
            </div>

            {/* Global Sync Button - Removed */}
          </div>
        </div>

        {/* Sync Progress Modal */}

        {/* Filter Section - Separate Card */}
        <div className="bg-white/70 dark:bg-ubuntu-aubergine/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 animate-scale-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Plant Category */}
            <div className="space-y-1.5 sm:space-y-2 col-span-2 sm:col-span-1">
              <label
                htmlFor="cop-filter-category"
                className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Layers className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Category
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-xs sm:text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Unit Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="cop-filter-unit"
                className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Unit
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full appearance-none px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="cop-filter-month"
                className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Month
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full appearance-none px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-xs sm:text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-ubuntu-orange transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="cop-filter-year"
                className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-ubuntu-warmGrey uppercase tracking-widest pl-1"
              >
                <CalendarDays className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Year
              </label>
              <div className="relative group">
                <select
                  id="cop-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full appearance-none px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange text-xs sm:text-sm font-semibold transition-all duration-300 hover:border-ubuntu-orange hover:shadow-md cursor-pointer shadow-sm"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        {/* Analysis Features Tabs */}
        <Card
          variant="elevated"
          padding="md"
          className="bg-white/80 backdrop-blur-sm shadow-xl border-0"
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStatisticalSummary(!showStatisticalSummary)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showStatisticalSummary
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              📊 Statistical Summary
            </button>
            <button
              onClick={() => setShowPeriodComparison(!showPeriodComparison)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showPeriodComparison
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
              }`}
            >
              📈 Period Comparison
            </button>
            <button
              onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showCorrelationMatrix
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
              }`}
            >
              🔗 Correlation Matrix
            </button>
            <button
              onClick={() => setShowAnomalyDetection(!showAnomalyDetection)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showAnomalyDetection
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
              }`}
            >
              ⚠️ Anomaly Detection
            </button>
            <button
              onClick={() => setShowPredictiveInsights(!showPredictiveInsights)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showPredictiveInsights
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200'
              }`}
            >
              🔮 Predictive Insights
            </button>
            <button
              onClick={() => setShowQualityMetrics(!showQualityMetrics)}
              className={`px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
                showQualityMetrics
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              🏆 Quality Metrics
            </button>
          </div>
        </Card>
        {/* Statistical Summary Panel */}
        {showStatisticalSummary && statisticalSummary.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-xl transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">
                📊 Statistical Summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Advanced statistical breakdown of RKC parameters for the current month.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 text-xs transition-all duration-300">
              {statisticalSummary.map((stat) => (
                <div
                  key={stat.parameterId}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl group hover:shadow-2xl transition-all duration-300"
                >
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                    {stat.parameter}
                  </h3>
                  <div className="space-y-2.5 font-mono text-[10px] sm:text-[11px]">
                    {[
                      { label: 'Mean', val: stat.mean !== null ? formatCopNumber(stat.mean) : '-' },
                      { label: 'Median', val: stat.median !== null ? formatCopNumber(stat.median) : '-' },
                      { label: 'Std Dev', val: stat.stdDev !== null ? formatCopNumber(stat.stdDev) : '-' },
                      { label: 'Range', val: `${stat.min !== null ? formatCopNumber(stat.min) : '-'}-${stat.max !== null ? formatCopNumber(stat.max) : '-'}` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          {item.label}
                        </span>
                        <span className="text-slate-900 dark:text-white font-black">
                          {item.val}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Complete
                      </span>
                      <span
                        className={`font-black ${
                          stat.completeness >= 80
                            ? 'text-emerald-600'
                            : stat.completeness >= 60
                              ? 'text-ubuntu-orange'
                              : 'text-rose-600'
                        }`}
                      >
                        {stat.completeness.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Anomaly Detection Panel */}
        {showAnomalyDetection && anomalyDetection.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-xl transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest">
                ⚠️ Anomaly Detection
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Intelligent outlier detection using the advanced 3-sigma rule methodology.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 text-xs transition-all duration-300">
              {anomalyDetection.map((anomaly) => (
                <div
                  key={anomaly.parameterId}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl group hover:shadow-2xl transition-all duration-300"
                >
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                    {anomaly.parameter}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                        Outliers
                      </span>
                      <span className={`font-mono font-black ${anomaly.outliers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {anomaly.outliers.length}/{anomaly.totalDays}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                        Severity
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        anomaly.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                        anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Correlation Matrix Panel */}
        {showCorrelationMatrix && correlationMatrix.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-xl transition-all duration-300 overflow-hidden">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-400 uppercase tracking-widest">
                🔗 Parameter Correlation
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Identifying hidden dependencies and process relationships across RKC parameters.
              </p>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden border border-white/20 rounded-3xl">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/40 dark:bg-white/5 backdrop-blur-md">
                      <tr>
                        {['Parameter Pair', 'Correlation', 'Strength', 'Direction'].map((h) => (
                          <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-white/10">
                      {correlationMatrix.map((corr, idx) => (
                        <tr key={idx} className="hover:bg-white/20 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-ubuntu-orange transition-colors">{corr.param1}</span>
                              <span className="text-[10px] font-bold text-slate-500">vs {corr.param2}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-black text-slate-700 dark:text-slate-300">
                            {corr.correlation !== null ? corr.correlation.toFixed(3) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              corr.strength === 'strong' ? 'bg-rose-100 text-rose-700 shadow-lg shadow-rose-500/20' :
                              corr.strength === 'moderate' ? 'bg-amber-100 text-amber-700 shadow-lg shadow-amber-500/20' :
                              corr.strength === 'weak' ? 'bg-sky-100 text-sky-700 shadow-lg shadow-sky-500/20' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {corr.strength}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {corr.correlation !== null && (
                              <span className={`p-2 rounded-xl text-lg font-black bg-white/40 backdrop-blur-sm shadow-inner ${
                                corr.correlation > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {corr.correlation > 0 ? '↗️' : '↘️'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Quality Metrics Dashboard */}
        {showQualityMetrics && (
          <div className="bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-blue-900/10 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-2xl backdrop-blur-3xl transition-all duration-500">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-[0.2em]">
                🏆 Quality Metrics
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-2 font-bold italic opacity-80">
                Advanced structural integrity and data compliance indicators for RKC operations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                {
                  label: 'Stability Score',
                  val: `${qualityMetrics.overallStability.toFixed(1)}%`,
                  icon: '📊',
                  color: 'text-blue-600 dark:text-blue-400',
                  desc: 'Average parameter stability index'
                },
                {
                  label: 'Data Completeness',
                  val: `${qualityMetrics.averageCompleteness.toFixed(1)}%`,
                  icon: '✅',
                  color: 'text-emerald-600 dark:text-emerald-400',
                  desc: 'Data capture rate across RKC'
                },
                {
                  label: 'Monitored Metrics',
                  val: qualityMetrics.parameterCount,
                  icon: '🔢',
                  color: 'text-purple-600 dark:text-purple-400',
                  desc: 'Total active sensors monitored'
                },
                {
                  label: 'Data Points',
                  val: `${qualityMetrics.validDataPoints}/${qualityMetrics.totalDataPoints}`,
                  icon: '📈',
                  color: 'text-ubuntu-orange',
                  desc: 'Verified vs expected captures'
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/30 dark:border-white/5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group cursor-default"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl filter drop-shadow-md group-hover:rotate-12 transition-transform duration-500">{m.icon}</div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {m.label}
                    </span>
                  </div>
                  <div className={`text-3xl sm:text-4xl font-black ${m.color} mb-2 font-display`}>{m.val}</div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight opacity-80">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Period Comparison Panel */}
        {showPeriodComparison && (
          <div className="bg-gradient-to-br from-emerald-900/5 via-slate-900/5 to-teal-900/5 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-2xl backdrop-blur-3xl transition-all duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-[0.2em]">
                  📈 Period Comparison
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-2 font-bold italic opacity-80">
                  Benchmarking real-time RKC performance against deep historical baselines.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/30 dark:border-white/10 shadow-lg">
                <span className="text-[10px] sm:text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">
                  Benchmark Year:
                </span>
                <div className="relative">
                  <select
                    value={comparisonPeriod.year}
                    onChange={(e) =>
                      setComparisonPeriod((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                    }
                    className="bg-transparent border-none text-sm font-black text-emerald-950 dark:text-emerald-300 focus:ring-0 cursor-pointer appearance-none pr-8 py-0"
                  >
                    {availableYearsWithData.map((y) => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                </div>
              </div>
            </div>

            {isLoadingComparison ? (
               <div className="flex flex-col items-center justify-center py-20 space-y-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-glow"></div>
                 <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-pulse">Computing Delta...</span>
               </div>
            ) : periodComparison.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4 opacity-20">📊</div>
                <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                  No Historical Alignment Found
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                {periodComparison.map((comparison) => (
                  <div
                    key={comparison.parameterId}
                    className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/30 dark:border-white/5 shadow-xl group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-6 leading-tight group-hover:text-ubuntu-orange transition-colors truncate tracking-tight">
                      {comparison.parameter}
                    </h3>
                    <div className="space-y-4 font-mono text-[10px] sm:text-[11px]">
                      <div className="flex justify-between items-end pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-[9px]">
                          Current
                        </span>
                        <span className="text-slate-900 dark:text-white font-black text-base leading-none">
                          {comparison.current.mean !== null
                            ? formatCopNumber(comparison.current.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-[9px]">
                          Previous
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-black text-sm leading-none">
                          {comparison.previous.mean !== null
                            ? formatCopNumber(comparison.previous.mean)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-[9px]">
                          Delta
                        </span>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm ${
                          comparison.delta !== null && comparison.delta > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          <span className="text-xs">{comparison.delta !== null && comparison.delta > 0 ? '↗' : '↘'}</span>
                          {comparison.delta !== null
                            ? `${Math.abs(comparison.delta).toFixed(1)}%`
                            : '0.0%'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Predictive Insights Panel */}
        {showPredictiveInsights && predictiveInsights.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-white/20 animate-slide-up shadow-xl transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest">
                🔮 Predictive Insights
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-ubuntu-warmGrey mt-1.5 font-bold italic">
                Advanced AI-driven forecasting and risk assessment for the next 7 days.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {predictiveInsights.map((insight) => (
                <div
                  key={insight.parameterId}
                  className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/30 dark:border-white/5 shadow-xl group hover:shadow-2xl transition-all duration-300"
                >
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-ubuntu-orange transition-colors truncate">
                    {insight.parameter}
                  </h3>
                  <div className="space-y-2.5 font-mono text-[10px] sm:text-[11px]">
                    {[
                      { label: 'Current', val: insight.currentValue !== null ? formatCopNumber(insight.currentValue) : '-' },
                      { label: '7-Day Forecast', val: insight.forecast !== null ? formatCopNumber(insight.forecast) : '-' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">
                          {item.label}
                        </span>
                        <span className="text-slate-900 dark:text-white font-black">
                          {item.val}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Risk Level
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        insight.risk === 'high' ? 'bg-rose-100 text-rose-700' :
                        insight.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {insight.risk}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter">
                        Trend
                      </span>
                      <span className={`text-base ${
                        insight.trend === 'increasing' ? 'text-emerald-600' :
                        insight.trend === 'decreasing' ? 'text-rose-600' :
                        'text-slate-500'
                      }`}>
                        {insight.trend === 'increasing' ? '↗️' : insight.trend === 'decreasing' ? '↘️' : '➡️'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Operations Assistant */}
        <div className="mb-6">
          <AiOperationsAssistant
            analysisData={analysisData}
            isLoading={isLoading}
            selectedUnit={selectedUnit}
            moistureData={Array.from(monthlyMoistureData.entries())
              .map(([date, value]) => ({ date, value }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          />
        </div>

        <Card
          variant="glass"
          padding="lg"
          className="backdrop-blur-xl bg-white/90 shadow-2xl border-0"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <span className="text-xl font-medium text-slate-600">
                  Loading COP analysis data...
                </span>
              </div>
              {/* Loading skeleton */}
              <div className="w-full max-w-2xl">
                <div className="animate-pulse">
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-2">
                        <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/5"></div>
                        <div className="h-4 bg-gradient-to-r from-green-200 to-blue-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/5"></div>
                        <div className="h-4 bg-gradient-to-r from-orange-200 to-red-200 rounded w-1/6"></div>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div
                            key={j}
                            className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-8"
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
              <div className="text-center bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-2xl border border-red-200">
                <div className="text-red-500 mb-2">
                  <svg
                    className="w-8 h-8 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-slate-600 mb-4">{error}</p>
                <button
                  onClick={refreshData}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 uppercase tracking-widest">
                      COP Analysis Dashboard
                    </h2>
                    <p className="text-slate-500 dark:text-ubuntu-warmGrey text-xs sm:text-sm font-bold italic">
                      Comprehensive parameter performance monitoring and analytics
                    </p>
                  </div>
                  <button
                    onClick={refreshData}
                    disabled={isLoading}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <div className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    {isLoading ? 'REFRESHING...' : 'REFRESH DATA'}
                  </button>
                </div>
              </div>
              
              <div
                className="overflow-x-auto custom-scrollbar rounded-3xl shadow-2xl border border-white/20"
                style={{ scrollbarWidth: 'thin' }}
              >
                <table className="min-w-full text-xs border-collapse bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white">
                      <th className="sticky left-0 bg-indigo-950 z-30 px-4 py-6 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10 rounded-tl-3xl">
                        NO.
                      </th>
                      <th className="sticky left-12 bg-indigo-950 z-30 px-4 py-6 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10 min-w-[140px]">
                        {t.parameter}
                      </th>
                      <th className="px-3 py-6 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10 bg-rose-900/40">
                        {t.min}
                      </th>
                      <th className="px-3 py-6 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10 bg-emerald-900/40">
                        {t.max}
                      </th>
                      {daysHeader.map((day) => (
                        <th
                          key={day}
                          className="px-2 py-6 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10 min-w-[45px] bg-slate-800/20"
                        >
                          {day}
                        </th>
                      ))}
                      <th className="sticky right-0 bg-indigo-950 z-30 px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest border-l border-white/10 rounded-tr-3xl">
                        AVG.
                      </th>
                    </tr>
                  </thead>
                  <Droppable droppableId="cop-analysis-table">
                    {(provided) => (
                      <tbody
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="divide-y divide-white/5"
                      >
                        {analysisData.map((row, rowIndex) => (
                          <Draggable
                            key={`param-${row.parameter.id}`}
                            draggableId={row.parameter.id}
                            index={rowIndex}
                          >
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group/row transition-all duration-300 ${
                                  snapshot.isDragging
                                    ? 'bg-indigo-500/20 shadow-2xl scale-[1.01] z-50'
                                    : 'hover:bg-white/10 dark:hover:bg-white/5'
                                } ${rowIndex % 2 === 0 ? 'bg-white/30 dark:bg-white/2' : 'bg-transparent'}`}
                                style={{ ...provided.draggableProps.style }}
                              >
                                <td className="sticky left-0 z-20 px-4 py-4 text-center font-black text-slate-500 dark:text-slate-400 border-r border-white/10 bg-inherit backdrop-blur-md">
                                  {rowIndex + 1}
                                </td>
                                <td className="sticky left-12 z-20 px-4 py-4 font-black text-slate-800 dark:text-white border-r border-white/10 bg-inherit backdrop-blur-md truncate max-w-[140px]">
                                  {row.parameter.parameter}
                                </td>
                                <td className="px-3 py-4 text-center font-bold text-rose-600 dark:text-rose-400 border-r border-white/10 bg-rose-500/5">
                                  {formatCopNumber(row.parameter.min_value)}
                                </td>
                                <td className="px-3 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 border-r border-white/10 bg-emerald-500/5">
                                  {formatCopNumber(row.parameter.max_value)}
                                </td>
                                {row.dailyValues.map((day, dayIndex) => {
                                  const colors = getPercentageColor(day.value);
                                  return (
                                    <td
                                      key={dayIndex}
                                      className={`relative px-2 py-4 text-center border-r border-white/5 transition-colors duration-300 ${colors.bg} group-hover/row:opacity-90`}
                                    >
                                      <div className="relative group/cell h-full w-full flex items-center justify-center">
                                        <span className={`font-black text-[11px] ${colors.text} drop-shadow-sm`}>
                                          {formatCopNumber(day.raw)}
                                        </span>
                                        {day.raw !== undefined && (
                                          <div className="absolute bottom-full mb-3 w-max max-w-sm bg-slate-900/95 backdrop-blur-xl text-white text-[10px] rounded-2xl py-3 px-4 opacity-0 group-hover/cell:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2 scale-90 group-hover/cell:scale-100">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                              <span className="font-black text-indigo-400 uppercase tracking-widest">
                                                {formatDate(new Date(Date.UTC(filterYear, filterMonth, dayIndex + 1)))}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${colors.bg} ${colors.text}`}>
                                                {colors.status}
                                              </span>
                                            </div>
                                            <div className="space-y-1 font-mono">
                                              <p className="flex justify-between gap-4">
                                                <span className="text-slate-400 font-bold uppercase">VAL:</span>
                                                <span className="text-emerald-400 font-black">{formatCopNumber(day.raw)} {row.parameter.unit}</span>
                                              </p>
                                              <p className="flex justify-between gap-4">
                                                <span className="text-slate-400 font-bold uppercase">TARGET:</span>
                                                <span className="text-amber-400 font-black">
                                                  {formatCopNumber(row.parameter.min_value)} - {formatCopNumber(row.parameter.max_value)}
                                                </span>
                                              </p>
                                              {day.value !== null && (
                                                <p className="flex justify-between gap-4 border-t border-white/10 pt-1 mt-1">
                                                  <span className="text-slate-400 font-bold uppercase">NORM:</span>
                                                  <span className="text-indigo-400 font-black">{day.value.toFixed(1)}%</span>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                                {(() => {
                                  const avgColors = getPercentageColor(row.monthlyAverage);
                                  return (
                                    <td className={`sticky right-0 z-20 px-4 py-4 text-center font-black border-l border-white/10 bg-inherit backdrop-blur-md ${avgColors.bg}`}>
                                      <span className={`${avgColors.text} text-xs drop-shadow-sm`}>
                                        {formatCopNumber(row.monthlyAverageRaw)}
                                      </span>
                                    </td>
                                  );
                                })()}
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {analysisData.length === 0 && (
                          <tr>
                            <td
                              colSpan={daysHeader.length + 5}
                              className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs"
                            >
                              <div className="flex flex-col items-center gap-4">
                                <span className="text-4xl opacity-20">📊</span>
                                <span>
                                  {!selectedCategory || !selectedUnit
                                    ? 'Select Category & Unit to Begin Analysis'
                                    : filteredCopParameters.length === 0
                                      ? 'No parameters found for selection'
                                      : 'No operational data available for this period'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                  <tfoot className="font-bold bg-gradient-to-r from-slate-100 to-slate-200">
                    <tr className="border-t-4 border-slate-400">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-xs sm:text-sm text-slate-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-blue-100 to-blue-200 font-bold rounded-bl-2xl"
                      >
                        {t.qaf_daily}
                      </td>
                      <td className="bg-blue-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      <td className="bg-blue-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      {dailyQaf.daily.map((qaf, index) => {
                        const colors = getQafColor(qaf.value);
                        return (
                          <td
                            key={index}
                            className={`px-2 py-4 text-center border-b-2 border-r-2 border-white/30 ${colors.bg} ${colors.text}`}
                          >
                            <div className="relative group/cell h-full w-full flex items-center justify-center">
                              <span className="text-sm font-extrabold drop-shadow-sm">
                                {qaf.value !== null && !isNaN(qaf.value)
                                  ? `${formatCopNumber(qaf.value)}%`
                                  : '-'}
                              </span>
                              {qaf.total > 0 && (
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2">
                                  {t.qaf_tooltip
                                    ?.replace('{inRange}', qaf.inRange.toString())
                                    .replace('{total}', qaf.total.toString())}
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
                            className={`sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 ${colors.bg} ${colors.text} font-extrabold text-lg rounded-br-2xl`}
                          >
                            <div className="relative group/cell h-full w-full flex items-center justify-center">
                              <span className="drop-shadow-sm">
                                {qaf.value !== null && !isNaN(qaf.value)
                                  ? `${formatCopNumber(qaf.value)}%`
                                  : '-'}
                              </span>
                              {qaf.total > 0 && (
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl py-2 px-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 left-1/2 -translate-x-1/2">
                                  {t.qaf_tooltip
                                    ?.replace('{inRange}', qaf.inRange.toString())
                                    .replace('{total}', qaf.total.toString())}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })()}
                    </tr>
                    {/* Moisture Content Row */}
                    <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-cyan-50">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-xs sm:text-sm text-blue-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-blue-200 to-cyan-200 font-bold"
                      >
                        % Moisture Content
                      </td>
                      <td className="bg-blue-200 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      <td className="bg-blue-200 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      {Array.from(
                        { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                        (_, i) => {
                          // Get daily average moisture content from monthly data
                          const day = i + 1;
                          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dailyAverage = monthlyMoistureData.get(dateString);

                          return (
                            <td
                              key={`moisture-${day}`}
                              className="px-2 py-4 text-center border-b-2 border-r-2 border-white/30 bg-gradient-to-r from-blue-100 to-cyan-100"
                            >
                              <span className="text-sm font-bold text-blue-800 drop-shadow-sm">
                                {dailyAverage !== undefined && !isNaN(dailyAverage)
                                  ? `${formatCopNumber(dailyAverage)}%`
                                  : '-'}
                              </span>
                            </td>
                          );
                        }
                      )}
                      {/* Monthly average for moisture content */}
                      <td className="sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 bg-gradient-to-r from-emerald-100 to-green-100 font-bold text-lg rounded-r-2xl">
                        <span className="text-emerald-800 drop-shadow-sm">
                          {(() => {
                            // Calculate monthly average from daily moisture data
                            const validValues = Array.from(monthlyMoistureData.values()).filter(
                              (v) => v !== null && v !== undefined && !isNaN(v)
                            );

                            if (validValues.length === 0) return '-';

                            const average =
                              validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                            return `${formatCopNumber(average)}%`;
                          })()}
                        </span>
                      </td>
                    </tr>
                    {/* Capacity Row */}
                    <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-green-50 to-emerald-50">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-20 px-3 py-4 text-right text-xs sm:text-sm text-green-800 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-green-200 to-emerald-200 font-bold"
                      >
                        Capacity (ton)
                      </td>
                      <td className="bg-green-200 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      <td className="bg-green-200 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50"></td>
                      {Array.from(
                        { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                        (_, i) => {
                          // Get daily feed and moisture data for capacity calculation
                          const day = i + 1;
                          const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dailyFeed = monthlyFeedData.get(dateString);
                          const dailyMoisture = monthlyMoistureData.get(dateString);

                          // Calculate capacity: Feed - (Moisture Content × Feed / 100)
                          const capacity =
                            dailyFeed && dailyMoisture !== undefined
                              ? dailyFeed - (dailyMoisture * dailyFeed) / 100
                              : null;

                          return (
                            <td
                              key={`capacity-${day}`}
                              className="px-2 py-4 text-center border-b-2 border-r-2 border-white/30 bg-gradient-to-r from-green-100 to-emerald-100"
                            >
                              <span className="text-sm font-bold text-green-800 drop-shadow-sm">
                                {capacity !== null && !isNaN(capacity)
                                  ? `${formatCopNumber(capacity)}`
                                  : '-'}
                              </span>
                            </td>
                          );
                        }
                      )}
                      {/* Monthly average for capacity */}
                      <td className="sticky right-0 z-20 px-3 py-4 text-center border-b-2 border-l-4 border-white/30 bg-gradient-to-r from-emerald-200 to-green-200 font-bold text-lg rounded-r-2xl">
                        <span className="text-emerald-900 drop-shadow-sm">
                          {(() => {
                            // Calculate monthly average capacity
                            const validCapacities: number[] = [];
                            Array.from(
                              { length: new Date(filterYear, filterMonth + 1, 0).getDate() },
                              (_, i) => {
                                const day = i + 1;
                                const dateString = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dailyFeed = monthlyFeedData.get(dateString);
                                const dailyMoisture = monthlyMoistureData.get(dateString);

                                if (dailyFeed && dailyMoisture !== undefined) {
                                  const capacity = dailyFeed - (dailyMoisture * dailyFeed) / 100;
                                  if (!isNaN(capacity)) {
                                    validCapacities.push(capacity);
                                  }
                                }
                              }
                            );

                            if (validCapacities.length === 0) return '-';

                            const average =
                              validCapacities.reduce((sum, val) => sum + val, 0) /
                              validCapacities.length;
                            return `${formatCopNumber(average)}`;
                          })()}
                        </span>
                      </td>
                    </tr>
                    {/* COP Footer Parameters */}
                    {footerData.map((row, index) => (
                      <tr key={`footer-${row.parameter.id}`} className="border-t border-slate-300">
                        <td
                          colSpan={4}
                          className="sticky left-0 z-20 px-2 py-2 text-right text-sm text-slate-700 border-b border-r border-slate-200 bg-slate-100"
                        >
                          {row.parameter.parameter}
                        </td>
                        {row.dailyValues.map((day, dayIndex) => {
                          const colors = getPercentageColor(day.value);
                          return (
                            <td
                              key={dayIndex}
                              className={`px-1 py-2 text-center border-b border-r border-slate-200 ${colors.bg}`}
                            >
                              <span className={`text-xs font-medium ${colors.text}`}>
                                {formatCopNumber(day.raw)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-20 px-2 py-2 text-center border-b border-l-2 border-slate-300 bg-slate-100 font-bold text-sm">
                          <span className="text-slate-800">
                            {formatCopNumber(row.monthlyAverageRaw)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tfoot>
                </table>
              </div>
              {/* Export Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
                  disabled={analysisData.length === 0}
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export to Excel
                </button>
              </div>
            </DragDropContext>
          )}
        </Card>
        {/* Parameter Line Charts */}
        {analysisData.length > 0 && (
          <Card
            variant="floating"
            padding="lg"
            className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-2xl border-0"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                📈 Trend Parameter COP
              </h2>
              <p className="text-base text-slate-700 leading-relaxed">
                Visualisasi tren nilai parameter sepanjang bulan untuk monitoring performa dan
                identifikasi pola
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {analysisData.map((paramData, index) => {
                // Prepare chart data
                const chartData = paramData.dailyValues
                  .map((day, dayIndex) => ({
                    day: dayIndex + 1,
                    value: day.raw !== undefined && day.raw !== null ? day.raw : null,
                    date: new Date(Date.UTC(filterYear, filterMonth, dayIndex + 1)),
                  }))
                  .filter((item) => item.value !== null);

                const min = paramData.parameter.min_value;
                const max = paramData.parameter.max_value;

                // Color variations for each chart
                const colorSchemes = [
                  {
                    bg: 'from-blue-50 to-cyan-50',
                    border: 'border-blue-200',
                    accent: 'text-blue-700',
                  },
                  {
                    bg: 'from-green-50 to-emerald-50',
                    border: 'border-green-200',
                    accent: 'text-green-700',
                  },
                  {
                    bg: 'from-purple-50 to-violet-50',
                    border: 'border-purple-200',
                    accent: 'text-purple-700',
                  },
                  {
                    bg: 'from-orange-50 to-amber-50',
                    border: 'border-orange-200',
                    accent: 'text-orange-700',
                  },
                  {
                    bg: 'from-pink-50 to-rose-50',
                    border: 'border-pink-200',
                    accent: 'text-pink-700',
                  },
                  {
                    bg: 'from-indigo-50 to-blue-50',
                    border: 'border-indigo-200',
                    accent: 'text-indigo-700',
                  },
                ];
                const colorScheme = colorSchemes[index % colorSchemes.length];

                // Skip rendering if no data
                if (!chartData || chartData.length === 0) {
                  return (
                    <div
                      key={paramData.parameter.id}
                      className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-lg`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xl font-bold ${colorScheme.accent} truncate`}>
                          {paramData.parameter.parameter}
                        </h3>
                        <div
                          className={`px-3 py-1 bg-white/80 rounded-full text-xs font-semibold ${colorScheme.accent} border border-white/50`}
                        >
                          No Data
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-6 font-medium">
                        Target:{' '}
                        <span className="font-mono text-slate-800">
                          {formatCopNumber(min)} - {formatCopNumber(max)}
                        </span>{' '}
                        <span className="text-slate-500">{paramData.parameter.unit}</span>
                      </p>
                      <div className="flex flex-col items-center justify-center h-64 bg-white/60 rounded-xl border-2 border-dashed border-slate-300">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-slate-500 font-medium text-center">
                          Tidak ada data
                          <br />
                          untuk periode ini
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={paramData.parameter.id}
                    className={`bg-gradient-to-br ${colorScheme.bg} p-6 rounded-2xl border-2 ${colorScheme.border} shadow-lg group`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${colorScheme.accent} truncate`}>
                        {paramData.parameter.parameter}
                      </h3>
                      <div
                        className={`px-3 py-1 bg-white/90 rounded-full text-xs font-semibold ${colorScheme.accent} border border-white/50 shadow-sm`}
                      >
                        {chartData.length} hari
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-6 font-medium">
                      Target:{' '}
                      <span className="font-mono text-slate-800 font-bold">
                        {formatCopNumber(min)} - {formatCopNumber(max)}
                      </span>{' '}
                      <span className="text-slate-500">{paramData.parameter.unit}</span>
                    </p>
                    <div className="bg-white/80 rounded-xl p-2 shadow-inner">
                      <ChartContainer
                        chartData={chartData}
                        parameter={paramData.parameter}
                        min={min}
                        max={max}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {selectedParameterStats && (
          <div className="fixed top-20 left-4 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-slate-300 text-sm text-slate-800 max-h-80 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm truncate pr-2">
                {selectedParameterStats.parameter}
              </h4>
              <button
                className="text-slate-400 hover:text-slate-600 p-1"
                onClick={() => setSelectedParameterStats(null)}
                aria-label="Close stats"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Median:</strong>
                <span className="font-mono">
                  {selectedParameterStats.median !== null
                    ? selectedParameterStats.median.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Min:</strong>
                <span className="font-mono">
                  {selectedParameterStats.min !== null
                    ? selectedParameterStats.min.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Max:</strong>
                <span className="font-mono">
                  {selectedParameterStats.max !== null
                    ? selectedParameterStats.max.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>Stdev:</strong>
                <span className="font-mono">
                  {selectedParameterStats.stdev !== null
                    ? selectedParameterStats.stdev.toFixed(2)
                    : '-'}
                </span>
              </li>
              <li className="flex justify-between">
                <strong>QAF:</strong>
                <span className="font-mono">
                  {selectedParameterStats.qaf !== null
                    ? `${selectedParameterStats.qaf.toFixed(2)}%`
                    : '-'}
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Modal Breakdown Harian */}
        <Modal
          isOpen={breakdownModal.isOpen}
          onClose={() => setBreakdownModal({ isOpen: false, parameter: '', data: null })}
          title={`Breakdown Harian - ${breakdownModal.parameter}`}
        >
          <div className="p-8 max-h-96 overflow-y-auto">
            {breakdownModal.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-7 gap-3">
                  {breakdownModal.data.dailyValues.map((day, index) => {
                    const isOutOfRange = day.value === null || day.value < 0 || day.value > 100;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // Simulasi data jam-jam (24 jam)
                          const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
                            hour,
                            value: day.value ? day.value + (Math.random() - 0.5) * 20 : null,
                            isOutOfRange: day.value ? Math.random() > 0.8 : true,
                          }));
                          setHourlyBreakdownModal({
                            isOpen: true,
                            parameter: breakdownModal.parameter,
                            dayIndex: index,
                            data: hourlyData,
                          });
                        }}
                        className={`p-3 rounded-lg text-sm font-medium ${
                          isOutOfRange
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs">Hari {index + 1}</div>
                          <div className="text-lg font-bold">
                            {day.value !== null ? `${day.value.toFixed(1)}%` : '-'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-600 mt-4">
                  Klik pada hari untuk melihat breakdown jam-jam. Hari berwarna merah menunjukkan
                  parameter di luar range (0-100%).
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
              parameter: '',
              dayIndex: -1,
              data: [],
            })
          }
          title={`Breakdown Jam - ${hourlyBreakdownModal.parameter} (Hari ${
            hourlyBreakdownModal.dayIndex + 1
          })`}
        >
          <div className="p-8 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-6 gap-3">
              {hourlyBreakdownModal.data.map((hour) => (
                <div
                  key={hour.hour}
                  className={`p-4 rounded-lg text-sm ${
                    hour.isOutOfRange
                      ? 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-50'
                      : 'bg-green-100 text-green-800 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-600">Jam {hour.hour}:00</div>
                    <div className="text-lg font-bold">
                      {hour.value !== null ? `${hour.value.toFixed(1)}%` : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-600 mt-6 p-4 bg-slate-50 rounded-lg">
              💡 Kotak berwarna merah menunjukkan jam-jam dimana parameter di luar range target.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default RkcCopAnalysisPage;
