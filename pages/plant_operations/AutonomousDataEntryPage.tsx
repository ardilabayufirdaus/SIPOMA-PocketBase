import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  CcrDowntimeData,
  DowntimeStatus,
  AutonomousRiskData,
  RiskStatus,
} from "../../types";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import useCcrDowntimeData from "../../hooks/useCcrDowntimeData";
import { useAutonomousRiskData } from "../../hooks/useAutonomousRiskData";
import {
  formatDate,
  calculateDuration,
  formatDuration,
} from "../../utils/formatters";
import Modal from "../../components/Modal";
import AutonomousDowntimeForm from "./AutonomousDowntimeForm";
import AutonomousRiskForm from "./AutonomousRiskForm";
import PlusIcon from "../../components/icons/PlusIcon";
import EditIcon from "../../components/icons/EditIcon";
import TrashIcon from "../../components/icons/TrashIcon";

const AutonomousDataEntryPage: React.FC<{ t: any }> = ({ t }) => {
  const { records: plantUnits } = usePlantUnits();

  // Downtime State
  const { getAllDowntime, updateDowntime } = useCcrDowntimeData();

  // Risk State
  const {
    records: riskRecords,
    addRecord: addRisk,
    updateRecord: updateRisk,
    deleteRecord: deleteRisk,
  } = useAutonomousRiskData();
  const [isRiskModalOpen, setRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<AutonomousRiskData | null>(
    null
  );
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);

  // Shared Filter State
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isDowntimeModalOpen, setDowntimeModalOpen] = useState(false);
  const [editingDowntime, setEditingDowntime] =
    useState<CcrDowntimeData | null>(null);

  useEffect(() => {
    if (
      plantCategories.length > 0 &&
      !plantCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(plantCategories[0]);
    }
  }, [plantCategories, selectedCategory]);

  const unitToCategoryMap = useMemo(
    () => new Map(plantUnits.map((unit) => [unit.unit, unit.category])),
    [plantUnits]
  );

  const downtimeDataForMonth = useMemo(() => {
    const allData = getAllDowntime();
    return allData
      .filter((d) => {
        const recordDate = new Date(d.date);
        // Timezone correction to prevent off-by-one day errors
        const userTimezoneOffset = recordDate.getTimezoneOffset() * 60000;
        const correctedDate = new Date(
          recordDate.getTime() + userTimezoneOffset
        );
        return (
          correctedDate.getMonth() === filterMonth &&
          correctedDate.getFullYear() === filterYear
        );
      })
      .filter((d) => {
        if (!selectedCategory) return true;
        return unitToCategoryMap.get(d.unit) === selectedCategory;
      });
  }, [
    filterMonth,
    filterYear,
    getAllDowntime,
    selectedCategory,
    unitToCategoryMap,
  ]);

  const filteredRiskRecords = useMemo(() => {
    return riskRecords.filter((risk) => {
      const recordDate = new Date(risk.date);
      // Adjust for timezone offset to prevent day-before issues
      const userTimezoneOffset = recordDate.getTimezoneOffset() * 60000;
      const correctedDate = new Date(recordDate.getTime() + userTimezoneOffset);

      const categoryMatch =
        !selectedCategory ||
        unitToCategoryMap.get(risk.unit) === selectedCategory;
      const monthMatch = correctedDate.getMonth() === filterMonth;
      const yearMatch = correctedDate.getFullYear() === filterYear;
      return categoryMatch && monthMatch && yearMatch;
    });
  }, [
    riskRecords,
    selectedCategory,
    unitToCategoryMap,
    filterMonth,
    filterYear,
  ]);

  // Downtime Handlers
  const handleOpenEditDowntime = (record: CcrDowntimeData) => {
    setEditingDowntime(record);
    setDowntimeModalOpen(true);
  };

  const handleSaveDowntime = (record: CcrDowntimeData) => {
    updateDowntime(record);
    setDowntimeModalOpen(false);
  };

  // Risk Handlers
  const handleOpenAddRisk = () => {
    setEditingRisk(null);
    setRiskModalOpen(true);
  };

  const handleOpenEditRisk = (record: AutonomousRiskData) => {
    setEditingRisk(record);
    setRiskModalOpen(true);
  };

  const handleSaveRisk = (
    record: AutonomousRiskData | Omit<AutonomousRiskData, "id">
  ) => {
    if ("id" in record) {
      updateRisk(record as AutonomousRiskData);
    } else {
      addRisk(record as Omit<AutonomousRiskData, "id">);
    }
    setRiskModalOpen(false);
  };

  const handleOpenDeleteRisk = (id: string) => {
    setDeletingRiskId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteRiskConfirm = () => {
    if (deletingRiskId) {
      deleteRisk(deletingRiskId);
    }
    setDeleteModalOpen(false);
    setDeletingRiskId(null);
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
          ][i]
        }`
      ],
  }));

  const statusColors: { [key in DowntimeStatus | RiskStatus]: string } = {
    [DowntimeStatus.OPEN]: "bg-red-100 text-red-800",
    [DowntimeStatus.CLOSE]: "bg-green-100 text-green-800",
    [RiskStatus.IDENTIFIED]: "bg-yellow-100 text-yellow-800",
    [RiskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
    [RiskStatus.RESOLVED]: "bg-green-100 text-green-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Main Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          {t.filters}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="auto-filter-category"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t.plant_category_label}
            </label>
            <select
              id="auto-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-base bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-lg transition-colors"
            >
              {plantCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="auto-filter-month"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t.filter_by_month}
            </label>
            <select
              id="auto-filter-month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="block w-full pl-3 pr-10 py-3 text-base bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-lg transition-colors"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="auto-filter-year"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t.filter_by_year}
            </label>
            <select
              id="auto-filter-year"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="block w-full pl-3 pr-10 py-3 text-base bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-lg transition-colors"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Downtime Follow-up Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {t.autonomous_downtime_follow_up}
          </h2>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.date}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.start_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.end_time}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.duration}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.problem}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.action}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.corrective_action}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="relative px-4 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {downtimeDataForMonth.length > 0 ? (
                downtimeDataForMonth.map((d) => {
                  const { hours, minutes } = calculateDuration(
                    d.start_time,
                    d.end_time
                  );
                  const duration = formatDuration(hours, minutes);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(d.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {d.start_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {d.end_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                        {duration}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                        {d.unit}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {d.problem}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {d.action || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {d.corrective_action || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[d.status || DowntimeStatus.OPEN]
                          }`}
                        >
                          {d.status || DowntimeStatus.OPEN}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleOpenEditDowntime(d)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <EditIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    {t.no_downtime_for_month}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Management Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {t.autonomous_risk_management}
          </h2>
          <button
            onClick={handleOpenAddRisk}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" /> {t.add_risk_button}
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.date}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.potential_disruption}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.preventive_action}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.risk_mitigation_plan}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="relative px-4 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredRiskRecords.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(risk.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {risk.unit}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 max-w-sm whitespace-pre-wrap">
                    {risk.potential_disruption}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 max-w-sm whitespace-pre-wrap">
                    {risk.preventive_action}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 max-w-sm whitespace-pre-wrap">
                    {risk.mitigation_plan}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[risk.status]
                      }`}
                    >
                      {risk.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditRisk(risk)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteRisk(risk.id)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRiskRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-500 dark:text-slate-400"
                  >
                    No risk data for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDowntimeModalOpen}
        onClose={() => setDowntimeModalOpen(false)}
        title={t.edit_downtime_follow_up_title}
      >
        <AutonomousDowntimeForm
          recordToEdit={editingDowntime}
          onSave={handleSaveDowntime}
          onCancel={() => setDowntimeModalOpen(false)}
          t={t}
        />
      </Modal>

      <Modal
        isOpen={isRiskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        title={editingRisk ? t.edit_risk_title : t.add_risk_title}
      >
        <AutonomousRiskForm
          recordToEdit={editingRisk}
          onSave={handleSaveRisk}
          onCancel={() => setRiskModalOpen(false)}
          t={t}
          plantUnits={plantUnits.map((u) => u.unit)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t.delete_confirmation_title}
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.delete_confirmation_message}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            onClick={handleDeleteRiskConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.confirm_delete_button}
          </button>
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {t.cancel_button}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AutonomousDataEntryPage;
