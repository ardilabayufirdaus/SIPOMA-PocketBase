import { useMemo } from 'react';
import { usePlantUnits } from './usePlantUnits';
import { useSiloCapacities } from './useSiloCapacities';
import { useAutonomousRiskData } from './useAutonomousRiskData';
import { useWorkInstructions } from './useWorkInstructions';
import { useCopParametersSupabase } from './useCopParametersSupabase';
import { useParameterSettings } from './useParameterSettings';
import { useReportSettings } from './useReportSettings';
import { RiskStatus } from '../types';

export interface PlantOperationsDashboardStats {
  totalUnits: number;
  totalParameters: number;
  totalCopParameters: number;
  todaysCcrEntries: number;
  totalRiskRecords: number;
  activeRisks: number;
  totalSiloCapacities: number;
  totalWorkInstructions: number;
  totalReportSettings: number;
  systemUptime: number;
}

export interface PlantOperationsModuleData {
  id: string;
  title: string;
  description: string;
  route: string;
  count: number;
  status: 'normal' | 'warning' | 'critical';
  trend: {
    value: number;
    isPositive: boolean;
  };
  lastUpdated?: string;
}

export const usePlantOperationsDashboard = (filters?: {
  plantCategory?: string;
  plantUnit?: string;
  timeRange?: string;
}) => {
  // Hooks for data fetching
  const { records: plantUnits, loading: unitsLoading } = usePlantUnits();
  const { records: siloCapacities, loading: siloLoading } = useSiloCapacities();
  const { records: riskData, loading: riskLoading } = useAutonomousRiskData();
  const { instructions: workInstructions, loading: workLoading } = useWorkInstructions();
  const { copParameterIds, loading: copLoading } = useCopParametersSupabase();
  const { records: parameterSettings, loading: paramLoading } = useParameterSettings();
  const { records: reportSettings, loading: reportLoading } = useReportSettings();

  const isLoading =
    unitsLoading ||
    siloLoading ||
    riskLoading ||
    workLoading ||
    copLoading ||
    paramLoading ||
    reportLoading;

  // Calculate comprehensive statistics
  const stats: PlantOperationsDashboardStats = useMemo(() => {
    const activeRisks =
      riskData?.filter(
        (risk) => risk.status === RiskStatus.IDENTIFIED || risk.status === RiskStatus.IN_PROGRESS
      ).length || 0;

    // Mock today's CCR entries - would be calculated from actual CCR data
    const todaysCcrEntries = Math.floor(Math.random() * 25) + 10;

    return {
      totalUnits: plantUnits?.length || 0,
      totalParameters: parameterSettings?.length || 0,
      totalCopParameters: copParameterIds?.length || 0,
      todaysCcrEntries,
      totalRiskRecords: riskData?.length || 0,
      activeRisks,
      totalSiloCapacities: siloCapacities?.length || 0,
      totalWorkInstructions: workInstructions?.length || 0,
      totalReportSettings: reportSettings?.length || 0,
      systemUptime: 99.8, // Mock system uptime
    };
  }, [
    plantUnits,
    parameterSettings,
    copParameterIds,
    riskData,
    siloCapacities,
    workInstructions,
    reportSettings,
  ]);

  // Module data with real statistics
  const moduleData: PlantOperationsModuleData[] = useMemo(
    () => [
      {
        id: 'ccr-data-entry',
        title: 'CCR Data Entry',
        description: 'Central Control Room data management',
        route: 'op_ccr_data_entry',
        count: stats.todaysCcrEntries,
        status: 'normal',
        trend: { value: 8.2, isPositive: true },
      },
      {
        id: 'autonomous-data',
        title: 'Autonomous Data Entry',
        description: 'Autonomous risk and downtime tracking',
        route: 'op_autonomous_data_entry',
        count: stats.totalRiskRecords,
        status: stats.activeRisks > 5 ? 'warning' : 'normal',
        trend: { value: stats.activeRisks > 0 ? -2.5 : 5.1, isPositive: stats.activeRisks === 0 },
      },
      {
        id: 'cop-analysis',
        title: 'COP Analysis',
        description: 'Coefficient of Performance analysis',
        route: 'op_cop_analysis',
        count: stats.totalCopParameters,
        status: 'normal',
        trend: { value: 12.3, isPositive: true },
      },
      {
        id: 'reports',
        title: 'Reports',
        description: 'Comprehensive operational reports',
        route: 'op_report',
        count: stats.totalReportSettings,
        status: 'normal',
        trend: { value: 5.7, isPositive: true },
      },
      {
        id: 'whatsapp-reports',
        title: 'WhatsApp Reports',
        description: 'Automated WhatsApp group reporting',
        route: 'op_wag_report',
        count: 8, // Mock count for WhatsApp reports
        status: 'normal',
        trend: { value: 3.1, isPositive: true },
      },
      {
        id: 'work-instructions',
        title: 'Work Instructions',
        description: 'Digital work instruction library',
        route: 'op_work_instruction_library',
        count: stats.totalWorkInstructions,
        status: 'normal',
        trend: { value: 1.8, isPositive: true },
      },
      {
        id: 'master-data',
        title: 'Master Data',
        description: 'Plant configuration and settings',
        route: 'op_master_data',
        count: stats.totalUnits + stats.totalParameters + stats.totalSiloCapacities,
        status: 'normal',
        trend: { value: 0, isPositive: true },
      },
      {
        id: 'monitoring',
        title: 'Equipment Monitoring',
        description: 'Real-time equipment status monitoring',
        route: 'op_monitoring',
        count: stats.totalUnits,
        status: 'normal',
        trend: { value: 4.5, isPositive: true },
      },
    ],
    [stats]
  );

  // Filter data based on provided filters
  const filteredData = useMemo(() => {
    if (!filters) return { plantUnits, riskData, siloCapacities };

    const filteredUnits = plantUnits?.filter((unit) => {
      if (filters.plantCategory && filters.plantCategory !== 'all') {
        return unit.category === filters.plantCategory;
      }
      if (filters.plantUnit && filters.plantUnit !== 'all') {
        return unit.unit === filters.plantUnit;
      }
      return true;
    });

    const filteredRisks = riskData?.filter((risk) => {
      if (filters.plantUnit && filters.plantUnit !== 'all') {
        return risk.unit === filters.plantUnit;
      }
      return true;
    });

    const filteredSilos = siloCapacities?.filter((silo) => {
      if (filters.plantCategory && filters.plantCategory !== 'all') {
        return silo.plant_category === filters.plantCategory;
      }
      return true;
    });

    return {
      plantUnits: filteredUnits,
      riskData: filteredRisks,
      siloCapacities: filteredSilos,
    };
  }, [filters, plantUnits, riskData, siloCapacities]);

  // Recent activities (mock data for demo)
  const recentActivities = useMemo(
    () => [
      {
        id: '1',
        type: 'ccr_entry',
        title: 'New CCR data entry for Unit 1',
        timestamp: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: '2',
        type: 'risk_identified',
        title: 'Risk identified in Kiln 2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'warning',
      },
      {
        id: '3',
        type: 'cop_analysis',
        title: 'COP analysis completed for OPC cement',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: 'completed',
      },
      {
        id: '4',
        type: 'work_instruction',
        title: 'New work instruction published',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'info',
      },
    ],
    []
  );

  return {
    stats,
    moduleData,
    filteredData,
    recentActivities,
    isLoading,
    rawData: {
      plantUnits,
      siloCapacities,
      riskData,
      workInstructions,
      copParameterIds,
      parameterSettings,
      reportSettings,
    },
  };
};
