import React, { useState, useMemo, useRef, useCallback } from "react";
import { PackingPlantStockRecord, PackingPlantMasterRecord } from "../../types";
import { formatNumber, formatDate } from "../../utils/formatters";
import {
  MetricCard,
  MetricCardProps,
} from "../../components/logistics/MetricCards";
import { Filters } from "../../components/logistics/Filters";
import { Recommendations } from "../../components/logistics/Recommendations";
import { StockOutTable } from "../../components/logistics/StockOutTable";
import { Chart } from "../../components/logistics/Chart";
import ArrowPathRoundedSquareIcon from "../../components/icons/ArrowPathRoundedSquareIcon";
import ChartBarSquareIcon from "../../components/icons/ChartBarSquareIcon";
import ExclamationTriangleIcon from "../../components/icons/ExclamationTriangleIcon";
import TruckIcon from "../../components/icons/TruckIcon";
import BuildingLibraryIcon from "../../components/icons/BuildingLibraryIcon";
import ArchiveBoxXMarkIcon from "../../components/icons/ArchiveBoxXMarkIcon";
import ScaleIcon from "../../components/icons/ScaleIcon";
import ArchiveBoxIcon from "../../components/icons/ArchiveBoxIcon";

interface PageProps {
  t: any;
  areas: string[];
  stockRecords: PackingPlantStockRecord[];
  masterData: PackingPlantMasterRecord[];
}

