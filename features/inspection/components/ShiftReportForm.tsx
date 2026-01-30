import React, { useState } from 'react';
import { motion } from 'framer-motion';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ClipboardCheckIcon from '../../../components/icons/ClipboardCheckIcon';
import { useAuth } from '../../../hooks/useAuth';
import { useUserStore } from '../../../stores/userStore';
import { useEffect } from 'react';

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

interface ShiftReportFormProps {
  unit: string;
  groups: Group[];
  existingReports: DailyReport[];
  onClose: () => void;
  onSave: (report: any) => void;
}

const ShiftReportForm: React.FC<ShiftReportFormProps> = ({
  unit,
  groups,
  existingReports,
  onClose,
  onSave,
}) => {
  const { user: currentUser } = useAuth();
  const { users, fetchUsers } = useUserStore();

  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState({
    s1: { tender: '', karu: '' },
    s2: { tender: '', karu: '' },
    s3: { tender: '', karu: '' },
  });

  useEffect(() => {
    fetchUsers(1, 100);
  }, []);

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
      status: Object.values(reportData).some((d) => d.note) ? 'critical' : 'completed',
      data: reportData,
      personnel: personnel,
      approvals: { s1: false, s2: false, s3: false },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-2xl font-sans">
      <div className="p-6 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <ClipboardCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daily Shift Report
            </h3>
            <p className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Unit: {unit}
            </p>
          </div>
          <div className="ml-6 hidden sm:flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 outline-none cursor-pointer p-0"
            />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-white/10 shadow-sm group"
        >
          <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
              <XMarkIcon className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-600 font-bold text-xs bg-red-500/10 px-3 py-1 rounded-lg"
          >
            Sembunyikan
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
        {/* Personnel Section */}
        <div className="p-8 border-b border-slate-100/50 dark:border-white/5 bg-slate-50/30 dark:bg-white/2">
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
                  className="group space-y-4 p-5 bg-white/60 dark:bg-slate-800/40 rounded-[2rem] border border-slate-200/50 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 bg-indigo-500/5 rounded-full -mr-6 -mt-6 group-hover:bg-indigo-500/10 transition-colors"></div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">
                        Shift {s}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handlePersonnelChange(
                          shiftKey,
                          'tender',
                          isAssigned ? '' : currentUser?.full_name || currentUser?.username || ''
                        )
                      }
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                        isAssigned
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20'
                      }`}
                    >
                      {isAssigned ? '✓ Assigned' : '+ Take Shift'}
                    </button>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5">
                        Operational Tender
                      </label>
                      <div className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 h-10 flex items-center shadow-inner">
                        {personnel[shiftKey].tender ? (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {personnel[shiftKey].tender}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic opacity-50">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5">
                        Karu Shift
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={personnel[shiftKey].karu}
                          onChange={(e) => handlePersonnelChange(shiftKey, 'karu', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500/50 transition-all appearance-none shadow-inner"
                        >
                          <option value="">Select Supervisor</option>
                          {supervisors.map((u) => (
                            <option
                              key={u.id}
                              value={u.full_name || u.name || u.username}
                              className="bg-white dark:bg-slate-900"
                            >
                              {u.full_name || u.name || u.username}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 shadow-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
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
                {groups.map((group) => (
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
                            <td className="px-2 py-2">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2 text-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-xl focus:ring-2 ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 outline-none text-xs font-bold transition-all shadow-inner"
                                value={reportData[cp.id]?.s1 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's1', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2 text-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-xl focus:ring-2 ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 outline-none text-xs font-bold transition-all shadow-inner"
                                value={reportData[cp.id]?.s2 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's2', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                placeholder="Status"
                                className="w-full px-3 py-2 text-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-xl focus:ring-2 ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 outline-none text-xs font-bold transition-all shadow-inner"
                                value={reportData[cp.id]?.s3 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's3', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                placeholder="Catat kelainan..."
                                className={`w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-950/40 border rounded-xl focus:ring-2 outline-none text-xs transition-all shadow-inner ${
                                  reportData[cp.id]?.note
                                    ? 'border-rose-500/50 text-rose-500 ring-rose-500/20 font-bold bg-rose-50/30 dark:bg-rose-500/5'
                                    : 'border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 italic focus:ring-indigo-500/20 focus:border-indigo-500/50 group-hover/row:bg-white/80 dark:group-hover/row:bg-slate-800/80'
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

        <div className="p-8 border-t border-slate-200/50 dark:border-white/10 flex gap-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200/50 dark:border-white/10 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-2xl font-extrabold transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] tracking-wide"
          >
            Submit Daily Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftReportForm;
