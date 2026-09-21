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
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { logger } from '../../utils/logger';
import { indexedDBCache } from '../../utils/cache/indexedDB';
import { useDerivativeSiloCapacities as useSiloCapacities } from '../../hooks/useDerivativeSiloCapacities';
import { useDerivativeCcrSiloData as useCcrSiloData } from '../../hooks/useDerivativeCcrSiloData';
import { useDerivativeParameterSettings as useParameterSettings } from '../../hooks/useDerivativeParameterSettings';
// Menggunakan hook yang sudah diperbaiki dengan mengikuti pola yang sama dengan Silo Data
import {
  useDerivativeCcrParameterDataFlat as useCcrParameterDataFlat,
  CcrParameterDataFlat,
} from '../../hooks/useDerivativeCcrParameterDataFlat';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';
import { useDerivativeCcrDowntimeData as useCcrDowntimeData } from '../../hooks/useDerivativeCcrDowntimeData';
import { useUsers } from '../../hooks/useUsers';
import {
  ParameterDataType,
  CcrDowntimeData,
  CcrSiloData,
  ParameterSetting,
  DowntimeStatus,
} from '../../types';
import { ParameterProfile } from '../../types/Profile';
import { useDerivativePlantUnits as usePlantUnits } from '../../hooks/useDerivativePlantUnits';
import Modal from '../../components/Modal';
import CcrDowntimeForm from './CcrDowntimeForm';
import CcrTableFooter from '../../components/ccr/CcrTableFooter';
import DerivativeOperatingHoursCard from '../../components/ccr/DerivativeOperatingHoursCard';
import CcrTableSkeleton from '../../components/ccr/CcrTableSkeleton';
import CcrNavigationHelp from '../../components/ccr/CcrNavigationHelp';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import {
  formatNumber,
  formatNumberWithPrecision,
  formatNumberIndonesian,
  parseIndonesianNumber,
  getPrecisionForParameter,
  formatIndonesianInput,
} from '../../utils/formatters';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFooterCalculations } from '../../hooks/useFooterCalculations';
import { useDerivativeCcrFooterData as useCcrFooterData } from '../../hooks/useDerivativeCcrFooterData';
import { useDerivativeCcrInformationData as useCcrInformationData } from '../../hooks/useDerivativeCcrInformationData';
import { usePermissions } from '../../utils/permissions';
import { isSuperAdmin, canAccessMonthlyExportImport } from '../../utils/roleHelpers';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import PocketBase client and hooks
import { pb } from '../../utils/pocketbase-simple';
import { useDerivativeUserParameterOrder as useUserParameterOrder } from '../../hooks/useDerivativeUserParameterOrder';
import { formatDateToISO8601, formatToWITA, formatDate } from '../../utils/dateUtils';
import MonthlyExportImportModal from '../../components/ccr/modals/MonthlyExportImportModal';

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
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';

const DerivativeCcrDataEntryPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
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
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [isFooterVisible, setIsFooterVisible] = useState(false);

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
  const { canWrite } = usePlantOperationsAccess('DERIVATIVE');
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

  // Ref for main table container to sync scroll with footer
  const [tableScrollEl, setTableScrollEl] = useState<HTMLDivElement | null>(null);
  const tableContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setTableScrollEl(node);
    }
  }, []);
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
      // Build user map for creator names
      const userMap = new Map<string, string>();
      try {
        const usersList = await pb
          .collection('users')
          .getFullList({ fields: 'id,name,email,username' });
        usersList.forEach((u: any) => {
          userMap.set(u.id, u.name || u.email || u.username || u.id);
        });
      } catch (uErr) {
        // Fallback silently if fetching users is restricted
      }

      // Fetch Derivative profiles and standard profiles
      let records: any[] = [];
      try {
        records = await pb.collection('derivative_parameter_order_profiles').getFullList({
          filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
        });
      } catch {
        records = [];
      }

      // If no Derivative profiles, check standard parameter_order_profiles as fallback
      if (records.length === 0) {
        try {
          const stdRecords = await pb.collection('parameter_order_profiles').getFullList({
            filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
          });
          records = stdRecords;
        } catch {
          // ignore
        }
      }

      // Only update state if component is mounted
      setProfiles(
        records.map((record) => ({
          id: record.id,
          name: record.name || 'Unnamed Profile',
          description: record.description || '',
          user_id: record.user_id || '',
          creator_name: userMap.get(record.user_id) || '',
          category: record.category || '',
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
      await pb.collection('derivative_parameter_order_profiles').create({
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
    if (selectedDate && selectedCategory && selectedUnit) {
      fetchSiloData(true);
    }

    let pollCount = 0;
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const shouldForceRefresh = pollCount % 3 === 0;
        fetchSiloData(shouldForceRefresh);
        pollCount++;
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [selectedDate, selectedCategory, selectedUnit, siloMasterData.length, fetchSiloData]);

  // Parameter Data Hooks and Filtering
  const { records: parameterSettings } = useParameterSettings();

  // Custom parameter filtering with reorder support
  const filteredParameterSettings = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];

    const unitBelongsToCategory = plantUnits.some(
      (pu) => pu.unit === selectedUnit && pu.category === selectedCategory
    );
    if (!unitBelongsToCategory) return [];

    let filtered = parameterSettings.filter(
      (param) => param.category === selectedCategory && param.unit === selectedUnit
    );

    // Apply custom order if available
    if (pbParameterOrder.length > 0) {
      const orderMap = new Map(pbParameterOrder.map((id, index) => [id, index]));
      filtered = filtered.sort((a, b) => {
        const aIndex = orderMap.get(a.id) ?? filtered.length;
        const bIndex = orderMap.get(b.id) ?? filtered.length;
        return aIndex - bIndex;
      });
    } else {
      // Default sort by parameter name
      filtered = filtered.sort((a, b) => a.parameter.localeCompare(b.parameter));
    }

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
  }, [
    parameterSettings,
    selectedCategory,
    selectedUnit,
    plantUnits,
    pbParameterOrder,
    columnSearchQuery,
  ]);

  // Update modal parameter order when modal opens or filteredParameterSettings changes
  const moveParameterUp = useCallback((index: number) => {
    setModalParameterOrder((prev) => {
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      return newOrder;
    });
  }, []);

  const moveParameterDown = useCallback((index: number) => {
    setModalParameterOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
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
  const filteredModalParameters = useMemo(() => {
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
                <button
                  type="button"
                  onClick={() => moveParameterUp(index)}
                  disabled={index === 0}
                  className="min-h-[30px] min-w-[30px] h-[30px] w-[30px] inline-flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  aria-label={`Move ${param.parameter} up`}
                  title="Move up"
                >
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveParameterDown(index)}
                  disabled={index === modalParameterOrder.length - 1}
                  className="min-h-[30px] min-w-[30px] h-[30px] w-[30px] inline-flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  aria-label={`Move ${param.parameter} down`}
                  title="Move down"
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
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
        const orderedParams = profile.parameter_order
          .map((id: string) => filteredParameterSettings.find((p) => p.id === id))
          .filter(Boolean);

        // Add any missing parameters at the end
        const missingParams = filteredParameterSettings.filter(
          (p) => !profile.parameter_order.includes(p.id)
        );

        setModalParameterOrder([...orderedParams, ...missingParams]);
        setSelectedProfile(profile);
        setShowLoadProfileModal(false);
        showToast(t.profile_loaded.replace('{name}', profile.name));
      } catch {
        showToast(t.failed_to_load_profile);
      }
    },
    [filteredParameterSettings, showToast, t.profile_loaded, t.failed_to_load_profile]
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
        try {
          await pb.collection('derivative_parameter_order_profiles').delete(profile.id);
        } catch {
          await pb.collection('parameter_order_profiles').delete(profile.id);
        }

        showToast(t.profile_deleted_successfully.replace('{name}', profile.name));
        fetchProfiles(); // Refresh the profiles list
      } catch {
        showToast(t.failed_to_delete_profile);
      }
    },
    [
      loggedInUser?.id,
      loggedInUser?.role,
      fetchProfiles,
      showToast,
      t.invalid_profile_selected,
      t.you_can_only_delete_own_profiles,
      t.profile_deleted_successfully,
      t.failed_to_delete_profile,
    ]
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
    const filteredMasterData = siloMasterData.filter((silo) => {
      const categoryMatch = silo.plant_category === selectedCategory;
      const unitMatch = !selectedUnit || silo.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });

    // Create a map of existing silo data for quick lookup
    const existingDataMap = new Map(allDailySiloData.map((data) => [data.silo_id, data]));

    // For each filtered silo, either use existing data or create empty data structure
    return filteredMasterData.map((masterSilo) => {
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
    saveParameterValue: updateParameterData,
    dataVersion, // Version untuk memicu refresh
    triggerRefresh, // Fungsi untuk refresh manual
    lastRefreshTime, // Waktu refresh terakhir
  } = useCcrParameterDataFlat();

  const [dailyParameterData, setDailyParameterData] = useState<CcrParameterDataFlat[]>([]);

  const fetchParameterData = useCallback(
    async (showLoadingSpinner = true) => {
      if (!selectedDate || selectedDate.trim() === '') {
        return;
      }

      if (showLoadingSpinner) {
        setLoading(true);
      }

      try {
        const data = await getParameterDataForDate(selectedDate, selectedUnit);
        setDailyParameterData(data);
      } catch {
        showToast(t.error_fetching_parameter_data);
      } finally {
        if (showLoadingSpinner) {
          setLoading(false);
        }
      }
    },
    [selectedDate, selectedUnit, getParameterDataForDate, showToast]
  );

  // Initial and reactive data fetch when filters or parameter settings change
  useEffect(() => {
    if (selectedDate && selectedUnit && selectedCategory) {
      fetchParameterData(true);
    }
  }, [selectedDate, selectedUnit, selectedCategory, parameterSettings.length, fetchParameterData]);

  const lastDataVersion = useRef(dataVersion);

  useEffect(() => {
    if (dataVersion > 0 && dataVersion > lastDataVersion.current) {
      lastDataVersion.current = dataVersion;
      fetchParameterData(false);
    }
  }, [dataVersion, fetchParameterData]);

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

            const hasShiftData =
              shiftData &&
              (shiftData.shift1[param.id] !== undefined ||
                shiftData.shift2[param.id] !== undefined ||
                shiftData.shift3[param.id] !== undefined ||
                shiftData.shift3Cont[param.id] !== undefined);

            const hasCounterData =
              counterData &&
              (counterData.shift1[param.id] !== undefined ||
                counterData.shift2[param.id] !== undefined ||
                counterData.shift3[param.id] !== undefined ||
                counterData.shift3Cont[param.id] !== undefined);

            if (footerData || hasShiftData || hasCounterData) {
              return {
                date: selectedDate,
                parameter_id: param.id,
                plant_unit: selectedUnit || selectedCategory || 'CCR',
                total: footerData ? footerData.total : 0,
                average: footerData ? footerData.avg : 0,
                minimum: footerData ? footerData.min : 0,
                maximum: footerData ? footerData.max : 0,
                shift1_total: shiftData?.shift1[param.id] || 0,
                shift2_total: shiftData?.shift2[param.id] || 0,
                shift3_total: shiftData?.shift3[param.id] || 0,
                shift3_cont_total: shiftData?.shift3Cont[param.id] || 0,
                shift1_average: averageData?.shift1[param.id] || 0,
                shift2_average: averageData?.shift2[param.id] || 0,
                shift3_average: averageData?.shift3[param.id] || 0,
                shift3_cont_average: averageData?.shift3Cont[param.id] || 0,
                shift1_counter: counterData?.shift1[param.id] || 0,
                shift2_counter: counterData?.shift2[param.id] || 0,
                shift3_counter: counterData?.shift3[param.id] || 0,
                shift3_cont_counter: counterData?.shift3Cont[param.id] || 0,
                operator_id: loggedInUser?.id,
              };
            }
            return null;
          })
          .filter((f): f is any => f !== null);

        if (allFooterDataToSave.length > 0) {
          // Use batch save for efficiency and to prevent parallel request flood
          await batchSaveFooterData(allFooterDataToSave);

          // Clear indexedDB cache for this unit/date so Derivative COP Analysis fetches fresh data
          try {
            const cacheKey = `footer-data-${selectedDate}-${selectedCategory}-${selectedUnit}`;
            await indexedDBCache.delete(cacheKey);
          } catch {
            // Ignore cache delete error
          }
        }
      } catch (err) {
        // Silent error for background save
        console.error('Background footer save error:', err);
      } finally {
        footerSaveInProgress.current = false;
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftAverageData,
    parameterShiftCounterData,
    filteredParameterSettings,
    selectedDate,
    selectedCategory,
    batchSaveFooterData,
    loggedInUser?.id,
  ]);

  // Table dimension functions for keyboard navigation
  const getSiloTableDimensions = () => {
    const rows = dailySiloData.length;
    const cols = 6; // 2 input fields (Ruang Isi, Isi Stock) per shift * 3 shifts
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

        const existingRecords = await pb.collection('derivative_ccr_silo_data').getFullList({
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

          await pb.collection('derivative_ccr_silo_data').update(recordId, updateData);
        } else {
          // No record - create new one
          const createData = {
            date: formattedDate,
            silo_id: siloId,
            plant_unit: selectedUnit, // Added plant_unit for filtering
            [flatFieldName]: value,
          };

          await pb.collection('derivative_ccr_silo_data').create(createData);
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
        await updateParameterData(parameterId, selectedDate, hour, value, effectiveUserName);

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
              const existingRecords = await pb
                .collection('derivative_ccr_parameter_data')
                .getFullList({
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

                await pb
                  .collection('derivative_ccr_parameter_data')
                  .update(existingRecord.id, updateFields);
              } else {
                // Create new record
                const createFields: Record<string, string | number | null> = {
                  date: selectedDate,
                  parameter_id: paramId,
                  name: effectiveUserName,
                  plant_unit: selectedUnit,
                  ...updateFields,
                };

                await pb.collection('derivative_ccr_parameter_data').create(createFields);
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
      const filter = `date='${selectedDate}' && plant_unit='${selectedUnit}'`;
      const records = await pb.collection('derivative_ccr_parameter_data').getFullList({
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
            await pb.collection('derivative_ccr_parameter_data').delete(record.id);
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
      const filter = `date='${selectedDate}' && plant_unit='${selectedUnit}'`;
      const records = await pb.collection('derivative_ccr_parameter_data').getFullList({
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
              await pb.collection('derivative_ccr_parameter_data').update(record.id, updateData);
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

          await updateParameterData(param.id, selectedDate, hour, valueToSave, userName);
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

  // Calculate total downtime from events for the selected unit & date
  const totalDowntimeFromEvents = useMemo(() => {
    if (!dailyDowntimeData || dailyDowntimeData.length === 0) return 0;
    return dailyDowntimeData.reduce((acc, dt) => {
      if (!dt.start_time || !dt.end_time) return acc;
      const [h1, m1] = dt.start_time.split(':').map((n) => parseInt(n, 10) || 0);
      const [h2, m2] = dt.end_time.split(':').map((n) => parseInt(n, 10) || 0);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      return acc + (diff > 0 ? diff / 60 : 0);
    }, 0);
  }, [dailyDowntimeData]);

  // Handler untuk menyinkronkan hasil kalkulasi Log Sesi Jam Operasi ke Grid CCR
  const handleSyncTotalRunningHours = useCallback(
    async (totalNetHours: number, hourlyMap?: Record<number, number>) => {
      if (!selectedCategory || !selectedUnit || !selectedDate) return;

      const runningHoursParam = filteredParameterSettings.find((p) => {
        const pName = p.parameter.toLowerCase();
        return (
          pName.includes('running hours') ||
          pName.includes('jam operasi') ||
          pName.includes('operation hours')
        );
      });

      if (!runningHoursParam) {
        alert(
          `Informasi: Total Jam Operasi (${totalNetHours} Jam) tersimpan di log sesi. Parameter "Jam Operasi" di Master Data belum dikonfigurasi untuk Unit ${selectedUnit}.`
        );
        return;
      }

      if (hourlyMap && bulkSaveParameterChanges) {
        const changes = Object.entries(hourlyMap).map(([hStr, val]) => ({
          paramId: runningHoursParam.id,
          hour: parseInt(hStr, 10),
          value: val > 0 ? val.toString() : '0',
        }));

        await bulkSaveParameterChanges(changes);
        triggerRefresh();
        alert(
          `Berhasil menerapkan ${totalNetHours} Jam Operasi ke parameter grid CCR Unit ${selectedUnit}!`
        );
      }
    },
    [
      selectedCategory,
      selectedUnit,
      selectedDate,
      filteredParameterSettings,
      bulkSaveParameterChanges,
      triggerRefresh,
    ]
  );

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
          filter: `date='${selectedDate}' && unit='${selectedUnit}'`,
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
              const numVal = typeof rawVal === 'string' ? parseIndonesianNumber(rawVal) : rawVal;
              paramValue =
                param.data_type === ParameterDataType.NUMBER && numVal !== null
                  ? formatNumberWithPrecision(
                      numVal,
                      getPrecisionForParameter(param.parameter, param.unit)
                    )
                  : String(rawVal);
            } else if (typeof hourValue === 'string' || typeof hourValue === 'number') {
              const numVal =
                typeof hourValue === 'string' ? parseIndonesianNumber(hourValue) : hourValue;
              paramValue =
                param.data_type === ParameterDataType.NUMBER && numVal !== null
                  ? formatNumberWithPrecision(
                      numVal,
                      getPrecisionForParameter(param.parameter, param.unit)
                    )
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
          filter: `date='${selectedDate}' && plant_unit='${selectedUnit}'`,
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
                  'ðŸ” DEBUG: Found parameter columns:',
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
                      'ðŸ” DEBUG: Processing parameter:',
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
                        'ðŸ” DEBUG: Found parameter setting for:',
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
                  'ðŸ” DEBUG: Collected batch changes for hour',
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
                'ðŸ” DEBUG: Footer headers found (skipping empty first column):',
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
                  'âš ï¸ DEBUG: Invalid footer row',
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
              'ðŸ” DEBUG: Footer validation complete, invalid rows:',
              invalidRows.length,
              'valid rows:',
              footerData.length - invalidRows.length
            );

            if (invalidRows.length === 0) {
              console.log(
                'ðŸ” DEBUG: Footer data appears to be shift handover information, not parameter summary data'
              );
              console.log(
                'âš ï¸ DEBUG: Skipping footer data import - shift handover data import not implemented yet'
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
                'ðŸ” DEBUG: Downtime headers found (skipping empty first column):',
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
                  'âš ï¸ DEBUG: Invalid downtime row',
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
                  'âš ï¸ DEBUG: Downtime row',
                  index + 2,
                  'has empty PIC field, will use default value'
                );
              }
              return false;
            });

            console.log(
              'ðŸ” DEBUG: Downtime validation complete, invalid rows:',
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
                  const existingRecords = await pb
                    .collection('derivative_ccr_downtime_data')
                    .getFullList({
                      filter: importDates.map((date) => `date='${date}'`).join(' || '),
                    });
                  console.log(
                    'ðŸ”  DEBUG: Found',
                    existingRecords.length,
                    'existing downtime records to delete'
                  );

                  for (const record of existingRecords) {
                    // Console statement removed for production
                    await pb.collection('derivative_ccr_downtime_data').delete(record.id);
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
                    'ðŸ”  DEBUG: Processing downtime row for date:',
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
                      'âœ… DEBUG: Downtime data saved successfully, total count:',
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
                'ðŸ”  DEBUG: Silo headers found (skipping empty first column):',
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
                  'âš ï¸  DEBUG: Invalid silo row',
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
              'ðŸ”  DEBUG: Silo validation complete, invalid rows:',
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
                  const existingRecords = await pb
                    .collection('derivative_ccr_silo_data')
                    .getFullList({
                      filter: importDates.map((date) => `date='${date}'`).join(' || '),
                    });
                  console.log(
                    'ðŸ”  DEBUG: Found',
                    existingRecords.length,
                    'existing silo records to delete'
                  );

                  for (const record of existingRecords) {
                    // Console statement removed for production
                    await pb.collection('derivative_ccr_silo_data').delete(record.id);
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
                    'ðŸ” DEBUG: Shift data prepaerror - Shift1:',
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
                      'âœ… DEBUG: Silo data processing completed, total count:',
                      importCount
                    );
                  } else {
                    // Console statement removed for production
                  }
                } catch (err) {
                  console.error(
                    'âŒ DEBUG: Failed to save silo data for',
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
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - Sesuai Standar Presisi COP Analysis & 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-xl shadow-md border border-slate-800 p-4 sm:p-5 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400"
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
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  Derivative Operations
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  CCR Central Control
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                Derivative {t.op_ccr_data_entry || 'CCR Data Entry'}
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.ccr_page_description ||
                  'Real-time CCR log sheet input, hourly parameter monitoring & silo tracking (Derivative)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start md:self-auto bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xs">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={new Date()}
              className="text-xs text-slate-300 font-medium"
            />
          </div>
        </div>
        {error && (
          <div className="mt-3.5 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-200 text-xs font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline hover:text-white">
              {t.close_button || 'Close'}
            </button>
          </div>
        )}
      </div>

      {/* Filter Card - Sesuai Standar Presisi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Plant Category */}
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor="ccr-category"
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              {t.plant_category_label}
            </label>
            <div className="relative">
              <select
                id="ccr-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-xs font-medium cursor-pointer"
              >
                <option value="">-- {t.choose_category} --</option>
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Unit Name */}
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor="ccr-unit"
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></div>
              {t.unit_label}
            </label>
            <div className="relative">
              <select
                id="ccr-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full appearance-none pl-3 pr-8 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
              >
                <option value="">-- {t.choose_unit} --</option>
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Select Date */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="ccr-date"
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
              {t.select_date}
            </label>
            <div className="relative group/derivative-date">
              <div className="w-full px-3 py-1.5 h-[36px] min-h-[36px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-medium flex items-center justify-between pointer-events-none group-hover/derivative-date:border-slate-300 dark:group-hover/derivative-date:border-slate-600">
                <span>
                  {selectedDate ? formatDate(new Date(selectedDate), 'dd/MM/yyyy') : '--/--/----'}
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Derivative Operating Hours Multi-Session Logger */}
      {selectedUnit && (
        <DerivativeOperatingHoursCard
          date={selectedDate}
          selectedUnit={selectedUnit}
          canWrite={canWrite}
          downtimeRecords={dailyDowntimeData}
          totalDowntimeFromEvents={totalDowntimeFromEvents}
          onSyncTotalRunningHours={handleSyncTotalRunningHours}
          t={t}
        />
      )}

      {/* Enhanced Parameter Data Table */}
      <EnhancedCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {t.ccr_parameter_data_entry_title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
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
              <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs gap-1">
                {/* Refresh Button */}
                <div className="relative group/tooltip">
                  <button
                    type="button"
                    onClick={refreshData}
                    disabled={isRefreshing || !selectedCategory || !selectedUnit}
                    aria-label="Refresh Data"
                    className="min-h-[34px] h-[34px] px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-300 dark:active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={t.refresh_data || 'Refresh Data'}
                  >
                    <ArrowPathIcon
                      className={`w-3.5 h-3.5 text-primary-600 dark:text-primary-400 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span className="hidden sm:inline font-semibold">{t.refresh || 'Refresh'}</span>
                  </button>
                  {/* Last Updated Tooltip */}
                  {lastRefreshTime && (
                    <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-50 px-2 py-1 text-xs text-white bg-neutral-800 rounded shadow-lg whitespace-nowrap">
                      {t.updated_at_label || 'Diperbarui:'}{' '}
                      {formatToWITA(new Date(lastRefreshTime), {
                        includeDate: false,
                        includeTime: true,
                      })}
                    </div>
                  )}
                </div>

                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

                {/* Show/Hide Footer */}
                <button
                  type="button"
                  onClick={() => setIsFooterVisible(!isFooterVisible)}
                  aria-label={isFooterVisible ? t.hide_footer : t.show_footer}
                  className={`min-h-[34px] h-[34px] px-3 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all ${
                    isFooterVisible
                      ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                  }`}
                  title={isFooterVisible ? t.hide_footer : t.show_footer}
                >
                  <span>{t.footer || 'Footer'}</span>
                  {isFooterVisible ? (
                    <ChevronUpIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

                {/* Reorder Parameters */}
                <button
                  type="button"
                  onClick={() => setShowReorderModal(true)}
                  disabled={
                    !selectedCategory || !selectedUnit || filteredParameterSettings.length === 0
                  }
                  aria-label={t.reorder_parameters_title || 'Reorder Parameters'}
                  className="min-h-[34px] h-[34px] px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-300 dark:active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title={t.reorder_parameters_title || 'Reorder Parameters'}
                >
                  <ArrowsUpDownIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-semibold">{t.reorder || 'Reorder'}</span>
                </button>
              </div>

              {/* AI Features Group */}
              {(hasPermission('derivative_plant_operations', 'WRITE') ||
                hasPermission('rkc_plant_operations', 'WRITE')) &&
                selectedUnit && (
                  <div className="flex items-center gap-1.5">
                    <OptimizationAdvisorButton unit={selectedUnit} />
                    {selectedDate && (
                      <ShiftHandoverButton date={selectedDate} unit={selectedUnit} />
                    )}
                  </div>
                )}
            </div>

            {/* Secondary Actions Row (Excel & Admin) */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Excel Operations Group */}
              {(hasPermission('derivative_plant_operations', 'READ') ||
                hasPermission('rkc_plant_operations', 'READ')) && (
                <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs gap-1">
                  {/* Import */}
                  {(hasPermission('derivative_plant_operations', 'WRITE') ||
                    hasPermission('rkc_plant_operations', 'WRITE')) && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".xlsx, .xls"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting || !selectedCategory || !selectedUnit}
                        className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-300 dark:active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title={t.import || 'Import Excel'}
                      >
                        <DocumentArrowUpIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{t.import || 'Import'}</span>
                      </button>
                      <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                    </>
                  )}

                  {/* Template */}
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={
                      isDownloadingTemplate ||
                      !selectedCategory ||
                      !selectedUnit ||
                      filteredParameterSettings.length === 0
                    }
                    className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-300 dark:active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={t.template || 'Template Excel'}
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{t.template || 'Template'}</span>
                  </button>
                  <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

                  {/* Export */}
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={
                      isExporting ||
                      !selectedCategory ||
                      !selectedUnit ||
                      filteredParameterSettings.length === 0
                    }
                    aria-label="Export Excel"
                    className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={t.export || 'Export Excel'}
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5 text-white" />
                    <span>{t.export || 'Export'}</span>
                  </button>

                  {/* Monthly Export & Import Button */}
                  {canAccessMonthlyExportImport(loggedInUser?.role || pb.authStore.model?.role) && (
                    <>
                      <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                      <button
                        type="button"
                        onClick={() => setShowMonthlyModal(true)}
                        aria-label="Ekspor & Impor Data Bulanan"
                        className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-300 dark:active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                        title="Ekspor & Impor Data Bulanan"
                      >
                        <DocumentArrowDownIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold">Bulanan</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Admin Destructive Actions */}
              {isSuperAdmin(loggedInUser?.role) && (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={deleteAllParameters}
                    disabled={
                      isDeletingAll ||
                      !selectedCategory ||
                      !selectedUnit ||
                      dailyParameterData.length === 0
                    }
                    className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 dark:active:bg-rose-900/40 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={t.delete_data || 'Hapus Data'}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{t.delete_data || 'Hapus'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteAllNames}
                    disabled={
                      isDeletingAllNames ||
                      !selectedCategory ||
                      !selectedUnit ||
                      dailyParameterData.length === 0
                    }
                    className="min-h-[34px] h-[34px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 dark:active:bg-rose-900/40 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={t.delete_names || 'Hapus Operator'}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{t.delete_names || 'Hapus Operator'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parameter Data Table Card */}
        {/* Column Search Filter */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t.ccr_search_columns}:
            </span>
            <div className="relative ccr-column-search">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={columnSearchQuery}
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                placeholder={t.ccr_search_placeholder}
                className="pl-8 pr-8 py-1.5 h-[34px] min-h-[34px] text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                style={{ width: '280px' }}
                autoComplete="off"
                title={t.search_columns_tooltip}
              />
              {columnSearchQuery && (
                <button
                  onClick={clearColumnSearch}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={t.ccr_clear_search || 'Clear search'}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSearchActive && (
              <div className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                {filteredParameterSettings.length}{' '}
                {filteredParameterSettings.length === 1
                  ? t.ccr_search_results
                  : t.ccr_search_results_plural}
              </div>
            )}
            {isSearchActive && filteredParameterSettings.length === 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t.ccr_no_columns_match}
              </div>
            )}
            {isSearchActive && (
              <button
                onClick={clearColumnSearch}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                aria-label="Clear column search filter"
              >
                {t.clear_filter_button}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <CcrTableSkeleton />
        ) : (
          <>
            <div
              className="ccr-table-container overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-slate-200 dark:border-slate-800"
              role="grid"
              aria-label={t.ccr_parameter_data_entry_title}
              ref={tableContainerRef}
            >
              {/* Scrollable Table Content */}
              <div className="ccr-table-wrapper">
                <table
                  className="ccr-table border-collapse"
                  role="grid"
                  style={{
                    tableLayout: 'fixed',
                    minWidth: `${320 + filteredParameterSettings.length * 80}px`,
                    width: '100%',
                  }}
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
                    className="bg-slate-700 dark:bg-slate-800 text-white text-center sticky top-0 z-20 shadow-xs border-b border-slate-600 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider py-2 px-2"
                    role="rowgroup"
                  >
                    <tr role="row">
                      <th
                        rowSpan={2}
                        className="px-2 py-2 text-center text-[11px] font-bold text-white uppercase tracking-wider border-r border-slate-600 dark:border-slate-700 sticky left-0 top-0 bg-slate-800 dark:bg-slate-900 z-30 align-middle"
                        style={{ width: '60px', minWidth: '60px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.hour}
                      </th>
                      <th
                        rowSpan={2}
                        className="px-2 py-2 text-center text-[11px] font-bold text-white uppercase tracking-wider border-r border-slate-600 dark:border-slate-700 sticky left-[60px] top-0 bg-slate-800 dark:bg-slate-900 z-30 align-middle"
                        style={{ width: '80px', minWidth: '80px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.shift}
                      </th>
                      <th
                        rowSpan={2}
                        className="px-3 py-2 text-center text-[11px] font-bold text-white uppercase tracking-wider border-r border-slate-600 dark:border-slate-700 sticky left-[140px] top-0 bg-slate-800 dark:bg-slate-900 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.2)] align-middle"
                        style={{ width: '180px', minWidth: '180px' }}
                        role="columnheader"
                        scope="col"
                      >
                        {t.name}
                      </th>
                      {filteredParameterSettings.map((param) => (
                        <th
                          key={param.id}
                          className={`px-2 py-2 text-[11px] font-bold border-r border-slate-600 dark:border-slate-700 text-center bg-slate-700 dark:bg-slate-800 text-white ${
                            shouldHighlightColumn(param) ? 'filtered-column' : ''
                          }`}
                          style={{ width: '80px', minWidth: '80px' }}
                          role="columnheader"
                          scope="col"
                        >
                          <div className="text-center">
                            <div className="font-bold text-[9px] leading-tight uppercase tracking-wider text-white">
                              {param.parameter}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr
                      className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850"
                      role="row"
                    >
                      {filteredParameterSettings.map((param) => (
                        <th
                          key={`minmax-${param.id}`}
                          className={`px-2 py-1 text-[10px] border-r border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-mono ${
                            shouldHighlightColumn(param) ? 'filtered-column' : ''
                          }`}
                          style={{ width: '80px', minWidth: '80px' }}
                          role="columnheader"
                          scope="col"
                        >
                          <div className="text-center space-y-0.5">
                            <div className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                              {param.min_value !== undefined
                                ? `Min: ${formatNumberIndonesian(param.min_value, 1)}`
                                : '-'}
                            </div>
                            <div className="text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                              {param.max_value !== undefined
                                ? `Max: ${formatNumberIndonesian(param.max_value, 1)}`
                                : '-'}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900" role="rowgroup">
                    {filteredParameterSettings.length > 0 ? (
                      Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                        <tr
                          key={hour}
                          className={`border-b border-neutral-200/50 dark:border-slate-800 group ${
                            hour % 2 === 0
                              ? 'bg-white dark:bg-slate-900'
                              : 'bg-neutral-50 dark:bg-slate-800/40'
                          } hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                          role="row"
                        >
                          <td
                            className={`px-2 py-1.5 whitespace-nowrap text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800 sticky left-0 z-20 ${
                              hour % 2 === 0
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-slate-50 dark:bg-slate-850'
                            } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}
                            style={{ width: '60px', minWidth: '60px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center justify-center h-7">
                              <span className="font-mono font-semibold">
                                {String(hour).padStart(2, '0')}:00
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-2 py-1.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200/60 dark:border-slate-800 sticky left-[60px] z-20 ${
                              hour % 2 === 0
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-slate-50 dark:bg-slate-850'
                            } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}
                            style={{ width: '80px', minWidth: '80px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center justify-center h-7">
                              {(() => {
                                const shiftName = getShiftForHour(hour);
                                const isCont = shiftName.toLowerCase().includes('cont');
                                return (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[74px] block text-center"
                                    title={shiftName}
                                  >
                                    {isCont ? 'S3 (Cont)' : shiftName}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td
                            className={`px-2 py-1 whitespace-nowrap text-xs text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 sticky left-[140px] z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)] ${
                              hour % 2 === 0
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-slate-50 dark:bg-slate-850'
                            } group-hover:bg-slate-100 dark:group-hover:bg-slate-800`}
                            style={{ width: '180px', minWidth: '180px' }}
                            role="gridcell"
                          >
                            <div className="flex items-center h-7">
                              {(() => {
                                let userName = null;
                                const userKeyName = `hour${hour}_user`;

                                for (const param of filteredParameterSettings) {
                                  const paramData = parameterDataMap.get(param.id);
                                  if (!paramData) continue;

                                  const userKey = userKeyName as keyof CcrParameterDataFlat;
                                  if (
                                    paramData[userKey] !== null &&
                                    paramData[userKey] !== undefined
                                  ) {
                                    userName = String(paramData[userKey]);
                                    break;
                                  }

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

                                if (isSuperAdmin(loggedInUser?.role)) {
                                  return (
                                    <input
                                      type="text"
                                      value={userName || ''}
                                      onChange={(e) => handleUserNameChange(hour, e.target.value)}
                                      onBlur={(e) => saveUserNameChange(hour, e.target.value)}
                                      className="w-full h-7 px-2 py-0.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-200"
                                      placeholder={t.operator_name_placeholder || 'Nama Operator'}
                                      title={`${t.edit_operator_name} ${t.hour} ${hour}`}
                                      disabled={!canWrite}
                                    />
                                  );
                                } else {
                                  if (userName) {
                                    return (
                                      <span
                                        className="truncate font-medium text-slate-700 dark:text-slate-300 text-xs"
                                        title={userName}
                                      >
                                        {userName}
                                      </span>
                                    );
                                  } else {
                                    return <span className="text-slate-400 italic text-xs">-</span>;
                                  }
                                }
                              })()}
                            </div>
                          </td>
                          {filteredParameterSettings.map((param, paramIndex) => {
                            const paramData = parameterDataMap.get(param.id);
                            const hourKey = `hour${hour}` as keyof CcrParameterDataFlat;
                            const hourValue = paramData?.[hourKey];

                            let value = '';

                            if (hourValue !== undefined && hourValue !== null) {
                              value =
                                param.data_type === ParameterDataType.NUMBER
                                  ? formatIndonesianInput(
                                      hourValue,
                                      getPrecisionForParameter(param.parameter, param.unit),
                                      false
                                    )
                                  : String(hourValue);
                            }

                            const isProductTypeParameter = param.parameter
                              .toLowerCase()
                              .includes('tipe produk');

                            // Determine cell background and text color based on parameter value vs min/max (Sesuai COP Analysis)
                            let cellBgClass =
                              hour % 2 === 0
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-slate-50/40 dark:bg-slate-850/40';
                            let cellTextClass =
                              'text-slate-800 dark:text-slate-200 font-mono font-medium';
                            let cellBorderClass = 'border-transparent';

                            if (
                              param.data_type === ParameterDataType.NUMBER &&
                              value &&
                              !isProductTypeParameter
                            ) {
                              const numValue = parseIndonesianNumber(value);
                              if (numValue !== null) {
                                const isBelowMin =
                                  param.min_value !== undefined && numValue < param.min_value;
                                const isAboveMax =
                                  param.max_value !== undefined && numValue > param.max_value;
                                const hasMinOrMax =
                                  param.min_value !== undefined || param.max_value !== undefined;

                                if (isBelowMin || isAboveMax) {
                                  // Out of range - RED (Sesuai COP Analysis)
                                  cellBgClass = 'bg-red-100/70 dark:bg-red-950/40';
                                  cellTextClass =
                                    'text-red-800 dark:text-red-300 font-mono font-bold';
                                  cellBorderClass = 'border-red-200 dark:border-red-900/60';
                                } else if (hasMinOrMax) {
                                  // Within range - GREEN (Sesuai COP Analysis)
                                  cellBgClass = 'bg-emerald-100/70 dark:bg-emerald-950/40';
                                  cellTextClass =
                                    'text-emerald-800 dark:text-emerald-300 font-mono font-semibold';
                                  cellBorderClass = 'border-emerald-200 dark:border-emerald-900/60';
                                }
                              }
                            }

                            const isCurrentlySaving = false;

                            return (
                              <td
                                key={param.id}
                                className={`p-0.5 border-r border-slate-200 dark:border-slate-800 ${cellBgClass} relative transition-colors ${
                                  shouldHighlightColumn(param) ? 'filtered-column' : ''
                                }`}
                                style={{ width: '80px', minWidth: '80px' }}
                                role="gridcell"
                              >
                                <div className="relative flex items-center justify-center">
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
                                        handleParameterDataChange(param.id, hour, e.target.value);
                                      }}
                                      onBlur={(e) => {
                                        saveParameterChange(param.id, hour, e.target.value);
                                      }}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                      }
                                      disabled={!canWrite}
                                      className={`w-full h-7 text-center text-xs px-1 border border-transparent focus:border-primary-500 rounded focus:ring-1 focus:ring-primary-500 ${cellTextClass} ${
                                        isCurrentlySaving ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      aria-label={`${t.parameter} ${param.parameter} ${t.hour} ${hour}`}
                                      title={`${t.choose_product_type} ${t.hour} ${hour}`}
                                    >
                                      <option value="">{t.choose_product_type}</option>
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
                                      type="text"
                                      value={value}
                                      onChange={(e) => {
                                        let newValue = e.target.value;

                                        if (newValue.endsWith('.')) {
                                          newValue = newValue.slice(0, -1) + ',';
                                        }

                                        if (newValue !== '-' && newValue !== '') {
                                          const parts = newValue.split(',');
                                          let integerPart = parts[0];
                                          const decimalPart =
                                            parts.length > 1 ? ',' + parts[1] : '';

                                          const dotCount = (integerPart.match(/\./g) || []).length;
                                          if (dotCount > 0) {
                                            const lastDotIndex = integerPart.lastIndexOf('.');
                                            const charsAfterDot =
                                              integerPart.length - lastDotIndex - 1;

                                            if (
                                              dotCount > 1 ||
                                              charsAfterDot === 3 ||
                                              decimalPart !== ''
                                            ) {
                                              integerPart = integerPart.replace(/\./g, '');
                                            }
                                          }

                                          const cleanInt = integerPart.replace(/\./g, '');
                                          if (!isNaN(Number(cleanInt)) && cleanInt !== '') {
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
                                        if (param.data_type === ParameterDataType.NUMBER) {
                                          const parsed = parseIndonesianNumber(e.target.value);
                                          if (parsed !== null) {
                                            e.target.value = formatIndonesianInput(
                                              parsed,
                                              getPrecisionForParameter(param.parameter, param.unit)
                                            );
                                          }
                                        }

                                        const value =
                                          param.data_type === ParameterDataType.NUMBER
                                            ? parseIndonesianNumber(e.target.value) !== null
                                              ? parseIndonesianNumber(e.target.value)?.toString()
                                              : ''
                                            : e.target.value;

                                        await saveParameterChange(param.id, hour, value || '');
                                      }}
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                      }
                                      disabled={!canWrite}
                                      className={`w-full h-7 text-center font-mono text-xs font-semibold px-1 py-0.5 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:rounded ${cellTextClass}`}
                                      aria-label={`${t.parameter} ${param.parameter} ${t.hour} ${hour}`}
                                      title={`${t.parameter} ${param.parameter} ${t.hour} ${hour}`}
                                      placeholder={
                                        param.data_type === ParameterDataType.NUMBER
                                          ? ''
                                          : t.placeholder_information
                                      }
                                    />
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
                          className="text-center py-10 text-neutral-500"
                        >
                          {!selectedCategory || !selectedUnit
                            ? t.select_category_unit_date_first
                            : t.no_parameter_master_data_found.replace('{unit}', selectedUnit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                mainTableScrollElement={tableScrollEl}
              />
            )}
          </>
        )}
      </EnhancedCard>

      {/* Bottom Section: Material Storage, Information, and Downtime Data */}
      <div className="space-y-4 sm:space-y-5">
        {/* Penyimpanan Material Trass Kering Data Entry */}
        <EnhancedCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {t.trass_material_storage_title || 'Material Storage'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.trass_material_storage_subtitle ||
                  'Pencatatan stok dan sisa ruang simpan pada Gudang Penyimpanan Material'}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            <table
              className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border-collapse"
              aria-label={t.trass_material_storage_header || 'Tabel Material Storage'}
            >
              <thead className="bg-slate-700 dark:bg-slate-800 text-white shadow-xs">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider border-r border-slate-600/50 align-middle"
                  >
                    {t.trass_material_storage_header || 'Material Storage'}
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider border-r border-slate-600/50 border-b border-slate-600/50"
                  >
                    {t.shift_1}
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider border-r border-slate-600/50 border-b border-slate-600/50"
                  >
                    {t.shift_2}
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider border-b border-slate-600/50"
                  >
                    {t.shift_3}
                  </th>
                </tr>
                <tr>
                  {[...Array(3)].flatMap((_, i) => [
                    <th
                      key={`es-${i}`}
                      className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-r border-slate-600/50 text-center"
                    >
                      {t.ruang_isi || 'Ruang Isi (m)'}
                    </th>,
                    <th
                      key={`c-${i}`}
                      className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-r border-slate-600/50 text-center"
                    >
                      Isi Stock (Ton)
                    </th>,
                    <th
                      key={`p-${i}`}
                      className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-center ${
                        i < 2 ? 'border-r border-slate-600/50' : ''
                      }`}
                    >
                      % Kapasitas
                    </th>,
                  ])}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-8 text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-xs font-medium">{t.loading_data}</span>
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
                      <tr
                        key={siloData.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10">
                          {masterSilo.silo_name}
                        </td>
                        {shifts.map((shift, i) => {
                          const content = siloData[shift]?.content;
                          const emptySpace = siloData[shift]?.emptySpace;
                          const capacity = masterSilo.capacity;
                          const percentage =
                            capacity > 0 && typeof content === 'number'
                              ? (content / capacity) * 100
                              : 0;

                          return (
                            <React.Fragment key={shift}>
                              <td
                                className={`px-1 py-1 whitespace-nowrap text-xs border-r border-slate-200 dark:border-slate-800 ${
                                  siloIndex % 2 === 0
                                    ? 'bg-slate-50/40 dark:bg-slate-850/40'
                                    : 'bg-white dark:bg-slate-900'
                                }`}
                              >
                                <input
                                  ref={(el) => {
                                    const refKey = getInputRef('silo', siloIndex, i * 2);
                                    setInputRef(refKey, el);
                                  }}
                                  type="text"
                                  defaultValue={formatIndonesianInput(emptySpace, 1)}
                                  onChange={(e) => {
                                    const parsed = parseIndonesianNumber(e.target.value);
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
                                  className="w-full text-center px-1.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-40"
                                  aria-label={`Ruang Isi ${masterSilo.silo_name} ${shift}`}
                                  disabled={!canWrite}
                                  title={`Ruang Isi ${masterSilo.silo_name} ${t.shift} ${i + 1}`}
                                  placeholder="0,0"
                                />
                              </td>
                              <td
                                className={`px-1 py-1 whitespace-nowrap text-xs border-r border-slate-200 dark:border-slate-800 ${
                                  siloIndex % 2 === 0
                                    ? 'bg-slate-50/40 dark:bg-slate-850/40'
                                    : 'bg-white dark:bg-slate-900'
                                }`}
                              >
                                <input
                                  ref={(el) => {
                                    const refKey = getInputRef('silo', siloIndex, i * 2 + 1);
                                    setInputRef(refKey, el);
                                  }}
                                  type="text"
                                  defaultValue={formatIndonesianInput(content, 1)}
                                  onChange={(e) => {
                                    const parsed = parseIndonesianNumber(e.target.value);
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
                                  onKeyDown={(e) => handleKeyDown(e, 'silo', siloIndex, i * 2 + 1)}
                                  className="w-full text-center px-1.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-40"
                                  aria-label={`Isi Stock ${masterSilo.silo_name} ${shift}`}
                                  disabled={!canWrite}
                                  title={`Isi Stock ${masterSilo.silo_name} ${t.shift} ${i + 1} (Max: ${masterSilo.capacity})`}
                                  placeholder="0,0"
                                />
                              </td>
                              <td
                                className={`px-1.5 py-1 whitespace-nowrap text-xs text-center align-middle ${
                                  i < 2 ? 'border-r border-slate-200 dark:border-slate-800' : ''
                                }`}
                              >
                                <div className="relative w-full h-5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-emerald-500 dark:bg-emerald-600"
                                    style={{
                                      width: `${Math.min(100, percentage)}%`,
                                    }}
                                  ></div>
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-900 dark:text-white mix-blend-luminosity">
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
                      className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs"
                    >
                      {!selectedCategory
                        ? t.no_plant_categories_found
                        : `${t.no_trass_storage_data || 'Tidak ada data Material Storage untuk kategori'} ${selectedCategory}`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </EnhancedCard>

        {/* Second Row: Information and CCR Downtime Data Entry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Information */}
          <EnhancedCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                  {t.ccr_information_title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {t.ccr_information_description}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="keterangan"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.information_label}
              </label>
              <div className="relative">
                <textarea
                  id="keterangan"
                  rows={6}
                  value={informationText}
                  onChange={(e) => handleInformationChange(e.target.value)}
                  disabled={!selectedCategory || !selectedUnit || !canWrite}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-vertical bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t.information_placeholder}
                />
              </div>
              {isSavingInformation && (
                <div className="flex justify-end">
                  <div className="px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 font-medium">
                    <div className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.auto_save_msg}</span>
                  </div>
                </div>
              )}
            </div>
          </EnhancedCard>

          {/* Downtime Data Entry */}
          <EnhancedCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 space-y-3.5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                    {t.ccr_downtime_title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {t.ccr_downtime_description}
                  </p>
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
                    (!hasPermission('derivative_plant_operations', 'WRITE') &&
                      !hasPermission('rkc_plant_operations', 'WRITE')) ||
                    !selectedCategory ||
                    !selectedUnit ||
                    !canWrite
                  }
                  aria-label={t.add_downtime_button || 'Tambah Downtime'}
                  className="flex items-center gap-1.5 h-[34px] min-h-[34px] px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg shadow-xs text-xs font-semibold"
                >
                  <PlusIcon className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-semibold text-white">
                    {t.add_downtime_button || 'Tambah Downtime'}
                  </span>
                </EnhancedButton>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full border-collapse">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white shadow-xs">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.start_time}
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.end_time}
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.unit}
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.pic}
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.problem}
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold border-b border-slate-600/50 uppercase tracking-wider">
                      {t.action}
                    </th>
                    <th className="relative px-3 py-2 border-b border-slate-600/50">
                      <span className="sr-only">{t.actions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-slate-500 dark:text-slate-400"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-medium">{t.loading_data}</span>
                        </div>
                      </td>
                    </tr>
                  ) : dailyDowntimeData.length > 0 ? (
                    dailyDowntimeData.map((downtime, idx) => (
                      <tr
                        key={downtime.id}
                        className={`group ${
                          idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-slate-50/50 dark:bg-slate-850/50'
                        } hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {downtime.start_time}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {downtime.end_time}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800">
                            {downtime.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
                          {downtime.pic}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 max-w-sm whitespace-pre-wrap">
                          {downtime.problem}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 max-w-sm whitespace-pre-wrap">
                          {downtime.action || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end space-x-1.5">
                            <EnhancedButton
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenEditDowntimeModal(downtime)}
                              aria-label={`Edit downtime for ${downtime.unit}`}
                              className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors"
                            >
                              <EditIcon />
                            </EnhancedButton>
                            <EnhancedButton
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenDeleteModal(downtime)}
                              aria-label={`Delete downtime for ${downtime.unit}`}
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            >
                              <TrashIcon />
                            </EnhancedButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-slate-500 dark:text-slate-400"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg
                            className="w-6 h-6 text-slate-400"
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
                          <span className="text-xs font-medium">{t.no_downtime_recorded}</span>
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
                  {t.ccr_delete_downtime_confirm_title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4">{t.ccr_delete_downtime_message}</p>
                {deletingRecord && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-700">{t.unit}:</span>
                      <span className="text-sm text-neutral-900 font-semibold">
                        {deletingRecord.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-700">{t.date}:</span>
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
                        <span className="text-sm font-medium text-neutral-700">{t.problem}:</span>
                        <span className="text-sm text-neutral-900 font-semibold">
                          {deletingRecord.problem}
                        </span>
                      </div>
                    )}
                    {deletingRecord.start_time && deletingRecord.end_time && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-neutral-700">{t.duration}:</span>
                        <span className="text-sm text-neutral-900 font-semibold">
                          {deletingRecord.start_time} - {deletingRecord.end_time}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-sm text-primary-600 mt-4 font-medium">
                  {t.ccr_delete_downtime_warning}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-neutral-200 gap-2">
          <EnhancedButton
            onClick={handleDeleteConfirm}
            className="sm:ml-3 sm:w-auto w-full bg-[#C7162B] hover:bg-[#9e1122] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm"
            aria-label={t.ccr_delete_permanently}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t.ccr_delete_permanently}
          </EnhancedButton>
          <EnhancedButton
            onClick={handleCloseDeleteModal}
            className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            aria-label={t.cancel_button}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {t.cancel_button}
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
          <details className="group bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs">
            <summary className="font-medium text-neutral-700 cursor-pointer flex items-center justify-between">
              <span>{t.ccr_reorder_instructions_title}</span>
              <span className="text-neutral-400 group-open:rotate-180 transition-transform">
                â–¼
              </span>
            </summary>
            <div className="mt-2 pt-2 border-t border-neutral-200 space-y-2 text-neutral-600">
              <div>
                <p className="font-medium text-neutral-700">{t.ccr_reorder_method_drag}</p>
                <p className="pl-2">{t.ccr_reorder_method_drag_desc}</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">{t.ccr_reorder_method_input}</p>
                <p className="pl-2">{t.ccr_reorder_method_input_desc}</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">{t.ccr_reorder_method_arrow}</p>
                <p className="pl-2">{t.ccr_reorder_method_arrow_desc}</p>
              </div>
              <div>
                <p className="font-medium text-neutral-700">{t.ccr_reorder_method_keyboard}</p>
                <ul className="pl-4 list-disc space-y-0.5">
                  <li>{t.ccr_reorder_method_keyboard_up}</li>
                  <li>{t.ccr_reorder_method_keyboard_down}</li>
                </ul>
              </div>
              <p className="italic text-neutral-500 pt-1">{t.ccr_reorder_auto_save_note}</p>
            </div>
          </details>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder={t.ccr_search_parameter_placeholder}
              aria-label={t.ccr_search_parameter_placeholder}
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
                  {filteredModalParameters.length > 0 ? (
                    filteredModalParameters.map((param) => {
                      // Find original index to keep the correct ordering
                      const originalIndex = modalParameterOrder.findIndex((p) => p.id === param.id);
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
                      {modalSearchQuery ? t.ccr_no_match_search : t.ccr_no_parameters_available}
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
                aria-label={t.export_to_excel}
                className="flex items-center gap-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {t.export_to_excel}
              </EnhancedButton>
              <EnhancedButton
                variant="secondary"
                onClick={() => document.getElementById('import-parameter-order-excel').click()}
                aria-label={t.import_from_excel}
                className="flex items-center gap-1"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                {t.import_from_excel}
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
                    {t.excel_reorder_help_title}
                  </h3>
                  <ul className="list-disc pl-4 text-neutral-600 space-y-1">
                    <li>{t.excel_reorder_export_desc}</li>
                    <li>{t.excel_reorder_import_desc}</li>
                    <li>{t.excel_reorder_edit_desc}</li>
                    <li>{t.excel_reorder_id_note}</li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-neutral-200">
                    <a
                      href="/docs/PARAMETER_ORDER_EXCEL_GUIDE.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 flex items-center"
                    >
                      <span>{t.read_full_guide}</span>
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
                aria-label={t.load_profile || 'Muat Profil'}
              >
                {t.load_profile || 'Muat Profil'}
              </EnhancedButton>
              <EnhancedButton
                variant="secondary"
                onClick={() => setShowSaveProfileModal(true)}
                aria-label={t.save_profile || 'Simpan Profil'}
              >
                {t.save_profile || 'Simpan Profil'}
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
                aria-label={t.reset_to_default || 'Reset'}
              >
                {t.reset_to_default || 'Reset'}
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                onClick={() => {
                  const newOrder = modalParameterOrder.map((param) => param.id);
                  setPbParameterOrder(newOrder);
                  saveParameterOrder(newOrder);
                  setShowReorderModal(false);
                }}
                aria-label={t.done || 'Selesai'}
              >
                {t.done || 'Selesai'}
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
          <p className="text-sm text-neutral-600">{t.ccr_save_profile_desc}</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t.profile_name_label}
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t.profile_name_placeholder}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t.description_optional_label}
              </label>
              <textarea
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                placeholder={t.description_optional_placeholder}
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
              aria-label={t.cancel_button}
            >
              {t.cancel_button}
            </EnhancedButton>
            <EnhancedButton
              variant="primary"
              onClick={saveProfile}
              disabled={!profileName.trim()}
              aria-label={t.save_parameter_order_profile_title}
            >
              {t.save_parameter_order_profile_title}
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
          <p className="text-sm text-neutral-600">{t.ccr_load_profile_desc}</p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">{t.no_profiles_available}</p>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors border border-neutral-200"
                  onClick={() => loadProfile(profile)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-800">{profile.name}</span>
                      {profile.unit && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                          {profile.unit}
                        </span>
                      )}
                      {profile.category && profile.category !== selectedCategory && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 text-neutral-700 rounded-full">
                          {profile.category}
                        </span>
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2">{profile.description}</p>
                    )}
                    <div className="text-xs text-neutral-500">
                      {t.created_by || 'Dibuat oleh:'}{' '}
                      <span className="font-medium text-neutral-700">
                        {profile.creator_name ||
                          (profile.user_id === loggedInUser?.id
                            ? loggedInUser?.name || t.you || 'Anda'
                            : t.another_user || 'Pengguna Lain')}
                      </span>
                      {profile.user_id === loggedInUser?.id && ` (${t.you || 'Anda'})`} â€¢{' '}
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <EnhancedButton
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadProfile(profile);
                      }}
                      aria-label={`${t.load || 'Muat'} profile ${profile.name}`}
                    >
                      {t.load || 'Muat'}
                    </EnhancedButton>
                    {(profile.user_id === loggedInUser?.id || isSuperAdmin(loggedInUser?.role)) && (
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
              aria-label={t.close_button}
            >
              {t.close_button}
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
            {t.ccr_delete_profile_confirm_message.replace('{name}', profileToDelete?.name || '')}
          </p>
        </div>
        <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg gap-2">
          <EnhancedButton
            variant="error"
            onClick={async () => {
              if (profileToDelete) {
                await deleteProfile(profileToDelete);
                setShowDeleteProfileModal(false);
                setProfileToDelete(null);
              }
            }}
            className="sm:ml-3 sm:w-auto w-full"
            aria-label={t.delete_profile || 'Hapus Profil'}
          >
            {t.delete_profile || 'Hapus Profil'}
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            onClick={() => {
              setShowDeleteProfileModal(false);
              setProfileToDelete(null);
            }}
            className="mt-2 sm:mt-0 sm:w-auto w-full"
            aria-label={t.cancel_button || 'Batal'}
          >
            {t.cancel_button || 'Batal'}
          </EnhancedButton>
        </div>
      </Modal>

      {/* Monthly Export & Import Modal */}
      <MonthlyExportImportModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        selectedUnit={selectedUnit}
        t={t}
        onSuccess={refreshData}
      />

      {/* Navigation Help Modal */}
      <CcrNavigationHelp
        isVisible={showNavigationHelp}
        onClose={() => setShowNavigationHelp(false)}
        t={t}
      />
    </div>
  );
};

export default DerivativeCcrDataEntryPage;