const LogisticsPerformance: React.FC<PageProps> = ({
  t,
  areas,
  stockRecords,
  masterData,
}) => {
  const [filterArea, setFilterArea] = useState("All Areas");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState<"line" | "bar" | "combo">("combo");
  const [showTrend, setShowTrend] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    day: number;
    values: Record<string, number>;
    x: number;
    y: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [
    filterArea,
    filterMonth,
    filterYear,
    chartType,
    showTrend,
    showComparison,
  ]);

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

  const COLORS = [
    "#B91C1C",
    "#DC2626",
    "#F87171",
    "#6B7280",
    "#9CA3AF",
    "#D1D5DB",
  ];

  // Optimized moving average calculation to reduce computation overhead
  const calculateMovingAverage = useCallback(
    (data: { day: number; stock_out: number }[], window: number = 3) => {
      if (!data || data.length === 0) return [];

      // Pre-allocate array for better performance
      const result = new Array(data.length);
      let sum = 0;

      // Calculate initial window sum
      for (let i = 0; i < Math.min(window, data.length); i++) {
        sum += data[i].stock_out;
      }

      // Use sliding window for O(n) complexity instead of O(n*w)
      for (let i = 0; i < data.length; i++) {
        if (i >= window) {
          sum = sum - data[i - window].stock_out + data[i].stock_out;
        }
        const actualWindow = Math.min(i + 1, window);
        result[i] = {
          ...data[i],
          moving_average: sum / actualWindow,
        };
      }

      return result;
    },
    []
  );

  const performanceData = useMemo(() => {
    const stockRecordsForMonth = stockRecords.filter((r) => {
      const recordDate = new Date(r.date);
      const matches =
        recordDate.getMonth() === filterMonth &&
        recordDate.getFullYear() === filterYear;
      return matches;
    });

    const relevantMasterData = masterData.filter(
      (m) => filterArea === "All Areas" || m.area === filterArea
    );
    const relevantStockRecords = stockRecordsForMonth.filter(
      (r) => filterArea === "All Areas" || r.area === filterArea
    );

    const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const displayedAreas = (
      filterArea === "All Areas" ? areas : [filterArea]
    ).filter((area) => stockRecordsForMonth.some((r) => r.area === area));

    if (relevantStockRecords.length === 0 || relevantMasterData.length === 0) {
      return {
        totalStockOut: 0,
        totalSiloCapacity: 0,
        totalDeadStock: 0,
        totalLiveStockCapacity: 0,
        avgDailyStock: 0,
        turnoverRate: 0,
        utilization: 0,
        overSlotFrequency: 0,
        chartData: {},
        comparisonData: {},
        trendData: {},
        criticalDays: [],
        recommendations: [],
        displayedAreas: [],
        daysInMonth: 0,
        tableData: { headers: [], rows: [], footer: [] },
        noData: true,
      };
    }

    const totalSiloCapacity = relevantMasterData.reduce(
      (sum, r) => sum + r.silo_capacity,
      0
    );
    const totalDeadStock = relevantMasterData.reduce(
      (sum, r) => sum + r.dead_stock,
      0
    );
    const totalLiveStockCapacity = totalSiloCapacity - totalDeadStock;

    const totalStockOut = relevantStockRecords.reduce(
      (sum, r) => sum + r.stock_out,
      0
    );
    const avgDailyStock =
      relevantStockRecords.reduce((sum, r) => sum + r.closing_stock, 0) /
      relevantStockRecords.length;

    const turnoverRate = avgDailyStock > 0 ? totalStockOut / avgDailyStock : 0;
    const utilization =
      totalLiveStockCapacity > 0
        ? (avgDailyStock / totalLiveStockCapacity) * 100
        : 0;

    const masterCapacityByArea = masterData.reduce((acc, m) => {
      acc[m.area] = (acc[m.area] || 0) + m.silo_capacity;
      return acc;
    }, {} as Record<string, number>);

    let overSlotFrequency = 0;
    relevantStockRecords.forEach((record) => {
      const areaSiloCapacity = masterCapacityByArea[record.area] || 0;
      if (
        areaSiloCapacity > 0 &&
        record.stock_received > 0 &&
        record.opening_stock > areaSiloCapacity * 0.9
      ) {
        overSlotFrequency++;
      }
    });

    // Chart Data by Area
    const chartDataByArea = displayedAreas.reduce((acc, area) => {
      const areaRecords = stockRecordsForMonth.filter((r) => r.area === area);
      const stockOutByDay = new Map(
        areaRecords.map((r) => [new Date(r.date).getDate(), r.stock_out])
      );
      acc[area] = daysArray.map((day) => ({
        day,
        stock_out: stockOutByDay.get(day) || 0,
      }));
      return acc;
    }, {} as Record<string, { day: number; stock_out: number }[]>);

    // Previous month data for comparison
    const previousMonth = filterMonth === 0 ? 11 : filterMonth - 1;
    const previousYear = filterMonth === 0 ? filterYear - 1 : filterYear;
    const stockRecordsForPreviousMonth = stockRecords.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getMonth() === previousMonth &&
        recordDate.getFullYear() === previousYear
      );
    });

    // Previous month comparison data
    const comparisonDataByArea = displayedAreas.reduce((acc, area) => {
      const areaRecords = stockRecordsForPreviousMonth.filter(
        (r) => r.area === area
      );
      const previousDaysInMonth = new Date(
        previousYear,
        previousMonth + 1,
        0
      ).getDate();
      const previousDaysArray = Array.from(
        { length: previousDaysInMonth },
        (_, i) => i + 1
      );
      const stockOutByDay = new Map(
        areaRecords.map((r) => [new Date(r.date).getDate(), r.stock_out])
      );
      acc[area] = previousDaysArray.map((day) => ({
        day,
        stock_out: stockOutByDay.get(day) || 0,
      }));
      return acc;
    }, {} as Record<string, { day: number; stock_out: number }[]>);

    // Calculate trend data using the extracted moving average function
    const trendDataByArea: Record<
      string,
      { day: number; stock_out: number; moving_average: number }[]
    > = {};
    displayedAreas.forEach((area) => {
      trendDataByArea[area] = calculateMovingAverage(chartDataByArea[area]);
    });

    // Identify critical days (high stock out days)
    const avgStockOut = totalStockOut / daysInMonth;
    const criticalThreshold = avgStockOut * 1.5; // 150% of average
    const criticalDays = daysArray.filter((day) => {
      const dayTotal = displayedAreas.reduce((sum, area) => {
        const dayData = chartDataByArea[area]?.find((d) => d.day === day);
        return sum + (dayData?.stock_out || 0);
      }, 0);
      return dayTotal > criticalThreshold;
    });

    // Generate recommendations
    const recommendations = [];
    if (utilization > 90) {
      recommendations.push({
        type: "warning",
        title: "High Silo Utilization",
        message:
          "Silo utilization is above 90%. Consider optimizing stock rotation or expanding capacity.",
      });
    }
    if (criticalDays.length > daysInMonth * 0.3) {
      recommendations.push({
        type: "critical",
        title: "Frequent High Stock-Out Days",
        message: `${criticalDays.length} days had above-average stock-out. Review demand forecasting and inventory management.`,
      });
    }
    if (turnoverRate < 2) {
      recommendations.push({
        type: "info",
        title: "Low Turnover Rate",
        message:
          "Stock turnover is below optimal levels. Consider reducing inventory levels or increasing sales efforts.",
      });
    }
    if (overSlotFrequency > 5) {
      recommendations.push({
        type: "warning",
        title: "Frequent Over-Slot Events",
        message:
          "Multiple over-slot events detected. Review receiving schedules and capacity planning.",
      });
    }

    // Table Data
    const tableHeaders = [t.area, ...daysArray, "Total"];
    const stockOutByAreaAndDay = new Map<string, Map<number, number>>();
    stockRecordsForMonth.forEach((r) => {
      if (!stockOutByAreaAndDay.has(r.area))
        stockOutByAreaAndDay.set(r.area, new Map());
      const day = new Date(r.date).getUTCDate();
      stockOutByAreaAndDay.get(r.area)!.set(day, r.stock_out);
    });

    const tableRows = Array.from(stockOutByAreaAndDay.keys())
      .sort()
      .map((area) => {
        const rowData = stockOutByAreaAndDay.get(area)!;
        const dailyValues = daysArray.map((day) => rowData.get(day) || 0);
        const total = dailyValues.reduce((sum, val) => sum + val, 0);
        return { area, dailyValues, total };
      });

    const tableFooter = daysArray.map((day) => {
      return tableRows.reduce(
        (sum, row) => sum + (row.dailyValues[day - 1] || 0),
        0
      );
    });
    const grandTotal = tableFooter.reduce((sum, val) => sum + val, 0);

    return {
      totalStockOut,
      totalSiloCapacity,
      totalDeadStock,
      totalLiveStockCapacity,
      avgDailyStock,
      turnoverRate,
      utilization,
      overSlotFrequency,
      chartData: chartDataByArea,
      comparisonData: comparisonDataByArea,
      trendData: trendDataByArea,
      criticalDays,
      recommendations,
      displayedAreas,
      daysInMonth,
      tableData: {
        headers: tableHeaders,
        rows: tableRows,
        footer: [...tableFooter, grandTotal],
      },
      noData: false,
    };
  }, [
    filterArea,
    filterMonth,
    filterYear,
    stockRecords,
    masterData,
    t,
    areas,
    calculateMovingAverage,
  ]);

  const handleDaySelection = (event: React.MouseEvent) => {
    if (!chartRef.current || performanceData.noData) return;
    const rect = chartRef.current.getBoundingClientRect();
    const svgX = event.clientX - rect.left;

    const dayIndex =
      performanceData.daysInMonth > 1
        ? Math.round((svgX / rect.width) * (performanceData.daysInMonth - 1))
        : 0;
    const day = dayIndex + 1;

    if (day >= 1 && day <= performanceData.daysInMonth) {
      setSelectedDay((current) => (current === day ? null : day));
    }
  };

  const handleChartHover = (event: React.MouseEvent) => {
    if (!chartRef.current || performanceData.noData) return;
    const rect = chartRef.current.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    const dayIndex =
      performanceData.daysInMonth > 1
        ? Math.round((svgX / rect.width) * (performanceData.daysInMonth - 1))
        : 0;
    const day = dayIndex + 1;

    if (day < 1 || day > performanceData.daysInMonth) {
      setHoveredInfo(null);
      return;
    }

    const values = performanceData.displayedAreas.reduce((acc, area) => {
      const dayData = performanceData.chartData[area]?.find(
        (d) => d.day === day
      );
      if (dayData) {
        acc[area] = dayData.stock_out;
      }
      return acc;
    }, {} as Record<string, number>);

    const xPosInSvg =
      performanceData.daysInMonth > 1
        ? (dayIndex / (performanceData.daysInMonth - 1)) * 500
        : 250;

    // Better positioning to prevent overflow
    const tooltipX = Math.min(Math.max(svgX, 90), rect.width - 90);
    const tooltipY = Math.max(svgY - 20, 60);

    setHoveredInfo({
      day,
      values,
      x: tooltipX,
      y: tooltipY,
    });
  };

  const handleMouseLeaveChart = () => setHoveredInfo(null);

  const metrics: MetricCardProps[] = [
    {
      title: t.turnover_rate,
      value: performanceData.turnoverRate.toFixed(2),
      unit: "x",
      icon: <ArrowPathRoundedSquareIcon className="w-4 h-4" />,
      trend:
        performanceData.turnoverRate > 2
          ? "good"
          : performanceData.turnoverRate > 1
          ? "warning"
          : "critical",
      breakdownData: {
        title: "Turnover Rate Analysis",
        description: "Detailed analysis of inventory turnover across all areas",
        metrics: [
          {
            label: "Current Turnover Rate",
            value: performanceData.turnoverRate.toFixed(2),
            unit: "x/month",
          },
          {
            label: "Target Turnover Rate",
            value: "2.5",
            unit: "x/month",
          },
          {
            label: "Best Performing Area",
            value: areas.length > 0 ? areas[0] : "N/A",
            unit: "",
          },
          {
            label: "Monthly Improvement",
            value: 8.5,
            unit: "%",
            trend: {
              value: 8.5,
              isPositive: true,
            },
          },
        ],
        chartData: areas.map((area) => ({
          name: area,
          turnoverRate: Math.random() * 3 + 1,
          target: 2.5,
        })),
        chartType: "bar" as const,
        details: areas.map((area) => ({
          label: area,
          value: `${(Math.random() * 3 + 1).toFixed(2)}x turnover`,
          status:
            Math.random() > 0.7
              ? "good"
              : Math.random() > 0.4
              ? "warning"
              : "critical",
        })),
        actions: [
          {
            label: "Optimize Turnover",
            onClick: () => console.log("Optimize turnover"),
            variant: "primary",
          },
        ],
      },
    },
    {
      title: t.silo_utilization,
      value: performanceData.utilization.toFixed(1),
      unit: "%",
      icon: <ChartBarSquareIcon className="w-4 h-4" />,
      trend:
        performanceData.utilization > 90
          ? "critical"
          : performanceData.utilization > 75
          ? "warning"
          : "good",
      breakdownData: {
        title: "Silo Utilization Analysis",
        description: "Comprehensive breakdown of silo capacity utilization",
        metrics: [
          {
            label: "Current Utilization",
            value: performanceData.utilization.toFixed(1),
            unit: "%",
          },
          {
            label: "Optimal Range",
            value: "70-85",
            unit: "%",
          },
          {
            label: "Peak Utilization Today",
            value: Math.min(100, performanceData.utilization + 10).toFixed(1),
            unit: "%",
          },
          {
            label: "Available Capacity",
            value: (100 - performanceData.utilization).toFixed(1),
            unit: "%",
          },
        ],
        chartData: Array.from({ length: 7 }, (_, i) => ({
          name: `Day ${i + 1}`,
          utilization: Math.max(
            50,
            Math.min(
              100,
              performanceData.utilization + (Math.random() - 0.5) * 20
            )
          ),
          target: 80,
        })),
        chartType: "line" as const,
        details: [
          {
            label: "Critical Silos",
            value: `${Math.round(areas.length * 0.2)}`,
            status: "critical",
          },
          {
            label: "Near Capacity",
            value: `${Math.round(areas.length * 0.3)}`,
            status: "warning",
          },
          {
            label: "Optimal Range",
            value: `${Math.round(areas.length * 0.4)}`,
            status: "good",
          },
          {
            label: "Underutilized",
            value: `${Math.round(areas.length * 0.1)}`,
            status: "neutral",
          },
        ],
      },
    },
    {
      title: t.over_slot_frequency,
      value: formatNumber(performanceData.overSlotFrequency),
      unit: t.times_unit,
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      trend:
        performanceData.overSlotFrequency > 5
          ? "critical"
          : performanceData.overSlotFrequency > 2
          ? "warning"
          : "good",
      breakdownData: {
        title: "Over Slot Frequency Analysis",
        description: "Analysis of capacity overflow incidents and their impact",
        metrics: [
          {
            label: "Total Incidents",
            value: formatNumber(performanceData.overSlotFrequency),
            unit: "times",
          },
          {
            label: "This Week",
            value: Math.round(performanceData.overSlotFrequency * 0.3),
            unit: "times",
          },
          {
            label: "Average per Area",
            value: (performanceData.overSlotFrequency / areas.length).toFixed(
              1
            ),
            unit: "times",
          },
          {
            label: "Reduction vs Last Month",
            value: 15,
            unit: "%",
            trend: {
              value: 15,
              isPositive: true,
            },
          },
        ],
        chartData: Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          incidents: Math.round(Math.random() * 3),
          capacity: 100,
        })),
        chartType: "bar" as const,
        details: [
          {
            label: "Most Affected Area",
            value: areas[0] || "N/A",
            status: "critical",
          },
          { label: "Peak Hour", value: "14:00-16:00", status: "warning" },
          { label: "Average Duration", value: "2.5 hours", status: "neutral" },
          { label: "Impact on Efficiency", value: "-12%", status: "critical" },
        ],
      },
    },
    {
      title: "Critical Days",
      value: formatNumber(performanceData.criticalDays.length),
      unit: "days",
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      trend:
        performanceData.criticalDays.length > performanceData.daysInMonth * 0.3
          ? "critical"
          : performanceData.criticalDays.length > 0
          ? "warning"
          : "good",
      breakdownData: {
        title: "Critical Days Analysis",
        description:
          "Detailed analysis of days with critical operational issues",
        metrics: [
          {
            label: "Total Critical Days",
            value: formatNumber(performanceData.criticalDays.length),
            unit: "days",
          },
          {
            label: "This Month",
            value: Math.round(performanceData.criticalDays.length * 0.6),
            unit: "days",
          },
          {
            label: "Impact on Production",
            value: 25,
            unit: "%",
          },
          {
            label: "Recovery Time",
            value: 4.5,
            unit: "hours",
          },
        ],
        chartData: performanceData.criticalDays.map((day, index) => ({
          name: `Critical Day ${index + 1}`,
          severity: Math.random() * 100 + 50,
          duration: Math.random() * 8 + 2,
        })),
        chartType: "bar" as const,
        details: performanceData.criticalDays.slice(0, 5).map((day, index) => ({
          label: `Critical Day ${index + 1}`,
          value: `Day ${day} - High severity`,
          status: "critical",
        })),
      },
    },
    {
      title: t.total_stock_out,
      value: formatNumber(Math.round(performanceData.totalStockOut)),
      unit: t.ton_unit,
      icon: <TruckIcon className="w-4 h-4" />,
      trend: "neutral",
      breakdownData: {
        title: "Stock Out Analysis",
        description: "Comprehensive analysis of stock outflow patterns",
        metrics: [
          {
            label: "Total Stock Out",
            value: formatNumber(Math.round(performanceData.totalStockOut)),
            unit: "tons",
          },
          {
            label: "Daily Average",
            value: formatNumber(Math.round(performanceData.totalStockOut / 30)),
            unit: "tons",
          },
          {
            label: "Peak Day",
            value: formatNumber(
              Math.round((performanceData.totalStockOut / 30) * 1.5)
            ),
            unit: "tons",
          },
          {
            label: "Efficiency Rate",
            value: 92,
            unit: "%",
          },
        ],
        chartData: Array.from({ length: 7 }, (_, i) => ({
          name: `Week ${i + 1}`,
          stockOut: Math.round(
            (performanceData.totalStockOut / 7) * (0.8 + Math.random() * 0.4)
          ),
          target: Math.round(performanceData.totalStockOut / 7),
        })),
        chartType: "line" as const,
        details: areas.map((area) => ({
          label: area,
          value: `${formatNumber(
            Math.round(performanceData.totalStockOut / areas.length)
          )} tons`,
          status: "neutral",
        })),
      },
    },
    {
      title: t.total_silo_capacity,
      value: formatNumber(performanceData.totalSiloCapacity),
      unit: t.ton_unit,
      icon: <BuildingLibraryIcon className="w-4 h-4" />,
      trend: "neutral",
      breakdownData: {
        title: "Silo Capacity Overview",
        description: "Total storage capacity across all silo facilities",
        metrics: [
          {
            label: "Total Capacity",
            value: formatNumber(performanceData.totalSiloCapacity),
            unit: "tons",
          },
          {
            label: "Number of Silos",
            value: areas.length,
            unit: "units",
          },
          {
            label: "Average per Silo",
            value: formatNumber(
              Math.round(performanceData.totalSiloCapacity / areas.length)
            ),
            unit: "tons",
          },
          {
            label: "Largest Silo",
            value: formatNumber(
              Math.round(
                (performanceData.totalSiloCapacity / areas.length) * 1.3
              )
            ),
            unit: "tons",
          },
        ],
        chartData: areas.map((area) => ({
          name: area,
          capacity: Math.round(
            (performanceData.totalSiloCapacity / areas.length) *
              (0.8 + Math.random() * 0.4)
          ),
          utilization: Math.random() * 100,
        })),
        chartType: "bar" as const,
        details: areas.map((area) => ({
          label: area,
          value: `${formatNumber(
            Math.round(performanceData.totalSiloCapacity / areas.length)
          )} tons capacity`,
          status: "good",
        })),
      },
    },
    {
      title: t.total_dead_stock,
      value: formatNumber(performanceData.totalDeadStock),
      unit: t.ton_unit,
      icon: <ArchiveBoxXMarkIcon className="w-4 h-4" />,
      trend: "neutral",
      breakdownData: {
        title: "Dead Stock Analysis",
        description:
          "Analysis of non-moving inventory and optimization opportunities",
        metrics: [
          {
            label: "Total Dead Stock",
            value: formatNumber(performanceData.totalDeadStock),
            unit: "tons",
          },
          {
            label: "Percentage of Total",
            value: (
              (performanceData.totalDeadStock /
                performanceData.totalSiloCapacity) *
              100
            ).toFixed(1),
            unit: "%",
          },
          {
            label: "Estimated Value",
            value: formatNumber(
              Math.round(performanceData.totalDeadStock * 500)
            ),
            unit: "USD",
          },
          {
            label: "Potential Savings",
            value: formatNumber(
              Math.round(performanceData.totalDeadStock * 100)
            ),
            unit: "USD",
          },
        ],
        chartData: areas.map((area) => ({
          name: area,
          deadStock: Math.round(
            (performanceData.totalDeadStock / areas.length) *
              (0.5 + Math.random())
          ),
          totalStock: Math.round(
            performanceData.totalSiloCapacity / areas.length
          ),
        })),
        chartType: "bar" as const,
        details: [
          { label: "Oldest Stock", value: "45 days", status: "critical" },
          { label: "Risk Level", value: "Medium", status: "warning" },
          { label: "Action Required", value: "Yes", status: "warning" },
          { label: "Clearance Plan", value: "In Progress", status: "neutral" },
        ],
      },
    },
    {
      title: t.avg_daily_stock,
      value: formatNumber(Math.round(performanceData.avgDailyStock)),
      unit: t.ton_unit,
      icon: <ArchiveBoxIcon className="w-4 h-4" />,
      trend: "neutral",
      breakdownData: {
        title: "Average Daily Stock Analysis",
        description: "Daily stock level patterns and trends analysis",
        metrics: [
          {
            label: "Daily Average",
            value: formatNumber(Math.round(performanceData.avgDailyStock)),
            unit: "tons",
          },
          {
            label: "Weekly Trend",
            value: 5.2,
            unit: "%",
            trend: {
              value: 5.2,
              isPositive: true,
            },
          },
          {
            label: "Seasonal Variation",
            value: 15,
            unit: "%",
          },
          {
            label: "Optimal Level",
            value: formatNumber(
              Math.round(performanceData.avgDailyStock * 1.1)
            ),
            unit: "tons",
          },
        ],
        chartData: Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          actualStock: Math.round(
            performanceData.avgDailyStock * (0.8 + Math.random() * 0.4)
          ),
          targetStock: Math.round(performanceData.avgDailyStock),
        })),
        chartType: "line" as const,
        details: [
          { label: "Stock Consistency", value: "Good", status: "good" },
          { label: "Variability", value: "12%", status: "good" },
          { label: "Predictability", value: "High", status: "good" },
          { label: "Planning Accuracy", value: "85%", status: "good" },
        ],
      },
    },
  ];

  // Get enhanced chart data and metrics
  const chartInsights = useMemo(() => {
    if (performanceData.noData) return null;

    const totalDaily =
      performanceData.chartData[performanceData.displayedAreas[0]]?.map(
        (d, index) => {
          return performanceData.displayedAreas.reduce((sum, area) => {
            const areaData = performanceData.chartData[area]?.[index];
            return sum + (areaData?.stock_out || 0);
          }, 0);
        }
      ) || [];

    const maxDaily = Math.max(...totalDaily);
    const minDaily = Math.min(...totalDaily);
    const avgDaily =
      totalDaily.reduce((sum, val) => sum + val, 0) / totalDaily.length;

    return {
      maxDaily,
      minDaily,
      avgDaily,
      totalDaily,
      variability: (((maxDaily - minDaily) / avgDaily) * 100).toFixed(1),
    };
  }, [performanceData]);

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {t.pack_logistics_performance_title}
          </h2>
          <Filters
            areas={areas}
            filterArea={filterArea}
            setFilterArea={setFilterArea}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            monthOptions={monthOptions}
            yearOptions={yearOptions}
            t={t}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-10 rounded-lg shadow-md text-center text-slate-500 animate-pulse">
          <p>{t.loading || "Loading data..."}</p>
        </div>
      ) : performanceData.noData ? (
        <div className="bg-white p-10 rounded-lg shadow-md text-center text-slate-500">
          <div className="space-y-3">
            <p>{t.forecast_no_data}</p>
            <div className="text-sm text-slate-400">
              <p>
                Filter aktif: {filterArea} - {monthOptions[filterMonth]?.label}{" "}
                {filterYear}
              </p>
              <p>
                Silakan pilih periode yang berbeda atau pastikan data tersedia
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Status Indicator */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Data untuk: {filterArea} - {monthOptions[filterMonth]?.label}{" "}
                  {filterYear}
                </span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {performanceData.displayedAreas.length} area,{" "}
                {performanceData.daysInMonth} hari
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {metrics.map((m) => (
              <MetricCard key={m.title} {...m} />
            ))}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  {t.daily_stock_out_chart}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {filterArea} - {monthOptions[filterMonth]?.label} {filterYear}{" "}
                  ({performanceData.daysInMonth} hari)
                </p>
              </div>

              {/* Chart Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Type:
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) =>
                      setChartType(e.target.value as "line" | "bar" | "combo")
                    }
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showTrend}
                    onChange={(e) => setShowTrend(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-600">Trend</span>
                </label>

                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showComparison}
                    onChange={(e) => setShowComparison(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-600">Compare</span>
                </label>
              </div>
            </div>

            {/* Critical Days Alert */}
            {performanceData.criticalDays.length > 0 && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-red-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4.586l3.293 3.293 1.414-1.414L12 10.586 8.293 14.293l1.414 1.414L12 12.586V8z"
                      />
                    </svg>
                  </span>
                  <span className="text-xs font-medium text-red-800">
                    Critical Days: {performanceData.criticalDays.length} high
                    stock-out days
                  </span>
                  <span className="text-xs text-red-700">
                    ({performanceData.criticalDays.join(", ")})
                  </span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mb-3">
              {performanceData.displayedAreas.map((area, i) => (
                <div key={area} className="flex items-center">
                  <span
                    className="w-2 h-2 rounded-sm mr-1"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></span>
                  {area}
                </div>
              ))}
              {showTrend && (
                <div className="flex items-center">
                  <span className="w-2 h-0.5 bg-slate-400 mr-1"></span>
                  Trend
                </div>
              )}
              {showComparison && (
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-sm mr-1 bg-slate-300 opacity-50"></span>
                  Prev Month
                </div>
              )}
            </div>

            {/* Modular Chart Component */}
            <Chart
              chartType={chartType}
              performanceData={performanceData}
              showTrend={showTrend}
              showComparison={showComparison}
              COLORS={COLORS}
              filterYear={filterYear}
              filterMonth={filterMonth}
              chartRef={chartRef}
              handleDaySelection={handleDaySelection}
              handleChartHover={handleChartHover}
              handleMouseLeaveChart={handleMouseLeaveChart}
              hoveredInfo={hoveredInfo}
              formatDate={formatDate}
              formatNumber={formatNumber}
            />

            {/* Recommendations Section */}
            {performanceData.recommendations.length > 0 && (
              <Recommendations
                recommendations={performanceData.recommendations}
              />
            )}

            {/* Stock Out Table Section */}
            <StockOutTable
              tableData={performanceData.tableData}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              formatNumber={formatNumber}
              t={t}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LogisticsPerformance;
