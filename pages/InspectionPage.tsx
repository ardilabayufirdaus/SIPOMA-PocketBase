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
  unitId?: string;
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
      unit: newReportData.unitId, // Use ID relation, not Name
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
      const matchesUnit =
        report.unit === activeSubUnitId || (!activeSubUnitId && report.unit === activeUnitId);
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
    <div className="min-h-full flex flex-col gap-6 relative font-ubuntu">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-soft">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-ubuntu-orange to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/30">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-ubuntu-coolGrey dark:text-white tracking-tight"
            >
              Inspection
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-ubuntu-warmGrey dark:text-slate-400 mt-1 font-medium flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange"></span>
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
          className="flex items-center gap-3"
        >
          <button
            onClick={() => setViewMode(viewMode === 'reports' ? 'templates' : 'reports')}
            className={`group flex items-center gap-2.5 px-5 py-2.5 border rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
              viewMode === 'templates'
                ? 'bg-ubuntu-warmGrey text-white border-transparent'
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-ubuntu-coolGrey dark:text-slate-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            {viewMode === 'reports' ? 'Template Settings' : 'Back to Reports'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsUnitManagerOpen(true)}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-ubuntu-coolGrey dark:text-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <CogIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              Manage Units
            </button>
          )}

          {viewMode === 'reports' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-ubuntu-orange hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              New Shift Report
            </button>
          )}
        </motion.div>
      </div>

      {/* Unit Selector Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar w-fit max-w-full">
          {mainUnits.map((unit) => (
            <button
              key={unit.id}
              onClick={() => {
                setActiveUnitId(unit.id);
                setActiveSubUnitId(null); // Reset sub-unit when changing main unit
              }}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap rounded-xl ${
                activeUnitId === unit.id
                  ? 'text-white'
                  : 'text-ubuntu-coolGrey hover:text-ubuntu-orange dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="relative z-10">{unit.name}</span>
              {activeUnitId === unit.id && (
                <motion.div
                  layoutId="activeUnitTab"
                  className="absolute inset-0 bg-ubuntu-aubergine dark:bg-ubuntu-orange shadow-md rounded-xl"
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
            className="flex items-center gap-3 ml-2"
          >
            <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubUnitId(null)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all relative rounded-lg whitespace-nowrap ${
                  activeSubUnitId === null
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span className="relative z-10">Main Overview</span>
                {activeSubUnitId === null && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute inset-0 bg-ubuntu-warmGrey dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>

              {subUnitsOfActive.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubUnitId(sub.id)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all relative rounded-lg whitespace-nowrap ${
                    activeSubUnitId === sub.id
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="relative z-10">{sub.name}</span>
                  {activeSubUnitId === sub.id && (
                    <motion.div
                      layoutId="activeSubTab"
                      className="absolute inset-0 bg-ubuntu-warmGrey dark:bg-slate-700 rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Work Area Selector (Optional Filter) */}
        {areas.filter((a) => a.unit === (activeSubUnitId || activeUnitId)).length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-2"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Filter Area:
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveAreaId('')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  !activeAreaId
                    ? 'bg-ubuntu-orange text-white shadow-md'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-ubuntu-orange'
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
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeAreaId === area.id
                        ? 'bg-ubuntu-orange text-white shadow-md'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-ubuntu-orange'
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-soft hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-12 bg-ubuntu-orange/5 rounded-full -mr-10 -mt-10 group-hover:bg-ubuntu-orange/10 transition-colors"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em]">
                    Daily Reports
                  </p>
                  <h3 className="text-4xl font-bold text-ubuntu-coolGrey dark:text-white">
                    {filteredReports.length}
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-ubuntu-orange/10 text-ubuntu-orange shadow-sm transition-transform group-hover:scale-110 duration-300">
                  <ClipboardCheckIcon className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="group p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-soft hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-12 bg-rose-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-rose-500/10 transition-colors"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em]">
                    Critical Findings
                  </p>
                  <h3 className="text-4xl font-bold text-rose-600 dark:text-rose-400">
                    {filteredReports.filter((i) => i.status === 'critical').length}
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 shadow-sm transition-transform group-hover:scale-110 duration-300">
                  <XMarkIcon className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reports Table Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-soft overflow-hidden flex flex-col"
          >
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="relative flex-1 max-w-lg">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-ubuntu-orange transition-colors" />
                <input
                  type="text"
                  placeholder="Search by inspector or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-ubuntu-coolGrey dark:text-white focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Status
                  </span>
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-sm font-bold text-ubuntu-coolGrey dark:text-white focus:outline-none cursor-pointer pr-4 border-none !ring-0 !p-0"
                  >
                    <option className="bg-white dark:bg-slate-900">All Status</option>
                    <option className="bg-white dark:bg-slate-900">Pending</option>
                    <option className="bg-white dark:bg-slate-900">Completed</option>
                    <option className="bg-white dark:bg-slate-900">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {filteredReports.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80">
                      <th className="px-8 py-4">Report Date</th>
                      <th className="px-8 py-4">Inspector</th>
                      <th className="px-8 py-4 text-center">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <span className="font-bold text-ubuntu-coolGrey dark:text-white group-hover:text-ubuntu-orange transition-colors">
                            {new Date(report.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs shadow-sm border border-slate-200 dark:border-white/10">
                                {report.personnel.s1.tender.charAt(0)}
                              </div>
                              <span className="font-bold text-ubuntu-coolGrey dark:text-slate-200">
                                {report.personnel.s1.tender}
                              </span>
                            </div>
                            {report.areaId && (
                              <span className="text-[9px] font-bold text-slate-400 border border-slate-200 w-fit px-2 py-0.5 rounded ml-13 bg-slate-50">
                                {areas.find((a) => a.id === report.areaId)?.name || 'Unknown Area'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border shadow-sm ${
                              report.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : report.status === 'critical'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}
                          >
                            {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ml-auto group-hover:bg-ubuntu-orange group-hover:text-white transition-all duration-300 shadow-sm">
                            <MagnifyingGlassIcon className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
                    <ClipboardCheckIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-ubuntu-coolGrey dark:text-white">
                    No Reports Found
                  </h3>
                  <p className="text-slate-400 mt-2 font-medium text-sm">
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
          className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-soft p-8 flex flex-col"
        >
          <TemplateManager
            groups={currentAreaTemplate as any}
            onAddGroup={() =>
              addGroup({
                areaId: activeAreaId || undefined,
                unit: activeSubUnitId || activeUnitId,
                name: 'New Group',
                sort_order: groups.length + 1,
              })
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
              className="fixed right-0 top-0 h-full w-full max-w-7xl bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-slate-200 dark:border-white/10 font-ubuntu"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-gradient-to-br from-ubuntu-orange to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                    <ClipboardCheckIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-ubuntu-coolGrey dark:text-white tracking-tight">
                      Daily Shift Report Details
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-ubuntu-orange animate-pulse"></span>
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
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/10 shadow-sm group"
                >
                  <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Table Rendering based on Template (Groups > Equipment > CP) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-soft overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-200 dark:border-white/10">
                        <th className="px-6 py-4 w-16 text-center">No.</th>
                        <th className="px-6 py-4 min-w-[250px]">Check Point</th>
                        <th className="px-3 py-4 text-center w-28">Shift 1</th>
                        <th className="px-3 py-4 text-center w-28">Shift 2</th>
                        <th className="px-3 py-4 text-center w-28">Shift 3</th>
                        <th className="px-6 py-4">Abnormalitas Peralatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {templates[currentContextName]?.map((group, gIdx) => (
                        <React.Fragment key={group.id}>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <td
                              colSpan={6}
                              className="px-8 py-4 font-bold text-ubuntu-coolGrey dark:text-slate-200 uppercase tracking-[0.2em] text-[11px]"
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-1.5 h-6 bg-ubuntu-orange rounded-full"></span>
                                {group.name}
                              </div>
                            </td>
                          </tr>
                          {group.equipments.map((eq, eIdx) => (
                            <React.Fragment key={eq.id}>
                              <tr className="bg-white dark:bg-slate-900 group/eq border-b border-slate-100 dark:border-white/5">
                                <td className="px-6 py-4 text-center font-bold text-slate-400 group-hover/eq:text-ubuntu-orange transition-colors">
                                  {eIdx + 1}
                                </td>
                                <td
                                  className="px-6 py-4 font-bold text-ubuntu-coolGrey dark:text-slate-200 group-hover/eq:text-ubuntu-orange transition-colors"
                                  colSpan={5}
                                >
                                  {eq.name}
                                </td>
                              </tr>
                              {eq.checkPoints.map((cp) => (
                                <tr
                                  key={cp.id}
                                  className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 border-b border-slate-50 dark:border-white/5 last:border-0"
                                >
                                  <td className="px-6 py-3"></td>
                                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400 pl-10 font-medium group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">
                                    - {cp.name}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s1 || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s2 || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s3 || '-'}
                                  </td>
                                  <td
                                    className={`px-6 py-3 italic font-medium ${selectedReport.data[cp.id]?.note ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((s) => {
                      const shiftKey = `s${s}` as keyof typeof selectedReport.personnel;
                      const p = selectedReport.personnel[shiftKey];
                      return (
                        <motion.div
                          key={s}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: s * 0.1 }}
                          className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group/card"
                        >
                          <div className="absolute top-0 right-0 p-10 bg-ubuntu-orange/5 rounded-full -mr-8 -mt-8 group-hover/card:bg-ubuntu-orange/10 transition-colors"></div>

                          <p className="text-[10px] font-bold text-ubuntu-warmGrey uppercase mb-6 tracking-[0.2em] text-center relative z-10 w-full border-b border-slate-200 dark:border-white/10 pb-2">
                            SHIFT {s}
                          </p>

                          <div className="w-full space-y-6 relative z-10">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-ubuntu-coolGrey dark:text-white font-bold text-lg mb-2 shadow-sm border border-slate-100 dark:border-white/5">
                                {p.tender ? p.tender.charAt(0) : '?'}
                              </div>
                              <p className="text-sm font-bold text-ubuntu-coolGrey dark:text-white text-center">
                                {p.tender || 'Not Assigned'}
                              </p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                                Tender
                              </p>
                            </div>

                            <div className="flex flex-col items-center relative w-full pt-4 border-t border-slate-200 dark:border-white/5">
                              {/* Karu Name & Verification Badge */}
                              <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-sm font-bold text-ubuntu-coolGrey dark:text-white text-center">
                                  {p.karu || '-'}
                                </p>
                                {selectedReport.approvals[shiftKey] && (
                                  <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>

                              <p className="text-[9px] text-slate-400 uppercase mb-4 tracking-wider">
                                Karu Shift
                              </p>

                              {/* Approval Button Logic */}
                              {!selectedReport.approvals[shiftKey] &&
                                p.karu &&
                                (currentUser?.full_name === p.karu ||
                                currentUser?.username === p.karu ? (
                                  <button
                                    onClick={() => handleApproveShift(selectedReport.id, shiftKey)}
                                    className="w-full py-2.5 bg-gradient-to-r from-ubuntu-orange to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                                  >
                                    <CheckBadgeIcon className="w-4 h-4" />
                                    APPROVE SHIFT
                                  </button>
                                ) : (
                                  <div className="w-full py-2.5 bg-slate-100 dark:bg-slate-900/50 text-slate-400 text-[10px] font-bold rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10 tracking-wide">
                                    Awaiting Approval
                                  </div>
                                ))}

                              {selectedReport.approvals[shiftKey] && (
                                <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-500/20">
                                  <CheckBadgeIcon className="w-4 h-4" />
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

              <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-3.5 bg-ubuntu-coolGrey hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] tracking-widest text-xs uppercase"
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
              className="fixed right-0 top-0 h-full w-full max-w-7xl bg-white dark:bg-slate-900 z-[101] flex flex-col border-l border-slate-200 dark:border-white/10 shadow-2xl"
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
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 z-[101] flex flex-col border-l border-slate-200 dark:border-white/10 shadow-2xl"
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
