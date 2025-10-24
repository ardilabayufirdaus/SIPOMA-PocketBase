import { useMemo } from 'react';
import { usePlantUnits } from './usePlantUnits';
import { useSiloCapacities } from './useSiloCapacities';
import { useAutonomousRiskData } from './useAutonomousRiskData';
import { useWorkInstructions } from './useWorkInstructions';

export interface DashboardFilters {
  plantCategory: string;
  plantUnit: string;
  timeRange: string;
  month: number;
  year: number;
}

export interface RiskDataEntry {
  id: string;
  risk_description: string;
  status: string;
  created_at: string;
  unit: string;
  category: string;
}

export interface DashboardStats {
  totalUnits: number;
  totalParameters: number;
  todaysCcrEntries: number;
}

export interface FilteredData {
  uniqueCategories: string[];
  availableUnits: string[];
}

export const useDashboardDataAggregator = (filters: DashboardFilters) => {
  const { records: plantUnits, loading: unitsLoading } = usePlantUnits();
  const { records: siloData, loading: siloLoading } = useSiloCapacities();
  const { records: riskData, loading: riskLoading } = useAutonomousRiskData();
  const { instructions: workInstructions, loading: workLoading } = useWorkInstructions();

  const isLoading = unitsLoading || siloLoading || riskLoading || workLoading;

  // Aggregate data based on filters
  const { data, stats, filteredData } = useMemo(() => {
    // Filter plant units based on category and unit filters
    const filteredUnits =
      plantUnits?.filter((unit) => {
        const categoryMatch =
          filters.plantCategory === 'all' || unit.category === filters.plantCategory;
        const unitMatch = filters.plantUnit === 'all' || unit.unit === filters.plantUnit;
        return categoryMatch && unitMatch;
      }) || [];

    // Get unique categories from filtered units
    const uniqueCategories = [...new Set(filteredUnits.map((unit) => unit.category))];

    // Get available units for selected category
    const availableUnits =
      filters.plantCategory === 'all'
        ? filteredUnits.map((unit) => unit.unit)
        : filteredUnits
            .filter((unit) => unit.category === filters.plantCategory)
            .map((unit) => unit.unit);

    // Mock CCR data for now (since useCcrData doesn't exist)
    const ccrData: unknown[] = [];

    // Filter CCR data (empty for now)
    const filteredCcrData = ccrData;

    // Filter silo data
    const filteredSiloData =
      siloData?.filter((silo) => {
        const categoryMatch =
          filters.plantCategory === 'all' || silo.plant_category === filters.plantCategory;
        return categoryMatch;
      }) || [];

    // Filter risk data
    const filteredRiskData =
      (riskData as unknown as RiskDataEntry[])?.filter((risk) => {
        const unitMatch = filters.plantUnit === 'all' || risk.unit === filters.plantUnit;
        const categoryMatch =
          filters.plantCategory === 'all' || risk.category === filters.plantCategory;
        return unitMatch && categoryMatch;
      }) || [];

    // Calculate stats
    const stats: DashboardStats = {
      totalUnits: filteredUnits.length,
      totalParameters: filteredCcrData.length,
      todaysCcrEntries: 0, // Mock for now
    };

    return {
      data: {
        ccrData: filteredCcrData,
        siloCapacities: filteredSiloData,
        riskData: filteredRiskData,
        workInstructions: workInstructions || [],
      },
      stats,
      filteredData: {
        uniqueCategories,
        availableUnits,
      },
    };
  }, [plantUnits, siloData, riskData, workInstructions, filters]);

  return {
    data,
    stats,
    filteredData,
    plantUnits: plantUnits || [],
    isLoading,
  };
};
