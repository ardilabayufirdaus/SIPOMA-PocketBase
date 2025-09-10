import React, { useState, useMemo, useEffect } from "react";
import { useReportSettings } from "../../hooks/useReportSettings";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { usePagination } from "../../hooks/usePagination";
import Modal from "../../components/Modal";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";
import Pagination from "../../components/Pagination";
import ReportSettingForm from "../../pages/plant_operations/ReportSettingForm";

// Types
import { ReportSetting } from "../../types";

interface ReportSettingSectionProps {
  t: any;
  plantUnits: any[];
  onOpenDeleteModal: (id: string, type: string) => void;
}

const ReportSettingSection: React.FC<ReportSettingSectionProps> = ({
  t,
  plantUnits,
  onOpenDeleteModal,
}) => {
  const {
    records: reportSettings,
    addRecord: addReportSetting,
    updateRecord: updateReportSetting,
  } = useReportSettings();
  const { records: parameterSettings } = useParameterSettings();
  const [editingReportSetting, setEditingReportSetting] =
    useState<ReportSetting | null>(null);

  // Filter States
  const [reportCategoryFilter, setReportCategoryFilter] = useState("");
  const [reportUnitFilter, setReportUnitFilter] = useState("");

  // Derived data for filters
  const uniquePlantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (uniquePlantCategories.length > 0) {
      if (
        !reportCategoryFilter ||
        !uniquePlantCategories.includes(reportCategoryFilter)
      ) {
        setReportCategoryFilter(uniquePlantCategories[0]);
      }
    }
  }, [uniquePlantCategories, reportCategoryFilter]);

  const unitsForReportFilter = useMemo(() => {
    if (!reportCategoryFilter) return [];
    return plantUnits
      .filter((unit) => unit.category === reportCategoryFilter)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, reportCategoryFilter]);

  useEffect(() => {
    if (unitsForReportFilter.length > 0) {
      if (
        !reportUnitFilter ||
        !unitsForReportFilter.includes(reportUnitFilter)
      ) {
        setReportUnitFilter(unitsForReportFilter[0]);
      }
    } else {
      setReportUnitFilter("");
    }
  }, [unitsForReportFilter, reportUnitFilter]);

  const allParametersMap = useMemo(
    () => new Map(parameterSettings.map((p) => [p.id, p])),
    [parameterSettings]
  );

  const filteredReportSettings = useMemo(() => {
    if (!reportCategoryFilter || !reportUnitFilter) return [];
    return reportSettings.filter((setting) => {
      const parameter = allParametersMap.get(setting.parameter_id);
      if (!parameter) return false;

      const categoryMatch = parameter.category === reportCategoryFilter;
      const unitMatch = parameter.unit === reportUnitFilter;
      return categoryMatch && unitMatch;
    });
  }, [
    reportSettings,
    reportCategoryFilter,
    reportUnitFilter,
    allParametersMap,
  ]);

  const {
    paginatedData: paginatedReportSettings,
    currentPage: rsCurrentPage,
    totalPages: rsTotalPages,
    setCurrentPage: setRsCurrentPage,
  } = usePagination(filteredReportSettings, 10);

  // Modal State
  const [activeModal, setActiveModal] = useState(false);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingReportSetting(null);
    setActiveModal(true);
  };

  const handleOpenEditModal = (record: ReportSetting) => {
    setEditingReportSetting(record);
    setActiveModal(true);
  };

  const handleCloseModal = () => {
    setActiveModal(false);
    setEditingReportSetting(null);
  };

  const handleSave = (record: any) => {
    "id" in record ? updateReportSetting(record) : addReportSetting(record);
    handleCloseModal();
  };

  const handleReportCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setReportCategoryFilter(e.target.value);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.report_settings_title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="report-cat-filter" className="sr-only">
                {t.plant_category}
              </label>
              <select
                id="report-cat-filter"
                value={reportCategoryFilter}
                onChange={handleReportCategoryChange}
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
              <label htmlFor="report-unit-filter" className="sr-only">
                {t.unit}
              </label>
              <select
                id="report-unit-filter"
                value={reportUnitFilter}
                onChange={(e) => setReportUnitFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
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
              onClick={handleOpenAddModal}
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
                  <tr
                    key={setting.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {parameter?.parameter || "Unknown Parameter"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {parameter?.category || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {parameter?.unit || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {setting.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(setting)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() =>
                            onOpenDeleteModal(setting.id, "reportSetting")
                          }
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

      {/* Modal */}
      <Modal
        isOpen={activeModal}
        onClose={handleCloseModal}
        title={
          editingReportSetting
            ? t.edit_report_parameter_title
            : t.add_report_parameter_title
        }
      >
        <ReportSettingForm
          recordToEdit={editingReportSetting}
          onSave={handleSave}
          onCancel={handleCloseModal}
          t={t}
          allParameters={parameterSettings}
          existingParameterIds={reportSettings.map((rs) => rs.parameter_id)}
          selectedCategory={reportCategoryFilter}
          selectedUnit={reportUnitFilter}
        />
      </Modal>
    </>
  );
};

export default ReportSettingSection;
