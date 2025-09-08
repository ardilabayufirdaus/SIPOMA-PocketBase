import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSiloCapacities } from "../../hooks/useSiloCapacities";
import { useCcrSiloData } from "../../hooks/useCcrSiloData";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useCcrParameterData } from "../../hooks/useCcrParameterData";
import useCcrDowntimeData from "../../hooks/useCcrDowntimeData";
import { useUsers } from "../../hooks/useUsers";
import {
  ParameterDataType,
  CcrDowntimeData,
  CcrSiloData,
  CcrParameterData,
} from "../../types";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import Modal from "../../components/Modal";
import CcrDowntimeForm from "./CcrDowntimeForm";
import CcrTableFooter from "../../components/ccr/CcrTableFooter";
import CcrTableSkeleton from "../../components/ccr/CcrTableSkeleton";
import CcrNavigationHelp from "../../components/ccr/CcrNavigationHelp";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import { formatNumber } from "../../utils/formatters";

// Enhanced Debounce utility function with cancel capability
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedValue, cancel };
};

const CcrDataEntryPage: React.FC<{ t: any }> = ({ t }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [savingParameterId, setSavingParameterId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showNavigationHelp, setShowNavigationHelp] = useState(false);

  // Enhanced keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<{
    table: "silo" | "parameter";
    row: number;
    col: number;
  } | null>(null);

  // Improved inputRefs management with cleanup
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const debouncedUpdates = useRef<
    Map<string, { value: string; timer: NodeJS.Timeout }>
  >(new Map());

  // Ref for main table wrapper to sync scroll with footer
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const { users } = useUsers();
  const currentUser = users[0] || { full_name: "Operator" };

  // Filter state and options from Plant Units master data
  const { records: plantUnits } = usePlantUnits();
  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Enhanced cleanup for inputRefs and debounced updates
  useEffect(() => {
    return () => {
      // Clear all debounced timers
      debouncedUpdates.current.forEach((update) => {
        clearTimeout(update.timer);
      });
      debouncedUpdates.current.clear();

      // Clear input refs
      inputRefs.current.clear();
    };
  }, [selectedDate, selectedCategory, selectedUnit]);
  const unitToCategoryMap = useMemo(
    () => new Map(plantUnits.map((pu) => [pu.unit, pu.category])),
    [plantUnits]
  );

  useEffect(() => {
    if (
      plantCategories.length > 0 &&
      !plantCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(plantCategories[0]);
    } else if (plantCategories.length === 0) {
      setSelectedCategory("");
    }
  }, [plantCategories, selectedCategory]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return plantUnits
      .filter((unit) => unit.category === selectedCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory]);

  useEffect(() => {
    if (
      unitsForCategory.length > 0 &&
      !unitsForCategory.includes(selectedUnit)
    ) {
      setSelectedUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedUnit("");
    }
  }, [unitsForCategory, selectedUnit]);

  // Silo Data Hooks and Filtering
  const { records: siloMasterData } = useSiloCapacities();
  const { getDataForDate: getSiloDataForDate, updateSiloData } =
    useCcrSiloData();
  const [allDailySiloData, setAllDailySiloData] = useState<CcrSiloData[]>([]);

  useEffect(() => {
    setLoading(true);
    getSiloDataForDate(selectedDate).then((data) => {
      setAllDailySiloData(data);
      setLoading(false);
    });
  }, [selectedDate, getSiloDataForDate]);

  const siloMasterMap = useMemo(
    () => new Map(siloMasterData.map((silo) => [silo.id, silo])),
    [siloMasterData]
  );

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

  // Parameter Data Hooks and Filtering
  const { records: parameterSettings } = useParameterSettings();
  const { getDataForDate: getParameterDataForDate, updateParameterData } =
    useCcrParameterData();
  const [dailyParameterData, setDailyParameterData] = useState<
    CcrParameterData[]
  >([]);
  useEffect(() => {
    setLoading(true);
    getParameterDataForDate(selectedDate).then((data) => {
      setDailyParameterData(data);
      setLoading(false);
    });
  }, [selectedDate, getParameterDataForDate]);

  const parameterDataMap = useMemo(
    () => new Map(dailyParameterData.map((p) => [p.parameter_id, p])),
    [dailyParameterData]
  );

  const filteredParameterSettings = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];
    const unitBelongsToCategory = plantUnits.some(
      (pu) => pu.unit === selectedUnit && pu.category === selectedCategory
    );
    if (!unitBelongsToCategory) return [];

    return parameterSettings
      .filter(
        (param) =>
          param.category === selectedCategory && param.unit === selectedUnit
      )
      .sort((a, b) => a.parameter.localeCompare(b.parameter));
  }, [parameterSettings, plantUnits, selectedCategory, selectedUnit]);

  // Downtime Data Hooks and State
  const { getDowntimeForDate, addDowntime, updateDowntime, deleteDowntime } =
    useCcrDowntimeData();
  const dailyDowntimeData = useMemo(() => {
    const allDowntimeForDate = getDowntimeForDate(selectedDate);
    if (!selectedCategory) {
      return allDowntimeForDate;
    }
    return allDowntimeForDate.filter((downtime) => {
      const categoryMatch =
        unitToCategoryMap.get(downtime.unit) === selectedCategory;
      const unitMatch = !selectedUnit || downtime.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });
  }, [
    getDowntimeForDate,
    selectedDate,
    selectedCategory,
    selectedUnit,
    unitToCategoryMap,
  ]);

  const [isDowntimeModalOpen, setDowntimeModalOpen] = useState(false);
  const [editingDowntime, setEditingDowntime] =
    useState<CcrDowntimeData | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    date: string;
  } | null>(null);

  const parameterFooterData = useMemo(() => {
    const footer: Record<
      string,
      { total: number; avg: number; min: number; max: number } | null
    > = {};

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        footer[param.id] = null;
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data || !data.hourly_values) {
        footer[param.id] = null;
        return;
      }

      const values = Object.values(data.hourly_values)
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v));

      if (values.length === 0) {
        footer[param.id] = null;
        return;
      }

      const total = values.reduce((sum, val) => sum + val, 0);
      const avg = total / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      footer[param.id] = { total, avg, min, max };
    });

    return footer;
  }, [filteredParameterSettings, parameterDataMap]);

  const parameterShiftFooterData = useMemo(() => {
    const shiftTotals: Record<string, Record<string, number>> = {
      shift1: {},
      shift2: {},
      shift3: {},
      shift3Cont: {},
    };

    const shiftHours = {
      shift1: [8, 9, 10, 11, 12, 13, 14, 15],
      shift2: [16, 17, 18, 19, 20, 21, 22],
      shift3: [23, 24],
      shift3Cont: [1, 2, 3, 4, 5, 6, 7],
    };

    filteredParameterSettings.forEach((param) => {
      if (param.data_type !== ParameterDataType.NUMBER) {
        return;
      }

      const data = parameterDataMap.get(param.id);
      if (!data || !data.hourly_values) {
        return;
      }

      for (const [shiftKey, hours] of Object.entries(shiftHours)) {
        const total = hours.reduce((sum, hour) => {
          const value = parseFloat(String(data.hourly_values[hour]));
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        shiftTotals[shiftKey][param.id] = total;
      }
    });

    return shiftTotals;
  }, [filteredParameterSettings, parameterDataMap]);

  const formatStatValue = (value: number | undefined, precision = 1) => {
    if (value === undefined || value === null) return "-";
    return formatNumber(value);
  };

  // Helper functions for input value formatting
  const formatInputValue = (
    value: number | string | null | undefined
  ): string => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return formatNumber(numValue);
  };

  const parseInputValue = (formattedValue: string): number | null => {
    if (!formattedValue || formattedValue.trim() === "") return null;
    // Convert formatted value back to number
    // Replace dots (thousands) and comma (decimal) back to standard format
    const normalized = formattedValue.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSiloDataChange = (
    siloId: string,
    shift: "shift1" | "shift2" | "shift3",
    field: "emptySpace" | "content",
    value: string
  ) => {
    // Update ke database
    updateSiloData(selectedDate, siloId, shift, field, parseFloat(value));
    // Update state lokal agar input langsung berubah
    setAllDailySiloData((prev) => {
      return prev.map((data) => {
        if (data.silo_id === siloId) {
          return {
            ...data,
            [shift]: {
              ...data[shift],
              [field]: parseFloat(value),
            },
          };
        }
        return data;
      });
    });
  };

  // Enhanced Parameter Data with debouncing and error handling
  const handleParameterDataChange = useCallback(
    (parameterId: string, hour: number, value: string) => {
      const updateKey = `${parameterId}-${hour}`;

      // Cancel previous debounced update for this parameter-hour
      const previousUpdate = debouncedUpdates.current.get(updateKey);
      if (previousUpdate) {
        clearTimeout(previousUpdate.timer);
      }

      // Optimistically update local state immediately for better UX
      setDailyParameterData((prev) => {
        const idx = prev.findIndex((p) => p.parameter_id === parameterId);
        if (idx === -1) return prev;

        const param = prev[idx];
        const newHourlyValues = { ...param.hourly_values };

        if (value === "" || value === null) {
          delete newHourlyValues[hour];
        } else {
          newHourlyValues[hour] = value;
        }

        const updatedParam = { ...param, hourly_values: newHourlyValues };
        const newArr = [...prev];
        newArr[idx] = updatedParam;
        return newArr;
      });

      // Set up debounced database update
      const timer = setTimeout(async () => {
        try {
          setSavingParameterId(parameterId);
          setError(null);

          const finalValue = value === "" ? null : value;
          await updateParameterData(
            selectedDate,
            parameterId,
            hour,
            finalValue,
            currentUser.full_name
          );

          // Refetch data to ensure consistency
          const updatedData = await getParameterDataForDate(selectedDate);
          setDailyParameterData(updatedData);
        } catch (error) {
          console.error("Error updating parameter data:", error);
          setError(`Failed to save data for parameter ${parameterId}`);

          // Revert optimistic update on error
          try {
            const revertedData = await getParameterDataForDate(selectedDate);
            setDailyParameterData(revertedData);
          } catch (revertError) {
            console.error("Error reverting data:", revertError);
          }
        } finally {
          setSavingParameterId(null);
          debouncedUpdates.current.delete(updateKey);
        }
      }, 800); // 800ms debounce delay

      // Store the timer for potential cancellation
      debouncedUpdates.current.set(updateKey, { value, timer });
    },
    [
      selectedDate,
      updateParameterData,
      getParameterDataForDate,
      currentUser.full_name,
    ]
  );

  // Keyboard navigation functions
  const getSiloTableDimensions = () => {
    const rows = dailySiloData.length;
    const cols = 6; // 2 input fields per shift * 3 shifts
    return { rows, cols };
  };

  const getParameterTableDimensions = () => {
    const rows = 24; // 24 hours
    const cols = filteredParameterSettings.length;
    return { rows, cols };
  };

  // Enhanced keyboard navigation with better input reference management
  const getInputRef = useCallback(
    (table: "silo" | "parameter", row: number, col: number) => {
      return `${table}-${row}-${col}`;
    },
    []
  );

  const setInputRef = useCallback(
    (key: string, element: HTMLInputElement | null) => {
      if (element) {
        inputRefs.current.set(key, element);
      } else {
        inputRefs.current.delete(key);
      }
    },
    []
  );

  const focusCell = useCallback(
    (table: "silo" | "parameter", row: number, col: number) => {
      const refKey = getInputRef(table, row, col);
      const input = inputRefs.current.get(refKey);
      if (input) {
        try {
          input.focus();
          input.select(); // Select text for better UX
          setFocusedCell({ table, row, col });
        } catch (error) {
          console.warn("Error focusing cell:", error);
        }
      }
    },
    [getInputRef]
  );

  // Enhanced keyboard navigation with improved logic
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      table: "silo" | "parameter",
      currentRow: number,
      currentCol: number
    ) => {
      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "Tab",
        "Escape",
      ];

      if (!navigationKeys.includes(e.key)) {
        return;
      }

      // Handle Escape to clear focus
      if (e.key === "Escape") {
        (e.target as HTMLInputElement).blur();
        setFocusedCell(null);
        return;
      }

      e.preventDefault();

      let newRow = currentRow;
      let newCol = currentCol;
      let newTable = table;

      const { rows: siloRows, cols: siloCols } = getSiloTableDimensions();
      const { rows: paramRows, cols: paramCols } =
        getParameterTableDimensions();

      // Early return if no valid tables
      if (siloRows === 0 && paramRows === 0) return;

      switch (e.key) {
        case "ArrowUp":
          if (table === "silo") {
            newRow = Math.max(0, currentRow - 1);
          } else if (table === "parameter") {
            if (currentRow > 0) {
              newRow = currentRow - 1;
            } else if (siloRows > 0) {
              // Jump to silo table
              newTable = "silo";
              newRow = siloRows - 1;
              newCol = Math.min(currentCol, siloCols - 1);
            }
          }
          break;

        case "ArrowDown":
        case "Enter":
          if (table === "silo") {
            if (currentRow < siloRows - 1) {
              newRow = currentRow + 1;
            } else if (paramRows > 0) {
              // Jump to parameter table
              newTable = "parameter";
              newRow = 0;
              newCol = Math.min(currentCol, paramCols - 1);
            }
          } else if (table === "parameter") {
            newRow = Math.min(paramRows - 1, currentRow + 1);
          }
          break;

        case "ArrowLeft":
          newCol = Math.max(0, currentCol - 1);
          break;

        case "ArrowRight":
        case "Tab":
          if (table === "silo") {
            if (currentCol < siloCols - 1) {
              newCol = currentCol + 1;
            } else if (currentRow < siloRows - 1) {
              newCol = 0;
              newRow = currentRow + 1;
            } else if (paramRows > 0 && paramCols > 0) {
              // Jump to parameter table
              newTable = "parameter";
              newRow = 0;
              newCol = 0;
            }
          } else if (table === "parameter") {
            if (currentCol < paramCols - 1) {
              newCol = currentCol + 1;
            } else if (currentRow < paramRows - 1) {
              newCol = 0;
              newRow = currentRow + 1;
            }
          }
          break;
      }

      // Validate new position and focus
      const isValidSilo =
        newTable === "silo" && newRow < siloRows && newCol < siloCols;
      const isValidParam =
        newTable === "parameter" && newRow < paramRows && newCol < paramCols;

      if (isValidSilo || isValidParam) {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          focusCell(newTable, newRow, newCol);
        });
      }
    },
    [focusCell, getSiloTableDimensions, getParameterTableDimensions]
  );

  const handleOpenAddDowntimeModal = () => {
    setEditingDowntime(null);
    setDowntimeModalOpen(true);
  };

  const handleOpenEditDowntimeModal = (record: CcrDowntimeData) => {
    setEditingDowntime(record);
    setDowntimeModalOpen(true);
  };

  const handleSaveDowntime = (
    record: CcrDowntimeData | Omit<CcrDowntimeData, "id" | "date">
  ) => {
    if ("id" in record) {
      updateDowntime(record);
    } else {
      addDowntime({ ...record, date: selectedDate });
    }
    setDowntimeModalOpen(false);
  };

  const handleOpenDeleteModal = (id: string, date: string) => {
    setDeletingRecord({ id, date });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      // FIX: Pass only one argument to deleteDowntime as per its definition
      deleteDowntime(deletingRecord.id);
    }
    setDeleteModalOpen(false);
    setDeletingRecord(null);
  }, [deletingRecord, deleteDowntime]);

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return `${t.shift_3} (${t.shift_3_cont})`;
    if (h >= 8 && h <= 15) return t.shift_1;
    if (h >= 16 && h <= 22) return t.shift_2;
    return t.shift_3;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Error Display */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          {t.op_ccr_data_entry}
        </h2>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-1 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-category"
              className="text-sm font-medium text-slate-700 whitespace-nowrap"
            >
              {t.plant_category_label}:
            </label>
            <select
              id="ccr-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              {plantCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-unit"
              className="text-sm font-medium text-slate-700 whitespace-nowrap"
            >
              {t.unit_label}:
            </label>
            <select
              id="ccr-unit"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              disabled={unitsForCategory.length === 0}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:bg-slate-100"
            >
              {unitsForCategory.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="ccr-date"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t.select_date}:
            </label>
            <input
              type="date"
              id="ccr-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Silo Data Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {t.ccr_data_entry_title}
        </h3>
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-slate-200 border border-slate-200"
            aria-label="Silo Data Table"
          >
            <thead className="bg-slate-50 text-center">
              <tr>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r align-middle"
                >
                  {t.silo_name}
                </th>
                <th
                  colSpan={3}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
                >
                  {t.shift_1}
                </th>
                <th
                  colSpan={3}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
                >
                  {t.shift_2}
                </th>
                <th
                  colSpan={3}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b"
                >
                  {t.shift_3}
                </th>
              </tr>
              <tr>
                {[...Array(3)].flatMap((_, i) => [
                  <th
                    key={`es-${i}`}
                    className="px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                  >
                    {t.empty_space}
                  </th>,
                  <th
                    key={`c-${i}`}
                    className="px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                  >
                    {t.content}
                  </th>,
                  <th
                    key={`p-${i}`}
                    className={`px-2 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                      i < 2 ? "border-r" : ""
                    }`}
                  >
                    {t.percentage}
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-10 text-slate-500 animate-pulse"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : (
                dailySiloData.map((siloData, siloIndex) => {
                  const masterSilo = siloMasterMap.get(siloData.silo_id);
                  if (!masterSilo) return null;

                  const shifts: ("shift1" | "shift2" | "shift3")[] = [
                    "shift1",
                    "shift2",
                    "shift3",
                  ];

                  return (
                    <tr key={siloData.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white z-10">
                        {masterSilo.silo_name}
                      </td>
                      {shifts.map((shift, i) => {
                        const content = siloData[shift]?.content;
                        const capacity = masterSilo.capacity;
                        const percentage =
                          capacity > 0 && typeof content === "number"
                            ? (content / capacity) * 100
                            : 0;

                        return (
                          <React.Fragment key={shift}>
                            <td
                              className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                                siloIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                              } transition-colors duration-200`}
                            >
                              <input
                                ref={(el) => {
                                  const refKey = getInputRef(
                                    "silo",
                                    siloIndex,
                                    i * 2
                                  );
                                  setInputRef(refKey, el);
                                }}
                                type="text"
                                value={formatInputValue(
                                  siloData[shift]?.emptySpace
                                )}
                                onChange={(e) => {
                                  const parsed = parseInputValue(
                                    e.target.value
                                  );
                                  handleSiloDataChange(
                                    siloData.silo_id,
                                    shift,
                                    "emptySpace",
                                    parsed !== null ? parsed.toString() : ""
                                  );
                                }}
                                onBlur={(e) => {
                                  // Reformat on blur to ensure consistent display
                                  const parsed = parseInputValue(
                                    e.target.value
                                  );
                                  if (parsed !== null) {
                                    e.target.value = formatInputValue(parsed);
                                  }
                                }}
                                onKeyDown={(e) =>
                                  handleKeyDown(e, "silo", siloIndex, i * 2)
                                }
                                className="w-full text-center px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all duration-200 hover:border-slate-400"
                                aria-label={`Empty Space for ${masterSilo.silo_name} ${shift}`}
                                title={`Isi ruang kosong untuk ${
                                  masterSilo.silo_name
                                } shift ${i + 1}`}
                                placeholder="0,0"
                              />
                            </td>
                            <td
                              className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                                siloIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                              } transition-colors duration-200`}
                            >
                              <input
                                ref={(el) => {
                                  const refKey = getInputRef(
                                    "silo",
                                    siloIndex,
                                    i * 2 + 1
                                  );
                                  setInputRef(refKey, el);
                                }}
                                type="text"
                                value={formatInputValue(content)}
                                onChange={(e) => {
                                  const parsed = parseInputValue(
                                    e.target.value
                                  );
                                  handleSiloDataChange(
                                    siloData.silo_id,
                                    shift,
                                    "content",
                                    parsed !== null ? parsed.toString() : ""
                                  );
                                }}
                                onBlur={(e) => {
                                  // Reformat on blur to ensure consistent display
                                  const parsed = parseInputValue(
                                    e.target.value
                                  );
                                  if (parsed !== null) {
                                    e.target.value = formatInputValue(parsed);
                                  }
                                }}
                                onKeyDown={(e) =>
                                  handleKeyDown(e, "silo", siloIndex, i * 2 + 1)
                                }
                                className="w-full text-center px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all duration-200 hover:border-slate-400"
                                aria-label={`Content for ${masterSilo.silo_name} ${shift}`}
                                title={`Isi konten untuk ${
                                  masterSilo.silo_name
                                } shift ${i + 1} (Max: ${masterSilo.capacity})`}
                                placeholder="0,0"
                              />
                            </td>
                            <td
                              className={`px-2 py-2 whitespace-nowrap text-sm text-center text-slate-600 align-middle ${
                                i < 2 ? "border-r" : ""
                              }`}
                            >
                              <div className="relative w-full h-6 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, percentage)}%`,
                                  }}
                                ></div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                                  {formatNumber(percentage)}%
                                </span>
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })
              )}
              {dailySiloData.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-10 text-slate-500 dark:text-slate-400"
                  >
                    {!selectedCategory
                      ? "No plant categories found in Master Data."
                      : `No silo master data found for the category: ${selectedCategory}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Parameter Data Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {t.ccr_parameter_data_entry_title}
          </h3>

          {/* Enhanced Table Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Use ↑↓←→ or Tab to navigate</span>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span>Press Esc to exit navigation</span>
            </div>
            <button
              onClick={() => setShowNavigationHelp(true)}
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Show navigation help"
            >
              ? Help
            </button>
          </div>
        </div>

        {loading ? (
          <CcrTableSkeleton />
        ) : (
          <div
            className="ccr-table-container"
            role="grid"
            aria-label="Parameter Data Entry Table"
          >
            {/* Scrollable Table Content */}
            <div className="ccr-table-wrapper" ref={tableWrapperRef}>
              <table className="ccr-table" role="grid">
                <colgroup>
                  <col style={{ width: "90px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "200px" }} />
                  {filteredParameterSettings.map((_, index) => (
                    <col key={index} style={{ width: "160px" }} />
                  ))}
                </colgroup>
                <thead
                  className="bg-slate-50 text-center sticky top-0 z-20"
                  role="rowgroup"
                >
                  <tr className="border-b" role="row">
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-0 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: "90px" }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.hour}
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-24 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: "140px" }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.shift}
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-56 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: "200px" }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.name}
                    </th>
                    {filteredParameterSettings.map((param, index) => (
                      <th
                        key={param.id}
                        className="px-2 py-3 text-xs font-semibold text-slate-600 border-r text-center"
                        style={{ width: "160px", minWidth: "160px" }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[11px] leading-tight uppercase tracking-wider">
                            {param.parameter}
                          </div>
                          <div className="font-normal normal-case text-[10px] text-slate-500 mt-1">
                            ({param.unit})
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white" role="rowgroup">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (filteredParameterSettings.length > 0
                            ? filteredParameterSettings.length
                            : 0)
                        }
                        className="text-center py-10 text-slate-500 animate-pulse"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredParameterSettings.length > 0 ? (
                    Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                      <tr
                        key={hour}
                        className={`border-b group ${
                          hour % 2 === 0 ? "bg-slate-25" : "bg-white"
                        } hover:bg-slate-100 transition-colors duration-200`}
                        role="row"
                      >
                        <td
                          className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white group-hover:bg-slate-100 z-30 sticky-col"
                          style={{ width: "90px" }}
                          role="gridcell"
                        >
                          <div className="flex items-center justify-center h-8">
                            {String(hour).padStart(2, "0")}:00
                          </div>
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 border-r sticky left-24 bg-white group-hover:bg-slate-100 z-30 sticky-col"
                          style={{ width: "140px" }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            {getShiftForHour(hour)}
                          </div>
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap text-xs text-slate-800 border-r sticky left-56 bg-white group-hover:bg-slate-100 z-30 overflow-hidden text-ellipsis sticky-col"
                          style={{ width: "200px" }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            {/* Enhanced name display with better logic */}
                            {(() => {
                              const filledParam =
                                filteredParameterSettings.find((param) => {
                                  const paramData = parameterDataMap.get(
                                    param.id
                                  );
                                  return (
                                    paramData &&
                                    paramData.hourly_values[hour] !==
                                      undefined &&
                                    paramData.hourly_values[hour] !== ""
                                  );
                                });
                              if (filledParam) {
                                const paramData = parameterDataMap.get(
                                  filledParam.id
                                );
                                return (
                                  <span
                                    className="truncate"
                                    title={
                                      (paramData as any)?.name ||
                                      currentUser.full_name
                                    }
                                  >
                                    {(paramData as any)?.name ||
                                      currentUser.full_name}
                                  </span>
                                );
                              }
                              return (
                                <span className="text-slate-400 italic">-</span>
                              );
                            })()}
                          </div>
                        </td>
                        {filteredParameterSettings.map((param, paramIndex) => {
                          const value =
                            parameterDataMap.get(param.id)?.hourly_values[
                              hour
                            ] ?? "";
                          const isCurrentlySaving =
                            savingParameterId === param.id;

                          return (
                            <td
                              key={param.id}
                              className="p-1 border-r bg-white relative"
                              style={{ width: "160px", minWidth: "160px" }}
                              role="gridcell"
                            >
                              <div className="relative">
                                <input
                                  ref={(el) => {
                                    const refKey = getInputRef(
                                      "parameter",
                                      hour - 1,
                                      paramIndex
                                    );
                                    setInputRef(refKey, el);
                                  }}
                                  type={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? "text"
                                      : "text"
                                  }
                                  value={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? formatInputValue(value)
                                      : value
                                  }
                                  onChange={(e) => {
                                    if (
                                      param.data_type ===
                                      ParameterDataType.NUMBER
                                    ) {
                                      const parsed = parseInputValue(
                                        e.target.value
                                      );
                                      handleParameterDataChange(
                                        param.id,
                                        hour,
                                        parsed !== null ? parsed.toString() : ""
                                      );
                                    } else {
                                      handleParameterDataChange(
                                        param.id,
                                        hour,
                                        e.target.value
                                      );
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Reformat numerical values on blur
                                    if (
                                      param.data_type ===
                                      ParameterDataType.NUMBER
                                    ) {
                                      const parsed = parseInputValue(
                                        e.target.value
                                      );
                                      if (parsed !== null) {
                                        e.target.value =
                                          formatInputValue(parsed);
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) =>
                                    handleKeyDown(
                                      e,
                                      "parameter",
                                      hour - 1,
                                      paramIndex
                                    )
                                  }
                                  disabled={isCurrentlySaving}
                                  className={`w-full text-center text-sm px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200 ${
                                    isCurrentlySaving
                                      ? "opacity-50 cursor-not-allowed bg-slate-100"
                                      : ""
                                  }`}
                                  style={{
                                    fontSize: "12px",
                                    minHeight: "32px",
                                    maxWidth: "150px",
                                  }}
                                  aria-label={`Parameter ${param.parameter} jam ${hour}`}
                                  title={`Isi data parameter ${param.parameter} untuk jam ${hour}`}
                                  placeholder={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? "0,0"
                                      : "Enter text"
                                  }
                                />
                                {isCurrentlySaving && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (filteredParameterSettings.length > 0
                            ? filteredParameterSettings.length
                            : 0)
                        }
                        className="text-center py-10 text-slate-500"
                      >
                        {!selectedCategory || !selectedUnit
                          ? "Please select a plant category and unit."
                          : `No parameter master data found for the unit: ${selectedUnit}.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Separate Footer Component - Always Visible */}
            <CcrTableFooter
              filteredParameterSettings={filteredParameterSettings}
              parameterShiftFooterData={parameterShiftFooterData}
              parameterFooterData={parameterFooterData}
              formatStatValue={formatStatValue}
              t={t}
              mainTableScrollElement={tableWrapperRef.current}
            />
          </div>
        )}
      </div>

      {/* Downtime Data Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {t.downtime_data_entry_title}
          </h3>
          <button
            onClick={handleOpenAddDowntimeModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
          >
            <PlusIcon className="w-5 h-5" />
            {t.add_downtime_button}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.start_time}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.end_time}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.pic}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.problem}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-500 dark:text-slate-400 animate-pulse"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : dailyDowntimeData.length > 0 ? (
                dailyDowntimeData.map((downtime, idx) => (
                  <tr
                    key={downtime.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      idx % 2 === 0
                        ? "bg-slate-50 dark:bg-slate-700"
                        : "bg-white dark:bg-slate-800"
                    } transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-800">
                      {downtime.start_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-800">
                      {downtime.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {downtime.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {downtime.pic}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-sm whitespace-pre-wrap">
                      {downtime.problem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditDowntimeModal(downtime)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() =>
                            handleOpenDeleteModal(downtime.id, downtime.date)
                          }
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    {t.no_downtime_recorded}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDowntimeModalOpen}
        onClose={() => setDowntimeModalOpen(false)}
        title={editingDowntime ? t.edit_downtime_title : t.add_downtime_title}
      >
        <CcrDowntimeForm
          recordToEdit={editingDowntime}
          onSave={handleSaveDowntime}
          onCancel={() => setDowntimeModalOpen(false)}
          t={t}
          plantUnits={plantUnits.map((u) => u.unit)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600">
            {t.delete_confirmation_message}
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleDeleteConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_delete_button}
          </button>
          <button
            onClick={handleCloseDeleteModal}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>

      {/* Navigation Help Modal */}
      <CcrNavigationHelp
        isVisible={showNavigationHelp}
        onClose={() => setShowNavigationHelp(false)}
      />
    </div>
  );
};

export default CcrDataEntryPage;
