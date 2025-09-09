import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useToast } from "../../hooks/useToast";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useCcrSiloData } from "../../hooks/useCcrSiloData";
import { useCcrParameterData } from "../../hooks/useCcrParameterData";
import { useCcrDowntimeData } from "../../hooks/useCcrDowntimeData";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useSiloCapacities } from "../../hooks/useSiloCapacities";
import { usePicSettings } from "../../hooks/usePicSettings";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import { translations } from "../../translations";
import {
  CcrSiloData,
  CcrParameterData,
  CcrDowntimeData,
  ParameterSetting,
  SiloCapacity,
  PicSetting,
  PlantUnit,
} from "../../types";

// Import the refactored components
import CcrDataEntryHeader from "../../components/ccr/CcrDataEntryHeader";
import CcrSiloDataTable from "../../components/ccr/CcrSiloDataTable";
import CcrParameterDataTable from "../../components/ccr/CcrParameterDataTable";
import CcrDowntimeDataTable from "../../components/ccr/CcrDowntimeDataTable";

const CcrDataEntryPageRefactored: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useCurrentUser();
  const t = translations.id; // Indonesian translations

  // State management
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [savingSiloId, setSavingSiloId] = useState<string | null>(null);
  const [savingParameterId, setSavingParameterId] = useState<string | null>(
    null
  );

  // Input refs for navigation
  const [inputRefs, setInputRefs] = useState<
    Map<string, HTMLInputElement | null>
  >(new Map());

  // Custom hooks for data management
  const {
    dailySiloData,
    loading: siloLoading,
    saveSiloData,
    refreshSiloData,
  } = useCcrSiloData(selectedDate, selectedCategory);

  const {
    parameterDataMap,
    loading: parameterLoading,
    saveParameterData,
    refreshParameterData,
  } = useCcrParameterData(selectedDate);

  const {
    downtimeData,
    loading: downtimeLoading,
    saveDowntimeData,
    addDowntime,
    deleteDowntime,
    refreshDowntimeData,
  } = useCcrDowntimeData(selectedDate, selectedUnit);

  // Master data hooks
  const { parameterSettings, loading: paramSettingsLoading } =
    useParameterSettings();
  const { siloCapacities, loading: siloCapacitiesLoading } =
    useSiloCapacities();
  const { picSettings, loading: picSettingsLoading } = usePicSettings();
  const { plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Loading state
  const loading =
    siloLoading ||
    parameterLoading ||
    downtimeLoading ||
    paramSettingsLoading ||
    siloCapacitiesLoading ||
    picSettingsLoading ||
    plantUnitsLoading;

  // Filtered data
  const filteredParameterSettings = useMemo(() => {
    return parameterSettings.filter(
      (param) => param.category === selectedCategory
    );
  }, [parameterSettings, selectedCategory]);

  const siloMasterMap = useMemo(() => {
    const map = new Map<string, SiloCapacity>();
    siloCapacities
      .filter((silo) => silo.plant_category === selectedCategory)
      .forEach((silo) => map.set(silo.id, silo));
    return map;
  }, [siloCapacities, selectedCategory]);

  // Utility functions
  const formatInputValue = useCallback((value: any): string => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number") {
      return value.toString().replace(".", ",");
    }
    return value.toString();
  }, []);

  const parseInputValue = useCallback((value: string): number | null => {
    if (!value || value.trim() === "") return null;
    const cleaned = value.replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }, []);

  const formatTimeValue = useCallback((value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    return date.toTimeString().slice(0, 5); // HH:MM format
  }, []);

  const parseTimeValue = useCallback(
    (value: string): string => {
      if (!value) return "";
      return `${selectedDate}T${value}:00`;
    },
    [selectedDate]
  );

  // Event handlers
  const handleSiloDataChange = useCallback(
    async (
      siloId: string,
      shift: "shift1" | "shift2" | "shift3",
      field: "emptySpace" | "content",
      value: string
    ) => {
      try {
        setSavingSiloId(siloId);
        await saveSiloData(siloId, shift, field, value);
        toast.showToast("Data berhasil disimpan", "success");
      } catch (error) {
        console.error("Error saving silo data:", error);
        toast.showToast("Gagal menyimpan data", "error");
      } finally {
        setSavingSiloId(null);
      }
    },
    [saveSiloData, toast, t]
  );

  const handleParameterDataChange = useCallback(
    async (parameterId: string, hour: number, value: string) => {
      try {
        setSavingParameterId(parameterId);
        await saveParameterData(parameterId, hour, value);
        toast.showToast("Data berhasil disimpan", "success");
      } catch (error) {
        console.error("Error saving parameter data:", error);
        toast.showToast("Gagal menyimpan data", "error");
      } finally {
        setSavingParameterId(null);
      }
    },
    [saveParameterData, toast, t]
  );

  const handleDowntimeChange = useCallback(
    async (
      downtimeId: string,
      field: "start_time" | "end_time" | "problem",
      value: string
    ) => {
      try {
        await saveDowntimeData(downtimeId, field, value);
        toast.showToast("Data berhasil disimpan", "success");
      } catch (error) {
        console.error("Error saving downtime data:", error);
        toast.showToast("Gagal menyimpan data", "error");
      }
    },
    [saveDowntimeData, toast, t]
  );

  const handleAddDowntime = useCallback(async () => {
    try {
      await addDowntime();
      toast.showToast("Downtime berhasil ditambahkan", "success");
    } catch (error) {
      console.error("Error adding downtime:", error);
      toast.showToast("Gagal menambahkan downtime", "error");
    }
  }, [addDowntime, toast, t]);

  const handleDeleteDowntime = useCallback(
    async (downtimeId: string) => {
      try {
        await deleteDowntime(downtimeId);
        toast.showToast("Downtime berhasil dihapus", "success");
      } catch (error) {
        console.error("Error deleting downtime:", error);
        toast.showToast("Gagal menghapus downtime", "error");
      }
    },
    [deleteDowntime, toast, t]
  );

  // Input navigation functions
  const getInputRef = useCallback(
    (table: "silo" | "parameter", row: number, col: number): string => {
      return `${table}-${row}-${col}`;
    },
    []
  );

  const setInputRef = useCallback(
    (key: string, element: HTMLInputElement | null) => {
      setInputRefs((prev) => new Map(prev.set(key, element)));
    },
    []
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      table: "silo" | "parameter",
      currentRow: number,
      currentCol: number
    ) => {
      const maxRows = table === "silo" ? dailySiloData.length : 24;
      const maxCols = table === "silo" ? 6 : filteredParameterSettings.length;

      let nextRow = currentRow;
      let nextCol = currentCol;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextRow = Math.max(0, currentRow - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextRow = Math.min(maxRows - 1, currentRow + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextCol = Math.max(0, currentCol - 1);
          break;
        case "ArrowRight":
        case "Tab":
          e.preventDefault();
          nextCol = Math.min(maxCols - 1, currentCol + 1);
          break;
        case "Enter":
          e.preventDefault();
          nextRow = Math.min(maxRows - 1, currentRow + 1);
          nextCol = 0;
          break;
        case "Escape":
          e.preventDefault();
          // Exit navigation mode
          return;
        default:
          return;
      }

      const nextRefKey = getInputRef(table, nextRow, nextCol);
      const nextElement = inputRefs.get(nextRefKey);
      if (nextElement) {
        nextElement.focus();
        nextElement.select();
      }
    },
    [
      dailySiloData.length,
      filteredParameterSettings.length,
      getInputRef,
      inputRefs,
    ]
  );

  const shouldHighlightColumn = useCallback(
    (param: ParameterSetting): boolean => {
      // Implement column highlighting logic based on search/filter
      return false; // Placeholder
    },
    []
  );

  // Refresh data when date or category changes
  useEffect(() => {
    if (selectedDate && selectedCategory) {
      refreshSiloData();
      refreshParameterData();
    }
    if (selectedDate && selectedUnit) {
      refreshDowntimeData();
    }
  }, [
    selectedDate,
    selectedCategory,
    selectedUnit,
    refreshSiloData,
    refreshParameterData,
    refreshDowntimeData,
  ]);

  // Initialize selected category and unit
  useEffect(() => {
    if (plantUnits.length > 0 && !selectedCategory) {
      setSelectedCategory(plantUnits[0].category);
    }
    if (plantUnits.length > 0 && !selectedUnit) {
      setSelectedUnit(plantUnits[0].unit);
    }
  }, [plantUnits, selectedCategory, selectedUnit]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Component */}
          <CcrDataEntryHeader
            t={t}
            selectedDate={selectedDate}
            selectedCategory={selectedCategory}
            selectedUnit={selectedUnit}
            plantUnits={plantUnits}
            onDateChange={setSelectedDate}
            onCategoryChange={setSelectedCategory}
            onUnitChange={setSelectedUnit}
            loading={loading}
          />

          {/* Silo Data Table */}
          <CcrSiloDataTable
            t={t}
            loading={siloLoading}
            dailySiloData={dailySiloData}
            siloMasterMap={siloMasterMap}
            selectedCategory={selectedCategory}
            formatInputValue={formatInputValue}
            parseInputValue={parseInputValue}
            handleSiloDataChange={handleSiloDataChange}
            getInputRef={getInputRef}
            setInputRef={setInputRef}
            handleKeyDown={handleKeyDown}
          />

          {/* Parameter Data Table */}
          <CcrParameterDataTable
            t={t}
            loading={parameterLoading}
            filteredParameterSettings={filteredParameterSettings}
            parameterDataMap={parameterDataMap}
            savingParameterId={savingParameterId}
            handleParameterDataChange={handleParameterDataChange}
            getInputRef={getInputRef}
            setInputRef={setInputRef}
            handleKeyDown={handleKeyDown}
            shouldHighlightColumn={shouldHighlightColumn}
            formatInputValue={formatInputValue}
            parseInputValue={parseInputValue}
            formatStatValue={(value, precision) =>
              value !== undefined ? value.toFixed(precision || 2) : "0.00"
            }
            parameterShiftFooterData={null}
            parameterFooterData={null}
          />

          {/* Downtime Data Table */}
          <CcrDowntimeDataTable
            t={t}
            loading={downtimeLoading}
            downtimeData={downtimeData}
            handleDowntimeChange={handleDowntimeChange}
            handleAddDowntime={handleAddDowntime}
            handleDeleteDowntime={handleDeleteDowntime}
            formatTimeValue={formatTimeValue}
            parseTimeValue={parseTimeValue}
          />
        </div>
      </div>
    </div>
  );
};

export default CcrDataEntryPageRefactored;
