import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCopParametersSupabase } from '../../hooks/useCopParametersSupabase';
import Modal from '../../components/Modal';
import { SearchInput } from '../../components/ui/Input';
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

const PlantOperationsMasterData: React.FC<{ t: any }> = ({ t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant Units State
  const {
    records: plantUnits,
    addRecord: addPlantUnit,
    updateRecord: updatePlantUnit,
    deleteRecord: deletePlantUnit,
    setAllRecords: setAllPlantUnits,
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
    setAllRecords: setAllParameterSettings,
  } = useParameterSettings();
  const [editingParameter, setEditingParameter] = useState<ParameterSetting | null>(null);

  // Silo Capacity State
  const {
    records: siloCapacities,
    addRecord: addSilo,
    updateRecord: updateSilo,
    deleteRecord: deleteSilo,
    setAllRecords: setAllSiloCapacities,
  } = useSiloCapacities();
  const [editingSilo, setEditingSilo] = useState<SiloCapacity | null>(null);

  // Report Settings State
  const {
    records: reportSettings,
    addRecord: addReportSetting,
    updateRecord: updateReportSetting,
    deleteRecord: deleteReportSetting,
    setAllRecords: setAllReportSettings,
  } = useReportSettings();
  const [editingReportSetting, setEditingReportSetting] = useState<ReportSetting | null>(null);

  // PIC Settings State
  const {
    records: picSettings,
    addRecord: addPicSetting,
    updateRecord: updatePicSetting,
    deleteRecord: deletePicSetting,
    setAllRecords: setAllPicSettings,
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
  const { copParameterIds, setCopParameterIds, loading } = useCopParametersSupabase();
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
  } = usePagination(copParameters, 10);

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

  const handleParameterCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameterCategoryFilter(e.target.value);
  };

  const handleReportCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReportCategoryFilter(e.target.value);
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

  // Generic Handlers
  const handleOpenAddModal = (type: ModalType) => {
    if (type === 'plantUnit') setEditingPlantUnit(null);
    if (type === 'parameterSetting') setEditingParameter(null);
    if (type === 'siloCapacity') setEditingSilo(null);
    if (type === 'reportSetting') setEditingReportSetting(null);
    if (type === 'picSetting') setEditingPic(null);
    setActiveModal(type);
  };

  const handleOpenEditModal = (type: ModalType, record: any) => {
    if (type === 'plantUnit') setEditingPlantUnit(record);
    if (type === 'parameterSetting') setEditingParameter(record);
    if (type === 'siloCapacity') setEditingSilo(record);
    if (type === 'reportSetting') setEditingReportSetting(record);
    if (type === 'picSetting') setEditingPic(record);
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

  const handleSave = (type: ModalType, record: any) => {
    if (type === 'plantUnit') 'id' in record ? updatePlantUnit(record) : addPlantUnit(record);
    if (type === 'parameterSetting')
      'id' in record ? updateParameter(record) : addParameter(record);
    if (type === 'siloCapacity') 'id' in record ? updateSilo(record) : addSilo(record);
    if (type === 'reportSetting')
      'id' in record ? updateReportSetting(record) : addReportSetting(record);
    if (type === 'picSetting') 'id' in record ? updatePicSetting(record) : addPicSetting(record);
    handleCloseModals();
  };

  const handleExportAll = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Placeholder: Export functionality temporarily disabled due to security update
      alert('Export functionality is temporarily disabled. Please use alternative export method.');
    } catch (error) {
      console.error('Failed to export master data:', error);
      alert(
        `An error occurred during export: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder: Import functionality temporarily disabled due to security update
    alert('Import functionality is temporarily disabled. Please use alternative import method.');
  };

  // Removed incomplete import implementation code that was causing syntax errors

  const handleDelete = (type: ModalType, id: string) => {
    if (type === 'plantUnit') deletePlantUnit(id);
    if (type === 'parameterSetting') deleteParameter(id);
    if (type === 'siloCapacity') deleteSilo(id);
    if (type === 'reportSetting') deleteReportSetting(id);
    if (type === 'picSetting') deletePicSetting(id);
    handleCloseModals();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
            {t.op_master_data}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportAll}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              {isImporting ? t.importing || 'Importing...' : t.import_all}
            </button>
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isExporting ? t.exporting || 'Exporting...' : t.export_all}
            </button>
          </div>
        </div>
      </div>

      {/* Plant Unit Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.plant_unit_title}
          </h2>
          <button
            onClick={() => handleOpenAddModal('plantUnit')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
          >
            <PlusIcon className="w-5 h-5" /> {t.add_data_button}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.plant_category}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedPlantUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {unit.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {unit.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal('plantUnit', unit)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(unit.id, 'plantUnit')}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={puCurrentPage}
          totalPages={puTotalPages}
          onPageChange={setPuCurrentPage}
        />
      </div>

      {/* PIC Settings Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.pic_setting_title}
          </h2>
          <button
            onClick={() => handleOpenAddModal('picSetting')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
          >
            <PlusIcon className="w-5 h-5" /> {t.add_data_button}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.pic}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedPicSettings.map((pic) => (
                <tr key={pic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {pic.pic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal('picSetting', pic)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(pic.id, 'picSetting')}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={picCurrentPage}
          totalPages={picTotalPages}
          onPageChange={setPicCurrentPage}
        />
      </div>

      {/* Parameter Settings Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.parameter_settings_title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="param-cat-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="param-cat-filter"
                value={parameterCategoryFilter}
                onChange={handleParameterCategoryChange}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="param-unit-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="param-unit-filter"
                value={parameterUnitFilter}
                onChange={(e) => setParameterUnitFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForParameterFilter.length === 0}
              >
                {unitsForParameterFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => handleOpenAddModal('parameterSetting')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> {t.add_data_button}
            </button>
          </div>
        </div>

        {/* Parameter Search */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="parameter-search-input">
              <SearchInput
                placeholder={t.parameter_search_placeholder}
                value={parameterSearchQuery}
                onChange={(e) => setParameterSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {isParameterSearchActive && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {filteredParameterSettings.length}{' '}
                {filteredParameterSettings.length === 1
                  ? t.parameter_search_results
                  : t.parameter_search_results_plural}
              </div>
              <button
                onClick={clearParameterSearch}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
              >
                {t.parameter_clear_search}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.parameter_id}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.parameter}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.data_type}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.min_value}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.max_value}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedParams.map((param) => (
                <tr key={param.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">
                    {param.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {param.parameter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.data_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.data_type === ParameterDataType.NUMBER ? (param.min_value ?? '-') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.data_type === ParameterDataType.NUMBER ? (param.max_value ?? '-') : '-'}
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
                  <td colSpan={8} className="text-center py-10 text-slate-500 dark:text-slate-400">
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
      </div>

      {/* Silo Capacity Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.silo_capacity_title}
          </h2>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="silo-cat-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="silo-cat-filter"
                value={siloCategoryFilter}
                onChange={(e) => setSiloCategoryFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="silo-unit-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="silo-unit-filter"
                value={siloUnitFilter}
                onChange={(e) => setSiloUnitFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForSiloFilter.length === 0}
              >
                {unitsForSiloFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => handleOpenAddModal('siloCapacity')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> {t.add_data_button}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.plant_category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.silo_name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.capacity}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.dead_stock}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.silo_lifestock}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedSilos.map((silo) => {
                const lifestock = silo.capacity - silo.dead_stock;
                return (
                  <tr key={silo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {silo.plant_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {silo.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {silo.silo_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(silo.capacity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatNumber(silo.dead_stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 font-semibold">
                      {formatNumber(lifestock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal('siloCapacity', silo)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(silo.id, 'siloCapacity')}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSiloCapacities.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No silo capacities match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={silosCurrentPage}
          totalPages={silosTotalPages}
          onPageChange={setSilosCurrentPage}
        />
      </div>

      {/* COP Parameters Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.cop_parameters_title}
          </h2>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-cat-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="cop-cat-filter"
                value={copCategoryFilter}
                onChange={(e) => setCopCategoryFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="cop-unit-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="cop-unit-filter"
                value={copUnitFilter}
                onChange={(e) => setCopUnitFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForCopFilter.length === 0}
              >
                {unitsForCopFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpenCopModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> {t.add_data_button}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.parameter}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.category}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedCopParams.map((param) => (
                <tr key={param.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {param.parameter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveCopParameter(param.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {copParameters.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    No COP parameters selected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={copCurrentPage}
          totalPages={copTotalPages}
          onPageChange={setCopCurrentPage}
        />
      </div>

      {/* Report Settings Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.report_settings_title}
          </h2>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="report-cat-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="report-cat-filter"
                value={reportCategoryFilter}
                onChange={handleReportCategoryChange}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="report-unit-filter"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="report-unit-filter"
                value={reportUnitFilter}
                onChange={(e) => setReportUnitFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForReportFilter.length === 0}
              >
                {unitsForReportFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => handleOpenAddModal('reportSetting')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> {t.add_data_button}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.parameter}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.plant_category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.category}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedReportSettings.map((setting) => {
                const parameter = allParametersMap.get(setting.parameter_id);
                return (
                  <tr key={setting.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {parameter?.parameter || 'Unknown Parameter'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {parameter?.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {parameter?.unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {setting.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal('reportSetting', setting)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(setting.id, 'reportSetting')}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={rsCurrentPage}
          totalPages={rsTotalPages}
          onPageChange={setRsCurrentPage}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal !== null && !isDeleteModalOpen}
        onClose={handleCloseModals}
        title={
          activeModal === 'plantUnit'
            ? editingPlantUnit
              ? t.edit_plant_unit_title
              : t.add_plant_unit_title
            : activeModal === 'parameterSetting'
              ? editingParameter
                ? t.edit_parameter_title
                : t.add_parameter_title
              : activeModal === 'siloCapacity'
                ? editingSilo
                  ? t.edit_silo_title
                  : t.add_silo_title
                : activeModal === 'reportSetting'
                  ? editingReportSetting
                    ? t.edit_report_parameter_title
                    : t.add_report_parameter_title
                  : activeModal === 'picSetting'
                    ? editingPic
                      ? t.edit_pic_title
                      : t.add_pic_title
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.delete_confirmation_message}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleDeleteConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_delete_button}
          </button>
          <button
            onClick={handleCloseModals}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>

      {/* COP Selection Modal */}
      <Modal isOpen={isCopModalOpen} onClose={handleCloseCopModal} title={t.cop_parameters_title}>
        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select the parameters from Parameter Settings to be included in the COP (Cost of
            Production) analysis. Only numerical parameters are shown.
          </p>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4 min-w-0 mt-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="modal-cop-filter-category"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Plant Category:
              </label>
              <select
                id="modal-cop-filter-category"
                value={copCategoryFilter}
                onChange={(e) => setCopCategoryFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium transition-colors"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label
                htmlFor="modal-cop-filter-unit"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-fit"
              >
                Unit:
              </label>
              <select
                id="modal-cop-filter-unit"
                value={copUnitFilter}
                onChange={(e) => setCopUnitFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={unitsForCopFilter.length === 0}
              >
                {unitsForCopFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parameterSettings
              .filter((p) => p.data_type === ParameterDataType.NUMBER)
              .filter((p) => {
                if (!copCategoryFilter || !copUnitFilter) return false;
                const categoryMatch = p.category === copCategoryFilter;
                const unitMatch = p.unit === copUnitFilter;
                return categoryMatch && unitMatch;
              })
              .map((param) => (
                <label
                  key={param.id}
                  className="flex items-center p-3 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={tempCopSelection.includes(param.id)}
                    onChange={() => handleCopSelectionChange(param.id)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-600 rounded"
                  />
                  <span className="ml-3 text-sm text-slate-700 dark:text-slate-300 select-none">
                    {param.parameter}{' '}
                    <span className="text-slate-400 dark:text-slate-500">({param.category})</span>
                  </span>
                </label>
              ))}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleSaveCopSelection}
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.save_button}
          </button>
          <button
            type="button"
            onClick={handleCloseCopModal}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PlantOperationsMasterData;
