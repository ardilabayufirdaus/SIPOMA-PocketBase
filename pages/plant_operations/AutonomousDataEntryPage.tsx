import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CcrDowntimeData, DowntimeStatus, AutonomousRiskData, RiskStatus } from '../../types';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useAutonomousRiskData } from '../../hooks/useAutonomousRiskData';
import { formatDate, calculateDuration, formatDuration } from '../../utils/formatters';
import Modal from '../../components/Modal';
import AutonomousDowntimeForm from './AutonomousDowntimeForm';
import AutonomousRiskForm from './AutonomousRiskForm';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

// Import permissions
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const AutonomousDataEntryPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { records: plantUnits } = usePlantUnits();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);

  // Accessibility hooks - initializing context

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
  const [editingRisk, setEditingRisk] = useState<AutonomousRiskData | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);

  // Shared Filter State
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
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

  const [isDowntimeModalOpen, setDowntimeModalOpen] = useState(false);
  const [editingDowntime, setEditingDowntime] = useState<CcrDowntimeData | null>(null);

  useEffect(() => {
    if (plantCategories.length > 0 && !plantCategories.includes(selectedCategory)) {
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
        const correctedDate = new Date(recordDate.getTime() + userTimezoneOffset);
        return (
          correctedDate.getMonth() === filterMonth && correctedDate.getFullYear() === filterYear
        );
      })
      .filter((d) => {
        if (!selectedCategory) return true;
        return unitToCategoryMap.get(d.unit) === selectedCategory;
      });
  }, [filterMonth, filterYear, getAllDowntime, selectedCategory, unitToCategoryMap]);

  const filteredRiskRecords = useMemo(() => {
    return riskRecords.filter((risk) => {
      const recordDate = new Date(risk.date);
      // Adjust for timezone offset to prevent day-before issues
      const userTimezoneOffset = recordDate.getTimezoneOffset() * 60000;
      const correctedDate = new Date(recordDate.getTime() + userTimezoneOffset);

      const categoryMatch =
        !selectedCategory || unitToCategoryMap.get(risk.unit) === selectedCategory;
      const monthMatch = correctedDate.getMonth() === filterMonth;
      const yearMatch = correctedDate.getFullYear() === filterYear;
      return categoryMatch && monthMatch && yearMatch;
    });
  }, [riskRecords, selectedCategory, unitToCategoryMap, filterMonth, filterYear]);

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

  const handleSaveRisk = (record: AutonomousRiskData | Omit<AutonomousRiskData, 'id'>) => {
    if ('id' in record) {
      updateRisk(record as AutonomousRiskData);
    } else {
      addRisk(record as Omit<AutonomousRiskData, 'id'>);
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

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][i]
        }`
      ],
  }));

  const _statusColors: { [key in DowntimeStatus | RiskStatus]: string } = {
    [DowntimeStatus.OPEN]: 'bg-orange-100 text-orange-800',
    [DowntimeStatus.CLOSE]: 'bg-green-100 text-green-800',
    [RiskStatus.IDENTIFIED]: 'bg-yellow-100 text-yellow-800',
    [RiskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [RiskStatus.RESOLVED]: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="w-full space-y-6">
        {/* Header Section - Indigo/Slate Theme */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/20 p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-400/5 rounded-full translate-y-16 -translate-x-16"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <svg
                className="w-7 h-7 text-indigo-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {t.op_autonomous_data_entry || 'Autonomous Data Entry'}
              </h1>
              <p className="text-sm text-indigo-200/80 font-medium mt-0.5">
                {t.autonomous_data_entry_description ||
                  'Monitor and manage autonomous operations data with real-time tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md border border-slate-200/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{t.filters}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plant Category */}
            <div>
              <label
                htmlFor="auto-filter-category"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {t.plant_category_label}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Filter by Month */}
            <div>
              <label
                htmlFor="auto-filter-month"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t.filter_by_month}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Filter by Year */}
            <div>
              <label
                htmlFor="auto-filter-year"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t.filter_by_year}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm font-medium transition-all duration-200 hover:border-slate-300 cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Downtime Follow-up Section */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">{t.autonomous_downtime_follow_up}</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.start_time}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.end_time}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.duration}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.unit}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.problem}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.corrective_action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="relative px-4 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {downtimeDataForMonth.length > 0 ? (
                  downtimeDataForMonth.map((d) => {
                    const { hours, minutes } = calculateDuration(d.start_time, d.end_time);
                    const duration = formatDuration(hours, minutes);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {formatDate(d.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                          {d.start_time}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                          {d.end_time}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-amber-600">
                          {duration}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {d.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                          {d.problem}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                          {d.action || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                          {d.corrective_action || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              d.status === DowntimeStatus.CLOSE
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {d.status || DowntimeStatus.OPEN}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <EnhancedButton
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditDowntime(d)}
                            aria-label={`Edit downtime record for ${d.unit}`}
                            className="hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                          >
                            <EditIcon />
                          </EnhancedButton>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      {t.no_downtime_for_month}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Management Section */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">{t.autonomous_risk_management}</h2>
              </div>
              <EnhancedButton
                variant="primary"
                size="sm"
                onClick={handleOpenAddRisk}
                aria-label={t.add_risk_button || 'Add new risk'}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {t.add_risk_button}
              </EnhancedButton>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.unit}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.potential_disruption}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.preventive_action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.mitigation_plan}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="relative px-4 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredRiskRecords.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {formatDate(risk.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">
                      {risk.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-sm">
                      {risk.potential_disruption}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-sm">
                      {risk.preventive_action}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-sm">
                      {risk.mitigation_plan}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          risk.status === RiskStatus.RESOLVED
                            ? 'bg-emerald-100 text-emerald-700'
                            : risk.status === RiskStatus.IN_PROGRESS
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditRisk(risk)}
                          aria-label={`Edit risk for ${risk.unit}`}
                          className="hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                        >
                          <EditIcon />
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDeleteRisk(risk.id)}
                          aria-label={`Delete risk for ${risk.unit}`}
                          className="hover:bg-red-50 text-slate-500 hover:text-red-600"
                        >
                          <TrashIcon />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRiskRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      {t.no_risks_found}
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
            <p className="text-sm text-slate-600">{t.delete_confirmation_message}</p>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <EnhancedButton
              variant="warning"
              size="sm"
              onClick={handleDeleteRiskConfirm}
              className="sm:ml-3 bg-red-600 hover:bg-red-700"
              rounded="lg"
              elevation="sm"
              aria-label={t.confirm_delete_button || 'Confirm delete'}
            >
              {t.confirm_delete_button}
            </EnhancedButton>
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="mt-3 sm:mt-0 sm:ml-3"
              rounded="lg"
              elevation="sm"
              aria-label={t.cancel_button || 'Cancel delete'}
            >
              {t.cancel_button}
            </EnhancedButton>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AutonomousDataEntryPage;
