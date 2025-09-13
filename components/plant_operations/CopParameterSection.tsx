import React, { useState, useMemo, useEffect } from "react";
import { useCopParametersSupabase } from "../../hooks/useCopParametersSupabase";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

// Types
import { ParameterDataType } from "../../types";

interface CopParameterSectionProps {
  t: any;
  plantUnits: any[];
}

const CopParameterSection: React.FC<CopParameterSectionProps> = ({
  t,
  plantUnits,
}) => {
  const { copParameterIds, setCopParameterIds } = useCopParametersSupabase();
  const { records: parameterSettings } = useParameterSettings();

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // Filter States
  const [copCategoryFilter, setCopCategoryFilter] = useState("");
  const [copUnitFilter, setCopUnitFilter] = useState("");

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (uniquePlantCategories.length > 0) {
      if (
        !copCategoryFilter ||
        !uniquePlantCategories.includes(copCategoryFilter)
      ) {
        setCopCategoryFilter(uniquePlantCategories[0]);
      }
    }
  }, [uniquePlantCategories, copCategoryFilter]);

  const unitsForCopFilter = useMemo(() => {
    if (!copCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === copCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, copCategoryFilter]);

  useEffect(() => {
    if (unitsForCopFilter.length > 0) {
      if (!copUnitFilter || !unitsForCopFilter.includes(copUnitFilter)) {
        setCopUnitFilter(unitsForCopFilter[0]);
      }
    } else {
      setCopUnitFilter("");
    }
  }, [unitsForCopFilter, copUnitFilter]);

  const allParametersMap = useMemo(
    () => new Map(parameterSettings.map((p) => [p.id, p])),
    [parameterSettings]
  );

  const copParameters = useMemo(() => {
    if (!copCategoryFilter || !copUnitFilter) return [];
    return copParameterIds
      .map((id) => allParametersMap.get(id))
      .filter((p): p is any => {
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

  // Modal States
  const [isCopModalOpen, setIsCopModalOpen] = useState(false);
  const [tempCopSelection, setTempCopSelection] = useState<string[]>([]);

  // Handlers
  const handleOpenCopModal = () => {
    setTempCopSelection([...copParameterIds]);
    setIsCopModalOpen(true);
  };

  const handleCloseCopModal = () => setIsCopModalOpen(false);

  const handleCopSelectionChange = (paramId: string) => {
    setTempCopSelection((prev) =>
      prev.includes(paramId)
        ? prev.filter((id) => id !== paramId)
        : [...prev, paramId]
    );
  };

  const handleSaveCopSelection = () => {
    setCopParameterIds(tempCopSelection.sort());
    handleCloseCopModal();
  };

  const handleRemoveCopParameter = (paramId: string) => {
    setCopParameterIds(copParameterIds.filter((id) => id !== paramId));
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.cop_parameters_title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="cop-cat-filter" className="sr-only">
                {t.plant_category}
              </label>
              <select
                id="cop-cat-filter"
                value={copCategoryFilter}
                onChange={(e) => setCopCategoryFilter(e.target.value)}
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
              <label htmlFor="cop-unit-filter" className="sr-only">
                {t.unit}
              </label>
              <select
                id="cop-unit-filter"
                value={copUnitFilter}
                onChange={(e) => setCopUnitFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
                disabled={unitsForCopFilter.length === 0}
              >
                {unitsForCopFilter.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <EnhancedButton
              variant="primary"
              size="sm"
              onClick={handleOpenCopModal}
              aria-label={t.add_data_button || "Add COP data"}
            >
              <PlusIcon className="w-5 h-5 mr-2" /> {t.add_data_button}
            </EnhancedButton>
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
                <tr
                  key={param.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700"
                >
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
                    <EnhancedButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemoveCopParameter(param.id)}
                      aria-label={`Remove ${param.parameter} from COP parameters`}
                    >
                      <TrashIcon />
                    </EnhancedButton>
                  </td>
                </tr>
              ))}
              {copParameters.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-slate-500 dark:text-slate-400"
                  >
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

      {/* COP Selection Modal */}
      <Modal
        isOpen={isCopModalOpen}
        onClose={handleCloseCopModal}
        title={t.cop_parameters_title}
      >
        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select the parameters from Parameter Settings to be included in the
            COP (Cost of Production) analysis. Only numerical parameters are
            shown.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="w-full sm:w-48">
              <label htmlFor="modal-cop-filter-category" className="sr-only">
                {t.plant_category}
              </label>
              <select
                id="modal-cop-filter-category"
                value={copCategoryFilter}
                onChange={(e) => setCopCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                {uniquePlantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="modal-cop-filter-unit" className="sr-only">
                {t.unit}
              </label>
              <select
                id="modal-cop-filter-unit"
                value={copUnitFilter}
                onChange={(e) => setCopUnitFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
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
                    {param.parameter}{" "}
                    <span className="text-slate-400 dark:text-slate-500">
                      ({param.category})
                    </span>
                  </span>
                </label>
              ))}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <EnhancedButton
            variant="primary"
            size="sm"
            onClick={handleSaveCopSelection}
            className="sm:ml-3"
            aria-label={t.save_button || "Save COP selection"}
          >
            {t.save_button}
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            size="sm"
            onClick={handleCloseCopModal}
            className="mt-3 sm:mt-0 sm:ml-3"
            aria-label={t.cancel_button || "Cancel COP selection"}
          >
            {t.cancel_button}
          </EnhancedButton>
        </div>
      </Modal>
    </>
  );
};

export default CopParameterSection;
