import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import ArrowPathIcon from '../components/icons/ArrowPathRoundedSquareIcon';
import FunnelIcon from '../components/icons/Bars4Icon';
import MagnifyingGlassIcon from '../components/icons/DocumentMagnifyingGlassIcon';
import PlusIcon from '../components/icons/PlusIcon';
import XMarkIcon from '../components/icons/XMarkIcon'; // Assume exists or use SVG
import TemplateManager from '../features/inspection/components/TemplateManager';
import ShiftReportForm from '../features/inspection/components/ShiftReportForm';
import CheckBadgeIcon from '../components/icons/CheckBadgeIcon';
import { useAuth } from '../hooks/useAuth';
import { useInspectionData } from '../hooks/useInspectionData';
import UnitManager from '../features/inspection/components/UnitManager';
import CogIcon from '../components/icons/CogIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import { useEffect } from 'react';
import { InspectionReport } from '../services/pocketbase';

// Local Interface for UI development
// --- Dynamic Template Interfaces ---
interface CheckPoint {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  checkPoints: CheckPoint[];
}

interface Group {
  id: string;
  name: string;
  equipments: Equipment[];
}

interface DailyReport {
  id: string;
  date: string;
  unit: string;
  areaId?: string;
  status: 'pending' | 'completed' | 'critical';
  data: Record<string, { s1: string; s2: string; s3: string; note: string }>;
  personnel: {
    s1: { tender: string; karu: string };
    s2: { tender: string; karu: string };
    s3: { tender: string; karu: string };
  };
  approvals: {
    s1: boolean;
    s2: boolean;
    s3: boolean;
  };
}

const INITIAL_TEMPLATE: Record<string, Group[]> = {
  'Unit of Clinker Production': [
    {
      id: 'g1',
      name: 'Group alat transport Raw trass ke bin',
      equipments: [
        {
          id: 'e1',
          name: 'Gudang trass',
          checkPoints: [
            { id: 'cp1', name: 'Kondisi gudang trass' },
            { id: 'cp2', name: 'Kondisi atap gudang trass' },
            { id: 'cp3', name: 'Posisi atap gudang yang bocor' },
            { id: 'cp4', name: 'Kelengkapan hydrant' },
          ],
        },
        {
          id: 'e2',
          name: 'Hopper trass',
          checkPoints: [
            { id: 'cp5', name: 'Kondisi dinding hopper' },
            { id: 'cp6', name: 'Kelengkapan hydrant' },
          ],
        },
      ],
    },
  ],
};

// SAMPLE_REPORTS removed - using DB only

const InspectionPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const {
    inspections: reportsFromDb,
    units,
    areas,
    groups,
    equipments,
    checkpoints,
    loading: isLoading,
    refetch: refreshInspections,
    addUnit,
    updateUnit,
    deleteUnit,
    addArea,
    updateArea,
    deleteArea,
    addGroup,
    updateGroup,
    deleteGroup,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
    addInspection,
    updateInspection,
    deleteInspection,
  } = useInspectionData();

  const [activeUnitId, setActiveUnitId] = useState<string>('');
  const [activeSubUnitId, setActiveSubUnitId] = useState<string>('');
  const [activeAreaId, setActiveAreaId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'reports' | 'templates'>('reports');
  const [templates, setTemplates] = useState(INITIAL_TEMPLATE);

  // Map flat InspectionReport from PB to nested DailyReport for UI
  const reports = useMemo(() => {
    return reportsFromDb.map(
      (row) =>
        ({
          id: row.id,
          date: row.date,
          unit: row.unit,
          areaId: row.area,
          status: row.status,
          data: row.data || {},
          personnel: {
            s1: { tender: row.s1_tender || '', karu: row.s1_karu || '' },
            s2: { tender: row.s2_tender || '', karu: row.s2_karu || '' },
            s3: { tender: row.s3_tender || '', karu: row.s3_karu || '' },
          },
          approvals: {
            s1: row.s1_approved,
            s2: row.s2_approved,
            s3: row.s3_approved,
          },
        }) as DailyReport
    );
  }, [reportsFromDb]);

  const isSuperAdmin =
    (currentUser?.role as string) === 'super_admin' ||
    (currentUser?.role as string) === 'Super Admin';
  const [isUnitManagerOpen, setIsUnitManagerOpen] = useState(false);

  // Derive Unit lists from dynamic units data
  const mainUnits = useMemo(() => units.filter((u) => !u.parent_id), [units]);
  const subUnitsOfActive = useMemo(
    () => units.filter((u) => u.parent_id === activeUnitId),
    [units, activeUnitId]
  );

  // Set initial unit if not set
  useEffect(() => {
    if (mainUnits.length > 0 && !activeUnitId) {
      setActiveUnitId(mainUnits[0].id);
    }
  }, [mainUnits, activeUnitId]);

  const activeUnit = useMemo(
    () => mainUnits.find((u) => u.id === activeUnitId)?.name || '',
    [mainUnits, activeUnitId]
  );
  const activeSubUnit = useMemo(
    () => subUnitsOfActive.find((u) => u.id === activeSubUnitId)?.name || null,
    [subUnitsOfActive, activeSubUnitId]
  );

  // Effective unit name for data filtering and saving (Unit or Sub-unit)
  const currentContextName = useMemo(
    () => activeSubUnit || activeUnit,
    [activeUnitId, activeSubUnitId, units]
  );

  // Derive dynamic template for the active context (context-wide or specific area)
  const currentAreaTemplate = useMemo(() => {
    // If we have an activeAreaId (e.g. from the selector), use its specific template
    // Note: Template management happens per-area now
    const targetAreaId = activeAreaId;

    if (!targetAreaId) {
      // If no area selected, we skip dynamic template for now or use static fallback
      return INITIAL_TEMPLATE[currentContextName] || [];
    }

    const dynamicTemplate = groups
      .filter((g) => g.areaId === targetAreaId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((g) => ({
        ...g,
        equipments: equipments
          .filter((e) => e.group === g.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((e) => ({
            ...e,
            checkPoints: checkpoints
              .filter((cp) => cp.equipment === e.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
          })),
      }));

    // Fallback to static if dynamic is empty for this area
    return dynamicTemplate.length > 0
      ? dynamicTemplate
      : INITIAL_TEMPLATE[currentContextName] || [];
  }, [activeAreaId, currentContextName, groups, equipments, checkpoints]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Handlers
  const handleSaveReport = async (newReportData: DailyReport) => {
    const reportDate = new Date(newReportData.date).toISOString().split('T')[0];

    // Find if report already exists for this unit and date in DB records
    const existing = reportsFromDb.find((r) => {
      const rDate = new Date(r.date).toISOString().split('T')[0];
      return r.unit === newReportData.unit && rDate === reportDate;
    });

    // Map UI structure (DailyReport) to PB structure (InspectionReport)
    const pbData = {
      date: newReportData.date,
      unit: newReportData.unit,
      area: newReportData.areaId,
      status: newReportData.status,
      s1_tender: newReportData.personnel.s1.tender,
      s1_karu: newReportData.personnel.s1.karu,
      s1_approved: newReportData.approvals.s1,
      s2_tender: newReportData.personnel.s2.tender,
      s2_karu: newReportData.personnel.s2.karu,
      s2_approved: newReportData.approvals.s2,
      s3_tender: newReportData.personnel.s3.tender,
      s3_karu: newReportData.personnel.s3.karu,
      s3_approved: newReportData.approvals.s3,
      data: newReportData.data,
    };

    try {
      if (existing) {
        // MERGE LOGIC (similar to previous, but operating on flat PB object)
        const updatedPbData = {
          ...existing,
          ...pbData,
          // Special merge for checkpoints data
          data: {
            ...(existing.data || {}),
            ...newReportData.data,
          },
        };
        await updateInspection(existing.id, updatedPbData as any);
      } else {
        await addInspection(pbData as any);
      }
      refreshInspections();
    } catch (err) {
      console.error('Save failed:', err);
    }

    setIsFormOpen(false);
  };

  const handleApproveShift = async (reportId: string, shift: 's1' | 's2' | 's3') => {
    try {
      const fieldName = `${shift}_approved`;
      await updateInspection(reportId, { [fieldName]: true } as any);
      refreshInspections();

      // Update selected report if it's the one being approved
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({
          ...selectedReport,
          approvals: {
            ...selectedReport.approvals,
            [shift]: true,
          },
        });
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // Filter logic for reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDateLabel = new Date(report.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const matchesSearch =
        report.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reportDateLabel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'All Status' || report.status === filterStatus.toLowerCase();
      const matchesUnit = report.unit === currentContextName;
      const matchesArea = !activeAreaId || report.areaId === activeAreaId;

      return matchesSearch && matchesStatus && matchesUnit && matchesArea;
    });
  }, [reports, searchTerm, filterStatus, currentContextName, activeAreaId]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Daily Reports',
        value: filteredReports.length.toString(),
        icon: ClipboardCheckIcon,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        label: 'Critical Findings',
        value: filteredReports.filter((i) => i.status === 'critical').length.toString(),
        icon: ClipboardCheckIcon,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
      },
    ];
  }, [filteredReports]);

  return (
    <div className="min-h-full flex flex-col gap-6 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 shadow-xl shadow-slate-200/5 dark:shadow-none">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Inspection
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {viewMode === 'reports'
                ? 'Manage daily production shift reports.'
                : 'Configure dynamic report templates (Grup > Alat > Point).'}
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => setViewMode(viewMode === 'reports' ? 'templates' : 'reports')}
            className={`group flex items-center gap-2.5 px-6 py-3 border rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm ${
              viewMode === 'templates'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/25'
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            {viewMode === 'reports' ? 'Template Settings' : 'Back to Reports'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsUnitManagerOpen(true)}
              className="group flex items-center gap-2.5 px-6 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <CogIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              Manage Units
            </button>
          )}

          {viewMode === 'reports' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              New Shift Report
            </button>
          )}
        </motion.div>
      </div>

      {/* Unit Selector Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-slate-200/50 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar w-fit max-w-full">
          {mainUnits.map((unit) => (
            <button
              key={unit.id}
              onClick={() => {
                setActiveUnitId(unit.id);
                setActiveSubUnitId(null); // Reset sub-unit when changing main unit
              }}
              className={`px-8 py-3 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap rounded-2xl ${
                activeUnitId === unit.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <span className="relative z-10">{unit.name}</span>
              {activeUnitId === unit.id && (
                <motion.div
                  layoutId="activeUnitTab"
                  className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-500/40 rounded-2xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Sub-Unit Selector Tabs (Dynamic) */}
        {subUnitsOfActive.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 ml-4"
          >
            <div className="flex bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-1 rounded-2xl border border-slate-200/40 dark:border-white/5 shadow-inner overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubUnitId(null)}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all relative rounded-xl whitespace-nowrap ${
                  activeSubUnitId === null
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="relative z-10">Main Overview</span>
                {activeSubUnitId === null && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute inset-0 bg-slate-500 dark:bg-slate-600 rounded-xl shadow-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>

              {subUnitsOfActive.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubUnitId(sub.id)}
                  className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all relative rounded-xl whitespace-nowrap ${
                    activeSubUnitId === sub.id
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="relative z-10">{sub.name}</span>
                  {activeSubUnitId === sub.id && (
                    <motion.div
                      layoutId="activeSubTab"
                      className="absolute inset-0 bg-indigo-500 rounded-xl shadow-md"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Work Area Selector (Optional Filter) */}
        {viewMode === 'reports' &&
          areas.filter((a) => a.unit === (activeSubUnitId || activeUnitId)).length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-2"
            >
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Filter Area:
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setActiveAreaId('')}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                    !activeAreaId
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  SEMUA AREA
                </button>
                {areas
                  .filter((a) => a.unit === (activeSubUnitId || activeUnitId))
                  .map((area) => (
                    <button
                      key={area.id}
                      onClick={() => setActiveAreaId(area.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${
                        activeAreaId === area.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-white/50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {area.name.toUpperCase()}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
      </div>

      {viewMode === 'reports' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className="group p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] shadow-xl shadow-slate-200/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-12 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      {stat.label}
                    </p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </h3>
                  </div>
                  <div
                    className={`p-4 rounded-[1.5rem] ${stat.bg} ${stat.color} shadow-lg transition-transform group-hover:scale-110 duration-300`}
                  >
                    <stat.icon className="w-8 h-8" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reports Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col"
          >
            {/* Toolbar */}
            <div className="p-8 border-b border-slate-200/50 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
              <div className="relative flex-1 max-w-lg">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by inspector or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-inner"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] shadow-inner">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Status
                  </span>
                  <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-sm font-black text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer pr-4"
                  >
                    <option className="bg-white dark:bg-slate-900">All Status</option>
                    <option className="bg-white dark:bg-slate-900">Pending</option>
                    <option className="bg-white dark:bg-slate-900">Completed</option>
                    <option className="bg-white dark:bg-slate-900">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredReports.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10">
                      <th className="px-8 py-5">Report Date</th>
                      <th className="px-8 py-5">Inspector</th>
                      <th className="px-8 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-white/5 text-sm">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="group hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                      >
                        <td className="px-8 py-6">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {new Date(report.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500 flex items-center justify-center font-black text-xs shadow-inner">
                                {report.personnel.s1.tender.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {report.personnel.s1.tender}
                              </span>
                            </div>
                            {report.areaId && (
                              <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400/70 border border-indigo-500/20 w-fit px-2 py-0.5 rounded-md ml-14 bg-indigo-500/5">
                                {areas.find((a) => a.id === report.areaId)?.name || 'Unknown Area'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${
                              report.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : report.status === 'critical'
                                  ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20 shadow-lg'
                                  : 'bg-amber-400 text-slate-900 border-amber-500'
                            }`}
                          >
                            {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="w-8 h-8 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center ml-auto group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm">
                            <MagnifyingGlassIcon className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner animate-pulse">
                    <ClipboardCheckIcon className="w-12 h-12 text-indigo-500/50" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    No Reports Found
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {currentContextName} has no reports yet.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm p-8 flex flex-col"
        >
          <TemplateManager
            groups={currentAreaTemplate as any}
            onAddGroup={() =>
              addGroup({ areaId: activeAreaId, name: 'New Group', sort_order: groups.length + 1 })
            }
            onUpdateGroup={(id, name) => updateGroup(id, { name })}
            onDeleteGroup={deleteGroup}
            onAddEquipment={(groupId) =>
              addEquipment({
                group: groupId,
                name: 'New Equipment',
                sort_order: equipments.length + 1,
              })
            }
            onUpdateEquipment={(id, name) => updateEquipment(id, { name })}
            onDeleteEquipment={deleteEquipment}
            onAddCheckpoint={(equipmentId) =>
              addCheckpoint({
                equipment: equipmentId,
                name: 'New Checkpoint',
                sort_order: checkpoints.length + 1,
              })
            }
            onUpdateCheckpoint={(id, name) => updateCheckpoint(id, { name })}
            onDeleteCheckpoint={deleteCheckpoint}
          />
        </motion.div>
      )}

      {/* Slide-over View (Daily Report Details) */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-7xl bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-2xl shadow-2xl z-[101] flex flex-col border-l border-white/10"
            >
              <div className="p-6 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                    <ClipboardCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Daily Shift Report Details
                    </h3>
                    <p className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      {currentContextName} •{' '}
                      {new Date(selectedReport.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-white/10 shadow-sm group"
                >
                  <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                {/* Table Rendering based on Template (Groups > Equipment > CP) */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 shadow-xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-white/10">
                        <th className="px-6 py-5 w-16 text-center">No.</th>
                        <th className="px-6 py-5 min-w-[250px]">Check Point</th>
                        <th className="px-3 py-5 text-center w-28">Shift 1</th>
                        <th className="px-3 py-5 text-center w-28">Shift 2</th>
                        <th className="px-3 py-5 text-center w-28">Shift 3</th>
                        <th className="px-6 py-5">Abnormalitas Peralatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                      {templates[currentContextName]?.map((group, gIdx) => (
                        <React.Fragment key={group.id}>
                          <tr className="bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
                            <td
                              colSpan={6}
                              className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[11px]"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                {group.name}
                              </div>
                            </td>
                          </tr>
                          {group.equipments.map((eq, eIdx) => (
                            <React.Fragment key={eq.id}>
                              <tr className="bg-slate-50/20 dark:bg-white/2 group/eq">
                                <td className="px-6 py-3.5 text-center font-bold text-slate-400 group-hover/eq:text-indigo-500 transition-colors">
                                  {eIdx + 1}
                                </td>
                                <td
                                  className="px-6 py-3.5 font-extrabold text-slate-800 dark:text-slate-100 group-hover/eq:text-indigo-600 dark:group-hover/eq:text-indigo-400 transition-colors"
                                  colSpan={5}
                                >
                                  {eq.name}
                                </td>
                              </tr>
                              {eq.checkPoints.map((cp) => (
                                <tr
                                  key={cp.id}
                                  className="group/row hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200"
                                >
                                  <td className="px-6 py-2.5"></td>
                                  <td className="px-6 py-2.5 text-slate-600 dark:text-slate-400 pl-10 font-medium group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">
                                    - {cp.name}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s1 || '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s2 || '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s3 || '-'}
                                  </td>
                                  <td
                                    className={`px-6 py-2.5 italic font-medium ${selectedReport.data[cp.id]?.note ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
                                  >
                                    {selectedReport.data[cp.id]?.note || '-'}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Section */}
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-3 gap-8">
                    {[1, 2, 3].map((s) => {
                      const shiftKey = `s${s}` as keyof typeof selectedReport.personnel;
                      const p = selectedReport.personnel[shiftKey];
                      return (
                        <motion.div
                          key={s}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: s * 0.1 }}
                          className="flex flex-col items-center p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 shadow-lg relative overflow-hidden group/card"
                        >
                          <div className="absolute top-0 right-0 p-10 bg-indigo-500/5 rounded-full -mr-8 -mt-8 group-hover/card:bg-indigo-500/10 transition-colors"></div>

                          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-6 tracking-[0.2em] text-center relative z-10">
                            SHIFT {s}
                          </p>

                          <div className="w-full space-y-6">
                            <div className="flex flex-col items-center">
                              <div className="h-0.5 w-full bg-slate-200 dark:bg-white/10 mb-2"></div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white text-center">
                                {p.tender}
                              </p>
                              <p className="text-[9px] text-slate-500 uppercase">Tender</p>
                            </div>

                            <div className="flex flex-col items-center relative w-full">
                              <div className="h-0.5 w-full bg-slate-200 dark:bg-white/10 mb-2"></div>

                              {/* Karu Name & Verification Badge */}
                              <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white text-center">
                                  {p.karu}
                                </p>
                                {selectedReport.approvals[shiftKey] && (
                                  <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>

                              <p className="text-[9px] text-slate-500 uppercase mb-3">Karu Shift</p>

                              {/* Approval Button Logic */}
                              {!selectedReport.approvals[shiftKey] &&
                                p.karu &&
                                (currentUser?.full_name === p.karu ||
                                currentUser?.username === p.karu ? (
                                  <button
                                    onClick={() => handleApproveShift(selectedReport.id, shiftKey)}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 relative z-10 active:scale-95"
                                  >
                                    <CheckBadgeIcon className="w-4 h-4" />
                                    APPROVE SHIFT
                                  </button>
                                ) : (
                                  <div className="w-full py-2.5 bg-slate-100/50 dark:bg-slate-950/50 text-slate-400 text-[10px] font-bold rounded-2xl flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10 tracking-wide relative z-10">
                                    Awaiting Approval
                                  </div>
                                ))}

                              {selectedReport.approvals[shiftKey] && (
                                <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black rounded-2xl flex items-center justify-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative z-10">
                                  <CheckBadgeIcon className="w-4 h-4 animate-bounce" />
                                  VERIFIED
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl font-extrabold transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] tracking-widest text-xs uppercase"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* New Inspection Form Slide-over */}
        {isFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-7xl bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-2xl shadow-2xl z-[101] flex flex-col border-l border-white/10"
            >
              <ShiftReportForm
                unit={currentContextName}
                unitId={activeSubUnitId || activeUnitId}
                areas={areas}
                groups={currentAreaTemplate as any}
                existingReports={reports}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveReport}
              />
            </motion.div>
          </>
        )}
        {/* New Unit Manager Slide-over */}
        {isUnitManagerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnitManagerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-2xl shadow-2xl z-[101] flex flex-col border-l border-white/10"
            >
              <UnitManager
                units={units}
                areas={areas}
                groups={groups}
                equipments={equipments}
                checkpoints={checkpoints}
                onAdd={addUnit}
                onUpdate={updateUnit}
                onDelete={deleteUnit}
                onAddArea={addArea}
                onUpdateArea={updateArea}
                onDeleteArea={deleteArea}
                onAddGroup={addGroup}
                onUpdateGroup={(id, name) => updateGroup(id, { name })}
                onDeleteGroup={deleteGroup}
                onAddEquipment={addEquipment}
                onUpdateEquipment={(id, name) => updateEquipment(id, { name })}
                onDeleteEquipment={deleteEquipment}
                onAddCheckpoint={addCheckpoint}
                onUpdateCheckpoint={(id, name) => updateCheckpoint(id, { name })}
                onDeleteCheckpoint={deleteCheckpoint}
                onClose={() => setIsUnitManagerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspectionPage;
