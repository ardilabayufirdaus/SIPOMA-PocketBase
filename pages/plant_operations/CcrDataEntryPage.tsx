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
import {
  formatNumber,
  formatNumberWithPrecision,
} from "../../utils/formatters";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { useDebouncedParameterUpdates } from "../../hooks/useDebouncedParameterUpdates";
import { useDataFiltering } from "../../hooks/useDataFiltering";
import { useFooterCalculations } from "../../hooks/useFooterCalculations";
// import * as XLSX from "xlsx";
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePermissions } from "../../utils/permissions";
import { PermissionLevel } from "../../types";
import { useCurrentUser } from "../../hooks/useCurrentUser";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

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
  const [error, setError] = useState<string | null>(null);
  const [showNavigationHelp, setShowNavigationHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");

  // New state for undo stack
  const [undoStack, setUndoStack] = useState<
    Array<{
      parameterId: string;
      hour: number;
      previousValue: string | null;
    }>
  >([]);

  // New state for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Function to show toast message for 3 seconds
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);

  // Function to check if we're in search mode
  const isSearchActive = useMemo(
    () => columnSearchQuery.trim().length > 0,
    [columnSearchQuery]
  );

  // Function to check if a parameter column should be highlighted
  const shouldHighlightColumn = useCallback(
    (param: any) => {
      if (!isSearchActive) return false;
      const searchTerm = columnSearchQuery.toLowerCase().trim();
      return (
        param.parameter.toLowerCase().includes(searchTerm) ||
        param.unit.toLowerCase().includes(searchTerm)
      );
    },
    [isSearchActive, columnSearchQuery]
  );

  // Enhanced clear search function
  const clearColumnSearch = useCallback(() => {
    setColumnSearchQuery("");
  }, []);

  // Keyboard shortcut for search (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        const searchInput = document.querySelector(
          ".ccr-column-search input"
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === "Escape" && columnSearchQuery) {
        clearColumnSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [columnSearchQuery, clearColumnSearch]);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Don't fetch data if selectedDate is not properly initialized
    if (!selectedDate || selectedDate.trim() === "") {
      return;
    }

    setLoading(true);
    getSiloDataForDate(selectedDate).then((data) => {
      setAllDailySiloData(data);
      setLoading(false);
    });
  }, [selectedDate, getSiloDataForDate]);

  // Parameter Data Hooks and Filtering
  const { records: parameterSettings } = useParameterSettings();

  // Use custom hook for data filtering
  const { filteredParameterSettings, dailySiloData, siloMasterMap } =
    useDataFiltering({
      parameterSettings,
      plantUnits,
      selectedCategory,
      selectedUnit,
      columnSearchQuery,
      allDailySiloData,
      siloMasterData,
    });

  const { getDataForDate: getParameterDataForDate, updateParameterData } =
    useCcrParameterData();
  const [dailyParameterData, setDailyParameterData] = useState<
    CcrParameterData[]
  >([]);
  useEffect(() => {
    // Don't fetch data if selectedDate is not properly initialized
    if (!selectedDate || selectedDate.trim() === "") {
      return;
    }

    setLoading(true);
    getParameterDataForDate(selectedDate).then((data) => {
      setDailyParameterData(data);
      setLoading(false);

      // Update legacy records that don't have name field
      const legacyRecords = data.filter(
        (record: any) =>
          !record.name && Object.keys(record.hourly_values).length > 0
      );
      if (legacyRecords.length > 0) {
        console.log(
          `Found ${legacyRecords.length} legacy records without name, updating...`
        );
        legacyRecords.forEach((record: any) => {
          supabase
            .from("ccr_parameter_data")
            .update({ name: loggedInUser?.full_name || currentUser.full_name })
            .eq("id", record.id)
            .then(() => {
              console.log(
                `Updated legacy record ${record.id} with name: ${
                  loggedInUser?.full_name || currentUser.full_name
                }`
              );
            })
            .catch((error: any) => {
              console.error("Error updating legacy record:", error);
            });
        });
      }
    });
  }, [
    selectedDate,
    getParameterDataForDate,
    loggedInUser?.full_name,
    currentUser.full_name,
  ]);

  const parameterDataMap = useMemo(
    () => new Map(dailyParameterData.map((p) => [p.parameter_id, p])),
    [dailyParameterData]
  );

  // Use custom hook for footer calculations
  const { parameterFooterData, parameterShiftFooterData } =
    useFooterCalculations({
      filteredParameterSettings,
      parameterDataMap,
    });

  // Table dimension functions for keyboard navigation
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

  // Input ref management function
  const getInputRef = useCallback(
    (table: "silo" | "parameter", row: number, col: number) => {
      return `${table}-${row}-${col}`;
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

  // Use custom hook for keyboard navigation
  const { setInputRef, handleKeyDown } = useKeyboardNavigation({
    getSiloTableDimensions,
    getParameterTableDimensions,
    focusCell,
  });

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

  const formatStatValue = (value: number | undefined, precision = 1) => {
    if (value === undefined || value === null) return "-";
    return formatNumber(value);
  };

  // Helper function to determine precision based on unit
  const getPrecisionForUnit = (unit: string): number => {
    if (!unit) return 1;

    // Units that typically need 2 decimal places
    const highPrecisionUnits = [
      "bar",
      "psi",
      "kPa",
      "MPa",
      "m³/h",
      "kg/h",
      "t/h",
      "L/h",
      "mL/h",
    ];
    // Units that typically need 1 decimal place
    const mediumPrecisionUnits = [
      "°C",
      "°F",
      "°K",
      "%",
      "kg",
      "ton",
      "m³",
      "L",
      "mL",
    ];
    // Units that typically need 0 decimal places (whole numbers)
    const lowPrecisionUnits = ["unit", "pcs", "buah", "batch", "shift"];

    const lowerUnit = unit.toLowerCase();

    if (highPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
      return 2;
    }
    if (mediumPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
      return 1;
    }
    if (lowPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
      return 0;
    }

    // Default to 1 decimal place for unknown units
    return 1;
  };

  // Helper functions for input value formatting
  const formatInputValue = (
    value: number | string | null | undefined,
    precision: number = 1
  ): string => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return formatNumberWithPrecision(numValue, precision);
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

  // Use custom hook for debounced parameter updates
  const {
    savingParameterId: debouncedSavingParameterId,
    error: debouncedError,
    updateParameterDataDebounced,
    cleanup: cleanupDebouncedUpdates,
  } = useDebouncedParameterUpdates({
    selectedDate,
    updateParameterData,
    getParameterDataForDate,
    currentUserName: loggedInUser?.full_name || currentUser.full_name,
    onSuccess: (parameterId, hour) => {
      showToast(`Data parameter ${parameterId} jam ${hour} berhasil disimpan.`);
    },
    onError: (parameterId, errorMessage) => {
      setError(errorMessage);
    },
  });

  // Alias for saving parameter ID
  const savingParameterId = debouncedSavingParameterId;

  // Enhanced cleanup for inputRefs, debounced updates, and custom hooks
  useEffect(() => {
    return () => {
      // Clear all debounced timers from custom hook
      cleanupDebouncedUpdates();

      // Clear input refs
      inputRefs.current.clear();
    };
  }, [selectedDate, selectedCategory, selectedUnit, cleanupDebouncedUpdates]);

  // Wrapper function for parameter data changes with optimistic updates
  const handleParameterDataChange = useCallback(
    (parameterId: string, hour: number, value: string) => {
      // Optimistic update for UI
      setDailyParameterData((prev) => {
        const idx = prev.findIndex((p) => p.parameter_id === parameterId);
        if (idx === -1) return prev;

        const param = prev[idx];
        const newHourlyValues = { ...param.hourly_values };

        const previousValue = newHourlyValues[hour] ?? null;

        if (value === "" || value === null) {
          delete newHourlyValues[hour];
        } else {
          newHourlyValues[hour] = value;
        }

        // Push to undo stack
        setUndoStack((stack) => [
          ...stack,
          { parameterId, hour, previousValue: String(previousValue) },
        ]);

        const updatedParam = { ...param, hourly_values: newHourlyValues };
        const newArr = [...prev];
        newArr[idx] = updatedParam;
        return newArr;
      });

      // Debounced database update
      updateParameterDataDebounced(parameterId, hour, value);
    },
    [updateParameterDataDebounced]
  );

  const handleOpenAddDowntimeModal = () => {
    setEditingDowntime(null);
    setDowntimeModalOpen(true);
  };

  const handleOpenEditDowntimeModal = (record: CcrDowntimeData) => {
    setEditingDowntime(record);
    setDowntimeModalOpen(true);
  };

  const handleSaveDowntime = async (
    record: CcrDowntimeData | Omit<CcrDowntimeData, "id" | "date">
  ) => {
    try {
      let result;
      if ("id" in record) {
        result = await updateDowntime(record);
      } else {
        result = await addDowntime({ ...record, date: selectedDate });
      }

      if (result && !result.success) {
        alert(`Error saving downtime: ${result.error}`);
        return;
      }

      setDowntimeModalOpen(false);
      setEditingDowntime(null);
    } catch (error) {
      console.error("Error in handleSaveDowntime:", error);
      alert("Failed to save downtime data. Please try again.");
    }
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

  // Export to Excel functionality
  const handleExport = async () => {
    if (isExporting) return;

    if (
      !selectedCategory ||
      !selectedUnit ||
      filteredParameterSettings.length === 0
    ) {
      alert(
        "Please select a plant category and unit with available parameters before exporting."
      );
      return;
    }

    setIsExporting(true);
    try {
      // Helper function to sanitize names for Excel compatibility
      const sanitizeName = (name: string) =>
        name.replace(/[:\\/\?\*\[\]]/g, "_");

      // Prepare data for export
      const exportData = [];

      // Add metadata rows
      exportData.push({
        Hour: "Date:",
        ...Object.fromEntries(
          filteredParameterSettings.map((param) => [
            param.parameter,
            selectedDate,
          ])
        ),
      });
      exportData.push({
        Hour: "Category:",
        ...Object.fromEntries(
          filteredParameterSettings.map((param) => [
            param.parameter,
            selectedCategory,
          ])
        ),
      });
      exportData.push({
        Hour: "Unit:",
        ...Object.fromEntries(
          filteredParameterSettings.map((param) => [
            param.parameter,
            selectedUnit,
          ])
        ),
      });
      exportData.push({}); // Empty row

      // Add header row with parameter names and units
      const headerRow: any = { Hour: "Hour" };
      filteredParameterSettings.forEach((param) => {
        headerRow[param.parameter] = `${param.parameter} (${param.unit})`;
      });
      exportData.push(headerRow);

      // Add hourly data rows
      for (let hour = 1; hour <= 24; hour++) {
        const row: any = { Hour: hour };
        filteredParameterSettings.forEach((param) => {
          const data = parameterDataMap.get(param.id);
          const value = data?.hourly_values[hour] ?? "";
          // Convert numerical values to display format if needed
          if (param.data_type === ParameterDataType.NUMBER && value !== "") {
            const numValue = parseFloat(String(value));
            row[param.parameter] = !isNaN(numValue)
              ? formatNumber(numValue)
              : value;
          } else {
            row[param.parameter] = value;
          }
        });
        exportData.push(row);
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = [
        { wch: 8 }, // Hour column
        ...filteredParameterSettings.map(() => ({ wch: 15 })), // Parameter columns
      ];
      worksheet["!cols"] = colWidths;

      // Add the worksheet to workbook
      const sheetName = `CCR_${sanitizeName(selectedCategory)}_${sanitizeName(
        selectedUnit
      )}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with sanitized names
      const filename = `CCR_Parameter_Data_${sanitizeName(
        selectedCategory
      )}_${sanitizeName(selectedUnit)}_${selectedDate}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Error exporting CCR parameter data:", error);
      alert("An error occurred while exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Import from Excel functionality
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCategory || !selectedUnit) {
      alert("Please select a plant category and unit before importing.");
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) {
        setIsImporting(false);
        return;
      }

      try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Validate metadata if present
        let metadataValidation = { valid: true, messages: [] as string[] };

        // Check for metadata rows (Date, Category, Unit)
        if (json.length >= 3) {
          const dateRow = json[0];
          const categoryRow = json[1];
          const unitRow = json[2];

          const firstKey = Object.keys(dateRow)[0];

          // Validate date
          if (dateRow[firstKey] === "Date:") {
            const fileDate = Object.values(dateRow)[1];
            if (fileDate && fileDate !== selectedDate) {
              metadataValidation.messages.push(
                `⚠️ Date mismatch: File contains data for ${fileDate}, but ${selectedDate} is selected`
              );
            }
          }

          // Validate category
          if (categoryRow[firstKey] === "Category:") {
            const fileCategory = Object.values(categoryRow)[1];
            if (fileCategory && fileCategory !== selectedCategory) {
              metadataValidation.messages.push(
                `⚠️ Category mismatch: File contains ${fileCategory}, but ${selectedCategory} is selected`
              );
            }
          }

          // Validate unit
          if (unitRow[firstKey] === "Unit:") {
            const fileUnit = Object.values(unitRow)[1];
            if (fileUnit && fileUnit !== selectedUnit) {
              metadataValidation.messages.push(
                `⚠️ Unit mismatch: File contains ${fileUnit}, but ${selectedUnit} is selected`
              );
            }
          }
        }

        // Show metadata validation warnings
        if (metadataValidation.messages.length > 0) {
          const continueImport = confirm(
            "Metadata validation warnings:\n\n" +
              metadataValidation.messages.join("\n") +
              "\n\nDo you want to continue with the import?"
          );

          if (!continueImport) {
            setIsImporting(false);
            return;
          }
        }

        // Find the header row (contains "Hour" in first column)
        let headerRowIndex = -1;
        for (let i = 0; i < json.length; i++) {
          const keys = Object.keys(json[i]);
          if (
            keys.length > 0 &&
            (json[i][keys[0]] === "Hour" || keys[0] === "Hour")
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          alert(
            "Could not find header row with 'Hour' column in the Excel file."
          );
          return;
        }

        // Get column mapping
        const headerRow = json[headerRowIndex];
        const hourColumn = Object.keys(headerRow)[0];

        // Process data rows (after header)
        const dataRows = json.slice(headerRowIndex + 1);
        let successCount = 0;
        let errorCount = 0;
        const processingLog: string[] = [];
        const warningCounts = new Map<string, number>();

        // Batch all updates to reduce database calls
        const updateBatch: Array<{
          parameterId: string;
          hour: number;
          value: any;
          paramName: string;
        }> = [];

        console.log(`Processing ${dataRows.length} data rows...`);
        if (import.meta.env.DEV) {
          console.log(
            `Available parameters:`,
            filteredParameterSettings.map((p) => p.parameter)
          );
          console.log("Selected Category:", selectedCategory);
          console.log("Selected Unit:", selectedUnit);
        }

        for (const row of dataRows) {
          const hour = parseInt(String(row[hourColumn]));

          // Skip invalid hours
          if (isNaN(hour) || hour < 1 || hour > 24) {
            if (row[hourColumn] !== undefined && row[hourColumn] !== "") {
              processingLog.push(`Skipped invalid hour: ${row[hourColumn]}`);
            }
            continue;
          }

          // Process each parameter column
          for (const [columnName, value] of Object.entries(row)) {
            if (columnName === hourColumn) continue; // Skip hour column

            // Find matching parameter by name (remove unit part if present)
            // Handle both "Parameter Name (Unit)" and "Parameter Name" formats
            const paramName = columnName.replace(/\s*\([^)]*\)\s*$/, "").trim();

            // First try exact match (case insensitive)
            let matchingParam = filteredParameterSettings.find(
              (param) =>
                param.parameter.toLowerCase() === paramName.toLowerCase()
            );

            // If no exact match, try matching parameter name without unit part
            if (!matchingParam) {
              matchingParam = filteredParameterSettings.find((param) => {
                const dbParamName = param.parameter
                  .replace(/\s*\([^)]*\)\s*$/, "")
                  .trim();
                return dbParamName.toLowerCase() === paramName.toLowerCase();
              });
            }

            // If still no match, try fuzzy matching (remove spaces, special chars)
            if (!matchingParam) {
              const normalizeString = (str: string) =>
                str
                  .toLowerCase()
                  .replace(/\s+/g, "")
                  .replace(/[^a-z0-9]/g, "");

              const normalizedParamName = normalizeString(paramName);
              matchingParam = filteredParameterSettings.find((param) => {
                const dbParamName = param.parameter
                  .replace(/\s*\([^)]*\)\s*$/, "")
                  .trim();
                return normalizeString(dbParamName) === normalizedParamName;
              });
            }

            if (
              matchingParam &&
              value !== undefined &&
              value !== "" &&
              value !== null
            ) {
              try {
                // Parse value based on data type
                let parsedValue: string | number = String(value);

                if (matchingParam.data_type === ParameterDataType.NUMBER) {
                  // Robust parsing for Indonesian/Export format
                  let numStr = String(value).trim();
                  // Remove spaces and non-numeric except comma, dot, minus, plus
                  numStr = numStr.replace(/\s+/g, "").replace(/[^\d.,+-]/g, "");

                  // If both dot and comma exist
                  if (numStr.includes(",") && numStr.includes(".")) {
                    // Format like "1.234,56" (Indo) - dots are thousands, comma is decimal
                    if (numStr.lastIndexOf(",") > numStr.lastIndexOf(".")) {
                      numStr = numStr.replace(/\./g, "").replace(",", ".");
                    } else {
                      // Format like "1,234.56" (US) - commas are thousands, dot is decimal
                      numStr = numStr.replace(/,/g, "");
                    }
                  } else if (numStr.includes(",")) {
                    // Only comma - could be thousands separator or decimal
                    const commaIndex = numStr.indexOf(",");
                    const afterComma = numStr.substring(commaIndex + 1);
                    // If 3 digits after comma, it's likely thousands separator
                    if (afterComma.length === 3 && !afterComma.includes(",")) {
                      numStr = numStr.replace(",", "");
                    } else {
                      // Treat as decimal separator
                      numStr = numStr.replace(",", ".");
                    }
                  } else if (numStr.includes(".")) {
                    // Only dot, treat as decimal
                    // But if 3 digits after dot, treat as thousands separator
                    const dotIndex = numStr.indexOf(".");
                    const afterDot = numStr.substring(dotIndex + 1);
                    if (afterDot.length === 3 && !afterDot.includes(".")) {
                      numStr = numStr.replace(/\./g, "");
                    }
                  }

                  const numValue = parseFloat(numStr);
                  if (!isNaN(numValue)) {
                    parsedValue = numValue;
                  } else {
                    warningCounts.set(
                      "invalidNumbers",
                      (warningCounts.get("invalidNumbers") || 0) + 1
                    );
                    if (
                      !import.meta.env.DEV ||
                      warningCounts.get("invalidNumbers") <= 3
                    ) {
                      console.warn(
                        `Could not parse number value: "${value}" for parameter ${matchingParam.parameter}`
                      );
                    }
                    continue; // Skip invalid numbers
                  }
                }

                // Add to batch instead of immediate database update
                updateBatch.push({
                  parameterId: matchingParam.id,
                  hour,
                  value: parsedValue,
                  paramName: matchingParam.parameter,
                });
              } catch (error) {
                console.error(
                  `Error processing parameter ${matchingParam.parameter} hour ${hour}:`,
                  error
                );
                errorCount++;
              }
            } else if (value !== undefined && value !== "" && value !== null) {
              // Parameter not found but has value - count warnings instead of logging each one
              const warningKey = `Parameter "${paramName}" not found`;
              warningCounts.set(
                warningKey,
                (warningCounts.get(warningKey) || 0) + 1
              );
            }
          }
        }

        // Process all updates in batches to improve performance
        console.log(`Processing ${updateBatch.length} parameter updates...`);

        for (const update of updateBatch) {
          try {
            await updateParameterData(
              selectedDate,
              update.parameterId,
              currentUser.full_name,
              loggedInUser?.full_name || currentUser.full_name
            );
            successCount++;
          } catch (error) {
            console.error(
              `Error updating parameter ${update.paramName} hour ${update.hour}:`,
              error
            );
            errorCount++;
          }
        }

        // Combine warning counts into processingLog
        const notFoundParameters = new Set<string>();
        warningCounts.forEach((count, warning) => {
          if (warning.includes("not found")) {
            const paramName = warning.match(/"([^"]+)"/)?.[1];
            if (paramName) notFoundParameters.add(paramName);
          }
          processingLog.push(`${warning} (${count} occurrences)`);
        });

        // Add parameter suggestions for not found parameters
        if (notFoundParameters.size > 0 && import.meta.env.DEV) {
          console.log("Parameters not found:", Array.from(notFoundParameters));
          console.log(
            "Suggestion: Check if these parameters exist in Parameter Settings for:"
          );
          console.log(`Category: ${selectedCategory}, Unit: ${selectedUnit}`);
          console.log(
            "Available parameters:",
            filteredParameterSettings.map((p) => `"${p.parameter}"`)
          );
        }

        // Show result with more detailed information
        if (import.meta.env.DEV) {
          console.log(`Import processing log:`, processingLog.slice(0, 10));
        }

        if (successCount > 0 || errorCount > 0) {
          console.log(
            `Import completed: ${successCount} values imported, ${errorCount} errors`
          );

          let alertMessage = `Import completed!\n\n✅ Successfully imported: ${successCount} values`;

          if (errorCount > 0) {
            alertMessage += `\n❌ Errors: ${errorCount} values`;
          }

          if (processingLog.length > 0) {
            alertMessage += `\n\n📋 Processing details:\n${processingLog
              .slice(0, 10)
              .join("\n")}`;
            if (processingLog.length > 10) {
              alertMessage += `\n... and ${
                processingLog.length - 10
              } more (check console for full log)`;
            }
          }

          alertMessage += `\n\nPlease review the data and save changes.`;

          alert(alertMessage);

          // Refresh data after import
          try {
            const updatedData = await getParameterDataForDate(selectedDate);
            setDailyParameterData(updatedData);
          } catch (error) {
            console.error("Error refreshing data after import:", error);
          }
        } else {
          alert(
            "No valid data found to import.\n\n" +
              "Please ensure:\n" +
              "• The Excel file has the correct format\n" +
              "• Parameter names match exactly\n" +
              "• Hour values are between 1-24\n" +
              "• Data cells are not empty"
          );
        }
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert(
          "Error processing Excel file. Please check the file format and try again."
        );
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return `${t.shift_3} (${t.shift_3_cont})`;
    if (h >= 8 && h <= 15) return t.shift_1;
    if (h >= 16 && h <= 22) return t.shift_2;
    return t.shift_3;
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Error Display */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t.op_ccr_data_entry}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Kelola data CCR untuk monitoring performa pabrik
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
              <div className="flex items-start">
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
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </p>
                  <EnhancedButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setError(null)}
                    className="mt-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline font-medium"
                    aria-label="Tutup pesan error"
                  >
                    Tutup
                  </EnhancedButton>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="ccr-category"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                {t.plant_category_label}:
              </label>
              <select
                id="ccr-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                <option value="">Pilih Kategori</option>
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="ccr-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                {t.unit_label}:
              </label>
              <select
                id="ccr-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <option value="">Pilih Unit</option>
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="ccr-date"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                {t.select_date}:
              </label>
              <input
                type="date"
                id="ccr-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Silo Data Table */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
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
                  className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r align-middle"
                >
                  {t.silo_name}
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
                >
                  {t.shift_1}
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-b"
                >
                  {t.shift_2}
                </th>
                <th
                  colSpan={3}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b"
                >
                  {t.shift_3}
                </th>
              </tr>
              <tr>
                {[...Array(3)].flatMap((_, i) => [
                  <th
                    key={`es-${i}`}
                    className="px-2 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                  >
                    {t.empty_space}
                  </th>,
                  <th
                    key={`c-${i}`}
                    className="px-2 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border-r"
                  >
                    {t.content}
                  </th>,
                  <th
                    key={`p-${i}`}
                    className={`px-2 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
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
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white z-10">
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
                                defaultValue={formatInputValue(
                                  siloData[shift]?.emptySpace,
                                  1
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
                                    e.target.value = formatInputValue(
                                      parsed,
                                      1
                                    );
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
                                defaultValue={formatInputValue(content, 1)}
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
                                    e.target.value = formatInputValue(
                                      parsed,
                                      1
                                    );
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
                    className="text-center py-6 text-slate-500 dark:text-slate-400"
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
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.ccr_parameter_data_entry_title}
          </h3>

          {/* Enhanced Table Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Use ↑↓←→ or Tab to navigate</span>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span>Press Esc to exit navigation</span>
            </div>

            {/* Export/Import Controls */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <EnhancedButton
                variant="outline"
                size="xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={
                  isImporting ||
                  !selectedCategory ||
                  !selectedUnit ||
                  !permissionChecker.hasPermission(
                    "plant_operations",
                    PermissionLevel.WRITE
                  )
                }
                loading={isImporting}
                aria-label={t.import_excel || "Import Excel file"}
              >
                <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                {isImporting ? "Importing..." : t.import_excel}
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                size="xs"
                onClick={handleExport}
                disabled={
                  isExporting ||
                  !selectedCategory ||
                  !selectedUnit ||
                  filteredParameterSettings.length === 0 ||
                  !permissionChecker.hasPermission(
                    "plant_operations",
                    PermissionLevel.READ
                  )
                }
                loading={isExporting}
                aria-label={t.export_excel || "Export to Excel"}
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                {isExporting ? "Exporting..." : t.export_excel}
              </EnhancedButton>
            </div>

            <EnhancedButton
              variant="primary"
              size="xs"
              onClick={() => setShowNavigationHelp(true)}
              aria-label="Show navigation help"
            >
              ? Help
            </EnhancedButton>
          </div>
        </div>

        {/* Column Search Filter */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.ccr_search_columns}:
            </span>
            <div className="relative ccr-column-search">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 ccr-column-search-icon" />
              <input
                type="text"
                value={columnSearchQuery}
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                placeholder={t.ccr_search_placeholder}
                className="pl-10 pr-12 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400 transition-all duration-200"
                style={{ width: "320px" }}
                autoComplete="off"
                title="Search columns by parameter name or unit. Use Ctrl+F to focus, Escape to clear."
              />
              {columnSearchQuery && (
                <EnhancedButton
                  variant="ghost"
                  size="xs"
                  onClick={clearColumnSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-label={t.ccr_clear_search || "Clear search"}
                >
                  <XMarkIcon className="w-4 h-4" />
                </EnhancedButton>
              )}
              <div className="absolute right-2 top-full mt-1 text-xs text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Ctrl+F to focus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSearchActive && (
              <div className="ccr-search-results-indicator">
                {filteredParameterSettings.length}{" "}
                {filteredParameterSettings.length === 1
                  ? t.ccr_search_results
                  : t.ccr_search_results_plural}
              </div>
            )}
            {isSearchActive && filteredParameterSettings.length === 0 && (
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {t.ccr_no_columns_match}
              </div>
            )}
            {isSearchActive && (
              <EnhancedButton
                variant="ghost"
                size="xs"
                onClick={clearColumnSearch}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                aria-label="Clear column search filter"
              >
                Clear Filter
              </EnhancedButton>
            )}
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
                      className="px-2 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-0 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: "90px" }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.hour}
                    </th>
                    <th
                      className="px-2 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-24 bg-slate-50 z-30 sticky-col-header"
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
                        className={`px-2 py-3 text-xs font-semibold text-slate-600 border-r text-center ${
                          shouldHighlightColumn(param) ? "filtered-column" : ""
                        }`}
                        style={{ width: "160px", minWidth: "160px" }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[11px] leading-tight uppercase tracking-wider">
                            {param.parameter}
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
                                      loggedInUser?.full_name ||
                                      currentUser.full_name
                                    }
                                  >
                                    {(paramData as any)?.name ||
                                      loggedInUser?.full_name ||
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
                              className={`p-1 border-r bg-white relative ${
                                shouldHighlightColumn(param)
                                  ? "filtered-column"
                                  : ""
                              }`}
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
                                  defaultValue={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? formatInputValue(
                                          value,
                                          getPrecisionForUnit(param.unit)
                                        )
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
                                        e.target.value = formatInputValue(
                                          parsed,
                                          getPrecisionForUnit(param.unit)
                                        );
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
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.downtime_data_entry_title}
          </h3>
          <EnhancedButton
            variant="primary"
            size="sm"
            onClick={handleOpenAddDowntimeModal}
            disabled={
              !permissionChecker.hasPermission(
                "plant_operations",
                PermissionLevel.WRITE
              )
            }
            aria-label={t.add_downtime_button || "Add new downtime"}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {t.add_downtime_button}
          </EnhancedButton>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.start_time}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.end_time}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.pic}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.problem}
                </th>
                <th className="relative px-4 py-2">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-800">
                      {downtime.start_time}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-800">
                      {downtime.end_time}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {downtime.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {downtime.pic}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-sm whitespace-pre-wrap">
                      {downtime.problem}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditDowntimeModal(downtime)}
                          aria-label={`Edit downtime for ${downtime.unit}`}
                        >
                          <EditIcon />
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            handleOpenDeleteModal(downtime.id, downtime.date)
                          }
                          aria-label={`Delete downtime for ${downtime.unit}`}
                        >
                          <TrashIcon />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
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
        <div className="bg-slate-50 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg">
          <EnhancedButton
            variant="error"
            onClick={handleDeleteConfirm}
            className="sm:ml-3 sm:w-auto"
            aria-label={t.confirm_delete_button || "Confirm delete"}
          >
            {t.confirm_delete_button}
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            onClick={handleCloseDeleteModal}
            className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto"
            aria-label={t.cancel_button || "Cancel"}
          >
            {t.cancel_button}
          </EnhancedButton>
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
