import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import ArrowPathIcon from '../components/icons/ArrowPathRoundedSquareIcon';
import FunnelIcon from '../components/icons/Bars4Icon';
import MagnifyingGlassIcon from '../components/icons/DocumentMagnifyingGlassIcon';
import PlusIcon from '../components/icons/PlusIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import TemplateManager from '../features/inspection/components/TemplateManager';
import ShiftReportForm from '../features/inspection/components/ShiftReportForm';
import CheckBadgeIcon from '../components/icons/CheckBadgeIcon';
import { useAuth } from '../hooks/useAuth';
import { useInspectionData } from '../hooks/useInspectionData';
import { usePermissions } from '../utils/permissions';
import UnitManager from '../features/inspection/components/UnitManager';
import CogIcon from '../components/icons/CogIcon';
import { useEffect } from 'react';
import { InspectionReport } from '../services/pocketbase';
import RealtimeIndicator from '../components/ui/RealtimeIndicator';

// Local Interface for UI development
import { DailyReport } from '../types';

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
  const permissionChecker = usePermissions(currentUser);
  const canWrite = permissionChecker.hasPermission('inspection', 'WRITE');
  const {
    inspections: reportsFromDb,
    units,
    areas,
    groups,
    equipments,
    checkpoints,
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
          unitName: units.find((u) => u.id === row.unit)?.name || 'Unknown Unit',
          unitId: row.unit,
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
  }, [reportsFromDb, units]);

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
    [activeUnit, activeSubUnit]
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
    if (!canWrite) {
      alert('Anda tidak memiliki izin WRITE untuk membuat/mengubah shift report.');
      return;
    }
    const reportDate = new Date(newReportData.date).toISOString().split('T')[0];

    // Find if report already exists for this unit and date in DB records
    // Find if report already exists for this unit and date in DB records
    const existing = reportsFromDb.find((r) => {
      const rDate = new Date(r.date).toISOString().split('T')[0];
      return (
        r.unit === newReportData.unitId && rDate === reportDate && r.area === newReportData.areaId
      );
    });

    // Map UI structure (DailyReport) to PB structure (InspectionReport)
    const pbData = {
      date: newReportData.date,
      unit: newReportData.unitId, // Use ID relation, not Name
      area: newReportData.areaId,
      status: newReportData.status,
      s1_tender: newReportData.personnel?.s1?.tender || '',
      s1_karu: newReportData.personnel?.s1?.karu || '',
      s1_approved: newReportData.approvals?.s1 ?? false,
      s2_tender: newReportData.personnel?.s2?.tender || '',
      s2_karu: newReportData.personnel?.s2?.karu || '',
      s2_approved: newReportData.approvals?.s2 ?? false,
      s3_tender: newReportData.personnel?.s3?.tender || '',
      s3_karu: newReportData.personnel?.s3?.karu || '',
      s3_approved: newReportData.approvals?.s3 ?? false,
      data: newReportData.data,
    };

    try {
      const existing = reportsFromDb.find(
        (r) =>
          r.date === pbData.date &&
          r.unit === pbData.unit &&
          (pbData.area ? r.area === pbData.area : true)
      );

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
        await updateInspection(existing.id, updatedPbData as InspectionReport);
      } else {
        await addInspection(pbData as InspectionReport);
      }
      refreshInspections();
    } catch (err) {
      console.error('Save failed:', err);
    }

    setIsFormOpen(false);
  };

  const handleApproveShift = async (reportId: string, shift: 's1' | 's2' | 's3') => {
    if (!canWrite) {
      alert('Anda tidak memiliki izin WRITE untuk menyetujui shift report.');
      return;
    }
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
        report.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reportDateLabel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'All Status' || report.status === filterStatus.toLowerCase();
      const matchesUnit = report.unitId === (activeSubUnitId || activeUnitId);
      const matchesArea = !activeAreaId || report.areaId === activeAreaId;

      return matchesSearch && matchesStatus && matchesUnit && matchesArea;
    });
  }, [reports, searchTerm, filterStatus, activeUnitId, activeSubUnitId, activeAreaId, units]);

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
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Hero Header Section - 20 Aturan Wajib */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-slate-900 to-secondary-950 rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 text-white w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ClipboardCheckIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Plant Operations
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  Inspection Logs
                </span>
                <RealtimeIndicator isConnected={true} lastUpdate={new Date()} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                Shift Equipment Inspection
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                {viewMode === 'reports'
                  ? 'Monitoring laporan patrol check peralatan operasional pabrik per shift harian'
                  : 'Konfigurasi template checklist inspeksi dinamis (Grup > Alat > Titik Periksa)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'reports' ? 'templates' : 'reports')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm min-h-[36px] ${
                viewMode === 'templates'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              <span>{viewMode === 'reports' ? 'Pengaturan Template' : 'Kembali ke Laporan'}</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsUnitManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-semibold shadow-sm transition-all min-h-[36px]"
              >
                <CogIcon className="w-3.5 h-3.5" />
                <span>Kelola Unit</span>
              </button>
            )}

            {canWrite && viewMode === 'reports' && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all min-h-[36px]"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Laporan Shift Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unit Selector Tabs - COP Style Compact */}
      <div className="flex flex-col gap-2.5">
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar w-fit max-w-full">
          {mainUnits.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => {
                setActiveUnitId(unit.id);
                setActiveSubUnitId(null);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold transition-all relative whitespace-nowrap rounded-lg ${
                activeUnitId === unit.id
                  ? 'text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="relative z-10">{unit.name}</span>
              {activeUnitId === unit.id && (
                <motion.div
                  layoutId="activeUnitTab"
                  className="absolute inset-0 bg-primary-600 shadow-xs rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Sub-Unit Selector Tabs (Dynamic) */}
        {subUnitsOfActive.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex bg-white/70 dark:bg-slate-850 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSubUnitId(null)}
                className={`px-3 py-1 text-[11px] font-semibold transition-all relative rounded-md whitespace-nowrap ${
                  activeSubUnitId === null
                    ? 'text-white font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span className="relative z-10">Main Overview</span>
                {activeSubUnitId === null && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute inset-0 bg-slate-700 rounded-md shadow-xs"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>

              {subUnitsOfActive.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubUnitId(sub.id)}
                  className={`px-3 py-1 text-[11px] font-semibold transition-all relative rounded-md whitespace-nowrap ${
                    activeSubUnitId === sub.id
                      ? 'text-white font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <span className="relative z-10">{sub.name}</span>
                  {activeSubUnitId === sub.id && (
                    <motion.div
                      layoutId="activeSubTab"
                      className="absolute inset-0 bg-slate-700 rounded-md shadow-xs"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Work Area Selector (Filter Area) */}
        {areas.filter((a) => a.unit === (activeSubUnitId || activeUnitId)).length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Area:
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setActiveAreaId('')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  !activeAreaId
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600'
                }`}
              >
                SEMUA
              </button>
              {areas
                .filter((a) => a.unit === (activeSubUnitId || activeUnitId))
                .map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setActiveAreaId(area.id)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all whitespace-nowrap ${
                      activeAreaId === area.id
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600'
                    }`}
                  >
                    {area.name.toUpperCase()}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'reports' ? (
        <>
          {/* Stats Cards - Compact COP Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {stats[0].label}
                </p>
                <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white mt-0.5">
                  {stats[0].value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${stats[0].bg} ${stats[0].color}`}>
                {React.createElement(stats[0].icon, { className: 'w-5 h-5' })}
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                  {stats[1].label}
                </p>
                <h3 className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                  {stats[1].value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${stats[1].bg} ${stats[1].color}`}>
                {React.createElement(stats[1].icon, { className: 'w-5 h-5' })}
              </div>
            </div>
          </div>

          {/* Reports Table Section - Sesuai COP Analysis Precision */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850/50">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan pelapor atau tanggal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
                >
                  <option value="All Status">Semua Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto scroll-smooth">
              {filteredReports.length > 0 ? (
                <table className="min-w-full text-xs border-collapse text-left" role="table">
                  <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20 border-b border-slate-600 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3.5">Tanggal Laporan</th>
                      <th className="py-2.5 px-3.5">Pelapor Shift 1</th>
                      <th className="py-2.5 px-3.5 text-center">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-2 px-3.5 whitespace-nowrap font-mono text-xs">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {new Date(report.date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                              {report.personnel.s1.tender.charAt(0) || '-'}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {report.personnel.s1.tender || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              report.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : report.status === 'critical'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg px-2.5 py-1 text-xs transition-all shadow-xs"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 px-4 text-center text-xs text-slate-400">
                  Belum ada laporan inspeksi shift untuk {currentContextName}.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col"
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
            canWrite={canWrite}
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
              className="fixed right-0 top-0 h-full w-full max-w-7xl bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-slate-200 dark:border-white/10 font-sans"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                    <ClipboardCheckIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                      Daily Shift Report Details
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
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
                      <tr className="bg-slate-600 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-[0.2em] text-white border-b border-slate-700">
                        <th className="px-6 py-4 w-16 text-center">No.</th>
                        <th className="px-6 py-4 min-w-[250px]">Check Point</th>
                        <th className="px-3 py-4 text-center w-28">Shift 1</th>
                        <th className="px-3 py-4 text-center w-28">Shift 2</th>
                        <th className="px-3 py-4 text-center w-28">Shift 3</th>
                        <th className="px-6 py-4">Abnormalitas Peralatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {templates[currentContextName]?.map((group) => (
                        <React.Fragment key={group.id}>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <td
                              colSpan={6}
                              className="px-8 py-4 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[11px]"
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                                {group.name}
                              </div>
                            </td>
                          </tr>
                          {group.equipments.map((eq, eIdx) => (
                            <React.Fragment key={eq.id}>
                              <tr className="bg-white dark:bg-slate-900 group/eq border-b border-slate-100 dark:border-white/5">
                                <td className="px-6 py-4 text-center font-bold text-slate-400 group-hover/eq:text-primary-600 transition-colors">
                                  {eIdx + 1}
                                </td>
                                <td
                                  className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 group-hover/eq:text-primary-600 transition-colors"
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
                          <div className="absolute top-0 right-0 p-10 bg-primary-600/5 rounded-full -mr-8 -mt-8 group-hover/card:bg-primary-600/10 transition-colors"></div>

                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 tracking-[0.2em] text-center relative z-10 w-full border-b border-slate-200 dark:border-white/10 pb-2">
                            SHIFT {s}
                          </p>

                          <div className="w-full space-y-6 relative z-10">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mb-2 shadow-sm border border-slate-100 dark:border-white/5">
                                {p.tender ? p.tender.charAt(0) : '?'}
                              </div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white text-center">
                                {p.tender || 'Not Assigned'}
                              </p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                                Tender
                              </p>
                            </div>

                            <div className="flex flex-col items-center relative w-full pt-4 border-t border-slate-200 dark:border-white/5">
                              {/* Karu Name & Verification Badge */}
                              <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-white text-center">
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
                                    className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
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
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] tracking-widest text-xs uppercase"
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
                unit={activeSubUnit || activeUnit}
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
