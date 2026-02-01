/// <reference types="node" />

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ExcelJS, { CellValue } from 'exceljs';
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { logger } from '../../utils/logger';
import { useRkcSiloCapacities as useSiloCapacities } from '../../hooks/useRkcSiloCapacities';
import { useRkcCcrSiloData as useCcrSiloData } from '../../hooks/useRkcCcrSiloData';
import { useRkcParameterSettings as useParameterSettings } from '../../hooks/useRkcParameterSettings';
// Menggunakan hook yang sudah diperbaiki dengan mengikuti pola yang sama dengan Silo Data
import {
  useRkcCcrParameterDataFlat as useCcrParameterDataFlat,
  CcrParameterDataFlat,
} from '../../hooks/useRkcCcrParameterDataFlat';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';
import useCcrDowntimeData from '../../hooks/useRkcCcrDowntimeData';
import { useUsers } from '../../hooks/useUsers';
import {
  ParameterDataType,
  CcrDowntimeData,
  CcrSiloData,
  ParameterSetting,
  DowntimeStatus,
} from '../../types';
import { ParameterProfile } from '../../types/Profile';
import { useRkcPlantUnits as usePlantUnits } from '../../hooks/useRkcPlantUnits';
import Modal from '../../components/Modal';
import CcrDowntimeForm from './CcrDowntimeForm';
import MaterialUsageEntry from './components/MaterialUsageEntry';
import CcrTableFooter from '../../components/ccr/CcrTableFooter';
import CcrTableSkeleton from '../../components/ccr/CcrTableSkeleton';
import CcrNavigationHelp from '../../components/ccr/CcrNavigationHelp';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import {
  formatNumber,
  formatNumberWithPrecision,
  formatNumberIndonesian,
} from '../../utils/formatters';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFooterCalculations } from '../../hooks/useFooterCalculations';
import { useRkcCcrFooterData as useCcrFooterData } from '../../hooks/useRkcCcrFooterData';
import { useRkcCcrInformationData as useCcrInformationData } from '../../hooks/useRkcCcrInformationData';
import { useRkcCcrMaterialUsage as useCcrMaterialUsage } from '../../hooks/useRkcCcrMaterialUsage';
import { usePermissions } from '../../utils/permissions';
import { isSuperAdmin } from '../../utils/roleHelpers';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import PocketBase client and hooks
import { pb } from '../../utils/pocketbase-simple';
import { useRkcUserParameterOrder as useUserParameterOrder } from '../../hooks/useRkcUserParameterOrder';
import { formatDateToISO8601, formatToWITA, formatDate } from '../../utils/dateUtils';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  useAccessibility,
} from '../../components/ui/EnhancedComponents';
import { ShiftHandoverButton } from '@features/ai-advisor/presentation/components/ShiftHandoverButton';
import { OptimizationAdvisorButton } from '@features/ai-advisor/presentation/components/OptimizationAdvisorButton';

// Import UI Components
import { Button } from '../../components/ui';
import { RcaAnalysisButton } from '@features/ai-advisor/presentation/components/RcaAnalysisButton';

const RkcCcrDataEntryPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNavigationHelp, setShowNavigationHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingAllNames, setIsDeletingAllNames] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [materialUsageRefreshTrigger, setMaterialUsageRefreshTrigger] = useState(0);

  // Parameter reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [modalParameterOrder, setModalParameterOrder] = useState<ParameterSetting[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [, setOriginalParameterOrder] = useState<ParameterSetting[]>([]);

  // Profile state
  const [profiles, setProfiles] = useState<ParameterProfile[]>([]);
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [showLoadProfileModal, setShowLoadProfileModal] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ParameterProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [, setSelectedProfile] = useState<ParameterProfile | null>(null);

  // New state for undo stack
  const [, setUndoStack] = useState<
    Array<{
      parameterId: string;
      hour: number;
      previousValue: string | null;
    }>
  >([]);

  // New state for toast notifications
  const [, setToastMessage] = useState<string | null>(null);

  // Function to show toast message for 3 seconds
  // Function to show toast message for 3 seconds
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);
  const { canWrite } = usePlantOperationsAccess();
  const hasPermission = (
    feature: Parameters<typeof permissionChecker.hasPermission>[0],
    level?: Parameters<typeof permissionChecker.hasPermission>[1]
  ) => permissionChecker.hasPermission(feature, level);
  useEffect(() => {
    // Debug: log role user setiap render
  }, [loggedInUser]);

  // Function to check if we're in search mode
  const isSearchActive = useMemo(() => columnSearchQuery.trim().length > 0, [columnSearchQuery]);

  // Function to check if a parameter column should be highlighted
  const shouldHighlightColumn = useCallback(
    (param: ParameterSetting) => {
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
    setColumnSearchQuery('');
  }, []);

  // Keyboard shortcut for search (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.ccr-column-search input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === 'Escape' && columnSearchQuery) {
        clearColumnSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [columnSearchQuery, clearColumnSearch]);

  // Enhanced keyboard navigation state
  const [, setFocusedCell] = useState<{
    table: 'silo' | 'parameter';
    row: number;
    col: number;
  } | null>(null);

  // Improved inputRefs management with cleanup
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());

  // Ref for main table wrapper to sync scroll with footer
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref to prevent concurrent footer data saves
  const footerSaveInProgress = useRef(false);

  const { users } = useUsers();
  // Memoize currentUser to prevent unnecessary re-renders
  const currentUser = useMemo(() => users[0] || { full_name: 'Operator' }, [users]);

  // Filter state and options from Plant Units master data
  const { records: plantUnits } = usePlantUnits();
  // DEBUG: Log user permissions state
  useEffect(() => {
    // Debug logs removed for cleaner console output
  }, [loggedInUser, plantUnits]);

  const plantCategories = useMemo(() => {
    // DEBUG: Remove permission check temporarily
    const allowedCategories = plantUnits
      //.filter((unit) =>
      //  permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      //)
      .map((unit) => unit.category);

    // Remove duplicates and sort
    const categories = [...new Set(allowedCategories)].sort();
    // Debug log removed for cleaner console output
    return categories;
  }, [plantUnits]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Use PocketBase hook for parameter order management
  const { parameterOrder: pbParameterOrder, setParameterOrder: setPbParameterOrder } =
    useUserParameterOrder({
      module: 'plant_operations',
      parameterType: 'ccr_parameters',
      category: selectedCategory,
      unit: selectedUnit,
    });

  // Save parameter order using PocketBase hook
  const saveParameterOrder = useCallback(
    async (newOrder: string[]) => {
      if (!loggedInUser?.id || !selectedCategory || !selectedUnit || newOrder.length === 0) {
        return;
      }

      try {
        await setPbParameterOrder(newOrder);
      } catch {
        // Silent failure for parameter order saving
      }
    },
    [loggedInUser?.id, selectedCategory, selectedUnit, setPbParameterOrder]
  );

  // Hapus auto-select: biarkan user memilih kategori secara manual

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    try {
      // Use filter syntax with spaces between operator and values (confirmed working)
      // Note: No specific sort is used as the 'created' field doesn't exist in the schema
      const records = await pb.collection('rkc_parameter_order_profiles').getFullList({
        filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
      });

      // Only update state if the component is still mounted (prevent memory leaks)
      // Konversi records ke format ParameterProfile
      setProfiles(
        records.map((record) => ({
          id: record.id,
          name: record.name || 'Unnamed Profile',
          user_id: record.user_id || '',
          unit: record.unit || '',
          parameter_order: record.parameter_order || [],
          is_default: record.is_default || false,
          created_at: record.created || '',
          updated_at: record.updated || '',
        }))
      );
    } catch (err) {
      if ((err as any)?.response?.status === 404) {
        setProfiles([]);
        return;
      }
      // Ignore auto-cancellation errors, they're normal during component unmounting
      if (err instanceof Error && err.message?.includes('autocancelled')) {
        return;
      }
      showToast(t.failed_to_fetch_profiles);
      setProfiles([]);
    }
  }, [t.failed_to_fetch_profiles, showToast]);

  // Save profile
  const saveProfile = useCallback(async () => {
    if (!loggedInUser?.id || !profileName.trim() || modalParameterOrder.length === 0) {
      return;
    }

    try {
      await pb.collection('rkc_parameter_order_profiles').create({
        name: profileName.trim(),
        description: profileDescription.trim() || null,
        user_id: loggedInUser.id,
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        category: selectedCategory,
        unit: selectedUnit,
        parameter_order: modalParameterOrder.map((p) => p.id),
      });

      showToast(t.profile_saved_successfully);
      setShowSaveProfileModal(false);
      setProfileName('');
      setProfileDescription('');
      fetchProfiles();
    } catch {
      showToast(t.failed_to_save_profile);
      showToast(t.failed_to_save_profile);
    }
  }, [
    loggedInUser?.id,
    profileName,
    profileDescription,
    modalParameterOrder,
    selectedCategory,
    selectedUnit,
    fetchProfiles,
    showToast,
    t.profile_saved_successfully,
    t.failed_to_save_profile,
  ]);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const unitsForCategory = useMemo(() => {
    if (!selectedCategory) return [];

    // DEBUG: Remove permission check temporarily
    const units = plantUnits
      .filter(
        (unit) => unit.category === selectedCategory
        // Bypass permission check for debugging
      )
      .map((unit) => unit.unit)
      .sort();

    // Debug log removed for cleaner console output
    return units;
  }, [plantUnits, selectedCategory]);

  // Hapus auto-select: biarkan user memilih unit secara manual

  // Silo Data Hooks and Filtering
  const { records: siloMasterData } = useSiloCapacities();
  const { getDataForDate: getSiloDataForDate, updateSiloData, deleteSiloData } = useCcrSiloData();
  const [allDailySiloData, setAllDailySiloData] = useState<CcrSiloData[]>([]);
  // State untuk menyimpan perubahan silo yang belum tersimpan
  const [unsavedSiloChanges, setUnsavedSiloChanges] = useState<
    Record<
      string,
      { shift: 'shift1' | 'shift2' | 'shift3'; field: 'emptySpace' | 'content'; value: number }
    >
  >({});
  // Tidak digunakan, dikomentari karena menyebabkan warning
  // const [siloDataTrigger, setSiloDataTrigger] = useState(0);

  // Fungsi untuk mengambil data silo dengan penanganan data yang aman
  const fetchSiloData = useCallback(
    async (forceRefresh = false) => {
      if (!selectedDate || selectedDate.trim() === '' || !selectedUnit) {
        return;
      }

      try {
        // If forceRefresh is true, use direct PocketBase call instead of hook function
        // to avoid any potential caching or data transformation issues
        let rawData;
        if (forceRefresh) {
          // Format date for database query
          // const formattedDate = formatDateToISO8601(selectedDate);

          // Fetch data directly from database
          // const _records = await pb.collection('ccr_silo_data').getFullList({
          //   filter: `date="${formattedDate}"`,
          //   sort: 'created',
          //   expand: 'silo_id',
          // });

          // Use the getSiloDataForDate to process the records to maintain consistent data structure
          rawData = await getSiloDataForDate(selectedDate, selectedUnit);
        } else {
          rawData = await getSiloDataForDate(selectedDate, selectedUnit);
        }

        // Helper function untuk normalisasi data shift
        const safeShiftData = (shiftData: unknown) => {
          if (!shiftData) {
            return { emptySpace: undefined, content: undefined };
          }

          try {
            if (typeof shiftData === 'object' && shiftData !== null) {
              const data = shiftData as Record<string, unknown>;
              return {
                emptySpace: typeof data.emptySpace === 'number' ? data.emptySpace : undefined,
                content: typeof data.content === 'number' ? data.content : undefined,
              };
            }
          } catch {
            // Silent error
          }

          return { emptySpace: undefined, content: undefined };
        };

        let formattedData = rawData.map((item) => {
          // Struktur dasar dengan nilai default
          return {
            id: item.id || `temp-${item.silo_id}-${selectedDate}`,
            silo_id: item.silo_id || '',
            date: item.date || selectedDate,
            // Normalisasi data shift untuk memastikan struktur yang valid
            shift1: safeShiftData(item.shift1),
            shift2: safeShiftData(item.shift2),
            shift3: safeShiftData(item.shift3),
            // Data opsional lain jika tersedia
            capacity: item.capacity,
            percentage: item.percentage,
            silo_name: item.silo_name,
            weight_value: item.weight_value,
            status: item.status,
            unit_id: item.unit_id || selectedUnit,
          };
        });

        // Jika tidak ada data silo, buat data default untuk semua silo dari Master Data
        if (formattedData.length === 0 && siloMasterData.length > 0) {
          // Filter silo master data berdasarkan selectedCategory dan selectedUnit
          const relevantSilos = siloMasterData.filter((silo) => {
            const categoryMatch = silo.plant_category === selectedCategory;
            const unitMatch = !selectedUnit || silo.unit === selectedUnit;
            return categoryMatch && unitMatch;
          });

          formattedData = relevantSilos.map((silo) => ({
            id: `temp-${silo.id}-${selectedDate}`,
            silo_id: silo.id,
            date: selectedDate,
            shift1: { emptySpace: undefined, content: undefined },
            shift2: { emptySpace: undefined, content: undefined },
            shift3: { emptySpace: undefined, content: undefined },
            capacity: silo.capacity,
            percentage: 0,
            silo_name: silo.silo_name,
            weight_value: 0,
            status: '',
            unit_id: selectedUnit,
          }));
        }

        setAllDailySiloData(formattedData);
      } catch {
        showToast(t.error_fetching_parameter_data);
        // Log error hanya dalam mode development
        if (process.env.NODE_ENV === 'development') {
          // Error logging removed for production
        }
      }
    },
    [
      selectedDate,
      selectedUnit,
      getSiloDataForDate,
      siloMasterData,
      selectedCategory,
      showToast,
      t.error_fetching_parameter_data,
    ]
  );

  useEffect(() => {
    // Initial data fetch with force refresh to ensure fresh data
    setLoading(true);
    fetchSiloData(true).then(() => setLoading(false));

    // Counter to track poll count for occasional force refresh
    let pollCount = 0;

    // Real-time polling every 5 seconds when window is focused
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        // Every 5th poll (25 seconds), do a force refresh to ensure UI matches DB
        const shouldForceRefresh = pollCount % 5 === 0;
        fetchSiloData(shouldForceRefresh);
        pollCount++;
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [selectedDate, selectedCategory, selectedUnit, fetchSiloData]);

  // Parameter Data Hooks and Filtering
  const { records: parameterSettings } = useParameterSettings();

  // Custom parameter filtering with reorder support
  const filteredParameterSettings = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];

    const unitBelongsToCategory = plantUnits.some(
      (pu) => pu.unit === selectedUnit && pu.category === selectedCategory
    );
    if (!unitBelongsToCategory) return [];

    let filteerror = parameterSettings.filter(
      (param) => param.category === selectedCategory && param.unit === selectedUnit
    );

    // Apply custom order if available
    if (pbParameterOrder.length > 0) {
      const orderMap = new Map(pbParameterOrder.map((id, index) => [id, index]));
      filteerror = filteerror.sort((a, b) => {
        const aIndex = orderMap.get(a.id) ?? filteerror.length;
        const bIndex = orderMap.get(b.id) ?? filteerror.length;
        return aIndex - bIndex;
      });
    } else {
      // Default sort by parameter name
      filteerror = filteerror.sort((a, b) => a.parameter.localeCompare(b.parameter));
    }

    // Apply column search filter
    if (columnSearchQuery.trim()) {
      const searchTerm = columnSearchQuery.toLowerCase().trim();
      filteerror = filteerror.filter(
        (param) =>
          param.parameter.toLowerCase().includes(searchTerm) ||
          param.unit.toLowerCase().includes(searchTerm)
      );
    }

    return filteerror;
  }, [
    parameterSettings,
    selectedCategory,
    selectedUnit,
    plantUnits,
    pbParameterOrder,
    columnSearchQuery,
  ]);

  // Update modal parameter order when modal opens or filteredParameterSettings changes
  // Parameter reorder handlers - optimized for performance with debouncing
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moveParameterUp = useCallback((index: number) => {
    if (reorderTimeoutRef.current) return; // Prevent rapid clicks

    setModalParameterOrder((prev) => {
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      return newOrder;
    });

    // Debounce for 150ms to prevent rapid clicking
    reorderTimeoutRef.current = setTimeout(() => {
      reorderTimeoutRef.current = null;
    }, 150);
  }, []);

  const moveParameterDown = useCallback((index: number) => {
    if (reorderTimeoutRef.current) return; // Prevent rapid clicks

    setModalParameterOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });

    // Debounce for 150ms to prevent rapid clicking
    reorderTimeoutRef.current = setTimeout(() => {
      reorderTimeoutRef.current = null;
    }, 150);
  }, []);

  // Handler for drag-and-drop reordering
  const handleParameterDragEnd = useCallback((result: DropResult) => {
    // If dropped outside of droppable area or no destination
    if (!result.destination) return;

    // If position didn't change
    if (result.source.index === result.destination.index) return;

    setModalParameterOrder((prev) => {
      const newOrder = Array.from(prev);
      const [movedItem] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination!.index, 0, movedItem);
      return newOrder;
    });
  }, []);

  // Export parameter order to Excel for easier reordering
  const exportParameterOrderToExcel = useCallback(async () => {
    try {
      // Create new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Parameter Order');

      // Add headers with instructions
      worksheet.addRow(['Parameter Order Configuration']);
      worksheet.addRow([
        'Instructions: Modify the Order column values to change parameter positions. Do NOT modify the ID column.',
      ]);
      worksheet.addRow(['']);

      // Set column headers
      worksheet.addRow(['Order', 'ID', 'Parameter Name', 'Unit', 'Data Type', 'Category']);

      // Add data rows
      modalParameterOrder.forEach((param, index) => {
        worksheet.addRow([
          index + 1, // Order (1-based)
          param.id, // ID (do not change)
          param.parameter,
          param.unit,
          param.data_type,
          param.category,
        ]);
      });

      // Style the worksheet
      worksheet.getColumn(1).width = 10;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 40;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 20;

      // Style header row
      const headerRow = worksheet.getRow(4);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Make the order column editable with warning highlight
      const orderColumn = worksheet.getColumn(1);
      orderColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 4) {
          // Skip header rows
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' }, // Light warning
          };
        }
      });

      // Protect ID column
      const idColumn = worksheet.getColumn(2);
      idColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 4) {
          // Skip header rows
          cell.font = { color: { argb: 'FF888888' } }; // Grey text to indicate read-only
        }
      });

      // Generate filename with date/time
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const filename = `Parameter_Order_${selectedUnit || 'All'}_${timestamp}.xlsx`;

      // Create buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);

      // Create link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      showToast(t.parameter_order_exported_successfully);
    } catch {
      showToast(t.failed_to_export_parameter_order);
      // Error logging removed for production
    }
  }, [modalParameterOrder, selectedUnit, showToast]);

  // Import parameter order from Excel
  const handleImportParameterOrderExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Read file
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;

            // Load workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            // Get the first worksheet
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
              showToast(t.invalid_excel_file_format);
              return;
            }

            // Create a map of parameter IDs to track existing parameters
            const existingParamIds = new Set(modalParameterOrder.map((p) => p.id));

            // Create a new order array based on the Excel file
            const excelParams: { id: string; order: number }[] = [];

            // Start reading from row 5 (after headers)
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              if (rowNumber > 4) {
                const order = row.getCell(1).value as number;
                const id = String(row.getCell(2).value);

                // Validate ID exists in our current parameters
                if (existingParamIds.has(id)) {
                  excelParams.push({ id, order });
                }
              }
            });

            // Sort by the order column from Excel
            excelParams.sort((a, b) => a.order - b.order);

            // Apply the new order by mapping IDs back to full parameter objects
            const newOrder = excelParams
              .map((ep) => modalParameterOrder.find((p) => p.id === ep.id)!)
              .filter(Boolean);

            // Handle parameters that were in our original list but not in the Excel file
            const missingParams = modalParameterOrder.filter(
              (p) => !excelParams.some((ep) => ep.id === p.id)
            );

            // Append any missing parameters to the end
            const finalOrder = [...newOrder, ...missingParams];

            // Validate we haven't lost any parameters
            if (finalOrder.length !== modalParameterOrder.length) {
              showToast(t.warning_some_parameters_not_imported);
            }

            // Apply the new order
            setModalParameterOrder(finalOrder);
            showToast(t.parameter_order_imported_successfully);
          } catch {
            showToast(t.failed_to_process_excel_file);
            // Error logging removed for production
          }
        };

        reader.readAsArrayBuffer(file);

        // Reset file input to allow re-importing the same file
        e.target.value = '';
      } catch {
        showToast(t.failed_to_import_parameter_order);
        // Error logging removed for production
      }
    },
    [modalParameterOrder, showToast]
  );

  useEffect(() => {
    if (showReorderModal) {
      const sortedParameters = [...filteredParameterSettings];
      setModalParameterOrder(sortedParameters);
      setOriginalParameterOrder(sortedParameters);
      setModalSearchQuery(''); // Reset search when modal opens

      // Add keyboard shortcut for quick reordering
      const handleKeyDown = (e: KeyboardEvent) => {
        // Find the currently focused element
        const focusedElement = document.activeElement;

        // Check if we're in the reorder modal context
        if (!focusedElement || !focusedElement.closest('.parameter-reorder-modal')) return;

        // Prevent keyboard shortcuts if we're in an input field
        if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') return;

        // Get data attribute from closest draggable element
        const draggableElement = focusedElement.closest('[data-parameter-index]');
        if (!draggableElement) return;

        const index = parseInt(draggableElement.getAttribute('data-parameter-index') || '-1');
        if (index < 0) return;

        // Alt+ArrowUp - Move up
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          moveParameterUp(index);
        }

        // Alt+ArrowDown - Move down
        if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          moveParameterDown(index);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showReorderModal, filteredParameterSettings, moveParameterUp, moveParameterDown]);

  // Filter parameters in modal based on search query
  const filteerrorModalParameters = useMemo(() => {
    if (!modalSearchQuery || modalSearchQuery.trim() === '') {
      return modalParameterOrder;
    }

    const searchTerm = modalSearchQuery.toLowerCase().trim();
    return modalParameterOrder.filter(
      (param) =>
        param.parameter.toLowerCase().includes(searchTerm) ||
        param.unit.toLowerCase().includes(searchTerm)
    );
  }, [modalParameterOrder, modalSearchQuery]);

  // Memoized parameter reorder item component for better performance
  const ParameterReorderItem = React.memo(
    ({ param, index }: { param: ParameterSetting; index: number }) => (
      <Draggable draggableId={param.id} index={index} key={param.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            data-parameter-index={index}
            className={`flex items-center justify-between p-3 bg-neutral-50 rounded-lg ${
              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                {...provided.dragHandleProps}
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
              >
                <svg
                  className="w-4 h-4 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6H6V8H8V6Z M8 11H6V13H8V11Z M8 16H6V18H8V16Z M18 6H16V8H18V6Z M18 11H16V13H18V11Z M18 16H16V18H18V16Z M13 6H11V8H13V6Z M13 11H11V13H13V11Z M13 16H11V18H13V16Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm font-medium text-neutral-700">{index + 1}.</span>
              </div>
              <div>
                <div className="font-semibold text-neutral-800">{param.parameter}</div>
                <div className="text-xs text-neutral-500">{param.unit}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={modalParameterOrder.length}
                value={index + 1}
                onChange={(e) => {
                  const newPosition = parseInt(e.target.value) - 1;
                  if (
                    isNaN(newPosition) ||
                    newPosition < 0 ||
                    newPosition >= modalParameterOrder.length
                  )
                    return;

                  // Move parameter to new position
                  setModalParameterOrder((prev) => {
                    const newOrder = [...prev];
                    const [movedItem] = newOrder.splice(index, 1);
                    newOrder.splice(newPosition, 0, movedItem);
                    return newOrder;
                  });
                }}
                className="w-14 px-1 py-1 border border-neutral-300"
                title={t.parameter_position_title}
                aria-label={`Ubah urutan parameter ${param.parameter}`}
              />
              <div className="flex items-center gap-1">
                <EnhancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => moveParameterUp(index)}
                  disabled={index === 0}
                  aria-label={`Move ${param.parameter} up`}
                >
                  ↑
                </EnhancedButton>
                <EnhancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => moveParameterDown(index)}
                  disabled={index === modalParameterOrder.length - 1}
                  aria-label={`Move ${param.parameter} down`}
                >
                  ↓
                </EnhancedButton>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    )
  );
  ParameterReorderItem.displayName = 'ParameterReorderItem';

  // Load profile
  const loadProfile = useCallback(
    async (profile: ParameterProfile) => {
      if (!profile?.parameter_order) return;

      try {
        // Update modal order
        const ordeerrorParams = profile.parameter_order
          .map((id: string) => filteredParameterSettings.find((p) => p.id === id))
          .filter(Boolean);

        // Add any missing parameters at the end
        const missingParams = filteredParameterSettings.filter(
          (p) => !profile.parameter_order.includes(p.id)
        );

        setModalParameterOrder([...ordeerrorParams, ...missingParams]);
        setSelectedProfile(profile);
        setShowLoadProfileModal(false);
        showToast(t.profile_loaded.replace('{name}', profile.name));
      } catch {
        showToast(t.failed_to_load_profile);
        showToast(t.failed_to_load_profile);
      }
    },
    [filteredParameterSettings, showToast]
  );

  // Delete profile
  const deleteProfile = useCallback(
    async (profile: ParameterProfile) => {
      if (!profile?.id) {
        showToast(t.invalid_profile_selected);
        return;
      }

      // Check if user owns the profile or is Super Admin
      const isOwner = profile.user_id === loggedInUser?.id;
      const canDelete = isOwner || isSuperAdmin(loggedInUser?.role);

      if (!canDelete) {
        showToast(t.you_can_only_delete_own_profiles);
        return;
      }

      try {
        await pb.collection('parameter_order_profiles').delete(profile.id);

        showToast(t.profile_deleted_successfully.replace('{name}', profile.name));
        fetchProfiles(); // Refresh the profiles list
      } catch {
        showToast(t.failed_to_delete_profile);
        showToast(t.network_error_delete_profile);
      }
    },
    [loggedInUser?.id, loggedInUser?.role, fetchProfiles, showToast]
  );

  // Silo master map
  const siloMasterMap = useMemo(
    () => new Map(siloMasterData.map((silo) => [silo.id, silo])),
    [siloMasterData]
  );

  // Filter silo data - show all silos from master data, merge with existing data
  const dailySiloData = useMemo(() => {
    if (!selectedCategory) return [];

    // Get all silos that match the category and unit filters
    const filteerrorMasterData = siloMasterData.filter((silo) => {
      const categoryMatch = silo.plant_category === selectedCategory;
      const unitMatch = !selectedUnit || silo.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });

    // Create a map of existing silo data for quick lookup
    const existingDataMap = new Map(allDailySiloData.map((data) => [data.silo_id, data]));

    // For each filteerror silo, either use existing data or create empty data structure
    return filteerrorMasterData.map((masterSilo) => {
      const existingData = existingDataMap.get(masterSilo.id);

      if (existingData) {
        // Use existing data
        return existingData;
      } else {
        // Create empty data structure for silos without data
        return {
          id: `temp-${masterSilo.id}`, // Temporary ID for UI purposes
          silo_id: masterSilo.id,
          date: selectedDate || '',
          capacity: masterSilo.capacity,
          percentage: 0,
          silo_name: masterSilo.silo_name,
          weight_value: 0,
          status: '',
          unit_id: masterSilo.unit,
          shift1: { emptySpace: undefined, content: undefined },
          shift2: { emptySpace: undefined, content: undefined },
          shift3: { emptySpace: undefined, content: undefined },
        } as CcrSiloData;
      }
    });
  }, [allDailySiloData, selectedCategory, selectedUnit, siloMasterData, selectedDate]);

  const {
    getDataForDate: getParameterDataForDate,
    updateParameterData,
    dataVersion, // Version untuk memicu refresh
    triggerRefresh, // Fungsi untuk refresh manual
    lastRefreshTime, // Waktu refresh terakhir
  } = useCcrParameterDataFlat();

  const [dailyParameterData, setDailyParameterData] = useState<CcrParameterDataFlat[]>([]);

  const fetchParameterData = useCallback(async () => {
    if (!selectedDate || selectedDate.trim() === '') {
      return;
    }

    setLoading(true); // Set loading state before fetching data

    try {
      // Pass selectedUnit to properly filter data by unit
      const data = await getParameterDataForDate(selectedDate, selectedUnit);
      setDailyParameterData(data);

      // No need to update legacy records as the new flat structure is now used
      // const _userName = loggedInUser?.full_name || currentUser.full_name || 'Unknown User';
    } catch {
      // Error logging removed for production
      showToast(t.error_fetching_parameter_data);
    } finally {
      setLoading(false); // Clear loading state when done, regardless of success or failure
    }
    // Remove dataVersion from the dependency array to prevent infinite loops
  }, [selectedDate, selectedUnit, getParameterDataForDate, showToast, loggedInUser, currentUser]);

  // Pendekatan client-server standar: fetch data hanya ketika ada perubahan input
  useEffect(() => {
    // Initial data fetch - loading state is handled inside fetchParameterData
    if (selectedDate && selectedUnit && selectedCategory) {
      fetchParameterData();
      // Debug logging removed for production
    }
    // Remove fetchParameterData from dependency array to prevent infinite loops
  }, [selectedDate, selectedUnit, selectedCategory]);

  // Jika masih perlu dataVersion sebagai picu refresh (sudah diperbaiki di useCcrParameterData.ts)
  // Menggunakan useRef untuk mencegah double fetching
  const lastDataVersion = useRef(dataVersion);

  useEffect(() => {
    // Hanya refresh jika dataVersion berubah dan lebih besar dari sebelumnya
    if (dataVersion > 0 && dataVersion > lastDataVersion.current) {
      // Debug logging removed for production
      lastDataVersion.current = dataVersion;
      fetchParameterData();
    }
  }, [dataVersion]);

  const parameterDataMap = useMemo(
    () => new Map(dailyParameterData.map((p) => [p.parameter_id, p])),
    [dailyParameterData]
  );

  // Use custom hook for footer calculations
  const {
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftAverageData,
    parameterShiftCounterData,
  } = useFooterCalculations({
    filteredParameterSettings,
    parameterDataMap,
  });

  // Use custom hook for footer data persistence
  const { saveFooterData, batchSaveFooterData, getFooterDataForDate } = useCcrFooterData();
  const { saveMaterialUsageSilent } = useCcrMaterialUsage();

  // Material usage calculation mappings
  const materialToParameterMap: Record<string, string> = {
    clinker: 'Counter Feeder Clinker (ton)',
    gypsum: 'Counter Feeder Gypsum (ton)',
    limestone: 'Counter Feeder Limestone (ton)',
    trass: 'Counter Feeder Trass (ton)',
    fly_ash: 'Counter Feeder Flyash (ton)',
    fine_trass: 'Counter Feeder Fine Trass (ton)',
    ckd: 'Counter Feeder CKD (ton)',
  };

  const shiftToCounterFieldMap: Record<string, string> = {
    shift3_cont: 'shift3_cont_counter',
    shift1: 'shift1_counter',
    shift2: 'shift2_counter',
    shift3: 'shift3_counter',
  };

  const shifts = ['shift3_cont', 'shift1', 'shift2', 'shift3'];

  // Function to calculate and save material usage from footer data
  const saveMaterialUsageFromFooterData = useCallback(async () => {
    if (!selectedDate || !selectedCategory || !selectedUnit || parameterSettings.length === 0) {
      return;
    }

    try {
      // Get footer data for counter feeders
      const footerData = await getFooterDataForDate(selectedDate, selectedCategory);

      // Calculate material usage from counters for each shift
      const savePromises = shifts.map(async (shift) => {
        const materialUsage: Record<string, unknown> = {
          date: selectedDate,
          plant_category: selectedCategory,
          plant_unit: selectedUnit,
          shift: shift as 'shift3_cont' | 'shift1' | 'shift2' | 'shift3',
        };

        let totalProduction = 0;

        Object.entries(materialToParameterMap).forEach(([materialKey, paramName]) => {
          // Find parameter setting for this material
          const paramSetting = parameterSettings.find(
            (s) =>
              s.parameter === paramName &&
              s.category === selectedCategory &&
              s.unit === selectedUnit
          );

          if (paramSetting) {
            // Find footer data for this parameter
            const footer = footerData.find((f) => f.parameter_id === paramSetting.id);

            if (footer) {
              const counterField = shiftToCounterFieldMap[shift];
              const value = (footer[counterField] as number) || 0;
              materialUsage[materialKey] = value;
              totalProduction += value;
            }
          }
        });

        materialUsage.total_production = totalProduction;

        // Only save if there's actual data
        if (totalProduction > 0) {
          await saveMaterialUsageSilent(materialUsage);
        }
      });

      await Promise.all(savePromises);
    } catch {
      // Silently handle errors for auto-save
    }
  }, [
    selectedDate,
    selectedCategory,
    selectedUnit,
    parameterSettings,
    getFooterDataForDate,
    saveMaterialUsageSilent,
    fetchParameterData,
  ]);

  // Auto-save footer data when it changes - debounced to prevent network overload
  useEffect(() => {
    // Skip if not ready
    if (filteredParameterSettings.length === 0 || !selectedDate) {
      return;
    }

    const timer = setTimeout(async () => {
      // Prevent concurrent saves
      if (footerSaveInProgress.current) {
        return;
      }

      if (
        !parameterFooterData ||
        !parameterShiftFooterData ||
        !parameterShiftAverageData ||
        !parameterShiftCounterData
      ) {
        return;
      }

      footerSaveInProgress.current = true;

      try {
        // Collect all footer data to be saved
        const allFooterDataToSave = filteredParameterSettings
          .map((param) => {
            const footerData = parameterFooterData[param.id];
            const shiftData = parameterShiftFooterData;
            const averageData = parameterShiftAverageData;
            const counterData = parameterShiftCounterData;

            if (footerData) {
              return {
                date: selectedDate,
                parameter_id: param.id,
                plant_unit: selectedCategory || 'CCR',
                total: footerData.total,
                average: footerData.avg,
                minimum: footerData.min,
                maximum: footerData.max,
                shift1_total: shiftData.shift1[param.id] || 0,
                shift2_total: shiftData.shift2[param.id] || 0,
                shift3_total: shiftData.shift3[param.id] || 0,
                shift3_cont_total: shiftData.shift3Cont[param.id] || 0,
                shift1_average: averageData.shift1[param.id] || 0,
                shift2_average: averageData.shift2[param.id] || 0,
                shift3_average: averageData.shift3[param.id] || 0,
                shift3_cont_average: averageData.shift3Cont[param.id] || 0,
                shift1_counter: counterData.shift1[param.id] || 0,
                shift2_counter: counterData.shift2[param.id] || 0,
                shift3_counter: counterData.shift3[param.id] || 0,
                shift3_cont_counter: counterData.shift3Cont[param.id] || 0,
                operator_id: loggedInUser?.id,
              };
            }
            return null;
          })
          .filter((f): f is any => f !== null);

        if (allFooterDataToSave.length > 0) {
          // Use batch save for efficiency and to prevent parallel request flood
          await batchSaveFooterData(allFooterDataToSave);
        }

        // Auto-save material usage data when footer data is saved
        if (selectedCategory && selectedUnit) {
          await saveMaterialUsageFromFooterData();
        }
      } catch (err) {
        // Silent error for background save
        console.error('Background footer save error:', err);
      } finally {
        footerSaveInProgress.current = false;
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftAverageData,
    parameterShiftCounterData,
    filteredParameterSettings,
    selectedDate,
    selectedCategory,
    selectedUnit,
    batchSaveFooterData,
    saveMaterialUsageFromFooterData,
    loggedInUser?.id,
  ]);

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
  const getInputRef = useCallback((table: 'silo' | 'parameter', row: number, col: number) => {
    return `${table}-${row}-${col}`;
  }, []);

  const focusCell = useCallback(
    (table: 'silo' | 'parameter', row: number, col: number) => {
      const refKey = getInputRef(table, row, col);
      const input = inputRefs.current.get(refKey);
      if (input) {
        try {
          input.focus();
          if ('select' in input) {
            input.select(); // Select text for better UX
          }
          setFocusedCell({ table, row, col });
        } catch {
          // Silently handle focus errors
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
    inputRefs,
  });

  // Downtime Data Hooks and State
  const {
    getDowntimeForDate,
    addDowntime,
    updateDowntime,
    deleteDowntime,
    refetch: downtimeRefetch,
  } = useCcrDowntimeData(selectedDate);
  // FIXED: Menghapus filter yang terlalu ketat pada downtime data dan menyediakan
  // fallback untuk data dengan unit yang tidak ada di unitToCategoryMap
  const dailyDowntimeData = useMemo(() => {
    const allDowntimeForDate = getDowntimeForDate(selectedDate);

    // Jika tidak ada unit yang dipilih, jangan tampilkan data apa pun
    if (!selectedUnit) {
      return [];
    }

    return allDowntimeForDate
      .filter((downtime) => downtime.unit === selectedUnit)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    /* KODE ASLI DENGAN FILTER (akan diaktifkan kembali setelah masalah teridentifikasi)
    if (!selectedCategory) {
      return allDowntimeForDate.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    
    return allDowntimeForDate
      .filter((downtime) => {
        // Jika unit tidak ada dalam mapping, tetap tampilkan data
        const unitCategory = unitToCategoryMap.get(downtime.unit);
        
        // Jika tidak ada mapping category untuk unit ini, tetap tampilkan
        if (unitCategory === undefined) return true;
        
        const categoryMatch = unitCategory === selectedCategory;
        const unitMatch = !selectedUnit || downtime.unit === selectedUnit;
        return categoryMatch && unitMatch;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    */
  }, [getDowntimeForDate, selectedDate, selectedUnit]);

  const [isDowntimeModalOpen, setDowntimeModalOpen] = useState(false);
  const [editingDowntime, setEditingDowntime] = useState<CcrDowntimeData | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<CcrDowntimeData | null>(null);

  // Information Data Hook and State
  const {
    getInformationForDate,
    saveInformation,
    isSaving: isSavingInformation,
    refetch: informationRefetch,
  } = useCcrInformationData();
  const [informationText, setInformationText] = useState('');

  // Effect untuk memuat data informasi saat tanggal atau unit berubah
  useEffect(() => {
    if (!selectedDate || !selectedUnit) return;

    const loadInformation = async () => {
      const info = getInformationForDate(selectedDate, selectedUnit);
      if (info) {
        setInformationText(info.information || '');
      } else {
        setInformationText('');
      }
    };

    loadInformation();
  }, [selectedDate, selectedUnit, getInformationForDate]);

  // Fungsi untuk refresh data secara manual
  const refreshData = useCallback(async () => {
    if (!selectedDate || !selectedUnit || !selectedCategory) {
      showToast(t.select_category_unit_date_first);
      return;
    }

    setIsRefreshing(true);
    try {
      // Trigger manual refresh pada data parameter
      await triggerRefresh();

      // Refresh parameter data dari server
      await fetchParameterData();

      // Refresh silo data
      await fetchSiloData(true);

      // Refresh CCR Material Usage data - trigger re-mount component
      setMaterialUsageRefreshTrigger((prev) => prev + 1);

      // Refresh Information data
      await informationRefetch();

      // Refresh Downtime data
      await downtimeRefetch();

      showToast('Data berhasil di-refresh');
      // Debug logging removed for production
    } catch {
      // Error logging removed for production
      showToast('Gagal refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    fetchParameterData,
    fetchSiloData,
    showToast,
    triggerRefresh,
    informationRefetch,
    downtimeRefetch,
  ]);

  const formatStatValue = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return formatNumber(value);
  };

  // Helper function to determine precision based on unit
  const getPrecisionForUnit = (unit: string): number => {
    if (!unit) return 1;

    // Units that typically need 2 decimal places
    const highPrecisionUnits = ['bar', 'psi', 'kPa', 'MPa', 'm�/h', 'kg/h', 't/h', 'L/h', 'mL/h'];
    // Units that typically need 1 decimal place
    const mediumPrecisionUnits = ['�C', '�F', '�K', '%', 'kg', 'ton', 'm�', 'L', 'mL'];
    // Units that typically need 0 decimal places (whole numbers)
    const lowPrecisionUnits = ['unit', 'pcs', 'buah', 'batch', 'shift'];

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
    precision: number = 1,
    forcePrecision: boolean = true
  ): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Use parseInputValue to handle Indonesian format if it's a string
    const numValue = typeof value === 'string' ? parseInputValue(value) : value;
    if (numValue === null || isNaN(numValue)) {
      // If parsing fails but it's a string, return as-is for typing support
      return typeof value === 'string' ? value : '';
    }

    if (!forcePrecision) {
      // For on-typing format, only use dot as thousand separator without forcing decimals
      const parts = numValue.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      let result = parts.length > 1 ? parts[0] + ',' + parts[1] : parts[0];

      // Important: Preserve trailing comma or dot during typing to allow numpad dot to work
      // and prevent the separator from disappearing on next render
      if (
        typeof value === 'string' &&
        (value.endsWith(',') || value.endsWith('.')) &&
        !result.includes(',')
      ) {
        result += ',';
      }

      return result;
    }

    return formatNumberWithPrecision(numValue, precision);
  };

  const parseInputValue = (formattedValue: string): number | null => {
    if (!formattedValue || formattedValue.trim() === '') return null;

    let normalized = formattedValue.trim();

    // 1. Jika ada koma, maka dipastikan format Indonesia: titik=ribuan, koma=desimal
    if (normalized.includes(',')) {
      normalized = normalized.replace(/\./g, ''); // Hapus semua titik ribuan
      normalized = normalized.replace(',', '.'); // Ganti koma dengan titik desimal
    } else {
      // 2. Jika tidak ada koma, namun ada titik:
      // Kita harus hati-hati apakah titik ini ribuan (1.000) atau desimal (255.2)
      const dotCount = (normalized.match(/\./g) || []).length;
      if (dotCount > 1) {
        // Lebih dari satu titik pasti ribuan (misal 1.000.000)
        normalized = normalized.replace(/\./g, '');
      } else if (dotCount === 1) {
        const parts = normalized.split('.');
        // Jika bagian setelah titik tepat 3 digit dan bagian sebelum titik bukan '0',
        // kemungkinan besar itu adalah titik ribuan (misal 1.000)
        if (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '') {
          normalized = normalized.replace(/\./g, '');
        } else {
          // Biarkan titiknya sebagai desimal (format JS/International atau 0.xxx)
        }
      }
    }

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const updateSiloDataWithCreate = useCallback(
    async (
      date: string,
      siloId: string,
      shift: 'shift1' | 'shift2' | 'shift3',
      field: 'emptySpace' | 'content',
      value: number
    ) => {
      // Pastikan value adalah number yang valid
      if (value === null || value === undefined || isNaN(value)) {
        return;
      }

      // Konversi field ke format flat
      // Perhatikan bahwa 'emptySpace' harus diubah menjadi 'empty_space'
      const formattedField = field === 'emptySpace' ? 'empty_space' : 'content';

      // Extract shift number for flat field format
      const shiftNum = shift.replace('shift', '');
      // Construct flat field name as expected by the backend
      const flatFieldName = `shift${shiftNum}_${formattedField}`;

      try {
        // Format date for database
        const formattedDate = formatDateToISO8601(date);

        // First, check if record exists to determine if we need to update or create
        const filter = `date="${formattedDate}" && silo_id="${siloId}"`;

        const existingRecords = await pb.collection('ccr_silo_data').getFullList({
          filter,
          sort: '-created',
          expand: 'silo_id',
        });

        // Filter by unit on client-side
        const unitFilteerrorRecords = existingRecords.filter((record) => {
          const expandData = record.expand as Record<string, unknown> | undefined;
          const siloData = expandData?.silo_id as Record<string, unknown> | undefined;
          return siloData && typeof siloData.unit === 'string' && siloData.unit === selectedUnit;
        });

        // Create data object with the flat field
        const updateData = { [flatFieldName]: value };

        if (unitFilteerrorRecords.length > 0) {
          // Record exists - update it
          const recordId = unitFilteerrorRecords[0].id;

          await pb.collection('ccr_silo_data').update(recordId, updateData);
        } else {
          // No record - create new one
          const createData = {
            date: formattedDate,
            silo_id: siloId,
            plant_unit: selectedUnit, // Added plant_unit for filtering
            [flatFieldName]: value,
          };

          await pb.collection('ccr_silo_data').create(createData);
        }

        // Refetch data to update the UI with force refresh to ensure freshest data
        await fetchSiloData(true);
      } catch {
        // Error handling quietly
      }
    },
    [fetchSiloData, selectedUnit]
  );

  const siloUpdateInProgress = useRef(new Set<string>());

  // Fungsi untuk handle perubahan input silo (hanya update state lokal)
  const handleSiloDataChange = (
    siloId: string,
    shift: 'shift1' | 'shift2' | 'shift3',
    field: 'emptySpace' | 'content',
    value: string
  ) => {
    const parsedValue = parseFloat(value);
    const isEmptyValue = value.trim() === '' || isNaN(parsedValue);

    const key = `${siloId}-${shift}-${field}`;

    // Jika nilai kosong, hapus dari unsaved changes dan trigger delete
    if (isEmptyValue) {
      setUnsavedSiloChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[key];
        return newChanges;
      });

      // Trigger delete operation
      handleSiloDataDelete(siloId, shift, field);
      return;
    }

    // Update state lokal untuk immediate UI feedback
    setAllDailySiloData((prev) => {
      const existingIndex = prev.findIndex((data) => data.silo_id === siloId);

      if (existingIndex >= 0) {
        // Update existing data
        return prev.map((data, index) => {
          if (index === existingIndex) {
            return {
              ...data,
              [shift]: {
                ...data[shift],
                [field]: parsedValue,
              },
            };
          }
          return data;
        });
      } else {
        // Add new data entry for this silo
        const masterSilo = siloMasterMap.get(siloId);
        if (!masterSilo) return prev;

        const newData: CcrSiloData = {
          id: `temp-${siloId}`, // Temporary ID
          silo_id: siloId,
          date: selectedDate || '',
          capacity: masterSilo.capacity,
          percentage: 0,
          silo_name: masterSilo.silo_name,
          weight_value: 0,
          status: '',
          unit_id: masterSilo.unit,
          shift1: { emptySpace: undefined, content: undefined },
          shift2: { emptySpace: undefined, content: undefined },
          shift3: { emptySpace: undefined, content: undefined },
          [shift]: {
            [field]: parsedValue,
          },
        };

        return [...prev, newData];
      }
    });

    // Simpan perubahan ke unsaved changes
    setUnsavedSiloChanges((prev) => ({
      ...prev,
      [key]: { shift, field, value: parsedValue },
    }));
  };

  // Fungsi untuk handle penghapusan data silo dari database
  const handleSiloDataDelete = useCallback(
    async (
      siloId: string,
      shift: 'shift1' | 'shift2' | 'shift3',
      field: 'emptySpace' | 'content'
    ) => {
      const key = `${siloId}-${shift}-${field}`;

      if (siloUpdateInProgress.current.has(key)) {
        return;
      }

      siloUpdateInProgress.current.add(key);

      try {
        // Konversi parameter ke format yang sesuai dengan skema flat fields
        // const _shiftNum = shift.replace('shift', '');
        const formattedField = field === 'emptySpace' ? 'empty_space' : 'content';

        // Gunakan fungsi deleteSiloData dari hook untuk menghapus data
        await deleteSiloData(selectedDate, siloId, shift, formattedField, selectedUnit);

        // Update state lokal
        setAllDailySiloData((prev) => {
          return prev
            .map((data) => {
              if (data.silo_id === siloId) {
                const updatedShift = { ...data[shift] };
                delete updatedShift[field];

                // Jika shift kosong dan tidak ada shift lain, hapus dari state
                const hasDataInShift = Object.keys(updatedShift).length > 0;
                const hasOtherShiftsInData = ['shift1', 'shift2', 'shift3'].some((s) => {
                  if (s === shift) return false;
                  const shiftData = data[s] as Record<string, unknown> | undefined;
                  return shiftData && Object.keys(shiftData).length > 0;
                });

                if (!hasDataInShift && !hasOtherShiftsInData) {
                  // Jangan tampilkan data ini lagi di UI (akan kembali ke empty state)
                  return null;
                }

                return {
                  ...data,
                  [shift]: updatedShift,
                };
              }
              return data;
            })
            .filter(Boolean) as CcrSiloData[]; // Filter out null values
        });
        // Refetch data untuk memastikan konsistensi dengan force refresh
        await fetchSiloData(true);
      } catch {
        // Error handling quietly
      } finally {
        siloUpdateInProgress.current.delete(key);
      }
    },
    [selectedDate, selectedUnit, fetchSiloData]
  );

  // Fungsi untuk save silo data ke database saat berpindah cell (onBlur)
  const handleSiloDataBlur = async (
    siloId: string,
    shift: 'shift1' | 'shift2' | 'shift3',
    field: 'emptySpace' | 'content'
  ) => {
    const key = `${siloId}-${shift}-${field}`;

    const change = unsavedSiloChanges[key];

    if (!change || siloUpdateInProgress.current.has(key)) {
      return;
    }

    siloUpdateInProgress.current.add(key);

    try {
      // Konversi nilai ke number dan pastikan valid
      const valueToSave = parseFloat(change.value.toString());
      if (isNaN(valueToSave)) {
        return;
      }

      // Verify field name consistency
      if (field !== 'emptySpace' && field !== 'content') {
        return;
      }

      // Save ke database dengan nilai yang sudah dipastikan sebagai number
      await updateSiloDataWithCreate(selectedDate, siloId, shift, field, valueToSave);

      // Hapus dari unsaved changes setelah berhasil save
      setUnsavedSiloChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[key];
        return newChanges;
      });
    } catch {
      // Error handling quietly
    } finally {
      siloUpdateInProgress.current.delete(key);
    }
  };

  // Enhanced cleanup for inputRefs, debounced updates, and custom hooks
  useEffect(() => {
    return () => {
      // Clear input refs
      inputRefs.current.clear();
    };
  }, [selectedDate, selectedCategory, selectedUnit]);

  // Load information when date or plant unit changes
  useEffect(() => {
    if (selectedDate && selectedUnit) {
      const existingInfo = getInformationForDate(selectedDate, selectedUnit);
      setInformationText(existingInfo?.information || '');
    }
  }, [selectedDate, selectedUnit, getInformationForDate]);

  // Wrapper function for parameter data changes with optimistic updates and immediate saving
  // Track pending changes yang belum disimpan ke database

  // Fungsi untuk menangani perubahan nilai parameter (hanya update UI tanpa save ke database)
  const handleParameterDataChange = useCallback(
    (parameterId: string, hour: number, value: string) => {
      // Optimistic update for UI
      setDailyParameterData((prev) => {
        const idx = prev.findIndex((p) => p.parameter_id === parameterId);
        if (idx === -1) return prev;

        const param = prev[idx];
        const userName = loggedInUser?.full_name || currentUser?.full_name || 'Unknown User';

        // Get hour field keys
        const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
        const userKey = `hour${hour}_user` as keyof CcrParameterDataFlat;

        // Extract previous value
        const previousValue = param[hourKey];

        // Create updated parameter
        const updatedParam = { ...param };

        if (value === '' || value === null) {
          // Clear the value
          updatedParam[hourKey] = null;
        } else {
          // Set new value and user
          updatedParam[hourKey] = value;
          updatedParam[userKey] = userName;
        }

        // Push to undo stack
        setUndoStack((stack) => [
          ...stack,
          { parameterId, hour, previousValue: String(previousValue) },
        ]);

        // Update array
        const newArr = [...prev];
        newArr[idx] = updatedParam;

        // Simpan perubahan ke pending changes
        // const changeKey = `${parameterId}_${hour}`;
        // setPendingChanges((prev) => {
        //   const newMap = new Map(prev);
        //   newMap.set(changeKey, { parameterId, hour, value });
        //   return newMap;
        // });

        return newArr;
      });
    },
    [loggedInUser, currentUser]
  );

  // Fungsi untuk menyimpan perubahan ke database saat berpindah sel
  const saveParameterChange = useCallback(
    async (parameterId: string, hour: number, value: string, userName?: string) => {
      try {
        const effectiveUserName =
          userName || loggedInUser?.full_name || currentUser?.full_name || 'Unknown User';
        // Use updateParameterData directly for individual changes
        // Pass opts.skipTrigger = true to avoid triggering a full data refresh on every cell save
        await updateParameterData(
          parameterId,
          selectedDate,
          hour,
          value,
          effectiveUserName,
          undefined,
          { skipTrigger: true }
        );

        // Hapus dari pending changes setelah berhasil disimpan
        // const changeKey = `${parameterId}_${hour}`;
        // setPendingChanges((prev) => {
        //   const newMap = new Map(prev);
        //   newMap.delete(changeKey);
        //   return newMap;
        // });
      } catch {
        // Error logging removed for production
        showToast('Error saving parameter data');
      }
    },
    [updateParameterData, loggedInUser, currentUser, selectedDate, showToast]
  );

  // Bulk save function for efficient import
  const bulkSaveParameterChanges = useCallback(
    async (
      changes: Array<{
        paramId: string;
        hour: number;
        value: string;
        userName?: string;
      }>
    ) => {
      if (changes.length === 0) return 0;

      let successCount = 0;
      const errors: string[] = [];

      try {
        // Group changes by parameter_id for efficient database operations
        const changesByParam = new Map<string, typeof changes>();

        for (const change of changes) {
          if (!changesByParam.has(change.paramId)) {
            changesByParam.set(change.paramId, []);
          }
          changesByParam.get(change.paramId)!.push(change);
        }

        // Process each parameter group
        const bulkPromises = Array.from(changesByParam.entries()).map(
          async ([paramId, paramChanges]) => {
            try {
              const effectiveUserName =
                paramChanges[0]?.userName ||
                loggedInUser?.full_name ||
                currentUser?.full_name ||
                'Unknown User';

              // Get existing record for this parameter and date
              const filter = `date="${selectedDate}" && parameter_id="${paramId}"`;
              const existingRecords = await pb.collection('ccr_parameter_data').getFullList({
                filter: filter,
              });

              const updateFields: Record<string, string | number | null> = {};

              // Prepare all hour fields for this parameter
              for (const change of paramChanges) {
                const hourField = `hour${change.hour}`;
                const userField = `hour${change.hour}_user`;

                updateFields[hourField] = change.value;
                updateFields[userField] = effectiveUserName;
              }

              if (existingRecords.length > 0) {
                // Update existing record
                const existingRecord = existingRecords[0];
                updateFields.name = effectiveUserName; // For backward compatibility

                await pb.collection('ccr_parameter_data').update(existingRecord.id, updateFields);
              } else {
                // Create new record
                const createFields: Record<string, string | number | null> = {
                  date: selectedDate,
                  parameter_id: paramId,
                  name: effectiveUserName,
                  plant_unit: selectedUnit,
                  ...updateFields,
                };

                await pb.collection('ccr_parameter_data').create(createFields);
              }

              successCount += paramChanges.length;
            } catch (error) {
              errors.push(
                `Failed to save parameter ${paramId}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        );

        // Execute all bulk operations in parallel with controlled concurrency
        const concurrencyLimit = 10; // Process 10 parameters at a time
        for (let i = 0; i < bulkPromises.length; i += concurrencyLimit) {
          const batch = bulkPromises.slice(i, i + concurrencyLimit);
          await Promise.all(batch);

          // Small delay between batches to prevent overwhelming the server
          if (i + concurrencyLimit < bulkPromises.length) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }
      } catch (error) {
        errors.push(
          `Bulk save failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      if (errors.length > 0) {
        throw new Error(`Bulk save completed with errors: ${errors.join('; ')}`);
      }

      return successCount;
    },
    [selectedDate, selectedUnit, loggedInUser, currentUser]
  );

  // Function to delete all parameter data for selected date and unit
  const deleteAllParameters = useCallback(async () => {
    if (!selectedDate || !selectedUnit) {
      alert('Please select a date and plant unit first.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL parameter data for ${selectedDate} and unit ${selectedUnit}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeletingAll(true);
    try {
      // Get all parameter records for the selected date and unit
      const filter = `date="${selectedDate}" && plant_unit="${selectedUnit}"`;
      const records = await pb.collection('ccr_parameter_data').getFullList({
        filter: filter,
      });

      if (records.length === 0) {
        alert(t.no_parameter_data_found);
        return;
      }

      // Delete records in batches to avoid overwhelming the server
      const batchSize = 10;
      let deletedCount = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (record) => {
            await pb.collection('ccr_parameter_data').delete(record.id);
            deletedCount++;
          })
        );

        // Small delay between batches
        if (i + batchSize < records.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Clear local state
      setDailyParameterData([]);
      // setPendingChanges(new Map());

      showToast(`Successfully deleted ${deletedCount} parameter records`);
      announceToScreenReader(`Deleted ${deletedCount} parameter records`);
    } catch (error) {
      // Error logging removed for production
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurerror';
      alert(`Failed to delete parameter data: ${errorMessage}`);
      showToast('Error deleting parameter data');
    } finally {
      setIsDeletingAll(false);
    }
  }, [selectedDate, selectedUnit, setDailyParameterData, showToast, announceToScreenReader]);

  // Fungsi untuk menghapus semua nama user (khusus Super Admin)
  const deleteAllNames = useCallback(async () => {
    if (!selectedDate || !selectedUnit) {
      alert('Please select a date and plant unit first.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL user names for ${selectedDate} and unit ${selectedUnit}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeletingAllNames(true);
    try {
      // Get all parameter records for the selected date and unit
      const filter = `date="${selectedDate}" && plant_unit="${selectedUnit}"`;
      const records = await pb.collection('ccr_parameter_data').getFullList({
        filter: filter,
      });

      if (records.length === 0) {
        alert(t.no_parameter_data_found);
        return;
      }

      // Update records to clear name fields (set to null)
      const batchSize = 5; // erroruced batch size for better stability
      let updatedCount = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (record) => {
            // Clear all hour{X}_user fields and name field
            const updateData: Record<string, string | number | null | undefined> = {};
            for (let hour = 1; hour <= 24; hour++) {
              const userKey = `hour${hour}_user`;
              if (record[userKey] !== undefined) {
                updateData[userKey] = null;
              }
            }
            // Also clear the name field
            updateData.name = null;

            if (Object.keys(updateData).length > 0) {
              await pb.collection('ccr_parameter_data').update(record.id, updateData);
              updatedCount++;
            }
          })
        );

        // Small delay between batches - increased for stability
        if (i + batchSize < records.length) {
          await new Promise((resolve) => setTimeout(resolve, 200)); // Increased from 50ms to 200ms
        }
      }

      // Refresh data to reflect changes
      await fetchParameterData();

      showToast(`Successfully cleaerror user names from ${updatedCount} parameter records`);
      announceToScreenReader(`Cleaerror user names from ${updatedCount} parameter records`);
    } catch (error) {
      // Error logging removed for production

      // Check if it's a network error
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('ERR_NETWORK') ||
            error.message.includes('fetch')));

      let errorMessage = 'Unknown error occurerror';

      if (isNetworkError) {
        errorMessage =
          'Network connection error. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to delete user names: ${errorMessage}`);
      showToast('Error deleting user names');
    } finally {
      setIsDeletingAllNames(false);
    }
  }, [selectedDate, selectedUnit, fetchParameterData, showToast, announceToScreenReader]);

  // Fungsi untuk menangani perubahan nama user untuk jam tertentu
  const handleUserNameChange = useCallback((hour: number, userName: string) => {
    // Update semua parameter untuk jam ini dengan user name baru
    setDailyParameterData((prev) => {
      return prev.map((param) => {
        const userKey = `hour${hour}_user` as keyof CcrParameterDataFlat;

        // Selalu update user name untuk semua parameter, terlepas dari apakah ada data di jam ini
        return {
          ...param,
          [userKey]: userName,
        };
      });
    });
  }, []);

  // Fungsi untuk menyimpan perubahan user name ke database
  const saveUserNameChange = useCallback(
    async (hour: number, userName: string) => {
      try {
        // Update user name untuk semua parameter yang terlihat, terlepas dari apakah ada data di jam ini
        const updatePromises = filteredParameterSettings.map(async (param) => {
          const paramData = parameterDataMap.get(param.id);
          if (!paramData) return;

          const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
          const hourValue = paramData[hourKey];

          // Selalu update user name, terlepas dari apakah ada data di jam ini
          // Jika belum ada data, buat record dengan nilai kosong tapi user name terupdate
          const valueToSave =
            hourValue !== null && hourValue !== undefined && hourValue !== ''
              ? String(hourValue)
              : null; // Kosongkan nilai jika belum ada data

          await updateParameterData(
            param.id,
            selectedDate,
            hour,
            valueToSave,
            userName,
            selectedUnit
          );
        });

        await Promise.all(updatePromises);
      } catch {
        // Error logging removed for production
        showToast('Error saving user name changes');
      }
    },
    [
      filteredParameterSettings,
      parameterDataMap,
      updateParameterData,
      selectedDate,
      selectedUnit,
      showToast,
    ]
  );

  const handleOpenAddDowntimeModal = () => {
    if (!selectedUnit) {
      showToast(t.select_unit_first);
      return;
    }
    setEditingDowntime(null);
    setDowntimeModalOpen(true);
  };

  const handleOpenEditDowntimeModal = (record: CcrDowntimeData) => {
    setEditingDowntime(record);
    setDowntimeModalOpen(true);
  };

  const handleSaveDowntime = async (
    record: CcrDowntimeData | Omit<CcrDowntimeData, 'id' | 'date'>
  ) => {
    try {
      let result;
      // Ensure time fields are in correct format (HH:MM)
      const formatTimeField = (time) => {
        if (!time) return '';
        return time.split(':').slice(0, 2).join(':'); // Ensure HH:MM format
      };

      if ('id' in record) {
        // Format time fields
        const formattedRecord = {
          ...record,
          start_time: formatTimeField(record.start_time),
          end_time: formatTimeField(record.end_time),
        };
        result = await updateDowntime(formattedRecord);
      } else {
        const newRecord = {
          ...record,
          date: selectedDate,
          start_time: formatTimeField(record.start_time),
          end_time: formatTimeField(record.end_time),
        };
        result = await addDowntime(newRecord);
      }

      if (result && !result.success) {
        alert(`Error saving downtime: ${result.error}`);
        return;
      }

      setDowntimeModalOpen(false);
      setEditingDowntime(null);

      // Force refresh data dengan multiple attempts untuk memastikan data muncul
      // Attempt 1: Refresh segera
      downtimeRefetch();

      // Attempt 2: Refresh setelah 500ms
      setTimeout(() => {
        downtimeRefetch();
      }, 500);

      // Attempt 3: Refresh setelah 1.5 detik
      setTimeout(() => {
        downtimeRefetch();
      }, 1500);
    } catch {
      alert('Failed to save downtime data. Please try again.');
    }
  };

  const handleOpenDeleteModal = (record: CcrDowntimeData) => {
    setDeletingRecord(record);
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

  // Keyboard navigation for delete modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDeleteModalOpen) return;

      if (event.key === 'Escape') {
        handleCloseDeleteModal();
      } else if (event.key === 'Enter') {
        // Focus is managed by button elements
        event.preventDefault();
      }
    };

    if (isDeleteModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the cancel button by default for safety
      setTimeout(() => {
        const cancelButton = document.querySelector(
          '[aria-label="Batalkan penghapusan"]'
        ) as HTMLElement;
        if (cancelButton) cancelButton.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDeleteModalOpen]);

  // Simple debounce function that returns a new debounced version of the passed function
  function createDebounce(func: (...args: unknown[]) => void, wait: number) {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: unknown[]) {
      const later = () => {
        timeout = null;
        func(...args);
      };

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }

  // Information change handler with debounced auto-save
  const saveInformationWithDebounce = useMemo(
    () =>
      createDebounce(async (value: string) => {
        if (!selectedDate || !selectedUnit || isSavingInformation) return;

        try {
          await saveInformation({
            date: selectedDate,
            plantUnit: selectedUnit,
            information: value,
          });
          // setHasUnsavedInformationChanges(false);
        } catch {
          // Error logging removed for production
          // Silently fail without showing a toast for auto-save
        }
      }, 3000), // 3 second debounce
    [selectedDate, selectedUnit, saveInformation, isSavingInformation]
  );

  // Information change handler with auto-save
  const handleInformationChange = useCallback(
    (value: string) => {
      setInformationText(value);
      // setHasUnsavedInformationChanges(true);
      saveInformationWithDebounce(value);
    },
    [saveInformationWithDebounce]
  );

  // Export to Excel functionality
  const handleExport = async () => {
    if (isExporting) return;

    if (
      !selectedCategory ||
      !selectedUnit ||
      !selectedDate ||
      filteredParameterSettings.length === 0
    ) {
      alert(
        'Please select a plant category, unit, and date with available parameters before exporting.'
      );
      return;
    }

    setIsExporting(true);
    try {
      // Refresh data before export to ensure we have the latest data
      console.log('Starting export process...');
      await refreshData();
      await downtimeRefetch();
      console.log('Data refreshed successfully');

      const workbook = new ExcelJS.Workbook();

      // Get downtime data directly from database
      console.log('Fetching downtime data...');
      const downtimeData = await pb
        .collection('ccr_downtime_data')
        .getFullList({
          filter: `date="${selectedDate}" && unit="${selectedUnit}"`,
          sort: 'start_time',
        })
        .catch((error) => {
          console.error('Error fetching downtime data:', error);
          return [];
        });
      console.log(`Fetched ${downtimeData.length} downtime records`);

      // Get footer data directly from database
      console.log('Fetching footer data...');
      const footerData = await pb
        .collection('ccr_footer_data')
        .getFullList({
          filter: `date="${selectedDate}"`,
          sort: 'created',
        })
        .catch((error) => {
          console.error('Error fetching footer data:', error);
          return [];
        });
      console.log(`Fetched ${footerData.length} footer records`);

      // Get silo data directly from database
      console.log('Fetching silo data...');
      const siloData = await pb
        .collection('ccr_silo_data')
        .getFullList({
          filter: `date="${selectedDate}"`,
          sort: 'silo_id',
          expand: 'silo_id',
        })
        .catch((error) => {
          console.error('Error fetching silo data:', error);
          return [];
        });
      console.log(`Fetched ${siloData.length} silo records`);

      // Get silo capacities for name lookup (fallback)
      console.log('Fetching silo capacities for name lookup...');
      const siloCapacities = await pb
        .collection('silo_capacities')
        .getFullList({
          sort: 'silo_name',
        })
        .catch((error) => {
          console.error('Error fetching silo capacities:', error);
          return [];
        });
      console.log(`Fetched ${siloCapacities.length} silo capacity records`);

      // Export Parameter Data
      if (filteredParameterSettings.length > 0) {
        const worksheetParam = workbook.addWorksheet('Parameter Data');

        // Create headers
        const paramHeaders = filteredParameterSettings.map((p) => p.parameter);
        const headers = ['Date', 'Hour', 'Shift', 'Unit', ...paramHeaders];
        worksheetParam.addRow(headers);

        // Create rows for each hour (1-24)
        for (let hour = 1; hour <= 24; hour++) {
          let shift = '';
          if (hour >= 1 && hour <= 7) shift = `${t.shift_3} (${t.shift_3_cont})`;
          else if (hour >= 8 && hour <= 15) shift = t.shift_1;
          else if (hour >= 16 && hour <= 22) shift = t.shift_2;
          else shift = t.shift_3;
          const rowData = [selectedDate, hour, shift, selectedUnit];

          // Add parameter values for this hour
          filteredParameterSettings.forEach((param) => {
            const paramData = parameterDataMap.get(param.id);

            // Convert flat structure to hourly_values object format for consistency
            const hourlyValues: Record<
              string,
              string | number | { value: string | number; user_name: string }
            > = {};

            // Build hourly_values from flat data
            for (let h = 1; h <= 24; h++) {
              const hourKey = `hour${h}` as keyof CcrParameterDataFlat;
              const userKey = `hour${h}_user` as keyof CcrParameterDataFlat;
              const value = paramData?.[hourKey];
              const userName = paramData?.[userKey] as string | undefined;

              if (value !== null && value !== undefined) {
                if (userName) {
                  hourlyValues[h.toString()] = {
                    value: value as string | number,
                    user_name: userName,
                  };
                } else {
                  hourlyValues[h.toString()] = value as string | number;
                }
              }
            }

            // Get value for current hour
            const hourValue = hourlyValues[hour.toString()];
            let paramValue = '';

            if (typeof hourValue === 'object' && hourValue !== null && 'value' in hourValue) {
              const rawVal = hourValue.value;
              const numVal = typeof rawVal === 'string' ? parseInputValue(rawVal) : rawVal;
              paramValue =
                param.data_type === ParameterDataType.NUMBER && numVal !== null
                  ? formatNumberWithPrecision(numVal, getPrecisionForUnit(param.unit))
                  : String(rawVal);
            } else if (typeof hourValue === 'string' || typeof hourValue === 'number') {
              const numVal = typeof hourValue === 'string' ? parseInputValue(hourValue) : hourValue;
              paramValue =
                param.data_type === ParameterDataType.NUMBER && numVal !== null
                  ? formatNumberWithPrecision(numVal, getPrecisionForUnit(param.unit))
                  : String(hourValue);
            }

            rowData.push(paramValue);
          });

          worksheetParam.addRow(rowData);
        }
      }

      // Get all parameter settings for footer data lookup
      const allParameterSettings = await pb
        .collection('parameter_settings')
        .getFullList({
          sort: 'parameter',
        })
        .catch((error) => {
          console.error('Error fetching all parameter settings:', error);
          return [];
        });

      // Export Footer Data
      if (footerData && footerData.length > 0) {
        const worksheetFooter = workbook.addWorksheet('Footer Data');

        // Add headers
        const footerHeaders = [
          'Date',
          'Parameter_Name',
          'Plant_Unit',
          'Total',
          'Average',
          'Minimum',
          'Maximum',
          'Shift1_Total',
          'Shift2_Total',
          'Shift3_Total',
        ];
        worksheetFooter.addRow(footerHeaders);

        // Transform footer data to export format and add rows
        const footerExportData = footerData.map((row) => {
          // Find parameter name from all parameter settings
          const parameter = allParameterSettings.find((p) => p.id === row.parameter_id);
          const parameterName = parameter ? parameter.parameter : row.parameter_id;

          return [
            row.date,
            parameterName,
            row.plant_unit || '',
            row.total !== undefined ? formatNumber(row.total) : '',
            row.average !== undefined ? formatNumber(row.average) : '',
            row.minimum !== undefined ? formatNumber(row.minimum) : '',
            row.maximum !== undefined ? formatNumber(row.maximum) : '',
            row.shift1_total !== undefined ? formatNumber(row.shift1_total) : '',
            row.shift2_total !== undefined ? formatNumber(row.shift2_total) : '',
            row.shift3_total !== undefined ? formatNumber(row.shift3_total) : '',
          ];
        });

        // Add data rows
        footerExportData.forEach((row) => worksheetFooter.addRow(row));
      }

      // Export Downtime Data
      console.log('Creating downtime data worksheet...');
      if (downtimeData && downtimeData.length > 0) {
        const worksheetDowntime = workbook.addWorksheet('Downtime Data');

        // Add headers
        const downtimeHeaders = ['Date', 'Start_Time', 'End_Time', 'Unit', 'PIC', 'Problem'];
        worksheetDowntime.addRow(downtimeHeaders);

        // Transform downtime data to export format and add rows
        const downtimeExportData = downtimeData.map((row) => [
          row.date,
          row.start_time,
          row.end_time,
          row.unit,
          row.pic,
          row.problem,
        ]);

        // Add data rows
        downtimeExportData.forEach((row) => worksheetDowntime.addRow(row));
      }

      // Export Silo Data
      if (siloData && siloData.length > 0) {
        // Filter silo data by selected unit
        // First check if 'plant_unit' field exists in data (newer schema)
        // If not, rely on the fact that existing siloData query might not be unit-specific enough or check expand data

        const filteredSiloData = siloData.filter((row) => {
          // Check explicit unit field if available
          if (row.plant_unit && row.plant_unit === selectedUnit) return true;

          // Check expanded relation
          if (row.expand?.silo_id?.unit === selectedUnit) return true;

          // Check fallback to master data
          const masterSilo = siloCapacities.find((s) => s.id === row.silo_id);
          if (masterSilo && masterSilo.unit === selectedUnit) return true;

          // If no unit info found but we are filtering by unit, be conservative or check if legacy data
          // For now, if no unit info is found on the record, we assume it matches if we filtered the Fetch query correctly
          // But since the Fetch query above was `filter: date="${selectedDate}"`, it fetched all units.
          // So we MUST filter here.
          return false;
        });

        if (filteredSiloData.length > 0) {
          const worksheetSilo = workbook.addWorksheet('Silo Data');

          // Add headers
          const siloHeaders = [
            'Date',
            'Silo_Name',
            'Shift1_EmptySpace',
            'Shift1_Content',
            'Shift2_EmptySpace',
            'Shift2_Content',
            'Shift3_EmptySpace',
            'Shift3_Content',
          ];
          worksheetSilo.addRow(siloHeaders);

          // Transform silo data to export format and add rows
          const siloExportData = filteredSiloData.map((row) => {
            // Get silo name from expanded relation or fallback to lookup
            const siloName =
              row.expand?.silo_id?.silo_name ||
              siloCapacities.find((s) => s.id === row.silo_id)?.silo_name ||
              row.silo_id;

            return [
              row.date,
              siloName,
              row.shift1_empty_space !== undefined ? formatNumber(row.shift1_empty_space) : '',
              row.shift1_content !== undefined ? formatNumber(row.shift1_content) : '',
              row.shift2_empty_space !== undefined ? formatNumber(row.shift2_empty_space) : '',
              row.shift2_content !== undefined ? formatNumber(row.shift2_content) : '',
              row.shift3_empty_space !== undefined ? formatNumber(row.shift3_empty_space) : '',
              row.shift3_content !== undefined ? formatNumber(row.shift3_content) : '',
            ];
          });

          // Add data rows
          siloExportData.forEach((row) => worksheetSilo.addRow(row));
        }
      }

      // Export Material Usage Data
      console.log('Fetching material usage data...');
      const materialUsageData = await pb
        .collection('ccr_material_usage')
        .getFullList({
          filter: `date="${selectedDate}" && plant_unit="${selectedUnit}"`,
          sort: 'created',
        })
        .catch((error) => {
          console.error('Error fetching material usage data:', error);
          return [];
        });

      if (materialUsageData && materialUsageData.length > 0) {
        const worksheetMaterial = workbook.addWorksheet('Material Usage');

        // Add headers
        const materialHeaders = [
          'Date',
          'Unit',
          'Shift',
          'Clinker',
          'Gypsum',
          'Limestone',
          'Trass',
          'Fly Ash',
          'Fine Trass',
          'CKD',
          'Total Production',
        ];
        worksheetMaterial.addRow(materialHeaders);

        // Transform data
        const materialExportData = materialUsageData.map((row) => [
          row.date,
          row.plant_unit,
          row.shift,
          row.clinker !== undefined ? formatNumber(row.clinker) : '0',
          row.gypsum !== undefined ? formatNumber(row.gypsum) : '0',
          row.limestone !== undefined ? formatNumber(row.limestone) : '0',
          row.trass !== undefined ? formatNumber(row.trass) : '0',
          row.fly_ash !== undefined ? formatNumber(row.fly_ash) : '0',
          row.fine_trass !== undefined ? formatNumber(row.fine_trass) : '0',
          row.ckd !== undefined ? formatNumber(row.ckd) : '0',
          row.total_production !== undefined ? formatNumber(row.total_production) : '0',
        ]);

        // Add rows
        materialExportData.forEach((row) => worksheetMaterial.addRow(row));

        // Calculate Totals
        const totalRow = {
          clinker: 0,
          gypsum: 0,
          limestone: 0,
          trass: 0,
          fly_ash: 0,
          fine_trass: 0,
          ckd: 0,
          total_production: 0,
        };

        materialUsageData.forEach((row) => {
          totalRow.clinker += row.clinker || 0;
          totalRow.gypsum += row.gypsum || 0;
          totalRow.limestone += row.limestone || 0;
          totalRow.trass += row.trass || 0;
          totalRow.fly_ash += row.fly_ash || 0;
          totalRow.fine_trass += row.fine_trass || 0;
          totalRow.ckd += row.ckd || 0;
          totalRow.total_production += row.total_production || 0;
        });

        // Add Footer Row (Empty line then Total)
        worksheetMaterial.addRow([]); // Empty row for separation
        const footerRow = worksheetMaterial.addRow([
          'TOTAL',
          '',
          '',
          formatNumber(totalRow.clinker),
          formatNumber(totalRow.gypsum),
          formatNumber(totalRow.limestone),
          formatNumber(totalRow.trass),
          formatNumber(totalRow.fly_ash),
          formatNumber(totalRow.fine_trass),
          formatNumber(totalRow.ckd),
          formatNumber(totalRow.total_production),
        ]);

        // Style the footer row
        footerRow.font = { bold: true };
        footerRow.getCell(1).alignment = { horizontal: 'left' };
      }

      // Export Information Data
      const worksheetInfo = workbook.addWorksheet('Information');
      worksheetInfo.addRow(['Date', 'Unit', 'Information']);
      worksheetInfo.addRow([selectedDate, selectedUnit, informationText || '']);

      // Generate filename with category, unit, and date
      const safeSelectedDate = selectedDate || new Date().toISOString().split('T')[0];
      const filename = `CCR_Data_${selectedCategory}_${selectedUnit}_${safeSelectedDate}.xlsx`;

      // Write file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurerror';
      showToast(`Error exporting CCR parameter data: ${errorMessage}`);
      alert(`An error occurerror while exporting data: ${errorMessage}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Excel Template functionality
  const handleDownloadTemplate = async () => {
    if (!selectedCategory || !selectedUnit || filteredParameterSettings.length === 0) {
      alert(
        'Please select a plant category and unit with available parameters before downloading template.'
      );
      return;
    }

    setIsDownloadingTemplate(true);
    try {
      const workbook = new ExcelJS.Workbook();

      // Parameter Data Template
      const worksheetParam = workbook.addWorksheet('Parameter Data');

      // Create headers
      const paramHeaders = filteredParameterSettings.map((p) => p.parameter);
      const headers = ['Date', 'Hour', 'Shift', 'Unit', ...paramHeaders];
      worksheetParam.addRow(headers);

      // Add rows for each hour (1-24) with shift information
      for (let hour = 1; hour <= 24; hour++) {
        let shift = '';
        if (hour >= 1 && hour <= 7) shift = 'Shift 3 (Shift 3 Cont)';
        else if (hour >= 8 && hour <= 15) shift = 'Shift 1';
        else if (hour >= 16 && hour <= 22) shift = 'Shift 2';
        else shift = 'Shift 3';

        const rowData = [new Date().toISOString().split('T')[0], hour, shift, selectedUnit];

        // Add empty cells for parameters
        filteredParameterSettings.forEach(() => {
          rowData.push(''); // Empty value for parameter
        });

        worksheetParam.addRow(rowData);
      }

      // Add note about date format
      worksheetParam.addRow([]);
      worksheetParam.addRow(['Note:']);
      worksheetParam.addRow(['- Date format: YYYY-MM-DD']);
      worksheetParam.addRow(['- Hour: 1-24']);
      worksheetParam.addRow(['- Unit: Must match selected unit']);

      // Footer Data Template
      const worksheetFooter = workbook.addWorksheet('Footer Data');
      worksheetFooter.addRow([
        'Date',
        'Unit',
        'Target_Production',
        'Next_Shift_PIC',
        'Handover_Notes',
      ]);
      worksheetFooter.addRow([new Date().toISOString().split('T')[0], selectedUnit, '', '', '']);

      // Downtime Data Template
      const worksheetDowntime = workbook.addWorksheet('Downtime Data');
      worksheetDowntime.addRow([
        'Date',
        'Start_Time',
        'End_Time',
        'Unit',
        'PIC',
        'Problem',
        'Action',
        'Corrective_Action',
        'Status',
      ]);
      worksheetDowntime.addRow([
        new Date().toISOString().split('T')[0],
        '08:00',
        '09:00',
        selectedUnit,
        '',
        'Example problem',
        '',
        '',
        'Open',
      ]);

      // Silo Data Template
      const worksheetSilo = workbook.addWorksheet('Silo Data');
      worksheetSilo.addRow([
        'Date',
        'Silo_ID',
        'Shift1_EmptySpace',
        'Shift1_Content',
        'Shift2_EmptySpace',
        'Shift2_Content',
        'Shift3_EmptySpace',
        'Shift3_Content',
      ]);
      worksheetSilo.addRow([
        new Date().toISOString().split('T')[0],
        'SILO-001',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `CCR_Template_${selectedUnit}_${timestamp}.xlsx`;

      // Write file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast('Template downloaded successfully');
    } catch {
      // Error logging removed for production
      showToast('Error creating Excel template');
      alert('An error occurerror while creating the template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Import from Excel functionality
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      logger.debug('No file selected for import');
      return;
    }

    logger.debug('Starting Excel import', {
      fileName: file.name,
      fileSize: file.size,
      category: selectedCategory,
      unit: selectedUnit,
    });

    if (!selectedCategory || !selectedUnit) {
      alert('Please select a plant category and unit before importing.');
      return;
    }

    setIsImporting(true);
    const allParameterChanges: Array<{
      paramId: string;
      hour: number;
      value: string;
      userName?: string;
    }> = [];
    try {
      logger.debug('Reading Excel file...');
      const arrayBuffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      logger.debug(
        'Workbook loaded with worksheets: ' + workbook.worksheets.map((ws) => ws.name).join(', ')
      );

      let importCount = 0;
      const errorMessages: string[] = [];

      // Import Parameter Data
      const paramWorksheet = workbook.getWorksheet('Parameter Data');
      if (paramWorksheet) {
        // Debug logging removed for production
        try {
          const paramData: Record<string, unknown>[] = [];
          let paramHeaders: string[] = [];

          paramWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              // Skip the first column if it's empty (common Excel template issue)
              const rawHeaders = (row.values as CellValue[])
                .slice(1)
                .map((v) => String(v || '').trim());
              paramHeaders = rawHeaders.filter((h) => h !== ''); // Remove any remaining empty headers
              // Debug logging removed for production
            } else {
              const rowData: Record<string, unknown> = {};
              // Skip the first column when reading data
              const dataValues = (row.values as CellValue[]).slice(1);
              paramHeaders.forEach((header, index) => {
                rowData[header] = dataValues[index];
              });
              paramData.push(rowData);
            }
          });
          // Debug logging removed for production
          if (paramData.length > 0) {
            // Debug logging removed for production
            // Validate data structure and filter out invalid rows (likely summary/empty rows)
            const requierrorFields = ['Date', 'Hour', 'Unit'];
            const validParamData = paramData.filter((row, _index) => {
              const missingFields = requierrorFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                // Debug logging removed for production
                return false; // Skip this row
              }
              return true; // Keep this row
            });

            // Debug logging removed for production

            if (validParamData.length === 0) {
              // Debug logging removed for production
              errorMessages.push(
                'Parameter Data: No valid data rows found (all rows appear to be summary or empty rows)'
              );
            } else {
              // Debug logging removed for production
              // Process valid data
              for (const row of validParamData) {
                const hour = Number(row.Hour);
                // Console statement removed for production

                // Get all parameter columns (exclude Date, Hour, Unit, Shift and user columns)
                const allColumns = Object.keys(row).filter(
                  (key) => !['Date', 'Hour', 'Unit', 'Shift'].includes(key)
                );

                // Separate value columns and user columns
                const parameterColumns = allColumns.filter((key) => !key.endsWith('_User'));

                console.log(
                  '🔍 DEBUG: Found parameter columns:',
                  parameterColumns.length,
                  'for hour:',
                  hour
                );

                // Collect all changes for bulk processing
                const batchChanges: Array<{
                  paramId: string;
                  hour: number;
                  value: string;
                  userName?: string;
                }> = [];

                // For each parameter column with a value, collect the data
                for (const paramName of parameterColumns) {
                  const value = row[paramName];
                  const userColumn = `${paramName}_User`;
                  const userName = row[userColumn] ? String(row[userColumn]) : undefined;

                  if (value !== undefined && value !== null && value !== '') {
                    console.log(
                      '🔍 DEBUG: Processing parameter:',
                      paramName,
                      'value:',
                      value,
                      'user:',
                      userName
                    );
                    // Find parameter settings to get parameter_id
                    const paramSetting = filteredParameterSettings.find(
                      (p) => p.parameter === paramName
                    );
                    if (paramSetting) {
                      console.log(
                        '🔍 DEBUG: Found parameter setting for:',
                        paramName,
                        'id:',
                        paramSetting.id
                      );
                      batchChanges.push({
                        paramId: paramSetting.id,
                        hour,
                        value: String(value),
                        userName,
                      });
                    } else {
                      // Console statement removed for production
                      errorMessages.push(
                        `Parameter "${paramName}" not found in parameter settings for unit ${selectedUnit}`
                      );
                    }
                  }
                }

                console.log(
                  '🔍 DEBUG: Collected batch changes for hour',
                  hour,
                  'count:',
                  batchChanges.length
                );

                // Instead of processing in small batches, collect all changes for the entire import
                allParameterChanges.push(...batchChanges);
              }
            }
          }
        } catch (err) {
          // Console statement removed for production
          errorMessages.push(
            `Parameter Data import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else {
        // Console statement removed for production
      }

      // Perform bulk save for all collected parameter changes
      if (allParameterChanges.length > 0) {
        // Console statement removed for production
        try {
          const savedCount = await bulkSaveParameterChanges(allParameterChanges);
          importCount += savedCount;
          // Console statement removed for production
        } catch (err) {
          // Console statement removed for production
          errorMessages.push(
            `Bulk save failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      // Import Footer Data
      const footerWorksheet = workbook.getWorksheet('Footer Data');
      if (footerWorksheet) {
        // Console statement removed for production
        try {
          const footerData: Record<string, unknown>[] = [];
          let footerHeaders: string[] = [];

          footerWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              // Skip the first column if it's empty
              const rawHeaders = (row.values as CellValue[])
                .slice(1)
                .map((v) => String(v || '').trim());
              footerHeaders = rawHeaders.filter((h) => h !== '');
              console.log(
                '🔍 DEBUG: Footer headers found (skipping empty first column):',
                footerHeaders
              );
            } else {
              const rowData: Record<string, unknown> = {};
              // Skip the first column when reading data
              const dataValues = (row.values as CellValue[]).slice(1);
              footerHeaders.forEach((header, index) => {
                rowData[header] = dataValues[index];
              });
              footerData.push(rowData);
            }
          });
          // Console statement removed for production
          if (footerData.length > 0) {
            // Console statement removed for production
            // Validate data structure
            const requierrorFields = ['Date', 'Unit'];
            const invalidRows = footerData.filter((row, index) => {
              const missingFields = requierrorFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid footer row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Footer Data row ${index + 2}: Missing requierror fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            console.log(
              '🔍 DEBUG: Footer validation complete, invalid rows:',
              invalidRows.length,
              'valid rows:',
              footerData.length - invalidRows.length
            );

            if (invalidRows.length === 0) {
              console.log(
                '🔍 DEBUG: Footer data appears to be shift handover information, not parameter summary data'
              );
              console.log(
                '⚠️ DEBUG: Skipping footer data import - shift handover data import not implemented yet'
              );
              // Footer data in Excel template contains shift handover information (Target_Production, Next_Shift_PIC, Handover_Notes)
              // This is different from parameter summary data expected by saveFooterData function
              // For now, skip processing footer data
              errorMessages.push(
                'Footer Data: Shift handover data import not implemented yet (contains Target_Production, Next_Shift_PIC, Handover_Notes)'
              );
            }
          }
        } catch (err) {
          // Console statement removed for production
          errorMessages.push(
            `Footer Data import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else {
        // Console statement removed for production
      }

      // Import Downtime Data
      const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
      if (downtimeWorksheet) {
        // Console statement removed for production
        try {
          const downtimeData: Record<string, unknown>[] = [];
          let downtimeHeaders: string[] = [];

          downtimeWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              // Skip the first column if it's empty
              const rawHeaders = (row.values as CellValue[])
                .slice(1)
                .map((v) => String(v || '').trim());
              downtimeHeaders = rawHeaders.filter((h) => h !== '');
              console.log(
                '🔍 DEBUG: Downtime headers found (skipping empty first column):',
                downtimeHeaders
              );
            } else {
              const rowData: Record<string, unknown> = {};
              // Skip the first column when reading data
              const dataValues = (row.values as CellValue[]).slice(1);
              downtimeHeaders.forEach((header, index) => {
                rowData[header] = dataValues[index];
              });
              downtimeData.push(rowData);
            }
          });
          // Console statement removed for production
          if (downtimeData.length > 0) {
            // Console statement removed for production
            // Validate data structure - make PIC optional for import
            const requierrorFields = ['Date', 'Start_Time', 'End_Time', 'Unit', 'Problem'];
            const invalidRows = downtimeData.filter((row, index) => {
              const missingFields = requierrorFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid downtime row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Downtime Data row ${index + 2}: Missing requierror fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              // Check if PIC is empty - warn but don't fail validation
              if (!row.PIC || String(row.PIC).trim() === '') {
                console.warn(
                  '⚠️ DEBUG: Downtime row',
                  index + 2,
                  'has empty PIC field, will use default value'
                );
              }
              return false;
            });

            console.log(
              '🔍 DEBUG: Downtime validation complete, invalid rows:',
              invalidRows.length,
              'valid rows:',
              downtimeData.length - invalidRows.length
            );

            if (invalidRows.length === 0) {
              // Console statement removed for production
              // Collect unique dates from import data
              const importDates = [...new Set(downtimeData.map((row) => String(row.Date)))];
              // Console statement removed for production

              // Delete existing downtime data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  // Console statement removed for production
                  // Delete existing downtime data for import dates
                  const existingRecords = await pb.collection('ccr_downtime_data').getFullList({
                    filter: importDates.map((date) => `date="${date}"`).join(' || '),
                  });
                  console.log(
                    '🔍 DEBUG: Found',
                    existingRecords.length,
                    'existing downtime records to delete'
                  );

                  for (const record of existingRecords) {
                    // Console statement removed for production
                    await pb.collection('ccr_downtime_data').delete(record.id);
                  }

                  showToast(`Deleted existing downtime data for dates: ${importDates.join(', ')}`);
                  // Refresh downtime data to reflect changes
                  downtimeRefetch();
                  // Console statement removed for production
                } catch (err) {
                  // Console statement removed for production
                  errorMessages.push(
                    `Error deleting existing downtime data: ${err instanceof Error ? err.message : 'Unknown error'}`
                  );
                }
              }

              // Process valid data
              for (const row of downtimeData) {
                try {
                  console.log(
                    '🔍 DEBUG: Processing downtime row for date:',
                    row.Date,
                    'PIC:',
                    row.PIC
                  );
                  const downtimeObj = {
                    date: String(row.Date),
                    start_time: String(row.Start_Time),
                    end_time: String(row.End_Time),
                    unit: String(row.Unit),
                    pic: String(row.PIC).trim() || 'Unknown', // Use 'Unknown' as default if PIC is empty
                    problem: String(row.Problem),
                    action: row.Action ? String(row.Action) : undefined,
                    corrective_action: row.Corrective_Action
                      ? String(row.Corrective_Action)
                      : undefined,
                    status:
                      row.Status && (row.Status === 'Open' || row.Status === 'Close')
                        ? (row.Status as DowntimeStatus)
                        : DowntimeStatus.OPEN,
                  };

                  // Console statement removed for production
                  const result = await addDowntime(downtimeObj);

                  if (result.success) {
                    importCount++;
                    console.log(
                      '✅ DEBUG: Downtime data saved successfully, total count:',
                      importCount
                    );
                  } else {
                    // Console statement removed for production
                    errorMessages.push(
                      `Failed to save downtime data for ${row.Date}: ${result.error}`
                    );
                  }
                } catch (err) {
                  // Console statement removed for production
                  errorMessages.push(
                    `Failed to save downtime data for ${row.Date}: ${err instanceof Error ? err.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (err) {
          // Console statement removed for production
          errorMessages.push(
            `Downtime Data import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else {
        // Console statement removed for production
      }

      // Import Silo Data
      const siloWorksheet = workbook.getWorksheet('Silo Data');
      if (siloWorksheet) {
        // Console statement removed for production
        try {
          const siloData: Record<string, unknown>[] = [];
          let siloHeaders: string[] = [];

          siloWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              // Skip the first column if it's empty
              const rawHeaders = (row.values as CellValue[])
                .slice(1)
                .map((v) => String(v || '').trim());
              siloHeaders = rawHeaders.filter((h) => h !== '');
              console.log(
                '🔍 DEBUG: Silo headers found (skipping empty first column):',
                siloHeaders
              );
            } else {
              const rowData: Record<string, unknown> = {};
              // Skip the first column when reading data
              const dataValues = (row.values as CellValue[]).slice(1);
              siloHeaders.forEach((header, index) => {
                rowData[header] = dataValues[index];
              });
              siloData.push(rowData);
            }
          });
          // Console statement removed for production
          if (siloData.length > 0) {
            // Console statement removed for production
            // Validate data structure
            const requierrorFields = ['Date', 'Silo_ID'];
            const invalidRows = siloData.filter((row, index) => {
              const missingFields = requierrorFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid silo row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Silo Data row ${index + 2}: Missing requierror fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            console.log(
              '🔍 DEBUG: Silo validation complete, invalid rows:',
              invalidRows.length,
              'valid rows:',
              siloData.length - invalidRows.length
            );

            if (invalidRows.length === 0) {
              // Console statement removed for production
              // Collect unique dates from import data
              const importDates = [...new Set(siloData.map((row) => String(row.Date)))];
              // Console statement removed for production

              // Delete existing silo data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  // Console statement removed for production
                  // Delete existing silo data for import dates
                  const existingRecords = await pb.collection('ccr_silo_data').getFullList({
                    filter: importDates.map((date) => `date="${date}"`).join(' || '),
                  });
                  console.log(
                    '🔍 DEBUG: Found',
                    existingRecords.length,
                    'existing silo records to delete'
                  );

                  for (const record of existingRecords) {
                    // Console statement removed for production
                    await pb.collection('ccr_silo_data').delete(record.id);
                  }

                  // Refresh silo data to reflect changes
                  getSiloDataForDate(selectedDate).then((data) => {
                    setAllDailySiloData(data);
                  });
                  // Console statement removed for production
                } catch (err) {
                  // Console statement removed for production
                  errorMessages.push(
                    `Error deleting existing silo data: ${err instanceof Error ? err.message : 'Unknown error'}`
                  );
                }
              }

              // Process valid data
              for (const row of siloData) {
                try {
                  const siloId = String(row.Silo_ID);
                  const date = String(row.Date);
                  // Console statement removed for production

                  // Prepare shift data
                  const shift1 = {
                    emptySpace: row.Shift1_EmptySpace ? Number(row.Shift1_EmptySpace) : undefined,
                    content: row.Shift1_Content ? Number(row.Shift1_Content) : undefined,
                  };
                  const shift2 = {
                    emptySpace: row.Shift2_EmptySpace ? Number(row.Shift2_EmptySpace) : undefined,
                    content: row.Shift2_Content ? Number(row.Shift2_Content) : undefined,
                  };
                  const shift3 = {
                    emptySpace: row.Shift3_EmptySpace ? Number(row.Shift3_EmptySpace) : undefined,
                    content: row.Shift3_Content ? Number(row.Shift3_Content) : undefined,
                  };

                  console.log(
                    '🔍 DEBUG: Shift data prepaerror - Shift1:',
                    shift1,
                    'Shift2:',
                    shift2,
                    'Shift3:',
                    shift3
                  );

                  // Check if all shift data is empty
                  const isEmpty = [shift1, shift2, shift3].every(
                    (shift) => !shift.emptySpace && !shift.content
                  );

                  // Console statement removed for production

                  if (!isEmpty) {
                    // Console statement removed for production
                    // Update silo data for each shift if data exists
                    if (shift1.emptySpace !== undefined || shift1.content !== undefined) {
                      try {
                        // Console statement removed for production
                        await updateSiloData(
                          date,
                          siloId,
                          'shift1',
                          'emptySpace',
                          shift1.emptySpace
                        );
                        await updateSiloData(date, siloId, 'shift1', 'content', shift1.content);
                        // Console statement removed for production
                      } catch (err) {
                        // Console statement removed for production
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift1 for ${date}: ${err instanceof Error ? err.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift2.emptySpace !== undefined || shift2.content !== undefined) {
                      try {
                        // Console statement removed for production
                        await updateSiloData(
                          date,
                          siloId,
                          'shift2',
                          'emptySpace',
                          shift2.emptySpace
                        );
                        await updateSiloData(date, siloId, 'shift2', 'content', shift2.content);
                        // Add small delay to prevent rate limiting
                        await new Promise((resolve) => setTimeout(resolve, 50));
                        // Console statement removed for production
                      } catch (err) {
                        // Console statement removed for production
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift2 for ${date}: ${err instanceof Error ? err.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift3.emptySpace !== undefined || shift3.content !== undefined) {
                      try {
                        // Console statement removed for production
                        await updateSiloData(
                          date,
                          siloId,
                          'shift3',
                          'emptySpace',
                          shift3.emptySpace
                        );
                        await updateSiloData(date, siloId, 'shift3', 'content', shift3.content);
                        // Add small delay to prevent rate limiting
                        await new Promise((resolve) => setTimeout(resolve, 50));
                        // Console statement removed for production
                      } catch (err) {
                        // Console statement removed for production
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift3 for ${date}: ${err instanceof Error ? err.message : 'Unknown error'}`
                        );
                      }
                    }

                    importCount++;
                    console.log(
                      '✅ DEBUG: Silo data processing completed, total count:',
                      importCount
                    );
                  } else {
                    // Console statement removed for production
                  }
                } catch (err) {
                  console.error(
                    '❌ DEBUG: Failed to save silo data for',
                    row.Date,
                    'silo',
                    row.Silo_ID,
                    ':',
                    err
                  );
                  errorMessages.push(
                    `Failed to save silo data for ${row.Date} silo ${row.Silo_ID}: ${err instanceof Error ? err.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (err) {
          // Console statement removed for production
          errorMessages.push(
            `Silo Data import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      } else {
        // Console statement removed for production
      }

      // Show results
      // Console statement removed for production
      // Console statement removed for production
      // Console statement removed for production

      if (importCount > 0) {
        // Console statement removed for production
        alert(`Successfully imported ${importCount} records to the database.`);
      }

      if (errorMessages.length > 0) {
        // Console statement removed for production
        alert(`Import validation completed with errors:\n${errorMessages.join('\n')}`);
      }

      if (importCount === 0 && errorMessages.length === 0) {
        // Console statement removed for production
        alert('No data was imported. Please check your Excel file format.');
      }
    } catch {
      // Console statement removed for production
      alert('Error processing Excel file. Please check the file format and try again.');
    } finally {
      // Console statement removed for production
      setIsImporting(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return `${t.shift_3} (${t.shift_3_cont})`;
    if (h >= 8 && h <= 15) return t.shift_1;
    if (h >= 16 && h <= 22) return t.shift_2;
    return t.shift_3;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/10 to-secondary-600/10 rounded-full blur-3xl dark:from-primary-400/5 dark:to-secondary-600/5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary-400/10 to-primary-600/10 rounded-full blur-3xl dark:from-secondary-400/5 dark:to-primary-600/5"></div>
      </div>

      <div className="relative space-y-6 p-4 lg:p-8">
        {/* Enhanced Header Section with Indigo/Slate Theme */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Title Card - Indigo Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-lg">
                <svg
                  className="w-7 h-7 text-indigo-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {t.op_ccr_data_entry}
                </h2>
                <p className="text-sm text-indigo-200/80 font-medium mt-0.5">
                  {t.ccr_page_description}
                </p>
              </div>
            </div>

            {/* Error Alert - Inside Title Card */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 bg-red-50/95 backdrop-blur-md border border-red-300/50 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                    <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Filter Card - White Background */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/60 p-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Plant Category */}
              <div className="flex-1 min-w-[200px]">
                <label
                  htmlFor="ccr-category"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  {t.plant_category_label}
                </label>
                <div className="relative">
                  <select
                    id="ccr-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                  >
                    <option value="">-- {t.choose_category} --</option>
                    {plantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Unit Name */}
              <div className="flex-1 min-w-[200px]">
                <label
                  htmlFor="ccr-unit"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {t.unit_label}
                </label>
                <div className="relative">
                  <select
                    id="ccr-unit"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={unitsForCategory.length === 0}
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                  >
                    <option value="">-- {t.choose_unit} --</option>
                    {unitsForCategory.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Select Date */}
              <div className="flex-1 min-w-[180px]">
                <label
                  htmlFor="ccr-date"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {t.select_date}
                </label>
                <div className="relative group/rkc-date">
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium flex items-center justify-between group-hover/rkc-date:border-slate-300 transition-all duration-200">
                    <span>
                      {selectedDate
                        ? formatDate(new Date(selectedDate), 'dd/MM/yyyy')
                        : '--/--/----'}
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="date"
                    id="ccr-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer zi-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Parameter Data Table */}
        <EnhancedCard className="backdrop-blur-md bg-white/60 border border-white/40 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent truncate">
                  {t.ccr_parameter_data_entry_title}
                </h3>
                <p className="text-sm text-neutral-600 mt-1 truncate">
                  {t.ccr_parameter_section_description}
                </p>
              </div>
            </div>

            {/* Enhanced Table Controls */}
            {/* Controls Toolbar */}
            <div className="flex flex-col gap-2 w-full lg:w-auto items-end">
              {/* Primary Actions Row */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Visual Controls Group */}
                <div className="flex items-center p-1 bg-white/50 rounded-lg border border-neutral-200/50 shadow-sm backdrop-blur-sm">
                  {/* Refresh Button */}
                  <div className="relative group/tooltip">
                    <Button
                      size="sm"
                      onClick={refreshData}
                      disabled={isRefreshing || !selectedCategory || !selectedUnit}
                      variant="ghost"
                      className="h-9 px-3 text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Refresh Data"
                    >
                      <div
                        className={`transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </div>
                    </Button>
                    {/* Last Updated Tooltip */}
                    {lastRefreshTime && (
                      <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-50 px-2 py-1 text-xs text-white bg-neutral-800 rounded shadow-lg whitespace-nowrap">
                        Updated:{' '}
                        {formatToWITA(new Date(lastRefreshTime), {
                          includeDate: false,
                          includeTime: true,
                        })}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-neutral-300 mx-1"></div>

                  {/* Show/Hide Footer */}
                  <Button
                    size="sm"
                    onClick={() => setIsFooterVisible(!isFooterVisible)}
                    variant="ghost"
                    className={`h-9 px-3 ${isFooterVisible ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-neutral-600 hover:bg-neutral-100'}`}
                    title={isFooterVisible ? 'Hide Footer' : 'Show Footer'}
                  >
                    <span className="text-sm mr-2">Footer</span>
                    {isFooterVisible ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </Button>

                  <div className="w-px h-4 bg-neutral-300 mx-1"></div>

                  {/* Reorder Parameters */}
                  <Button
                    size="sm"
                    onClick={() => setShowReorderModal(true)}
                    disabled={
                      !selectedCategory || !selectedUnit || filteredParameterSettings.length === 0
                    }
                    variant="ghost"
                    className="h-9 px-3 text-neutral-600 hover:text-violet-600 hover:bg-violet-50"
                    title="Reorder Parameters"
                  >
                    <span className="text-sm mr-2">Reorder</span>
                    <ArrowsUpDownIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* AI Features Group */}
                {hasPermission('rkc_plant_operations', 'create') && selectedUnit && (
                  <div className="flex items-center gap-2">
                    {/* AI Parameter Optimization */}
                    <OptimizationAdvisorButton
                      unit={selectedUnit}
                      className="h-9 text-sm px-3 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-md"
                    />

                    {/* AI Shift Report */}
                    {selectedDate && (
                      <ShiftHandoverButton
                        date={selectedDate}
                        unit={selectedUnit}
                        className="h-9 text-sm px-3 shadow-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:shadow-md"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Secondary Actions Row (Excel & Admin) */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Excel Operations Group */}
                {hasPermission('rkc_plant_operations', 'READ') && (
                  <div className="flex items-center bg-white rounded-lg border border-neutral-200/50 shadow-sm overflow-hidden">
                    {/* Import */}
                    {hasPermission('rkc_plant_operations', 'WRITE') && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImport}
                          accept=".xlsx, .xls"
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isImporting || !selectedCategory || !selectedUnit}
                          variant="ghost"
                          className="h-8 px-3 rounded-none border-r border-neutral-100 text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Import Excel"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                          <span className="text-xs font-medium">Import</span>
                        </Button>
                      </>
                    )}

                    {/* Template */}
                    <Button
                      size="sm"
                      onClick={handleDownloadTemplate}
                      disabled={
                        isDownloadingTemplate ||
                        !selectedCategory ||
                        !selectedUnit ||
                        filteredParameterSettings.length === 0
                      }
                      variant="ghost"
                      className="h-8 px-3 rounded-none border-r border-neutral-100 text-neutral-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Download Template"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      <span className="text-xs font-medium">Template</span>
                    </Button>

                    {/* Export */}
                    <Button
                      size="sm"
                      onClick={handleExport}
                      disabled={
                        isExporting ||
                        !selectedCategory ||
                        !selectedUnit ||
                        filteredParameterSettings.length === 0
                      }
                      variant="ghost"
                      className="h-8 px-3 rounded-none text-neutral-600 hover:text-teal-700 hover:bg-teal-50"
                      title="Export Excel"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      <span className="text-xs font-medium">Export</span>
                    </Button>
                  </div>
                )}

                {/* Admin Destructive Actions */}
                {isSuperAdmin(loggedInUser?.role) && (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200">
                    <Button
                      size="sm"
                      onClick={deleteAllParameters}
                      disabled={
                        isDeletingAll ||
                        !selectedCategory ||
                        !selectedUnit ||
                        dailyParameterData.length === 0
                      }
                      variant="ghost"
                      className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                      title="Delete All Data"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete Data
                    </Button>
                    <Button
                      size="sm"
                      onClick={deleteAllNames}
                      disabled={
                        isDeletingAllNames ||
                        !selectedCategory ||
                        !selectedUnit ||
                        dailyParameterData.length === 0
                      }
                      variant="ghost"
                      className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                      title="Delete All Names"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Delete Names
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parameter Data Table Card */}
          {/* Column Search Filter */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">{t.ccr_search_columns}:</span>
              <div className="relative ccr-column-search">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -tranneutral-y-1/2 w-4 h-4 text-neutral-400 ccr-column-search-icon" />
                <input
                  type="text"
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  placeholder={t.ccr_search_placeholder}
                  className="pl-10 pr-12 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150"
                  style={{ width: '320px' }}
                  autoComplete="off"
                  title={t.search_columns_tooltip}
                />
                {columnSearchQuery && (
                  <EnhancedButton
                    variant="ghost"
                    size="xs"
                    onClick={clearColumnSearch}
                    className="absolute right-3 top-1/2 transform -tranneutral-y-1/2"
                    aria-label={t.ccr_clear_search || 'Clear search'}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </EnhancedButton>
                )}
                <div className="absolute right-2 top-full mt-1 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ctrl+F to focus
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSearchActive && (
                <div className="ccr-search-results-indicator">
                  {filteredParameterSettings.length}{' '}
                  {filteredParameterSettings.length === 1
                    ? t.ccr_search_results
                    : t.ccr_search_results_plural}
                </div>
              )}
              {isSearchActive && filteredParameterSettings.length === 0 && (
                <div className="text-sm text-warning-600 font-medium">{t.ccr_no_columns_match}</div>
              )}
              {isSearchActive && (
                <EnhancedButton
                  variant="ghost"
                  size="xs"
                  onClick={clearColumnSearch}
                  className="text-primary-600 hover:text-primary-800 transition-colors font-medium"
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
              className="ccr-table-container overflow-x-auto overflow-y-auto max-h-[600px]"
              role="grid"
              aria-label="Parameter Data Entry Table"
            >
              {/* Scrollable Table Content */}
              <div className="ccr-table-wrapper min-w-[800px]" ref={tableWrapperRef}>
                <table
                  className="ccr-table"
                  role="grid"
                  style={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '180px' }} />
                    {filteredParameterSettings.map((_, index) => (
                      <col key={index} style={{ width: '80px' }} />
                    ))}
                  </colgroup>
                  <thead
                    className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white backdrop-blur-sm text-center sticky top-0 z-20 shadow-xl border-b-2 border-indigo-500/50"
                    role="rowgroup"
                  >
                    <tr className="border-b border-secondary-300/30" role="row">
                      <th
                        className="px-2 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-indigo-500/50 sticky left-0 bg-blue-700 z-30 sticky-col-header shadow-lg"
                        style={{ width: '60px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.hour}
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-indigo-500/50 bg-transparent backdrop-blur-sm"
                        style={{ width: '80px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.shift}
                      </th>
                      <th
                        className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-indigo-500/50 bg-transparent backdrop-blur-sm"
                        style={{ width: '180px', minWidth: '180px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.name}
                      </th>
                      {filteredParameterSettings.map((param) => (
                        <th
                          key={param.id}
                          className={`px-2 py-3 text-xs font-bold border-r border-indigo-500/50 text-center bg-transparent backdrop-blur-sm text-white ${
                            shouldHighlightColumn(param) ? 'filteerror-column' : ''
                          }`}
                          style={{ width: '80px', minWidth: '80px' }}
                          role="columnheader"
                          scope="col"
                        >
                          <div className="text-center">
                            <div className="font-bold text-[8px] leading-tight uppercase tracking-wider text-white/90 drop-shadow-sm">
                              {param.parameter}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-secondary-200/50 bg-neutral-50/80" role="row">
                      <th
                        className="px-2 py-1 text-center text-xs font-semibold text-neutral-700 border-r border-secondary-300/30 sticky left-0 bg-neutral-50/95 backdrop-blur-sm z-30"
                        style={{ width: '60px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {/* Empty for Hour */}
                      </th>
                      <th
                        className="px-2 py-1 text-center text-xs font-semibold text-neutral-700 border-r border-secondary-300/30 bg-neutral-50/95 backdrop-blur-sm"
                        style={{ width: '80px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {/* Empty for Shift */}
                      </th>
                      <th
                        className="px-3 py-1 text-center text-xs font-semibold text-neutral-700 border-r border-secondary-300/30 bg-neutral-50/95 backdrop-blur-sm"
                        style={{ width: '180px', minWidth: '180px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {/* Empty for Name */}
                      </th>
                      {filteredParameterSettings.map((param) => (
                        <th
                          key={`minmax-${param.id}`}
                          className={`px-2 py-1 text-xs border-r border-secondary-300/30 text-center bg-neutral-50/95 backdrop-blur-sm text-neutral-600 ${
                            shouldHighlightColumn(param) ? 'filteerror-column' : ''
                          }`}
                          style={{ width: '80px', minWidth: '80px' }}
                          role="columnheader"
                          scope="col"
                        >
                          <div className="text-center space-y-1">
                            <div className="text-[6px] leading-tight text-primary-600 font-medium">
                              {param.min_value !== undefined
                                ? `Min: ${formatNumberIndonesian(param.min_value, 1)}`
                                : '-'}
                            </div>
                            <div className="text-[6px] leading-tight text-primary-600 font-medium">
                              {param.max_value !== undefined
                                ? `Max: ${formatNumberIndonesian(param.max_value, 1)}`
                                : '-'}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 backdrop-blur-sm" role="rowgroup">
                    {filteredParameterSettings.length > 0 ? (
                      Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                        <tr
                          key={hour}
                          className={`border-b border-neutral-200/50 group ${
                            hour % 2 === 0 ? 'bg-white/40' : 'bg-neutral-50/30'
                          } hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-150`}
                          role="row"
                        >
                          <td
                            className="px-3 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 border-r border-neutral-200/50 sticky left-0 bg-white/90 group-hover:bg-secondary-50/80 z-30 sticky-col backdrop-blur-sm"
                            style={{ width: '60px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center justify-center h-8">
                              <span className="font-mono font-semibold text-neutral-800">
                                {String(hour).padStart(2, '0')}:00
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-3 py-3 whitespace-nowrap text-xs text-neutral-600 border-r border-neutral-200/50"
                            style={{ width: '80px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center h-8">
                              <span className="px-2 py-1 rounded-md bg-primary-100 text-primary-800 font-medium text-xs">
                                {getShiftForHour(hour)}
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-3 py-3 whitespace-nowrap text-xs text-neutral-800 border-r border-neutral-200/50"
                            style={{ width: '180px', minWidth: '180px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center h-8">
                              {/* User name display/edit - Super Admin can edit */}
                              {(() => {
                                // Cari parameter dengan data di jam ini yang memiliki informasi user
                                let userName = null;

                                // Prioritaskan untuk mencari user_name dari field khusus hour{X}_user terlebih dahulu
                                const userKeyName = `hour${hour}_user`;

                                // Cek semua parameter untuk jam ini
                                for (const param of filteredParameterSettings) {
                                  const paramData = parameterDataMap.get(param.id);
                                  if (!paramData) continue;

                                  // Periksa langsung field hour{X}_user terlebih dahulu
                                  const userKey = userKeyName as keyof CcrParameterDataFlat;
                                  if (
                                    paramData[userKey] !== null &&
                                    paramData[userKey] !== undefined
                                  ) {
                                    userName = String(paramData[userKey]);
                                    break;
                                  }

                                  // Jika tidak ada di hour{X}_user, periksa apakah parameter memiliki nilai untuk jam ini
                                  // dan gunakan field name sebagai fallback
                                  const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
                                  const hourValue = paramData[hourKey];

                                  if (
                                    hourValue !== undefined &&
                                    hourValue !== null &&
                                    hourValue !== '' &&
                                    paramData.name
                                  ) {
                                    userName = String(paramData.name);
                                    break;
                                  }
                                }

                                // Jika Super Admin, tampilkan input field untuk edit
                                if (isSuperAdmin(loggedInUser?.role)) {
                                  return (
                                    <input
                                      type="text"
                                      value={userName || ''}
                                      onChange={(e) => handleUserNameChange(hour, e.target.value)}
                                      onBlur={(e) => saveUserNameChange(hour, e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-neutral-300 rounded focus:ring-2 focus:ring-error-400 focus:border-error-400 bg-white hover:bg-neutral-50 text-neutral-800 transition-all duration-150"
                                      placeholder="Enter user name"
                                      title={`Edit user name for hour ${hour}`}
                                      disabled={!canWrite}
                                    />
                                  );
                                } else {
                                  // Tampilkan nama user jika ditemukan
                                  if (userName) {
                                    return (
                                      <span
                                        className="truncate font-medium text-neutral-700"
                                        title={userName}
                                      >
                                        {userName}
                                      </span>
                                    );
                                  } else {
                                    return <span className="text-neutral-400 italic">-</span>;
                                  }
                                }
                              })()}
                            </div>
                          </td>
                          {filteredParameterSettings.map((param, paramIndex) => {
                            const paramData = parameterDataMap.get(param.id);
                            // Use flat structure with hourX field
                            const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
                            const hourValue = paramData?.[hourKey];

                            // Extract value from flat structure
                            let value = '';

                            // Simply convert the value if it exists
                            if (hourValue !== undefined && hourValue !== null) {
                              // Use formatInputValue for numbers to show Indonesian locale (dots for thousands, commas for decimal)
                              value =
                                param.data_type === ParameterDataType.NUMBER
                                  ? formatInputValue(
                                      hourValue,
                                      getPrecisionForUnit(param.unit),
                                      false // Don't force precision while rendering for input to prevent jumping
                                    )
                                  : String(hourValue);
                            }

                            const isProductTypeParameter = param.parameter
                              .toLowerCase()
                              .includes('tipe produk');

                            // Determine cell background and text color based on parameter value vs min/max
                            let cellBgClass = 'bg-white';
                            let cellTextClass = 'text-neutral-800';
                            let cellBorderClass = 'border-neutral-300';

                            if (
                              param.data_type === ParameterDataType.NUMBER &&
                              value &&
                              !isProductTypeParameter
                            ) {
                              // Parse value - handle Indonesian local format correctly
                              const numValue = parseInputValue(value);
                              if (numValue !== null) {
                                const isBelowMin =
                                  param.min_value !== undefined && numValue < param.min_value;
                                const isAboveMax =
                                  param.max_value !== undefined && numValue > param.max_value;
                                const hasMinOrMax =
                                  param.min_value !== undefined || param.max_value !== undefined;

                                if (isBelowMin || isAboveMax) {
                                  // Out of range - RED
                                  cellBgClass = 'bg-red-200';
                                  cellTextClass = 'text-red-900 font-bold';
                                  cellBorderClass = 'border-red-400';
                                } else if (hasMinOrMax) {
                                  // Within range - GREEN
                                  cellBgClass = 'bg-green-200';
                                  cellTextClass = 'text-green-900 font-bold';
                                  cellBorderClass = 'border-green-400';
                                }
                              }
                            }

                            const isCurrentlySaving = false; // Removed loading indicator for immediate saving

                            return (
                              <td
                                key={param.id}
                                className={`p-1 border-r ${cellBgClass} relative ${
                                  shouldHighlightColumn(param) ? 'filteerror-column' : ''
                                }`}
                                style={{ width: '80px', minWidth: '80px' }}
                                role="gridcell"
                              >
                                <div className="relative">
                                  {isProductTypeParameter ? (
                                    <select
                                      ref={(el) => {
                                        const refKey = getInputRef(
                                          'parameter',
                                          hour - 1,
                                          paramIndex
                                        );
                                        setInputRef(refKey, el);
                                      }}
                                      value={value}
                                      onChange={(e) => {
                                        // Hanya update UI tanpa menyimpan ke database
                                        handleParameterDataChange(param.id, hour, e.target.value);
                                      }}
                                      onBlur={(e) => {
                                        // Simpan ke database saat berpindah sel
                                        saveParameterChange(param.id, hour, e.target.value);
                                      }}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                      }
                                      disabled={!canWrite}
                                      className={`w-full text-center text-sm px-2 py-2 border ${cellBorderClass} rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${cellBgClass} ${cellTextClass} transition-all duration-150 ${
                                        isCurrentlySaving ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      style={{
                                        fontSize: '12px',
                                        minHeight: '32px',
                                        maxWidth: '150px',
                                      }}
                                      aria-label={`Parameter ${param.parameter} jam ${hour}`}
                                      title={`Pilih tipe produk untuk jam ${hour}`}
                                    >
                                      <option value="">Pilih Tipe</option>
                                      <option value="OPC">OPC</option>
                                      <option value="PCC">PCC</option>
                                    </select>
                                  ) : (
                                    <input
                                      ref={(el) => {
                                        const refKey = getInputRef(
                                          'parameter',
                                          hour - 1,
                                          paramIndex
                                        );
                                        setInputRef(refKey, el);
                                      }}
                                      type={
                                        param.data_type === ParameterDataType.NUMBER
                                          ? 'text'
                                          : 'text'
                                      }
                                      value={value}
                                      onChange={(e) => {
                                        // 1. Support input (.) as decimal separator -> auto convert to (,) only at the end
                                        let newValue = e.target.value;

                                        // Konversi titik ke koma (standar desimal Indonesia) hanya untuk numpad support di akhir input
                                        if (newValue.endsWith('.')) {
                                          newValue = newValue.slice(0, -1) + ',';
                                        }

                                        // 2. Auto-format ribuan (1.000) saat mengetik
                                        if (newValue !== '-' && newValue !== '') {
                                          const parts = newValue.split(',');
                                          let integerPart = parts[0];
                                          const decimalPart =
                                            parts.length > 1 ? ',' + parts[1] : '';

                                          // Bersihkan ribuan hanya jika kita yakin itu ribuan
                                          const dotCount = (integerPart.match(/\./g) || []).length;
                                          if (dotCount > 0) {
                                            const lastDotIndex = integerPart.lastIndexOf('.');
                                            const charsAfterDot =
                                              integerPart.length - lastDotIndex - 1;

                                            // Jika multiple dots, atau satu titik di posisi ribuan (3 digit) dan diikuti koma desimal,
                                            // atau tepat 3 digit di akhir integer part.
                                            if (
                                              dotCount > 1 ||
                                              charsAfterDot === 3 ||
                                              decimalPart !== ''
                                            ) {
                                              integerPart = integerPart.replace(/\./g, '');
                                            }
                                          }

                                          // Formating ulang bagian integer jika itu angka valid
                                          const cleanInt = integerPart.replace(/\./g, '');
                                          if (!isNaN(Number(cleanInt)) && cleanInt !== '') {
                                            // Jika cleanInt mengandung titik, berarti itu desimal yang belum diconvert
                                            if (cleanInt.includes('.')) {
                                              newValue =
                                                cleanInt.replace('.', ',') +
                                                decimalPart.replace(',', '');
                                            } else {
                                              integerPart = cleanInt.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                '.'
                                              );
                                              newValue = integerPart + decimalPart;
                                            }
                                          }
                                        }

                                        handleParameterDataChange(param.id, hour, newValue);
                                      }}
                                      onBlur={async (e) => {
                                        // Reformat nilai numerik dan simpan ke database saat berpindah sel
                                        if (param.data_type === ParameterDataType.NUMBER) {
                                          const parsed = parseInputValue(e.target.value);
                                          if (parsed !== null) {
                                            e.target.value = formatInputValue(
                                              parsed,
                                              getPrecisionForUnit(param.unit)
                                            );
                                          }
                                        }

                                        // Get final value to save
                                        const value =
                                          param.data_type === ParameterDataType.NUMBER
                                            ? parseInputValue(e.target.value) !== null
                                              ? parseInputValue(e.target.value)?.toString()
                                              : ''
                                            : e.target.value;

                                        // Simpan ke database saat berpindah sel
                                        await saveParameterChange(param.id, hour, value || '');
                                      }}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                      }
                                      disabled={!canWrite} // Removed loading state for immediate saving
                                      className={`w-full text-center text-sm px-2 py-2 border ${cellBorderClass} rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${cellBgClass} ${cellTextClass} transition-all duration-150 ${
                                        isCurrentlySaving ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      style={{
                                        fontSize: '12px',
                                        minHeight: '32px',
                                        maxWidth: '150px',
                                      }}
                                      aria-label={`Parameter ${param.parameter} jam ${hour}`}
                                      title={`Isi data parameter ${param.parameter} untuk jam ${hour}`}
                                      placeholder={
                                        param.data_type === ParameterDataType.NUMBER
                                          ? ''
                                          : 'Enter text'
                                      }
                                    />
                                  )}
                                  {/* Removed loading indicator for immediate saving */}
                                  {/* {isCurrentlySaving && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                                    <div className="w-4 h-4 border-2 border-error-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                )} */}
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
                          className="text-center py-10 text-neutral-500"
                        >
                          {!selectedCategory || !selectedUnit
                            ? 'Please select a plant category and unit.'
                            : t.no_parameter_master_data_found.replace('{unit}', selectedUnit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Separate Footer Component - Toggle Visibility */}
              {isFooterVisible && (
                <CcrTableFooter
                  filteredParameterSettings={filteredParameterSettings}
                  parameterShiftFooterData={parameterShiftFooterData}
                  parameterShiftAverageData={parameterShiftAverageData}
                  parameterShiftCounterData={parameterShiftCounterData}
                  parameterFooterData={parameterFooterData}
                  formatStatValue={formatStatValue}
                  t={t}
                  mainTableScrollElement={tableWrapperRef.current}
                />
              )}
            </div>
          )}
        </EnhancedCard>

        {/* Bottom Section: Silo Data, Material Usage, Information, and Downtime Data */}
        <div className="space-y-6">
          {/* First Row: CCR Silo Data Entry and CCR Material Usage Entry */}
          <div className="grid grid-cols-2 gap-6">
            {/* Silo Data Entry */}
            <EnhancedCard className="backdrop-blur-md bg-white/60 border border-white/40 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-600 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
                    CCR Silo Data Entry
                  </h3>
                  <p className="text-sm text-neutral-600">{t.ccr_silo_data_description}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-neutral-200/50 shadow-inner">
                <table
                  className="min-w-full divide-y divide-neutral-200 border border-neutral-200"
                  aria-label="Silo Data Table"
                >
                  <thead className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 text-white shadow-xl">
                    <tr>
                      <th
                        rowSpan={2}
                        className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-600/50 align-middle"
                      >
                        {t.silo_name}
                      </th>
                      <th
                        colSpan={3}
                        className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-600/50 border-b border-slate-600/50"
                      >
                        {t.shift_1}
                      </th>
                      <th
                        colSpan={3}
                        className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-600/50 border-b border-slate-600/50"
                      >
                        {t.shift_2}
                      </th>
                      <th
                        colSpan={3}
                        className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-b border-slate-600/50"
                      >
                        {t.shift_3}
                      </th>
                    </tr>
                    <tr>
                      {[...Array(3)].flatMap((_, i) => [
                        <th
                          key={`es-${i}`}
                          className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-600/50"
                        >
                          {t.empty_space}
                        </th>,
                        <th
                          key={`c-${i}`}
                          className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-600/50"
                        >
                          {t.content}
                        </th>,
                        <th
                          key={`p-${i}`}
                          className={`px-3 py-3 text-xs font-bold uppercase tracking-wider ${
                            i < 2 ? 'border-r border-slate-600/50' : ''
                          }`}
                        >
                          {t.percentage}
                        </th>,
                      ])}
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-neutral-200/50">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-16">
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-neutral-600 font-medium">
                              Loading silo data...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dailySiloData.map((siloData, siloIndex) => {
                        const masterSilo = siloMasterMap.get(siloData.silo_id);
                        if (!masterSilo) return null;

                        const shifts: ('shift1' | 'shift2' | 'shift3')[] = [
                          'shift1',
                          'shift2',
                          'shift3',
                        ];

                        return (
                          <tr key={siloData.id} className="hover:bg-neutral-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 border-r sticky left-0 bg-white z-10">
                              {masterSilo.silo_name}
                            </td>
                            {shifts.map((shift, i) => {
                              const content = siloData[shift]?.content;
                              const capacity = masterSilo.capacity;
                              const percentage =
                                capacity > 0 && typeof content === 'number'
                                  ? (content / capacity) * 100
                                  : 0;

                              return (
                                <React.Fragment key={shift}>
                                  <td
                                    className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                                      siloIndex % 2 === 0 ? 'bg-neutral-50' : 'bg-white'
                                    } transition-colors duration-150`}
                                  >
                                    <input
                                      ref={(el) => {
                                        const refKey = getInputRef('silo', siloIndex, i * 2);
                                        setInputRef(refKey, el);
                                      }}
                                      type="text"
                                      defaultValue={formatInputValue(
                                        siloData[shift]?.emptySpace,
                                        1
                                      )}
                                      onChange={(e) => {
                                        const parsed = parseInputValue(e.target.value);
                                        handleSiloDataChange(
                                          siloData.silo_id,
                                          shift,
                                          'emptySpace',
                                          parsed !== null ? parsed.toString() : ''
                                        );
                                      }}
                                      onBlur={() => {
                                        handleSiloDataBlur(siloData.silo_id, shift, 'emptySpace');
                                      }}
                                      onKeyDown={(e) => handleKeyDown(e, 'silo', siloIndex, i * 2)}
                                      className="w-full text-center px-2 py-1.5 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-150 hover:border-neutral-400"
                                      aria-label={`Empty Space for ${masterSilo.silo_name} ${shift}`}
                                      disabled={!canWrite}
                                      title={`Isi ruang kosong untuk ${
                                        masterSilo.silo_name
                                      } shift ${i + 1}`}
                                      placeholder="0,0"
                                    />
                                  </td>
                                  <td
                                    className={`px-1 py-1 whitespace-nowrap text-sm border-r ${
                                      siloIndex % 2 === 0 ? 'bg-neutral-50' : 'bg-white'
                                    } transition-colors duration-150`}
                                  >
                                    <input
                                      ref={(el) => {
                                        const refKey = getInputRef('silo', siloIndex, i * 2 + 1);
                                        setInputRef(refKey, el);
                                      }}
                                      type="text"
                                      defaultValue={formatInputValue(content, 1)}
                                      onChange={(e) => {
                                        const parsed = parseInputValue(e.target.value);
                                        handleSiloDataChange(
                                          siloData.silo_id,
                                          shift,
                                          'content',
                                          parsed !== null ? parsed.toString() : ''
                                        );
                                      }}
                                      onBlur={() => {
                                        handleSiloDataBlur(siloData.silo_id, shift, 'content');
                                      }}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, 'silo', siloIndex, i * 2 + 1)
                                      }
                                      className="w-full text-center px-2 py-1.5 bg-white text-neutral-900 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-150 hover:border-neutral-400"
                                      aria-label={`Content for ${masterSilo.silo_name} ${shift}`}
                                      disabled={!canWrite}
                                      title={`Isi konten untuk ${
                                        masterSilo.silo_name
                                      } shift ${i + 1} (Max: ${masterSilo.capacity})`}
                                      placeholder="0,0"
                                    />
                                  </td>
                                  <td
                                    className={`px-2 py-2 whitespace-nowrap text-sm text-center text-neutral-600 align-middle ${
                                      i < 2 ? 'border-r' : ''
                                    }`}
                                  >
                                    <div className="relative w-full h-6 bg-neutral-200 rounded-full overflow-hidden">
                                      <div
                                        className="absolute top-0 left-0 h-full bg-error-500 transition-all duration-150"
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
                        <td colSpan={10} className="text-center py-6 text-neutral-500">
                          {!selectedCategory
                            ? t.no_plant_categories_found
                            : t.no_silo_master_data_found.replace('{category}', selectedCategory)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </EnhancedCard>

            {/* CCR Material Usage Entry */}
            <EnhancedCard className="backdrop-blur-md bg-white/60 border border-white/40 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-indigo-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
                    {t.ccr_material_usage_entry_title}
                  </h3>
                  <p className="text-sm text-neutral-600">{t.ccr_material_usage_description}</p>
                </div>
              </div>
              <MaterialUsageEntry
                key={materialUsageRefreshTrigger}
                selectedDate={selectedDate}
                selectedUnit={selectedUnit}
                selectedCategory={selectedCategory}
                disabled={!selectedCategory || !selectedUnit || !canWrite}
                t={t}
              />
            </EnhancedCard>
          </div>

          {/* Second Row: Information and CCR Downtime Data Entry */}
          <div className="grid grid-cols-2 gap-6">
            {/* Information */}
            <EnhancedCard className="backdrop-blur-md bg-white/60 border border-white/40 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
                    Information
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">{t.ccr_information_description}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="keterangan"
                  className="block text-sm font-semibold text-neutral-700"
                >
                  {t.information_label}
                </label>
                <div className="relative">
                  <textarea
                    id="keterangan"
                    rows={8}
                    value={informationText}
                    onChange={(e) => handleInformationChange(e.target.value)}
                    disabled={!selectedCategory || !selectedUnit || !canWrite}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 resize-vertical transition-all duration-150 bg-white/50 backdrop-blur-sm disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t.information_placeholder}
                  />
                </div>
                {isSavingInformation && (
                  <div className="flex justify-end">
                    <div className="px-4 py-2 text-sm text-success-700 flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-success-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Otomatis menyimpan perubahan...</span>
                    </div>
                  </div>
                )}
              </div>
            </EnhancedCard>

            {/* Downtime Data Entry */}
            <EnhancedCard className="backdrop-blur-md bg-white/60 border border-white/40 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-700 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
                      CCR Downtime Data Entry
                    </h3>
                    <br className="hidden" />
                    <p className="text-sm text-neutral-600 mt-1">{t.ccr_downtime_description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RcaAnalysisButton
                    currentDowntime={
                      dailyDowntimeData.length > 0
                        ? {
                            id: dailyDowntimeData[dailyDowntimeData.length - 1].id,
                            date: dailyDowntimeData[dailyDowntimeData.length - 1].date,
                            startTime: dailyDowntimeData[dailyDowntimeData.length - 1].start_time,
                            endTime: dailyDowntimeData[dailyDowntimeData.length - 1].end_time,
                            pic: dailyDowntimeData[dailyDowntimeData.length - 1].pic,
                            problem: dailyDowntimeData[dailyDowntimeData.length - 1].problem,
                            unit: dailyDowntimeData[dailyDowntimeData.length - 1].unit,
                            action: dailyDowntimeData[dailyDowntimeData.length - 1].action,
                          }
                        : {}
                    }
                    disabled={dailyDowntimeData.length === 0}
                  />
                  <EnhancedButton
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAddDowntimeModal}
                    disabled={
                      !hasPermission('rkc_plant_operations', 'WRITE') ||
                      !selectedCategory ||
                      !selectedUnit ||
                      !canWrite
                    }
                    aria-label={t.add_downtime_button || 'Add new downtime'}
                    className="group relative overflow-hidden flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 shadow-md transition-all"
                  >
                    <PlusIcon className="w-4 h-4 text-white" />
                    <span className="relative z-10 text-sm font-medium text-white">
                      {t.add_downtime_button}
                    </span>
                  </EnhancedButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.start_time}
                      </th>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.end_time}
                      </th>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.unit}
                      </th>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.pic}
                      </th>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.problem}
                      </th>
                      <th className="px-4 py-3 text-left font-bold border-b border-slate-700/50">
                        {t.action}
                      </th>
                      <th className="relative px-4 py-3 border-b border-slate-700/50">
                        <span className="sr-only">{t.actions}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 backdrop-blur-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-neutral-500">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-6 h-6 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">{t.loading_data}</span>
                          </div>
                        </td>
                      </tr>
                    ) : dailyDowntimeData.length > 0 ? (
                      dailyDowntimeData.map((downtime, idx) => (
                        <tr
                          key={downtime.id}
                          className={`border-b border-neutral-200/50 group ${
                            idx % 2 === 0 ? 'bg-white/40' : 'bg-neutral-50/30'
                          } hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-150`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-neutral-800">
                            {downtime.start_time}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-neutral-800">
                            {downtime.end_time}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-700">
                            <span className="px-2 py-1 rounded-md bg-primary-100 text-primary-800 font-medium text-xs">
                              {downtime.unit}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-700">
                            {downtime.pic}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700 max-w-sm whitespace-pre-wrap">
                            {downtime.problem}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700 max-w-sm whitespace-pre-wrap">
                            {downtime.action || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <EnhancedButton
                                variant="ghost"
                                size="xs"
                                onClick={() => handleOpenEditDowntimeModal(downtime)}
                                aria-label={`Edit downtime for ${downtime.unit}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <EditIcon />
                              </EnhancedButton>
                              <EnhancedButton
                                variant="ghost"
                                size="xs"
                                onClick={() => handleOpenDeleteModal(downtime)}
                                aria-label={`Delete downtime for ${downtime.unit}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <TrashIcon />
                              </EnhancedButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-neutral-500">
                          <div className="flex items-center justify-center space-x-3">
                            <svg
                              className="w-8 h-8 text-neutral-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-sm font-medium">{t.no_downtime_recorded}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </EnhancedCard>
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
            selectedUnit={selectedUnit}
            readOnly={!canWrite}
          />
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t.confirm_delete_downtime_title}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Hapus Data Downtime
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Tindakan ini tidak dapat dibatalkan. Data downtime berikut akan dihapus
                    permanen:
                  </p>
                  {deletingRecord && (
                    <div className="bg-error-50 border border-error-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-neutral-700">Unit:</span>
                        <span className="text-sm text-neutral-900 font-semibold">
                          {deletingRecord.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-neutral-700">Tanggal:</span>
                        <span className="text-sm text-neutral-900 font-semibold">
                          {new Date(deletingRecord.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {deletingRecord.problem && (
                        <div className="flex items-start space-x-2">
                          <span className="text-sm font-medium text-neutral-700">Problem:</span>
                          <span className="text-sm text-neutral-900 font-semibold">
                            {deletingRecord.problem}
                          </span>
                        </div>
                      )}
                      {deletingRecord.start_time && deletingRecord.end_time && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-neutral-700">Durasi:</span>
                          <span className="text-sm text-neutral-900 font-semibold">
                            {deletingRecord.start_time} - {deletingRecord.end_time}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-primary-600 mt-4 font-medium">
                    ⚠️ Pastikan data ini benar-benar perlu dihapus sebelum melanjutkan.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-neutral-200">
            <EnhancedButton
              variant="error"
              onClick={handleDeleteConfirm}
              className="sm:ml-3 sm:w-auto w-full sm:w-auto"
              rounded="lg"
              elevation="sm"
              aria-label="Hapus downtime secara permanen"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Hapus Permanen
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              onClick={handleCloseDeleteModal}
              className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto w-full sm:w-auto"
              rounded="lg"
              elevation="sm"
              aria-label="Batalkan penghapusan"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Batal
            </EnhancedButton>
          </div>
        </Modal>

        {/* Parameter Reorder Modal */}
        <Modal
          isOpen={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          title={t.reorder_parameters_title}
        >
          <div className="space-y-4 parameter-reorder-modal">
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Ada beberapa cara untuk menyusun ulang parameter:
              </p>
              <div className="bg-neutral-100 p-2 rounded-md space-y-2">
                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">1. Drag and Drop:</p>
                  <p className="text-xs text-neutral-600 pl-3">
                    Tarik parameter ke posisi yang diinginkan
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">2. Input Nomor:</p>
                  <p className="text-xs text-neutral-600 pl-3">
                    Masukkan nomor posisi yang diinginkan pada kotak input
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">3. Tombol ↑/↓:</p>
                  <p className="text-xs text-neutral-600 pl-3">
                    Gunakan tombol panah untuk penyesuaian satu per satu
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">4. Pintasan Keyboard:</p>
                  <ul className="text-xs text-neutral-600 space-y-1 pl-4 list-disc">
                    <li>Alt + ↑ : Pindahkan parameter ke atas</li>
                    <li>Alt + ↓ : Pindahkan parameter ke bawah</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-700 mb-1">5. Pencarian:</p>
                  <p className="text-xs text-neutral-600 pl-3">
                    Gunakan fitur pencarian untuk menemukan parameter dengan cepat
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-500 italic">
                Urutan parameter akan disimpan secara otomatis saat menekan tombol &quot;Done&quot;.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Cari parameter..."
                aria-label="Cari parameter"
              />
              {modalSearchQuery && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setModalSearchQuery('')}
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              )}
            </div>

            <DragDropContext onDragEnd={handleParameterDragEnd}>
              <Droppable droppableId="parameter-reorder-list">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="max-h-96 overflow-y-auto space-y-2"
                  >
                    {filteerrorModalParameters.length > 0 ? (
                      filteerrorModalParameters.map((param) => {
                        // Find original index to keep the correct ordering
                        const originalIndex = modalParameterOrder.findIndex(
                          (p) => p.id === param.id
                        );
                        return (
                          <ParameterReorderItem
                            key={param.id}
                            param={param}
                            // Use original index for dragging but display search index for UX
                            index={originalIndex}
                          />
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-neutral-500 bg-neutral-50 rounded-md">
                        {modalSearchQuery
                          ? 'Tidak ada parameter yang cocok dengan pencarian'
                          : 'Tidak ada parameter yang tersedia'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex justify-end gap-3 pt-4 border-t flex-wrap">
              <div className="flex gap-2 items-center">
                <EnhancedButton
                  variant="secondary"
                  onClick={exportParameterOrderToExcel}
                  aria-label="Export to Excel"
                  className="flex items-center gap-1"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Export to Excel
                </EnhancedButton>
                <EnhancedButton
                  variant="secondary"
                  onClick={() => document.getElementById('import-parameter-order-excel').click()}
                  aria-label="Import from Excel"
                  className="flex items-center gap-1"
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  Import from Excel
                </EnhancedButton>
                <input
                  type="file"
                  id="import-parameter-order-excel"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleImportParameterOrderExcel}
                />
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                    aria-label="Excel import/export help"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className="absolute z-10 w-72 bg-white p-3 rounded-lg shadow-lg border border-neutral-200 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity left-0 bottom-full mb-2 text-xs">
                    <h3 className="font-semibold mb-1 text-neutral-900">
                      Penggunaan Excel untuk Urutan Parameter
                    </h3>
                    <ul className="list-disc pl-4 text-neutral-600 space-y-1">
                      <li>Export: Mengunduh urutan parameter saat ini ke Excel</li>
                      <li>Import: Menerapkan urutan dari file Excel yang telah diedit</li>
                      <li>Di Excel: Edit kolom &ldquo;Order&rdquo; untuk mengubah urutan</li>
                      <li>Jangan mengubah kolom ID di file Excel</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                      <a
                        href="/docs/PARAMETER_ORDER_EXCEL_GUIDE.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-600 flex items-center"
                      >
                        <span>Baca panduan lengkap</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 ml-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <EnhancedButton
                  variant="secondary"
                  onClick={() => setShowLoadProfileModal(true)}
                  aria-label="Load profile"
                >
                  Load Profile
                </EnhancedButton>
                <EnhancedButton
                  variant="secondary"
                  onClick={() => setShowSaveProfileModal(true)}
                  aria-label="Save profile"
                >
                  Save Profile
                </EnhancedButton>
                <EnhancedButton
                  variant="secondary"
                  onClick={() => {
                    // Reset to default order (sorted by parameter name)
                    const defaultOrder = [...filteredParameterSettings].sort((a, b) =>
                      a.parameter.localeCompare(b.parameter)
                    );
                    setModalParameterOrder(defaultOrder);
                  }}
                  aria-label="Reset to default order"
                >
                  Reset to Default
                </EnhancedButton>
                <EnhancedButton
                  variant="primary"
                  onClick={() => {
                    const newOrder = modalParameterOrder.map((param) => param.id);
                    setPbParameterOrder(newOrder);
                    saveParameterOrder(newOrder);
                    setShowReorderModal(false);
                  }}
                  aria-label="Save parameter order"
                >
                  Done
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Modal>

        {/* Save Profile Modal */}
        <Modal
          isOpen={showSaveProfileModal}
          onClose={() => setShowSaveProfileModal(false)}
          title={t.save_parameter_order_profile_title}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Save the current parameter order as a profile that can be loaded later.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter profile name"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  placeholder="Enter profile description"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <EnhancedButton
                variant="secondary"
                onClick={() => {
                  setShowSaveProfileModal(false);
                  setProfileName('');
                  setProfileDescription('');
                }}
                aria-label="Cancel save profile"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                onClick={saveProfile}
                disabled={!profileName.trim()}
                aria-label="Save profile"
              >
                Save Profile
              </EnhancedButton>
            </div>
          </div>
        </Modal>

        {/* Load Profile Modal */}
        <Modal
          isOpen={showLoadProfileModal}
          onClose={() => setShowLoadProfileModal(false)}
          title={t.load_parameter_order_profile_title}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Select a profile to load the parameter order.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {profiles.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">No profiles available</p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => loadProfile(profile)}
                  >
                    <div>
                      <div className="font-semibold text-neutral-800">{profile.name}</div>
                      <div className="text-xs text-neutral-500">
                        Created by {profile.user_id === loggedInUser?.id ? 'You' : 'Another user'} •{' '}
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnhancedButton
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProfile(profile);
                        }}
                        aria-label={`Load profile ${profile.name}`}
                      >
                        Load
                      </EnhancedButton>
                      {(profile.user_id === loggedInUser?.id ||
                        isSuperAdmin(loggedInUser?.role)) && (
                        <EnhancedButton
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileToDelete(profile);
                            setShowDeleteProfileModal(true);
                          }}
                          aria-label={`Delete profile ${profile.name}`}
                          className="text-primary-600 hover:text-error-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </EnhancedButton>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <EnhancedButton
                variant="secondary"
                onClick={() => setShowLoadProfileModal(false)}
                aria-label="Close load profile modal"
              >
                Close
              </EnhancedButton>
            </div>
          </div>
        </Modal>

        {/* Delete Profile Confirmation Modal */}
        <Modal
          isOpen={showDeleteProfileModal}
          onClose={() => {
            setShowDeleteProfileModal(false);
            setProfileToDelete(null);
          }}
          title={t.delete_parameter_order_profile_title}
        >
          <div className="p-6">
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete the profile &quot;{profileToDelete?.name}&quot;? This
              action cannot be undone.
            </p>
          </div>
          <div className="bg-neutral-50 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg">
            <EnhancedButton
              variant="warning"
              onClick={async () => {
                if (profileToDelete) {
                  await deleteProfile(profileToDelete);
                  setShowDeleteProfileModal(false);
                  setProfileToDelete(null);
                }
              }}
              className="sm:ml-3 sm:w-auto"
              rounded="lg"
              elevation="sm"
              aria-label="Confirm delete profile"
            >
              Delete Profile
            </EnhancedButton>
            <EnhancedButton
              variant="secondary"
              onClick={() => {
                setShowDeleteProfileModal(false);
                setProfileToDelete(null);
              }}
              className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto"
              rounded="lg"
              elevation="sm"
              aria-label="Cancel delete"
            >
              Cancel
            </EnhancedButton>
          </div>
        </Modal>

        {/* Navigation Help Modal */}
        <CcrNavigationHelp
          isVisible={showNavigationHelp}
          onClose={() => setShowNavigationHelp(false)}
        />
      </div>
    </div>
  );
};

export default RkcCcrDataEntryPage;
