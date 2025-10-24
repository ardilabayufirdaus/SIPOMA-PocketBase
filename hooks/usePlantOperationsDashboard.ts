import { useState } from 'react';

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
  totalCopAnalysisRecords: number;
  averageCopValue: number;
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
  status: string;
  target: number;
}

export const usePlantOperationsDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');

  // Mock data for now
  const plantOperationsStats: PlantOperationsStats = {
    totalUnits: 5,
    totalCategories: 3,
    totalParameters: 25,
    totalCopParameters: 5,
    totalDowntimeRecords: 12,
    todayDowntime: 2,
    openDowntime: 1,
    totalRiskRecords: 8,
    inProgressRisks: 3,
    identifiedRisks: 5,
    totalCopAnalysisRecords: 15,
    averageCopValue: 85.5,
  };

  const realPlantOperationsData: PlantOperationsDataPoint[] = [
    {
      timestamp: '2024-01-01T00:00:00Z',
      efficiency: 85,
      availability: 90,
      quality: 95,
      throughput: 100,
      downtime: 10,
      oee: 80,
      production: 500,
      temperature: 75,
      pressure: 2.5,
    },
  ];

  const isLoading = false;

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
  };

  return {
    timeRange,
    selectedMetric,
    plantOperationsStats,
    realPlantOperationsData,
    isLoading,
    handleTimeRangeChange,
    handleMetricChange,
  };
};
