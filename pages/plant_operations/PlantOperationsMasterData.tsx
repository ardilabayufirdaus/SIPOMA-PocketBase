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
  Tag,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { exportMultipleSheets, importMultipleSheets } from '../../utils/excelUtils';
import { useCopParameters } from '../../hooks/useCopParameters';
import {
  useCopFooterParameters,
  CopFooterParameterConfig,
  CopFooterAggregationType,
} from '../../hooks/useCopFooterParameters';
import Modal from '../../components/Modal';
import { SearchInput } from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import { EnhancedButton } from '../../components/ui/EnhancedComponents';
import { formatNumber } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

// Hooks
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useReportSettings } from '../../hooks/useReportSettings';
import { useSimpleReportSettings } from '../../hooks/useSimpleReportSettings';
import { usePicSettings } from '../../hooks/usePicSettings';
import { useCementTypes } from '../../hooks/useCementTypes';
import { usePlantOperationsAccess } from '../../hooks/usePlantOperationsAccess';

// Types
import {
  PlantUnit,
  ParameterSetting,
  ParameterDataType,
  SiloCapacity,
  ReportSetting,
  SimpleReportSetting,
  PicSetting,
  CementType,
} from '../../types';

type MasterDataRecord =
  | PlantUnit
  | Omit<PlantUnit, 'id'>
  | ParameterSetting
  | Omit<ParameterSetting, 'id'>
  | SiloCapacity
  | Omit<SiloCapacity, 'id'>
  | ReportSetting
  | Omit<ReportSetting, 'id'>
  | SimpleReportSetting
  | Omit<SimpleReportSetting, 'id'>
  | PicSetting
  | Omit<PicSetting, 'id'>
  | CementType
  | Omit<CementType, 'id'>;

// Forms
import PlantUnitForm from './PlantUnitForm';
import ParameterSettingForm from './ParameterSettingForm';
import SiloCapacityForm from './SiloCapacityForm';
import ReportSettingForm from './ReportSettingForm';
import PicSettingForm from './PicSettingForm';
import CementTypeForm from './CementTypeForm';

type ModalType =
  | 'plantUnit'
  | 'parameterSetting'
  | 'siloCapacity'
  | 'reportSetting'
  | 'simpleReportSetting'
  | 'picSetting'
  | 'cementType'
  | null;

type TabType = 'parameters' | 'units_pic' | 'silo' | 'cement_types' | 'cop' | 'reports' | 'all';
type CopSubTab = 'cop_params' | 'cop_footer';
type ReportSubTab = 'standard' | 'simple';

