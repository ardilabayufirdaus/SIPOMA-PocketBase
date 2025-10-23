import { useMemo } from 'react';
import { ParameterSetting, CcrSiloData } from '../types';

interface DataFilteringOptions {
  parameterSettings: ParameterSetting[];
  plantUnits: any[];
  selectedCategory: string;
  selectedUnit: string;
  columnSearchQuery: string;
  allDailySiloData: CcrSiloData[];
  siloMasterData: any[];
}

export const useDataFiltering = ({
  parameterSettings,
  plantUnits,
  selectedCategory,
  selectedUnit,
  columnSearchQuery,
  allDailySiloData,
  siloMasterData,
}: DataFilteringOptions) => {
  const siloMasterMap = useMemo(
    () => new Map(siloMasterData.map((silo) => [silo.id, silo])),
    [siloMasterData]
  );

  const filteredParameterSettings = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];

    const unitBelongsToCategory = plantUnits.some(
      (pu) => pu.unit === selectedUnit && pu.category === selectedCategory
    );
    if (!unitBelongsToCategory) return [];

    let filtered = parameterSettings
      .filter((param) => param.category === selectedCategory && param.unit === selectedUnit)
      .sort((a, b) => a.parameter.localeCompare(b.parameter));

    // Apply column search filter
    if (columnSearchQuery.trim()) {
      const searchTerm = columnSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (param) =>
          param.parameter.toLowerCase().includes(searchTerm) ||
          param.unit.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [parameterSettings, plantUnits, selectedCategory, selectedUnit, columnSearchQuery]);

  const dailySiloData = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return allDailySiloData.filter((data) => {
      const master = siloMasterMap.get(data.silo_id);
      if (!master) return false;

      const categoryMatch = master.plant_category === selectedCategory;
      const unitMatch = !selectedUnit || master.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });
  }, [allDailySiloData, selectedCategory, selectedUnit, siloMasterMap]);

  return {
    filteredParameterSettings,
    dailySiloData,
    siloMasterMap,
  };
};

