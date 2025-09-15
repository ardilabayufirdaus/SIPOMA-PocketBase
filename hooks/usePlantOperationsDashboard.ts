import { useState, useMemo, useCallback } from "react";
import useCcrDowntimeData from "./useCcrDowntimeData";
import { useAutonomousRiskData } from "./useAutonomousRiskData";
import { usePlantUnits } from "./usePlantUnits";
import { useParameterSettings } from "./useParameterSettings";
import { useCopParametersSupabase } from "./useCopParametersSupabase";
import { useDebouncedCallback } from "./useDebouncedCallback";

export interface PlantOperationsStats {
  totalUnits: number;
  totalCategories: number;
  totalParameters: number;
  totalCopParameters: number;
  totalDowntimeRecords: number;
  todayDowntime: number;
  openDowntime: number;
  totalRiskRecords: number;
  inProgressRisks: number;
  identifiedRisks: number;
}

export interface PlantOperationsDataPoint {
  timestamp: string;
  efficiency: number;
  availability: number;
  quality: number;
  throughput: number;
  downtime: number;
  oee: number;
  production: number;
  temperature: number;
  pressure: number;
}

export interface DashboardKPI {
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

export const usePlantOperationsDashboard = () => {
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

  // Stabilkan currentTime untuk menghindari re-computation
  const currentTime = useMemo(() => new Date(), []);

  // Stabilkan today calculation
  const today = useMemo(
    () => currentTime.toISOString().split("T")[0],
    [currentTime]
  );

  // Optimasi: Stabilkan downtime data dengan useMemo untuk menghindari re-computation
  const downtimeData = useMemo(() => getAllDowntime(), [getAllDowntime]);

  // Optimasi: Plant Operations statistics dengan dependencies yang lebih stabil
  const plantOperationsStats = useMemo((): PlantOperationsStats => {
    // Pre-compute derived values untuk menghindari repeated calculations
    const totalUnits = plantUnits.length;
    const totalCategories = new Set(plantUnits.map((u) => u.category)).size;
    const totalParameters = parameterSettings.length;
    const totalCopParameters = copParameterIds.length;

    // Downtime statistics - optimasi filtering
    const todayDowntime = downtimeData.filter((d) => d.date === today).length;
    const openDowntime = downtimeData.filter((d) => d.status === "Open").length;

    // Risk statistics - optimasi filtering
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
      totalDowntimeRecords: downtimeData.length,
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

  // Optimasi: Real data from Plant Operations untuk chart dengan memoization agresif
  const realPlantOperationsData = useMemo((): PlantOperationsDataPoint[] => {
    // Pre-calculate hours to show untuk menghindari repeated calculations
    const hoursToShow =
      timeRange === "1h"
        ? 1
        : timeRange === "4h"
        ? 4
        : timeRange === "12h"
        ? 12
        : 24;

    // Pre-compute base metrics untuk menghindari repeated calculations dalam loop
    const baseEfficiency = 100 - plantOperationsStats.openDowntime * 15;
    const baseAvailability = 100 - plantOperationsStats.inProgressRisks * 10;
    const baseQuality = plantOperationsStats.totalParameters > 0 ? 95 : 70;
    const baseThroughput = plantOperationsStats.totalUnits * 10;

    // Optimasi: Gunakan for loop instead of Array.from untuk performa lebih baik
    const data: PlantOperationsDataPoint[] = [];

    for (let index = 0; index < hoursToShow; index++) {
      const time = new Date(
        currentTime.getTime() - (hoursToShow - index) * 60 * 60 * 1000
      );

      // Use pre-computed base values with minimal variation
      const efficiency = Math.max(0, baseEfficiency);
      const availability = Math.max(0, baseAvailability);
      const quality = baseQuality;
      const throughput = baseThroughput;
      const downtime = plantOperationsStats.todayDowntime;

      data.push({
        timestamp: time.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        efficiency,
        availability,
        quality,
        throughput,
        downtime,
        oee: (efficiency * availability * quality) / 10000,
        production: Math.floor(throughput * (efficiency / 100)),
        temperature: 75, // Could be from sensor data if available
        pressure: 2.5, // Could be from sensor data if available
      });
    }

    return data;
  }, [currentTime, plantOperationsStats, timeRange]);

  // Optimasi: Stabilkan event handlers dengan debouncing untuk performa
  const handleTimeRangeChange = useDebouncedCallback(
    useCallback((range: "1h" | "4h" | "12h" | "24h") => {
      setTimeRange(range);
    }, []),
    300 // 300ms debounce
  );

  const handleMetricChange = useDebouncedCallback(
    useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedMetric(e.target.value);
    }, []),
    300 // 300ms debounce
  );

  // Loading state
  const isLoading =
    downtimeLoading ||
    riskLoading ||
    unitsLoading ||
    parametersLoading ||
    copLoading;

  return {
    // State
    timeRange,
    selectedMetric,
    plantOperationsStats,
    realPlantOperationsData,
    isLoading,

    // Handlers
    handleTimeRangeChange,
    handleMetricChange,

    // Raw data (if needed)
    plantUnits,
    parameterSettings,
    copParameterIds,
    downtimeData,
    riskRecords,
  };
};
