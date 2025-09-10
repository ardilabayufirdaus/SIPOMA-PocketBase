import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";
import ParameterSettingForm from "../../pages/plant_operations/ParameterSettingForm";
import { SearchInput } from "../../components/ui/Input";

// Types
import { ParameterSetting, ParameterDataType } from "../../types";

interface ParameterSettingSectionProps {
  t: any;
  plantUnits: any[];
  onOpenDeleteModal: (id: string, type: string) => void;
}

const ParameterSettingSection: React.FC<ParameterSettingSectionProps> = ({
  t,
  plantUnits,
  onOpenDeleteModal,
}) => {
  const {
    records: parameterSettings,
    addRecord: addParameter,
    updateRecord: updateParameter,
  } = useParameterSettings();
  const [editingParameter, setEditingParameter] =
    useState<ParameterSetting | null>(null);

  const {
    paginatedData: paginatedParams,
    currentPage: paramsCurrentPage,
    totalPages: paramsTotalPages,
    setCurrentPage: setParamsCurrentPage,
  } = usePagination(parameterSettings, 10);

  // Filter States
  const [parameterCategoryFilter, setParameterCategoryFilter] = useState("");
  const [parameterUnitFilter, setParameterUnitFilter] = useState("");
  const [parameterSearchQuery, setParameterSearchQuery] = useState("");

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (uniquePlantCategories.length > 0) {
      if (
        !parameterCategoryFilter ||
        !uniquePlantCategories.includes(parameterCategoryFilter)
      ) {
        setParameterCategoryFilter(uniquePlantCategories[0]);
      }
    }
  }, [uniquePlantCategories, parameterCategoryFilter]);

  const unitsForParameterFilter = useMemo(() => {
    if (!parameterCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === parameterCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, parameterCategoryFilter]);

  useEffect(() => {
    if (unitsForParameterFilter.length > 0) {
      if (
        !parameterUnitFilter ||
        !unitsForParameterFilter.includes(parameterUnitFilter)
      ) {
        setParameterUnitFilter(unitsForParameterFilter[0]);
      }
    } else {
      setParameterUnitFilter("");
    }
  }, [unitsForParameterFilter, parameterUnitFilter]);

  // Filtered data for table
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
  }, [
    parameterSettings,
    parameterCategoryFilter,
    parameterUnitFilter,
    parameterSearchQuery,
  ]);

  const isParameterSearchActive = useMemo(
    () => parameterSearchQuery.trim().length > 0,
    [parameterSearchQuery]
  );

  // Modal State
  const [activeModal, setActiveModal] = useState(false);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingParameter(null);
    setActiveModal(true);
  };

  const handleOpenEditModal = (record: ParameterSetting) => {
    setEditingParameter(record);
    setActiveModal(true);
  };

  const handleCloseModal = () => {
    setActiveModal(false);
    setEditingParameter(null);
  };

  const handleSave = (record: any) => {
    "id" in record ? updateParameter(record) : addParameter(record);
    handleCloseModal();
  };

  const clearParameterSearch = useCallback(() => {
    setParameterSearchQuery("");
  }, []);

  const handleParameterCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setParameterCategoryFilter(e.target.value);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.parameter_settings_title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="param-cat-filter" className="sr-only">
                {t.plant_category}
              </label>
              <select
                id="param-cat-filter"
                value={parameterCategoryFilter}
                onChange={handleParameterCategoryChange}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="param-unit-filter" className="sr-only">
                {t.unit}
              </label>
              <select
                id="param-unit-filter"
                value={parameterUnitFilter}
                onChange={(e) => setParameterUnitFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
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
              onClick={handleOpenAddModal}
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
                {filteredParameterSettings.length}{" "}
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
                <tr
                  key={param.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700"
                >
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
                    {param.data_type === ParameterDataType.NUMBER
                      ? param.min_value ?? "-"
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {param.data_type === ParameterDataType.NUMBER
                      ? param.max_value ?? "-"
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(param)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() =>
                          onOpenDeleteModal(param.id, "parameterSetting")
                        }
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
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-500 dark:text-slate-400"
                  >
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

      {/* Modal */}
      <Modal
        isOpen={activeModal}
        onClose={handleCloseModal}
        title={
          editingParameter ? t.edit_parameter_title : t.add_parameter_title
        }
      >
        <ParameterSettingForm
          recordToEdit={editingParameter}
          onSave={handleSave}
          onCancel={handleCloseModal}
          t={t}
        />
      </Modal>
    </>
  );
};

export default ParameterSettingSection;
