import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import ExcelJS, { CellValue } from 'exceljs';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCcrParameterData, CcrParameterDataWithName } from '../../hooks/useCcrParameterData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useUsers } from '../../hooks/useUsers';
import {
  ParameterDataType,
  CcrDowntimeData,
  CcrSiloData,
  CcrParameterData,
  ParameterSetting,
  DowntimeStatus,
} from '../../types';
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
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../utils/permissions';
import { PermissionLevel } from '../../types';
import { isSuperAdmin } from '../../utils/roleHelpers';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Import Supabase client
import { supabase } from '../../utils/supabaseClient';

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

const CcrDataEntryPage: React.FC<{ t: any }> = ({ t }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNavigationHelp, setShowNavigationHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Parameter reorder state
  const [parameterOrder, setParameterOrder] = useState<string[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [modalParameterOrder, setModalParameterOrder] = useState<ParameterSetting[]>([]);

  // Profile state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [showLoadProfileModal, setShowLoadProfileModal] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

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
  const plantCategories = useMemo(() => {
    // Filter categories based on user permissions - only show categories where user has access to at least one unit
    const allowedCategories = plantUnits
      .filter((unit) =>
        permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.category);

    // Remove duplicates and sort
    return [...new Set(allowedCategories)].sort();
  }, [plantUnits, permissionChecker]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Save parameter order to Supabase
  const saveParameterOrder = useCallback(
    async (newOrder: string[]) => {
      if (!loggedInUser?.id || !selectedCategory || !selectedUnit || newOrder.length === 0) {
        return;
      }

      try {
        const { error } = await supabase.from('user_parameter_orders').upsert(
          {
            user_id: loggedInUser.id,
            module: 'plant_operations',
            parameter_type: 'ccr_parameters',
            category: selectedCategory,
            unit: selectedUnit,
            parameter_order: newOrder,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,module,parameter_type,category,unit',
          }
        );

        if (error) {
          // Handle 406 Not Acceptable error gracefully
          if (
            error.code === 'PGRST116' ||
            error.message?.includes('406') ||
            error.message?.includes('Not Acceptable')
          ) {
            console.warn(
              'Parameter order save not available (RLS policy or table access issue), skipping save'
            );
            return;
          }
          console.error('Error saving parameter order:', error);
        }
      } catch (err) {
        console.warn('Failed to save parameter order, continuing without saving:', err);
      }
    },
    [loggedInUser?.id, selectedCategory, selectedUnit]
  );
  const unitToCategoryMap = useMemo(
    () => new Map(plantUnits.map((pu) => [pu.unit, pu.category])),
    [plantUnits]
  );

  useEffect(() => {
    if (plantCategories.length > 0 && !plantCategories.includes(selectedCategory)) {
      setSelectedCategory(plantCategories[0]);
    } else if (plantCategories.length === 0) {
      setSelectedCategory('');
    }
  }, [plantCategories, selectedCategory]);

  // Load parameter order from Supabase when category/unit changes
  useEffect(() => {
    if (!selectedCategory || !selectedUnit) {
      setParameterOrder([]);
      return;
    }

    const loadParameterOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('user_parameter_orders')
          .select('parameter_order')
          .eq('user_id', loggedInUser?.id)
          .eq('module', 'plant_operations')
          .eq('parameter_type', 'ccr_parameters')
          .eq('category', selectedCategory)
          .eq('unit', selectedUnit)
          .limit(1);

        if (error) {
          // Handle 406 Not Acceptable error gracefully - this is likely an RLS policy issue
          if (
            error.code === 'PGRST116' ||
            error.message?.includes('406') ||
            error.message?.includes('Not Acceptable')
          ) {
            console.warn(
              'Parameter order not available (RLS policy or table access issue), using default order'
            );
            setParameterOrder([]);
            return;
          }
          console.error('Error loading parameter order:', error);
          setParameterOrder([]);
        } else if (data && data.length > 0) {
          setParameterOrder(data[0].parameter_order);
        } else {
          setParameterOrder([]);
        }
      } catch (err) {
        console.warn('Failed to load parameter order, using default order:', err);
        setParameterOrder([]);
      }
    };

    loadParameterOrder();
  }, [selectedCategory, selectedUnit, loggedInUser?.id]);

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('parameter_order_profiles')
        .select('*')
        .eq('module', 'plant_operations')
        .eq('parameter_type', 'ccr_parameters')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      setProfiles([]);
    }
  }, []);

  // Save profile
  const saveProfile = useCallback(async () => {
    if (!loggedInUser?.id || !profileName.trim() || modalParameterOrder.length === 0) {
      return;
    }

    try {
      const { error } = await supabase.from('parameter_order_profiles').insert({
        name: profileName.trim(),
        description: profileDescription.trim() || null,
        user_id: loggedInUser.id,
        module: 'plant_operations',
        parameter_type: 'ccr_parameters',
        category: selectedCategory,
        unit: selectedUnit,
        parameter_order: modalParameterOrder.map((p) => p.id),
      });

      if (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile');
      } else {
        showToast('Profile saved successfully');
        setShowSaveProfileModal(false);
        setProfileName('');
        setProfileDescription('');
        fetchProfiles();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
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
    return plantUnits
      .filter(
        (unit) =>
          unit.category === selectedCategory &&
          permissionChecker.hasPlantOperationPermission(unit.category, unit.unit, 'READ')
      )
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory, permissionChecker]);

  useEffect(() => {
    if (unitsForCategory.length > 0 && !unitsForCategory.includes(selectedUnit)) {
      setSelectedUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedUnit('');
    }
  }, [unitsForCategory, selectedUnit]);

  // Silo Data Hooks and Filtering
  const { records: siloMasterData } = useSiloCapacities();
  const { getDataForDate: getSiloDataForDate, updateSiloData } = useCcrSiloData();
  const [allDailySiloData, setAllDailySiloData] = useState<CcrSiloData[]>([]);
  const [siloDataTrigger, setSiloDataTrigger] = useState(0); // Trigger for real-time updates

  const fetchSiloData = useCallback(async () => {
    if (!selectedDate || selectedDate.trim() === '') {
      return;
    }

    try {
      const data = await getSiloDataForDate(selectedDate);
      setAllDailySiloData(data);
    } catch (error) {
      console.error('Error fetching silo data:', error);
    }
  }, [selectedDate, getSiloDataForDate]);

  useEffect(() => {
    // Initial data fetch
    setLoading(true);
    fetchSiloData().then(() => setLoading(false));

    // Real-time polling every 5 seconds when window is focused
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSiloData();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [selectedDate, fetchSiloData]);

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
    if (parameterOrder.length > 0) {
      const orderMap = new Map(parameterOrder.map((id, index) => [id, index]));
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
    parameterOrder,
    columnSearchQuery,
  ]);

  // Update modal parameter order when modal opens or filteredParameterSettings changes
  useEffect(() => {
    if (showReorderModal) {
      setModalParameterOrder([...filteredParameterSettings]);
    }
  }, [showReorderModal, filteredParameterSettings]);

  // Parameter reorder handlers - optimized for performance with debouncing
  const reorderTimeoutRef = useRef<NodeJS.Timeout>();
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
      reorderTimeoutRef.current = undefined;
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
      reorderTimeoutRef.current = undefined;
    }, 150);
  }, []);

  // Memoized parameter reorder item component for better performance
  const ParameterReorderItem = React.memo(
    ({ param, index }: { param: ParameterSetting; index: number }) => (
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {index + 1}.
          </span>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {param.parameter}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{param.unit}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
    )
  );
  ParameterReorderItem.displayName = 'ParameterReorderItem';

  // Load profile
  const loadProfile = useCallback(
    async (profile: any) => {
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
      } catch (err) {
        console.error('Failed to load profile:', err);
        showToast('Failed to load profile');
      }
    },
    [filteredParameterSettings, showToast]
  );

  // Delete profile
  const deleteProfile = useCallback(
    async (profile: any) => {
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
        const { error } = await supabase
          .from('parameter_order_profiles')
          .delete()
          .eq('id', profile.id);

        if (error) {
          console.error('Error deleting profile:', error);
          showToast(`Failed to delete profile: ${error.message || 'Unknown error'}`);
        } else {
          showToast(`Profile "${profile.name}" deleted successfully`);
          fetchProfiles(); // Refresh the profiles list
        }
      } catch (err) {
        console.error('Failed to delete profile:', err);
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

  // Filter silo data
  const dailySiloData = useMemo(() => {
    if (!selectedCategory) return [];
    return allDailySiloData.filter((data) => {
      const master = siloMasterMap.get(data.silo_id);
      if (!master) return false;

      const categoryMatch = master.plant_category === selectedCategory;
      const unitMatch = !selectedUnit || master.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });
  }, [allDailySiloData, selectedCategory, selectedUnit, siloMasterMap]);

  const { getDataForDate: getParameterDataForDate, updateParameterData } = useCcrParameterData();
  const [dailyParameterData, setDailyParameterData] = useState<CcrParameterData[]>([]);
  const [parameterDataTrigger, setParameterDataTrigger] = useState(0); // Trigger for real-time updates

  const fetchParameterData = useCallback(async () => {
    if (!selectedDate || selectedDate.trim() === '') {
      return;
    }

    try {
      const data = await getParameterDataForDate(selectedDate);
      setDailyParameterData(data);

      // Update legacy records that don't have name field
      const legacyRecords = data.filter(
        (record: any) => !record.name && Object.keys(record.hourly_values).length > 0
      );
      if (legacyRecords.length > 0) {
        legacyRecords.forEach(async (record: any) => {
          try {
            const { error } = await supabase
              .from('ccr_parameter_data')
              .update({
                name: loggedInUser?.full_name || currentUser.full_name,
              })
              .eq('id', record.id);

            if (error) {
              console.error('Error updating legacy record:', error);
            }
          } catch (error) {
            console.error('Error updating legacy record:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching parameter data:', error);
    }
  }, [selectedDate, getParameterDataForDate, loggedInUser?.full_name, currentUser.full_name]);

  useEffect(() => {
    // Initial data fetch
    setLoading(true);
    fetchParameterData().then(() => setLoading(false));

    // Real-time polling every 5 seconds when window is focused
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchParameterData();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [selectedDate, fetchParameterData]);

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
        } catch (error) {
          console.warn('Error focusing cell:', error);
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
  const dailyDowntimeData = useMemo(() => {
    const allDowntimeForDate = getDowntimeForDate(selectedDate);
    if (!selectedCategory) {
      return allDowntimeForDate;
    }
    return allDowntimeForDate.filter((downtime) => {
      const categoryMatch = unitToCategoryMap.get(downtime.unit) === selectedCategory;
      const unitMatch = !selectedUnit || downtime.unit === selectedUnit;
      return categoryMatch && unitMatch;
    });
  }, [getDowntimeForDate, selectedDate, selectedCategory, selectedUnit, unitToCategoryMap]);

  const [isDowntimeModalOpen, setDowntimeModalOpen] = useState(false);
  const [editingDowntime, setEditingDowntime] = useState<CcrDowntimeData | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    date: string;
  } | null>(null);

  // Information Data Hook and State
  const {
    getInformationForDate,
    saveInformation,
    isSaving: isSavingInformation,
  } = useCcrInformationData();
  const [informationText, setInformationText] = useState('');

  const formatStatValue = (value: number | undefined, precision = 1) => {
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
    // Convert formatted value back to number
    // Replace dots (thousands) and comma (decimal) back to standard format
    const normalized = formattedValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSiloDataChange = (
    siloId: string,
    shift: 'shift1' | 'shift2' | 'shift3',
    field: 'emptySpace' | 'content',
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

  // Alias for saving parameter ID
  const savingParameterId = null;

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

  // Wrapper function for parameter data changes with optimistic updates
  const handleParameterDataChange = useCallback(
    async (parameterId: string, hour: number, value: string) => {
      // Optimistic update for UI
      setDailyParameterData((prev) => {
        const idx = prev.findIndex((p) => p.parameter_id === parameterId);
        if (idx === -1) return prev;

        const param = prev[idx];
        const newHourlyValues = { ...param.hourly_values };

        const previousValue = newHourlyValues[hour] ?? null;

        if (value === '' || value === null) {
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

      // Direct database update
      try {
        await updateParameterData(
          selectedDate,
          parameterId,
          hour,
          value === '' ? null : value,
          loggedInUser?.full_name || currentUser.full_name
        );
        showToast(`Data parameter ${parameterId} jam ${hour} berhasil disimpan.`);
      } catch (error) {
        console.error('Error updating parameter data:', error);
        setError(`Failed to save data for parameter ${parameterId}`);
        // Revert optimistic update on error
        setDailyParameterData((prev) => {
          const idx = prev.findIndex((p) => p.parameter_id === parameterId);
          if (idx === -1) return prev;

          const param = prev[idx];
          const revertedHourlyValues = { ...param.hourly_values };
          delete revertedHourlyValues[hour]; // Remove the failed update

          const revertedParam = { ...param, hourly_values: revertedHourlyValues };
          const newArr = [...prev];
          newArr[idx] = revertedParam;
          return newArr;
        });
      }
    },
    [updateParameterData, selectedDate, loggedInUser, currentUser, showToast]
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
    record: CcrDowntimeData | Omit<CcrDowntimeData, 'id' | 'date'>
  ) => {
    try {
      let result;
      if ('id' in record) {
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
      console.error('Error in handleSaveDowntime:', error);
      alert('Failed to save downtime data. Please try again.');
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

  // Information change handler with debounced save
  const handleInformationChange = useCallback(
    (value: string) => {
      setInformationText(value);

      // Debounced save to Supabase
      const timeoutId = setTimeout(() => {
        if (selectedDate && selectedUnit) {
          saveInformation({
            date: selectedDate,
            plantUnit: selectedUnit,
            information: value,
          });
        }
      }, 3500); // 3.5 second debounce

      return () => clearTimeout(timeoutId);
    },
    [selectedDate, selectedUnit, saveInformation]
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
      const parameterData = await getParameterDataForDate(selectedDate);
      const footerData = await getFooterDataForDate(selectedDate, selectedUnit);
      const downtimeData = getDowntimeForDate(selectedDate);

      // Export Parameter Data
      if (filteredParameterSettings.length > 0) {
        const worksheetParam = workbook.addWorksheet('Parameter Data');

        // Create headers
        const headers = [
          'Date',
          'Hour',
          'Shift',
          'Unit',
          ...filteredParameterSettings.map((p) => p.parameter),
        ];
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
            const hourData = paramData?.hourly_values?.[hour];

            // Extract value from new structure
            let paramValue = '';
            if (
              hourData != null &&
              typeof hourData === 'object' &&
              'value' in (hourData as object)
            ) {
              paramValue = String((hourData as { value: unknown }).value || '');
            } else if (
              hourData != null &&
              (typeof hourData === 'string' || typeof hourData === 'number')
            ) {
              paramValue = String(hourData);
            }

            rowData.push(paramValue);
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
    } catch (error) {
      console.error('Error exporting CCR parameter data:', error);
      alert('An error occurred while exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import from Excel functionality
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCategory || !selectedUnit) {
      alert('Please select a plant category and unit before importing.');
      return;
    }

    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      let importCount = 0;
      let errorMessages: string[] = [];

      // Import Parameter Data
      const paramWorksheet = workbook.getWorksheet('Parameter Data');
      if (paramWorksheet) {
        try {
          const paramData: Record<string, unknown>[] = [];
          let paramHeaders: string[] = [];

          paramWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              paramHeaders = (row.values as CellValue[]).map((v) => String(v || ''));
            } else {
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                rowData[paramHeaders[colNumber - 1]] = cell.value;
              });
              paramData.push(rowData);
            }
          });
          if (paramData.length > 0) {
            // Validate data structure
            const requiredFields = ['Date', 'Hour', 'Unit'];
            const invalidRows = paramData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Parameter Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              // Process valid data
              for (const row of paramData) {
                const date = String(row.Date);
                const hour = Number(row.Hour);
                const unit = String(row.Unit);

                // Get all parameter columns (exclude Date, Hour, Unit, Shift)
                const parameterColumns = Object.keys(row).filter(
                  (key) => !['Date', 'Hour', 'Unit', 'Shift'].includes(key)
                );

                // For each parameter column with a value, save the data
                for (const paramName of parameterColumns) {
                  const value = row[paramName];
                  if (value !== undefined && value !== null && value !== '') {
                    // Find parameter settings to get parameter_id
                    const paramSetting = filteredParameterSettings.find(
                      (p) => p.parameter === paramName
                    );
                    if (paramSetting) {
                      try {
                        await updateParameterData(
                          date,
                          paramSetting.id,
                          hour,
                          String(value),
                          loggedInUser?.full_name || 'Import User'
                        );
                        importCount++;
                        // Add small delay to prevent rate limiting
                        await new Promise((resolve) => setTimeout(resolve, 100));
                      } catch (error) {
                        console.error(
                          `Failed to save parameter ${paramName} for ${date} hour ${hour}:`,
                          error
                        );
                        errorMessages.push(
                          `Failed to save parameter ${paramName} for ${date} hour ${hour}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    } else {
                      errorMessages.push(
                        `Parameter "${paramName}" not found in parameter settings for unit ${unit}`
                      );
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Parameter Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Footer Data
      const footerWorksheet = workbook.getWorksheet('Footer Data');
      if (footerWorksheet) {
        try {
          const footerData: Record<string, unknown>[] = [];
          let footerHeaders: string[] = [];

          footerWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              footerHeaders = (row.values as CellValue[]).map((v) => String(v || ''));
            } else {
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                rowData[footerHeaders[colNumber - 1]] = cell.value;
              });
              footerData.push(rowData);
            }
          });
          if (footerData.length > 0) {
            // Validate data structure
            const requiredFields = ['Date', 'Unit'];
            const invalidRows = footerData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Footer Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              // Process valid data
              for (const row of footerData) {
                try {
                  // Find parameter setting to get parameter_id
                  // For footer data, we need to determine which parameter this footer data belongs to
                  // This might need to be specified in the Excel or determined by context
                  // For now, we'll assume it's for all parameters or needs parameter_id column

                  // Check if parameter_id is provided in the Excel
                  if (!row.parameter_id && !row.Parameter_ID) {
                    errorMessages.push(
                      `Footer Data: Missing parameter_id for row with date ${row.Date}`
                    );
                    continue;
                  }

                  const parameterId = row.parameter_id || row.Parameter_ID;

                  await saveFooterData({
                    date: String(row.Date),
                    parameter_id: String(parameterId),
                    plant_unit: row.Unit ? String(row.Unit) : selectedUnit,
                    total: row.Total ? Number(row.Total) : 0,
                    average: row.Average ? Number(row.Average) : 0,
                    minimum: row.Minimum ? Number(row.Minimum) : 0,
                    maximum: row.Maximum ? Number(row.Maximum) : 0,
                    shift1_total: row.Shift1_Total ? Number(row.Shift1_Total) : 0,
                    shift1_average: row.Shift1_Average ? Number(row.Shift1_Average) : 0,
                    shift2_total: row.Shift2_Total ? Number(row.Shift2_Total) : 0,
                    shift2_average: row.Shift2_Average ? Number(row.Shift2_Average) : 0,
                    shift3_total: row.Shift3_Total ? Number(row.Shift3_Total) : 0,
                    shift3_average: row.Shift3_Average ? Number(row.Shift3_Average) : 0,
                    shift3_cont_total: row.Shift3_Cont_Total ? Number(row.Shift3_Cont_Total) : 0,
                    shift3_cont_average: row.Shift3_Cont_Average
                      ? Number(row.Shift3_Cont_Average)
                      : 0,
                    shift1_counter: row.Shift1_Counter ? Number(row.Shift1_Counter) : 0,
                    shift2_counter: row.Shift2_Counter ? Number(row.Shift2_Counter) : 0,
                    shift3_counter: row.Shift3_Counter ? Number(row.Shift3_Counter) : 0,
                    shift3_cont_counter: row.Shift3_Cont_Counter
                      ? Number(row.Shift3_Cont_Counter)
                      : 0,
                  });
                  importCount++;
                } catch (error) {
                  errorMessages.push(
                    `Failed to save footer data for ${row.Date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Footer Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Downtime Data
      const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
      if (downtimeWorksheet) {
        try {
          const downtimeData: Record<string, unknown>[] = [];
          let downtimeHeaders: string[] = [];

          downtimeWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              downtimeHeaders = (row.values as CellValue[]).map((v) => String(v || ''));
            } else {
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                rowData[downtimeHeaders[colNumber - 1]] = cell.value;
              });
              downtimeData.push(rowData);
            }
          });
          if (downtimeData.length > 0) {
            // Validate data structure
            const requiredFields = ['Date', 'Start_Time', 'End_Time', 'Unit', 'PIC', 'Problem'];
            const invalidRows = downtimeData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Downtime Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              // Collect unique dates from import data
              const importDates = [...new Set(downtimeData.map((row) => String(row.Date)))];

              // Delete existing downtime data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  const { error: deleteError } = await supabase
                    .from('ccr_downtime_data')
                    .delete()
                    .in('date', importDates);

                  if (deleteError) {
                    errorMessages.push(
                      `Failed to delete existing downtime data for dates ${importDates.join(', ')}: ${deleteError.message}`
                    );
                  } else {
                    console.log(
                      `Deleted existing downtime data for dates: ${importDates.join(', ')}`
                    );
                    // Refresh downtime data to reflect changes
                    refetch();
                  }
                } catch (error) {
                  errorMessages.push(
                    `Error deleting existing downtime data: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }

              // Process valid data
              for (const row of downtimeData) {
                try {
                  const result = await addDowntime({
                    date: String(row.Date),
                    start_time: String(row.Start_Time),
                    end_time: String(row.End_Time),
                    unit: String(row.Unit),
                    pic: String(row.PIC),
                    problem: String(row.Problem),
                    action: row.Action ? String(row.Action) : undefined,
                    corrective_action: row.Corrective_Action
                      ? String(row.Corrective_Action)
                      : undefined,
                    status:
                      row.Status && (row.Status === 'Open' || row.Status === 'Close')
                        ? (row.Status as DowntimeStatus)
                        : DowntimeStatus.OPEN,
                  });

                  if (result.success) {
                    importCount++;
                  } else {
                    errorMessages.push(
                      `Failed to save downtime data for ${row.Date}: ${result.error}`
                    );
                  }
                } catch (error) {
                  errorMessages.push(
                    `Failed to save downtime data for ${row.Date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Downtime Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Silo Data
      const siloWorksheet = workbook.getWorksheet('Silo Data');
      if (siloWorksheet) {
        try {
          const siloData: Record<string, unknown>[] = [];
          let siloHeaders: string[] = [];

          siloWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              siloHeaders = (row.values as CellValue[]).map((v) => String(v || ''));
            } else {
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                rowData[siloHeaders[colNumber - 1]] = cell.value;
              });
              siloData.push(rowData);
            }
          });
          if (siloData.length > 0) {
            // Validate data structure
            const requiredFields = ['Date', 'Silo_ID'];
            const invalidRows = siloData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Silo Data row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              // Collect unique dates from import data
              const importDates = [...new Set(siloData.map((row) => String(row.Date)))];

              // Delete existing silo data for these dates to replace with new data
              if (importDates.length > 0) {
                try {
                  const { error: deleteError } = await supabase
                    .from('ccr_silo_data')
                    .delete()
                    .in('date', importDates);

                  if (deleteError) {
                    errorMessages.push(
                      `Failed to delete existing silo data for dates ${importDates.join(', ')}: ${deleteError.message}`
                    );
                  } else {
                    console.log(`Deleted existing silo data for dates: ${importDates.join(', ')}`);
                    // Refresh silo data to reflect changes
                    getSiloDataForDate(selectedDate).then((data) => {
                      setAllDailySiloData(data);
                    });
                  }
                } catch (error) {
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

                  // Check if all shift data is empty
                  const isEmpty = [shift1, shift2, shift3].every(
                    (shift) => !shift.emptySpace && !shift.content
                  );

                  if (!isEmpty) {
                    // Update silo data for each shift if data exists
                    if (shift1.emptySpace !== undefined || shift1.content !== undefined) {
                      try {
                        await updateSiloData(
                          date,
                          siloId,
                          'shift1',
                          'emptySpace',
                          shift1.emptySpace
                        );
                        await updateSiloData(date, siloId, 'shift1', 'content', shift1.content);
                      } catch (error) {
                        console.error(`Failed to update silo ${siloId} shift1 for ${date}:`, error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift1 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift2.emptySpace !== undefined || shift2.content !== undefined) {
                      try {
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
                      } catch (error) {
                        console.error(`Failed to update silo ${siloId} shift2 for ${date}:`, error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift2 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }
                    if (shift3.emptySpace !== undefined || shift3.content !== undefined) {
                      try {
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
                      } catch (error) {
                        console.error(`Failed to update silo ${siloId} shift3 for ${date}:`, error);
                        errorMessages.push(
                          `Failed to update silo ${siloId} shift3 for ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }

                    importCount++;
                  }
                } catch (error) {
                  errorMessages.push(
                    `Failed to save silo data for ${row.Date} silo ${row.Silo_ID}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Silo Data import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Show results
      if (importCount > 0) {
        alert(`Successfully imported ${importCount} records to the database.`);
      }

      if (errorMessages.length > 0) {
        alert(`Import validation completed with errors:\n${errorMessages.join('\n')}`);
      }
    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('Error processing Excel file. Please check the file format and try again.');
    } finally {
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

      {/* Silo Data Table */}
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
              {t.ccr_data_entry_title}
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

                  const shifts: ('shift1' | 'shift2' | 'shift3')[] = ['shift1', 'shift2', 'shift3'];

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
                                onBlur={(e) => {
                                  // Reformat on blur to ensure consistent display
                                  const parsed = parseInputValue(e.target.value);
                                  if (parsed !== null) {
                                    e.target.value = formatInputValue(parsed, 1);
                                  }
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
                                onBlur={(e) => {
                                  // Reformat on blur to ensure consistent display
                                  const parsed = parseInputValue(e.target.value);
                                  if (parsed !== null) {
                                    e.target.value = formatInputValue(parsed, 1);
                                  }
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
                  <td colSpan={10} className="text-center py-6 text-slate-500 dark:text-slate-400">
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
                    isImporting ||
                    !selectedCategory ||
                    !selectedUnit ||
                    !permissionChecker.hasPermission('plant_operations', 'WRITE')
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

                {/* Export Excel Button */}
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleExport}
                  disabled={
                    isExporting ||
                    !selectedCategory ||
                    !selectedUnit ||
                    filteredParameterSettings.length === 0 ||
                    !permissionChecker.hasPermission('plant_operations', 'READ')
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
              </div>
            )}

            {/* Show/Hide Footer Button */}
            <Button
              variant="glass"
              size="md"
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
                    {filteredParameterSettings.map((param, index) => (
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (filteredParameterSettings.length > 0
                            ? filteredParameterSettings.length
                            : 0)
                        }
                        className="text-center py-12 text-slate-500 dark:text-slate-400"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredParameterSettings.length > 0 ? (
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
                            {/* Enhanced name display with per-hour user tracking */}
                            {(() => {
                              const filledParam = filteredParameterSettings.find((param) => {
                                const paramData = parameterDataMap.get(param.id);
                                const hourData = paramData?.hourly_values?.[hour];
                                // Check if hour data exists and has a value
                                return (
                                  paramData &&
                                  hourData !== undefined &&
                                  hourData !== '' &&
                                  (hourData &&
                                  typeof hourData === 'object' &&
                                  'value' in (hourData as object)
                                    ? (hourData as { value: unknown }).value !== ''
                                    : true)
                                );
                              });
                              if (filledParam) {
                                const paramData = parameterDataMap.get(filledParam.id);
                                const hourData = paramData?.hourly_values?.[hour];

                                // Extract user name from new structure or fallback to legacy
                                let userName = loggedInUser?.full_name || currentUser.full_name;
                                if (
                                  hourData &&
                                  typeof hourData === 'object' &&
                                  'user_name' in (hourData as object)
                                ) {
                                  userName = (hourData as { user_name: string }).user_name;
                                } else if ((paramData as CcrParameterDataWithName)?.name) {
                                  userName = (paramData as CcrParameterDataWithName).name;
                                }

                                return (
                                  <span
                                    className="truncate font-medium text-slate-700 dark:text-slate-300"
                                    title={userName}
                                  >
                                    {userName}
                                  </span>
                                );
                              }
                              return (
                                <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                              );
                            })()}
                          </div>
                        </td>
                        {filteredParameterSettings.map((param, paramIndex) => {
                          const hourData = parameterDataMap.get(param.id)?.hourly_values?.[hour];
                          // Extract value from new structure (object with value/user_name) or legacy direct value
                          let value = '';
                          if (
                            hourData &&
                            typeof hourData === 'object' &&
                            'value' in (hourData as object)
                          ) {
                            value = String((hourData as { value: unknown }).value || '');
                          } else if (typeof hourData === 'string' || typeof hourData === 'number') {
                            value = String(hourData);
                          }

                          const isCurrentlySaving = savingParameterId === param.id;
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
                                      handleParameterDataChange(param.id, hour, e.target.value);
                                    }}
                                    onKeyDown={(e) =>
                                      handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                    }
                                    disabled={isCurrentlySaving}
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
                                      if (param.data_type === ParameterDataType.NUMBER) {
                                        const parsed = parseInputValue(e.target.value);
                                        handleParameterDataChange(
                                          param.id,
                                          hour,
                                          parsed !== null ? parsed.toString() : ''
                                        );
                                      } else {
                                        handleParameterDataChange(param.id, hour, e.target.value);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // Reformat numerical values on blur
                                      if (param.data_type === ParameterDataType.NUMBER) {
                                        const parsed = parseInputValue(e.target.value);
                                        if (parsed !== null) {
                                          e.target.value = formatInputValue(
                                            parsed,
                                            getPrecisionForUnit(param.unit)
                                          );
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) =>
                                      handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                    }
                                    disabled={isCurrentlySaving}
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

      {/* Downtime Data Table and Keterangan */}
      <div className="flex flex-col md:flex-row gap-6 md:justify-between">
        {/* Downtime Data Table */}
        <div className="flex-1 backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
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
                  {t.downtime_data_entry_title}
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
              leftIcon={<PlusIcon className="w-5 h-5" />}
              className="group relative overflow-hidden"
            >
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
                  <th className="relative px-4 py-3 border-b border-orange-400/30">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
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
                            onClick={() => handleOpenDeleteModal(downtime.id, downtime.date)}
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
                      colSpan={6}
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

        {/* Keterangan Container */}
        <div className="flex-1 backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
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
                {t.information}
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
                disabled={isSavingInformation}
              />
              {isSavingInformation && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Menyimpan...</span>
                  </div>
                </div>
              )}
            </div>
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
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600">{t.delete_confirmation_message}</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg">
          <EnhancedButton
            variant="warning"
            onClick={handleDeleteConfirm}
            className="sm:ml-3 sm:w-auto"
            rounded="lg"
            elevation="sm"
            aria-label={t.confirm_delete_button || 'Confirm delete'}
          >
            {t.confirm_delete_button}
          </EnhancedButton>
          <EnhancedButton
            variant="outline"
            onClick={handleCloseDeleteModal}
            className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto"
            rounded="lg"
            elevation="sm"
            aria-label={t.cancel_button || 'Cancel'}
          >
            {t.cancel_button}
          </EnhancedButton>
        </div>
      </Modal>

      {/* Parameter Reorder Modal */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        title="Reorder Parameters"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Drag parameters or use the buttons to reorder them. The order will be saved
            automatically.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {modalParameterOrder.map((param, index) => (
              <ParameterReorderItem key={param.id} param={param} index={index} />
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
                setParameterOrder(newOrder);
                saveParameterOrder(newOrder);
                setShowReorderModal(false);
              }}
              aria-label="Save parameter order"
            >
              Done
            </EnhancedButton>
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
                    {profile.description && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {profile.description}
                      </div>
                    )}
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