const PlantOperationsMasterData: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { canWrite } = usePlantOperationsAccess('CM');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<TabType>('parameters');
  const [copSubTab, setCopSubTab] = useState<CopSubTab>('cop_params');
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('standard');

  // Plant Units State
  const {
    records: plantUnits,
    addRecord: addPlantUnit,
    updateRecord: updatePlantUnit,
    deleteRecord: deletePlantUnit,
    loading: plantUnitsLoading,
  } = usePlantUnits();
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
  } = useParameterSettings();
  const [editingParameter, setEditingParameter] = useState<ParameterSetting | null>(null);

  // Silo Capacity State
  const {
    records: siloCapacities,
    loading: siloCapacitiesLoading,
    addRecord: addSilo,
    updateRecord: updateSilo,
    deleteRecord: deleteSilo,
  } = useSiloCapacities();
  const [editingSilo, setEditingSilo] = useState<SiloCapacity | null>(null);

  // Report Settings State
  const {
    records: reportSettings,
    addRecord: addReportSetting,
    updateRecord: updateReportSetting,
    deleteRecord: deleteReportSetting,
    updateOrder: updateReportSettingsOrder,
  } = useReportSettings();
  const [editingReportSetting, setEditingReportSetting] = useState<ReportSetting | null>(null);

  // Simple Report Settings State
  const {
    records: simpleReportSettings,
    addRecord: addSimpleReportSetting,
    updateRecord: updateSimpleReportSetting,
    deleteRecord: deleteSimpleReportSetting,
    updateOrder: updateSimpleReportSettingsOrder,
  } = useSimpleReportSettings();
  const [editingSimpleReportSetting, setEditingSimpleReportSetting] =
    useState<SimpleReportSetting | null>(null);

  // PIC Settings State
  const {
    records: picSettings,
    addRecord: addPicSetting,
    updateRecord: updatePicSetting,
    deleteRecord: deletePicSetting,
  } = usePicSettings();
  const [editingPic, setEditingPic] = useState<PicSetting | null>(null);
  const {
    paginatedData: paginatedPicSettings,
    currentPage: picCurrentPage,
    totalPages: picTotalPages,
    setCurrentPage: setPicCurrentPage,
  } = usePagination(picSettings, 10);

  // Cement Types State
  const {
    records: cementTypes,
    loading: cementTypesLoading,
    addRecord: addCementType,
    updateRecord: updateCementType,
    deleteRecord: deleteCementType,
  } = useCementTypes();
  const [editingCementType, setEditingCementType] = useState<CementType | null>(null);
  const {
    paginatedData: paginatedCementTypes,
    currentPage: ctCurrentPage,
    totalPages: ctTotalPages,
    setCurrentPage: setCtCurrentPage,
  } = usePagination(cementTypes, 10);

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    type: ModalType;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      case 'reportSetting': {
        const paramId = reportSettings.find((r) => r.id === deletingRecord.id)?.parameter_id;
        const param = parameterSettings.find((p) => p.id === paramId);
        return param ? `${param.parameter} (${param.unit})` : paramId || 'Unknown Report Setting';
      }
      case 'simpleReportSetting': {
        const paramId = simpleReportSettings.find((r) => r.id === deletingRecord.id)?.parameter_id;
        const param = parameterSettings.find((p) => p.id === paramId);
        return param
          ? `${param.parameter} (${param.unit})`
          : paramId || 'Unknown Simple Report Setting';
      }
      case 'picSetting':
        return picSettings.find((p) => p.id === deletingRecord.id)?.pic || 'Unknown PIC';
      case 'cementType':
        return cementTypes.find((c) => c.id === deletingRecord.id)?.name || 'Unknown Tipe Produk';
      default:
        return 'Unknown Record';
    }
  }, [
    deletingRecord,
    plantUnits,
    parameterSettings,
    siloCapacities,
    reportSettings,
    simpleReportSettings,
    picSettings,
  ]);

  // Filter States
  const [parameterCategoryFilter, setParameterCategoryFilter] = useState('');
  const [parameterUnitFilter, setParameterUnitFilter] = useState('');
  const [parameterSearchQuery, setParameterSearchQuery] = useState('');
  const [siloCategoryFilter, setSiloCategoryFilter] = useState('');
  const [siloUnitFilter, setSiloUnitFilter] = useState('');
  const [copCategoryFilter, setCopCategoryFilter] = useState('');
  const [copUnitFilter, setCopUnitFilter] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('');
  const [reportUnitFilter, setReportUnitFilter] = useState('');
  const [simpleReportCategoryFilter, setSimpleReportCategoryFilter] = useState('');
  const [simpleReportUnitFilter, setSimpleReportUnitFilter] = useState('');
  const [copFooterCategoryFilter, setCopFooterCategoryFilter] = useState('');
  const [copFooterUnitFilter, setCopFooterUnitFilter] = useState('');

  // COP Parameters State
  const allParametersMap = useMemo(
    () => new Map(parameterSettings.map((p) => [p.id, p])),
    [parameterSettings]
  );
  const {
    copParameterIds,
    setCopParameterIds,
    loading: copParametersLoading,
  } = useCopParameters(copCategoryFilter, copUnitFilter);
  const [isCopModalOpen, setIsCopModalOpen] = useState(false);
  const [tempCopSelection, setTempCopSelection] = useState<string[]>([]);

  const copParameters = useMemo(() => {
    if (!copCategoryFilter || !copUnitFilter) return [];
    return copParameterIds
      .map((id) => allParametersMap.get(id))
      .filter((p): p is ParameterSetting => {
        if (!p) return false;
        const categoryMatch = p.category === copCategoryFilter;
        const unitMatch = p.unit === copUnitFilter;
        return categoryMatch && unitMatch;
      });
  }, [copParameterIds, allParametersMap, copCategoryFilter, copUnitFilter]);

  const {
    paginatedData: paginatedCopParams,
    currentPage: copCurrentPage,
    totalPages: copTotalPages,
    setCurrentPage: setCopCurrentPage,
  } = usePagination(copParameters as ParameterSetting[], 10);

  // COP Footer Parameters State
  const {
    copFooterConfigs,
    setCopFooterConfigs,
    loading: copFooterParametersLoading,
    refetch: refetchCopFooterParameters,
  } = useCopFooterParameters(copFooterCategoryFilter, copFooterUnitFilter);
  const [isCopFooterModalOpen, setIsCopFooterModalOpen] = useState(false);
  const [tempCopFooterSelection, setTempCopFooterSelection] = useState<CopFooterParameterConfig[]>(
    []
  );

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
  } = usePagination(
    copFooterParameters as (ParameterSetting & {
      copFooterAggregation?: CopFooterAggregationType;
    })[],
    10
  );

  // Handlers for COP Parameters
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

  // Handlers for COP Footer Parameters
  const handleOpenCopFooterModal = () => {
    setTempCopFooterSelection([...copFooterConfigs]);
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

  // Parameter Search Handlers
  const clearParameterSearch = useCallback(() => {
    setParameterSearchQuery('');
  }, []);

  const isParameterSearchActive = useMemo(
    () => parameterSearchQuery.trim().length > 0,
    [parameterSearchQuery]
  );

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

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
      if (!reportCategoryFilter || !uniquePlantCategories.includes(reportCategoryFilter)) {
        setReportCategoryFilter(uniquePlantCategories[0]);
      }
      if (
        !simpleReportCategoryFilter ||
        !uniquePlantCategories.includes(simpleReportCategoryFilter)
      ) {
        setSimpleReportCategoryFilter(uniquePlantCategories[0]);
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
    reportCategoryFilter,
    simpleReportCategoryFilter,
    copFooterCategoryFilter,
  ]);

  // Keyboard shortcuts for parameter search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector(
          '.parameter-search-input input'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === 'Escape' && parameterSearchQuery) {
        clearParameterSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [parameterSearchQuery, clearParameterSearch]);

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

  const unitsForReportFilter = useMemo(() => {
    if (!reportCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === reportCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, reportCategoryFilter]);

  const unitsForSimpleReportFilter = useMemo(() => {
    if (!simpleReportCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === simpleReportCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, simpleReportCategoryFilter]);

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

  useEffect(() => {
    if (unitsForReportFilter.length > 0) {
      if (!reportUnitFilter || !unitsForReportFilter.includes(reportUnitFilter)) {
        setReportUnitFilter(unitsForReportFilter[0]);
      }
    } else {
      setReportUnitFilter('');
    }
  }, [unitsForReportFilter, reportUnitFilter]);

  useEffect(() => {
    if (unitsForSimpleReportFilter.length > 0) {
      if (!simpleReportUnitFilter || !unitsForSimpleReportFilter.includes(simpleReportUnitFilter)) {
        setSimpleReportUnitFilter(unitsForSimpleReportFilter[0]);
      }
    } else {
      setSimpleReportUnitFilter('');
    }
  }, [unitsForSimpleReportFilter, simpleReportUnitFilter]);

  // Filtered data for tables
  const filteredParameterSettings = useMemo(() => {
    if (!parameterCategoryFilter || !parameterUnitFilter) return [];

    let filtered = parameterSettings.filter((param) => {
      const categoryMatch = param.category === parameterCategoryFilter;
      const unitMatch = param.unit === parameterUnitFilter;
      return categoryMatch && unitMatch;
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

  const filteredReportSettings = useMemo(() => {
    if (!reportCategoryFilter || !reportUnitFilter) return [];
    return reportSettings.filter((setting) => {
      const parameter = allParametersMap.get(setting.parameter_id);
      if (!parameter) return false;
      const categoryMatch = parameter.category === reportCategoryFilter;
      const unitMatch = parameter.unit === reportUnitFilter;
      return categoryMatch && unitMatch;
    });
  }, [reportSettings, reportCategoryFilter, reportUnitFilter, allParametersMap]);

  const filteredSimpleReportSettings = useMemo(() => {
    if (!simpleReportCategoryFilter || !simpleReportUnitFilter) return [];
    return simpleReportSettings.filter((setting) => {
      const parameter = allParametersMap.get(setting.parameter_id);
      if (!parameter) return false;
      const categoryMatch = parameter.category === simpleReportCategoryFilter;
      const unitMatch = parameter.unit === simpleReportUnitFilter;
      return categoryMatch && unitMatch;
    });
  }, [simpleReportSettings, simpleReportCategoryFilter, simpleReportUnitFilter, allParametersMap]);

  const {
    paginatedData: paginatedReportSettings,
    currentPage: rsCurrentPage,
    totalPages: rsTotalPages,
    setCurrentPage: setRsCurrentPage,
  } = usePagination(filteredReportSettings, 10);

  const {
    paginatedData: paginatedSimpleReportSettings,
    currentPage: srsCurrentPage,
    totalPages: srsTotalPages,
    setCurrentPage: setSrsCurrentPage,
  } = usePagination(filteredSimpleReportSettings, 10);

  const maxReportSettingOrder = useMemo(() => {
    return reportSettings.length > 0 ? Math.max(...reportSettings.map((rs) => rs.order)) + 1 : 0;
  }, [reportSettings]);

  const maxSimpleReportSettingOrder = useMemo(() => {
    return simpleReportSettings.length > 0
      ? Math.max(...simpleReportSettings.map((srs) => srs.order)) + 1
      : 0;
  }, [simpleReportSettings]);

  // Drag and drop handlers for Report Settings
  const handleReportSettingsDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(filteredReportSettings);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      updateReportSettingsOrder(items);
    },
    [filteredReportSettings, updateReportSettingsOrder]
  );

  // Drag and drop handlers for Simple Report Settings
  const handleSimpleReportSettingsDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(filteredSimpleReportSettings);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      updateSimpleReportSettingsOrder(items);
    },
    [filteredSimpleReportSettings, updateSimpleReportSettingsOrder]
  );

  // Generic Handlers
  const handleOpenAddModal = (type: ModalType) => {
    if (type === 'plantUnit') setEditingPlantUnit(null);
    if (type === 'parameterSetting') setEditingParameter(null);
    if (type === 'siloCapacity') setEditingSilo(null);
    if (type === 'reportSetting') setEditingReportSetting(null);
    if (type === 'simpleReportSetting') setEditingSimpleReportSetting(null);
    if (type === 'picSetting') setEditingPic(null);
    if (type === 'cementType') setEditingCementType(null);
    setActiveModal(type);
  };

  const handleOpenEditModal = (type: ModalType, record: MasterDataRecord) => {
    if (type === 'plantUnit') setEditingPlantUnit(record as PlantUnit);
    if (type === 'parameterSetting') setEditingParameter(record as ParameterSetting);
    if (type === 'siloCapacity') setEditingSilo(record as SiloCapacity);
    if (type === 'reportSetting') setEditingReportSetting(record as ReportSetting);
    if (type === 'simpleReportSetting')
      setEditingSimpleReportSetting(record as SimpleReportSetting);
    if (type === 'picSetting') setEditingPic(record as PicSetting);
    if (type === 'cementType') setEditingCementType(record as CementType);
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
    setEditingReportSetting(null);
    setEditingSimpleReportSetting(null);
    setEditingPic(null);
    setEditingCementType(null);
    setDeletingRecord(null);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      if (deletingRecord.type === 'plantUnit') deletePlantUnit(deletingRecord.id);
      if (deletingRecord.type === 'parameterSetting') deleteParameter(deletingRecord.id);
      if (deletingRecord.type === 'siloCapacity') deleteSilo(deletingRecord.id);
      if (deletingRecord.type === 'reportSetting') deleteReportSetting(deletingRecord.id);
      if (deletingRecord.type === 'simpleReportSetting')
        deleteSimpleReportSetting(deletingRecord.id);
      if (deletingRecord.type === 'picSetting') deletePicSetting(deletingRecord.id);
      if (deletingRecord.type === 'cementType') deleteCementType(deletingRecord.id);
    }
    handleCloseModals();
  }, [
    deletingRecord,
    deletePlantUnit,
    deleteParameter,
    deleteSilo,
    deleteReportSetting,
    deleteSimpleReportSetting,
    deletePicSetting,
    deleteCementType,
  ]);

  const handleSave = (type: ModalType, record: MasterDataRecord) => {
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
    if (type === 'reportSetting') {
      if ('id' in record) updateReportSetting(record as ReportSetting);
      else addReportSetting(record as ReportSetting);
    }
    if (type === 'simpleReportSetting') {
      if ('id' in record)
        updateSimpleReportSetting(
          (record as SimpleReportSetting).id,
          record as SimpleReportSetting
        );
      else addSimpleReportSetting(record as Omit<SimpleReportSetting, 'id'>);
    }
    if (type === 'picSetting') {
      if ('id' in record) updatePicSetting(record as PicSetting);
      else addPicSetting(record as PicSetting);
    }
    if (type === 'cementType') {
      if ('id' in record) updateCementType((record as CementType).id, record as CementType);
      else addCementType(record as Omit<CementType, 'id'>);
    }
    handleCloseModals();
  };

  const handleExportAll = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const sheets = [];

      if (plantUnits.length > 0) {
        const plantUnitsData = plantUnits.map((unit) => ({
          ID: unit.id,
          Unit: unit.unit,
          Category: unit.category,
          Description: unit.description || '',
        }));
        sheets.push({ name: 'Plant Units', data: plantUnitsData });
      }

      if (parameterSettings.length > 0) {
        const paramData = parameterSettings.map((param) => ({
          ID: param.id,
          Parameter: param.parameter,
          Data_Type: param.data_type,
          Unit: param.unit,
          Category: param.category,
          Min_Value: param.min_value || '',
          Max_Value: param.max_value || '',
          OPC_Min_Value: param.opc_min_value || '',
          OPC_Max_Value: param.opc_max_value || '',
          PCC_Min_Value: param.pcc_min_value || '',
          PCC_Max_Value: param.pcc_max_value || '',
        }));
        sheets.push({ name: 'Parameter Settings', data: paramData });
      }

      if (siloCapacities.length > 0) {
        const siloData = siloCapacities.map((silo) => ({
          ID: silo.id,
          Plant_Category: silo.plant_category,
          Unit: silo.unit,
          Silo_Name: silo.silo_name,
          Capacity: silo.capacity,
          Dead_Stock: silo.dead_stock,
        }));
        sheets.push({ name: 'Silo Capacities', data: siloData });
      }

      if (reportSettings.length > 0) {
        const reportData = reportSettings.map((setting) => ({
          ID: setting.id,
          Parameter_ID: setting.parameter_id,
          Category: setting.category,
        }));
        sheets.push({ name: 'Report Settings', data: reportData });
      }

      if (picSettings.length > 0) {
        const picData = picSettings.map((pic) => ({
          ID: pic.id,
          PIC: pic.pic,
        }));
        sheets.push({ name: 'PIC Settings', data: picData });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `CM_PlantOperations_MasterData_${timestamp}`;
      exportMultipleSheets(sheets, filename);
    } catch (error) {
      alert(
        `An error occurred during export: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportAll = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (isImporting) return;

    try {
      let importCount = 0;
      const errorMessages: string[] = [];
      const { sheets } = await importMultipleSheets(file);

      if (sheets['Plant Units']) {
        try {
          const plantUnitsData = sheets['Plant Units'];
          if (plantUnitsData.length > 0) {
            const requiredFields = ['Unit', 'Category'];
            const invalidRows = plantUnitsData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Plant Units row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              for (const row of plantUnitsData) {
                await addPlantUnit({
                  unit: String(row.Unit),
                  category: String(row.Category),
                  description: row.Description ? String(row.Description) : null,
                });
                importCount++;
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Plant Units import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (sheets['Parameter Settings']) {
        try {
          const paramData = sheets['Parameter Settings'];
          if (paramData.length > 0) {
            for (const row of paramData) {
              const dataType = String(row.Data_Type);
              if (dataType !== 'Number' && dataType !== 'Text') continue;

              await addParameter({
                parameter: String(row.Parameter),
                data_type: dataType as ParameterDataType,
                unit: String(row.Unit),
                category: String(row.Category),
                min_value: row.Min_Value ? Number(row.Min_Value) : null,
                max_value: row.Max_Value ? Number(row.Max_Value) : null,
                opc_min_value: row.OPC_Min_Value ? Number(row.OPC_Min_Value) : null,
                opc_max_value: row.OPC_Max_Value ? Number(row.OPC_Max_Value) : null,
                pcc_min_value: row.PCC_Min_Value ? Number(row.PCC_Min_Value) : null,
                pcc_max_value: row.PCC_Max_Value ? Number(row.PCC_Max_Value) : null,
              });
              importCount++;
            }
          }
        } catch (error) {
          errorMessages.push(
            `Parameter Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (sheets['Silo Capacities']) {
        try {
          const siloData = sheets['Silo Capacities'];
          if (siloData.length > 0) {
            for (const row of siloData) {
              await addSilo({
                plant_category: String(row.Plant_Category),
                unit: String(row.Unit),
                silo_name: String(row.Silo_Name),
                capacity: Number(row.Capacity),
                dead_stock: row.Dead_Stock ? Number(row.Dead_Stock) : 0,
              });
              importCount++;
            }
          }
        } catch (error) {
          errorMessages.push(
            `Silo Capacities import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (sheets['Report Settings']) {
        try {
          const reportData = sheets['Report Settings'];
          if (reportData.length > 0) {
            for (const [index, row] of reportData.entries()) {
              await addReportSetting({
                parameter_id: String(row.Parameter_ID),
                category: String(row.Category),
                order: reportSettings.length + index,
              });
              importCount++;
            }
          }
        } catch (error) {
          errorMessages.push(
            `Report Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (sheets['PIC Settings']) {
        try {
          const picData = sheets['PIC Settings'];
          if (picData.length > 0) {
            for (const row of picData) {
              await addPicSetting({
                pic: String(row.PIC),
              });
              importCount++;
            }
          }
        } catch (error) {
          errorMessages.push(
            `PIC Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (importCount > 0) {
        alert(`Successfully imported ${importCount} records.`);
      }

      if (errorMessages.length > 0) {
        alert(`Import completed with errors:\n${errorMessages.join('\n')}`);
      }
    } catch (error) {
      alert(
        `An error occurred during import: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Tab Definitions
  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'parameters',
      label: t['parameter_settings_title'] || 'Parameter Settings',
      icon: <BarChart3 className="w-4 h-4" />,
      count: parameterSettings.length,
    },
    {
      id: 'units_pic',
      label: 'Unit & PIC',
      icon: <Database className="w-4 h-4" />,
      count: plantUnits.length + picSettings.length,
    },
    {
      id: 'silo',
      label: t['silo_capacity_title'] || 'Kapasitas Silo',
      icon: <Layers className="w-4 h-4" />,
      count: siloCapacities.length,
    },
    {
      id: 'cement_types',
      label: 'Tipe Produk / Semen',
      icon: <Tag className="w-4 h-4" />,
      count: cementTypes.length,
    },
    {
      id: 'cop',
      label: t['cop_parameters_title'] || 'Konfigurasi COP',
      icon: <Settings className="w-4 h-4" />,
      count: copParameterIds.length + copFooterConfigs.length,
    },
    {
      id: 'reports',
      label: t['report_settings_title'] || 'Konfigurasi Laporan',
      icon: <FileText className="w-4 h-4" />,
      count: reportSettings.length + simpleReportSettings.length,
    },
    {
      id: 'all',
      label: 'Semua Modul',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
  ];

  // Helper renderer for clean empty states
  const renderEmptyState = (message: string, onAddClick?: () => void, addLabel?: string) => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-sm">{message}</p>
      {canWrite && onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{addLabel || t['add_data_button'] || 'Tambah Data'}</span>
        </button>
      )}
    </div>
  );

  // Helper renderer for section header
  const renderSectionHeader = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    onAdd?: () => void,
    actionButton?: React.ReactNode
  ) => (
    <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850/40">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 border border-primary-200/50 dark:border-primary-800/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          {icon}
        </div>
        <div className="truncate">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display tracking-tight truncate">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {actionButton}
        {canWrite && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm hover:shadow transition-all focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:outline-none"
            title={t['add_data_button'] || 'Tambah Data'}
            aria-label={t['add_data_button'] || 'Tambah Data'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t['add_data_button'] || 'Tambah Data'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 font-sans">
      {/* Page Top Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-400 shrink-0 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                  CM Plant Operations
                </span>
                <RealtimeIndicator
                  isConnected={true}
                  lastUpdate={new Date()}
                  className="text-xs text-slate-300 font-medium"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                {t['plant_ops_master_data'] || 'Plant Operations Master Data'}
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Pengaturan parameter operasional, kapasitas silo, laporan, dan unit fasilitas
              </p>
            </div>
          </div>

          {/* Quick Actions (Import / Export) */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportAll}
              accept=".xlsx, .xls"
              className="hidden"
              aria-label="Upload File Excel Master Data"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || !canWrite}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 rounded-lg shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              title={t['import_all'] || 'Import Excel'}
              aria-label={t['import_all'] || 'Import Excel'}
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>
                {isImporting ? t['importing'] || 'Importing...' : t['import_all'] || 'Import Excel'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={isExporting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500/50 rounded-lg shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
              title={t['export_all'] || 'Export Excel'}
              aria-label={t['export_all'] || 'Export Excel'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting ? t['exporting'] || 'Exporting...' : t['export_all'] || 'Export Excel'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Chips */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4 mt-4 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              Total Parameter
            </span>
            <span className="text-base font-black text-white font-mono">
              {parameterSettings.length}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              Unit Pabrik
            </span>
            <span className="text-base font-black text-white font-mono">{plantUnits.length}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              Kapasitas Silo
            </span>
            <span className="text-base font-black text-white font-mono">
              {siloCapacities.length}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              Parameter COP
            </span>
            <span className="text-base font-black text-white font-mono">
              {copParameterIds.length + copFooterConfigs.length}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              Konfig Laporan
            </span>
            <span className="text-base font-black text-white font-mono">
              {reportSettings.length + simpleReportSettings.length}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="sticky top-2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:outline-none ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Parameter Settings Card */}
      {(activeTab === 'parameters' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['parameter_settings_title'] || 'Parameter Settings',
            t['parameter_settings_subtitle'] ||
              'Konfigurasi batas ambang dan tipe data parameter operasional',
            <BarChart3 className="w-4 h-4" />,
            () => handleOpenAddModal('parameterSetting')
          )}

          {/* Filter & Search Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              {/* Category Filter */}
              <div className="relative">
                <label htmlFor="param-cat-filter" className="sr-only">
                  Plant Category
                </label>
                <select
                  id="param-cat-filter"
                  value={parameterCategoryFilter}
                  onChange={(e) => {
                    setParameterCategoryFilter(e.target.value);
                    setParameterUnitFilter('');
                  }}
                  className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors cursor-pointer appearance-none"
                >
                  <option value="">{t['all_categories'] || 'Semua Kategori'}</option>
                  {uniquePlantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Unit Filter */}
              <div className="relative">
                <label htmlFor="param-unit-filter" className="sr-only">
                  Plant Unit
                </label>
                <select
                  id="param-unit-filter"
                  value={parameterUnitFilter}
                  onChange={(e) => setParameterUnitFilter(e.target.value)}
                  disabled={!parameterCategoryFilter}
                  className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
                >
                  <option value="">{t['all_units'] || 'Semua Unit'}</option>
                  {unitsForParameterFilter.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Parameter Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64 parameter-search-input">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t['parameter_search_placeholder'] || 'Cari parameter...'}
                  value={parameterSearchQuery}
                  onChange={(e) => setParameterSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
                {isParameterSearchActive && (
                  <button
                    type="button"
                    onClick={clearParameterSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isParameterSearchActive && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  {filteredParameterSettings.length} hasil
                </span>
              )}
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                <tr>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">ID</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">
                    {t['parameter'] || 'Parameter'}
                  </th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Tipe</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Unit</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Kategori</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">Max</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">OPC Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">OPC Max</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">PCC Min</th>
                  <th className="px-3.5 py-2.5 whitespace-nowrap">PCC Max</th>
                  {canWrite && (
                    <th className="px-3.5 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {paginatedParams.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-0">
                      {renderEmptyState(
                        'Tidak ada parameter yang sesuai dengan filter atau pencarian.',
                        () => handleOpenAddModal('parameterSetting'),
                        'Tambah Parameter'
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
          {/* Plant Unit Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            {renderSectionHeader(
              t['plant_unit_title'] || 'Unit Pabrik',
              t['plant_unit_subtitle'] || 'Daftar unit pengukuran dan kategori fasilitas',
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

          {/* PIC Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
            {renderSectionHeader(
              t['pic_setting_title'] || 'PIC Settings',
              t['pic_setting_subtitle'] || 'Daftar person in charge (petugas operasional)',
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

      {/* Tab 3: Silo Capacities Card */}
      {(activeTab === 'silo' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['silo_capacity_title'] || 'Kapasitas Silo',
            t['silo_capacity_subtitle'] || 'Kapasitas penampungan dan dead stock silo material',
            <Layers className="w-4 h-4" />,
            () => handleOpenAddModal('siloCapacity')
          )}

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <div className="relative">
              <label htmlFor="silo-cat-filter" className="sr-only">
                Plant Category
              </label>
              <select
                id="silo-cat-filter"
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
              <label htmlFor="silo-unit-filter" className="sr-only">
                Plant Unit
              </label>
              <select
                id="silo-unit-filter"
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

          {/* Table Area */}
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

      {/* Tab: Cement Types Card */}
      {(activeTab === 'cement_types' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            'Master Tipe Produk / Semen',
            'Manajemen daftar produk semen untuk CCR logsheet dan analisis performa pabrik',
            <Tag className="w-4 h-4" />,
            () => handleOpenAddModal('cementType')
          )}

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 whitespace-nowrap w-12 text-center">#</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Tipe Produk</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Kode</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Deskripsi</th>
                  <th className="px-4 py-2.5 whitespace-nowrap text-center">Urutan</th>
                  <th className="px-4 py-2.5 whitespace-nowrap text-center">Status</th>
                  {canWrite && (
                    <th className="px-4 py-2.5 text-right whitespace-nowrap w-24">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {cementTypesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Memuat data tipe produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : cementTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      {renderEmptyState(
                        'Belum ada tipe produk yang terdaftar.',
                        () => handleOpenAddModal('cementType'),
                        'Tambah Tipe Produk'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedCementTypes.map((item, index) => {
                    const rowNumber = (ctCurrentPage - 1) * 10 + index + 1;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                      >
                        <td className="px-4 py-2 text-center text-slate-500 font-mono text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {item.code || '-'}
                        </td>
                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-2 text-center font-mono text-slate-600 dark:text-slate-400">
                          {item.sort_order ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.is_active !== false
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {item.is_active !== false ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal('cementType', item)}
                                className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                title="Edit Tipe Produk"
                                aria-label="Edit Tipe Produk"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(item.id, 'cementType')}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Hapus Tipe Produk"
                                aria-label="Hapus Tipe Produk"
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
          {cementTypes.length > 10 && (
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
              <Pagination
                currentPage={ctCurrentPage}
                totalPages={ctTotalPages}
                onPageChange={setCtCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 4: COP Configuration */}
      {(activeTab === 'cop' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['cop_parameters_title'] || 'Konfigurasi Parameter COP',
            'Parameter operasional kritis untuk analisis Cost of Production (COP) dan footer kalkulasi',
            <Settings className="w-4 h-4" />,
            undefined,
            <div className="flex items-center gap-1.5">
              <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
                <button
                  type="button"
                  onClick={() => setCopSubTab('cop_params')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    copSubTab === 'cop_params'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  COP Parameters ({copParameterIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCopSubTab('cop_footer')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    copSubTab === 'cop_footer'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  COP Footer ({copFooterConfigs.length})
                </button>
              </div>
              {copSubTab === 'cop_params' && canWrite && (
                <button
                  type="button"
                  onClick={handleOpenCopModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pilih Parameter COP</span>
                </button>
              )}
              {copSubTab === 'cop_footer' && canWrite && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenCopFooterModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pilih Footer Parameter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => refetchCopFooterParameters()}
                    disabled={copFooterParametersLoading}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Segarkan Footer Parameters"
                    aria-label="Segarkan Footer Parameters"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${copFooterParametersLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Row */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {copSubTab === 'cop_params' ? (
              <>
                <div className="relative">
                  <label htmlFor="cop-cat-filter" className="sr-only">
                    Plant Category
                  </label>
                  <select
                    id="cop-cat-filter"
                    value={copCategoryFilter}
                    onChange={(e) => setCopCategoryFilter(e.target.value)}
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
                  <label htmlFor="cop-unit-filter" className="sr-only">
                    Plant Unit
                  </label>
                  <select
                    id="cop-unit-filter"
                    value={copUnitFilter}
                    onChange={(e) => setCopUnitFilter(e.target.value)}
                    disabled={unitsForCopFilter.length === 0}
                    className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
                  >
                    {unitsForCopFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <label htmlFor="cop-footer-cat-filter" className="sr-only">
                    Plant Category
                  </label>
                  <select
                    id="cop-footer-cat-filter"
                    value={copFooterCategoryFilter}
                    onChange={(e) => setCopFooterCategoryFilter(e.target.value)}
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
                  <label htmlFor="cop-footer-unit-filter" className="sr-only">
                    Plant Unit
                  </label>
                  <select
                    id="cop-footer-unit-filter"
                    value={copFooterUnitFilter}
                    onChange={(e) => setCopFooterUnitFilter(e.target.value)}
                    disabled={unitsForCopFooterFilter.length === 0}
                    className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
                  >
                    {unitsForCopFooterFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </>
            )}
          </div>

          {/* Table Area */}
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
                    {canWrite && (
                      <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {copParametersLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memuat parameter COP...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCopParams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-0">
                        {renderEmptyState(
                          'Belum ada parameter COP dipilih untuk filter ini.',
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
                  {copFooterParametersLoading ? (
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
                          'Belum ada footer parameter dipilih untuk filter ini.',
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

      {/* Tab 5: Report Configuration (Standard & Simple) */}
      {(activeTab === 'reports' || activeTab === 'all') && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {renderSectionHeader(
            t['report_settings_title'] || 'Konfigurasi Parameter Laporan',
            'Atur urutan dan parameter yang muncul pada laporan shift harian (Standard & Simple Report)',
            <FileText className="w-4 h-4" />,
            () =>
              handleOpenAddModal(
                reportSubTab === 'standard' ? 'reportSetting' : 'simpleReportSetting'
              ),
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
              <button
                type="button"
                onClick={() => setReportSubTab('standard')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  reportSubTab === 'standard'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Standard Report ({reportSettings.length})
              </button>
              <button
                type="button"
                onClick={() => setReportSubTab('simple')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  reportSubTab === 'simple'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Simple Report ({simpleReportSettings.length})
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              {reportSubTab === 'standard' ? (
                <>
                  <div className="relative">
                    <label htmlFor="report-cat-filter" className="sr-only">
                      Plant Category
                    </label>
                    <select
                      id="report-cat-filter"
                      value={reportCategoryFilter}
                      onChange={(e) => setReportCategoryFilter(e.target.value)}
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
                    <label htmlFor="report-unit-filter" className="sr-only">
                      Plant Unit
                    </label>
                    <select
                      id="report-unit-filter"
                      value={reportUnitFilter}
                      onChange={(e) => setReportUnitFilter(e.target.value)}
                      disabled={unitsForReportFilter.length === 0}
                      className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
                    >
                      {unitsForReportFilter.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <label htmlFor="simple-report-cat-filter" className="sr-only">
                      Plant Category
                    </label>
                    <select
                      id="simple-report-cat-filter"
                      value={simpleReportCategoryFilter}
                      onChange={(e) => setSimpleReportCategoryFilter(e.target.value)}
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
                    <label htmlFor="simple-report-unit-filter" className="sr-only">
                      Plant Unit
                    </label>
                    <select
                      id="simple-report-unit-filter"
                      value={simpleReportUnitFilter}
                      onChange={(e) => setSimpleReportUnitFilter(e.target.value)}
                      disabled={unitsForSimpleReportFilter.length === 0}
                      className="pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed cursor-pointer appearance-none"
                    >
                      {unitsForSimpleReportFilter.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              <span>Geser baris untuk mengatur urutan parameter</span>
            </div>
          </div>

          {/* Reorderable Table */}
          {reportSubTab === 'standard' ? (
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleReportSettingsDragEnd}>
                <table className="min-w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 w-16 text-center">Urutan</th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['parameter'] || 'Parameter'}
                      </th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['plant_category'] || 'Kategori Pabrik'}
                      </th>
                      <th className="px-4 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['category'] || 'Kategori Report'}
                      </th>
                      {canWrite && (
                        <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <Droppable droppableId="report-settings">
                    {(provided) => (
                      <tbody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900"
                      >
                        {paginatedReportSettings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-0">
                              {renderEmptyState(
                                'Belum ada konfigurasi parameter laporan.',
                                () => handleOpenAddModal('reportSetting'),
                                'Tambah Parameter Laporan'
                              )}
                            </td>
                          </tr>
                        ) : (
                          paginatedReportSettings.map((setting, index) => {
                            const parameter = allParametersMap.get(setting.parameter_id);
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
                                      <div className="flex items-center justify-center gap-1 text-slate-400">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="p-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing rounded"
                                          title="Geser urutan"
                                          aria-label="Geser urutan"
                                        >
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                          {setting.order}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                      {parameter?.parameter || 'Unknown Parameter'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {parameter?.category || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {parameter?.unit || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {setting.category}
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
                                            aria-label="Edit Parameter Laporan"
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
                                            aria-label="Hapus Parameter Laporan"
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
              <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
                <Pagination
                  currentPage={rsCurrentPage}
                  totalPages={rsTotalPages}
                  onPageChange={setRsCurrentPage}
                />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleSimpleReportSettingsDragEnd}>
                <table className="min-w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-600 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 w-16 text-center">Urutan</th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['parameter'] || 'Parameter'}
                      </th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['plant_category'] || 'Kategori Pabrik'}
                      </th>
                      <th className="px-4 py-2.5 whitespace-nowrap">{t['unit'] || 'Unit'}</th>
                      <th className="px-4 py-2.5 whitespace-nowrap">
                        {t['category'] || 'Kategori Report'}
                      </th>
                      <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                      {canWrite && (
                        <th className="px-4 py-2.5 text-right whitespace-nowrap w-16">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <Droppable droppableId="simple-report-settings">
                    {(provided) => (
                      <tbody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900"
                      >
                        {paginatedSimpleReportSettings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-0">
                              {renderEmptyState(
                                'Belum ada konfigurasi simple report.',
                                () => handleOpenAddModal('simpleReportSetting'),
                                'Tambah Parameter Simple Report'
                              )}
                            </td>
                          </tr>
                        ) : (
                          paginatedSimpleReportSettings.map((setting, index) => {
                            const parameter = allParametersMap.get(setting.parameter_id);
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
                                      <div className="flex items-center justify-center gap-1 text-slate-400">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="p-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing rounded"
                                          title="Geser urutan"
                                          aria-label="Geser urutan"
                                        >
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                          {setting.order}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                      {parameter?.parameter || 'Unknown Parameter'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {parameter?.category || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {parameter?.unit || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {setting.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                          setting.is_active
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}
                                      >
                                        {setting.is_active ? 'Aktif' : 'Non-aktif'}
                                      </span>
                                    </td>
                                    {canWrite && (
                                      <td className="px-4 py-2 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenEditModal('simpleReportSetting', setting)
                                            }
                                            className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
                                            title="Edit Simple Report Parameter"
                                            aria-label="Edit Simple Report Parameter"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenDeleteModal(
                                                setting.id,
                                                'simpleReportSetting'
                                              )
                                            }
                                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                                            title="Hapus Simple Report Parameter"
                                            aria-label="Hapus Simple Report Parameter"
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
              <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30">
                <Pagination
                  currentPage={srsCurrentPage}
                  totalPages={srsTotalPages}
                  onPageChange={setSrsCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Add / Edit Record Modal */}
      <Modal
        isOpen={activeModal !== null && !isDeleteModalOpen}
        onClose={handleCloseModals}
        title={
          activeModal === 'plantUnit'
            ? editingPlantUnit
              ? t['edit_plant_unit_title'] || 'Edit Unit Pabrik'
              : t['add_plant_unit_title'] || 'Tambah Unit Pabrik'
            : activeModal === 'parameterSetting'
              ? editingParameter
                ? t['edit_parameter_title'] || 'Edit Parameter'
                : t['add_parameter_title'] || 'Tambah Parameter'
              : activeModal === 'siloCapacity'
                ? editingSilo
                  ? t['edit_silo_title'] || 'Edit Kapasitas Silo'
                  : t['add_silo_title'] || 'Tambah Kapasitas Silo'
                : activeModal === 'reportSetting'
                  ? editingReportSetting
                    ? t['edit_report_parameter_title'] || 'Edit Parameter Laporan'
                    : t['add_report_parameter_title'] || 'Tambah Parameter Laporan'
                  : activeModal === 'simpleReportSetting'
                    ? editingSimpleReportSetting
                      ? t['edit_simple_report_parameter_title'] || 'Edit Parameter Simple Report'
                      : t['add_simple_report_parameter_title'] || 'Tambah Parameter Simple Report'
                    : activeModal === 'picSetting'
                      ? editingPic
                        ? t['edit_pic_title'] || 'Edit PIC'
                        : t['add_pic_title'] || 'Tambah PIC'
                      : activeModal === 'cementType'
                        ? editingCementType
                          ? 'Edit Tipe Produk / Semen'
                          : 'Tambah Tipe Produk / Semen'
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
            plantUnits={plantUnits}
            loading={plantUnitsLoading}
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
        {activeModal === 'reportSetting' && (
          <ReportSettingForm
            recordToEdit={editingReportSetting}
            onSave={(r) => handleSave('reportSetting', r)}
            onCancel={handleCloseModals}
            t={t}
            allParameters={parameterSettings}
            existingParameterIds={reportSettings.map((rs) => rs.parameter_id)}
            selectedCategory={reportCategoryFilter}
            selectedUnit={reportUnitFilter}
            maxOrder={maxReportSettingOrder}
          />
        )}
        {activeModal === 'simpleReportSetting' && (
          <ReportSettingForm
            recordToEdit={editingSimpleReportSetting}
            onSave={(r) => handleSave('simpleReportSetting', r)}
            onCancel={handleCloseModals}
            t={t}
            allParameters={parameterSettings}
            existingParameterIds={simpleReportSettings.map((srs) => srs.parameter_id)}
            selectedCategory={simpleReportCategoryFilter}
            selectedUnit={simpleReportUnitFilter}
            maxOrder={maxSimpleReportSettingOrder}
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
        {activeModal === 'cementType' && (
          <CementTypeForm
            recordToEdit={editingCementType}
            onSave={(r, oldName) => {
              if ('id' in r) {
                updateCementType(r.id, r, oldName);
              } else {
                addCementType(r);
              }
              handleCloseModals();
            }}
            onCancel={handleCloseModals}
            t={t}
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
                <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 break-all">
                  {getDeletingRecordName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseModals}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors"
            >
              {t['cancel_button'] || 'Batal'}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t['confirm_delete_button'] || 'Ya, Hapus Data'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* COP Selection Modal */}
      <Modal
        isOpen={isCopModalOpen}
        onClose={handleCloseCopModal}
        title={t['cop_parameters_title'] || 'Konfigurasi Parameter COP'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pilih parameter numerik yang akan dimasukkan ke dalam analisis Cost of Production (COP).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-cop-cat"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Kategori Pabrik <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-cop-cat"
                value={copCategoryFilter}
                onChange={(e) => setCopCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Pilih Kategori...</option>
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="modal-cop-unit"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-cop-unit"
                value={copUnitFilter}
                onChange={(e) => setCopUnitFilter(e.target.value)}
                disabled={unitsForCopFilter.length === 0}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
              >
                <option value="">
                  {unitsForCopFilter.length === 0 ? 'Tidak ada unit' : 'Pilih Unit...'}
                </option>
                {unitsForCopFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist of Available Numerical Parameters */}
          {copCategoryFilter && copUnitFilter && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                Parameter Numerik Tersedia (
                {
                  parameterSettings
                    .filter((p) => p.data_type === ParameterDataType.NUMBER)
                    .filter((p) => p.category === copCategoryFilter && p.unit === copUnitFilter)
                    .length
                }
                )
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {parameterSettings
                  .filter((p) => p.data_type === ParameterDataType.NUMBER)
                  .filter((p) => p.category === copCategoryFilter && p.unit === copUnitFilter)
                  .map((param) => {
                    const isSelected = tempCopSelection.includes(param.id);
                    return (
                      <label
                        key={param.id}
                        className={`flex items-center p-2.5 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-900 dark:text-primary-100'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCopSelectionChange(param.id)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 dark:border-slate-600 focus:ring-primary-500 mr-2.5 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{param.parameter}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {param.category} • {param.unit}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0 ml-1" />}
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseCopModal}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t['cancel_button'] || 'Batal'}
            </button>
            <button
              type="button"
              onClick={handleSaveCopSelection}
              disabled={!copCategoryFilter || !copUnitFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Pilihan COP</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* COP Footer Selection Modal */}
      <Modal
        isOpen={isCopFooterModalOpen}
        onClose={handleCloseCopFooterModal}
        title="Konfigurasi Footer Parameter COP"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pilih parameter dan tipe agregasi perhitungan untuk baris footer tabel COP.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-cop-footer-cat"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Kategori Pabrik <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-cop-footer-cat"
                value={copFooterCategoryFilter}
                onChange={(e) => setCopFooterCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Pilih Kategori...</option>
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="modal-cop-footer-unit"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-cop-footer-unit"
                value={copFooterUnitFilter}
                onChange={(e) => setCopFooterUnitFilter(e.target.value)}
                disabled={unitsForCopFooterFilter.length === 0}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
              >
                <option value="">
                  {unitsForCopFooterFilter.length === 0 ? 'Tidak ada unit' : 'Pilih Unit...'}
                </option>
                {unitsForCopFooterFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List with Aggregation Dropdown */}
          {copFooterCategoryFilter && copFooterUnitFilter && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                Parameter Numerik Tersedia (
                {
                  parameterSettings
                    .filter((p) => p.data_type === ParameterDataType.NUMBER)
                    .filter(
                      (p) =>
                        p.category === copFooterCategoryFilter && p.unit === copFooterUnitFilter
                    ).length
                }
                )
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {parameterSettings
                  .filter((p) => p.data_type === ParameterDataType.NUMBER)
                  .filter(
                    (p) => p.category === copFooterCategoryFilter && p.unit === copFooterUnitFilter
                  )
                  .map((param) => {
                    const selectedItem = tempCopFooterSelection.find(
                      (item) => item.id === param.id
                    );
                    const isSelected = !!selectedItem;
                    const currentAggregation = selectedItem?.aggregation || 'average';
                    return (
                      <div
                        key={param.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-2 transition-colors ${
                          isSelected
                            ? 'bg-primary-50/50 dark:bg-primary-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        <label className="flex items-center space-x-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCopFooterSelectionChange(param.id)}
                            className="w-4 h-4 text-primary-600 rounded border-slate-300 dark:border-slate-600 focus:ring-primary-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {param.parameter}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {param.unit} • {param.category}
                            </div>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              Tipe:
                            </span>
                            <select
                              value={currentAggregation}
                              onChange={(e) =>
                                handleCopFooterAggregationChange(
                                  param.id,
                                  e.target.value as CopFooterAggregationType
                                )
                              }
                              className="text-xs font-semibold py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="average">Rata-rata (Average)</option>
                              <option value="total">Total (Jumlah)</option>
                              <option value="min">Nilai Terendah (Min)</option>
                              <option value="max">Nilai Tertinggi (Max)</option>
                            </select>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseCopFooterModal}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t['cancel_button'] || 'Batal'}
            </button>
            <button
              type="button"
              onClick={handleSaveCopFooterSelection}
              disabled={!copFooterCategoryFilter || !copFooterUnitFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Footer COP</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlantOperationsMasterData;
