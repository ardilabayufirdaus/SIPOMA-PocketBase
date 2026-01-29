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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 font-sans">
      <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg text-white">
            <ClipboardCheckIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Daily Shift Report: {unit}
          </h3>
          <div className="ml-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Report Date:
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 outline-none cursor-pointer"
            />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all font-bold"
        >
          <XMarkIcon className="w-5 h-5" />
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
        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((s) => {
              const shiftKey = `s${s}` as 's1' | 's2' | 's3';
              const isAssigned =
                personnel[shiftKey].tender === (currentUser?.full_name || currentUser?.username);

              return (
                <div
                  key={s}
                  className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
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
                      className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${
                        isAssigned
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-500 hover:text-white'
                      }`}
                    >
                      {isAssigned ? 'Assigned to Me' : 'Take This Shift'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                      Tender
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 h-8 flex items-center overflow-hidden">
                      {personnel[shiftKey].tender || (
                        <span className="text-slate-400 font-normal italic">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                      Karu Shift
                    </label>
                    <select
                      required
                      value={personnel[shiftKey].karu}
                      onChange={(e) => handlePersonnelChange(shiftKey, 'karu', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 ring-indigo-500/30 transition-all appearance-none"
                    >
                      <option value="">Select Supervisor</option>
                      {supervisors.map((u) => (
                        <option key={u.id} value={u.full_name || u.name || u.username}>
                          {u.full_name || u.name || u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 w-12 text-center">
                    No.
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 min-w-[150px]">
                    CHECK POINT
                  </th>
                  <th className="px-2 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-20">
                    S1
                  </th>
                  <th className="px-2 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-20">
                    S2
                  </th>
                  <th className="px-2 py-3 font-bold text-slate-600 dark:text-slate-400 text-center w-20">
                    S3
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400">
                    ABNORMALITAS
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td
                        colSpan={6}
                        className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400 italic bg-indigo-50/30 dark:bg-indigo-500/5"
                      >
                        {group.name}
                      </td>
                    </tr>
                    {group.equipments.map((eq, eIdx) => (
                      <React.Fragment key={eq.id}>
                        <tr className="border-b border-slate-100 dark:border-white/5">
                          <td className="px-4 py-2 text-center font-bold text-slate-400">
                            {eIdx + 1}
                          </td>
                          <td
                            className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/20 dark:bg-white/5"
                            colSpan={5}
                          >
                            {eq.name}
                          </td>
                        </tr>
                        {eq.checkPoints.map((cp) => (
                          <tr key={cp.id} className="border-b border-slate-50 dark:border-white/5">
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400 pl-6">
                              - {cp.name}
                            </td>
                            <td className="px-1 py-1">
                              <input
                                placeholder="OK/Nilai"
                                className="w-full px-1 py-1.5 text-center bg-transparent border border-slate-200 dark:border-white/5 rounded focus:ring-1 ring-indigo-500 outline-none text-[10px] sm:text-xs font-bold"
                                value={reportData[cp.id]?.s1 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's1', e.target.value)}
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                placeholder="OK/Nilai"
                                className="w-full px-1 py-1.5 text-center bg-transparent border border-slate-200 dark:border-white/5 rounded focus:ring-1 ring-indigo-500 outline-none text-[10px] sm:text-xs font-bold"
                                value={reportData[cp.id]?.s2 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's2', e.target.value)}
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                placeholder="OK/Nilai"
                                className="w-full px-1 py-1.5 text-center bg-transparent border border-slate-200 dark:border-white/5 rounded focus:ring-1 ring-indigo-500 outline-none text-[10px] sm:text-xs font-bold"
                                value={reportData[cp.id]?.s3 || ''}
                                onChange={(e) => handleInputChange(cp.id, 's3', e.target.value)}
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                placeholder="Catat kelainan..."
                                className="w-full px-2 py-1.5 bg-transparent border border-slate-200 dark:border-white/5 rounded focus:ring-1 ring-rose-500 outline-none text-[10px] sm:text-xs italic text-rose-500 font-medium"
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

        <div className="p-6 border-t border-slate-200 dark:border-white/5 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
          >
            Submit Daily Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShiftReportForm;
