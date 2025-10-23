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
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { exportMultipleSheets, importMultipleSheets } from '../../utils/excelUtils';
import { useCopParameters } from '../../hooks/useCopParameters';
import Modal from '../../components/Modal';
import { SearchInput } from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RealtimeIndicator from '../../components/ui/RealtimeIndicator';
import { EnhancedButton } from '../../components/ui/EnhancedComponents';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import DocumentArrowDownIcon from '../../components/icons/DocumentArrowDownIcon';
import DocumentArrowUpIcon from '../../components/icons/DocumentArrowUpIcon';
import { formatNumber } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

// Hooks
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import { useReportSettings } from '../../hooks/useReportSettings';
import { usePicSettings } from '../../hooks/usePicSettings';

// Types
import {
  PlantUnit,
  ParameterSetting,
  ParameterDataType,
  SiloCapacity,
  ReportSetting,
  PicSetting,
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
  | PicSetting
  | Omit<PicSetting, 'id'>;

// Forms
import PlantUnitForm from './PlantUnitForm';
import ParameterSettingForm from './ParameterSettingForm';
import SiloCapacityForm from './SiloCapacityForm';
import ReportSettingForm from './ReportSettingForm';
import PicSettingForm from './PicSettingForm';

type ModalType =
  | 'plantUnit'
  | 'parameterSetting'
  | 'siloCapacity'
  | 'reportSetting'
  | 'picSetting'
  | null;

const PlantOperationsMasterData: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      case 'reportSetting':
        return (
          reportSettings.find((r) => r.id === deletingRecord.id)?.parameter_id ||
          'Unknown Report Setting'
        );
      case 'picSetting':
        return picSettings.find((p) => p.id === deletingRecord.id)?.pic || 'Unknown PIC';
      default:
        return 'Unknown Record';
    }
  }, [deletingRecord, plantUnits, parameterSettings, siloCapacities, reportSettings, picSettings]);

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
    // Filter COP Parameters by selected category and unit
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
    }
  }, [
    uniquePlantCategories,
    parameterCategoryFilter,
    siloCategoryFilter,
    copCategoryFilter,
    reportCategoryFilter,
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

  const unitsForReportFilter = useMemo(() => {
    if (!reportCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === reportCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, reportCategoryFilter]);

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
    if (unitsForReportFilter.length > 0) {
      if (!reportUnitFilter || !unitsForReportFilter.includes(reportUnitFilter)) {
        setReportUnitFilter(unitsForReportFilter[0]);
      }
    } else {
      setReportUnitFilter('');
    }
  }, [unitsForReportFilter, reportUnitFilter]);

  const handleReportCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReportCategoryFilter(e.target.value);
  };

  const handleParameterCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameterCategoryFilter(e.target.value);
    // Reset unit filter when category changes
    setParameterUnitFilter('');
  };

  const handleParameterUnitFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameterUnitFilter(e.target.value);
  };

  // Filtered data for tables
  const filteredParameterSettings = useMemo(() => {
    if (!parameterCategoryFilter || !parameterUnitFilter) return [];

    let filtered = parameterSettings.filter((param) => {
      // Direct check for unit and category fields
      const categoryMatch = param.category === parameterCategoryFilter;
      const unitMatch = param.unit === parameterUnitFilter;
      return categoryMatch && unitMatch;
    });

    // Apply search filter if search query exists
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
      // Get the parameter associated with this report setting
      const parameter = allParametersMap.get(setting.parameter_id);
      if (!parameter) return false;

      // Filter by parameter's category and unit
      const categoryMatch = parameter.category === reportCategoryFilter;
      const unitMatch = parameter.unit === reportUnitFilter;
      return categoryMatch && unitMatch;
    });
  }, [reportSettings, reportCategoryFilter, reportUnitFilter, allParametersMap]);

  const {
    paginatedData: paginatedReportSettings,
    currentPage: rsCurrentPage,
    totalPages: rsTotalPages,
    setCurrentPage: setRsCurrentPage,
  } = usePagination(filteredReportSettings, 10);

  const maxReportSettingOrder = useMemo(() => {
    return reportSettings.length > 0 ? Math.max(...reportSettings.map((rs) => rs.order)) + 1 : 0;
  }, [reportSettings]);

  // Drag and drop handlers for Report Settings
  const handleReportSettingsDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(filteredReportSettings);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update order in database
      updateReportSettingsOrder(items);
    },
    [filteredReportSettings, updateReportSettingsOrder]
  );

  // Generic Handlers
  const handleOpenAddModal = (type: ModalType) => {
    if (type === 'plantUnit') setEditingPlantUnit(null);
    if (type === 'parameterSetting') setEditingParameter(null);
    if (type === 'siloCapacity') setEditingSilo(null);
    if (type === 'reportSetting') setEditingReportSetting(null);
    if (type === 'picSetting') setEditingPic(null);
    setActiveModal(type);
  };

  const handleOpenEditModal = (type: ModalType, record: MasterDataRecord) => {
    if (type === 'plantUnit') setEditingPlantUnit(record as PlantUnit);
    if (type === 'parameterSetting') setEditingParameter(record as ParameterSetting);
    if (type === 'siloCapacity') setEditingSilo(record as SiloCapacity);
    if (type === 'reportSetting') setEditingReportSetting(record as ReportSetting);
    if (type === 'picSetting') setEditingPic(record as PicSetting);
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
    setEditingPic(null);
    setDeletingRecord(null);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      if (deletingRecord.type === 'plantUnit') deletePlantUnit(deletingRecord.id);
      if (deletingRecord.type === 'parameterSetting') deleteParameter(deletingRecord.id);
      if (deletingRecord.type === 'siloCapacity') deleteSilo(deletingRecord.id);
      if (deletingRecord.type === 'reportSetting') deleteReportSetting(deletingRecord.id);
      if (deletingRecord.type === 'picSetting') deletePicSetting(deletingRecord.id);
    }
    handleCloseModals();
  }, [
    deletingRecord,
    deletePlantUnit,
    deleteParameter,
    deleteSilo,
    deleteReportSetting,
    deletePicSetting,
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
    if (type === 'picSetting') {
      if ('id' in record) updatePicSetting(record as PicSetting);
      else addPicSetting(record as PicSetting);
    }
    handleCloseModals();
  };

  const handleExportAll = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const sheets = [];

      // Export Plant Units
      if (plantUnits.length > 0) {
        const plantUnitsData = plantUnits.map((unit) => ({
          ID: unit.id,
          Unit: unit.unit,
          Category: unit.category,
          Description: unit.description || '',
        }));
        sheets.push({ name: 'Plant Units', data: plantUnitsData });
      }

      // Export Parameter Settings
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

      // Export Silo Capacities
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

      // Export Report Settings
      if (reportSettings.length > 0) {
        const reportData = reportSettings.map((setting) => ({
          ID: setting.id,
          Parameter_ID: setting.parameter_id,
          Category: setting.category,
        }));
        sheets.push({ name: 'Report Settings', data: reportData });
      }

      // Export PIC Settings
      if (picSettings.length > 0) {
        const picData = picSettings.map((pic) => ({
          ID: pic.id,
          PIC: pic.pic,
        }));
        sheets.push({ name: 'PIC Settings', data: picData });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `PlantOperations_MasterData_${timestamp}`;

      // Export using utility
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

      // Import Plant Units
      if (sheets['Plant Units']) {
        try {
          const plantUnitsData = sheets['Plant Units'];
          if (plantUnitsData.length > 0) {
            // Validate data structure
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
              // Process valid data
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

      // Import Parameter Settings
      if (sheets['Parameter Settings']) {
        try {
          const paramData = sheets['Parameter Settings'];
          if (paramData.length > 0) {
            const requiredFields = ['Parameter', 'Data_Type', 'Unit', 'Category'];
            const invalidRows = paramData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Parameter Settings row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              for (const row of paramData) {
                const dataType = String(row.Data_Type);
                // Validate data type
                if (dataType !== 'Number' && dataType !== 'Text') {
                  errorMessages.push(
                    `Parameter Settings: Invalid data type "${dataType}". Must be "Number" or "Text"`
                  );
                  continue;
                }

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
          }
        } catch (error) {
          errorMessages.push(
            `Parameter Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Silo Capacities
      if (sheets['Silo Capacities']) {
        try {
          const siloData = sheets['Silo Capacities'];
          if (siloData.length > 0) {
            const requiredFields = ['Plant_Category', 'Unit', 'Silo_Name', 'Capacity'];
            const invalidRows = siloData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Silo Capacities row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
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
          }
        } catch (error) {
          errorMessages.push(
            `Silo Capacities import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import Report Settings
      if (sheets['Report Settings']) {
        try {
          const reportData = sheets['Report Settings'];
          if (reportData.length > 0) {
            const requiredFields = ['Parameter_ID', 'Category'];
            const invalidRows = reportData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `Report Settings row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              for (const [index, row] of reportData.entries()) {
                await addReportSetting({
                  parameter_id: String(row.Parameter_ID),
                  category: String(row.Category),
                  order: reportSettings.length + index,
                });
                importCount++;
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `Report Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Import PIC Settings
      if (sheets['PIC Settings']) {
        try {
          const picData = sheets['PIC Settings'];
          if (picData.length > 0) {
            const requiredFields = ['PIC'];
            const invalidRows = picData.filter((row, index) => {
              const missingFields = requiredFields.filter((field) => !row[field]);
              if (missingFields.length > 0) {
                errorMessages.push(
                  `PIC Settings row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`
                );
                return true;
              }
              return false;
            });

            if (invalidRows.length === 0) {
              for (const row of picData) {
                await addPicSetting({
                  pic: String(row.PIC),
                });
                importCount++;
              }
            }
          }
        } catch (error) {
          errorMessages.push(
            `PIC Settings import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Show results
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
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Database className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{t['op_master_data']}</h1>
                <p className="text-slate-600 mt-1">
                  Manage plant operations master data and configurations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RealtimeIndicator isConnected={true} lastUpdate={new Date()} className="text-sm" />
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
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <DocumentArrowUpIcon className="w-5 h-5" />
                  {isImporting ? t['importing'] || 'Importing...' : t['import_all']}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportAll}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['plant_unit_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['plant_unit_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenAddModal('plantUnit')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['plant_category']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {plantUnitsLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading plant units...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedPlantUnits.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          No plant units found
                        </td>
                      </tr>
                    ) : (
                      paginatedPlantUnits.map((unit, _index) => (
                        <tr
                          key={unit.id}
                          className="hover:bg-slate-50/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {unit.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                            {unit.category}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleOpenEditModal('plantUnit', unit)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleOpenDeleteModal(unit.id, 'plantUnit')}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
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
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['pic_setting_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['pic_setting_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenAddModal('picSetting')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['pic']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedPicSettings.map((pic, _index) => (
                      <tr
                        key={pic.id}
                        className="hover:bg-slate-50/50 transition-colors duration-200"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {pic.pic}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenEditModal('picSetting', pic)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                            >
                              <EditIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenDeleteModal(pic.id, 'picSetting')}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
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

          {/* Parameter Settings Card - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-1 xl:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['parameter_settings_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['parameter_settings_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenAddModal('parameterSetting')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>

            {/* Parameter Filters and Search */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="param-cat-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Plant Category:
                    </label>
                    <div className="relative">
                      <select
                        id="param-cat-filter"
                        value={parameterCategoryFilter}
                        onChange={handleParameterCategoryFilterChange}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors appearance-none"
                      >
                        <option value="">{t['all_categories'] || 'All Categories'}</option>
                        {uniquePlantCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="param-unit-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Unit:
                    </label>
                    <div className="relative">
                      <select
                        id="param-unit-filter"
                        value={parameterUnitFilter}
                        onChange={handleParameterUnitFilterChange}
                        disabled={!parameterCategoryFilter}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm transition-colors appearance-none"
                      >
                        <option value="">{t['all_units'] || 'All Units'}</option>
                        {unitsForParameterFilter.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Search:</span>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="parameter-search-input">
                    <SearchInput
                      placeholder={t['parameter_search_placeholder']}
                      value={parameterSearchQuery}
                      onChange={(e) => setParameterSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {isParameterSearchActive && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600">
                      {filteredParameterSettings.length}{' '}
                      {filteredParameterSettings.length === 1
                        ? t['parameter_search_results']
                        : t['parameter_search_results_plural']}
                    </div>
                    <button
                      onClick={clearParameterSearch}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      {t['parameter_clear_search']}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['parameter_id']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['parameter']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['data_type']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['unit']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['category']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['min_value']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['max_value']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['opc_min']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['opc_max']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['pcc_min']}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t['pcc_max']}
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">{t['actions']}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedParams.map((param) => (
                    <tr key={param.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                        {param.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {param.parameter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.max_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.opc_min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.opc_max_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.pcc_min_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {param.data_type === ParameterDataType.NUMBER
                          ? (param.pcc_max_value ?? '-')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal('parameterSetting', param)}
                            className="p-2 text-slate-400 hover:text-red-600"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(param.id, 'parameterSetting')}
                            className="p-2 text-slate-400 hover:text-red-600"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredParameterSettings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        No parameters match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={paramsCurrentPage}
              totalPages={paramsTotalPages}
              onPageChange={setParamsCurrentPage}
            />
          </motion.div>

          {/* Silo Capacities Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Database className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['silo_capacity_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['silo_capacity_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenAddModal('siloCapacity')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="silo-cat-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Plant Category:
                    </label>
                    <div className="relative">
                      <select
                        id="silo-cat-filter"
                        value={siloCategoryFilter}
                        onChange={(e) => setSiloCategoryFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors appearance-none"
                      >
                        {uniquePlantCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="silo-unit-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Unit:
                    </label>
                    <div className="relative">
                      <select
                        id="silo-unit-filter"
                        value={siloUnitFilter}
                        onChange={(e) => setSiloUnitFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm transition-colors appearance-none"
                        disabled={unitsForSiloFilter.length === 0}
                      >
                        {unitsForSiloFilter.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['plant_category']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['silo_name']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['capacity']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['dead_stock']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['silo_lifestock']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {siloCapacitiesLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading silo capacities...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredSiloCapacities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No silo capacities match the selected filters
                        </td>
                      </tr>
                    ) : (
                      paginatedSilos.map((silo, _index) => {
                        const lifestock = silo.capacity - silo.dead_stock;
                        return (
                          <tr
                            key={silo.id}
                            className="hover:bg-slate-50/50 transition-colors duration-200"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {silo.plant_category}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {silo.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {silo.silo_name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {formatNumber(silo.capacity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {formatNumber(silo.dead_stock)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold">
                              {formatNumber(lifestock)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleOpenEditModal('siloCapacity', silo)}
                                  className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleOpenDeleteModal(silo.id, 'siloCapacity')}
                                  className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['cop_parameters_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['cop_parameters_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenCopModal}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="cop-cat-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Plant Category:
                    </label>
                    <div className="relative">
                      <select
                        id="cop-cat-filter"
                        value={copCategoryFilter}
                        onChange={(e) => setCopCategoryFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors appearance-none"
                      >
                        {uniquePlantCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="cop-unit-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Unit:
                    </label>
                    <div className="relative">
                      <select
                        id="cop-unit-filter"
                        value={copUnitFilter}
                        onChange={(e) => setCopUnitFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm transition-colors appearance-none"
                        disabled={unitsForCopFilter.length === 0}
                      >
                        {unitsForCopFilter.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['parameter']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['unit']}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {t['category']}
                      </th>
                      <th className="relative px-4 py-3 w-20">
                        <span className="sr-only">{t['actions']}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {copParametersLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-slate-500">Loading COP parameters...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedCopParams.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No COP parameters selected for the current filters
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                            {param.category}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveCopParameter(param.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
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
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t['report_settings_title']}
                    </h3>
                    <p className="text-sm text-slate-600">{t['report_settings_subtitle']}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenAddModal('reportSetting')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t['add_data_button']}
                </motion.button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="report-cat-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Plant Category:
                    </label>
                    <div className="relative">
                      <select
                        id="report-cat-filter"
                        value={reportCategoryFilter}
                        onChange={handleReportCategoryChange}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors appearance-none"
                      >
                        {uniquePlantCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="report-unit-filter"
                      className="text-sm font-medium text-slate-600 whitespace-nowrap"
                    >
                      Unit:
                    </label>
                    <div className="relative">
                      <select
                        id="report-unit-filter"
                        value={reportUnitFilter}
                        onChange={(e) => setReportUnitFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm transition-colors appearance-none"
                        disabled={unitsForReportFilter.length === 0}
                      >
                        {unitsForReportFilter.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <GripVertical className="w-4 h-4" />
                  <span>Drag rows to reorder report parameters</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <DragDropContext onDragEnd={handleReportSettingsDragEnd}>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t['order'] || 'Order'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t['parameter']}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t['plant_category']}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t['unit']}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t['category']}
                        </th>
                        <th className="relative px-4 py-3 w-20">
                          <span className="sr-only">{t['actions']}</span>
                        </th>
                      </tr>
                    </thead>
                    <Droppable droppableId="report-settings">
                      {(provided) => (
                        <tbody
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="bg-white divide-y divide-slate-200"
                        >
                          {paginatedReportSettings.map((setting, index) => {
                            const parameter = allParametersMap.get(setting.parameter_id);
                            return (
                              <Draggable key={setting.id} draggableId={setting.id} index={index}>
                                {(provided, snapshot) => (
                                  <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`hover:bg-slate-50/50 transition-colors duration-200 ${
                                      snapshot.isDragging ? 'bg-slate-100 shadow-lg' : ''
                                    }`}
                                  >
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                                      <div className="flex items-center gap-2">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing"
                                        >
                                          <GripVertical className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <span className="font-medium">{setting.order}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                      {parameter?.parameter || 'Unknown Parameter'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {parameter?.category || '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {parameter?.unit || '-'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {setting.category}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex items-center justify-end space-x-1">
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() =>
                                            handleOpenEditModal('reportSetting', setting)
                                          }
                                          className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                        >
                                          <EditIcon className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() =>
                                            handleOpenDeleteModal(setting.id, 'reportSetting')
                                          }
                                          className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </motion.button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </tbody>
                      )}
                    </Droppable>
                  </table>
                </DragDropContext>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={rsCurrentPage}
                  totalPages={rsTotalPages}
                  onPageChange={setRsCurrentPage}
                />
              </div>
            </div>
          </motion.div>

          {/* Modals */}
          <Modal
            isOpen={activeModal !== null && !isDeleteModalOpen}
            onClose={handleCloseModals}
            title={
              activeModal === 'plantUnit'
                ? editingPlantUnit
                  ? t['edit_plant_unit_title']
                  : t['add_plant_unit_title']
                : activeModal === 'parameterSetting'
                  ? editingParameter
                    ? t['edit_parameter_title']
                    : t['add_parameter_title']
                  : activeModal === 'siloCapacity'
                    ? editingSilo
                      ? t['edit_silo_title']
                      : t['add_silo_title']
                    : activeModal === 'reportSetting'
                      ? editingReportSetting
                        ? t['edit_report_parameter_title']
                        : t['add_report_parameter_title']
                      : activeModal === 'picSetting'
                        ? editingPic
                          ? t['edit_pic_title']
                          : t['add_pic_title']
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
            {activeModal === 'picSetting' && (
              <PicSettingForm
                recordToEdit={editingPic}
                onSave={(r) => handleSave('picSetting', r)}
                onCancel={handleCloseModals}
                t={t}
              />
            )}
          </Modal>
        </div>

        <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg overflow-hidden shadow-xl"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                  className="flex-shrink-0"
                >
                  <TrashIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {t['delete_confirmation_title'] || 'Confirm Deletion'}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </motion.div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="px-6 py-6"
            >
              <div className="flex items-start space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                  className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
                >
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Delete Record</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {t['delete_confirmation_message'] ||
                      'Are you sure you want to delete this record? This action cannot be undone.'}
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Record Details:</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 font-mono">{getDeletingRecordName}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <EnhancedButton
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModals}
                  className="w-full sm:w-auto px-6 py-2"
                >
                  {t['cancel_button'] || 'Cancel'}
                </EnhancedButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <EnhancedButton
                  type="button"
                  variant="error"
                  onClick={handleDeleteConfirm}
                  className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {t['confirm_delete_button'] || 'Delete'}
                </EnhancedButton>
              </motion.div>
            </motion.div>
          </motion.div>
        </Modal>

        {/* COP Selection Modal */}
        <Modal isOpen={isCopModalOpen} onClose={handleCloseCopModal} title="">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg overflow-hidden"
          >
            {/* Header with title */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-white" />
                <h2 className="text-xl font-semibold text-white">
                  {t['cop_parameters_title'] || 'COP Parameters'}
                </h2>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                {t['cop_parameters_subtitle'] || 'Critical operating parameters selection'}
              </p>
            </motion.div>

            <div className="p-6">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              >
                <div className="flex items-start space-x-3">
                  <Filter className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">Parameter Selection</h3>
                    <p className="text-sm text-blue-700">
                      Select the parameters from Parameter Settings to be included in the COP (Cost
                      of Production) analysis. Only numerical parameters are shown.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <label
                    htmlFor="modal-cop-filter-category"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Plant Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    id="modal-cop-filter-category"
                    value={copCategoryFilter}
                    onChange={(e) => setCopCategoryFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                  >
                    <option value="">Select category...</option>
                    {uniquePlantCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </motion.select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <label
                    htmlFor="modal-cop-filter-unit"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Unit
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    id="modal-cop-filter-unit"
                    value={copUnitFilter}
                    onChange={(e) => setCopUnitFilter(e.target.value)}
                    disabled={unitsForCopFilter.length === 0}
                    className="block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">
                      {unitsForCopFilter.length === 0 ? 'No units available' : 'Select unit...'}
                    </option>
                    {unitsForCopFilter.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </motion.select>
                </motion.div>
              </motion.div>

              {/* Parameters Grid */}
              <AnimatePresence>
                {copCategoryFilter && copUnitFilter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <h4 className="text-sm font-medium text-slate-700 mb-4">
                        Available Parameters (
                        {
                          parameterSettings
                            .filter((p) => p.data_type === ParameterDataType.NUMBER)
                            .filter((p) => {
                              if (!copCategoryFilter || !copUnitFilter) return false;
                              const categoryMatch = p.category === copCategoryFilter;
                              const unitMatch = p.unit === copUnitFilter;
                              return categoryMatch && unitMatch;
                            }).length
                        }
                        )
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {parameterSettings
                          .filter((p) => p.data_type === ParameterDataType.NUMBER)
                          .filter((p) => {
                            if (!copCategoryFilter || !copUnitFilter) return false;
                            const categoryMatch = p.category === copCategoryFilter;
                            const unitMatch = p.unit === copUnitFilter;
                            return categoryMatch && unitMatch;
                          })
                          .map((param, index) => (
                            <motion.label
                              key={param.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                tempCopSelection.includes(param.id)
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <motion.input
                                type="checkbox"
                                checked={tempCopSelection.includes(param.id)}
                                onChange={() => handleCopSelectionChange(param.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              />
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {param.parameter}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {param.category} • {param.unit}
                                </div>
                              </div>
                              {tempCopSelection.includes(param.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-2 h-5 w-5 text-blue-600"
                                >
                                  ✓
                                </motion.div>
                              )}
                            </motion.label>
                          ))}
                      </div>

                      {parameterSettings
                        .filter((p) => p.data_type === ParameterDataType.NUMBER)
                        .filter((p) => {
                          if (!copCategoryFilter || !copUnitFilter) return false;
                          const categoryMatch = p.category === copCategoryFilter;
                          const unitMatch = p.unit === copUnitFilter;
                          return categoryMatch && unitMatch;
                        }).length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-slate-500"
                        >
                          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm">
                            No numerical parameters found for the selected category and unit.
                          </p>
                          <p className="text-xs mt-1">
                            Please configure parameters in Master Data first.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 px-6 pb-6"
            >
              <div className="flex space-x-3">
                <EnhancedButton
                  type="button"
                  variant="secondary"
                  onClick={handleCloseCopModal}
                  className="px-6 py-2"
                >
                  {t['cancel_button']}
                </EnhancedButton>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <EnhancedButton
                    type="button"
                    variant="primary"
                    onClick={handleSaveCopSelection}
                    disabled={!copCategoryFilter || !copUnitFilter}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Save Selection
                  </EnhancedButton>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </Modal>
      </div>
    </div>
  );
};

export default PlantOperationsMasterData;
