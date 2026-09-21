import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  GripVertical,
  Database,
  Users,
  Settings,
  BarChart3,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Layers,
  LayoutGrid,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { exportMultipleSheets, importMultipleSheets } from '../../utils/excelUtils';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import { formatNumber } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

// Derivative Hooks
import { useDerivativePlantUnits } from '../../hooks/useDerivativePlantUnits';
import { useDerivativeParameterSettings } from '../../hooks/useDerivativeParameterSettings';
import { useDerivativeSiloCapacities } from '../../hooks/useDerivativeSiloCapacities';
import { useDerivativePicSettings } from '../../hooks/useDerivativePicSettings';
import { useDerivativeReportSettings } from '../../hooks/useDerivativeReportSettings';
import { useDerivativeCopParameters } from '../../hooks/useDerivativeCopParameters';
import {
  useDerivativeCopFooterParameters,
  CopFooterAggregationType,
  CopFooterParameterConfig,
} from '../../hooks/useDerivativeCopFooterParameters';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';

// Types
import {
  PlantUnit,
  ParameterSetting,
  ParameterDataType,
  SiloCapacity,
  PicSetting,
  RkcReportSetting,
} from '../../types';

type MasterDataRecord =
  | PlantUnit
  | Omit<PlantUnit, 'id'>
  | ParameterSetting
  | Omit<ParameterSetting, 'id'>
  | SiloCapacity
  | Omit<SiloCapacity, 'id'>
  | PicSetting
  | Omit<PicSetting, 'id'>
  | RkcReportSetting
  | Omit<RkcReportSetting, 'id'>;

// Forms
import PlantUnitForm from './PlantUnitForm';
import ParameterSettingForm from './ParameterSettingForm';
import SiloCapacityForm from './SiloCapacityForm';
import PicSettingForm from './PicSettingForm';
import RkcReportSettingForm from './RkcReportSettingForm';

type ModalType =
  | 'plantUnit'
  | 'parameterSetting'
  | 'siloCapacity'
  | 'picSetting'
  | 'reportSetting'
  | null;

type TabType = 'parameters' | 'units_pic' | 'silo' | 'cop' | 'reports' | 'all';
type CopSubTab = 'cop_params' | 'cop_footer';

const DerivativeMasterDataPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { canWrite } = usePlantOperationsAccess('DERIVATIVE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<TabType>('parameters');
  const [copSubTab, setCopSubTab] = useState<CopSubTab>('cop_params');

  // Plant Units State
  const {
    records: plantUnits,
    addRecord: addPlantUnit,
    updateRecord: updatePlantUnit,
    deleteRecord: deletePlantUnit,
    loading: plantUnitsLoading,
  } = useDerivativePlantUnits();
  const [editingPlantUnit, setEditingPlantUnit] = useState<PlantUnit | null>(null);
  const {
    paginatedData: paginatedPlantUnits,
    currentPage: puCurrentPage,
    totalPages: puTotalPages,
    setCurrentPage: setPuCurrentPage,
  } = usePagination(plantUnits, 10);

  // Parameter Settings State
  const {
    records: parameterSettings,
    addRecord: addParameter,
    updateRecord: updateParameter,
    deleteRecord: deleteParameter,
  } = useDerivativeParameterSettings();
  const [editingParameter, setEditingParameter] = useState<ParameterSetting | null>(null);

  // Silo Capacity State
  const {
    records: siloCapacities,
    loading: siloCapacitiesLoading,
    addRecord: addSilo,
    updateRecord: updateSilo,
    deleteRecord: deleteSilo,
  } = useDerivativeSiloCapacities();
  const [editingSilo, setEditingSilo] = useState<SiloCapacity | null>(null);

  // PIC Settings State
  const {
    records: picSettings,
    addRecord: addPicSetting,
    updateRecord: updatePicSetting,
    deleteRecord: deletePicSetting,
  } = useDerivativePicSettings();
  const [editingPic, setEditingPic] = useState<PicSetting | null>(null);
  const {
    paginatedData: paginatedPicSettings,
    currentPage: picCurrentPage,
    totalPages: picTotalPages,
    setCurrentPage: setPicCurrentPage,
  } = usePagination(picSettings, 10);

  // Report Settings State
  const {
    records: reportSettings,
    addRecord: addReportSetting,
    updateRecord: updateReportSetting,
    deleteRecord: deleteReportSetting,
    updateOrder: updateReportOrder,
    loading: reportSettingsLoading,
  } = useDerivativeReportSettings();
  const [editingReportSetting, setEditingReportSetting] = useState<RkcReportSetting | null>(null);
  const {
    paginatedData: paginatedReportSettings,
    currentPage: reportCurrentPage,
    totalPages: reportTotalPages,
    setCurrentPage: setReportCurrentPage,
  } = usePagination(reportSettings, 10);

  const maxReportSettingOrder = useMemo(() => {
    return reportSettings.length > 0 ? Math.max(...reportSettings.map((rs) => rs.order)) + 1 : 0;
  }, [reportSettings]);

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    type: ModalType;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [parameterCategoryFilter, setParameterCategoryFilter] = useState('');
  const [parameterUnitFilter, setParameterUnitFilter] = useState('');
  const [parameterSearchQuery, setParameterSearchQuery] = useState('');
  const [siloCategoryFilter, setSiloCategoryFilter] = useState('');
  const [siloUnitFilter, setSiloUnitFilter] = useState('');
  const [copCategoryFilter, setCopCategoryFilter] = useState('');
  const [copUnitFilter, setCopUnitFilter] = useState('');
  const [copFooterCategoryFilter, setCopFooterCategoryFilter] = useState('');
  const [copFooterUnitFilter, setCopFooterUnitFilter] = useState('');

  const getDeletingRecordName = useMemo(() => {
    if (!deletingRecord) return '';
    switch (deletingRecord.type) {
      case 'plantUnit':
        return plantUnits.find((p) => p.id === deletingRecord.id)?.unit || 'Unknown Plant Unit';
      case 'parameterSetting':
        return (
          parameterSettings.find((p) => p.id === deletingRecord.id)?.parameter ||
          'Unknown Parameter'
        );
      case 'siloCapacity': {
        const silo = siloCapacities.find((s) => s.id === deletingRecord.id);
        return silo ? `${silo.plant_category} - ${silo.unit} - ${silo.silo_name}` : 'Unknown Silo';
      }
      case 'picSetting':
        return picSettings.find((p) => p.id === deletingRecord.id)?.pic || 'Unknown PIC';
      case 'reportSetting': {
        const paramId = reportSettings.find((r) => r.id === deletingRecord.id)?.parameter_id;
        const param = parameterSettings.find((p) => p.id === paramId);
        return param ? `${param.parameter} (${param.unit})` : paramId || 'Unknown Report Setting';
      }
      default:
        return 'Unknown Record';
    }
  }, [deletingRecord, plantUnits, parameterSettings, siloCapacities, picSettings, reportSettings]);

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).filter(Boolean))].sort(),
    [plantUnits]
  );

  // Initialize filters
  useEffect(() => {
    if (uniquePlantCategories.length > 0) {
      if (!parameterCategoryFilter || !uniquePlantCategories.includes(parameterCategoryFilter)) {
        setParameterCategoryFilter(uniquePlantCategories[0]);
      }
      if (!siloCategoryFilter || !uniquePlantCategories.includes(siloCategoryFilter)) {
        setSiloCategoryFilter(uniquePlantCategories[0]);
      }
      if (!copCategoryFilter || !uniquePlantCategories.includes(copCategoryFilter)) {
        setCopCategoryFilter(uniquePlantCategories[0]);
      }
      if (!copFooterCategoryFilter || !uniquePlantCategories.includes(copFooterCategoryFilter)) {
        setCopFooterCategoryFilter(uniquePlantCategories[0]);
      }
    }
  }, [
    uniquePlantCategories,
    parameterCategoryFilter,
    siloCategoryFilter,
    copCategoryFilter,
    copFooterCategoryFilter,
  ]);

  // Units for filters
  const unitsForParameterFilter = useMemo(() => {
    if (!parameterCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === parameterCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, parameterCategoryFilter]);

  const unitsForSiloFilter = useMemo(() => {
    if (!siloCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === siloCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, siloCategoryFilter]);

  const unitsForCopFilter = useMemo(() => {
    if (!copCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === copCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, copCategoryFilter]);

  const unitsForCopFooterFilter = useMemo(() => {
    if (!copFooterCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === copFooterCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, copFooterCategoryFilter]);

  useEffect(() => {
    if (unitsForParameterFilter.length > 0) {
      if (!parameterUnitFilter || !unitsForParameterFilter.includes(parameterUnitFilter)) {
        setParameterUnitFilter(unitsForParameterFilter[0]);
      }
    } else {
      setParameterUnitFilter('');
    }
  }, [unitsForParameterFilter, parameterUnitFilter]);

  useEffect(() => {
    if (unitsForSiloFilter.length > 0) {
      if (!siloUnitFilter || !unitsForSiloFilter.includes(siloUnitFilter)) {
        setSiloUnitFilter(unitsForSiloFilter[0]);
      }
    } else {
      setSiloUnitFilter('');
    }
  }, [unitsForSiloFilter, siloUnitFilter]);

  useEffect(() => {
    if (unitsForCopFilter.length > 0) {
      if (!copUnitFilter || !unitsForCopFilter.includes(copUnitFilter)) {
        setCopUnitFilter(unitsForCopFilter[0]);
      }
    } else {
      setCopUnitFilter('');
    }
  }, [unitsForCopFilter, copUnitFilter]);

  useEffect(() => {
    if (unitsForCopFooterFilter.length > 0) {
      if (!copFooterUnitFilter || !unitsForCopFooterFilter.includes(copFooterUnitFilter)) {
        setCopFooterUnitFilter(unitsForCopFooterFilter[0]);
      }
    } else {
      setCopFooterUnitFilter('');
    }
  }, [unitsForCopFooterFilter, copFooterUnitFilter]);

  // COP Parameters Logic
  const allParametersMap = useMemo(
    () => new Map(parameterSettings.map((p) => [p.id, p])),
    [parameterSettings]
  );
  const {
    copParameterIds,
    setCopParameterIds,
    loading: copParametersLoading,
  } = useDerivativeCopParameters(copCategoryFilter, copUnitFilter);
  const [isCopModalOpen, setIsCopModalOpen] = useState(false);
  const [tempCopSelection, setTempCopSelection] = useState<string[]>([]);

  const copParameters = useMemo(() => {
    if (!copCategoryFilter || !copUnitFilter) return [];
    return copParameterIds
      .map((id) => allParametersMap.get(id))
      .filter((p): p is ParameterSetting => {
        if (!p) return false;
        return p.category === copCategoryFilter && p.unit === copUnitFilter;
      });
  }, [copParameterIds, allParametersMap, copCategoryFilter, copUnitFilter]);

  const {
    paginatedData: paginatedCopParams,
    currentPage: copCurrentPage,
    totalPages: copTotalPages,
    setCurrentPage: setCopCurrentPage,
  } = usePagination(copParameters, 10);

  // COP Footer Parameters Logic
  const {
    copFooterConfigs,
    setCopFooterConfigs,
    loading: copFooterLoading,
  } = useDerivativeCopFooterParameters(copFooterCategoryFilter, copFooterUnitFilter);

  const [isCopFooterModalOpen, setIsCopFooterModalOpen] = useState(false);
  const [tempCopFooterSelection, setTempCopFooterSelection] = useState<CopFooterParameterConfig[]>(
    []
  );
  const [copFooterSearchQuery, setCopFooterSearchQuery] = useState('');

  const copFooterParameters = useMemo(() => {
    if (!copFooterCategoryFilter || !copFooterUnitFilter) return [];
    return copFooterConfigs
      .map((config) => {
        const param = allParametersMap.get(config.id);
        if (!param) return null;
        const categoryMatch = param.category === copFooterCategoryFilter;
        const unitMatch = param.unit === copFooterUnitFilter;
        if (!categoryMatch || !unitMatch) return null;
        return {
          ...param,
          copFooterAggregation: config.aggregation,
        };
      })
      .filter(
        (p): p is ParameterSetting & { copFooterAggregation: CopFooterAggregationType } =>
          p !== null
      );
  }, [copFooterConfigs, allParametersMap, copFooterCategoryFilter, copFooterUnitFilter]);

  const {
    paginatedData: paginatedCopFooterParams,
    currentPage: copFooterCurrentPage,
    totalPages: copFooterTotalPages,
    setCurrentPage: setCopFooterCurrentPage,
  } = usePagination(copFooterParameters, 10);

  // Filtered Tables
  const filteredParameterSettings = useMemo(() => {
    if (!parameterCategoryFilter || !parameterUnitFilter) return [];
    let filtered = parameterSettings.filter((param) => {
      return param.category === parameterCategoryFilter && param.unit === parameterUnitFilter;
    });
    if (parameterSearchQuery.trim()) {
      const searchTerm = parameterSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (param) =>
          param.parameter.toLowerCase().includes(searchTerm) ||
          param.unit.toLowerCase().includes(searchTerm) ||
          param.category.toLowerCase().includes(searchTerm) ||
          param.data_type.toLowerCase().includes(searchTerm)
      );
    }
    return filtered;
  }, [parameterSettings, parameterCategoryFilter, parameterUnitFilter, parameterSearchQuery]);

  const {
    paginatedData: paginatedParams,
    currentPage: paramsCurrentPage,
    totalPages: paramsTotalPages,
    setCurrentPage: setParamsCurrentPage,
  } = usePagination(filteredParameterSettings, 10);

  const filteredSiloCapacities = useMemo(() => {
    if (!siloCategoryFilter || !siloUnitFilter) return [];
    return siloCapacities.filter(
      (silo) => silo.plant_category === siloCategoryFilter && silo.unit === siloUnitFilter
    );
  }, [siloCapacities, siloCategoryFilter, siloUnitFilter]);

  const {
    paginatedData: paginatedSilos,
    currentPage: silosCurrentPage,
    totalPages: silosTotalPages,
    setCurrentPage: setSilosCurrentPage,
  } = usePagination(filteredSiloCapacities, 10);

  // Modal Handlers
  const handleOpenAddModal = (type: ModalType) => {
    if (type === 'plantUnit') setEditingPlantUnit(null);
    if (type === 'parameterSetting') setEditingParameter(null);
    if (type === 'siloCapacity') setEditingSilo(null);
    if (type === 'picSetting') setEditingPic(null);
    if (type === 'reportSetting') setEditingReportSetting(null);
    setActiveModal(type);
  };

  const handleOpenEditModal = (type: ModalType, record: MasterDataRecord) => {
    if (type === 'plantUnit') setEditingPlantUnit(record as PlantUnit);
    if (type === 'parameterSetting') setEditingParameter(record as ParameterSetting);
    if (type === 'siloCapacity') setEditingSilo(record as SiloCapacity);
    if (type === 'picSetting') setEditingPic(record as PicSetting);
    if (type === 'reportSetting') setEditingReportSetting(record as RkcReportSetting);
    setActiveModal(type);
  };

  const handleOpenDeleteModal = (id: string, type: ModalType) => {
    setDeletingRecord({ id, type });
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setActiveModal(null);
    setDeleteModalOpen(false);
    setEditingPlantUnit(null);
    setEditingParameter(null);
    setEditingSilo(null);
    setEditingPic(null);
    setEditingReportSetting(null);
    setDeletingRecord(null);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (!canWrite) return;
    if (deletingRecord) {
      if (deletingRecord.type === 'plantUnit') deletePlantUnit(deletingRecord.id);
      if (deletingRecord.type === 'parameterSetting') deleteParameter(deletingRecord.id);
      if (deletingRecord.type === 'siloCapacity') deleteSilo(deletingRecord.id);
      if (deletingRecord.type === 'picSetting') deletePicSetting(deletingRecord.id);
      if (deletingRecord.type === 'reportSetting') deleteReportSetting(deletingRecord.id);
    }
    handleCloseModals();
  }, [
    deletingRecord,
    deletePlantUnit,
    deleteParameter,
    deleteSilo,
    deletePicSetting,
    deleteReportSetting,
    canWrite,
  ]);

  const handleSave = (type: ModalType, record: MasterDataRecord) => {
    if (!canWrite) return;
    if (type === 'plantUnit') {
      if ('id' in record && record.id) updatePlantUnit(record as PlantUnit);
      else addPlantUnit(record as PlantUnit);
    }
    if (type === 'parameterSetting') {
      if ('id' in record && record.id) updateParameter(record as ParameterSetting);
      else addParameter(record as ParameterSetting);
    }
    if (type === 'siloCapacity') {
      if ('id' in record && record.id) updateSilo(record as SiloCapacity);
      else addSilo(record as SiloCapacity);
    }
    if (type === 'picSetting') {
      if ('id' in record && record.id) updatePicSetting(record as PicSetting);
      else addPicSetting(record as PicSetting);
    }
    if (type === 'reportSetting') {
      if ('id' in record && record.id) updateReportSetting(record as RkcReportSetting);
      else addReportSetting(record as RkcReportSetting);
    }
    handleCloseModals();
  };

  // COP Handlers
  const handleOpenCopModal = () => {
    setTempCopSelection([...copParameterIds]);
    setIsCopModalOpen(true);
  };
  const handleCloseCopModal = () => setIsCopModalOpen(false);
  const handleCopSelectionChange = (paramId: string) => {
    setTempCopSelection((prev) =>
      prev.includes(paramId) ? prev.filter((id) => id !== paramId) : [...prev, paramId]
    );
  };
  const handleSaveCopSelection = () => {
    setCopParameterIds(tempCopSelection.sort());
    handleCloseCopModal();
  };
  const handleRemoveCopParameter = (paramId: string) => {
    setCopParameterIds(copParameterIds.filter((id) => id !== paramId));
  };

  // COP Footer Handlers
  const handleOpenCopFooterModal = () => {
    setTempCopFooterSelection([...copFooterConfigs]);
    setCopFooterSearchQuery('');
    setIsCopFooterModalOpen(true);
  };
  const handleCloseCopFooterModal = () => setIsCopFooterModalOpen(false);

  useEffect(() => {
    if (isCopFooterModalOpen) {
      setTempCopFooterSelection([...copFooterConfigs]);
    }
  }, [copFooterConfigs, isCopFooterModalOpen]);

  const handleCopFooterSelectionChange = (paramId: string) => {
    setTempCopFooterSelection((prev) => {
      const exists = prev.some((item) => item.id === paramId);
      if (exists) {
        return prev.filter((item) => item.id !== paramId);
      } else {
        return [...prev, { id: paramId, aggregation: 'average' }];
      }
    });
  };
  const handleCopFooterAggregationChange = (
    paramId: string,
    aggregation: CopFooterAggregationType
  ) => {
    setTempCopFooterSelection((prev) =>
      prev.map((item) => (item.id === paramId ? { ...item, aggregation } : item))
    );
  };
  const handleSaveCopFooterSelection = () => {
    setCopFooterConfigs(tempCopFooterSelection);
    handleCloseCopFooterModal();
  };
  const handleRemoveCopFooterParameter = (paramId: string) => {
    setCopFooterConfigs(copFooterConfigs.filter((item) => item.id !== paramId));
  };

  // Report Settings Drag & Drop
  const handleReportDragEnd = (result: DropResult) => {
    if (!result.destination || !canWrite) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reordered = Array.from(reportSettings);
    const [movedItem] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedItem);

    const updatedWithOrder = reordered.map((item, index) => ({
      ...item,
      order: index,
    }));

    if (updateReportOrder) {
      updateReportOrder(updatedWithOrder);
    }
  };

  const handleExportAll = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const sheets = [];
      if (plantUnits.length > 0) {
        sheets.push({ name: 'Plant Units', data: plantUnits.map((u) => ({ ...u })) });
      }
      if (parameterSettings.length > 0) {
        sheets.push({ name: 'Parameter Settings', data: parameterSettings.map((p) => ({ ...p })) });
      }
      if (siloCapacities.length > 0) {
        sheets.push({ name: 'Silo Capacities', data: siloCapacities.map((s) => ({ ...s })) });
      }
      if (picSettings.length > 0) {
        sheets.push({ name: 'PIC Settings', data: picSettings.map((p) => ({ ...p })) });
      }
      if (reportSettings.length > 0) {
        sheets.push({ name: 'Report Settings', data: reportSettings.map((r) => ({ ...r })) });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Derivative_MasterData_${timestamp}`;
      exportMultipleSheets(sheets, filename);
    } catch {
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportAll = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      alert('Fitur import saat ini sedang diperbarui.');
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  // Visual Helper Components
  const renderSectionHeader = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    onAdd?: () => void,
    addLabel: string = 'Tambah Data'
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      {canWrite && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none min-h-[36px]"
          aria-label={addLabel}
        >
          <Plus className="w-4 h-4" />
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  );

  const renderEmptyState = (message: string, onAction?: () => void, actionLabel?: string) => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-4">
        {message}
      </p>
      {canWrite && onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Compact Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-sm border border-slate-700/50 p-4 sm:p-6 text-white w-full">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 text-primary-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {t['derivative_master_data_title'] || 'Derivative Master Data'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                {t['derivative_master_data_subtitle'] ||
                  'Konfigurasi parameter unit, silo, COP, dan laporan harian Derivative'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <RealtimeIndicator
              isConnected={true}
              lastUpdate={new Date()}
              className="text-xs text-slate-300"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportAll}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || !canWrite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 active:bg-white/20 text-white rounded-lg border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
              title={t['import_excel'] || 'Import Excel'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isImporting ? 'Mengimpor...' : 'Import'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
              title={t['export_excel'] || 'Export Excel'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Mengekspor...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'parameters'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t['parameter_settings_title'] || 'Parameter Settings'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current">
              {parameterSettings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('units_pic')}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'units_pic'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Unit & PIC</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current">
              {plantUnits.length + picSettings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('silo')}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'silo'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t['silo_capacity_title'] || 'Kapasitas Silo'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current">
              {siloCapacities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cop')}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'cop'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t['cop_parameters_title'] || 'Konfigurasi COP'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current">
              {copParameters.length + copFooterParameters.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-[140px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'reports'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t['report_settings_title'] || 'Konfigurasi Laporan'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-current">
              {reportSettings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-700'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Tampilkan Semua Modul Sekaligus"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Semua</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Parameter Settings */}
      {(activeTab === 'parameters' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['parameter_settings_title'] || 'Parameter Settings',
            'Daftar variabel operasional dan batas normal mesin Derivative',
            <Settings className="w-4 h-4" />,
            () => handleOpenAddModal('parameterSetting'),
            'Tambah Parameter'
          )}

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>
              <select
                value={parameterCategoryFilter}
                onChange={(e) => setParameterCategoryFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                aria-label="Filter Kategori Parameter"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={parameterUnitFilter}
                onChange={(e) => setParameterUnitFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                aria-label="Filter Unit Parameter"
              >
                {unitsForParameterFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-64 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari parameter..."
                value={parameterSearchQuery}
                onChange={(e) => setParameterSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              {parameterSearchQuery && (
                <button
                  type="button"
                  onClick={() => setParameterSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                <tr>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">ID</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    {t['parameter'] || 'Parameter'}
                  </th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    {t['data_type'] || 'Tipe Data'}
                  </th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">{t['category'] || 'Kategori'}</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Max</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">OPC Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">OPC Max</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">PCC Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">PCC Max</th>
                  {canWrite && (
                    <th className="px-3.5 py-2.5 text-right whitespace-nowrap w-20">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {paginatedParams.length === 0 ? (
                  <tr>
                    <td colSpan={canWrite ? 12 : 11} className="p-0">
                      {renderEmptyState(
                        'Tidak ada parameter untuk filter yang dipilih.',
                        () => handleOpenAddModal('parameterSetting'),
                        'Tambah Parameter Baru'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedParams.map((param) => (
                    <tr
                      key={param.id}
                      className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                    >
                      <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {param.id}
                      </td>
                      <td
                        className="px-3.5 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap max-w-[220px] truncate"
                        title={param.parameter}
                      >
                        {param.parameter}
                      </td>
                      <td className="px-3.5 py-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            param.data_type === ParameterDataType.NUMBER
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {param.data_type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {param.unit}
                      </td>
                      <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {param.category}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.max_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.opc_min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.opc_max_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.pcc_min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.pcc_max_value ?? '-')
                          : '-'}
                      </td>
                      {canWrite && (
                        <td className="px-3.5 py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal('parameterSetting', param)}
                              className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                              title="Edit Parameter"
                              aria-label="Edit Parameter"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(param.id, 'parameterSetting')}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                              title="Hapus Parameter"
                              aria-label="Hapus Parameter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
            <Pagination
              currentPage={paramsCurrentPage}
              totalPages={paramsTotalPages}
              onPageChange={setParamsCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Plant Units & PIC Settings */}
      {(activeTab === 'units_pic' || activeTab === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Plant Units */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            {renderSectionHeader(
              t['plant_unit_title'] || 'Unit Pabrik Derivative',
              'Daftar unit pengukuran dan kategori fasilitas Derivative',
              <Database className="w-4 h-4" />,
              () => handleOpenAddModal('plantUnit')
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-600 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['measurement_unit'] || 'Unit'}
                    </th>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['plant_category'] || 'Kategori Pabrik'}
                    </th>
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {plantUnitsLoading ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memuat unit pabrik...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPlantUnits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-0">
                        {renderEmptyState(
                          'Belum ada data unit pabrik.',
                          () => handleOpenAddModal('plantUnit'),
                          'Tambah Unit'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedPlantUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                      >
                        <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {unit.unit}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {unit.category}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal('plantUnit', unit)}
                                className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                title="Edit Unit"
                                aria-label="Edit Unit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(unit.id, 'plantUnit')}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Hapus Unit"
                                aria-label="Hapus Unit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
              <Pagination
                currentPage={puCurrentPage}
                totalPages={puTotalPages}
                onPageChange={setPuCurrentPage}
              />
            </div>
          </div>

          {/* PIC Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            {renderSectionHeader(
              t['pic_setting_title'] || 'PIC Settings',
              'Daftar person in charge (petugas operasional) Derivative',
              <Users className="w-4 h-4" />,
              () => handleOpenAddModal('picSetting')
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-600 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 whitespace-nowrap">{t['pic'] || 'Nama PIC'}</th>
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {paginatedPicSettings.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-0">
                        {renderEmptyState(
                          'Belum ada data PIC terdaftar.',
                          () => handleOpenAddModal('picSetting'),
                          'Tambah PIC'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedPicSettings.map((pic) => (
                      <tr
                        key={pic.id}
                        className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                      >
                        <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {pic.pic}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal('picSetting', pic)}
                                className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                title="Edit PIC"
                                aria-label="Edit PIC"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(pic.id, 'picSetting')}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Hapus PIC"
                                aria-label="Hapus PIC"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
              <Pagination
                currentPage={picCurrentPage}
                totalPages={picTotalPages}
                onPageChange={setPicCurrentPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Silo Capacities */}
      {(activeTab === 'silo' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['silo_capacity_title'] || 'Kapasitas Silo Derivative',
            'Kapasitas penampungan dan dead stock silo material unit Derivative',
            <Layers className="w-4 h-4" />,
            () => handleOpenAddModal('siloCapacity')
          )}

          {/* Filter */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <div className="relative">
              <label htmlFor="derivative-silo-cat-filter" className="sr-only">
                Plant Category
              </label>
              <select
                id="derivative-silo-cat-filter"
                value={siloCategoryFilter}
                onChange={(e) => setSiloCategoryFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors cursor-pointer appearance-none"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <label htmlFor="derivative-silo-unit-filter" className="sr-only">
                Plant Unit
              </label>
              <select
                id="derivative-silo-unit-filter"
                value={siloUnitFilter}
                onChange={(e) => setSiloUnitFilter(e.target.value)}
                disabled={unitsForSiloFilter.length === 0}
                className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
              >
                {unitsForSiloFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 whitespace-nowrap">
                    {t['plant_category'] || 'Kategori'}
                  </th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">{t['silo_name'] || 'Nama Silo'}</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">
                    {t['capacity'] || 'Kapasitas (Ton)'}
                  </th>
                  <th className="px-4 py-2.5 whitespace-nowrap">
                    {t['dead_stock'] || 'Dead Stock (Ton)'}
                  </th>
                  <th className="px-4 py-2.5 whitespace-nowrap">
                    {t['silo_lifestock'] || 'Lifestock (Ton)'}
                  </th>
                  {canWrite && (
                    <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {siloCapacitiesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Memuat data silo...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSiloCapacities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      {renderEmptyState(
                        'Tidak ada data kapasitas silo untuk kategori & unit terpilih.',
                        () => handleOpenAddModal('siloCapacity'),
                        'Tambah Silo'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedSilos.map((silo) => {
                    const lifestock = silo.capacity - silo.dead_stock;
                    return (
                      <tr
                        key={silo.id}
                        className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                      >
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {silo.plant_category}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {silo.unit}
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {silo.silo_name}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatNumber(silo.capacity)}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatNumber(silo.dead_stock)}
                        </td>
                        <td className="px-4 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatNumber(lifestock)}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal('siloCapacity', silo)}
                                className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                title="Edit Silo"
                                aria-label="Edit Silo"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(silo.id, 'siloCapacity')}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Hapus Silo"
                                aria-label="Hapus Silo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
            <Pagination
              currentPage={silosCurrentPage}
              totalPages={silosTotalPages}
              onPageChange={setSilosCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Tab 4: COP Configuration */}
      {(activeTab === 'cop' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Konfigurasi COP Derivative
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Atur parameter tabel utama dan ringkasan footer analisis COP
                </p>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCopSubTab('cop_params')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  copSubTab === 'cop_params'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Parameter Tabel ({copParameters.length})
              </button>
              <button
                type="button"
                onClick={() => setCopSubTab('cop_footer')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  copSubTab === 'cop_footer'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Footer Parameters ({copFooterParameters.length})
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>
              {copSubTab === 'cop_params' ? (
                <>
                  <select
                    value={copCategoryFilter}
                    onChange={(e) => setCopCategoryFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    value={copUnitFilter}
                    onChange={(e) => setCopUnitFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    {unitsForCopFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select
                    value={copFooterCategoryFilter}
                    onChange={(e) => setCopFooterCategoryFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    value={copFooterUnitFilter}
                    onChange={(e) => setCopFooterUnitFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    {unitsForCopFooterFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={copSubTab === 'cop_params' ? handleOpenCopModal : handleOpenCopFooterModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {copSubTab === 'cop_params' ? 'Pilih Parameter COP' : 'Atur Footer Parameter'}
                </span>
              </button>
            )}
          </div>

          {/* COP Content */}
          {copSubTab === 'cop_params' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['parameter'] || 'Parameter'}
                    </th>
                    <th className="px-4 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">{t['category'] || 'Kategori'}</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Batas Normal</th>
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {copParametersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memuat konfigurasi COP...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCopParams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        {renderEmptyState(
                          'Belum ada parameter COP dipilih.',
                          handleOpenCopModal,
                          'Pilih Parameter COP'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedCopParams.map((param) => (
                      <tr
                        key={param.id}
                        className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                      >
                        <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {param.parameter}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {param.unit}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {param.category}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {param.min_value !== undefined ? formatNumber(param.min_value) : '-'} ~{' '}
                          {param.max_value !== undefined ? formatNumber(param.max_value) : '-'}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveCopParameter(param.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                              title="Hapus dari COP"
                              aria-label="Hapus dari COP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
                <Pagination
                  currentPage={copCurrentPage}
                  totalPages={copTotalPages}
                  onPageChange={setCopCurrentPage}
                />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['parameter'] || 'Parameter'}
                    </th>
                    <th className="px-4 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">{t['category'] || 'Kategori'}</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Tipe Agregasi</th>
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {copFooterLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memuat footer parameter...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCopFooterParams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        {renderEmptyState(
                          'Belum ada footer parameter dipilih.',
                          handleOpenCopFooterModal,
                          'Pilih Footer Parameter'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedCopFooterParams.map((param) => (
                      <tr
                        key={param.id}
                        className="hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
                      >
                        <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {param.parameter}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {param.unit}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {param.category}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            {param.copFooterAggregation || 'average'}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveCopFooterParameter(param.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                              title="Hapus Footer Parameter"
                              aria-label="Hapus Footer Parameter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
                <Pagination
                  currentPage={copFooterCurrentPage}
                  totalPages={copFooterTotalPages}
                  onPageChange={setCopFooterCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Report Settings (Drag & Drop) */}
      {(activeTab === 'reports' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['report_settings_title'] || 'Konfigurasi Parameter Laporan Derivative',
            'Atur urutan dan parameter yang muncul pada laporan shift harian Derivative',
            <FileText className="w-4 h-4" />,
            () => handleOpenAddModal('reportSetting'),
            'Tambah Parameter Laporan'
          )}

          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              <span>Geser baris untuk mengatur urutan parameter laporan</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DragDropContext onDragEnd={handleReportDragEnd}>
              <table className="min-w-full text-left border-collapse text-xs">
                <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-16 text-center">Urutan</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['parameter'] || 'Parameter'}
                    </th>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      {t['category'] || 'Kategori Report'}
                    </th>
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <Droppable droppableId="derivative-report-settings">
                  {(provided) => (
                    <tbody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900"
                    >
                      {reportSettingsLoading ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                              <LoadingSpinner size="sm" />
                              <span>Memuat parameter laporan...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedReportSettings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-0">
                            {renderEmptyState(
                              'Belum ada parameter laporan Derivative dikonfigurasi.',
                              () => handleOpenAddModal('reportSetting'),
                              'Tambah Parameter Laporan'
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedReportSettings.map((setting, index) => {
                          const param = allParametersMap.get(setting.parameter_id);
                          return (
                            <Draggable key={setting.id} draggableId={setting.id} index={index}>
                              {(provided, snapshot) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-colors ${
                                    snapshot.isDragging
                                      ? 'bg-primary-50 dark:bg-primary-950/50 shadow-md ring-1 ring-primary-500'
                                      : 'hover:bg-primary-50/40 dark:hover:bg-primary-950/20'
                                  }`}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
                                        title="Geser untuk mengurutkan"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                        {(setting.order !== undefined ? setting.order : index) + 1}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                    {param ? (
                                      <span>
                                        {param.parameter}
                                        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                                          ({param.unit})
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono text-[11px]">
                                        {setting.parameter_id}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {setting.category || 'Default'}
                                    </span>
                                  </td>
                                  {canWrite && (
                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenEditModal('reportSetting', setting)
                                          }
                                          className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                          title="Edit Parameter Laporan"
                                          aria-label="Edit parameter laporan"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenDeleteModal(setting.id, 'reportSetting')
                                          }
                                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                          title="Hapus Parameter Laporan"
                                          aria-label="Hapus parameter laporan"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </DragDropContext>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
            <Pagination
              currentPage={reportCurrentPage}
              totalPages={reportTotalPages}
              onPageChange={setReportCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={activeModal !== null && !isDeleteModalOpen}
        onClose={handleCloseModals}
        title={
          activeModal === 'plantUnit'
            ? editingPlantUnit
              ? t['edit_plant_unit_title'] || 'Edit Unit Pabrik Derivative'
              : t['add_plant_unit_title'] || 'Tambah Unit Pabrik Derivative'
            : activeModal === 'parameterSetting'
              ? editingParameter
                ? t['edit_parameter_title'] || 'Edit Parameter Derivative'
                : t['add_parameter_title'] || 'Tambah Parameter Derivative'
              : activeModal === 'siloCapacity'
                ? editingSilo
                  ? t['edit_silo_title'] || 'Edit Kapasitas Silo'
                  : t['add_silo_title'] || 'Tambah Kapasitas Silo'
                : activeModal === 'picSetting'
                  ? editingPic
                    ? t['edit_pic_title'] || 'Edit PIC Derivative'
                    : t['add_pic_title'] || 'Tambah PIC Derivative'
                  : activeModal === 'reportSetting'
                    ? editingReportSetting
                      ? t['edit_report_parameter_title'] || 'Edit Parameter Laporan'
                      : t['add_report_parameter_title'] || 'Tambah Parameter Laporan'
                    : ''
        }
      >
        {activeModal === 'plantUnit' && (
          <PlantUnitForm
            recordToEdit={editingPlantUnit}
            onSave={(r) => handleSave('plantUnit', r)}
            onCancel={handleCloseModals}
            t={t}
          />
        )}
        {activeModal === 'parameterSetting' && (
          <ParameterSettingForm
            recordToEdit={editingParameter}
            onSave={(r) => handleSave('parameterSetting', r)}
            onCancel={handleCloseModals}
            t={t}
          />
        )}
        {activeModal === 'siloCapacity' && (
          <SiloCapacityForm
            recordToEdit={editingSilo}
            onSave={(r) => handleSave('siloCapacity', r)}
            onCancel={handleCloseModals}
            t={t}
            plantUnits={plantUnits}
          />
        )}
        {activeModal === 'picSetting' && (
          <PicSettingForm
            recordToEdit={editingPic}
            onSave={(r) => handleSave('picSetting', r)}
            onCancel={handleCloseModals}
            t={t}
          />
        )}
        {activeModal === 'reportSetting' && (
          <RkcReportSettingForm
            recordToEdit={editingReportSetting}
            onSave={(r) => handleSave('reportSetting', r)}
            onCancel={handleCloseModals}
            t={t}
            allParameters={parameterSettings}
            existingParameterIds={reportSettings.map((rs) => rs.parameter_id)}
            maxOrder={maxReportSettingOrder}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title={t['delete_confirmation_title'] || 'Konfirmasi Hapus Data'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Apakah Anda yakin ingin menghapus data ini?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus catatan dari sistem secara
                permanen.
              </p>
              <div className="mt-3 p-2 bg-white dark:bg-slate-900 border border-red-200/60 dark:border-red-900/30 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Data yang akan dihapus:
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                  {getDeletingRecordName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCloseModals}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors min-h-[36px]"
            >
              {t['cancel'] || 'Batal'}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-colors min-h-[36px]"
            >
              {t['delete'] || 'Hapus Permanen'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Select COP Parameters Modal */}
      {isCopModalOpen && (
        <Modal isOpen={true} onClose={handleCloseCopModal} title="Pilih Parameter COP Derivative">
          <div className="p-4 space-y-4 max-h-[70vh] flex flex-col">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pilih parameter yang akan ditampilkan pada tabel analitik COP untuk unit{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {copCategoryFilter} - {copUnitFilter}
              </strong>
              .
            </p>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/40 dark:bg-slate-900/40">
              {parameterSettings
                .filter((p) => p.category === copCategoryFilter && p.unit === copUnitFilter)
                .map((param) => {
                  const isChecked = tempCopSelection.includes(param.id);
                  return (
                    <label
                      key={param.id}
                      className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCopSelectionChange(param.id)}
                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {param.parameter}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tipe: {param.data_type} | Normal: {param.min_value ?? '-'} ~{' '}
                          {param.max_value ?? '-'}
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseCopModal}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 min-h-[36px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCopSelection}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm min-h-[36px]"
              >
                Simpan Pilihan ({tempCopSelection.length})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Select COP Footer Parameters Modal */}
      {isCopFooterModalOpen && (
        <Modal
          isOpen={true}
          onClose={handleCloseCopFooterModal}
          title="Konfigurasi Footer Parameter COP"
        >
          <div className="p-4 space-y-4 max-h-[70vh] flex flex-col">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pilih parameter dan rumus agregasi yang muncul di bagian footer ringkasan COP untuk
              unit{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {copFooterCategoryFilter} - {copFooterUnitFilter}
              </strong>
              .
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari parameter..."
                value={copFooterSearchQuery}
                onChange={(e) => setCopFooterSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/40 dark:bg-slate-900/40">
              {parameterSettings
                .filter(
                  (p) =>
                    p.category === copFooterCategoryFilter &&
                    p.unit === copFooterUnitFilter &&
                    p.parameter.toLowerCase().includes(copFooterSearchQuery.toLowerCase())
                )
                .map((param) => {
                  const existingConfig = tempCopFooterSelection.find((c) => c.id === param.id);
                  const isChecked = !!existingConfig;
                  return (
                    <div
                      key={param.id}
                      className="flex items-center justify-between gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCopFooterSelectionChange(param.id)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {param.parameter}
                          </div>
                          <div className="text-[11px] text-slate-500">Unit: {param.unit}</div>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">Agregasi:</span>
                          <select
                            value={existingConfig.aggregation}
                            onChange={(e) =>
                              handleCopFooterAggregationChange(
                                param.id,
                                e.target.value as CopFooterAggregationType
                              )
                            }
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
                          >
                            <option value="average">Rata-rata (Avg)</option>
                            <option value="total">Total (Sum)</option>
                            <option value="min">Minimum (Min)</option>
                            <option value="max">Maksimum (Max)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseCopFooterModal}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 min-h-[36px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCopFooterSelection}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-sm min-h-[36px]"
              >
                Simpan Pilihan ({tempCopFooterSelection.length})
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DerivativeMasterDataPage;
