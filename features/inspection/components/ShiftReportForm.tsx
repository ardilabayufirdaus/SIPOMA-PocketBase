import React, { useState } from 'react';
import { motion } from 'framer-motion';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ClipboardCheckIcon from '../../../components/icons/ClipboardCheckIcon';
import { useAuth } from '../../../hooks/useAuth';
import { useUserStore } from '../../../stores/userStore';
import CogIcon from '../../../components/icons/CogIcon';
import ChevronDownIcon from '../../../components/icons/ChevronDownIcon';
import { useEffect } from 'react';
import { InspectionArea } from '../../../services/pocketbase';

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

interface ShiftReportFormProps {
  unit: string;
  unitId?: string;
  areas: InspectionArea[];
  groups: Group[];
  existingReports: DailyReport[];
  onClose: () => void;
  onSave: (report: any) => void;
}

const ShiftReportForm: React.FC<ShiftReportFormProps> = ({
  unit,
  unitId,
  areas,
  groups,
  existingReports,
  onClose,
  onSave,
}) => {
  const { user: currentUser } = useAuth();
  const { users, fetchUsers } = useUserStore();

  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState({
    s1: { tender: '', karu: '' },
    s2: { tender: '', karu: '' },
    s3: { tender: '', karu: '' },
  });

  useEffect(() => {
    fetchUsers(1, 100);
  }, []);

  const filteredAreas = areas.filter((a) => a.unit === unitId);
  const supervisors = users.filter((u) => u.role === 'Supervisor');

  const handleInputChange = (cpId: string, shift: 's1' | 's2' | 's3' | 'note', value: string) => {
    setReportData((prev) => ({
      ...prev,
      [cpId]: {
        ...(prev[cpId] || { s1: '', s2: '', s3: '', note: '' }),
        [shift]: value,
      },
    }));
  };

  const handlePersonnelChange = (
    shift: 's1' | 's2' | 's3',
    type: 'tender' | 'karu',
    value: string
  ) => {
    setPersonnel((prev) => ({
      ...prev,
      [shift]: { ...prev[shift], [type]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicates at shift level
    const existingReport = existingReports.find((rep) => {
      const repDate = new Date(rep.date).toISOString().split('T')[0];
      return rep.unit === unit && repDate === reportDate;
    });

    if (existingReport) {
      // Determine which shifts are being submitted in this form
      const submittedShifts = (['s1', 's2', 's3'] as const).filter((s) => personnel[s].tender);

      if (submittedShifts.length === 0) {
        setError('Silakan isi minimal satu shift (Tender) sebelum menyimpan.');
        return;
      }

      if (!selectedAreaId) {
        setError('Silakan pilih Area kerja terlebih dahulu.');
        return;
      }

      // Check for conflicts
      const conflictingShifts = submittedShifts.filter((s) => existingReport.personnel[s].tender);

      if (conflictingShifts.length > 0) {
        const shiftNames = conflictingShifts.map((s) => s.toUpperCase()).join(', ');
        setError(
          `Shift ${shiftNames} untuk unit ${unit} pada tanggal ${reportDate} sudah terisi oleh personil lain!`
        );
        return;
      }
    }

    onSave({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(reportDate).toISOString(),
      unit,
      areaId: selectedAreaId,
      status: Object.values(reportData).some((d) => d.note) ? 'critical' : 'completed',
      data: reportData,
      personnel: personnel,
      approvals: { s1: false, s2: false, s3: false },
    });
  };

  return (
    <div className="flex flex-col h-full bg-inspection-50/10 dark:bg-inspection-950/20 backdrop-blur-3xl font-sans">
      <div className="p-8 border-b border-inspection-100 dark:border-inspection-800/50 flex items-center justify-between bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-gradient-to-br from-inspection-700 to-inspection-500 rounded-2xl text-white shadow-xl shadow-inspection-500/20">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-inspection-800 dark:text-white tracking-tight">
              Daily Shift Report
            </h3>
            <p className="text-[11px] font-black text-inspection-500 dark:text-inspection-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-inspection-500 animate-pulse"></span>
              Unit: {unit}
            </p>
          </div>

          <div className="ml-8 flex items-center gap-4 bg-white/50 dark:bg-inspection-800/50 px-6 py-2.5 rounded-2xl border border-inspection-200 dark:border-inspection-700/50 shadow-sm backdrop-blur-sm">
            <label className="text-[10px] font-black text-inspection-500 uppercase tracking-widest">
              Work Area
            </label>
            <div className="h-5 w-px bg-inspection-200 dark:bg-inspection-700 mx-1"></div>
            <select
              required
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-inspection-800 dark:text-inspection-100 focus:ring-0 outline-none cursor-pointer p-0 pr-8"
            >
              <option value="" className="bg-white dark:bg-inspection-900">
                Select Area...
              </option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id} className="bg-white dark:bg-inspection-900">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-8 hidden sm:flex items-center gap-4 bg-white/50 dark:bg-inspection-800/50 px-6 py-2.5 rounded-2xl border border-inspection-200 dark:border-inspection-700/50 shadow-sm backdrop-blur-sm">
            <label className="text-[10px] font-black text-inspection-400 uppercase tracking-widest">
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-inspection-600 dark:text-inspection-400 focus:ring-0 outline-none cursor-pointer p-0"
            />
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-3 rounded-2xl bg-white/50 dark:bg-inspection-800/50 text-inspection-500 hover:text-inspection-800 dark:hover:text-inspection-100 hover:bg-white dark:hover:bg-inspection-700 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm group"
        >
          <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-8 mt-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-between backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <XMarkIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-black text-xs bg-rose-500/10 px-4 py-2 rounded-xl transition-all"
          >
            Sembunyikan
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
        {/* Personnel Section */}
        <div className="p-8 border-b border-inspection-100/50 dark:border-inspection-800/30 bg-inspection-50/20 dark:bg-inspection-900/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((s) => {
              const shiftKey = `s${s}` as 's1' | 's2' | 's3';
              const isAssigned =
                personnel[shiftKey].tender === (currentUser?.full_name || currentUser?.username);

              return (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: s * 0.1 }}
                  className="group space-y-5 p-6 bg-white/60 dark:bg-inspection-900/40 rounded-[2.5rem] border border-inspection-100 dark:border-inspection-800/50 shadow-xl shadow-inspection-900/5 hover:-translate-y-1 transition-all duration-500 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-12 bg-inspection-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-inspection-500/10 transition-colors"></div>

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black text-inspection-500 dark:text-inspection-400 uppercase tracking-[0.2em]">
                      Shift {s}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handlePersonnelChange(
                          shiftKey,
                          'tender',
                          isAssigned ? '' : currentUser?.full_name || currentUser?.username || ''
                        )
                      }
                      className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
                        isAssigned
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-inspection-50 dark:bg-inspection-800/50 text-inspection-600 dark:text-inspection-300 hover:bg-gradient-to-r hover:from-inspection-700 hover:to-inspection-500 hover:text-white hover:shadow-xl hover:shadow-inspection-500/20'
                      }`}
                    >
                      {isAssigned ? '✓ ASSIGNED' : '+ TAKE SHIFT'}
                    </button>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-[9px] font-black text-inspection-400 uppercase tracking-[0.2em] pl-1 mb-2">
                        Operational Tender
                      </label>
                      <div className="w-full px-5 py-3.5 bg-inspection-50/50 dark:bg-inspection-950/40 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-sm font-bold text-inspection-800 dark:text-inspection-100 flex items-center shadow-inner">
                        {personnel[shiftKey].tender ? (
                          <span className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-inspection-500 animate-pulse"></span>
                            {personnel[shiftKey].tender}
                          </span>
                        ) : (
                          <span className="text-inspection-400 font-bold italic opacity-40">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-inspection-400 uppercase tracking-[0.2em] pl-1 mb-2">
                        Karu Shift
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={personnel[shiftKey].karu}
                          onChange={(e) => handlePersonnelChange(shiftKey, 'karu', e.target.value)}
                          className="w-full px-5 py-3.5 bg-inspection-50/50 dark:bg-inspection-950/40 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-sm font-bold text-inspection-800 dark:text-inspection-100 outline-none focus:ring-4 ring-inspection-500/10 focus:border-inspection-500/50 transition-all appearance-none shadow-inner"
                        >
                          <option value="" className="bg-white dark:bg-inspection-900">
                            Select Supervisor
                          </option>
                          {supervisors.map((u) => (
                            <option
                              key={u.id}
                              value={u.full_name || u.name || u.username}
                              className="bg-white dark:bg-inspection-900"
                            >
                              {u.full_name || u.name || u.username}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-inspection-400">
                          <ChevronDownIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-inspection-200 dark:scrollbar-thumb-inspection-800 scrollbar-track-transparent">
          <div className="bg-white/40 dark:bg-inspection-950/40 backdrop-blur-md rounded-[3rem] border border-inspection-100 dark:border-inspection-800/50 shadow-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-inspection-50/50 dark:bg-inspection-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-inspection-500 dark:text-inspection-400 border-b border-inspection-100 dark:border-inspection-800/50">
                  <th className="px-6 py-5 w-16 text-center">No.</th>
                  <th className="px-6 py-5 min-w-[250px]">Check Point</th>
                  <th className="px-3 py-5 text-center w-28">Shift 1</th>
                  <th className="px-3 py-5 text-center w-28">Shift 2</th>
                  <th className="px-3 py-5 text-center w-28">Shift 3</th>
                  <th className="px-6 py-5">Abnormalitas Peralatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inspection-50/50 dark:divide-inspection-900/10">
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <tr className="bg-gradient-to-r from-inspection-500/10 via-transparent to-transparent">
                      <td
                        colSpan={6}
                        className="px-8 py-4 font-black text-inspection-700 dark:text-inspection-400 uppercase tracking-[0.2em] text-[11px]"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-1.5 h-6 bg-inspection-500 rounded-full"></span>
                          {group.name}
                        </div>
                      </td>
                    </tr>
                    {group.equipments.map((eq, eIdx) => (
                      <React.Fragment key={eq.id}>
                        <tr className="bg-inspection-50/10 dark:bg-inspection-900/5 group/eq">
                          <td className="px-6 py-4 text-center font-black text-inspection-400 group-hover/eq:text-inspection-700 transition-colors">
                            {eIdx + 1}
                          </td>
                          <td
                            className="px-6 py-4 font-black text-inspection-800 dark:text-inspection-100 group-hover/eq:text-inspection-600 dark:group-hover/eq:text-inspection-400 transition-colors"
                            colSpan={5}
                          >
                            {eq.name}
                          </td>
                        </tr>
                        {eq.checkPoints.map((cp) => (
                          <tr
                            key={cp.id}
                            className="group/row hover:bg-inspection-50/50 dark:hover:bg-inspection-900/20 transition-all duration-200"
                          >
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-inspection-600 dark:text-inspection-400 pl-12 font-bold group-hover/row:text-inspection-900 dark:group-hover/row:text-white transition-colors">
                              - {cp.name}
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-inspection-50/50 dark:bg-inspection-950/40 border border-inspection-100 dark:border-inspection-800/50 rounded-xl focus:ring-4 ring-inspection-500/10 focus:bg-white dark:focus:bg-inspection-900 focus:border-inspection-500/50 outline-none text-xs font-black transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
                                value={reportData[cp.id]?.s1 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's1', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-inspection-50/50 dark:bg-inspection-950/40 border border-inspection-100 dark:border-inspection-800/50 rounded-xl focus:ring-4 ring-inspection-500/10 focus:bg-white dark:focus:bg-inspection-900 focus:border-inspection-500/50 outline-none text-xs font-black transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
                                value={reportData[cp.id]?.s2 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's2', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2.5 text-center bg-inspection-50/50 dark:bg-inspection-950/40 border border-inspection-100 dark:border-inspection-800/50 rounded-xl focus:ring-4 ring-inspection-500/10 focus:bg-white dark:focus:bg-inspection-900 focus:border-inspection-500/50 outline-none text-xs font-black transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
                                value={reportData[cp.id]?.s3 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's3', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                placeholder="Catat kelainan..."
                                className={`w-full px-5 py-2.5 bg-inspection-50/50 dark:bg-inspection-950/40 border rounded-xl focus:ring-4 outline-none text-xs transition-all shadow-inner ${
                                  reportData[cp.id]?.note
                                    ? 'border-rose-500/50 text-rose-600 ring-rose-500/10 font-black bg-rose-500/5 dark:bg-rose-500/10'
                                    : 'border-inspection-100 dark:border-inspection-800/50 text-inspection-500 dark:text-inspection-400 italic focus:ring-inspection-500/10 focus:border-inspection-500/50 group-hover/row:bg-white/80 dark:group-hover/row:bg-inspection-800/80 font-bold'
                                }`}
                                value={reportData[cp.id]?.note || ''}
                                onChange={(e) => handleInputChange(cp.id, 'note', e.target.value)}
                              />
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
        </div>

        <div className="p-8 border-t border-inspection-100 dark:border-inspection-800/50 flex gap-8 bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 bg-white/50 dark:bg-inspection-800/50 text-inspection-600 dark:text-inspection-300 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-inspection-700 hover:text-inspection-800 dark:hover:text-inspection-100 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-5 bg-gradient-to-r from-inspection-700 to-inspection-500 hover:from-inspection-600 hover:to-inspection-400 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-inspection-500/30 hover:shadow-inspection-500/50 active:scale-[0.98]"
          >
            Submit Daily Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftReportForm;
