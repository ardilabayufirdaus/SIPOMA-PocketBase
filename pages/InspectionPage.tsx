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

const SAMPLE_REPORTS: DailyReport[] = [
  {
    id: 'rep1',
    date: new Date().toISOString(),
    unit: 'Unit of Clinker Production',
    status: 'completed',
    data: {
      cp1: { s1: 'OK', s2: 'OK', s3: 'OK', note: '' },
      cp2: { s1: 'OK', s2: 'OK', s3: 'OK', note: '' },
    },
    personnel: {
      s1: { tender: 'Ardilaba Yufridaus', karu: 'Supervisor A' },
      s2: { tender: 'Tender B', karu: 'Supervisor B' },
      s3: { tender: 'Tender C', karu: 'Supervisor C' },
    },
    approvals: { s1: true, s2: false, s3: false },
  },
];

const UNITS = [
  'Unit of Derivative Product & Supporting',
  'Unit of Cement Production',
  'Unit of Clinker Production',
];

const InspectionPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeUnit, setActiveUnit] = useState(UNITS[2]);
  const [viewMode, setViewMode] = useState<'reports' | 'templates'>('reports');
  const [templates, setTemplates] = useState(INITIAL_TEMPLATE);
  const [reports, setReports] = useState<DailyReport[]>(SAMPLE_REPORTS);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Handlers
  const handleSaveReport = (newReport: DailyReport) => {
    const existingIndex = reports.findIndex((rep) => {
      const repDate = new Date(rep.date).toISOString().split('T')[0];
      const newDate = new Date(newReport.date).toISOString().split('T')[0];
      return rep.unit === newReport.unit && repDate === newDate;
    });

    if (existingIndex !== -1) {
      // Merge logic: Combine new shift data into existing record
      const updatedReports = [...reports];
      const existing = { ...updatedReports[existingIndex] };

      // Deep copy to avoid reference issues
      existing.personnel = { ...existing.personnel };
      existing.data = { ...existing.data };

      // Ensure approvals object exists and preserve it
      existing.approvals = existing.approvals
        ? { ...existing.approvals }
        : { s1: false, s2: false, s3: false };

      // Identify which shifts are provided in the new submission
      const newShifts = (['s1', 's2', 's3'] as const).filter((s) => newReport.personnel[s].tender);

      newShifts.forEach((s) => {
        // Update personnel for the specific shift
        existing.personnel[s] = newReport.personnel[s];

        // Merge measurement data for the specific shift
        Object.keys(newReport.data).forEach((cpId) => {
          if (!existing.data[cpId]) {
            existing.data[cpId] = { s1: '', s2: '', s3: '', note: '' };
          } else {
            existing.data[cpId] = { ...existing.data[cpId] };
          }

          existing.data[cpId][s] = newReport.data[cpId][s];

          // If this shift adds an abnormality note, preserve/update it
          if (newReport.data[cpId].note) {
            existing.data[cpId].note = newReport.data[cpId].note;
          }
        });
      });

      // Recalculate status (if any checkpoint has a note, it's critical)
      const isCritical = Object.values(existing.data).some((d) => d.note);
      existing.status = isCritical ? 'critical' : 'completed';

      updatedReports[existingIndex] = existing;
      setReports(updatedReports);
    } else {
      // New record
      setReports([newReport, ...reports]);
    }
    setIsFormOpen(false);
  };

  const handleApproveShift = (reportId: string, shift: 's1' | 's2' | 's3') => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id === reportId) {
          return {
            ...rep,
            approvals: {
              ...rep.approvals,
              [shift]: true,
            },
          };
        }
        return rep;
      })
    );

    // Update selected report if it's the one being approved
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport((prev: any) => ({
        ...prev,
        approvals: {
          ...prev.approvals,
          [shift]: true,
        },
      }));
    }
  };

  // Filter logic for reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesUnit = item.unit === activeUnit;
      const matchesSearch =
        Object.values(item.personnel).some(
          (p) =>
            p.tender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.karu.toLowerCase().includes(searchTerm.toLowerCase())
        ) || new Date(item.date).toLocaleDateString().includes(searchTerm);
      const matchesStatus =
        filterStatus === 'All Status' || item.status === filterStatus.toLowerCase();
      return matchesUnit && matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus, activeUnit]);

  const stats = useMemo(() => {
    const unitData = reports.filter((i) => i.unit === activeUnit);
    return [
      {
        label: 'Daily Reports',
        value: unitData.length.toString(),
        icon: ClipboardCheckIcon,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        label: 'Critical Findings',
        value: unitData.filter((i) => i.status === 'critical').length.toString(),
        icon: ClipboardCheckIcon, // Use appropriate icon if available
        color: 'text-red-500',
        bg: 'bg-red-500/10',
      },
    ];
  }, [reports, activeUnit]);

  return (
    <div className="min-h-full flex flex-col gap-6 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 dark:text-white"
          >
            Inspection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 mt-1"
          >
            {viewMode === 'reports'
              ? 'Manage daily production shift reports.'
              : 'Configure dynamic report templates (Grup > Alat > Point).'}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => setViewMode(viewMode === 'reports' ? 'templates' : 'reports')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-all shadow-sm ${
              viewMode === 'templates'
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            {viewMode === 'reports' ? 'Template Settings' : 'Back to Reports'}
          </button>

          {viewMode === 'reports' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              New Shift Report
            </button>
          )}
        </motion.div>
      </div>

      {/* Unit Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/5 scrollbar-hide overflow-x-auto">
        {UNITS.map((unit) => (
          <button
            key={unit}
            onClick={() => setActiveUnit(unit)}
            className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeUnit === unit
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {unit}
            {activeUnit === unit && (
              <motion.div
                layoutId="activeUnitTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 shadow-[0_-4px_12px_rgba(79,70,229,0.4)]"
              />
            )}
          </button>
        ))}
      </div>

      {viewMode === 'reports' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (idx + 3) }}
                className="p-6 bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
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
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by inspector or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredReports.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
                      <th className="px-6 py-4">Report Date</th>
                      <th className="px-6 py-4">Inspector</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="group hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {new Date(report.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                              {report.personnel.s1.tender.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {report.personnel.s1.tender}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight border ${
                              report.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : report.status === 'critical'
                                  ? 'bg-red-500 text-white border-red-600'
                                  : 'bg-amber-400 text-slate-900 border-amber-500'
                            }`}
                          >
                            {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <MagnifyingGlassIcon className="w-4 h-4 ml-auto text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-4">
                    <ClipboardCheckIcon className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    No Reports Found
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Start by creating a new shift report.
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
            groups={templates[activeUnit] || []}
            onUpdate={(updatedGroups) =>
              setTemplates({ ...templates, [activeUnit]: updatedGroups })
            }
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[95%] bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-white/10"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Daily Shift Report Details
                  </h3>
                  <p className="text-sm text-slate-500">
                    {activeUnit} - {new Date(selectedReport.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                {/* Table Rendering based on Template (Groups > Equipment > CP) */}
                <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/100">
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 w-12 text-center">
                          No.
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 min-w-[200px]">
                          CHECK POINT
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-24">
                          SHIFT 1
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-24">
                          SHIFT 2
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-24">
                          SHIFT 3
                        </th>
                        <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400">
                          Abnormalitas Peralatan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates[activeUnit]?.map((group, gIdx) => (
                        <React.Fragment key={group.id}>
                          <tr className="bg-slate-50 dark:bg-slate-800/20">
                            <td
                              colSpan={6}
                              className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400 italic"
                            >
                              {group.name}
                            </td>
                          </tr>
                          {group.equipments.map((eq, eIdx) => (
                            <React.Fragment key={eq.id}>
                              <tr className="border-b border-slate-100 dark:border-white/5">
                                <td className="px-4 py-2 text-center font-semibold text-slate-400">
                                  {eIdx + 1}
                                </td>
                                <td
                                  className="px-4 py-2 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-white/5"
                                  colSpan={5}
                                >
                                  {eq.name}
                                </td>
                              </tr>
                              {eq.checkPoints.map((cp) => (
                                <tr
                                  key={cp.id}
                                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                                >
                                  <td className="px-4 py-2"></td>
                                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300 pl-8">
                                    - {cp.name}
                                  </td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s1 || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s2 || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-900 dark:text-white">
                                    {selectedReport.data[cp.id]?.s3 || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-rose-500 font-medium italic">
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
                        <div
                          key={s}
                          className="flex flex-col items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5"
                        >
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-4 tracking-widest text-center">
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
                                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                  >
                                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                                    APPROVE SHIFT
                                  </button>
                                ) : (
                                  <div className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-medium rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10">
                                    Awaiting Approval
                                  </div>
                                ))}

                              {selectedReport.approvals[shiftKey] && (
                                <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
                                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                                  VERIFIED
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold transition-all"
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[95%] bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-white/10"
            >
              <ShiftReportForm
                unit={activeUnit}
                groups={templates[activeUnit] || []}
                existingReports={reports}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveReport}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspectionPage;
