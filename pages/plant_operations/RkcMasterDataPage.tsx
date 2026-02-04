import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Database,
  Users,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportMultipleSheets, importMultipleSheets } from '../../utils/excelUtils';
import Modal from '../../components/Modal';
import { SearchInput } from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import DocumentArrowDownIcon from '../../components/icons/DocumentArrowDownIcon';
import DocumentArrowUpIcon from '../../components/icons/DocumentArrowUpIcon';
import { formatNumber } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

// RKC Hooks
import { useRkcPlantUnits } from '../../hooks/useRkcPlantUnits';
import { useRkcParameterSettings } from '../../hooks/useRkcParameterSettings';
import { useRkcSiloCapacities } from '../../hooks/useRkcSiloCapacities';
import { useRkcPicSettings } from '../../hooks/useRkcPicSettings';
import { useRkcCopParameters } from '../../hooks/useRkcCopParameters';
import { useRkcReportSettings } from '../../hooks/useRkcReportSettings';
import { useRkcCopFooterParameters } from '../../hooks/useRkcCopFooterParameters';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

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

const RkcMasterDataPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { canWrite } = usePlantOperationsAccess();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant Units State
  const {
    records: plantUnits,
    addRecord: addPlantUnit,
    updateRecord: updatePlantUnit,
    deleteRecord: deletePlantUnit,
    loading: plantUnitsLoading,
  } = useRkcPlantUnits();

  // Parameter Settings State
  const {
    records: parameterSettings,
    addRecord: addParameter,
    updateRecord: updateParameter,
    deleteRecord: deleteParameter,
  } = useRkcParameterSettings();

  // Silo Capacity State
  const {
    records: siloCapacities,
    loading: siloCapacitiesLoading,
    addRecord: addSilo,
    updateRecord: updateSilo,
    deleteRecord: deleteSilo,
  } = useRkcSiloCapacities();

  // PIC Settings State
  const {
    records: picSettings,
    addRecord: addPicSetting,
    updateRecord: updatePicSetting,
    deleteRecord: deletePicSetting,
  } = useRkcPicSettings();

  // Report Settings State
  const {
    records: reportSettings,
    addRecord: addReportSetting,
    updateRecord: updateReportSetting,
    deleteRecord: deleteReportSetting,
    updateOrder: updateReportOrder,
  } = useRkcReportSettings();

  // Pagination State
  const {
    paginatedData: paginatedPlantUnits,
    currentPage: puCurrentPage,
    totalPages: puTotalPages,
    setCurrentPage: setPuCurrentPage,
  } = usePagination(plantUnits, 10);

  const [editingPlantUnit, setEditingPlantUnit] = useState<PlantUnit | null>(null);
  const [editingParameter, setEditingParameter] = useState<ParameterSetting | null>(null);
  const [editingSilo, setEditingSilo] = useState<SiloCapacity | null>(null);
  const [editingReportSetting, setEditingReportSetting] = useState<RkcReportSetting | null>(null);
  const [editingPic, setEditingPic] = useState<PicSetting | null>(null);

  const {
    paginatedData: paginatedPicSettings,
    currentPage: picCurrentPage,
    totalPages: picTotalPages,
    setCurrentPage: setPicCurrentPage,
  } = usePagination(picSettings, 10);

  const {
    paginatedData: paginatedReportSettings,
    currentPage: reportCurrentPage,
    totalPages: reportTotalPages,
    setCurrentPage: setReportCurrentPage,
  } = usePagination(reportSettings, 10);

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

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
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
  }, [uniquePlantCategories, parameterCategoryFilter, siloCategoryFilter, copCategoryFilter]);

  // COP Parameters Logic
  const allParametersMap = useMemo(
    () => new Map(parameterSettings.map((p) => [p.id, p])),
    [parameterSettings]
  );
  const {
    copParameterIds,
    setCopParameterIds,
    loading: copParametersLoading,
  } = useRkcCopParameters(copCategoryFilter, copUnitFilter);
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
  } = usePagination(copParameters as ParameterSetting[], 10);

  // COP Footer Parameters Logic
  const {
    copFooterParameterIds,
    setCopFooterParameterIds,
    loading: copFooterLoading,
  } = useRkcCopFooterParameters(copFooterCategoryFilter, copFooterUnitFilter);

  const [isCopFooterModalOpen, setIsCopFooterModalOpen] = useState(false);
  const [tempCopFooterSelection, setTempCopFooterSelection] = useState<string[]>([]);

  const copFooterParameters = useMemo(() => {
    if (!copFooterCategoryFilter || !copFooterUnitFilter) return [];
    return copFooterParameterIds
      .map((id) => allParametersMap.get(id))
      .filter((p): p is ParameterSetting => {
        if (!p) return false;
        return p.category === copFooterCategoryFilter && p.unit === copFooterUnitFilter;
      });
  }, [copFooterParameterIds, allParametersMap, copFooterCategoryFilter, copFooterUnitFilter]);

  const {
    paginatedData: paginatedCopFooterParams,
    currentPage: copFooterCurrentPage,
    totalPages: copFooterTotalPages,
    setCurrentPage: setCopFooterCurrentPage,
  } = usePagination(copFooterParameters as ParameterSetting[], 10);

  // Filter Logic helpers
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

  // Auto-select unit
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

  // Filtered Lists
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

  // Search Helpers
  const clearParameterSearch = useCallback(() => {
    setParameterSearchQuery('');
  }, []);

  const isParameterSearchActive = useMemo(
    () => parameterSearchQuery.trim().length > 0,
    [parameterSearchQuery]
  );

  // Handlers
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
  }, [deletingRecord, deletePlantUnit, deleteParameter, deleteSilo, deletePicSetting, canWrite]);

  const handleSave = (type: ModalType, record: MasterDataRecord) => {
    if (!canWrite) return;
    if (type === 'plantUnit') {
      if ('id' in record) updatePlantUnit(record as PlantUnit);
      else addPlantUnit(record as PlantUnit);
    }
    if (type === 'parameterSetting') {
      if ('id' in record) updateParameter(record as ParameterSetting);
      else addParameter(record as ParameterSetting);
    }
    if (type === 'siloCapacity') {
      if ('id' in record) updateSilo(record as SiloCapacity);
      else addSilo(record as SiloCapacity);
    }
    if (type === 'picSetting') {
      if ('id' in record) updatePicSetting(record as PicSetting);
      else addPicSetting(record as PicSetting);
    }
    if (type === 'reportSetting') {
      if ('id' in record) updateReportSetting(record as RkcReportSetting);
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
    setTempCopFooterSelection([...copFooterParameterIds]);
    setIsCopFooterModalOpen(true);
  };
  const handleCloseCopFooterModal = () => setIsCopFooterModalOpen(false);
  const handleCopFooterSelectionChange = (paramId: string) => {
    setTempCopFooterSelection((prev) =>
      prev.includes(paramId) ? prev.filter((id) => id !== paramId) : [...prev, paramId]
    );
  };
  const handleSaveCopFooterSelection = () => {
    setCopFooterParameterIds(tempCopFooterSelection.sort());
    handleCloseCopFooterModal();
  };
  const handleRemoveCopFooterParameter = (paramId: string) => {
    setCopFooterParameterIds(copFooterParameterIds.filter((id) => id !== paramId));
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

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `RKC_MasterData_${timestamp}`;
      exportMultipleSheets(sheets, filename);
    } catch (error) {
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
      alert('Import feature is being restored. Please try again later.');
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-[#772953] to-[#2C001E] rounded-xl shadow-lg border border-[#AEA79F]/20 p-6 mb-8"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#E95420]/10 rounded-full -translate-y-20 translate-x-20"></div>

          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <Database className="w-7 h-7 text-[#E95420]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {t['op_rkc_master_data'] || 'RKC Master Data'}
                </h1>
                <p className="text-sm text-white/80 font-medium mt-0.5">
                  Manage RKC plant operations master data and configurations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RealtimeIndicator
                isConnected={true}
                lastUpdate={new Date()}
                className="text-sm text-white/80"
              />
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportAll}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting || !canWrite}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#333333] bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <DocumentArrowUpIcon className="w-5 h-5 text-[#772953]" />
                  {isImporting ? t['importing'] || 'Importing...' : t['import_all']}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportAll}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#E95420] rounded-lg shadow-sm hover:bg-[#d94612] ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  {isExporting ? t['exporting'] || 'Exporting...' : t['export_all']}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Plant Unit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-[#AEA79F]/30 overflow-hidden"
          >
            <div className="p-6 border-b border-[#AEA79F]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <Database className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333]">
                      {t['plant_unit_title']}
                    </h3>
                    <p className="text-sm text-[#555555]">{t['plant_unit_subtitle']}</p>
                  </div>
                </div>
                {canWrite && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenAddModal('plantUnit')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-lg shadow-sm hover:bg-[#d94612] transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t['add_data_button']}
                  </motion.button>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#AEA79F]/20">
                  <thead className="bg-[#F7F7F7]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['measurement_unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['plant_category']}
                      </th>
                      {canWrite && (
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#AEA79F]/20">
                    {plantUnitsLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-[#AEA79F]">Loading plant units...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedPlantUnits.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-[#AEA79F]">
                          No plant units found
                        </td>
                      </tr>
                    ) : (
                      paginatedPlantUnits.map((unit, _index) => (
                        <tr
                          key={unit.id}
                          className="hover:bg-[#E95420]/5 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#333333]">
                            {unit.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555]">
                            {unit.category}
                          </td>
                          {canWrite && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleOpenEditModal('plantUnit', unit)}
                                  className="p-2 text-[#AEA79F] hover:text-[#772953] transition-colors duration-200 rounded-lg hover:bg-[#772953]/10"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleOpenDeleteModal(unit.id, 'plantUnit')}
                                  className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200 rounded-lg hover:bg-[#C7162B]/10"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={puCurrentPage}
                  totalPages={puTotalPages}
                  onPageChange={setPuCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* PIC Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-[#AEA79F]/30 overflow-hidden"
          >
            <div className="p-6 border-b border-[#AEA79F]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F9F9F9] rounded-lg">
                    <Users className="w-5 h-5 text-[#333333]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333]">
                      {t['pic_setting_title']}
                    </h3>
                    <p className="text-sm text-[#555555]">{t['pic_setting_subtitle']}</p>
                  </div>
                </div>
                {canWrite && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenAddModal('picSetting')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-lg shadow-sm hover:bg-[#d94612] transition-all duration-200"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t['add_data_button']}
                  </motion.button>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#AEA79F]/20">
                  <thead className="bg-[#F7F7F7]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['pic']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#AEA79F]/20">
                    {paginatedPicSettings.map((pic, _index) => (
                      <tr
                        key={pic.id}
                        className="hover:bg-[#E95420]/5 transition-colors duration-200"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#333333]">
                          {pic.pic}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenEditModal('picSetting', pic)}
                                className="p-2 text-[#AEA79F] hover:text-[#772953] transition-colors duration-200 rounded-lg hover:bg-[#772953]/10"
                              >
                                <EditIcon className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenDeleteModal(pic.id, 'picSetting')}
                                className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200 rounded-lg hover:bg-[#C7162B]/10"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={picCurrentPage}
                  totalPages={picTotalPages}
                  onPageChange={setPicCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* Parameter Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['parameter_setting_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['parameter_setting_subtitle_rkc']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenAddModal('parameterSetting')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-xl shadow-sm hover:bg-[#d94612] transition-all duration-200"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t['add_data_button']}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={parameterSearchQuery}
                    onChange={(e) => setParameterSearchQuery(e.target.value)}
                    placeholder="Search parameters..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  />
                  {parameterSearchQuery && (
                    <button
                      onClick={clearParameterSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="sr-only">Clear search</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative min-w-[140px]">
                    <select
                      value={parameterCategoryFilter}
                      onChange={(e) => setParameterCategoryFilter(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                    >
                      {uniquePlantCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="relative min-w-[140px]">
                    <select
                      value={parameterUnitFilter}
                      onChange={(e) => setParameterUnitFilter(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                    >
                      {unitsForParameterFilter.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['parameter_name']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['data_type']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['measurement_unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['min_value']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['max_value']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedParams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          {isParameterSearchActive
                            ? 'No parameters found matching your search.'
                            : 'No parameters configured for this unit.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedParams.map((param, index) => (
                        <tr
                          key={param.id}
                          className="hover:bg-slate-50/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#333333]">
                            {param.parameter}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555]">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                param.data_type === ParameterDataType.NUMBER
                                  ? 'bg-[#E95420]/10 text-[#E95420]'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {param.data_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555]">
                            {param.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555] font-mono">
                            {param.data_type === ParameterDataType.NUMBER
                              ? formatNumber(param.min_value)
                              : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555] font-mono">
                            {param.data_type === ParameterDataType.NUMBER
                              ? formatNumber(param.max_value)
                              : '-'}
                          </td>
                          {canWrite && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleOpenEditModal('parameterSetting', param)}
                                  className="p-2 text-[#AEA79F] hover:text-[#E95420] transition-colors duration-200"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    handleOpenDeleteModal(param.id, 'parameterSetting')
                                  }
                                  className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={paramsCurrentPage}
                  totalPages={paramsTotalPages}
                  onPageChange={setParamsCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* Silo Capacity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <Database className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['silo_capacity_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['silo_capacity_subtitle']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenAddModal('siloCapacity')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-xl shadow-sm hover:bg-[#d94612] transition-all duration-200"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t['add_data_button']}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <select
                    value={siloCategoryFilter}
                    onChange={(e) => setSiloCategoryFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="relative min-w-[200px]">
                  <select
                    value={siloUnitFilter}
                    onChange={(e) => setSiloUnitFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {unitsForSiloFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['plant_unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['silo_name']} // Was silo_number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['capacity']} (Ton) // Was max_capacity
                      </th>
                      {canWrite && (
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {siloCapacitiesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading silo capacities...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedSilos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          {t['no_data_available']}
                        </td>
                      </tr>
                    ) : (
                      paginatedSilos.map((silo, _index) => (
                        <tr
                          key={silo.id}
                          className="hover:bg-slate-50/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#333333]">
                            {silo.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#333333]">
                            {silo.silo_name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-[#555555] font-mono">
                            {formatNumber(silo.capacity)}
                          </td>
                          {canWrite && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleOpenEditModal('siloCapacity', silo)}
                                  className="p-2 text-[#AEA79F] hover:text-[#E95420] transition-colors duration-200"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleOpenDeleteModal(silo.id, 'siloCapacity')}
                                  className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={silosCurrentPage}
                  totalPages={silosTotalPages}
                  onPageChange={setSilosCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* COP Parameters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['cop_parameter_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['cop_parameter_subtitle']}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenCopModal}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-xl shadow-sm hover:bg-[#d94612] transition-all duration-200"
                    >
                      <EditIcon className="w-4 h-4" />
                      {t['edit_parameters']}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <select
                    value={copCategoryFilter}
                    onChange={(e) => setCopCategoryFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="relative min-w-[200px]">
                  <select
                    value={copUnitFilter}
                    onChange={(e) => setCopUnitFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {unitsForCopFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['parameter_name']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['measurement_unit']}
                      </th>
                      {canWrite && (
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {copParametersLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading COP parameters...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedCopParams.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          {t['no_data_available']}
                        </td>
                      </tr>
                    ) : (
                      paginatedCopParams.map((param, _index) => (
                        <tr
                          key={param.id}
                          className="hover:bg-slate-50/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {param.parameter}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                            {param.unit}
                          </td>
                          {canWrite && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRemoveCopParameter(param.id)}
                                className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200"
                                title="Remove from COP"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </motion.button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={copCurrentPage}
                  totalPages={copTotalPages}
                  onPageChange={setCopCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* Report Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <FileText className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['report_settings_title'] || 'Report Settings'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t['report_settings_subtitle'] || 'Configure report parameters and ordering'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenAddModal('reportSetting')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-xl shadow-sm hover:bg-[#d94612] transition-all duration-200"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t['add_data_button']}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['order'] || 'Order'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['parameter_name']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['category'] || 'Category'}
                      </th>
                      {canWrite && (
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedReportSettings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          {t['no_data_available']}
                        </td>
                      </tr>
                    ) : (
                      paginatedReportSettings.map((setting, index) => {
                        const param = allParametersMap.get(setting.parameter_id);
                        return (
                          <tr
                            key={setting.id}
                            className="hover:bg-slate-50/50 transition-colors duration-200"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {setting.order + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {param ? param.parameter : setting.parameter_id}
                              {param && (
                                <span className="text-xs text-slate-500 ml-1">({param.unit})</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {setting.category}
                              </span>
                            </td>
                            {canWrite && (
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleOpenEditModal('reportSetting', setting)}
                                    className="p-2 text-[#AEA79F] hover:text-[#E95420] transition-colors duration-200"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleOpenDeleteModal(setting.id, 'reportSetting')
                                    }
                                    className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </motion.button>
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
              <div className="mt-4">
                <Pagination
                  currentPage={reportCurrentPage}
                  totalPages={reportTotalPages}
                  onPageChange={setReportCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* COP Footer Parameters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-[#AEA79F]/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E95420]/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#E95420]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['cop_footer_parameter_title'] || 'COP Footer Parameters'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {t['cop_footer_parameter_subtitle'] ||
                        'Configure parameters shown in COP footer summary'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenCopFooterModal}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#E95420] rounded-xl shadow-sm hover:bg-[#d94612] transition-all duration-200"
                    >
                      <EditIcon className="w-4 h-4" />
                      {t['edit_parameters']}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <select
                    value={copFooterCategoryFilter}
                    onChange={(e) => setCopFooterCategoryFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="relative min-w-[200px]">
                  <select
                    value={copFooterUnitFilter}
                    onChange={(e) => setCopFooterUnitFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 text-sm font-medium text-[#333333] bg-white border border-[#AEA79F]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all"
                  >
                    {unitsForCopFooterFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['parameter_name']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#772953] uppercase tracking-wider">
                        {t['measurement_unit']}
                      </th>
                      {canWrite && (
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {copFooterLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading Footer parameters...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedCopFooterParams.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          {t['no_data_available']}
                        </td>
                      </tr>
                    ) : (
                      paginatedCopFooterParams.map((param, _index) => (
                        <tr
                          key={param.id}
                          className="hover:bg-slate-50/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {param.parameter}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                            {param.unit}
                          </td>
                          {canWrite && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRemoveCopFooterParameter(param.id)}
                                className="p-2 text-[#AEA79F] hover:text-[#C7162B] transition-colors duration-200"
                                title="Remove from Footer"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </motion.button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={copFooterCurrentPage}
                  totalPages={copFooterTotalPages}
                  onPageChange={setCopFooterCurrentPage}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'plantUnit' && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={editingPlantUnit ? t['edit_plant_unit'] : t['add_plant_unit']}
          >
            <PlantUnitForm
              recordToEdit={editingPlantUnit}
              onSave={(record) => handleSave('plantUnit', record)}
              onCancel={handleCloseModals}
              t={t}
            />
          </Modal>
        )}

        {activeModal === 'parameterSetting' && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={editingParameter ? t['edit_parameter'] : t['add_parameter']}
            maxWidth="3xl"
          >
            <ParameterSettingForm
              recordToEdit={editingParameter}
              onSave={(record) => handleSave('parameterSetting', record)}
              onCancel={handleCloseModals}
              t={t}
              plantUnits={plantUnits}
              loading={plantUnitsLoading}
              hideCementSettings={true}
            />
          </Modal>
        )}

        {activeModal === 'siloCapacity' && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={editingSilo ? t['edit_silo_capacity'] : t['add_silo_capacity']}
          >
            <SiloCapacityForm
              recordToEdit={editingSilo}
              onSave={(record) => handleSave('siloCapacity', record)}
              onCancel={handleCloseModals}
              t={t}
              plantUnits={plantUnits}
            />
          </Modal>
        )}

        {activeModal === 'picSetting' && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={editingPic ? t['edit_pic_setting'] : t['add_pic_setting']}
          >
            <PicSettingForm
              recordToEdit={editingPic}
              onSave={(record) => handleSave('picSetting', record)}
              onCancel={handleCloseModals}
              t={t}
            />
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={t['confirm_delete']}
            maxWidth="sm"
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <p className="mb-6 text-center text-slate-600">{t['delete_confirmation_message']}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t['cancel']}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#C7162B] border border-transparent rounded-xl hover:bg-[#9e1122] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C7162B]"
                >
                  {t['delete']}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* COP Parameter Selection Modal */}
        {isCopModalOpen && (
          <Modal
            isOpen={true}
            onClose={handleCloseCopModal}
            title={t['select_cop_parameters']}
            maxWidth="2xl"
          >
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search available parameters..."
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {filteredParameterSettings.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No parameters available in current filter.
                  </p>
                ) : (
                  filteredParameterSettings.map((param) => (
                    <label
                      key={param.id}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                        tempCopSelection.includes(param.id)
                          ? 'bg-[#E95420]/5 border-[#E95420]/30'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={tempCopSelection.includes(param.id)}
                          onChange={() => handleCopSelectionChange(param.id)}
                          className="w-4 h-4 text-[#E95420] border-gray-300 rounded focus:ring-[#E95420]"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="font-medium text-gray-900">{param.parameter}</span>
                        <span className="ml-2 text-gray-500 text-xs">({param.unit})</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCloseCopModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  {t['cancel']}
                </button>
                <button
                  onClick={handleSaveCopSelection}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#E95420] rounded-xl hover:bg-[#d94612]"
                >
                  {t['save_changes']}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'reportSetting' && (
          <Modal
            isOpen={true}
            onClose={handleCloseModals}
            title={
              editingReportSetting
                ? t['edit_report_setting'] || 'Edit Report Setting'
                : t['add_report_setting'] || 'Add Report Setting'
            }
            maxWidth="lg"
          >
            <RkcReportSettingForm
              recordToEdit={editingReportSetting}
              onSave={(record) => handleSave('reportSetting', record)}
              onCancel={handleCloseModals}
              t={t}
              allParameters={parameterSettings}
              existingParameterIds={reportSettings.map((r) => r.parameter_id)}
              maxOrder={reportSettings.length}
            />
          </Modal>
        )}

        {/* COP Export Modal - not strictly needed based on request but keeping AnimatePresence clean */}

        {/* COP Footer Parameter Selection Modal */}
        {isCopFooterModalOpen && (
          <Modal
            isOpen={true}
            onClose={handleCloseCopFooterModal}
            title={t['select_cop_footer_parameters'] || 'Select COP Footer Parameters'}
            maxWidth="2xl"
          >
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search available parameters..."
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {filteredParameterSettings.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No parameters available in current filter.
                  </p>
                ) : (
                  filteredParameterSettings.map((param) => (
                    <label
                      key={param.id}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                        tempCopFooterSelection.includes(param.id)
                          ? 'bg-[#E95420]/5 border-[#E95420]/30'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={tempCopFooterSelection.includes(param.id)}
                          onChange={() => handleCopFooterSelectionChange(param.id)}
                          className="w-4 h-4 text-[#E95420] border-gray-300 rounded focus:ring-[#E95420]"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="font-medium text-gray-900">{param.parameter}</span>
                        <span className="ml-2 text-gray-500 text-xs">({param.unit})</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCloseCopFooterModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  {t['cancel']}
                </button>
                <button
                  onClick={handleSaveCopFooterSelection}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#E95420] rounded-xl hover:bg-[#d94612]"
                >
                  {t['save_changes']}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RkcMasterDataPage;
