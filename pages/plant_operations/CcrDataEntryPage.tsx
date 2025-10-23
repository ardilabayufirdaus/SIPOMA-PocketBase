import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ExcelJS, { CellValue } from 'exceljs';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { logger } from '../../utils/logger';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useParameterSettings } from '../../hooks/useParameterSettings';
// Menggunakan hook yang sudah diperbaiki dengan mengikuti pola yang sama dengan Silo Data
import {
  useCcrParameterDataFlat,
  CcrParameterDataFlat,
} from '../../hooks/useCcrParameterDataFlatFixed';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useUsers } from '../../hooks/useUsers';
import {
  ParameterDataType,
  CcrDowntimeData,
  CcrSiloData,
  ParameterSetting,
  DowntimeStatus,
} from '../../types';
import { ParameterProfile } from '../../types/Profile';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import Modal from '../../components/Modal';
import CcrDowntimeForm from './CcrDowntimeForm';
import CcrTableFooter from '../../components/ccr/CcrTableFooter';
import CcrTableSkeleton from '../../components/ccr/CcrTableSkeleton';
import CcrNavigationHelp from '../../components/ccr/CcrNavigationHelp';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import { formatNumber, formatNumberWithPrecision } from '../../utils/formatters';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFooterCalculations } from '../../hooks/useFooterCalculations';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import { useCcrInformationData } from '../../hooks/useCcrInformationData';
import { usePermissions } from '../../utils/permissions';
import { PermissionLevel } from '../../types';
import { isSuperAdmin } from '../../utils/roleHelpers';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import PocketBase client and hooks
import { pb } from '../../utils/pocketbase-simple';
import { useUserParameterOrder } from '../../hooks/useUserParameterOrder';
import { formatDateToISO8601, formatToWITA } from '../../utils/dateUtils';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Import UI Components
import { Button } from '../../components/ui';

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

const CcrDataEntryPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
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

  // Parameter reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [modalParameterOrder, setModalParameterOrder] = useState<ParameterSetting[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [originalParameterOrder, setOriginalParameterOrder] = useState<ParameterSetting[]>([]);

  // Profile state
  const [profiles, setProfiles] = useState<ParameterProfile[]>([]);
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [showLoadProfileModal, setShowLoadProfileModal] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ParameterProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ParameterProfile | null>(null);

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
  const isSearchActive = useMemo(() => columnSearchQuery.trim().length > 0, [columnSearchQuery]);

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
  const [focusedCell, setFocusedCell] = useState<{
    table: 'silo' | 'parameter';
    row: number;
    col: number;
  } | null>(null);

  // Improved inputRefs management with cleanup
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
  const debouncedUpdates = useRef<Map<string, { value: string; timer: NodeJS.Timeout }>>(new Map());

  // Ref for main table wrapper to sync scroll with footer
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref to prevent concurrent footer data saves
  const footerSaveInProgress = useRef(false);

  const { users } = useUsers();
  const currentUser = users[0] || { full_name: 'Operator' };

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
  }, [plantUnits, permissionChecker]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Use PocketBase hook for parameter order management
  const {
    parameterOrder: pbParameterOrder,
    setParameterOrder: setPbParameterOrder,
    loading: parameterOrderLoading,
    error: parameterOrderError,
  } = useUserParameterOrder({
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
  const unitToCategoryMap = useMemo(
    () => new Map(plantUnits.map((pu) => [pu.unit, pu.category])),
    [plantUnits]
  );

  // Hapus auto-select: biarkan user memilih kategori secara manual

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    try {
      // Use filter syntax with spaces between operator and values (confirmed working)
      // Note: No specific sort is used as the 'created' field doesn't exist in the schema
      const records = await pb.collection('parameter_order_profiles').getFullList({
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
      // Ignore auto-cancellation errors, they're normal during component unmounting
      if (err instanceof Error && err.message?.includes('autocancelled')) {
        // This is an expected behavior, don't update state
        return;
      }
      showToast('Failed to fetch profiles');
      setProfiles([]);
    }
  }, []);

  // Save profile
  const saveProfile = useCallback(async () => {
    if (!loggedInUser?.id || !profileName.trim() || modalParameterOrder.length === 0) {
      return;
    }

    try {
      await pb.collection('parameter_order_profiles').create({
        name: profileName.trim(),
        description: profileDescription.trim() || null,
        user_id: loggedInUser.id,
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        category: selectedCategory,
        unit: selectedUnit,
        parameter_order: modalParameterOrder.map((p) => p.id),
      });

      showToast('Profile saved successfully');
      setShowSaveProfileModal(false);
      setProfileName('');
      setProfileDescription('');
      fetchProfiles();
    } catch {
      showToast('Failed to save profile');
      showToast('Failed to save profile');
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
        // && permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.unit)
      .sort();

    // Debug log removed for cleaner console output
    return units;
  }, [plantUnits, selectedCategory, permissionChecker]);

  // Hapus auto-select: biarkan user memilih unit secara manual

  // Silo Data Hooks and Filtering
  const { records: siloMasterData } = useSiloCapacities();
  const {
    getDataForDate: getSiloDataForDate,
    updateSiloData,
    createSiloData,
    deleteSiloData,
  } = useCcrSiloData();
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
          const formattedDate = formatDateToISO8601(selectedDate);

          // Fetch data directly from database
          const records = await pb.collection('ccr_silo_data').getFullList({
            filter: `date="${formattedDate}"`,
            sort: 'created',
            expand: 'silo_id',
          });

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
      } catch (error) {
        showToast('Error fetching silo data');
        // Log error hanya dalam mode development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Silo data fetch error:', error);
        }
      }
    },
    [selectedDate, selectedUnit, getSiloDataForDate, siloMasterData, selectedCategory]
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
  }, [selectedDate, selectedCategory, selectedUnit]);

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

      // Make the order column editable with yellow highlight
      const orderColumn = worksheet.getColumn(1);
      orderColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 4) {
          // Skip header rows
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' }, // Light yellow
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

      showToast('Parameter order exported successfully');
    } catch (error) {
      showToast('Failed to export parameter order');
      console.error('Export error:', error);
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
              showToast('Invalid Excel file format');
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
              showToast('Warning: Some parameters could not be imported');
            }

            // Apply the new order
            setModalParameterOrder(finalOrder);
            showToast('Parameter order imported successfully');
          } catch (error) {
            showToast('Failed to process Excel file');
            console.error('Import processing error:', error);
          }
        };

        reader.readAsArrayBuffer(file);

        // Reset file input to allow re-importing the same file
        e.target.value = '';
      } catch (error) {
        showToast('Failed to import parameter order');
        console.error('Import error:', error);
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
            className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg ${
              snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 dark:ring-blue-600' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                {...provided.dragHandleProps}
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6H6V8H8V6Z M8 11H6V13H8V11Z M8 16H6V18H8V16Z M18 6H16V8H18V6Z M18 11H16V13H18V11Z M18 16H16V18H18V16Z M13 6H11V8H13V6Z M13 11H11V13H13V11Z M13 16H11V18H13V16Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {index + 1}.
                </span>
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {param.parameter}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{param.unit}</div>
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
                className="w-14 px-1 py-1 text-sm text-center border border-slate-300 rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                title="Masukkan nomor posisi parameter"
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
        showToast(`Profile "${profile.name}" loaded`);
      } catch {
        showToast('Failed to load profile');
        showToast('Failed to load profile');
      }
    },
    [filteredParameterSettings, showToast]
  );

  // Delete profile
  const deleteProfile = useCallback(
    async (profile: ParameterProfile) => {
      if (!profile?.id) {
        showToast('Invalid profile selected');
        return;
      }

      // Check if user owns the profile or is Super Admin
      const isOwner = profile.user_id === loggedInUser?.id;
      const canDelete = isOwner || isSuperAdmin(loggedInUser?.role);

      if (!canDelete) {
        showToast('You can only delete your own profiles');
        return;
      }

      try {
        await pb.collection('parameter_order_profiles').delete(profile.id);

        showToast(`Profile "${profile.name}" deleted successfully`);
        fetchProfiles(); // Refresh the profiles list
      } catch {
        showToast('Failed to delete profile');
        showToast('Failed to delete profile: Network or server error');
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
    updateParameterData,
    dataVersion, // Version untuk memicu refresh
    triggerRefresh, // Fungsi untuk refresh manual
    isManualRefreshing, // Status refresh
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
      const userName = loggedInUser?.full_name || currentUser.full_name || 'Unknown User';
    } catch (error) {
      console.error('Error fetching parameter data:', error);
      showToast('Error fetching parameter data');
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
      // Menggunakan console.log untuk debugging
      console.log('Fetching data based on input changes', {
        selectedDate,
        selectedUnit,
        selectedCategory,
      });
    }
    // Remove fetchParameterData from dependency array to prevent infinite loops
  }, [selectedDate, selectedUnit, selectedCategory]);

  // Jika masih perlu dataVersion sebagai picu refresh (sudah diperbaiki di useCcrParameterData.ts)
  // Menggunakan useRef untuk mencegah double fetching
  const lastDataVersion = useRef(dataVersion);

  useEffect(() => {
    // Hanya refresh jika dataVersion berubah dan lebih besar dari sebelumnya
    if (dataVersion > 0 && dataVersion > lastDataVersion.current) {
      console.log('Data version changed, refreshing data');
      lastDataVersion.current = dataVersion;
      fetchParameterData();
    }
  }, [dataVersion]);

  // Fungsi untuk refresh data secara manual
  const refreshData = useCallback(async () => {
    if (!selectedDate || !selectedUnit || !selectedCategory) {
      showToast('Pilih kategori, unit, dan tanggal terlebih dahulu');
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

      showToast('Data berhasil di-refresh');
      console.log('Manual refresh completed for all CCR data');
    } catch (error) {
      console.error('Error refreshing data:', error);
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
  ]);

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
  const { saveFooterData, getFooterDataForDate } = useCcrFooterData();

  // Auto-save footer data when it changes - immediate save for data integrity
  useEffect(() => {
    const saveFooterDataAsync = async () => {
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
        // Save footer data for each parameter
        const savePromises = filteredParameterSettings.map(async (param) => {
          const footerData = parameterFooterData[param.id];
          const shiftData = parameterShiftFooterData;
          const averageData = parameterShiftAverageData;
          const counterData = parameterShiftCounterData;

          if (footerData) {
            return saveFooterData({
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
            });
          }
        });

        await Promise.all(savePromises.filter(Boolean));
      } catch {
        // Don't show error to user as this is background save
        // Footer data will be recalculated and saved again on next change
      } finally {
        footerSaveInProgress.current = false;
      }
    };

    // Save immediately when footer data changes (no debounce for data integrity)
    if (filteredParameterSettings.length > 0 && selectedDate) {
      saveFooterDataAsync();
    }
  }, [
    parameterFooterData,
    parameterShiftFooterData,
    parameterShiftAverageData,
    parameterShiftCounterData,
    filteredParameterSettings,
    selectedDate,
    selectedCategory,
    saveFooterData,
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
  const { getDowntimeForDate, addDowntime, updateDowntime, deleteDowntime, refetch } =
    useCcrDowntimeData(selectedDate);
  // FIXED: Menghapus filter yang terlalu ketat pada downtime data dan menyediakan
  // fallback untuk data dengan unit yang tidak ada di unitToCategoryMap
  const dailyDowntimeData = useMemo(() => {
    const allDowntimeForDate = getDowntimeForDate(selectedDate);

    // Filter downtime data berdasarkan selectedUnit yang dipilih di CCR Data Entry
    if (!selectedUnit) {
      return allDowntimeForDate.sort((a, b) => a.start_time.localeCompare(b.start_time));
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
  } = useCcrInformationData();
  const [informationText, setInformationText] = useState('');
  const [hasUnsavedInformationChanges, setHasUnsavedInformationChanges] = useState(false);

  // Effect untuk memuat data informasi saat tanggal atau unit berubah
  useEffect(() => {
    if (!selectedDate || !selectedUnit) return;

    const loadInformation = async () => {
      const info = getInformationForDate(selectedDate, selectedUnit);
      if (info) {
        setInformationText(info.information || '');
        setHasUnsavedInformationChanges(false);
      } else {
        setInformationText('');
        setHasUnsavedInformationChanges(false);
      }
    };

    loadInformation();
  }, [selectedDate, selectedUnit, getInformationForDate]);

  const formatStatValue = (value: number | undefined, _precision = 1) => {
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
    precision: number = 1
  ): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return formatNumberWithPrecision(numValue, precision);
  };

  const parseInputValue = (formattedValue: string): number | null => {
    if (!formattedValue || formattedValue.trim() === '') return null;
    // Handle both comma and dot as decimal separators
    // If contains comma, treat comma as decimal separator (Indonesian format)
    // If no comma, treat dot as decimal separator (standard format)
    let normalized: string;
    if (formattedValue.includes(',')) {
      // Indonesian format: remove dots (thousands separator) and replace comma with dot
      normalized = formattedValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard format: dot is already decimal separator
      normalized = formattedValue;
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
        const unitFilteredRecords = existingRecords.filter((record) => {
          const expandData = record.expand as Record<string, unknown> | undefined;
          const siloData = expandData?.silo_id as Record<string, unknown> | undefined;
          return siloData && typeof siloData.unit === 'string' && siloData.unit === selectedUnit;
        });

        // Create data object with the flat field
        const updateData = { [flatFieldName]: value };

        if (unitFilteredRecords.length > 0) {
          // Record exists - update it
          const recordId = unitFilteredRecords[0].id;

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
      } catch (error) {
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
        const shiftNum = shift.replace('shift', '');
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
      } catch (error) {
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
    } catch (error) {
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
      setHasUnsavedInformationChanges(false);
    }
  }, [selectedDate, selectedUnit, getInformationForDate]);

  // Wrapper function for parameter data changes with optimistic updates and immediate saving
  // Track pending changes yang belum disimpan ke database
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, { parameterId: string; hour: number; value: string }>
  >(new Map());

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
        const changeKey = `${parameterId}_${hour}`;
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.set(changeKey, { parameterId, hour, value });
          return newMap;
        });

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
        await updateParameterData(parameterId, selectedDate, hour, value, effectiveUserName);

        // Hapus dari pending changes setelah berhasil disimpan
        const changeKey = `${parameterId}_${hour}`;
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.delete(changeKey);
          return newMap;
        });
      } catch (error) {
        console.error('Failed to save parameter data:', error);
        showToast('Error saving parameter data');
      }
    },
    [updateParameterData, loggedInUser, currentUser, selectedDate, setPendingChanges, showToast]
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
        alert('No parameter data found for the selected date and unit.');
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
      setPendingChanges(new Map());

      showToast(`Successfully deleted ${deletedCount} parameter records`);
      announceToScreenReader(`Deleted ${deletedCount} parameter records`);
    } catch (error) {
      console.error('Error deleting parameter data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete parameter data: ${errorMessage}`);
      showToast('Error deleting parameter data');
    } finally {
      setIsDeletingAll(false);
    }
  }, [
    selectedDate,
    selectedUnit,
    setDailyParameterData,
    setPendingChanges,
    showToast,
    announceToScreenReader,
  ]);

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
        alert('No parameter data found for the selected date and unit.');
        return;
      }

      // Update records to clear name fields (set to null)
      const batchSize = 5; // Reduced batch size for better stability
      let updatedCount = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (record) => {
            // Clear all hour{X}_user fields and name field
            const updateData: any = {};
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

      showToast(`Successfully cleared user names from ${updatedCount} parameter records`);
      announceToScreenReader(`Cleared user names from ${updatedCount} parameter records`);
    } catch (error) {
      console.error('Error deleting user names:', error);

      // Check if it's a network error
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('ERR_NETWORK') ||
            error.message.includes('fetch')));

      let errorMessage = 'Unknown error occurred';

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
      } catch (error) {
        console.error('Failed to save user name changes:', error);
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
      showToast('Silakan pilih Unit Name terlebih dahulu sebelum menambah downtime.');
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
      refetch();

      // Attempt 2: Refresh setelah 500ms
      setTimeout(() => {
        refetch();
      }, 500);

      // Attempt 3: Refresh setelah 1.5 detik
      setTimeout(() => {
        refetch();
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
  function createDebounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: any[]) {
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
  const saveInformationWithDebounce = useCallback(
    createDebounce(async (value: string) => {
      if (!selectedDate || !selectedUnit || isSavingInformation) return;

      try {
        await saveInformation({
          date: selectedDate,
          plantUnit: selectedUnit,
          information: value,
        });
        setHasUnsavedInformationChanges(false);
      } catch (error) {
        console.error('Failed to save information:', error);
        // Silently fail without showing a toast for auto-save
      }
    }, 1000), // 1 second debounce
    [selectedDate, selectedUnit, saveInformation, isSavingInformation]
  );

  // Information change handler with auto-save
  const handleInformationChange = useCallback(
    (value: string) => {
      setInformationText(value);
      setHasUnsavedInformationChanges(true);
      saveInformationWithDebounce(value);
    },
    [saveInformationWithDebounce]
  );

  // Export to Excel functionality
  const handleExport = async () => {
    if (isExporting) return;

    if (!selectedCategory || !selectedUnit || filteredParameterSettings.length === 0) {
      alert('Please select a plant category and unit with available parameters before exporting.');
      return;
    }

    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();

      // Get parameter data for the selected date
      await getParameterDataForDate(selectedDate);
      const footerData = await getFooterDataForDate(selectedDate, selectedUnit);
      const downtimeData = getDowntimeForDate(selectedDate);

      // Export Parameter Data
      if (filteredParameterSettings.length > 0) {
        const worksheetParam = workbook.addWorksheet('Parameter Data');

        // Create headers with user tracking columns
        const paramHeaders = filteredParameterSettings.map((p) => p.parameter);
        const userHeaders = filteredParameterSettings.map((p) => `${p.parameter}_User`);
        const headers = ['Date', 'Hour', 'Shift', 'Unit', ...paramHeaders, ...userHeaders];
        worksheetParam.addRow(headers);

        // Create rows for each hour (1-24)
        for (let hour = 1; hour <= 24; hour++) {
          let shift = '';
          if (hour >= 1 && hour <= 7) shift = `${t.shift_3} (${t.shift_3_cont})`;
          else if (hour >= 8 && hour <= 15) shift = t.shift_1;
          else if (hour >= 16 && hour <= 22) shift = t.shift_2;
          else shift = t.shift_3;
          const rowData = [selectedDate, hour, shift, selectedUnit];

          // Add parameter values and user tracking for this hour
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

            // Get value and user for current hour
            const hourValue = hourlyValues[hour.toString()];
            let paramValue = '';
            let userName = '';

            if (
              typeof hourValue === 'object' &&
              hourValue !== null &&
              'value' in hourValue &&
              'user_name' in hourValue
            ) {
              paramValue = String(hourValue.value);
              userName = hourValue.user_name;
            } else if (typeof hourValue === 'string' || typeof hourValue === 'number') {
              paramValue = String(hourValue);
            }

            rowData.push(paramValue);
          });

          // Add user tracking data
          filteredParameterSettings.forEach((param) => {
            const paramData = parameterDataMap.get(param.id);
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

            const hourValue = hourlyValues[hour.toString()];
            let userName = '';

            if (typeof hourValue === 'object' && hourValue !== null && 'user_name' in hourValue) {
              userName = hourValue.user_name;
            }

            rowData.push(userName);
          });

          worksheetParam.addRow(rowData);
        }
      }

      // Export Footer Data
      if (footerData && footerData.length > 0) {
        const footerExportData = footerData.map((row) => ({
          Date: row.date,
          Unit: row.unit,
          Target_Production: row.target_production || '',
          Next_Shift_PIC: row.next_shift_pic || '',
          Handover_Notes: row.handover_notes || '',
        }));

        const worksheetFooter = workbook.addWorksheet('Footer Data');
        worksheetFooter.addRows(footerExportData);
      }

      // Export Downtime Data
      if (downtimeData && downtimeData.length > 0) {
        const filteredDowntime = downtimeData.filter((d) => d.date === selectedDate);
        if (filteredDowntime.length > 0) {
          const downtimeExportData = filteredDowntime.map((row) => ({
            Date: row.date,
            Start_Time: row.start_time,
            End_Time: row.end_time,
            Unit: row.unit,
            PIC: row.pic,
            Problem: row.problem,
          }));

          const worksheetDowntime = workbook.addWorksheet('Downtime Data');
          worksheetDowntime.addRows(downtimeExportData);
        }
      }

      // Export Silo Data
      if (dailySiloData && dailySiloData.length > 0) {
        const siloExportData = dailySiloData.map((row) => ({
          Date: row.date,
          Silo_ID: row.silo_id,
          Shift1_EmptySpace: row.shift1?.emptySpace ?? '',
          Shift1_Content: row.shift1?.content ?? '',
          Shift2_EmptySpace: row.shift2?.emptySpace ?? '',
          Shift2_Content: row.shift2?.content ?? '',
          Shift3_EmptySpace: row.shift3?.emptySpace ?? '',
          Shift3_Content: row.shift3?.content ?? '',
        }));

        const worksheetSilo = workbook.addWorksheet('Silo Data');
        worksheetSilo.addRows(siloExportData);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `CCR_Data_${selectedUnit}_${timestamp}.xlsx`;

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
    } catch {
      showToast('Error exporting CCR parameter data');
      alert('An error occurred while exporting data. Please try again.');
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

      // Create headers with user tracking columns
      const paramHeaders = filteredParameterSettings.map((p) => p.parameter);
      const userHeaders = filteredParameterSettings.map((p) => `${p.parameter}_User`);
      const headers = ['Date', 'Hour', 'Shift', 'Unit', ...paramHeaders, ...userHeaders];
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

        // Add empty cells for user tracking
        filteredParameterSettings.forEach(() => {
          rowData.push(''); // Empty user name
        });

        worksheetParam.addRow(rowData);
      }

      // Add note about date format
      worksheetParam.addRow([]);
      worksheetParam.addRow(['Note:']);
      worksheetParam.addRow(['- Date format: YYYY-MM-DD']);
      worksheetParam.addRow(['- Hour: 1-24']);
      worksheetParam.addRow(['- Unit: Must match selected unit']);
      worksheetParam.addRow(['- User columns are optional (leave empty to use current user)']);

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
    } catch (error) {
      console.error('Error creating template:', error);
      showToast('Error creating Excel template');
      alert('An error occurred while creating the template. Please try again.');
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
        console.log('🔍 DEBUG: Processing Parameter Data worksheet');
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
              console.log(
                '🔍 DEBUG: Parameter headers found (skipping empty first column):',
                paramHeaders
              );
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
          console.log('🔍 DEBUG: Parameter data rows processed:', paramData.length);
          if (paramData.length > 0) {
            console.log('🔍 DEBUG: Validating parameter data structure...');
            // Validate data structure and filter out invalid rows (likely summary/empty rows)
            const requiredFields = ['Date', 'Hour', 'Unit'];
            const validParamData = paramData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Skipping parameter row',
                  index + 2,
                  'missing fields:',
                  missingFields,
                  '- likely summary or empty row'
                );
                return false; // Skip this row
              }
              return true; // Keep this row
            });

            console.log(
              '🔍 DEBUG: Validation complete, skipped rows:',
              paramData.length - validParamData.length,
              'valid rows:',
              validParamData.length
            );

            if (validParamData.length === 0) {
              console.log('⚠️ DEBUG: No valid parameter data rows found after validation');
              errorMessages.push(
                'Parameter Data: No valid data rows found (all rows appear to be summary or empty rows)'
              );
            } else {
              console.log('🔍 DEBUG: Processing valid parameter data...');
              // Process valid data
              for (const row of validParamData) {
                const hour = Number(row.Hour);
                console.log('🔍 DEBUG: Processing row for hour:', hour);

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
                      console.warn('⚠️ DEBUG: Parameter setting not found for:', paramName);
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
        } catch (error) {
          console.error('❌ DEBUG: Parameter Data import failed:', error);
          errorMessages.push(
            `Parameter Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        console.log('🔍 DEBUG: Parameter Data worksheet not found');
      }

      // Perform bulk save for all collected parameter changes
      if (allParameterChanges.length > 0) {
        console.log('🔍 DEBUG: Starting bulk save for all parameter changes...');
        try {
          const savedCount = await bulkSaveParameterChanges(allParameterChanges);
          importCount += savedCount;
          console.log('✅ DEBUG: Bulk save completed, total imported:', importCount);
        } catch (error) {
          console.error('❌ DEBUG: Bulk save failed:', error);
          errorMessages.push(
            `Bulk save failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Footer Data
      const footerWorksheet = workbook.getWorksheet('Footer Data');
      if (footerWorksheet) {
        console.log('🔍 DEBUG: Processing Footer Data worksheet');
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
          console.log('🔍 DEBUG: Footer data rows processed:', footerData.length);
          if (footerData.length > 0) {
            console.log('🔍 DEBUG: Validating footer data structure...');
            // Validate data structure
            const requiredFields = ['Date', 'Unit'];
            const invalidRows = footerData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid footer row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Footer Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
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
        } catch (error) {
          console.error('❌ DEBUG: Footer Data import failed:', error);
          errorMessages.push(
            `Footer Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        console.log('🔍 DEBUG: Footer Data worksheet not found');
      }

      // Import Downtime Data
      const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
      if (downtimeWorksheet) {
        console.log('🔍 DEBUG: Processing Downtime Data worksheet');
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
          console.log('🔍 DEBUG: Downtime data rows processed:', downtimeData.length);
          if (downtimeData.length > 0) {
            console.log('🔍 DEBUG: Validating downtime data structure...');
            // Validate data structure - make PIC optional for import
            const requiredFields = ['Date', 'Start_Time', 'End_Time', 'Unit', 'Problem'];
            const invalidRows = downtimeData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid downtime row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Downtime Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
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
              console.log('🔍 DEBUG: Processing valid downtime data...');
              // Collect unique dates from import data
              const importDates = [...new Set(downtimeData.map((row) => String(row.Date)))];
              console.log('🔍 DEBUG: Unique dates found for downtime:', importDates);

              // Delete existing downtime data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  console.log('🔍 DEBUG: Deleting existing downtime data for dates:', importDates);
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
                    console.log('🔍 DEBUG: Deleting downtime record:', record.id);
                    await pb.collection('ccr_downtime_data').delete(record.id);
                  }

                  showToast(`Deleted existing downtime data for dates: ${importDates.join(', ')}`);
                  // Refresh downtime data to reflect changes
                  refetch();
                  console.log('✅ DEBUG: Existing downtime data deleted successfully');
                } catch (error) {
                  console.error('❌ DEBUG: Error deleting existing downtime data:', error);
                  errorMessages.push(
                    `Error deleting existing downtime data: ${error instanceof Error ? error.message : 'Unknown error'}`
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

                  console.log('🔍 DEBUG: Adding downtime data:', downtimeObj);
                  const result = await addDowntime(downtimeObj);

                  if (result.success) {
                    importCount++;
                    console.log(
                      '✅ DEBUG: Downtime data saved successfully, total count:',
                      importCount
                    );
                  } else {
                    console.error('❌ DEBUG: Failed to save downtime data:', result.error);
                    errorMessages.push(
                      `Failed to save downtime data for ${row.Date}: ${result.error}`
                    );
                  }
                } catch (error) {
                  console.error('❌ DEBUG: Failed to save downtime data for', row.Date, ':', error);
                  errorMessages.push(
                    `Failed to save downtime data for ${row.Date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ DEBUG: Downtime Data import failed:', error);
          errorMessages.push(
            `Downtime Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        console.log('🔍 DEBUG: Downtime Data worksheet not found');
      }

      // Import Silo Data
      const siloWorksheet = workbook.getWorksheet('Silo Data');
      if (siloWorksheet) {
        console.log('🔍 DEBUG: Processing Silo Data worksheet');
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
          console.log('🔍 DEBUG: Silo data rows processed:', siloData.length);
          if (siloData.length > 0) {
            console.log('🔍 DEBUG: Validating silo data structure...');
            // Validate data structure
            const requiredFields = ['Date', 'Silo_ID'];
            const invalidRows = siloData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                console.warn(
                  '⚠️ DEBUG: Invalid silo row',
                  index + 2,
                  'missing fields:',
                  missingFields
                );
                errorMessages.push(
                  `Silo Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
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
              console.log('🔍 DEBUG: Processing valid silo data...');
              // Collect unique dates from import data
              const importDates = [...new Set(siloData.map((row) => String(row.Date)))];
              console.log('🔍 DEBUG: Unique dates found for silo:', importDates);

              // Delete existing silo data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  console.log('🔍 DEBUG: Deleting existing silo data for dates:', importDates);
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
                    console.log('🔍 DEBUG: Deleting silo record:', record.id);
                    await pb.collection('ccr_silo_data').delete(record.id);
                  }

                  // Refresh silo data to reflect changes
                  getSiloDataForDate(selectedDate).then((data) => {
                    setAllDailySiloData(data);
                  });
                  console.log('✅ DEBUG: Existing silo data deleted successfully');
                } catch (error) {
                  console.error('❌ DEBUG: Error deleting existing silo data:', error);
                  errorMessages.push(
                    `Error deleting existing silo data: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }

              // Process valid data
              for (const row of siloData) {
                try {
                  const siloId = String(row.Silo_ID);
                  const date = String(row.Date);
                  console.log('🔍 DEBUG: Processing silo row for date:', date, 'silo:', siloId);

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
                    '🔍 DEBUG: Shift data prepared - Shift1:',
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

                  console.log('🔍 DEBUG: Is silo data empty?', isEmpty);

                  if (!isEmpty) {
                    console.log('🔍 DEBUG: Updating silo data for non-empty shifts...');
                    // Update silo data for each shift if data exists
                    if (shift1.emptySpace !== undefined || shift1.content !== undefined) {
                      try {
                        console.log('🔍 DEBUG: Updating silo shift1 data...');
                        await updateSiloData(
                          date,
                          siloId,
                          'shift1',
                          'emptySpace',
                          shift1.emptySpace
                        );
                        await updateSiloData(date, siloId, 'shift1', 'content', shift1.content);
                        console.log('✅ DEBUG: Silo shift1 data updated successfully');
                      } catch (error) {
                        console.error('❌ DEBUG: Failed to update silo shift1:', error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift1 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift2.emptySpace !== undefined || shift2.content !== undefined) {
                      try {
                        console.log('🔍 DEBUG: Updating silo shift2 data...');
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
                        console.log('✅ DEBUG: Silo shift2 data updated successfully');
                      } catch (error) {
                        console.error('❌ DEBUG: Failed to update silo shift2:', error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift2 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift3.emptySpace !== undefined || shift3.content !== undefined) {
                      try {
                        console.log('🔍 DEBUG: Updating silo shift3 data...');
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
                        console.log('✅ DEBUG: Silo shift3 data updated successfully');
                      } catch (error) {
                        console.error('❌ DEBUG: Failed to update silo shift3:', error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift3 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }

                    importCount++;
                    console.log(
                      '✅ DEBUG: Silo data processing completed, total count:',
                      importCount
                    );
                  } else {
                    console.log('🔍 DEBUG: Skipping empty silo data row');
                  }
                } catch (error) {
                  console.error(
                    '❌ DEBUG: Failed to save silo data for',
                    row.Date,
                    'silo',
                    row.Silo_ID,
                    ':',
                    error
                  );
                  errorMessages.push(
                    `Failed to save silo data for ${row.Date} silo ${row.Silo_ID}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ DEBUG: Silo Data import failed:', error);
          errorMessages.push(
            `Silo Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        console.log('🔍 DEBUG: Silo Data worksheet not found');
      }

      // Show results
      console.log('🔍 DEBUG: Import process completed');
      console.log('✅ DEBUG: Final import count:', importCount);
      console.log('⚠️ DEBUG: Total error messages:', errorMessages.length);

      if (importCount > 0) {
        console.log('✅ DEBUG: Showing success message for', importCount, 'imported records');
        alert(`Successfully imported ${importCount} records to the database.`);
      }

      if (errorMessages.length > 0) {
        console.log('⚠️ DEBUG: Showing error messages:', errorMessages);
        alert(`Import validation completed with errors:\n${errorMessages.join('\n')}`);
      }

      if (importCount === 0 && errorMessages.length === 0) {
        console.log('⚠️ DEBUG: No records imported and no errors - possible empty file');
        alert('No data was imported. Please check your Excel file format.');
      }
    } catch (error) {
      console.error('❌ DEBUG: Critical error during Excel import:', error);
      alert('Error processing Excel file. Please check the file format and try again.');
    } finally {
      console.log('🔍 DEBUG: Import process finished, resetting state');
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
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
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
              <div className="relative flex-1 min-w-0">
                <select
                  id="ccr-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors appearance-none"
                >
                  <option value="">Pilih Kategori</option>
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="ccr-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                {t.unit_label}:
              </label>
              <div className="relative flex-1 min-w-0">
                <select
                  id="ccr-unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  disabled={unitsForCategory.length === 0}
                  className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors appearance-none"
                >
                  <option value="">Pilih Unit</option>
                  {unitsForCategory.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
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

      {/* Enhanced Parameter Data Table */}
      <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
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
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                {t.ccr_parameter_data_entry_title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Pastikan Plant Kategori dan Plant Unit sesuai dengan filter yang diterapkan sebelum
                mengisi data parameter.
              </p>
            </div>
          </div>

          {/* Enhanced Table Controls */}
          <div className="flex items-center gap-4">
            {/* Export/Import Controls - Hidden for Operator role */}
            {loggedInUser?.role !== 'Operator' && (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                {/* Import Excel Button */}
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    isImporting || !selectedCategory || !selectedUnit
                    // !permissionChecker.hasPermission('plant_operations', 'WRITE')
                  }
                  leftIcon={
                    isImporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <DocumentArrowUpIcon className="w-5 h-5" />
                    )
                  }
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isImporting ? 'Importing...' : t.import_excel || 'Import Excel'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Button>

                {/* Download Template Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDownloadTemplate}
                  disabled={
                    isDownloadingTemplate ||
                    !selectedCategory ||
                    !selectedUnit ||
                    filteredParameterSettings.length === 0
                  }
                  leftIcon={
                    isDownloadingTemplate ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    )
                  }
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isDownloadingTemplate ? 'Downloading...' : 'Download Template'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Button>

                {/* Export Excel Button */}
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleExport}
                  disabled={
                    isExporting ||
                    !selectedCategory ||
                    !selectedUnit ||
                    filteredParameterSettings.length === 0
                    // !permissionChecker.hasPermission('plant_operations', 'READ')
                  }
                  leftIcon={
                    isExporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    )
                  }
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isExporting ? 'Exporting...' : t.export_excel || 'Export Excel'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Button>

                {/* Delete All Parameters Button */}
                <Button
                  variant="error"
                  size="lg"
                  onClick={deleteAllParameters}
                  disabled={
                    isDeletingAll ||
                    !selectedCategory ||
                    !selectedUnit ||
                    dailyParameterData.length === 0
                  }
                  leftIcon={
                    isDeletingAll ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )
                  }
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isDeletingAll ? 'Deleting...' : 'Delete All Data'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Button>

                {/* Delete All Names Button - Super Admin Only */}
                {isSuperAdmin(loggedInUser?.role) && (
                  <Button
                    variant="error"
                    size="lg"
                    onClick={deleteAllNames}
                    disabled={
                      isDeletingAllNames ||
                      !selectedCategory ||
                      !selectedUnit ||
                      dailyParameterData.length === 0
                    }
                    leftIcon={
                      isDeletingAllNames ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-5 h-5"
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
                      )
                    }
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10">
                      {isDeletingAllNames ? 'Deleting...' : 'Delete All Names'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </Button>
                )}
              </div>
            )}

            {/* Show/Hide Footer Button */}
            <Button
              variant="glass"
              size="base"
              onClick={() => setIsFooterVisible(!isFooterVisible)}
              aria-label={isFooterVisible ? 'Hide footer' : 'Show footer'}
              leftIcon={
                isFooterVisible ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                )
              }
              className="group relative overflow-hidden backdrop-blur-sm"
            >
              <span className="relative z-10">
                {isFooterVisible ? 'Hide Footer' : 'Show Footer'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Button>

            {/* Reorder Parameters Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowReorderModal(true)}
              disabled={
                !selectedCategory || !selectedUnit || filteredParameterSettings.length === 0
              }
              leftIcon={<ArrowsUpDownIcon className="w-5 h-5" />}
              className="group relative overflow-hidden"
            >
              <span className="relative z-10">Reorder Parameters</span>
              <div className="absolute inset-0 bg-gradient-ocean opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Button>

            {/* Refresh Data Button dengan Last Refresh Time */}
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="secondary"
                size="lg"
                onClick={refreshData}
                disabled={isRefreshing || !selectedCategory || !selectedUnit}
                leftIcon={
                  isRefreshing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )
                }
                className="group relative overflow-hidden"
              >
                <span className="relative z-10">
                  {isRefreshing ? 'Memperbarui...' : 'Refresh Data'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>

              {lastRefreshTime && (
                <span className="text-xs text-gray-500">
                  Terakhir diperbarui:{' '}
                  {formatToWITA(new Date(lastRefreshTime), {
                    includeDate: false,
                    includeTime: true,
                  })}
                </span>
              )}
            </div>
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
                style={{ width: '320px' }}
                autoComplete="off"
                title="Search columns by parameter name or unit. Use Ctrl+F to focus, Escape to clear."
              />
              {columnSearchQuery && (
                <EnhancedButton
                  variant="ghost"
                  size="xs"
                  onClick={clearColumnSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-label={t.ccr_clear_search || 'Clear search'}
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
                {filteredParameterSettings.length}{' '}
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
          <div className="ccr-table-container" role="grid" aria-label="Parameter Data Entry Table">
            {/* Scrollable Table Content */}
            <div className="ccr-table-wrapper" ref={tableWrapperRef}>
              <table className="ccr-table" role="grid">
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '200px' }} />
                  {filteredParameterSettings.map((_, index) => (
                    <col key={index} style={{ width: '100px' }} />
                  ))}
                </colgroup>
                <thead
                  className="bg-white/95 backdrop-blur-sm text-center sticky top-0 z-20 shadow-xl border-b-2 border-orange-400/50"
                  role="rowgroup"
                >
                  <tr className="border-b border-orange-300/30" role="row">
                    <th
                      className="px-2 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wider border-r border-orange-300/30 sticky left-0 bg-white/95 backdrop-blur-sm z-30 sticky-col-header shadow-lg"
                      style={{ width: '90px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.hour}
                    </th>
                    <th
                      className="px-2 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wider border-r border-orange-300/30 bg-white/95 backdrop-blur-sm"
                      style={{ width: '140px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.shift}
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wider border-r border-orange-300/30 bg-white/95 backdrop-blur-sm"
                      style={{ width: '200px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.name}
                    </th>
                    {filteredParameterSettings.map((param) => (
                      <th
                        key={param.id}
                        className={`px-2 py-3 text-xs font-bold border-r border-orange-300/30 text-center bg-white/95 backdrop-blur-sm text-slate-900 ${
                          shouldHighlightColumn(param) ? 'filtered-column' : ''
                        }`}
                        style={{ width: '100px', minWidth: '100px' }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[8px] leading-tight uppercase tracking-wider text-slate-700 drop-shadow-sm">
                            {param.parameter}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  role="rowgroup"
                >
                  {filteredParameterSettings.length > 0 ? (
                    Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                      <tr
                        key={hour}
                        className={`border-b border-slate-200/50 dark:border-slate-700/50 group ${
                          hour % 2 === 0
                            ? 'bg-white/40 dark:bg-slate-800/40'
                            : 'bg-slate-50/30 dark:bg-slate-700/30'
                        } hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-300`}
                        role="row"
                      >
                        <td
                          className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200/50 dark:border-slate-700/50 sticky left-0 bg-white/90 dark:bg-slate-800/90 group-hover:bg-orange-50/80 dark:group-hover:bg-orange-900/30 z-30 sticky-col backdrop-blur-sm"
                          style={{ width: '90px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center justify-center h-8">
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {String(hour).padStart(2, '0')}:00
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200/50 dark:border-slate-700/50"
                          style={{ width: '140px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-medium text-xs">
                              {getShiftForHour(hour)}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap text-xs text-slate-800 dark:text-slate-200 border-r border-slate-200/50 dark:border-slate-700/50"
                          style={{ width: '200px' }}
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
                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200"
                                    placeholder="Enter user name"
                                    title={`Edit user name for hour ${hour}`}
                                  />
                                );
                              } else {
                                // Tampilkan nama user jika ditemukan
                                if (userName) {
                                  return (
                                    <span
                                      className="truncate font-medium text-slate-700 dark:text-slate-300"
                                      title={userName}
                                    >
                                      {userName}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-slate-400 dark:text-slate-500 italic">
                                      -
                                    </span>
                                  );
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
                            value = String(hourValue);
                          }

                          const isCurrentlySaving = false; // Removed loading indicator for immediate saving
                          const isProductTypeParameter = param.parameter
                            .toLowerCase()
                            .includes('tipe produk');

                          return (
                            <td
                              key={param.id}
                              className={`p-1 border-r bg-white relative ${
                                shouldHighlightColumn(param) ? 'filtered-column' : ''
                              }`}
                              style={{ width: '160px', minWidth: '160px' }}
                              role="gridcell"
                            >
                              <div className="relative">
                                {isProductTypeParameter ? (
                                  <select
                                    ref={(el) => {
                                      const refKey = getInputRef('parameter', hour - 1, paramIndex);
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
                                    disabled={false}
                                    className={`w-full text-center text-sm px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200 ${
                                      isCurrentlySaving
                                        ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                        : ''
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
                                      const refKey = getInputRef('parameter', hour - 1, paramIndex);
                                      setInputRef(refKey, el);
                                    }}
                                    type={
                                      param.data_type === ParameterDataType.NUMBER ? 'text' : 'text'
                                    }
                                    defaultValue={
                                      param.data_type === ParameterDataType.NUMBER
                                        ? formatInputValue(value, getPrecisionForUnit(param.unit))
                                        : value
                                    }
                                    onChange={(e) => {
                                      // Hanya update state lokal saat input diubah
                                      const parsed = parseInputValue(e.target.value);
                                      handleParameterDataChange(
                                        param.id,
                                        hour,
                                        parsed !== null ? parsed.toString() : ''
                                      );
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
                                    disabled={false} // Removed loading state for immediate saving
                                    className={`w-full text-center text-sm px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200 ${
                                      isCurrentlySaving
                                        ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                        : ''
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
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
                        className="text-center py-10 text-slate-500"
                      >
                        {!selectedCategory || !selectedUnit
                          ? 'Please select a plant category and unit.'
                          : `No parameter master data found for the unit: ${selectedUnit}.`}
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
      </div>

      {/* Bottom Section: Silo Data, Downtime Data, and Information */}
      <div className="grid grid-cols-3 gap-6">
        {/* Silo Data Entry */}
        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-fire flex items-center justify-center">
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
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                CCR Silo Data Entry
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Data silo CCR untuk monitoring kapasitas
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            <table
              className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700"
              aria-label="Silo Data Table"
            >
              <thead className="bg-gradient-ocean text-white shadow-lg">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-300/30 dark:border-slate-600/30 align-middle"
                  >
                    {t.silo_name}
                  </th>
                  <th
                    colSpan={3}
                    className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-300/30 dark:border-slate-600/30 border-b border-slate-300/30 dark:border-slate-600/30"
                  >
                    {t.shift_1}
                  </th>
                  <th
                    colSpan={3}
                    className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-slate-300/30 dark:border-slate-600/30 border-b border-slate-300/30 dark:border-slate-600/30"
                  >
                    {t.shift_2}
                  </th>
                  <th
                    colSpan={3}
                    className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-b border-slate-300/30 dark:border-slate-600/30"
                  >
                    {t.shift_3}
                  </th>
                </tr>
                <tr>
                  {[...Array(3)].flatMap((_, i) => [
                    <th
                      key={`es-${i}`}
                      className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-300/30 dark:border-slate-600/30"
                    >
                      {t.empty_space}
                    </th>,
                    <th
                      key={`c-${i}`}
                      className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-300/30 dark:border-slate-600/30"
                    >
                      {t.content}
                    </th>,
                    <th
                      key={`p-${i}`}
                      className={`px-3 py-3 text-xs font-bold uppercase tracking-wider ${
                        i < 2 ? 'border-r border-slate-300/30 dark:border-slate-600/30' : ''
                      }`}
                    >
                      {t.percentage}
                    </th>,
                  ])}
                </tr>
              </thead>
              <tbody className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-slate-600 dark:text-slate-400 font-medium">
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
                      <tr key={siloData.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white z-10">
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
                                  siloIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                                } transition-colors duration-200`}
                              >
                                <input
                                  ref={(el) => {
                                    const refKey = getInputRef('silo', siloIndex, i * 2);
                                    setInputRef(refKey, el);
                                  }}
                                  type="text"
                                  defaultValue={formatInputValue(siloData[shift]?.emptySpace, 1)}
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
                                  siloIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                                } transition-colors duration-200`}
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
                                  onKeyDown={(e) => handleKeyDown(e, 'silo', siloIndex, i * 2 + 1)}
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
                                  i < 2 ? 'border-r' : ''
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
                        ? 'No plant categories found in Master Data.'
                        : `No silo master data found for the category: ${selectedCategory}.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Downtime Data Entry */}
        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
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
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  CCR Downtime Data Entry
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Catat waktu downtime dan alasan untuk analisis efisiensi produksi.
                </p>
              </div>
            </div>
            <EnhancedButton
              variant="primary"
              size="lg"
              onClick={handleOpenAddDowntimeModal}
              disabled={!permissionChecker.hasPermission('plant_operations', 'WRITE')}
              aria-label={t.add_downtime_button || 'Add new downtime'}
              className="group relative overflow-hidden flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="relative z-10">{t.add_downtime_button}</span>
              <div className="absolute inset-0 bg-gradient-ocean opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </EnhancedButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                <tr>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.start_time}
                  </th>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.end_time}
                  </th>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.unit}
                  </th>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.pic}
                  </th>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.problem}
                  </th>
                  <th className="px-4 py-3 text-left font-bold border-b border-orange-400/30">
                    {t.action}
                  </th>
                  <th className="relative px-4 py-3 border-b border-orange-400/30">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : dailyDowntimeData.length > 0 ? (
                  dailyDowntimeData.map((downtime, idx) => (
                    <tr
                      key={downtime.id}
                      className={`border-b border-slate-200/50 dark:border-slate-700/50 group ${
                        idx % 2 === 0
                          ? 'bg-white/40 dark:bg-slate-800/40'
                          : 'bg-slate-50/30 dark:bg-slate-700/30'
                      } hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 transition-all duration-300`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {downtime.start_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {downtime.end_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-medium text-xs">
                          {downtime.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                        {downtime.pic}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-sm whitespace-pre-wrap">
                        {downtime.problem}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-sm whitespace-pre-wrap">
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
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg
                          className="w-8 h-8 text-slate-400 dark:text-slate-500"
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
        </div>

        {/* Information */}
        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
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
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Information
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Catat informasi penting terkait operasi CCR hari ini.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <label
              htmlFor="keterangan"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.information_label}
            </label>
            <div className="relative">
              <textarea
                id="keterangan"
                rows={8}
                value={informationText}
                onChange={(e) => handleInformationChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-200 resize-vertical transition-all duration-200 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                placeholder={t.information_placeholder}
              />
            </div>
            {isSavingInformation && (
              <div className="flex justify-end">
                <div className="px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Otomatis menyimpan perubahan...</span>
                </div>
              </div>
            )}
          </div>
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
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Konfirmasi Hapus Downtime"
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <div className="flex items-start space-x-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
              </motion.div>
              <div className="flex-1">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2"
                >
                  Hapus Data Downtime
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-slate-600 dark:text-slate-400 mb-4"
                >
                  Tindakan ini tidak dapat dibatalkan. Data downtime berikut akan dihapus permanen:
                </motion.p>
                {deletingRecord && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Unit:
                      </span>
                      <span className="text-sm text-slate-900 dark:text-slate-100 font-semibold">
                        {deletingRecord.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tanggal:
                      </span>
                      <span className="text-sm text-slate-900 dark:text-slate-100 font-semibold">
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
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Problem:
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-semibold">
                          {deletingRecord.problem}
                        </span>
                      </div>
                    )}
                    {deletingRecord.start_time && deletingRecord.end_time && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Durasi:
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-semibold">
                          {deletingRecord.start_time} - {deletingRecord.end_time}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-red-600 dark:text-red-400 mt-4 font-medium"
                >
                  ⚠️ Pastikan data ini benar-benar perlu dihapus sebelum melanjutkan.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-50 dark:bg-slate-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-700"
        >
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
        </motion.div>
      </Modal>

      {/* Parameter Reorder Modal */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        title="Reorder Parameters"
      >
        <div className="space-y-4 parameter-reorder-modal">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ada beberapa cara untuk menyusun ulang parameter:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  1. Drag and Drop:
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-3">
                  Tarik parameter ke posisi yang diinginkan
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  2. Input Nomor:
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-3">
                  Masukkan nomor posisi yang diinginkan pada kotak input
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  3. Tombol ↑/↓:
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-3">
                  Gunakan tombol panah untuk penyesuaian satu per satu
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  4. Pintasan Keyboard:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc">
                  <li>Alt + ↑ : Pindahkan parameter ke atas</li>
                  <li>Alt + ↓ : Pindahkan parameter ke bawah</li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  5. Pencarian:
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-3">
                  Gunakan fitur pencarian untuk menemukan parameter dengan cepat
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Urutan parameter akan disimpan secara otomatis saat menekan tombol &quot;Done&quot;.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white sm:text-sm"
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
                <XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
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
                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-700 dark:text-slate-400 rounded-md">
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
                variant="outline"
                onClick={exportParameterOrderToExcel}
                aria-label="Export to Excel"
                className="flex items-center gap-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export to Excel
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
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
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
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
                <div className="absolute z-10 w-72 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity left-0 bottom-full mb-2 text-xs">
                  <h3 className="font-semibold mb-1 text-slate-900 dark:text-white">
                    Penggunaan Excel untuk Urutan Parameter
                  </h3>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Export: Mengunduh urutan parameter saat ini ke Excel</li>
                    <li>Import: Menerapkan urutan dari file Excel yang telah diedit</li>
                    <li>Di Excel: Edit kolom &ldquo;Order&rdquo; untuk mengubah urutan</li>
                    <li>Jangan mengubah kolom ID di file Excel</li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href="/docs/PARAMETER_ORDER_EXCEL_GUIDE.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center"
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
                variant="outline"
                onClick={() => setShowLoadProfileModal(true)}
                aria-label="Load profile"
              >
                Load Profile
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                onClick={() => setShowSaveProfileModal(true)}
                aria-label="Save profile"
              >
                Save Profile
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
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
        title="Save Parameter Order Profile"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Save the current parameter order as a profile that can be loaded later.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Profile Name *
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                placeholder="Enter profile description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <EnhancedButton
              variant="outline"
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
        title="Load Parameter Order Profile"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select a profile to load the parameter order.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No profiles available
              </p>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => loadProfile(profile)}
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {profile.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
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
                    {(profile.user_id === loggedInUser?.id || isSuperAdmin(loggedInUser?.role)) && (
                      <EnhancedButton
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileToDelete(profile);
                          setShowDeleteProfileModal(true);
                        }}
                        aria-label={`Delete profile ${profile.name}`}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
              variant="outline"
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
        title="Delete Parameter Order Profile"
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete the profile &quot;{profileToDelete?.name}&quot;? This
            action cannot be undone.
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg">
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
            variant="outline"
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
  );
};

export default CcrDataEntryPage;
