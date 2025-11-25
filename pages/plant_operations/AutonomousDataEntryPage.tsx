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
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Import permissions
import { usePermissions } from '../../utils/permissions';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const AutonomousDataEntryPage: React.FC<{ t: any }> = ({ t }) => {
  const { records: plantUnits } = usePlantUnits();

  // Permission checker
  const { currentUser: loggedInUser } = useCurrentUser();
  const permissionChecker = usePermissions(loggedInUser);

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

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

  const statusColors: { [key in DowntimeStatus | RiskStatus]: string } = {
    [DowntimeStatus.OPEN]: 'bg-orange-100 text-orange-800',
    [DowntimeStatus.CLOSE]: 'bg-green-100 text-green-800',
    [RiskStatus.IDENTIFIED]: 'bg-yellow-100 text-yellow-800',
    [RiskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [RiskStatus.RESOLVED]: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-pulse">
            Autonomous Data Entry System
          </h1>
          <p className="text-indigo-700 text-xl font-medium">
            Monitor and manage autonomous operations data with real-time tracking
          </p>
        </div>
        {/* Main Filter Bar */}
        <div className="backdrop-blur-lg bg-gradient-to-r from-white/20 via-blue-50/30 to-purple-50/30 border border-indigo-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-indigo-200/50 transition-shadow duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
              {t.filters}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group">
              <label
                htmlFor="auto-filter-category"
                className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors"
              >
                {t.plant_category_label}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white/60 to-indigo-50/60 backdrop-blur-sm border border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-white/80 hover:to-purple-50/80 text-indigo-800 font-medium appearance-none shadow-sm"
                >
                  {plantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-400"
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

            <div className="group">
              <label
                htmlFor="auto-filter-month"
                className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors"
              >
                {t.filter_by_month}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white/60 to-indigo-50/60 backdrop-blur-sm border border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-white/80 hover:to-purple-50/80 text-indigo-800 font-medium appearance-none shadow-sm"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-400"
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

            <div className="group">
              <label
                htmlFor="auto-filter-year"
                className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors"
              >
                {t.filter_by_year}
              </label>
              <div className="relative">
                <select
                  id="auto-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white/60 to-indigo-50/60 backdrop-blur-sm border border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-white/80 hover:to-purple-50/80 text-indigo-800 font-medium appearance-none shadow-sm"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-400"
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
        </div>
        {/* Downtime Follow-up Section */}
        <div className="backdrop-blur-lg bg-gradient-to-r from-white/20 via-orange-50/30 to-blue-50/30 border border-orange-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-orange-200/50 transition-shadow duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-800 to-red-800 bg-clip-text text-transparent">
                {t.autonomous_downtime_follow_up}
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-orange-200/50 shadow-inner">
            <table className="min-w-full divide-y divide-orange-200/30">
              <thead className="bg-gradient-to-r from-orange-100/50 to-blue-100/50 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.start_time}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.end_time}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.duration}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.unit}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.problem}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.corrective_action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="relative px-4 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-r from-white/30 to-orange-50/30 backdrop-blur-sm divide-y divide-orange-100/20">
                {downtimeDataForMonth.length > 0 ? (
                  downtimeDataForMonth.map((d) => {
                    const { hours, minutes } = calculateDuration(d.start_time, d.end_time);
                    const duration = formatDuration(hours, minutes);
                    return (
                      <tr key={d.id} className="hover:bg-white/40 transition-colors duration-200">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {formatDate(d.date)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-mono">
                          {d.start_time}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-mono">
                          {d.end_time}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          {duration}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                          {d.unit}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 max-w-xs truncate">
                          {d.problem}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 max-w-xs truncate">
                          {d.action || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700 max-w-xs truncate">
                          {d.corrective_action || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              d.status === DowntimeStatus.CLOSE
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-orange-500 text-white'
                            }`}
                          >
                            {d.status || DowntimeStatus.OPEN}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                          <EnhancedButton
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditDowntime(d)}
                            aria-label={`Edit downtime record for ${d.unit}`}
                            className="hover:bg-white/50"
                          >
                            <EditIcon />
                          </EnhancedButton>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-500">
                      {t.no_downtime_for_month}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>{' '}
        {/* Risk Management Section */}
        <div className="backdrop-blur-lg bg-gradient-to-r from-white/20 via-emerald-50/30 to-teal-50/30 border border-emerald-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-200/50 transition-shadow duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                {t.autonomous_risk_management}
              </h2>
            </div>
            <EnhancedButton
              variant="primary"
              size="sm"
              onClick={handleOpenAddRisk}
              aria-label={t.add_risk_button || 'Add new risk'}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {t.add_risk_button}
            </EnhancedButton>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-200/50 shadow-inner">
            <table className="min-w-full divide-y divide-emerald-200/30">
              <thead className="bg-gradient-to-r from-emerald-100/50 to-teal-100/50 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.unit}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.potential_disruption}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.preventive_action}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.mitigation_plan}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="relative px-4 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-r from-white/30 to-emerald-50/30 backdrop-blur-sm divide-y divide-emerald-100/20">
                {filteredRiskRecords.map((risk) => (
                  <tr key={risk.id} className="hover:bg-white/40 transition-colors duration-200">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {formatDate(risk.date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {risk.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 max-w-sm whitespace-pre-wrap">
                      {risk.potential_disruption}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 max-w-sm whitespace-pre-wrap">
                      {risk.preventive_action}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 max-w-sm whitespace-pre-wrap">
                      {risk.mitigation_plan}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          risk.status === RiskStatus.RESOLVED
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : risk.status === RiskStatus.IN_PROGRESS
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        }`}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEditRisk(risk)}
                          aria-label={`Edit risk for ${risk.unit}`}
                          className="hover:bg-white/50"
                        >
                          <EditIcon />
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDeleteRisk(risk.id)}
                          aria-label={`Delete risk for ${risk.unit}`}
                          className="hover:bg-orange-100 text-blue-600"
                        >
                          <TrashIcon />
                        </EnhancedButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRiskRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
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
              className="sm:ml-3"
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


